import { Step } from './step.js'

export class Pattern {
  number = 0
  length = 16

  /** @type {Step[][]} first level of array is track num, next is the Step */
  steps = []

  nextPatternNum = 0

  constructor(num, len, trackCount) {
    this.length = len
    this.number = num

    // for each track, note we use sparse arrays!
    for (let t = 0; t < trackCount; t++) {
      this.steps[t] = []
    }
  }
}
