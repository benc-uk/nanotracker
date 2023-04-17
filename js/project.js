import { Instrument } from './instrument.js'
import { Pattern } from './pattern.js'
import { Track } from './track.js'
import { loadSample } from './samples.js'
import { Step } from './step.js'

/** Project class, of which there is a single instance */
export class Project {
  /** @type {Instrument[]} */
  instruments = []

  /** @type {Pattern[]} */
  patterns = []

  /** @type {Track[]} */
  tracks = []

  /** @type {string} */
  name = 'Default'
  trackCount = 0

  constructor(trackCount) {
    this.trackCount = trackCount

    for (let i = 0; i < trackCount; i++) {
      const t = new Track(i)
      this.tracks.push(t)
    }

    this.patterns[0] = new Pattern(0, 16, trackCount)
  }

  async load(inputString) {
    try {
      const data = JSON.parse(inputString)

      this.patterns = []
      this.instruments = []
      this.tracks = []
      for (let i = 0; i < this.trackCount; i++) {
        const t = new Track(i)
        this.tracks.push(t)
      }

      this.name = data.name

      let instId = 0
      for (const instData of data.instruments) {
        const samp = await loadSample(instData.file)
        const i = new Instrument(instId++, samp, instData.root, instData.gain)
        this.instruments.push(i)
      }

      let pattNum = 0
      for (const pattData of data.patterns) {
        const patt = new Pattern(pattNum++, pattData.length, data.trackCount)
        patt.nextPatternNum = pattNum

        for (const stepData of pattData.steps) {
          const trackNum = stepData[0]
          const stepNum = stepData[1]
          const inst = this.instruments[stepData[2]]
          if (!inst) {
            console.log(`### WARNING! Instrument ${stepData[2]} not found`)
            continue
          }

          patt.steps[trackNum][stepNum] = new Step(inst, stepData[3], stepData[4])
        }

        // Dummy test code - add hihats
        // for (let s = 0; s < patt.length; s++) {
        //   patt.steps[2][s] = new Step(this.instruments[2], 60, Math.floor(Math.random() * 18) + 5)
        // }

        this.patterns.push(patt)
      }

      // Set start pattern
      this.activePattern = this.patterns[0]
      // set last pattern nextPatternNum to zero
      this.patterns[this.patterns.length - 1].nextPatternNum = 0
    } catch (err) {
      console.error(err)
    }
  }

  trigPatternStep(patt, stepNum) {
    // Get the current step for each track
    for (const track of this.tracks) {
      const step = patt.steps[track.number][stepNum]
      track.playStep(step)
    }
  }
}
