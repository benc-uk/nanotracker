// Create a timer that sends messages to the main thread every 30ms

var timeout
var timeInterval
var expectedTime

this.onmessage = (e) => {
  if (e.data.cmd && e.data.cmd === 'start') {
    if (!e.data.interval) return
    if (e.data.interval <= 0) return

    timeInterval = e.data.interval

    expectedTime = Date.now() + timeInterval
    timeout = setTimeout(ticker, timeInterval)
  }

  if (e.data.cmd && e.data.cmd === 'stop') {
    clearTimeout(timeout)
  }
}

// setInterval(() => {
//   postMessage('tick')
// }, 120)

function ticker() {
  postMessage('tick')
  let drift = Date.now() - expectedTime

  if (drift > 12) {
    console.log('drift: ' + drift)
  }

  expectedTime += timeInterval
  timeout = setTimeout(ticker, timeInterval - drift)
}
