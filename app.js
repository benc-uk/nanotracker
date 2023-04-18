import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { Project } from './js/project.js'
import { viewFile } from './js/view-file.js'
import { viewPatt } from './js/view-pattern.js'
import { viewHelp } from './js/view-help.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

Alpine.data('app', () => ({
  async init() {
    console.log('### Starting JS Tracker')
    console.log(`### Audio state ${ctx.state}`)
  },
}))

Alpine.data('viewFile', viewFile)
Alpine.data('viewPatt', viewPatt)
Alpine.data('viewHelp', viewHelp)
Alpine.store('project', new Project(8))
Alpine.store('view', 'patt')
Alpine.start()
