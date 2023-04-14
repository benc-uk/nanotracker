import { Step } from './step.js'

export class Track {
  muted = false

  constructor(steps) {
    /** @type {Step[]} */
    this.steps = []
    this.muted = false

    for (let i = 0; i < steps; i++) {
      this.steps.push(new Step())
    }
  }
}
