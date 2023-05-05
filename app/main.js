import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { viewFile } from './view-file.js'
import { viewPatt } from './view-pattern.js'
import { viewHelp } from './view-help.js'
import { viewInst } from './view-inst.js'
import { Project } from './project.js'
import { Clock } from './clock.js'
import { loadXM } from './xm-loader.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

// Master output
export const masterOut = ctx.createGain()
masterOut.connect(ctx.destination)

// CHANGE ME
export const VERSION = '0.0.20'

const newProject = new Project(8)

Alpine.data('app', () => ({
  version: VERSION,
  changeView,
  clock: null,

  async init() {
    console.log(`### 🎵 Starting NanoTracker v${VERSION} 🎵`)

    // Create a clock to drive the sequencer, the values here are immediately overwritten
    this.clock = new Clock(ctx, newProject.speed, newProject.bpm)

    this.$refs.dialog.classList.remove('hidden')

    Alpine.effect(() => {
      this.clock.updateRepeat(Alpine.store('project').bpm)
      this.clock.updateTickSpeed(Alpine.store('project').speed)
    })

    // TODO: Remove test code
    try {
      const filename = 'electro.xm'
      const resp = await fetch('projects/' + filename)
      const data = await resp.arrayBuffer()
      this.filename = filename

      const prj = await loadXM(data, ctx)

      Alpine.store('project', prj)
    } catch (err) {
      console.error(err)
    }
  },
}))

Alpine.data('viewFile', viewFile)
Alpine.data('viewPatt', viewPatt)
Alpine.data('viewHelp', viewHelp)
Alpine.data('viewInst', viewInst)

// IMPORTANT: Init with an empty project and all defaults
Alpine.store('project', newProject)
Alpine.store('octave', 5) // Shared across pattern & sample editors

const storedView = localStorage.getItem('view')
if (!storedView) {
  changeView('inst')
} else {
  changeView(storedView)
}

Alpine.start()

export function changeView(view) {
  localStorage.setItem('view', view)
  Alpine.store('view', view)
}
