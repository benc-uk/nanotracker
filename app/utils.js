import { ctx } from './main.js'

/**
 * Converts to HEX strings with optional padding
 * @param {number} num Number to convert
 * @returns HEX string
 */
export function toHex(num, pad = 2) {
  const empty = ''.padStart(pad, '·')

  if (num === undefined) return empty
  if (num == null) return empty

  return num.toString(16).padStart(pad, '0').toLocaleUpperCase()
}

/**
 * Convert a tracker note number to a string
 * @param {number} noteNum Raw tracker note number 1~96
 * @returns String representation of note
 */
export function toNote(noteNum) {
  const empty = '···'

  if (noteNum === undefined) return empty
  if (noteNum == null) return empty

  const notes = ['C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-']
  const octave = Math.floor((noteNum - 1) / 12)
  const note = (noteNum - 1) % 12

  return `${notes[note]}${octave}`
}

/**
 * Load sample file from URL
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

export function getSampleRateForPeriod(period) {
  return 8363 * Math.pow(2, (4608 - period) / 768)
}
