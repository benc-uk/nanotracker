export class Step {
  instrument = null
  effect1 = null
  volume = 1.0
  note = 60
  enabled = false

  constructor() {
    this.volume = 0.0
    this.note = 60
    this.instrument = null
    this.enabled = false
  }

  setNote(inst, note, vol) {
    this.instrument = inst
    this.note = note
    this.volume = vol
    this.enabled = true
  }

  play() {
    if (!this.enabled || !this.instrument) return

    this.instrument.play(this.note, this.volume)
  }
}
