import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { ctx } from '../app.js'
import { Step } from './step.js'

const BPM_MAGIC = 15
// prettier-ignore
const keyboardKeys = ['z','s','x','d','c','v','g','b','h','n','j','m','q','2','w','3','e','r','5','t','6','y','7','u','i','9','o','0','p']

let canvas = null
let ctx2d = null
const lineH = 26
const trackW = 160

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

    // Rerender the pattern when the active pattern changes
    this.$watch('activePattern', () => {
      this.renderPattern()
    })
    this.$watch('currentStep', () => {
      this.renderPattern()
    })
    this.$watch('cursor', () => {
      this.renderPattern()
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
      this.playOneStep()
    }, ctx.currentTime)

    this.clockTimer.repeat(BPM_MAGIC / Alpine.store('project').tempo)

    canvas = this.$refs.pattCanvas
    ctx2d = canvas.getContext('2d')
  },

  playOneStep() {
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
        this.patternChange(nextPattNum)
      }
      this.currentStep = 0
    }

    this.cursor.step = this.currentStep
    if (!this.record) {
      this.followPlayingStep(this.currentStep)
    }
  },

  followPlayingStep(stepNum) {
    // Width ratio of the pattern view to the pattern canvas
    const r = this.$refs.pattView.offsetWidth / this.$refs.pattCanvas.width
    this.$refs.pattView.scrollTop = Math.floor((stepNum - 8) * lineH * r)
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

  recordMode() {
    this.record = !this.record
    if (this.record) {
      this.cursor.column = 0
    }
    this.renderPattern()
  },

  renderPattern() {
    const prj = Alpine.store('project')

    canvas.height = this.activePattern.length * lineH
    canvas.width = prj.tracks.length * trackW

    // Draw background for active step
    ctx2d.fillStyle = 'rgba(0, 255, 255, 0.2)'
    ctx2d.fillRect(0, this.currentStep * lineH, canvas.width, lineH)
    ctx2d.font = '26px VT323'

    for (let s = 0; s < this.activePattern.length; s++) {
      if (s % 4 == 0 && s != this.currentStep) {
        ctx2d.fillStyle = '#131313'
        ctx2d.fillRect(0, s * lineH, canvas.width, lineH)
      }

      for (let t = 0; t < prj.tracks.length; t++) {
        const step = this.activePattern?.steps[t][s]
        if (!step) {
          ctx2d.fillStyle = '#555'
          ctx2d.fillText('··· ·· ·· ····', t * trackW + 2, s * lineH + 20)
          continue
        }

        ctx2d.fillStyle = 'rgb(79, 202, 192)'
        ctx2d.fillText(step.noteString, t * trackW + 2, s * lineH + 20)
        ctx2d.fillStyle = 'rgb(241, 212, 81)'
        ctx2d.fillText(step.instString, t * trackW + 2 + 42, s * lineH + 20)
        ctx2d.fillStyle = 'rgb(199, 73, 238)'
        ctx2d.fillText(step.volString, t * trackW + 2 + 72, s * lineH + 20)
        ctx2d.fillStyle = 'rgb(58, 99, 235)'
        ctx2d.fillText(step.effect1String, t * trackW + 2 + 104, s * lineH + 20)
      }
    }

    // Draw bar between tracks
    for (let t = 0; t < prj.tracks.length; t++) {
      // if muted, draw gray bar over the track
      if (prj.tracks[t].muted) {
        ctx2d.fillStyle = 'rgba(22, 22, 22, 0.8)'
        ctx2d.fillRect(t * trackW, 0, trackW - 10, canvas.height)
      }
      ctx2d.fillStyle = '#999999'
      ctx2d.fillRect((t + 1) * trackW - 7, 0, 4, canvas.height)
    }

    // Draw cursor

    ctx2d.strokeStyle = '#0aa'
    ctx2d.lineWidth = 2

    if (this.record) {
      ctx2d.fillStyle = '#a20'
      const curOffset = [0, 42, 72, 104][this.cursor.column]
      const curWidth = [38, 28, 28, 48][this.cursor.column]

      ctx2d.globalCompositeOperation = 'screen'
      ctx2d.fillRect(this.cursor.track * trackW + curOffset, this.cursor.step * lineH, curWidth, lineH)
      ctx2d.strokeStyle = '#a20'
    }

    ctx2d.globalCompositeOperation = 'normal'
    ctx2d.strokeRect(this.cursor.track * trackW, this.cursor.step * lineH, trackW - 10, lineH)
  },

  // Keys here!
  bindKeys(e) {
    // if (Alpine.store('view') !== 'patt') returnx
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

    if (e.key === 'Escape') {
      e.preventDefault()
      this.stop()
      this.recordMode()
    }

    if (e.key === ' ' && e.ctrlKey) {
      e.preventDefault()
      this.stayOnPattern = true
      this.currentStep = 0
      this.record = false
      this.play()
      return
    }

    if (e.key === ' ' && e.shiftKey) {
      e.preventDefault()
      this.record = false
      this.play()
      return
    }

    if (e.key === ' ') {
      e.preventDefault()
      if (!this.stopped) {
        this.stop()
      } else {
        this.currentStep = 0
        this.stayOnPattern = false
        this.record = false
        this.play()
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      this.playOneStep()
      return
    }

    if (this.record && this.cursor.column > 0) {
      const valInt = parseInt(e.key)
      console.log(valInt)
      if (valInt >= 0 && valInt <= 9) {
        e.preventDefault()
        this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(valInt - 1)
      }

      return
    }

    const keyOffset = keyboardKeys.indexOf(e.key)

    if (keyOffset !== -1) {
      e.preventDefault()

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
  },
})
