import { ctx, masterOut } from './main.js'
import { Step } from './step.js'

const analyserSize = 512
let scale = 2.0

export class Track {
  number = 0
  muted = false

  /** @type {GainNode} */
  activeOutNode = null

  /** @type {AudioBufferSourceNode} */
  activeAudioNode = null

  /** @type {GainNode} */
  trackOutput

  nodeList = []

  volume = 1.0

  /**
   * @param {number} num - Track number
   * */
  constructor(num) {
    this.number = num
    this.muted = false
    this.trackOutput = null

    this.trackOutput = ctx.createGain()

    this.trackOutput.gain.value = this.volume
    this.trackOutput.connect(masterOut)

    this.activeAudioNode = null
    this.activeOutNode = null

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = analyserSize
    this.trackOutput.connect(this.analyser)

    this.frameCount = 0
    requestAnimationFrame(this.drawPeakMeter.bind(this))
    this.sampleBuffer = new Float32Array(this.analyser.fftSize)
  }

  drawPeakMeter() {
    // Memoize the canvas and canvas context
    if (!this.canvas) {
      this.canvas = document.querySelector('#meter_' + this.number)
      this.canvasCtx = this.canvas.getContext('2d')

      const gradient = this.canvasCtx.createLinearGradient(this.canvas.width, 0, 0, 0)
      gradient.addColorStop(0, '#ff0000')
      gradient.addColorStop(0.3, '#ffff00')
      gradient.addColorStop(0.8, '#00dd00')
      gradient.addColorStop(1, '#005500')
      this.canvasCtx.fillStyle = gradient
    }

    this.analyser.getFloatTimeDomainData(this.sampleBuffer)

    let max = 0
    for (let i = 0; i < analyserSize; i++) {
      if (this.sampleBuffer[i] > max) {
        max = this.sampleBuffer[i]
      }
    }

    // max = 1

    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.canvasCtx.fillRect(0, this.canvas.height, max * scale * this.canvas.width, -this.canvas.height)

    requestAnimationFrame(this.drawPeakMeter.bind(this))
  }

  setGain(gain) {
    this.trackOutput.gain.value = gain
  }

  stop() {
    if (this.activeAudioNode || this.activeOutNode) {
      this.activeAudioNode.stop(0)
      this.activeOutNode.disconnect()
      this.activeAudioNode.disconnect()
    }
  }

  setMute(mute) {
    this.muted = mute
    if (mute) {
      this.trackOutput.gain.value = 0
    } else {
      this.trackOutput.gain.value = this.volume
    }
  }

  /**
   * Play a step on this track
   *
   * @param {Step} step - Step to play on this tracks audio channel
   */
  activateStep(step, instruments) {
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO: !! MAJOR !! This logic needs to be reworked
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    if (!step || !step.note) {
      return
    }

    if (step.noteOff) {
      this.stop()
      return
    }

    if (step.volume != null && this.activeOutNode && step.note == null) {
      this.activeOutNode.gain.value = step.volume
      return
    }

    // This makes the tracks monophonic and cut off previous notes
    if (this.activeAudioNode && this.activeOutNode) {
      this.activeAudioNode.disconnect()
      this.activeOutNode.disconnect()
    }

    const inst = instruments[step.instNum - 1]
    if (!inst) {
      return
    }

    const [audioNode, outNode] = inst.createPlayNodes(step.note, step.volume)
    this.activeOutNode = outNode
    this.activeAudioNode = audioNode
    this.activeAudioNode.start()
    this.activeOutNode.connect(this.trackOutput)
  }
}
