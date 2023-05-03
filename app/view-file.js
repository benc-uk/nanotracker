import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { loadXM } from './xm-loader.js'
import { ctx } from './main.js'

export const viewFile = () => ({
  filename: 'none',
  fileHandle: null,

  async init() {
    // TODO: REMOVE placeholder code for testing

    this.$nextTick(async () => {
      await this.loadDemoXM()
    })
  },

  async loadDemoXM() {
    try {
      const filename = 'Untitled.xm'
      const resp = await fetch('projects/' + filename)
      const data = await resp.arrayBuffer()
      this.filename = filename

      const prj = await loadXM(data, ctx)

      Alpine.store('project', prj)
    } catch (err) {
      console.error(err)
    }
  },

  async load() {
    const prj = Alpine.store('project')

    const [fileHandle] = await window.showOpenFilePicker()
    this.fileHandle = fileHandle
    this.filename = fileHandle.name
    this.file = await fileHandle.getFile()

    const data = await this.file.arrayBuffer()
    await prj.loadXM(data, ctx)

    Alpine.store('project', prj)
    Alpine.store('view', 'patt')
    localStorage.setItem('view', 'patt')
  },

  async save() {
    alert('Not implemented yet 🤕')
    // const writable = await this.fileHandle.createWritable()
    // await writable.close()
  },

  newProj() {
    Alpine.store('project').clearAll()
    Alpine.store('view', 'patt')
    localStorage.setItem('view', 'patt')
  },
})
