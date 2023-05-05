import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { Track } from './track.js'

const MAX_INSTRUMENTS = 128
const MAX_PATTERNS = 256
const DEFAULT_TRACK_COUNT = 8

/** Project class, of which there is a single instance */
export class Project {
  /** @type {string} */
  name = 'default'

  trackCount = 0 // Total number of tracks or channels in the project

  speed = 6 // Ticks per step/row
  bpm = 125 // Sets overall speed of ticks, 125 = 50hz

  /** @type {number[]} */
  song = [] // Pattern chain

  /** @type {Instrument[]} */
  instruments = []

  /** @type {Pattern[]} */
  patterns = []

  /** @type {Track[]} */
  tracks = []

  // Create an new project with 256 empty patterns
  // And empty bank of 128 instruments, and 8 tracks
  constructor(trackCount = DEFAULT_TRACK_COUNT) {
    this.trackCount = trackCount

    for (let i = 0; i < trackCount; i++) {
      const t = new Track(i, trackCount)
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
      this.instruments.push(new Instrument(i, '-'))
    }
  }

  /**
   * Small but important function that is called to play rows
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
