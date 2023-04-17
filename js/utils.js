export function displayStep(step) {
  if (step) {
    return `
    ${toHexPadded(step.instrument.id)} 
    ${step.note} 
    ${toHexPadded(step.volume)} 
    ${step.effect1type}${toHexPadded(step.effect1val1, 1)}${toHexPadded(step.effect1val2, 1)}`
  } else {
    return `-- -- -- ---`
  }
}

export function stepClass(currentStep, cursor, stepNum, trkNum) {
  return {
    cursor: cursor.step == stepNum && cursor.track == trkNum,
    active: currentStep == stepNum,
    stripe: stepNum % 4 == 0,
  }
}

function toHexPadded(v, pad = 2) {
  if (v == null) return '-'
  return v.toString(16).padStart(pad, '0').toLocaleUpperCase()
}
