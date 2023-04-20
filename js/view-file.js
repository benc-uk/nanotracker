import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

export const viewFile = () => ({
  filename: 'none',
  fileHandle: null,

  async init() {
    // TODO: REMOVE placeholder code for testing
    this.loadDemo()
  },

  async loadDemo() {
    try {
      const prj = Alpine.store('project')

      const resp = await fetch('projects/demo.json')
      const data = await resp.text()
      this.filename = 'demo.json'

      await prj.parseJSON(data)
      Alpine.store('project', prj)
    } catch (err) {
      console.error(err)
    }
  },

  async load() {
    const [fileHandle] = await window.showOpenFilePicker()
    this.fileHandle = fileHandle
    this.filename = fileHandle.name
    this.file = await fileHandle.getFile()

    const data = await this.file.text()
    await prj.parseJSON(data)

    Alpine.store('project', prj)
    Alpine.store('view', 'patt')
  },

  async save() {
    alert('Not implemented yet 🤕')
    // const writable = await this.fileHandle.createWritable()
    // await writable.close()
  },

  newProj() {
    Alpine.store('project').clearAll()
    Alpine.store('view', 'patt')
  },
})
