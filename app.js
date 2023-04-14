import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'
import { Project } from './js/project.js'

/** @type {AudioContext} */
export const ctx = new AudioContext()

/** @type {Project} */
var proj

let clock
let clockEvent

async function init() {
  console.log('### Starting')
  console.log(`### Audio state ${ctx.state}`)
  proj = new Project()
  await proj.load()
  clock = new WAAClock(ctx)
  clock.start()

  Alpine.store('step', 0)

  Alpine.data('t0', () => ({
    track: proj.patterns[0].tracks[0],
    displayStep,
    activeStep: 0,
  }))

  Alpine.data('t1', () => ({
    track: proj.patterns[0].tracks[1],
    displayStep,
    activeStep: 0,
  }))

  Alpine.data('t2', () => ({
    track: proj.patterns[0].tracks[2],
    displayStep,
    activeStep: 0,
  }))

  Alpine.data('t3', () => ({
    track: proj.patterns[0].tracks[3],
    displayStep,
    activeStep: 0,
  }))

  Alpine.start()
}

function play() {
  console.log('### Play')

  if (clockEvent) {
    return
  }

  if (ctx.state === 'suspended') ctx.resume()

  proj.patterns[0].currentStep = 0

  clockEvent = clock
    .callbackAtTime(() => {
      proj.patterns[0].tick()
      Alpine.store('step', proj.patterns[0].currentStep)
    }, ctx.currentTime)
    .tolerance({ early: 0.02, late: 0.02 })
    .repeat(0.12)
}

function stop() {
  if (!clockEvent) return

  clockEvent.clear()
  proj.patterns[0].currentStep = 0

  clockEvent = null
}

window.addEventListener('load', init)
document.querySelector('#playBtn').addEventListener('click', play)
document.querySelector('#stopBtn').addEventListener('click', stop)

function displayStep(s, i) {
  if (s.enabled) {
    return `${toHexPadded(i)}: ${s.instrument.id} ${s.note} ${asHex255(s.volume)}`
  } else {
    return `${toHexPadded(i)}: -- -- --`
  }
}

// function to return a float between 0 and 1 as hex 00 to ff
function asHex255(f) {
  return Math.round(f * 255)
    .toString(16)
    .padStart(2, '0')
    .toLocaleUpperCase()
}

function toHexPadded(p) {
  return p.toString(16).padStart(2, '0').toLocaleUpperCase()
}
