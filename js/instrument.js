import { ctx } from '../app.js'
import { Sample } from './sample.js'

const MAX_SAMPLES = 1

export class Instrument {
  /** @type {AudioBuffer} */
  sample = null
  rootNote = 60
  number = 0
  name = 'Unnamed'
  /** @type {Sample[]} */
  samples = []
  gain = 64

  constructor(num, name) {
    this.name = name
    this.number = num

    this.samples = []
    for (let i = 0; i < MAX_SAMPLES; i++) {
      this.samples.push(new Sample(i, 'empty'))
    }
  }

  clearSamples() {
    this.samples = []
  }

  // Get an GainNode that will play this instrument
  createPlayNode(note, volume) {
    const gainNode = ctx.createGain()
    gainNode.gain.value = volume / 64

    const audioNode = ctx.createBufferSource()
    audioNode.buffer = this.samples[0].buffer
    audioNode.detune.value = (note - this.rootNote) * 100
    audioNode.connect(gainNode)

    return [audioNode, gainNode]
  }
}
