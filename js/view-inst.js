import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { ctx } from '../app.js'

export const viewInst = () => ({
  selectedInstNum: null,
  selectedSampNum: null,

  async loadSample() {
    const prj = Alpine.store('project')
    const [fileHandle] = await window.showOpenFilePicker()
    const file = await fileHandle.getFile()
    const data = await file.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(data)

    prj.instruments[this.selectedInstNum].name = file.name.replace('.wav', '')
    prj.instruments[this.selectedInstNum].samples[this.selectedSampNum].name = file.name
    prj.instruments[this.selectedInstNum].samples[this.selectedSampNum].buffer = audioBuffer
  },
})
