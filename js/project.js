import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { Track } from './track.js'
import { Sample } from './sample.js'
import { Step } from './step.js'
import { loadSampleURL, toHex } from './utils.js'

const MAX_INSTRUMENTS = 128
const MAX_PATTERNS = 256
export const DEFAULT_TRACK_COUNT = 8

/** Project class, of which there is a single instance */
export class Project {
  /** @type {Instrument[]} */
  instruments = []

  /** @type {Pattern[]} */
  patterns = []

  /** @type {Track[]} */
  tracks = []

  /** @type {string} */
  name = 'default'
  trackCount = 0
  tempo = 120

  // Pattern chain
  song = [0]

  // Create an new project with 256 empty patterns
  // And empty bank of 128 instruments
  constructor(trackCount = DEFAULT_TRACK_COUNT) {
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
    for (let i = 0; i < MAX_PATTERNS; i++) {
      this.patterns.push(new Pattern(i, 16, this.trackCount))
    }
  }

  clearInstruments() {
    this.instruments = []
    for (let i = 0; i < MAX_INSTRUMENTS; i++) {
      this.instruments.push(new Instrument(i, 'Unnamed ' + i))
    }
  }

  clearAll() {
    this.name = 'New Project'
    this.song = [0]
    this.clearInstruments()
    this.clearPatterns()
  }

  async parseJSON(inputString) {
    try {
      const data = JSON.parse(inputString)

      this.clearInstruments()
      this.clearPatterns()

      this.name = data.name
      this.tempo = data.tempo
      this.song = data.song

      let instNum = 0
      for (const instData of data.instruments) {
        const sampBuff = await loadSampleURL(instData.file)

        const name = instData.file.substring(instData.file.lastIndexOf('/') + 1)
        const inst = new Instrument(instNum++, name.replace('.wav', ''))
        const samp = new Sample(0, name)
        samp.buffer = sampBuff
        inst.samples[0] = samp
        inst.rootNote = instData.root

        this.instruments[inst.number] = inst
      }

      let pattNum = 0
      for (const pattData of data.patterns) {
        const patt = this.patterns[pattNum++]
        patt.length = pattData.length

        // TODO: REOMVE! fake stuff for testing
        for (let i = 0; i < patt.length; i += 4) {
          patt.steps[0][i] = new Step(0, 60, 64)
        }
        for (let i = 0; i < patt.length; i += 5) {
          patt.steps[0][i] = new Step(0, 60, 64)
        }
        for (let i = 4; i < patt.length; i += 8) {
          patt.steps[1][i] = new Step(1, 60, 64)
        }
        for (let i = 0; i < patt.length; i++) {
          patt.steps[2][i] = new Step(2, 60, Math.floor(Math.random() * 12 + 6))
        }
        for (let i = 0; i < patt.length; i += 12) {
          patt.steps[3][i] = new Step(3, 36 + pattNum * 7, 64)
        }
        this.tracks[1].muted = true

        // for (const stepData of pattData.steps) {
        //   const trackNum = stepData[0]
        //   const stepNum = stepData[1]
        //   const inst = stepData[2]

        //   patt.steps[trackNum][stepNum] = new Step(inst, stepData[3], stepData[4])
        // }
      }

      // Set start pattern
      this.activePattern = this.patterns[0]
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * @param {Pattern} patt
   * @param {number} stepNum
   */
  trigPatternStep(patt, stepNum) {
    // Get the current step for each track
    for (const track of this.tracks) {
      const step = patt.steps[track.number][stepNum]
      track.playStep(step, this.instruments)
    }
  }
}
