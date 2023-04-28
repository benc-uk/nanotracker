import { ctx } from './main.js'

export function toHex(v, pad = 2) {
  const empty = ''.padStart(pad, '·')

  if (v === undefined) return empty
  if (v == null) return empty

  return v.toString(16).padStart(pad, '0').toLocaleUpperCase()
}

export function toNote(noteNum) {
  const empty = '···'

  if (noteNum === undefined) return empty
  if (noteNum == null) return empty

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G', 'A', 'A#', 'B']
  const octave = Math.floor(noteNum / 12) - 1
  const note = noteNum % 12

  let out = `${notes[note]}${octave}`
  if (out.length === 2) out += ' '
  return out
}

/**
 * Load sample file from URL
 *
 * @param {string} url - URL or path of sample file
 * @returns {Promise<AudioBuffer>} - AudioBuffer
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
