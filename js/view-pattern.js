import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { ctx } from '../app.js'
import { Step, emptyStep } from './step.js'

const BPM_MAGIC = 15
// prettier-ignore
const keyboardKeys = ['z','s','x','d','c','v','g','b','h','n','j','m','q','2','w','3','e','r','5','t','6','y','7','u','i','9','o','0','p']

export const viewPatt = () => ({
  stayOnPattern: false,
  stopped: true,
  activePattern: null,
  currentStep: 0,
  cursor: {
    step: 0,
    track: 0,
    column: 0,
  },
  activeInst: 0,
  record: false,
  clockTimer: null,
  songPos: 0,
  octave: 5,

  async init() {
    this.activePattern = Alpine.store('project').patterns[0]
    this.currentStep = 0

    // Effect to watch the store
    Alpine.effect(() => {
      this.activePattern = Alpine.store('project').patterns[0]
      if (this.clockTimer) this.clockTimer.repeat(BPM_MAGIC / Alpine.store('project').tempo)
    })

    // Keyboard bindings
    this.bindKeys = this.bindKeys.bind(this)
    window.addEventListener('keydown', this.bindKeys)

    // The main clock!
    const clock = new WAAClock(ctx)
    clock.start()

    this.clockTimer = clock.setTimeout(() => {
      // The main playback logic lives here
      if (this.stopped) return
      const prj = Alpine.store('project')

      // NOTE: Most important line of code in the whole app
      prj.trigPatternStep(this.activePattern, this.currentStep)

      this.currentStep++

      if (this.currentStep >= this.activePattern.length) {
        if (this.stayOnPattern) {
          // Do nothing when looping same pattern
        } else {
          // Advance song position and switch pattern
          this.songPos++
          if (this.songPos >= prj.song.length) this.songPos = 0
          const nextPattNum = prj.song[this.songPos]
          this.activePattern = prj.patterns[nextPattNum]
        }
        this.currentStep = 0
      }

      this.cursor.step = this.currentStep
      if (!this.record) {
        this.followPlayingStep(this.currentStep)
      }
    }, ctx.currentTime)

    this.clockTimer.repeat(BPM_MAGIC / Alpine.store('project').tempo)
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
    for (const t of Alpine.store('project').tracks) {
      t.stop()
    }

    if (ctx.state === 'suspended') ctx.resume()
  },

  patternChange(newPattNum) {
    if (newPattNum > 255) return
    if (newPattNum < 0) return
    this.activePattern = Alpine.store('project').patterns[newPattNum]

    this.$refs.pattSel.value = newPattNum

    // Handle switching to a shorter pattern
    if (this.currentStep >= this.activePattern.length) this.currentStep = 0
    if (this.cursor.step >= this.activePattern.length) this.cursor.step = this.activePattern.length - 1
  },

  instChange(newInstNum) {
    if (newInstNum > 128) return
    if (newInstNum < 0) return
    this.activeInst = newInstNum
  },

  pattLenChange(lenDelta) {
    const newLen = this.activePattern.length + lenDelta
    if (newLen > 128) return
    if (newLen < 1) return
    this.activePattern.length = newLen
    if (this.currentStep >= this.activePattern.length) this.currentStep = 0
    if (this.cursor.step >= this.activePattern.length) this.cursor.step = this.activePattern.length - 1
  },

  soloTrack(trackNum) {
    const prj = Alpine.store('project')
    for (let track of prj.tracks) {
      track.muted = true
    }
    prj.tracks[trackNum].muted = false
  },

  stepClass(stepNum, trkNum) {
    const isRecord = this.cursor.track == trkNum && this.record
    const isCurrent = this.currentStep == stepNum
    const isCursorStep = this.cursor.step == stepNum

    return {
      stripe: !isCurrent && stepNum % 4 == 0,
      record: isCursorStep && isRecord,
      cursor: isCursorStep && this.cursor.track == trkNum && !this.record,
      active: isCurrent,
      fade: !this.isStep(stepNum, trkNum) && !(isCursorStep && isRecord),
    }
  },

  subStepClass(stepNum, trkNum, column) {
    if (!this.record) return {}
    const isRecord = this.record && this.cursor.track == trkNum
    if (!isRecord) return {}
    const isCursorStep = this.cursor.step == stepNum
    if (!isCursorStep) return {}

    return {
      record: isRecord && isCursorStep && this.cursor.column == column,
    }
  },

  getStep(stepNum, trkNum) {
    const step = this.activePattern?.steps[trkNum][stepNum]
    if (!step) return emptyStep
    return step
  },

  isStep(stepNum, trkNum) {
    const step = this.activePattern?.steps[trkNum][stepNum]
    if (!step) return false
    return true
  },

  recordMode() {
    this.record = !this.record
    if (this.record) {
      this.cursor.column = 0
    }
  },

  // Keys here!
  bindKeys(e) {
    //if (Alpine.store('view') !== 'patt') return

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

      if (this.record) {
        this.cursor.column--
        if (this.cursor.column < 0) {
          this.cursor.track--
          if (this.cursor.track < 0) {
            this.cursor.track = 0
            this.cursor.column = 0
          } else {
            this.cursor.column = 3
          }
        }
        return
      }

      this.cursor.track--
      if (this.cursor.track < 0) this.cursor.track = 0
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault()

      if (this.record) {
        this.cursor.column++
        if (this.cursor.column > 3) {
          this.cursor.track++
          if (this.cursor.track >= prj.trackCount) {
            this.cursor.track = prj.trackCount - 1
            this.cursor.column = 3
          } else {
            this.cursor.column = 0
          }
        }
        return
      }

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
      this.recordMode()
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      this.stop()
    }

    const keyOffset = keyboardKeys.indexOf(e.key)

    if (keyOffset !== -1) {
      e.preventDefault()

      // It ends up being a string for some reason
      this.octave = parseInt(this.octave)

      const inst = prj.instruments[this.activeInst]
      const noteNum = this.octave * 12 + keyOffset
      const [audioNode, gainNode] = inst.createPlayNode(noteNum, 64)
      audioNode.start(0)
      gainNode.connect(ctx.destination)
      audioNode.onended = () => {
        gainNode.disconnect()
      }

      if (!this.record || this.cursor.column != 0) return
      this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step(this.activeInst, noteNum, 64)
    }

    if (this.record || this.cursor.column == 1) {
      // Get integer value from key pressed
      const valInt = parseInt(e.key)
      if (valInt >= 0 && valInt <= 9) {
        e.preventDefault()
        if (!this.record || this.cursor.column != 1) return
        this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(valInt)
      }
    }
  },
})
