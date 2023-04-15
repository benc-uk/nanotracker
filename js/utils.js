export function displayStep(s, i) {
  if (s.enabled) {
    return `${toHexPadded(s.instrument.id)} ${s.note} ${floatAsByteHex(s.volume)}`
  } else {
    return `-- -- --`
  }
}

// function to return a float between 0 and 1 as hex 00 to ff
function floatAsByteHex(f) {
  return Math.round(f * 255)
    .toString(16)
    .padStart(2, '0')
    .toLocaleUpperCase()
}

function toHexPadded(v, pad = 2) {
  return v.toString(16).padStart(pad, '0').toLocaleUpperCase()
}
