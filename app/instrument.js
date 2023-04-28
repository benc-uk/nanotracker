import { ctx } from './main.js'
import { Sample } from './sample.js'

const MAX_SAMPLES = 16

/** Instrument holds multiple samples and many other parameters */
export class Instrument {
  rootNote = 48
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
      this.samples.push(new Sample(i, '-'))
    }
  }

  clearSamples() {
    this.samples = []
  }

  // Get an Audio & GainNode that will play this instrument at the given note & vol
  createPlayNode(note, volume) {
    const gainNode = ctx.createGain()
    gainNode.gain.value = 1.0 //volume ? volume : 1.0

    const audioNode = ctx.createBufferSource()
    audioNode.buffer = this.samples[0].buffer
    audioNode.detune.value = (note - this.rootNote) * 100
    audioNode.connect(gainNode)

    return [audioNode, gainNode]
  }
}
