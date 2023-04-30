import { Project } from './project.js'
import { Sample } from './sample.js'
import { Step } from './step.js'
import { toHex } from './utils.js'

/** @param {ArrayBuffer} data */
export async function loadXM(data, ctx) {
  // Read the XM header
  const header = new DataView(data, 0, 80)
  const trackCount = header.getUint16(68, true)

  const prj = new Project(trackCount)
  const name = String.fromCharCode(...new Uint8Array(data, 17, 20))
  prj.name = name.replace(/\0/g, '').trim()
  console.log('### 💽 Loading XM module:', prj.name)

  const headerSize = header.getUint32(60, true)
  const pattCount = header.getUint16(70, true)
  const instCount = header.getUint16(72, true)

  prj.speed = header.getUint16(76, true)
  prj.bpm = header.getUint16(78, true)

  // Read the song pattern chain
  const songLength = header.getUint16(64, true)
  const pattOrderTable = new Uint8Array(data, 80, 256)
  prj.song = []
  for (let i = 0; i < songLength; i++) {
    prj.song.push(pattOrderTable[i])
  }

  // Offset past the pattern data to the start of the instrument data
  let instStartOffset = 0

  // Base offset past the header to the start of rest of the data (patterns, instruments, etc)
  let baseOffset = headerSize + 60

  // Read patterns
  let pattOffset = 0
  for (let p = 0; p < pattCount; p++) {
    console.log(`PATTERN: ${p}`)
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

      let noteByteJump = 0 // Used by compressed note data
      let noteByte = 0
      let instByte = 0
      let volByte = 0
      // Read compressed note data, if MSB is set
      if (byte >> 7 === 1) {
        if ((byte & 1) === 1) {
          noteByte = pattData.getUint8(byteIndex + 1)
          noteByteJump++
        }
        if ((byte & 2) === 2) {
          instByte = pattData.getUint8(byteIndex + 1 + noteByteJump)
          noteByteJump++
        }
        if ((byte & 4) === 4) {
          volByte = pattData.getUint8(byteIndex + 1 + noteByteJump)
          noteByteJump++
        }
        // TODO: Read effect data
        if ((byte & 8) === 8) {
          noteByteJump++
        }
        if ((byte & 16) === 16) {
          noteByteJump++
        }

        byteIndex += noteByteJump
      } else {
        // console.log(`WARNING: uncompressed note data ${trackIndex + 1},${stepIndex}: `, byte.toString(2).padStart(8, '0'))
        // Handle uncompressed note data
        noteByte = pattData.getUint8(byteIndex + 0)
        instByte = pattData.getUint8(byteIndex + 1)
        volByte = pattData.getUint8(byteIndex + 2)
        // TODO: Read effect data

        byteIndex += 4
      }

      // Volume column is complex, and has multiple commands
      let stepVol = null

      if (volByte >= 16 && volByte <= 80) {
        // This simple volume set command
        stepVol = (volByte - 16) / 64.0 // Convert to 0-1 range
      }

      const step = new Step()
      if (noteByte > 0 && noteByte != 97) step.setNote(noteByte)
      if (noteByte == 97) step.setNoteOff()
      if (instByte > 0) step.setInst(instByte)
      if (stepVol != null) step.setVol(stepVol)

      prj.patterns[p].steps[trackIndex][stepIndex] = step

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

  // Read all instruments
  let instOffset = 0
  for (let i = 0; i < instCount; i++) {
    // Read first 29 bytes of instrument header, when 0 samples this is all we need
    let instHeader = new DataView(data, baseOffset + instStartOffset + instOffset, 29)
    const instHeadSize = instHeader.getUint32(0, true)
    let instSampCount = instHeader.getUint16(27, true)
    const instName = String.fromCharCode(...new Uint8Array(instHeader.buffer, instHeader.byteOffset + 4, 22))
    const instNameClean = instName.replace(/\0/g, '')

    console.log(`INSTRUMENT: ${instNameClean} (${i})`)

    prj.instruments[i].name = instNameClean

    if (instSampCount == 0) {
      console.log(' instrument has no samples')
      instOffset += instHeadSize
      continue
    }

    // When 1+ samples, read rest of instrument header, resizes the data view
    instHeader = new DataView(data, headerSize + 60 + instStartOffset + instOffset, instHeadSize)
    const sampleHeadSize = instHeader.getUint32(29, true)

    let samplesStartOffset = baseOffset + instStartOffset + instOffset + instHeadSize
    let sampleLenTotal = 0

    // Array of sample headers, each object holding fields for each sample
    let samples = []

    // First pass, read all sample headers
    for (let s = 0; s < instSampCount; s++) {
      const sampleHead = new DataView(data, samplesStartOffset + s * sampleHeadSize, sampleHeadSize)
      const sampleDataType = sampleHead.getUint8(17)
      const rawName = String.fromCharCode(...new Uint8Array(sampleHead.buffer, sampleHead.byteOffset + 18, 22))
      sampleLenTotal += sampleHeadSize
      if (sampleDataType != 0) {
        console.log(`WARNING! Sample is not type 0, ADPCM not supported!`)
        continue
      }

      samples.push({
        dataLen: sampleHead.getUint32(0, true),
        volume: sampleHead.getUint8(12),
        fineTune: sampleHead.getInt8(13),
        relNote: sampleHead.getInt8(16),
        pan: sampleHead.getUint8(15),
        is16bit: (sampleHead.getUint8(14) & 16) === 16,
        typeMode: sampleHead.getUint8(14),
        loopStart: sampleHead.getUint32(4, true),
        loopLen: sampleHead.getUint32(8, true),
        name: rawName.replace(/\0/g, ''),
        index: s,
      })

      // Advance past this sample header
    }

    // Second pass, read all sample data which follows the headers
    for (let sample of samples) {
      try {
        const sampArray = new Uint8Array(data, samplesStartOffset + sampleLenTotal, sample.dataLen)
        let audioBuffer
        const sampleRate = ctx.sampleRate

        let old = 0
        if (sample.is16bit) {
          // Note we divide by 2 here, since we're reading 16 bit samples
          audioBuffer = await ctx.createBuffer(1, sample.dataLen / 2, sampleRate)
          const channelData = audioBuffer.getChannelData(0)

          // This is hacky, but it works
          for (let i = 0; i < sample.dataLen; i += 2) {
            // Glue together 2 bytes into a 16 bit value
            let val = sampArray[i] + (sampArray[i + 1] << 8) + old

            // Copied from github.com/steffest/BassoonTracker
            if (val < -32768) val += 65536
            else if (val > 32767) val -= 65536
            old = val
            channelData[i / 2] = val / 32768 // also div by 2 here
          }
        } else {
          audioBuffer = await ctx.createBuffer(1, sample.dataLen, sampleRate)
          const channelData = audioBuffer.getChannelData(0)

          for (let i = 0; i < sample.dataLen; i++) {
            let val = sampArray[i] + old

            // Copied from github.com/steffest/BassoonTracker
            if (val < -128) val += 256
            else if (val > 127) val -= 256
            old = val
            channelData[i] = val / 128.0
          }
        }

        // Move to next sample data block
        sampleLenTotal += sample.dataLen

        const sampObj = new Sample(sample.index, sample.name)
        sampObj.buffer = audioBuffer
        sampObj.is16bit = sample.is16bit
        sampObj.volume = sample.volume / 64.0
        sampObj.fineTune = sample.fineTune
        console.log(`  SAMPLERN: ${sample.relNote}`)
        sampObj.relativeNote = sample.relNote
        sampObj.pan = (sample.pan - 128) / 128.0
        sampObj.loopMode = sample.typeMode & ~(1 << 4) // Mask off 4th bit
        sampObj.loopStart = sample.loopStart / sample.dataLen
        sampObj.loopLen = sample.loopLen / sample.dataLen
        console.log(`  SAMPLE: ${sampObj.toString()}`)

        prj.instruments[i].samples[sample.index] = sampObj
      } catch (err) {
        console.error('Error reading sample data!')
        console.error(err)
      }
    }

    // Move to next instrument
    instOffset += instHeadSize + sampleLenTotal
  }

  return prj
}
