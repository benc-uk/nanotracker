import { Instrument } from './instrument.js'

export class Step {
  /** @type {Instrument} */
  instrument = null
  volume = 64
  note = 60
  enabled = false

  effect1 = {
    type: 0,
    val1: 0,
    val2: 0,
  }

  constructor(inst, note, vol) {
    this.volume = vol
    if (this.volume > 64) {
      this.volume = 64
    }
    if (this.volume < 0) {
      this.volume = 0
    }

    this.note = note
    this.instrument = inst
    this.enabled = true
  }
}
