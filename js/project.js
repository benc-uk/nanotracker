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
  name = 'New Project'
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

  /**
   * @param {Pattern} patt
   * @param {number} stepNum
   */
  trigPatternStep(patt, stepNum) {
    // Get the current step for each track
    for (const track of this.tracks) {
      const step = patt.steps[track.number][stepNum]
      track.playStep(step)
    }
  }
}
