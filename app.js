import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { viewFile } from './js/view-file.js'
import { viewPatt } from './js/view-pattern.js'
import { viewHelp } from './js/view-help.js'
import { viewInst } from './js/view-inst.js'
import { viewSong } from './js/view-song.js'
import { Project } from './js/project.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()
export const previewAudioNode = ctx.createGain()

// CHANGE ME
export const VERSION = '0.0.15'

Alpine.data('app', () => ({
  version: VERSION,
  changeView,

  async init() {
    console.log('### Starting JS Tracker')
    console.log(`### Audio state ${ctx.state}`)

    previewAudioNode.connect(ctx.destination)
  },
}))

Alpine.data('viewFile', viewFile)
Alpine.data('viewPatt', viewPatt)
Alpine.data('viewHelp', viewHelp)
Alpine.data('viewInst', viewInst)
Alpine.data('viewSong', viewSong)

// IMPORTANT: Init with an empty project and all defaults
Alpine.store('project', new Project(8))

const storedView = localStorage.getItem('view')
if (!storedView) {
  changeView('patt')
} else {
  Alpine.store('view', storedView)
}

Alpine.start()

export function changeView(view) {
  localStorage.setItem('view', view)
  Alpine.store('view', view)
}
