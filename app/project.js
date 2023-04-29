import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { Track } from './track.js'

const MAX_INSTRUMENTS = 128
const MAX_PATTERNS = 256
const DEFAULT_TRACK_COUNT = 8

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

  speed = 3 // Ticks per step/row
  bpm = 125 // Sets overall speed of ticks, 125 = 50hz

  // Pattern chain
  song = []

  // Create an new project with 256 empty patterns
  // And empty bank of 128 instruments
  constructor(trackCount = DEFAULT_TRACK_COUNT) {
    this.trackCount = trackCount

    for (let i = 0; i < trackCount; i++) {
      const t = new Track(i, trackCount)
      this.tracks.push(t)
    }

    this.clearInstruments()
    this.clearPatterns()

    this.name = 'New Project'
    this.song = [0, 1]
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
      this.instruments.push(new Instrument(i, '-'))
    }
  }

  /**
   * @param {Pattern} patt
   * @param {number} stepNum
   */
  trigPatternRow(patt, stepNum) {
    // Get the current step for each track
    for (const track of this.tracks) {
      const step = patt.steps[track.number][stepNum]
      track.activateStep(step, this.instruments)
    }
  }
}
