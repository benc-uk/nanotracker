import { ctx } from '../app.js'
import { Step } from './step.js'

export class Track {
  number = 0
  muted = false
  playing = false
  /** @type {Step} */
  playingStep = null
  stepNode = null

  constructor(num) {
    this.number = num
    this.muted = false
    this.gainNode = null

    this.gainNode = ctx.createGain()
    this.gainNode.gain.value = 1.0
    this.gainNode.connect(ctx.destination)
    this.stepNode = null
  }

  setGain(gain) {
    this.gainNode.gain.value = gain
  }

  playStep(step) {
    // const step = this.steps[stepIndex]
    if (!step || !step.enabled || !step.instrument) return

    // This makes the tracks monophonic and cut off previous notes
    if (this.stepNode && this.playingStep) {
      this.playingStep.instrument.outputNode.disconnect()
      this.stepNode.stop(0)
    }

    this.playingStep = step

    // Get a audio node to play this step, and connect to the track output
    this.stepNode = step.instrument.createPlayNode(step.note, step.volume)
    step.instrument.outputNode.connect(this.gainNode)
    this.stepNode.start(0)
  }
}
