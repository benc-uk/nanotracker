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

    this.name = 'New Project'
    this.song = [0]
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
