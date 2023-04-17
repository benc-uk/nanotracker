import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { Project } from './project.js'

export const viewFile = () => ({
  filename: '',
  projName: '',

  async init() {
    //this.loadDemo()
  },

  async loadDemo() {
    try {
      const prj = new Project(8)

      const resp = await fetch('projects/demo.json')
      const data = await resp.text()

      await prj.load(data)
      Alpine.store('project', prj)
    } catch (err) {
      console.error(err)
    }
  },

  // use local filesystem API to load file
  async load() {
    const [fileHandle] = await window.showOpenFilePicker()
    const file = await fileHandle.getFile()
    const data = await file.text()
    const prj = new Project(8)
    await prj.load(data)

    Alpine.store('project', prj)
    Alpine.store('view', 'patt')
  },
})
