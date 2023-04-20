export class Sample {
  number = 0
  name = 'Unnamed'

  /** @type {AudioBuffer} */
  buffer = null

  // Create a empty sample with no audio data
  constructor(num, name) {
    this.name = name
    this.number = num
  }
}
