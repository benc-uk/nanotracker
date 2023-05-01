export const SAMP_MODE_NONE = 0
export const SAMP_MODE_FORWARD = 1
export const SAMP_MODE_PINGPONG = 2
// export const SAMP_MODE_ONESHOT = 3

/** Wrapper around AudioBuffer with a name */
export class Sample {
  /** Index of this sample within parent instrument */
  number = 0

  /** @type {string} Name of sample */
  name = 'Unnamed'

  /** @type {AudioBuffer} The buffer of audio data used to assign to audio nodes for playing */
  buffer = null

  /** @type {number} Volume of this sample 0-1 range */
  volume = 1

  /** @type {number} Pan of this sample, 0-1 range */
  pan = 128

  /** @type {number} Fine tune of this sample, -128 to 127 */
  fineTune = 0

  /** @type {number} Loop start point, 0-1 range (as factor of sample length) */
  loopStart = 0

  /** @type {number} Length of loop section, 0-1 range (as factor of sample length)) */
  loopLen = 0

  /** @type {number} Loop mode, 0 = none, 1 = forward, 2 = ping pong */
  loopMode = SAMP_MODE_NONE

  /** @type {boolean} True if this sample is 16 bit, false if 8 bit */
  is16Bit = false

  /** @type {number} Relative note of this sample, -48 to 71 */
  relativeNote = 0

  // Create a empty sample with no audio data
  constructor(num, name) {
    this.name = name
    this.number = num
  }

  toString() {
    return `${this.name} (${this.number}) vol:${this.volume} rel:${this.relativeNote}`
  }
}
