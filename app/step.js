import { toHex, toNote } from './utils.js'

/**
 * A single step in a pattern
 */
export class Step {
  /** @type {number} */
  instNum = null
  /** @type {number} */
  volume = null
  /** @type {number} */
  note = null
  /** @type {boolean} */
  noteOff = false
  /** @type {string} */
  efxCmd = null
  /** @type {number} */
  efxVal1 = null
  /** @type {number} */
  efxVal2 = null

  /** @type {string} */
  noteString = '···'
  volString = '··'
  instString = '··'
  efxString = '···'

  // Create an empty "null" step, with no note or instrument
  constructor() {
    this.note = null
    this.instNum = null
    this.volume = null
    this.efxCmd = null
    this.efxVal1 = null
    this.efxVal2 = null

    this.updateStrings()
  }

  updateStrings() {
    this.noteString = toNote(this.note)
    if (this.noteOff) this.noteString = '==='
    this.volString = this.volume != null ? toHex(Math.floor(this.volume * 64)) : '··'
    this.instString = toHex(this.instNum)
    this.efxString = this.efxCmd ? this.efxCmd : '·' + toHex(this.efxVal1, 1) + toHex(this.efxVal2, 1)
  }

  setNoteOff() {
    this.noteOff = true
    this.updateStrings()
    return this
  }

  setNote(note) {
    if (note < 0) note = 0
    this.note = note
    this.nodeOff = false
    this.updateStrings()
    return this
  }

  setInst(instNum) {
    this.instNum = instNum
    this.updateStrings()
    return this
  }

  setVol(vol) {
    if (vol < 0) vol = 0
    if (vol > 1) vol = 1
    this.volume = vol
    this.updateStrings()
    return this
  }
}
