import { Step } from './step.js'

export class Pattern {
  number = 0
  length = 16

  /** @type {Step[][]} */
  steps = []

  constructor(num, len, trackCount) {
    this.length = len
    this.number = num

    // For each track, is an array of step - note we use sparse arrays
    // There will be many gaps in the arrays where there are no steps
    for (let t = 0; t < trackCount; t++) {
      this.steps[t] = []
    }
  }

  // Clear all steps in the pattern
  clear() {
    for (let t = 0; t < this.steps.length; t++) {
      this.steps[t] = []
    }
  }

  // Clear one track in the pattern
  clearTrack(track) {
    this.steps[track] = []
  }
}
