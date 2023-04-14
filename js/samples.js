import { ctx } from '../app.js'

/**
 * Move the player to a new zone
 *
 * @param {string} url - URL of sample file
 */
export async function loadSample(url) {
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
