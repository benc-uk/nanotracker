import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { Track } from './track.js'
import { loadSample } from './samples.js'

/** Project class, of which there is a single instance */
export class Project {
  /** @type {Instrument[]} */
  instruments = []

  /** @type {Pattern[]} */
  patterns = []

  /** @type {number} */
  activePattern = 0

  /** @type {string} */
  name = ''

  constructor() {}

  async load(filePath) {
    try {
      const resp = await fetch(filePath)
      const data = await resp.json()

      this.name = data.name

      let instId = 0
      for (const instData of data.instruments) {
        const samp = await loadSample(instData.file)
        const i = new Instrument(instId++, samp, instData.root, instData.gain)
        this.instruments.push(i)
      }

      for (const pattData of data.patterns) {
        const patt = new Pattern()
        patt.steps = pattData.steps

        for (const trackData of pattData.tracks) {
          const track = new Track(patt.steps)

          for (const stepData of trackData.steps) {
            const inst = this.instruments[stepData.instrument]
            if (!inst) continue

            track.steps[stepData.index].setNote(inst, stepData.note, stepData.gain)
          }

          patt.tracks.push(track)
        }

        this.patterns.push(patt)
      }
    } catch (err) {
      console.error(err)
    }
  }
}
