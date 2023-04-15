import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { Project } from './js/project.js'
import { displayStep } from './js/utils.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

let clock
let clockEvent

// Top level Alpine.js component
Alpine.data('app', () => ({
  project: null,
  displayStep,
  activePattern: 0,
  activeStep: 0,
  stayOnPattern: false,

  async init() {
    console.log('### Starting')
    console.log(`### Audio state ${ctx.state}`)

    const prj = new Project()
    try {
      await prj.load('projects/demo.json')
      this.project = prj
    } catch (err) {
      console.error(err)
      return
    }

    clock = new WAAClock(ctx)
    clock.start()

    window.addEventListener('endOfPattern', () => {
      this.endOfPattern()
    })
  },

  play() {
    console.log('### Play')

    if (clockEvent) {
      return
    }

    if (ctx.state === 'suspended') ctx.resume()

    clockEvent = clock
      .callbackAtTime(() => {
        this.project.patterns[this.activePattern].tick()
        this.activeStep = this.project.patterns[this.activePattern].currentStep
      }, ctx.currentTime)
      .tolerance({ early: 0.02, late: 0.02 })
      .repeat(0.12)
  },

  stop() {
    if (!clockEvent) return

    clockEvent.clear()
    this.project.patterns[0].currentStep = 0

    clockEvent = null
  },

  endOfPattern() {
    if (this.stayOnPattern) return

    this.activePattern++
    if (this.activePattern >= this.project.patterns.length) {
      this.activePattern = 0
    }
  },
}))

Alpine.start()
