import { ctx, masterOut } from './main.js'
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

  nodeList = []

  volume = 1.0

  /**
   * @param {number} num - Track number
   * @param {number} totalTracks - Total number of tracks in the project
   * */
  constructor(num, totalTracks) {
    this.number = num
    this.muted = false
    this.trackOutput = null

    this.trackOutput = ctx.createGain()

    // TODO: Not sure if this is the best way to do this
    this.trackOutput.gain.value = this.volume
    this.trackOutput.connect(masterOut)

    this.activeAudioNode = null
    this.activeOutNode = null
  }

  setGain(gain) {
    this.trackOutput.gain.value = gain
  }

  stop() {
    if (this.activeAudioNode || this.activeOutNode) {
      this.activeAudioNode.stop(0)
      this.activeOutNode.disconnect()
      this.activeAudioNode.disconnect()
    }
  }

  setMute(mute) {
    this.muted = mute
    if (mute) {
      this.trackOutput.gain.value = 0
    } else {
      this.trackOutput.gain.value = this.volume
    }
  }

  /**
   * Play a step on this track
   *
   * @param {Step} step - Step to play on this tracks audio channel
   */
  activateStep(step, instruments) {
    if (!step) {
      return
    }

    if (step.noteOff) {
      this.stop()
      return
    }

    if (step.volume != null && this.activeOutNode && step.note == null) {
      this.activeOutNode.gain.value = step.volume
      return
    }

    // This makes the tracks monophonic and cut off previous notes
    if (this.activeAudioNode && this.activeOutNode) {
      this.activeAudioNode.disconnect()
      this.activeOutNode.disconnect()
    }

    const inst = instruments[step.instNum - 1]
    if (!inst) {
      return
    }

    const [audioNode, outNode] = inst.createPlayNodes(step.note, step.volume)
    this.activeOutNode = outNode
    this.activeAudioNode = audioNode
    this.activeAudioNode.start()
    this.activeOutNode.connect(this.trackOutput)
  }
}
