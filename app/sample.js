/** Wrapper around AudioBuffer with a name */
export class Sample {
  /** Index of this sample in parent instrument */
  number = 0

  /** @type {string} */
  name = 'Unnamed'

  /** @type {AudioBuffer} */
  buffer = null

  // Create a empty sample with no audio data
  constructor(num, name) {
    this.name = name
    this.number = num
  }
}
