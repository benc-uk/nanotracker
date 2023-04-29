import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { ctx, masterOut } from './main.js'
import { Step } from './step.js'
import { toHex } from './utils.js'

// prettier-ignore
const keyboardKeys = ['z','s','x','d','c','v','g','b','h','n','j','m','q','2','w','3','e','r','5','t','6','y','7','u','i','9','o','0','p']
const hexKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f']

let canvas = null
let ctx2d = null

// Magic numbers for the pattern view
const lineH = 26
const trackW = 148
const font = '26px VT323'
const fontW = 11
const curOffsets = [2, 43, 43 + fontW, 74, 74 + fontW, 106, 105 + fontW, 104 + fontW * 2]

let previewGainNode
let previewAudioNode

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
      this.activePattern = Alpine.store('project').patterns[0]
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
    this.bindKeys = this.bindKeys.bind(this)
    window.addEventListener('keydown', this.bindKeys)
    window.addEventListener('keyup', this.bindKeysUp)

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
        ctx2d.fillRect(t * trackW, 0, trackW - 10, canvas.height)
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

  // Keys here!
  bindKeys(e) {
    const prj = Alpine.store('project')
    const keyOffset = keyboardKeys.indexOf(e.key)

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.cursor.step--
      if (this.cursor.step <= 0) {
        this.cursor.step = 0
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.cursor.step++
      if (this.cursor.step >= this.activePattern.length) {
        this.cursor.step = this.activePattern.length - 1
      }
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
        if (this.cursor.column > 7) {
          this.cursor.track++
          if (this.cursor.track >= prj.trackCount) {
            this.cursor.track = prj.trackCount - 1
            this.cursor.column = 7
          } else {
            this.cursor.column = 0
          }
        }
        return
      }

      this.cursor.track++
      if (this.cursor.track >= prj.trackCount) this.cursor.track = prj.trackCount - 1
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      this.stop()
      this.recordMode()
    }

    if (e.key === ' ' && e.ctrlKey) {
      e.preventDefault()
      this.loopPattern = true
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
        this.loopPattern = false
        this.record = false
        this.play()
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      this.playCurrentRow()
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      this.cursor.track++
      if (this.cursor.track >= prj.trackCount) this.cursor.track = 0
      this.cursor.column = 0
      return
    }

    if (e.key === 'Home') {
      e.preventDefault()
      this.cursor.step = 0
      return
    }

    if (e.key === 'PageDown') {
      e.preventDefault()
      this.cursor.step += 16
      if (this.cursor.step >= this.activePattern.length) {
        this.cursor.step = this.activePattern.length - 1
      }
      return
    }

    if (e.key === 'PageUp') {
      e.preventDefault()
      this.cursor.step -= 16
      if (this.cursor.step < 0) {
        this.cursor.step = 0
      }
      return
    }

    if (e.key === 'End') {
      e.preventDefault()
      this.cursor.step = this.activePattern.length - 1
      this.followPlayingStep(this.cursor.step)
      return
    }

    if (this.record && this.cursor.column > 0 && e.key !== 'Delete') {
      if (hexKeys.indexOf(e.key) > -1) {
        e.preventDefault()

        if (!this.activePattern.steps[this.cursor.track][this.cursor.step]) {
          this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step()
        }

        let instHex = toHex(this.activePattern.steps[this.cursor.track][this.cursor.step].instNum)
        let volHex = toHex(this.activePattern.steps[this.cursor.track][this.cursor.step].volume * 64)
        switch (this.cursor.column) {
          case 1:
            instHex = e.key + instHex[1]
            this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(parseInt(instHex, 16))
            break
          case 2:
            instHex = instHex[0] + e.key
            this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(parseInt(instHex, 16))
            break
          case 3:
            volHex = e.key + volHex[1]
            if (parseInt(volHex, 16) > 64) volHex = '40'
            this.activePattern.steps[this.cursor.track][this.cursor.step].setVol(parseInt(volHex, 16) / 64)
            break
          case 4:
            volHex = volHex[0] + e.key
            if (parseInt(volHex, 16) > 64) volHex = '40'
            this.activePattern.steps[this.cursor.track][this.cursor.step].setVol(parseInt(volHex, 16) / 64)
            break
        }
      }

      return
    }

    if (e.key === 'Delete') {
      e.preventDefault()
      if (!this.record) return

      if (this.cursor.column == 0) {
        this.activePattern.steps[this.cursor.track][this.cursor.step].setNote(null)
      }
      if (this.cursor.column == 1) {
        this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(null)
        this.activePattern.steps[this.cursor.track][this.cursor.step].setNote(null)
      }
    }

    if (keyOffset !== -1) {
      e.preventDefault()

      const inst = prj.instruments[this.activeInst]
      const noteNum = this.octave * 12 + keyOffset
      if (previewAudioNode && previewGainNode) {
        previewAudioNode.stop()
        previewAudioNode.disconnect()
        previewGainNode.disconnect()
      }
      const [an, gn] = inst.createPlayNode(noteNum, 1.0)
      previewAudioNode = an
      previewGainNode = gn
      previewAudioNode.start()
      previewGainNode.connect(masterOut)

      previewAudioNode.onended = () => {
        previewGainNode.disconnect()
        previewAudioNode.disconnect()
      }

      if (!this.record || this.cursor.column != 0) return

      if (!this.activePattern.steps[this.cursor.track][this.cursor.step]) {
        this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step()
      }
      this.activePattern.steps[this.cursor.track][this.cursor.step].setNote(noteNum)
      this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(parseInt(this.activeInst) + 1)
    }
  },

  bindKeysUp(e) {
    if (previewAudioNode && previewGainNode) {
      previewAudioNode.stop()
      previewAudioNode.disconnect()
      previewGainNode.disconnect()
    }
  },
})
