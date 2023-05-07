# NanoTracker

This is a project create a music tracker in using Alpine.JS plus modern ES6 JavaScript & HTML5. It runs entirely in the browser and uses several of the more recent browser APIs such as Web Audio, FileSystem and MIDI

What is a "tracker"? It's a type of sequencer for creating music based on samples. They date back to the 1990s and the 16-bit era, but remain popular today. [Read more](https://en.wikipedia.org/wiki/Music_tracker)

![Screenshot of main editor](https://user-images.githubusercontent.com/14982936/236693095-61d45fa1-b6b7-4e8b-9841-9109bf362bc0.png)

![Screenshot of wave editor](https://user-images.githubusercontent.com/14982936/236667885-bfc0f47e-dcba-4fc3-a6da-476119e350e4.png)

# Features

- Extremely basic tracker feature set, still WIP

### Roadmap & Todo list

In progress:
- Loading XM files... ONGOING!
- Finish pattern editor (effects)
- Sample and instrument editing... ONGOING!
  
Todo:
- Sample vibrato 
- Envelopes
- XM Vol effects
- XM Step effects
- Saving XM files
- Mixer and tracker/master effects
- Select copy & paste
- Song & pattern chain editor
- Loading XMI (?)
- MIDI 
  - input support
  - output
  - clock and transport

# Hosted Version

It's hosted & running from GitHub pages here https://tracker.benco.io/

# Running Locally

I wouldn't bother if I was you, but as it's 100% static with no bundling/build required you can simply start a HTTP server in the root of the project where index.html is.

Alternatively run `make install-tools` and `make serve`

# Implementation Notes

The process of trying to implement XM parsing and compatibility resulted in bouncing off a LOT of 1990s weirdness, bugs & edge cases which have since become enshrined as standards. On top of all this, the documentation is ancient and missing a lot of important details. Here's a brain dump of things I tripped over:

- Reading XM pattern data, the order of data is by tracks/channels, then steps/rows. So if you have an 6 channel file, the step number will increase by 1 after each 6 note block read.
- Reading compressed/uncompressed pattern data:
  - Compressed data has a 1 in the MSB of the first byte along with the bit flags, however the actual data is in the subsequent 1~4 bytes (varies).
  - Uncompressed data has a 0 in the MSB, this byte also contains the note data, there will always be 4 bytes following it. This format is only used when a step has note + inst + vol + effect data
- XM files hold sample data "as is", no sample-rate conversion takes place, and no information about the sample-rate is stored in the XM file.
  - A side effect of this means, all the deeply strange note period and frequency stuff can't be ignored 😖. You you may need to divide the resulting frequency by the output sample rate.  
- Reading sample data is not explained correctly by the docs AT ALL and it's deeply weird. Look at the source of xm-loader.js for some help.