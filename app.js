import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { viewFile } from './js/view-file.js'
import { viewPatt } from './js/view-pattern.js'
import { viewHelp } from './js/view-help.js'
import { viewInst } from './js/view-inst.js'

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
Alpine.data('viewInst', viewInst)

Alpine.store('project', '')
Alpine.store('view', 'inst')

Alpine.start()
