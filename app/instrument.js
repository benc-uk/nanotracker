import { ctx } from './main.js'
import { Sample } from './sample.js'

const MAX_SAMPLES = 16

/** Instrument holds multiple samples and many other parameters */
export class Instrument {
  rootNote = 60
  number = 0
  name = 'Unnamed'
  /** @type {Sample[]} */
  samples = []

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
    // TODO: Support multiple samples, hard coded to first sample for now
    /** @type {Sample} */
    const samp = this.samples[0]

    const gainNode = ctx.createGain()
    gainNode.gain.value = volume ? volume : 1.0
    gainNode.gain.value *= samp.volume

    const audioNode = ctx.createBufferSource()
    audioNode.channelCount = 1

    // TODO: Possible optimization, store panner node for each sample
    const panNode = ctx.createStereoPanner()
    panNode.pan.value = samp.pan

    audioNode.buffer = this.samples[0].buffer
    audioNode.detune.value = (note - this.rootNote) * 100

    // TODO: Support finetune
    // TODO: Support relative note
    // TODO: Support loop start/end & loop modes

    audioNode.connect(panNode)
    panNode.connect(gainNode)

    return [audioNode, gainNode]
  }
}
