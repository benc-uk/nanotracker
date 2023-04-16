import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { Project } from './js/project.js'
import { displayStep } from './js/utils.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

// Top level Alpine.js component
Alpine.data('app', () => ({
  project: null,
  helpers: {
    displayStep,
  },
  activeStep: 0,
  stayOnPattern: false,
  stopped: true,
  cursor: {
    track: 0,
    step: 0,
  },

  async init() {
    console.log('### Starting JS Tracker')
    console.log(`### Audio state ${ctx.state}`)

    const prj = new Project()
    try {
      await prj.load('projects/demo.json')
      this.project = prj
    } catch (err) {
      console.error(err)
      return
    }

    // The main clock!
    const clock = new WAAClock(ctx)
    clock.start()

    clock
      .callbackAtTime(() => {
        if (this.stopped) return

        this.project.trigPatternStep()
        this.activeStep = this.project.currentStep
      }, ctx.currentTime)
      .tolerance({ early: 0.02, late: 0.02 })
      .repeat(0.11)

    // Hook for pattern changes
    window.addEventListener('endOfPattern', () => {
      this.endOfPattern()
    })
  },

  play() {
    this.stopped = false

    if (ctx.state === 'suspended') ctx.resume()
  },

  stop() {
    this.stopped = true
    this.project.patterns[0].currentStep = 0
    this.activeStep = 0
    if (ctx.state === 'suspended') ctx.resume()
  },

  endOfPattern() {
    if (this.stayOnPattern) return

    this.project.activePattern = this.project.patterns[this.project.activePattern.nextPatternNum]
    // if (this.activePattern >= this.project.patterns.length) {
    //   this.project.activePattern = this.project.patterns[0]
    // }
  },
}))

Alpine.start()
