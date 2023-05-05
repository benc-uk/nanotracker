import Alpine from 'https://unpkg.com/alpinejs@3.12.0/dist/module.esm.js'

import { masterOut } from './main.js'
import { Step } from './step.js'
import { toHex } from './utils.js'

// prettier-ignore
const keyboardKeys = ['z','s','x','d','c','v','g','b','h','n','j','m','q','2','w','3','e','r','5','t','6','y','7','u','i','9','o','0','p']
const hexKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f']

let previewGainNode
let previewAudioNode
let previewKeyDown = false

export function editorKeys(e) {
  if (Alpine.store('view') !== 'patt') return

  const prj = Alpine.store('project')
  const keyOffset = keyboardKeys.indexOf(e.key)

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    this.cursor.step--
    if (this.cursor.step <= 0) {
      this.cursor.step = this.activePattern.length - 1
    }
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    this.cursor.step++
    if (this.cursor.step >= this.activePattern.length) {
      this.cursor.step = 0
    }
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault()

    if (this.record) {
      this.cursor.column--
      if (this.cursor.column < 0) {
        this.cursor.track--
        if (this.cursor.track < 0) {
          this.cursor.track = 0
          this.cursor.column = 0
        } else {
          this.cursor.column = 3
        }
      }
      return
    }

    this.cursor.track--
    if (this.cursor.track < 0) this.cursor.track = 0
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault()

    if (this.record) {
      this.cursor.column++
      if (this.cursor.column > 7) {
        this.cursor.track++
        if (this.cursor.track >= prj.trackCount) {
          this.cursor.track = prj.trackCount - 1
          this.cursor.column = 7
        } else {
          this.cursor.column = 0
        }
      }
      return
    }

    this.cursor.track++
    if (this.cursor.track >= prj.trackCount) this.cursor.track = prj.trackCount - 1
  }

  if (e.key === 'Escape') {
    e.preventDefault()
    this.stop()
    this.recordMode()
  }

  if (e.key === ' ' && e.ctrlKey) {
    e.preventDefault()
    this.loopPattern = true
    this.currentStep = 0
    this.record = false
    this.play()
    return
  }

  if (e.key === ' ' && e.shiftKey) {
    e.preventDefault()
    this.record = false
    this.play()
    return
  }

  if (e.key === ' ') {
    e.preventDefault()
    if (!this.stopped) {
      this.stop()
    } else {
      this.currentStep = 0
      this.loopPattern = false
      this.record = false
      this.play()
    }
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    this.playCurrentRow()
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    this.cursor.track++
    if (this.cursor.track >= prj.trackCount) this.cursor.track = 0
    this.cursor.column = 0
    return
  }

  if (e.key === 'Home') {
    e.preventDefault()
    this.cursor.step = 0
    return
  }

  if (e.key === 'PageDown') {
    e.preventDefault()
    this.cursor.step += 16
    if (this.cursor.step >= this.activePattern.length) {
      this.cursor.step = this.activePattern.length - 1
    }
    return
  }

  if (e.key === 'PageUp') {
    e.preventDefault()
    this.cursor.step -= 16
    if (this.cursor.step < 0) {
      this.cursor.step = 0
    }
    return
  }

  if (e.key === 'End') {
    e.preventDefault()
    this.cursor.step = this.activePattern.length - 1
    this.followPlayingStep(this.cursor.step)
    return
  }

  if (this.record && this.cursor.column > 0 && e.key !== 'Delete') {
    if (hexKeys.indexOf(e.key) > -1) {
      e.preventDefault()

      if (!this.activePattern.steps[this.cursor.track][this.cursor.step]) {
        this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step()
      }

      let instHex = toHex(this.activePattern.steps[this.cursor.track][this.cursor.step].instNum)
      let volHex = toHex(this.activePattern.steps[this.cursor.track][this.cursor.step].volume * 64)
      switch (this.cursor.column) {
        case 1:
          instHex = e.key + instHex[1]
          this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(parseInt(instHex, 16))
          break
        case 2:
          instHex = instHex[0] + e.key
          this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(parseInt(instHex, 16))
          break
        case 3:
          volHex = e.key + volHex[1]
          if (parseInt(volHex, 16) > 64) volHex = '40'
          this.activePattern.steps[this.cursor.track][this.cursor.step].setVol(parseInt(volHex, 16) / 64)
          break
        case 4:
          volHex = volHex[0] + e.key
          if (parseInt(volHex, 16) > 64) volHex = '40'
          this.activePattern.steps[this.cursor.track][this.cursor.step].setVol(parseInt(volHex, 16) / 64)
          break
      }
    }

    return
  }

  if (e.key === 'Delete') {
    e.preventDefault()
    if (!this.record) return

    if (this.cursor.column >= 0 && this.cursor.column <= 2) {
      this.activePattern.steps[this.cursor.track][this.cursor.step].setNote(null)
      this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(null)
    }

    if (this.cursor.column >= 3 && this.cursor.column <= 4) {
      this.activePattern.steps[this.cursor.track][this.cursor.step].setVol(null)
    }
  }

  if (keyOffset !== -1) {
    e.preventDefault()
    const noteNum = (this.octave - 1) * 12 + (keyOffset + 1)

    // Preview note
    if (!previewKeyDown) {
      previewInst(prj.instruments[this.activeInst], noteNum)
      previewKeyDown = true
    }

    if (!this.record || this.cursor.column != 0) return

    if (!this.activePattern.steps[this.cursor.track][this.cursor.step]) {
      this.activePattern.steps[this.cursor.track][this.cursor.step] = new Step()
    }

    this.activePattern.steps[this.cursor.track][this.cursor.step].setNote(noteNum)
    this.activePattern.steps[this.cursor.track][this.cursor.step].setInst(parseInt(this.activeInst) + 1)

    console.log('this.stepJump', this.stepJump)
    this.cursor.step += parseInt(this.stepJump)
    if (this.cursor.step >= this.activePattern.length) {
      this.cursor.step = this.cursor.step - this.activePattern.length
    }
  }
}

export function keysUp(e) {
  previewKeyDown = false

  if (previewAudioNode && previewGainNode) {
    previewAudioNode.stop()
    previewAudioNode.disconnect()
    previewGainNode.disconnect()
  }
}

export function instKeys(e) {
  if (Alpine.store('view') !== 'inst') return

  const keyOffset = keyboardKeys.indexOf(e.key)
  const octave = 5

  if (keyOffset !== -1) {
    e.preventDefault()

    // Preview note
    if (!previewKeyDown) {
      previewInst(Alpine.store('project').instruments[this.selectedInstNum], octave * 12 + keyOffset)
      previewKeyDown = true
    }
  }
}

function previewInst(inst, noteNum) {
  if (!inst) return

  if (previewAudioNode && previewGainNode) {
    previewAudioNode.stop()
    previewAudioNode.disconnect()
    previewGainNode.disconnect()
  }

  const [an, gn] = inst.createPlayNodes(noteNum, 1.0)
  previewAudioNode = an
  previewGainNode = gn
  previewAudioNode.start()
  previewGainNode.connect(masterOut)

  // previewAudioNode.onended = () => {
  //   previewGainNode.disconnect()
  //   previewAudioNode.disconnect()
  // }
}
