import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { displayStep, stepClass } from './utils.js'
import { ctx } from '../app.js'
import { Step } from './step.js'

export const viewPatt = () => ({
  helpers: {
    displayStep,
    stepClass,
  },
  stayOnPattern: false,
  stopped: true,
  activePattern: null,
  currentStep: 0,
  cursor: {
    step: 0,
    track: 0,
  },

  async init() {
    this.activePattern = Alpine.store('project').patterns[0]
    this.currentStep = 0

    // effect to watch the store
    Alpine.effect(() => {
      //this.project = Alpine.store('project')
      this.activePattern = Alpine.store('project').patterns[0]
    })

    // Keys here!
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        this.cursor.step--
        if (this.cursor.step <= 0) {
          this.cursor.step = 0
        }
        this.followPlayingStep(this.cursor.step)
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        this.cursor.step++
        if (this.cursor.step >= this.activePattern.length) {
          this.cursor.step = this.activePattern.length - 1
        }
        this.followPlayingStep(this.cursor.step)
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        this.cursor.track--
        if (this.cursor.track < 0) this.cursor.track = 0
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        this.cursor.track++
        if (this.cursor.track >= this.project.trackCount) this.cursor.track = this.project.trackCount - 1
      }

      if (e.key === 'Delete') {
        e.preventDefault()
        this.activePattern.steps[this.cursor.track][this.cursor.step] = null
      }

      // stanard tracker keyboard for entering notes
      if (e.key === '1') {
        this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step(this.project.instruments[0], 60, 64)
      }

      if (e.key === '2') {
        this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step(this.project.instruments[1], 60, 64)
      }

      if (e.key === ' ') {
        e.preventDefault()
        if (this.stopped) this.play()
        else this.stop()
      }
    })

    // The main clock!
    const clock = new WAAClock(ctx)
    clock.start()

    clock
      .callbackAtTime(() => {
        // The main playback logic lives here
        if (this.stopped) return
        const prj = Alpine.store('project')

        prj.trigPatternStep(this.activePattern, this.currentStep)

        this.currentStep++

        if (this.currentStep >= this.activePattern.length) {
          if (this.stayOnPattern) {
            // Do nothing
          } else {
            this.activePattern = prj.patterns[this.activePattern.nextPatternNum]
          }
          this.currentStep = 0
        }

        this.cursor.step = this.currentStep
        this.followPlayingStep(this.currentStep)
      }, ctx.currentTime)
      .repeat(0.11)
  },

  followPlayingStep(stepNum) {
    let stepElem = document.querySelector(`#step-${stepNum - 7}`)
    if (stepElem) stepElem.scrollIntoView()
    else document.querySelector('#tracks').scrollTop = 0
  },

  play() {
    this.stopped = false

    if (ctx.state === 'suspended') ctx.resume()
  },

  stop() {
    this.stopped = true

    if (ctx.state === 'suspended') ctx.resume()
  },
})
