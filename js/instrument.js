import { ctx } from '../app.js'

export class Instrument {
  /** @type {AudioBuffer} */
  sample = null
  rootNote = 60
  id = '00'

  constructor(id, sampleBuffer, rootNote, gain) {
    this.id = id
    this.sample = sampleBuffer
    this.rootNote = rootNote

    this.outputNode = ctx.createGain()
    this.outputNode.gain.value = gain

    // Created once to save initization
    this.playGainNode = ctx.createGain()
    this.playGainNode.connect(this.outputNode)
  }

  // Get a node that will play this instrument
  createPlayNode(note, volume) {
    const noteNode = ctx.createBufferSource()
    noteNode.buffer = this.sample
    noteNode.detune.value = (note - this.rootNote) * 100

    this.playGainNode.gain.value = volume

    noteNode.connect(this.playGainNode)

    return noteNode
  }
}
