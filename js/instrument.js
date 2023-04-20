import { ctx } from '../app.js'
import { Sample } from './sample.js'

export class Instrument {
  /** @type {AudioBuffer} */
  sample = null
  rootNote = 60
  number = 0
  name = 'Unnamed'
  /** @type {Sample} */
  samples = []
  gain = 64

  constructor(num, name) {
    this.name = name
    this.number = num

    this.outputNode = ctx.createGain()
    this.outputNode.gain.value = this.gain / 64
  }

  async addSample(sample) {
    this.samples.push(sample)
  }

  clearSamples() {
    this.samples = []
  }

  // Get an AudioBufferSourceNode that will play this instrument
  createPlayNode(note, volume) {
    this.playGainNode = ctx.createGain()
    this.playGainNode.gain.value = volume / 64
    this.playGainNode.connect(this.outputNode)

    const noteNode = ctx.createBufferSource()
    noteNode.buffer = this.samples[0].buffer
    noteNode.detune.value = (note - this.rootNote) * 100

    noteNode.connect(this.playGainNode)

    return noteNode
  }
}
