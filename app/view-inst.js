import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { ctx } from './main.js'
import { toHex } from './utils.js'
import { Sample, SAMP_MODE_FORWARD, SAMP_MODE_NONE, SAMP_MODE_PINGPONG } from './sample.js'
import { instKeys, keysUp } from './key-bindings.js'

export const viewInst = () => ({
  selectedInstNum: null,
  selectedSampNum: null,
  /** @type {Sample} */
  sample: null,
  drawingLoop: false,
  sampleMode: true,

  init() {
    window.addEventListener('keydown', instKeys.bind(this))
    window.addEventListener('keyup', keysUp.bind(this))

    this.$watch('selectedInstNum', (i) => {
      this.selectedSampNum = 0
      this.sample = Alpine.store('project').instruments[this.selectedInstNum].samples[0]
    })

    this.$watch('selectedSampNum', (s) => {
      this.sample = Alpine.store('project').instruments[this.selectedInstNum].samples[s]
    })

    this.$watch('sample', () => {
      this.drawSample()
    })

    this.$refs.sampleView.addEventListener('mousedown', (e) => {
      if (!this.sample) return
      if (this.sample.loopMode == SAMP_MODE_NONE) return

      this.drawingLoop = true
      const canvas = this.$refs.sampleView

      this.sample.loopStart = e.offsetX / canvas.offsetWidth
      this.sample.loopLen = this.drawSample()
    })

    this.$refs.sampleView.addEventListener('mousemove', (e) => {
      if (!this.drawingLoop || !this.sample) return
      if (this.sample.loopMode == SAMP_MODE_NONE) return

      const canvas = this.$refs.sampleView
      let end = e.offsetX / canvas.offsetWidth
      if (end < this.sample.loopStart) end = canvas.offsetWidth
      this.sample.loopLen = end - this.sample.loopStart
      this.drawSample()
    })

    this.$refs.sampleView.addEventListener('mouseup', () => {
      this.drawingLoop = false
    })

    this.$refs.sampleView.addEventListener('mouseleave', () => {
      this.drawingLoop = false
    })
  },

  get sampleVol() {
    return this.sample?.volume * 64
  },

  set sampleVol(v) {
    this.sample.volume = v / 64
  },

  get samplePan() {
    return this.sample?.pan * 128
  },

  set samplePan(p) {
    this.sample.pan = p / 128
  },

  get sampleRelNote() {
    return this.sample?.relativeNote
  },

  set sampleRelNote(n) {
    this.sample.relativeNote = parseInt(n)
  },

  get sampleLoopMode() {
    switch (this.sample?.loopMode) {
      case SAMP_MODE_NONE:
        return 'None'
      case SAMP_MODE_FORWARD:
        return 'Forward'
      case SAMP_MODE_PINGPONG:
        return 'Ping Pong'
    }
  },

  incSampleLoopMode() {
    this.sample.loopMode++
    if (this.sample.loopMode > SAMP_MODE_PINGPONG) this.sample.loopMode = SAMP_MODE_NONE
    if (this.sample.loopMode == SAMP_MODE_FORWARD) {
      this.sample.loopStart = 0
      this.sample.loopLen = 1
    }
  },

  get sampleFine() {
    return this.sample?.fineTune
  },

  set sampleFine(f) {
    this.sample.fineTune = parseInt(f)
  },

  drawSample() {
    if (!this.sample) return

    const canvas = this.$refs.sampleView
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const buffer = this.sample.buffer
    if (!buffer) return

    // Draw middle ine
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.stroke()

    // Draw the buffer as a waveform on the canvas
    const data = buffer.getChannelData(0)
    const step = Math.ceil(data.length / canvas.width)
    const amp = canvas.height / 2
    ctx.fillStyle = '#00bb00'
    ctx.strokeStyle = '#00bb00'

    let x = 0
    for (; x < canvas.width; x++) {
      let min = 1.0
      let max = -1.0
      let datum = -30
      for (let j = 0; j < step; j++) {
        datum = data[x * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      if (datum === undefined) break

      ctx.fillRect(x, amp, 1, min * amp)
      ctx.fillRect(x, amp, 1, max * amp)
    }

    if (this.sample?.loopMode !== SAMP_MODE_NONE) {
      let loopStart = this.sample.loopStart * canvas.width
      let loopEnd = (this.sample.loopStart + this.sample.loopLen) * canvas.width
      if (loopEnd > x) loopEnd = x

      ctx.fillStyle = 'rgba(0, 255, 255, 0.25)'
      ctx.fillRect(loopStart, 0, loopEnd - loopStart, canvas.height)

      // Show start & end seconds
      const startSecs = this.sample.loopStart * buffer.duration
      const endSecs = (this.sample.loopStart + this.sample.loopLen) * buffer.duration
      ctx.font = '12px monospace'
      ctx.fillStyle = 'rgba(50, 255, 255, 1)'
      ctx.fillText(startSecs.toFixed(2), loopStart + 2, 12)
      ctx.fillText(endSecs.toFixed(2), loopEnd - 2 - 30, canvas.height - 4)

      // Draw loop start/end lines
      ctx.beginPath()
      ctx.moveTo(loopStart, 0)
      ctx.lineTo(loopStart, canvas.height)
      ctx.strokeStyle = 'rgba(0, 255, 255, 1)'
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(loopEnd, 0)
      ctx.lineTo(loopEnd, canvas.height)
      ctx.strokeStyle = 'rgba(255, 255, 0, 1)'
      ctx.stroke()
    }
  },

  async loadSample() {
    try {
      const prj = Alpine.store('project')
      const [fileHandle] = await window.showOpenFilePicker()
      const file = await fileHandle.getFile()
      const data = await file.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(data)

      let inst = prj.instruments[this.selectedInstNum]
      if (inst.name == '-') inst.name = file.name.replace('.wav', '')
      if (inst.name.length > 22) inst.name = inst.name.substring(0, 22)

      let samp = inst.samples[this.selectedSampNum]
      samp.name = file.name
      samp.buffer = audioBuffer

      if (samp.name.length > 22) {
        samp.name = samp.name.substring(0, 22)
      }

      this.drawSample()
    } catch (err) {
      Alpine.store('error', err)
      console.error(err)
    }
  },
})
