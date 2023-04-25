import { toHex, toNote } from './utils.js'

export class Step {
  instNum = null
  volume = null
  note = null
  enabled = false
  noteOff = false

  // A string representation of the step, memoize for performance
  noteString = '···'
  volString = '··'
  instString = '··'
  effect1String = '····'

  effect1 = {
    type: 0,
    val1: 0,
    val2: 0,
  }

  // Empty "null" step
  constructor() {
    this.note = null
    this.instNum = null
    this.volume = null
    this.enabled = true
    this.effect1 = null

    this.updateStrings()
  }

  updateStrings() {
    this.noteString = toNote(this.note)
    if (this.noteOff) this.noteString = '==='
    this.volString = this.volume != null ? toHex(Math.floor(this.volume * 64)) : '··'
    this.instString = toHex(this.instNum)
    this.effect1String = this.effect1 ? toHex(this.effect1.type) + toHex(this.effect1.val1, 1) + toHex(this.effect1.val2, 1) : '····'
  }

  setNoteOff() {
    this.noteOff = true
    this.updateStrings()
    return this
  }

  setNote(note) {
    if (note < 0) note = 0
    this.note = note
    this.updateStrings()
    return this
  }

  setInst(instNum) {
    if (instNum < 0) instNum = 0
    if (instNum > 127) instNum = 127

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
