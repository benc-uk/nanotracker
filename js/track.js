import { ctx } from '../app.js'
import { Step } from './step.js'

export class Track {
  number = 0
  muted = false
  playing = false

  /** @type {Step} */
  playingStep = null

  /** @type {AudioBufferSourceNode} */
  stepNode = null

  /** @type {GainNode} */
  trackOutput

  constructor(num) {
    this.number = num
    this.muted = false
    this.trackOutput = null

    this.trackOutput = ctx.createGain()
    this.trackOutput.gain.value = 1.0
    this.trackOutput.connect(ctx.destination)
    this.stepNode = null
  }

  setGain(gain) {
    this.trackOutput.gain.value = gain
  }

  /**
   * Play a step on this track
   *
   * @param {Step} step - Step to play on this tracks audio channel
   */
  playStep(step) {
    if (!step || !step.enabled || !step.instrument) return

    // This makes the tracks monophonic and cut off previous notes
    if (this.stepNode && this.playingStep) {
      this.playingStep.instrument.outputNode.disconnect()
      this.stepNode.stop(0)
    }

    this.playingStep = step

    // Get a audio node to play this step, and connect to the track output
    this.stepNode = step.instrument.createPlayNode(step.note, step.volume)
    step.instrument.outputNode.connect(this.trackOutput)
    this.stepNode.start(0)
  }
}
