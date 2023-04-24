// import { Instrument } from './instrument.js'
import { toHex, toNote } from './utils.js'

export const emptyStep = {
  // noteString: '···',
  // volString: '··',
  // instString: '··',
  // effect1String: '····',
  outputString: '··· ·· ·· ····',
  // allStrings() {
  //   return this.noteString + ' ' + this.volString + ' ' + this.instString + ' ' + this.effect1String
  // },
}

export class Step {
  instNum = -1
  volume = 64
  note = 60
  enabled = false

  // A string representation of the step, memoize for performance
  noteString = '000'
  volString = '00'
  instString = '00'
  effect1String = '0000'

  effect1 = {
    type: 0,
    val1: 0,
    val2: 0,
  }

  constructor(instNum, note, vol) {
    this.volume = vol
    if (this.volume > 64) {
      this.volume = 64
    }
    if (this.volume < 0) {
      this.volume = 0
    }

    this.note = note
    this.instNum = instNum
    this.enabled = true

    this.updateStrings()
  }

  updateStrings() {
    this.noteString = toNote(this.note)
    this.volString = toHex(this.volume)
    this.instString = toHex(this.instNum + 1)
    this.effect1String = toHex(this.effect1.type) + toHex(this.effect1.val1, 1) + toHex(this.effect1.val2, 1)
    this.outputString = this.noteString + ' ' + this.volString + ' ' + this.instString + ' ' + this.effect1String
  }

  setInst(instNum) {
    this.instNum = instNum
    this.updateStrings()
  }
}
