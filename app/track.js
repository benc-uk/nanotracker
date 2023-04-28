import { ctx } from './main.js'
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
  playStep(step, instruments) {
    if (!step || step.instNum == null || this.muted) {
      return
    }

    // This makes the tracks monophonic and cut off previous notes
    if (this.activeAudioNode && this.activeOutNode) {
      this.activeAudioNode.stop(0)
      this.activeOutNode.disconnect()
    }

    const inst = instruments[step.instNum - 1]
    if (!inst) {
      //console.log('No instrument found for step', step)
      return
    }

    const [audioNode, outNode] = inst.createPlayNode(step.note, step.volume)
    this.activeOutNode = outNode
    this.activeAudioNode = audioNode
    this.activeAudioNode.start(0)
    this.activeOutNode.connect(this.trackOutput)
  }
}
