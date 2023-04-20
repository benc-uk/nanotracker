import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { viewFile } from './js/view-file.js'
import { viewPatt } from './js/view-pattern.js'
import { viewHelp } from './js/view-help.js'
import { viewInst } from './js/view-inst.js'
import { viewSong } from './js/view-song.js'
import { Project } from './js/project.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

// CHANGE ME
export const VERSION = '0.0.12'

Alpine.data('app', () => ({
  version: VERSION,

  async init() {
    console.log('### Starting JS Tracker')
    console.log(`### Audio state ${ctx.state}`)
  },
}))

Alpine.data('viewFile', viewFile)
Alpine.data('viewPatt', viewPatt)
Alpine.data('viewHelp', viewHelp)
Alpine.data('viewInst', viewInst)
Alpine.data('viewSong', viewSong)

// IMPORTANT: Init with an empty project and all defaults
Alpine.store('project', new Project())
Alpine.store('view', 'patt')

Alpine.start()
