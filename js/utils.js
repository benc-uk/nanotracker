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
  // if (muted) {
  //   return {
  //     mutedTrack: true,
  //     cursor: cursor.step == stepNum && cursor.track == trkNum && !recMode,
  //   }
  // }

  let classes = {
    stripe: currentStep != stepNum && stepNum % 4 == 0,
    record: cursor.step == stepNum && cursor.track == trkNum && recMode,
    cursor: cursor.step == stepNum && cursor.track == trkNum && !recMode,
    active: currentStep == stepNum,
  }

  return classes
}

function toHexPadded(v, pad = 2) {
  if (v == null) return '-'
  return v.toString(16).padStart(pad, '0').toLocaleUpperCase()
}
