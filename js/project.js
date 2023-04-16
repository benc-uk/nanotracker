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

  /** @type {Pattern} */
  activePattern = null

  /** @type {number} */
  currentStep = 0

  /** @type {string} */
  name = ''
  trackCount = 99

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

      this.trackCount = data.trackCount
      for (let i = 0; i < data.trackCount; i++) {
        const t = new Track(i)
        t.setGain(1.0)
        this.tracks.push(t)
      }

      let pattNum = 0
      for (const pattData of data.patterns) {
        const patt = new Pattern(pattNum++, pattData.length, data.trackCount)
        patt.nextPatternNum = pattNum

        for (const stepData of pattData.steps) {
          const trackNum = stepData[0]
          const stepNum = stepData[1]
          const inst = this.instruments[stepData[2]]
          patt.steps[trackNum][stepNum] = new Step(inst, stepData[3], stepData[4])
        }

        // Dummy test code - add hihats
        for (let s = 0; s < patt.length; s++) {
          patt.steps[2][s] = new Step(this.instruments[2], 60, Math.random() * 0.2 + 0.1)
        }

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

  trigPatternStep() {
    // Get the current step for each track
    for (const track of this.tracks) {
      const step = this.activePattern.steps[track.number][this.currentStep]
      track.playStep(step)
    }

    this.currentStep++

    if (this.currentStep >= this.activePattern.length) {
      window.dispatchEvent(
        new CustomEvent('endOfPattern', {
          detail: {},
        })
      )

      this.currentStep = 0
    }
  }
}
