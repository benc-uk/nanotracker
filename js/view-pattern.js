import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { stepText, stepClass } from './utils.js'
import { ctx } from '../app.js'
import { Step } from './step.js'

export const viewPatt = () => ({
  fn: {
    stepText,
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
  activeInst: 0,
  record: false,

  async init() {
    this.activePattern = Alpine.store('project').patterns[0]
    this.currentStep = 0

    // effect to watch the store
    Alpine.effect(() => {
      this.activePattern = Alpine.store('project').patterns[0]
    })

    // Keyboard bindings
    this.bindKeys = this.bindKeys.bind(this)
    window.addEventListener('keydown', this.bindKeys)

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
        if (!this.record) {
          this.followPlayingStep(this.currentStep)
        }
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

  patternChange(offset) {
    const newNum = this.activePattern.number + offset
    if (newNum >= Alpine.store('project').patterns.length) return
    if (newNum < 0) return
    this.activePattern = Alpine.store('project').patterns[newNum]
  },

  instChange(offset) {
    let newNum = this.activeInst + offset
    if (newNum >= Alpine.store('project').instruments.length) return
    if (newNum < 0) return
    this.activeInst = newNum
  },

  soloTrack(trackNum) {
    const prj = Alpine.store('project')
    for (let track of prj.tracks) {
      track.muted = true
    }
    prj.tracks[trackNum].muted = false
  },

  // Keys here!
  bindKeys(e) {
    if (Alpine.store('view') !== 'patt') return

    const prj = Alpine.store('project')

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
      if (this.cursor.track >= prj.trackCount) this.cursor.track = prj.trackCount - 1
    }

    if (e.key === 'Delete') {
      e.preventDefault()
      if (!this.record) return
      this.activePattern.steps[this.cursor.track][this.cursor.step] = null
    }

    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      this.stayOnPattern = true
      this.currentStep = 0
      this.record = false
      this.play()
      return
    }

    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      this.stayOnPattern = true
      this.record = false
      this.play()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      this.stayOnPattern = false
      this.currentStep = 0
      this.record = false
      this.play()
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      this.stop()
      this.record = !this.record
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      this.stop()
    }

    if (e.key === 'z') {
      e.preventDefault()
      this.stop()
      const inst = prj.instruments[this.activeInst]
      this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step(inst, 60, 64)
    }
  },
})
