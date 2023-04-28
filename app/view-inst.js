import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { ctx } from './main.js'

export const viewInst = () => ({
  selectedInstNum: null,
  selectedSampNum: null,

  init() {
    this.$watch('selectedInstNum', (newInst) => {
      this.drawSample()
      this.$dispatch('instchange', newInst)
    })
    this.$watch('selectedSampNum', () => this.drawSample())
  },

  drawSample() {
    if (!this.selectedInstNum || !this.selectedSampNum) return

    const canvas = this.$refs.sampleView
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const prj = Alpine.store('project')
    const buffer = prj.instruments[this.selectedInstNum].samples[this.selectedSampNum].buffer
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
    ctx.fillStyle = '#ff8800'
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
