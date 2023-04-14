import { ctx } from '../app.js'

export class Instrument {
  rootNote = 60
  /** @type {AudioBuffer} */
  sample = null
  /** @type {GainNode} */
  gainNode = null
  /** @type {GainNode} */
  rootNode = null

  /** @type {AudioBufferSourceNode} */
  noteNode = null

  playing = false
  id = '00'

  constructor(id, sampleBuffer, rootNote, gain) {
    this.id = id

    this.rootNote = rootNote
    this.source = ctx.createBufferSource()
    this.sample = sampleBuffer

    this.rootNode = ctx.createGain()
    this.rootNode.gain.value = gain

    this.gainNode = ctx.createGain()
    this.gainNode.gain.value = 1.0
    this.gainNode.connect(ctx.destination)
    this.rootNode.connect(this.gainNode)
    this.playing = false
    this.noteNode = null
  }

  play(note, volume) {
    if (this.playing && this.noteNode) {
      this.noteNode.stop(0)
    }

    this.noteNode = ctx.createBufferSource()
    this.noteNode.buffer = this.sample

    this.noteNode.detune.value = (note - this.rootNote) * 100
    this.gainNode.gain.value = volume

    this.noteNode.connect(this.rootNode)
    this.noteNode.start(0, 0, 0.4)
    this.playing = true

    this.noteNode.onended = () => {
      this.playing = false
    }
  }
}
