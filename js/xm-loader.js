import { Project } from './project.js'
import { Sample } from './sample.js'
import { Step } from './step.js'
import { toHex } from './utils.js'

/** @param {ArrayBuffer} data */
export async function loadXM(data, ctx) {
  // Read the XM header
  const header = new DataView(data, 0, 80)
  const pattCount = header.getUint16(70, true)
  const headerSize = header.getUint32(60, true)
  const trackCount = header.getUint16(68, true)
  const instCount = header.getUint16(72, true)
  console.log('trackCount: ', trackCount)

  const prj = new Project(trackCount)
  const name = String.fromCharCode(...new Uint8Array(data, 17, 20))
  prj.name = name.replace(/\0/g, '')
  console.log('LOADING module name:', prj.name)

  // Offset past the pattern data to the start of the instrument data
  let instStartOffset = 0

  // Base offset past the header to the start of the pattern data
  let baseOffset = headerSize + 60

  // Read patterns
  let pattOffset = 0
  for (let p = 0; p < pattCount; p++) {
    console.log(`--- PATTERN ${p}`)
    const pattHeader = new DataView(data, baseOffset + pattOffset, 9)
    const pattHeadLen = pattHeader.getUint32(0, true)
    const pattLen = pattHeader.getUint16(5, true)
    const pattDataSize = pattHeader.getUint16(7, true)
    instStartOffset += pattHeadLen + pattDataSize

    prj.patterns[p].length = pattLen
    prj.patterns[p].number = p

    // Read pattern data
    const pattData = new DataView(data, baseOffset + pattOffset + 9, pattDataSize)

    // Read all bytes in pattern data
    let stepIndex = 0
    let trackIndex = 0
    for (let byteIndex = 0; byteIndex < pattDataSize; byteIndex++) {
      const byte = pattData.getUint8(byteIndex)

      let jump = 0
      // Read compressed note data, if MSB is set
      if (byte >> 7 === 1) {
        let noteByte = 0
        let instByte = 0
        let volByte = 0
        if ((byte & 1) === 1) {
          noteByte = pattData.getUint8(byteIndex + 1)
          jump++
        }
        if ((byte & 2) === 2) {
          instByte = pattData.getUint8(byteIndex + 1 + jump)
          jump++
        }
        if ((byte & 4) === 4) {
          volByte = pattData.getUint8(byteIndex + 1 + jump)
          jump++
        }
        if ((byte & 8) === 8) {
          jump++
        }
        if ((byte & 16) === 16) {
          jump++
        }
        byteIndex += jump

        if (jump > 0) {
          // Volume column is complex, and has multiple commands
          let stepVol = null

          if (volByte >= 16 && volByte <= 80) {
            // This simple volume set command
            stepVol = (volByte - 16) / 64.0 // Convert to 0-1 range
          }

          const step = new Step()
          if (noteByte > 0 && noteByte != 97) step.setNote(noteByte + 11)
          if (noteByte == 97) step.setNoteOff()
          if (instByte > 0) step.setInst(instByte)
          if (stepVol != null) step.setVol(stepVol)

          prj.patterns[p].steps[trackIndex][stepIndex] = step
        }
      } else {
        console.log('WARNING: uncompressed note data skipped: ', byte.toString(2).padStart(8, '0'))
      }

      // Move to next step in pattern, across tracks and rows
      trackIndex++
      if (trackIndex >= trackCount) {
        stepIndex++
        trackIndex = 0
      }
    }

    // Jump to next block of pattern data
    pattOffset += pattHeadLen + pattDataSize
  }

  // Read instruments
  let instOffset = 0
  for (let i = 0; i < instCount; i++) {
    // Read first 29 bytes of instrument header, when 0 samples this is all we need
    let instHeader = new DataView(data, baseOffset + instStartOffset + instOffset, 29)
    const instHeadSize = instHeader.getUint32(0, true)
    let instSampCount = instHeader.getUint16(27, true)
    const instName = String.fromCharCode(...new Uint8Array(instHeader.buffer, instHeader.byteOffset + 4, 22))
    const instNameClean = instName.replace(/\0/g, '')
    console.log(`--- INSTRUMENT ${i}`)
    console.log(` name:'${instNameClean}' instHeadSize:${instHeadSize}  samples:${instSampCount}`)

    prj.instruments[i].name = instNameClean

    if (instSampCount == 0) {
      console.log(' instrument has no samples, skipping')
      instOffset += instHeadSize
      continue
    }

    //instSampCount = 1 // HACK: TODO: this is a hack to only load 1 sample per instrument

    // We have 1 or more samples
    // Read rest of instrument header, resizes the data view
    instHeader = new DataView(data, headerSize + 60 + instStartOffset + instOffset, instHeadSize)
    const sampleHeadSize = instHeader.getUint32(29, true)

    let sampleLenTotal = 0
    for (let s = 0; s < instSampCount; s++) {
      console.log(` --- SAMPLE ${s}`)
      const sampleHead = new DataView(data, baseOffset + instStartOffset + instOffset + instHeadSize + s * sampleHeadSize, sampleHeadSize)
      const sampleDataLen = sampleHead.getUint32(0, true)
      const sampleVolume = sampleHead.getUint8(12)
      const samplePan = sampleHead.getUint8(15)
      const sampleDataType = sampleHead.getUint8(17)
      const sampleType = sampleHead.getUint8(14)
      const sampleIs16bit = (sampleType & 16) === 16
      const sampleName = String.fromCharCode(...new Uint8Array(sampleHead.buffer, sampleHead.byteOffset + 18, 22))
      const sampleNameClean = sampleName.replace(/\0/g, '')
      if (sampleDataType != 0) {
        console.log(`WARNING! Sample is not type 0, ADPCM not supported!`)
        continue
      }

      // get bit 4 from sampleType

      console.log(`  sampleName: ${toHex(sampleNameClean)} 16bit:${sampleIs16bit}`)

      // Read sample data
      try {
        const sampArray = new Uint8Array(
          data,
          baseOffset + instStartOffset + instOffset + instHeadSize + instSampCount * sampleHeadSize,
          sampleDataLen
        )

        const sample = new Sample(s, sampleNameClean)
        const audioBuffer = await ctx.createBuffer(1, sampleDataLen, 22050)
        const channelData = audioBuffer.getChannelData(0)

        let old = 0
        if (sampleIs16bit) {
          // This is hacky, but it works
          for (let i = 0; i < sampleDataLen; i += 2) {
            let val = sampArray[i] + (sampArray[i + 1] << 8) + old

            // No idea why this is needed, copied from elsewhere
            if (val < -32768) val += 65536
            else if (val > 32767) val -= 65536
            old = val
            channelData[i / 2] = val / 32768
          }
        } else {
          for (let i = 0; i < sampleDataLen; i++) {
            let val = sampArray[i] + old

            // No idea why this is needed, copied from elsewhere
            if (val < -128) val += 256
            else if (val > 127) val -= 256
            old = val
            channelData[i] = val / 128.0
          }
        }

        sample.buffer = audioBuffer
        prj.instruments[i].samples[s] = sample
      } catch (err) {
        console.error('Error reading sample data!')
        console.error(err)
      }

      // Advance past this sample
      sampleLenTotal += sampleDataLen + sampleHeadSize
    }

    // Move to next instrument
    instOffset += instHeadSize + sampleLenTotal
  }

  return prj
}
