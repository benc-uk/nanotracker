import { ctx } from '../app.js'

export function stepText(step) {
  if (step) {
    return `
    ${toHexPadded(step.instrument.number)} 
    ${step.note} 
    ${toHexPadded(step.volume)} 
    ${step.effect1type}${toHexPadded(step.effect1val1, 1)}${toHexPadded(step.effect1val2, 1)}`
  } else {
    return `-- -- -- ---`
  }
}

export function stepClass(currentStep, cursor, stepNum, trkNum, recMode) {
  let classes = {
    stripe: currentStep != stepNum && stepNum % 4 == 0,
    record: cursor.step == stepNum && cursor.track == trkNum && recMode,
    cursor: cursor.step == stepNum && cursor.track == trkNum && !recMode,
    active: currentStep == stepNum,
  }

  return classes
}

export function toHexPadded(v, pad = 2) {
  if (v == null) return '-'
  return v.toString(16).padStart(pad, '0').toLocaleUpperCase()
}

/**
 * Load sample file from URL
 *
 * @param {string} url - URL of sample file
 */
export async function loadSampleURL(url) {
  try {
    const resp = await fetch(url)
    const buff = await resp.arrayBuffer()

    /** @type {AudioBuffer} */
    const audioBuffer = await ctx.decodeAudioData(buff)

    return audioBuffer
  } catch (err) {
    console.error(err)
  }
}
