import { ctx } from '../app.js'

export class Instrument {
  /** @type {AudioBuffer} */
  sample = null
  rootNote = 60
  number = '00'
  name = 'Unnamed'

  constructor(name, num, sampleBuffer, rootNote, gain) {
    this.name = name
    this.number = num
    this.sample = sampleBuffer
    this.rootNote = rootNote

    this.outputNode = ctx.createGain()
    this.outputNode.gain.value = gain / 64
  }

  // Get an AudioBufferSourceNode that will play this instrument
  createPlayNode(note, volume) {
    this.playGainNode = ctx.createGain()
    this.playGainNode.gain.value = volume / 64
    this.playGainNode.connect(this.outputNode)

    const noteNode = ctx.createBufferSource()
    noteNode.buffer = this.sample
    noteNode.detune.value = (note - this.rootNote) * 100

    noteNode.connect(this.playGainNode)

    return noteNode
  }
}
