import { ctx } from '../app.js'
import { Step } from './step.js'

export class Track {
  number = 0
  muted = false

  /** @type {GainNode} */
  activeOutNode = null

  /** @type {AudioBufferSourceNode} */
  activeAudioNode = null

  /** @type {GainNode} */
  trackOutput

  constructor(num) {
    this.number = num
    this.muted = false
    this.trackOutput = null

    this.trackOutput = ctx.createGain()
    this.trackOutput.gain.value = 1.0
    this.trackOutput.connect(ctx.destination)

    this.activeAudioNode = null
    this.activeOutNode = null
  }

  setGain(gain) {
    this.trackOutput.gain.value = gain
  }

  stop() {
    if (this.activeAudioNode && this.activeOutNode) {
      this.activeAudioNode.stop(0)
      this.activeOutNode.disconnect()
    }
  }

  /**
   * Play a step on this track
   *
   * @param {Step} step - Step to play on this tracks audio channel
   */
  playStep(step) {
    if (!step || !step.enabled || !step.instrument || this.muted) {
      return
    }
  }
}
