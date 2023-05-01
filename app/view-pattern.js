import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { ctx } from './main.js'
import { toHex } from './utils.js'
import { editorKeys, keysUp } from './key-bindings.js'

let canvas = null
let ctx2d = null

// Magic numbers for the pattern view
const lineH = 26
const trackW = 148
const font = '26px VT323'
const fontW = 11
const curOffsets = [2, 43, 43 + fontW, 74, 74 + fontW, 106, 105 + fontW, 104 + fontW * 2]

export const viewPatt = (clock) => ({
  loopPattern: false,
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
      this.activePattern = Alpine.store('project').patterns[Alpine.store('project').song[0]]
      clock.updateRepeat(Alpine.store('project').bpm)
      clock.updateTickSpeed(Alpine.store('project').speed)
    })

    // Rerender the pattern when the active pattern changes
    this.$watch('activePattern', () => {
      this.renderPattern()
    })
    this.$watch('currentStep', () => {
      this.renderPattern()
    })
    this.$watch('cursor', () => {
      this.followPlayingStep(this.cursor.step)
      this.renderPattern()
    })

    // Keyboard bindings
    window.addEventListener('keydown', editorKeys.bind(this))
    window.addEventListener('keyup', keysUp.bind(this))

    canvas = this.$refs.pattCanvas
    ctx2d = canvas.getContext('2d')

    // Listen for clock ticks and play
    window.addEventListener('clockTick', () => {
      if (!this.stopped) this.playCurrentRow()
    })
  },

  // Really important, this is where playback happens
  playCurrentRow() {
    const prj = Alpine.store('project')

    prj.trigPatternRow(this.activePattern, this.currentStep)

    this.currentStep++

    if (this.currentStep >= this.activePattern.length) {
      if (this.loopPattern) {
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

  // Move the pattern view to follow the given step
  followPlayingStep(stepNum) {
    // Width ratio of the pattern view to the pattern canvas
    const ratio = this.$refs.pattView.offsetWidth / this.$refs.pattCanvas.width
    this.$refs.pattView.scrollTop = Math.floor((stepNum - 8) * lineH * ratio)
  },

  play() {
    this.stopped = false
    if (ctx.state === 'suspended') ctx.resume()
  },

  stop() {
    this.stopped = true
    for (const track of Alpine.store('project').tracks) {
      track.stop()
    }
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
    ctx2d.font = font

    const indexW = ctx2d.measureText('00').width + 6
    // Draw the step row index on the left
    for (let s = 0; s < this.activePattern.length; s++) {
      // Draw background stripe for every 4th step
      if (s % 4 == 0 && s != this.currentStep) {
        ctx2d.fillStyle = '#131313'
        ctx2d.fillRect(0, indexW + (s - 1) * lineH, canvas.width, lineH)
      }

      // Side index numbers
      ctx2d.fillStyle = '#ddd'
      if (s % 4 == 0) ctx2d.fillStyle = '#ffff00'
      ctx2d.fillText(toHex(s), 0, s * lineH + 20)

      for (let t = 0; t < prj.tracks.length; t++) {
        const step = this.activePattern?.steps[t][s]
        if (!step) {
          ctx2d.fillStyle = '#555'
          ctx2d.fillText('··· ·· ·· ···', t * trackW + 2 + indexW, s * lineH + 20)
          continue
        }

        ctx2d.fillStyle = 'rgb(79, 202, 192)'
        ctx2d.fillText(step.noteString, t * trackW + 2 + indexW, s * lineH + 20)
        ctx2d.fillStyle = 'rgb(241, 212, 81)'
        ctx2d.fillText(step.instString, t * trackW + 2 + 42 + indexW, s * lineH + 20)
        ctx2d.fillStyle = 'rgb(199, 73, 238)'
        ctx2d.fillText(step.volString, t * trackW + 2 + 72 + indexW, s * lineH + 20)
        ctx2d.fillStyle = 'rgb(58, 99, 235)'
        ctx2d.fillText(step.efxString, t * trackW + 2 + 104 + indexW, s * lineH + 20)
      }
    }

    // Draw bar between tracks
    ctx2d.fillStyle = '#999999'
    ctx2d.fillRect(indexW - 4, 0, 4, canvas.height)
    for (let t = 0; t < prj.tracks.length; t++) {
      // if muted, draw gray bar over the track
      if (prj.tracks[t].muted) {
        ctx2d.fillStyle = 'rgba(22, 22, 22, 0.8)'
        ctx2d.fillRect(t * trackW + indexW, 0, trackW - 10, canvas.height)
      }
      ctx2d.fillStyle = '#999999'
      ctx2d.fillRect((t + 1) * trackW - 7 + indexW, 0, 4, canvas.height)
    }

    // Draw cursor
    ctx2d.strokeStyle = '#0aa'
    ctx2d.lineWidth = 2

    if (this.record) {
      ctx2d.fillStyle = '#a20'
      const curOffset = curOffsets[this.cursor.column]
      const width = this.cursor.column == 0 ? fontW * 3 : fontW

      ctx2d.globalCompositeOperation = 'screen'
      ctx2d.fillRect(this.cursor.track * trackW + curOffset + indexW, this.cursor.step * lineH, width, lineH)
      ctx2d.strokeStyle = '#a20'
    }

    ctx2d.globalCompositeOperation = 'normal'
    ctx2d.strokeRect(this.cursor.track * trackW + indexW, this.cursor.step * lineH, trackW - 10, lineH)
  },
})
