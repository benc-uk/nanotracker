import { ctx } from './main.js'
import { SAMP_MODE_NONE, Sample } from './sample.js'
import { periodForNote, rateForPeriod } from './utils.js'

const MAX_SAMPLES = 16

/** Instrument holds multiple samples and many other parameters */
export class Instrument {
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
  createPlayNodes(noteNum, volume) {
    // TODO: Support multiple samples, hard coded to first sample for now
    /** @type {Sample} */
    const samp = this.samples[0]

    const gainNode = ctx.createGain()
    gainNode.gain.value = volume ? volume : samp.volume
    // gainNode.gain.value *= samp.volume // Scale by sample volume

    const audioNode = ctx.createBufferSource()
    audioNode.channelCount = 1

    // TODO: Possible optimization, store panner node for each sample
    const panNode = ctx.createStereoPanner()
    panNode.pan.value = samp.pan

    audioNode.buffer = this.samples[0].buffer

    // This shit is insane ¯\_(ツ)_/¯
    // See utils.js for full madness
    const notePeriod = periodForNote(noteNum, samp.relativeNote - 1, samp.fineTune)
    audioNode.playbackRate.value = rateForPeriod(notePeriod, ctx.sampleRate)

    // BUG: PingPong mode is not implemented, treated the same as normal loops
    if (samp.loopMode > SAMP_MODE_NONE) {
      audioNode.loop = true
      audioNode.loopStart = samp.loopStart * audioNode.buffer.duration
      audioNode.loopEnd = (samp.loopStart + samp.loopLen) * audioNode.buffer.duration
    }

    audioNode.connect(panNode)
    panNode.connect(gainNode)

    return [audioNode, gainNode]
  }
}
