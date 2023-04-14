import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { loadSample } from './samples.js'

/** Project class, of which there is a single instance */
export class Project {
  /** @type {Instrument[]} */
  instruments = []

  /** @type {Pattern[]} */
  patterns = []

  /** @type {number} */
  activePattern = 0

  constructor() {
    this.activePattern = 0
  }

  async load() {
    // TODO!!! Hard code for now

    const kickSample = await loadSample('../samples/Drums/Mini/BD Mini 1.wav')
    const kick = new Instrument('01', kickSample, 60, 1.0)
    this.instruments.push(kick)

    const snareSample = await loadSample('../samples/Drums/Bold/SD Bold 2.wav')
    const snare = new Instrument('02', snareSample, 60, 1.0)
    this.instruments.push(kick)

    const hhSample = await loadSample('../samples/Drums/Cut/HH Cut 3.wav')
    const hh = new Instrument('03', hhSample, 60, 1.0)
    this.instruments.push(hh)

    const bassSample = await loadSample('../samples/Xtra/TB Synth/TB Cat.wav')
    const bass = new Instrument('04', bassSample, 60, 1.0)
    this.instruments.push(hh)

    const patt = new Pattern()
    patt.tracks[0].steps[0].setNote(kick, 60, 1.0)
    patt.tracks[0].steps[2].setNote(kick, 60, 1.0)
    patt.tracks[0].steps[8].setNote(kick, 60, 1.0)
    patt.tracks[0].steps[11].setNote(kick, 60, 1.0)
    patt.tracks[0].steps[13].setNote(kick, 60, 1.0)

    patt.tracks[2].steps[4].setNote(snare, 60, 1.0)
    patt.tracks[2].steps[12].setNote(snare, 60, 1.0)

    for (let s = 0; s < 16; s++) {
      patt.tracks[1].steps[s].setNote(hh, 60, Math.random() * 0.2 + 0.1)
    }

    patt.tracks[3].steps[0].setNote(bass, 50, 0.6)
    patt.tracks[3].steps[1].setNote(bass, 50, 0.4)
    patt.tracks[3].steps[3].setNote(bass, 51, 0.8)
    patt.tracks[3].steps[9].setNote(bass, 47, 0.6)
    patt.tracks[3].steps[13].setNote(bass, 60, 0.6)

    this.patterns[0] = patt
  }
}
