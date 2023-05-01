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
  sampleVol: 1,
  samplePan: 0.5,
  sampleRelNote: 0,
  sampleLoopMode: SAMP_MODE_NONE,

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

    this.$watch('sampleVol', (v) => {
      this.sample.volume = v / 64
    })

    this.$watch('samplePan', (p) => {
      this.sample.pan = p / 128
    })

    this.$watch('sampleRelNote', (n) => {
      this.sample.relativeNote = parseInt(n)
    })

    this.$watch('sampleLoopMode', (m) => {
      this.sample.loopMode = parseInt(m)
      this.drawSample()
    })

    this.$watch('sample', () => {
      this.sampleVol = this.sample.volume * 64
      this.samplePan = this.sample.pan * 128
      this.sampleRelNote = this.sample.relativeNote
      this.sampleLoopMode = this.sample.loopMode
      this.drawSample()
    })

    // TODO: Improve the UX of this
    this.$refs.sampleView.addEventListener('click', (e) => {
      const canvas = this.$refs.sampleView

      // Clicks in upper half set loop start, lower half set loop end
      if (e.offsetY < canvas.offsetHeight / 2) {
        this.sample.loopStart = e.offsetX / canvas.offsetWidth
      } else {
        let end = e.offsetX / canvas.offsetWidth
        if (end < this.sample.loopStart) end = this.sample.loopStart
        this.sample.loopLen = end - this.sample.loopStart
      }

      this.drawSample()
    })
  },

  changeMode() {
    this.sampleLoopMode++
    if (this.sampleLoopMode > SAMP_MODE_PINGPONG) this.sampleLoopMode = SAMP_MODE_NONE
  },

  get loopModeText() {
    switch (this.sampleLoopMode) {
      case SAMP_MODE_NONE:
        return 'None'
      case SAMP_MODE_FORWARD:
        return 'Forward'
      case SAMP_MODE_PINGPONG:
        return 'Ping Pong'
    }
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
    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0
      let max = -1.0
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp))
    }

    if (this.sampleLoopMode !== SAMP_MODE_NONE) {
      const loopStart = this.sample.loopStart * canvas.width
      const loopEnd = (this.sample.loopStart + this.sample.loopLen) * canvas.width
      ctx.fillStyle = 'rgba(0, 255, 255, 0.25)'
      ctx.fillRect(loopStart, 0, loopEnd - loopStart, canvas.height)

      // draw loop start/end lines
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
    const prj = Alpine.store('project')
    const [fileHandle] = await window.showOpenFilePicker()
    const file = await fileHandle.getFile()
    const data = await file.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(data)

    prj.instruments[this.selectedInstNum].name = file.name.replace('.wav', '')
    prj.instruments[this.selectedInstNum].samples[this.selectedSampNum].name = file.name
    prj.instruments[this.selectedInstNum].samples[this.selectedSampNum].buffer = audioBuffer

    this.drawSample()
  },
})
