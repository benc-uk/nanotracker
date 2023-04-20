import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { Track } from './track.js'
import { Sample } from './sample.js'
import { Step } from './step.js'
import { loadSampleURL, toHexPadded } from './utils.js'

/** Project class, of which there is a single instance */
export class Project {
  /** @type {Instrument[]} */
  instruments = []

  /** @type {Pattern[]} */
  patterns = []

  /** @type {Track[]} */
  tracks = []

  /** @type {string} */
  name = 'Default'
  trackCount = 0

  song = []

  // Create an new project with 256 empty patterns
  // And empty bank of 128 instruments
  constructor(trackCount) {
    this.trackCount = trackCount

    for (let i = 0; i < trackCount; i++) {
      const t = new Track(i)
      this.tracks.push(t)
    }

    this.clearInstruments()
    this.clearPatterns()
  }

  clearPatterns() {
    this.patterns = []
    for (let i = 0; i < 256; i++) {
      this.patterns.push(new Pattern(i, 16, this.trackCount))
    }
  }

  clearInstruments() {
    this.instruments = []
    for (let i = 0; i < 128; i++) {
      this.instruments.push(new Instrument(i, 'Unnamed ' + i))
    }
  }

  async parse(inputString) {
    try {
      const data = JSON.parse(inputString)

      this.name = data.name

      let instNum = 0
      for (const instData of data.instruments) {
        const sampBuff = await loadSampleURL(instData.file)

        const name = instData.file.substring(instData.file.lastIndexOf('/') + 1)
        const inst = new Instrument(instNum++, name.replace('.wav', ''))
        const samp = new Sample(name, 0, sampBuff)

        inst.addSample(samp)
        this.instruments[inst.number] = inst
      }

      let pattNum = 0
      for (const pattData of data.patterns) {
        const patt = this.patterns[pattNum++]
        patt.length = pattData.length

        for (const stepData of pattData.steps) {
          const trackNum = stepData[0]
          const stepNum = stepData[1]
          const inst = this.instruments[stepData[2]]
          if (!inst) {
            console.log(`### WARNING! Instrument ${stepData[2]} not found`)
            continue
          }

          patt.steps[trackNum][stepNum] = new Step(inst, stepData[3], stepData[4])
        }
      }

      // Set start pattern
      this.activePattern = this.patterns[0]
      // set last pattern nextPatternNum to zero
      this.patterns[this.patterns.length - 1].nextPatternNum = 0
    } catch (err) {
      console.error(err)
    }
  }

  trigPatternStep(patt, stepNum) {
    // Get the current step for each track
    for (const track of this.tracks) {
      const step = patt.steps[track.number][stepNum]
      track.playStep(step)
    }
  }
}
