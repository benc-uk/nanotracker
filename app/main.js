import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { viewFile } from './view-file.js'
import { viewPatt } from './view-pattern.js'
import { viewHelp } from './view-help.js'
import { viewInst } from './view-inst.js'
import { viewSong } from './view-song.js'
import { Project } from './project.js'
import { Clock } from './clock.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

// Master output
export const masterOut = ctx.createGain()
masterOut.connect(ctx.destination)

// CHANGE ME
export const VERSION = '0.0.18'

const newProject = new Project(8)

Alpine.data('app', () => ({
  version: VERSION,
  changeView,
  clock: null,

  async init() {
    console.log('### 🎵 Starting JS Tracker ')

    // Create a clock to drive the sequencer, the values here are immediately overwritten
    this.clock = new Clock(ctx, newProject.speed, newProject.bpm)
  },
}))

Alpine.data('viewFile', viewFile)
Alpine.data('viewPatt', viewPatt)
Alpine.data('viewHelp', viewHelp)
Alpine.data('viewInst', viewInst)
Alpine.data('viewSong', viewSong)

// IMPORTANT: Init with an empty project and all defaults
Alpine.store('project', newProject)

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
