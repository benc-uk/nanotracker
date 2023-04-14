import { Track } from './track.js'

export class Pattern {
  /** @type {number} */
  steps = 16
  /** @type {Track[]} */
  tracks = []
  /** @type {number} */
  currentStep = 0

  constructor() {
    this.tracks = []

    for (let i = 0; i < 4; i++) {
      this.tracks.push(new Track(16))
    }
  }

  tick() {
    this.tracks[0].steps[this.currentStep].play()
    this.tracks[1].steps[this.currentStep].play()
    this.tracks[2].steps[this.currentStep].play()
    this.tracks[3].steps[this.currentStep].play()

    this.currentStep = (this.currentStep + 1) % this.steps
  }
}
