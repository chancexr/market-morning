const fs = require('fs');
const path = require('path');

const sampleRate = 44100;

function makeWave(filename, notes) {
  const duration = notes.reduce((total, note) => Math.max(total, note.start + note.duration), 0);
  const sampleCount = Math.ceil(duration * sampleRate);
  const samples = new Int16Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    let value = 0;
    for (const note of notes) {
      const localTime = time - note.start;
      if (localTime < 0 || localTime > note.duration) continue;
      const attack = Math.min(1, localTime / 0.015);
      const decay = Math.exp(-4.2 * localTime / note.duration);
      value += Math.sin(2 * Math.PI * note.frequency * localTime) * attack * decay * note.volume;
      value += Math.sin(2 * Math.PI * note.frequency * 2.01 * localTime) * attack * decay * note.volume * 0.24;
    }
    samples[index] = Math.max(-32767, Math.min(32767, Math.round(value * 32767)));
  }

  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) buffer.writeInt16LE(samples[index], 44 + index * 2);
  fs.writeFileSync(filename, buffer);
}

const outputDirectory = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outputDirectory, { recursive: true });

makeWave(path.join(outputDirectory, 'market-bell.wav'), [
  { frequency: 659.25, start: 0, duration: 1.4, volume: 0.48 },
  { frequency: 987.77, start: 0.16, duration: 1.25, volume: 0.32 },
]);

makeWave(path.join(outputDirectory, 'gentle-chime.wav'), [
  { frequency: 523.25, start: 0, duration: 0.65, volume: 0.32 },
  { frequency: 659.25, start: 0.38, duration: 0.7, volume: 0.34 },
  { frequency: 783.99, start: 0.78, duration: 1.05, volume: 0.38 },
]);
