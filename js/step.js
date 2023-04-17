import { Instrument } from './instrument.js'

export class Step {
  /** @type {Instrument} */
  instrument = null
  volume = 64
  note = 60
  enabled = false

  effect1type = '-'
  effect1val1 = null
  effect1val2 = null

  constructor(inst, note, vol) {
    this.volume = vol
    if (this.volume > 64) this.volume = 64
    if (this.volume < 0) this.volume = 0

    this.note = note
    this.instrument = inst
    this.enabled = true
  }
}
