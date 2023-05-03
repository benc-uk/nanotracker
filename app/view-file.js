import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { loadXM } from './xm-loader.js'
import { ctx } from './main.js'
import { Project } from './project.js'

export const viewFile = () => ({
  filename: 'none',
  fileHandle: null,

  async init() {},

  async load() {
    try {
      const [fileHandle] = await window.showOpenFilePicker()
      this.fileHandle = fileHandle
      this.filename = fileHandle.name
      this.file = await fileHandle.getFile()
      const data = await this.file.arrayBuffer()

      const prj = await loadXM(data, ctx)

      Alpine.store('project', prj)
      Alpine.store('view', 'patt')
      localStorage.setItem('view', 'patt')
    } catch (err) {
      Alpine.store('error', err)
      console.error(err)
    }
  },

  async save() {
    alert('Not implemented yet 🤕')
    // const writable = await this.fileHandle.createWritable()
    // await writable.close()
  },

  newProj() {
    const prj = new Project()
    Alpine.store('project', prj)
    Alpine.store('view', 'patt')
  },
})
