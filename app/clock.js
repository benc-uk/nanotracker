const tickMagic = 2.5 // 125BPM = 50hz = 2.5ms for legacy reasons

export class Clock {
  subTicks = 0
  clock
  clockTimer
  stopped = false
  tickSpeed

  constructor(ctx, tickSpeed, speed) {
    this.tickSpeed = tickSpeed

    this.clock = new WAAClock(ctx)
    this.clock.start()

    this.clockTimer = this.clock.setTimeout(() => {
      if (this.stopped) return

      // We need to keep track of the number of ticks
      this.subTicks++
      if (this.subTicks >= this.tickSpeed) {
        // Use a custom event to send the tick to any listeners
        window.dispatchEvent(new CustomEvent('clockTick'))
        this.subTicks = 0
      }
    }, ctx.currentTime)

    this.clockTimer.repeat(tickMagic / speed)
  }

  updateRepeat(speed) {
    this.clockTimer.repeat(tickMagic / speed)
  }

  updateTickSpeed(tickSpeed) {
    this.subTicks = 0
    this.tickSpeed = tickSpeed
  }
}
