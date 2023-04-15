import { Track } from './track.js'

export class Pattern {
  /** @type {number} */
  steps = 32
  /** @type {Track[]} */
  tracks = []
  /** @type {number} */
  currentStep = 0

  constructor() {
    this.tracks = []
  }

  tick() {
    if (this.currentStep < 0) {
      this.currentStep = 0
    }

    for (const track of this.tracks) {
      track.steps[this.currentStep].play()
    }

    this.currentStep++

    if (this.currentStep >= this.steps) {
      window.dispatchEvent(
        new CustomEvent('endOfPattern', {
          detail: {},
        })
      )

      this.currentStep = 0
    }
  }
}
