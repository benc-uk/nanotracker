import { Instrument } from './instrument.js'

export class Step {
  /** @type {Instrument} */

  instrument = null
  effect1 = null
  volume = 1.0
  note = 60
  enabled = false

  constructor(inst, note, vol) {
    this.volume = vol
    this.note = note
    this.instrument = inst
    this.enabled = true
  }
}
