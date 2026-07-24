// Telifsiz fon müziği üretici — saf JS sentez, hiçbir bağımlılık yok.
// Sakin/kurumsal: yumuşak pad + arpej + bas. Çıktı: public/music.wav (stereo, 44.1k)
import { writeFileSync } from "node:fs";

const SR = 44100;
const DUR = 22.0; // saniye (videoyla eşleşir: 660 kare / 30fps)
const N = Math.floor(SR * DUR);

// Nota frekansları (Hz)
const nf = (name) => {
  const map = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const m = name.match(/^([A-G]#?)(\d)$/);
  const semis = map[m[1]] + (parseInt(m[2]) - 4) * 12; // A4=440 referans
  return 440 * Math.pow(2, (semis - 9) / 12);
};

// İlerleme: Cadd9 - G - Am7 - Fmaj7 (sıcak, yükseltici I-V-vi-IV)
const chords = [
  { bass: "C2", notes: ["C4", "E4", "G4", "D5"] },
  { bass: "G2", notes: ["G3", "B3", "D4", "G4"] },
  { bass: "A2", notes: ["A3", "C4", "E4", "G4"] },
  { bass: "F2", notes: ["F3", "A3", "C4", "F4"] },
];
const chordDur = DUR / chords.length; // ~5.5s her akor

const L = new Float64Array(N);
const R = new Float64Array(N);

// Yumuşak pad sesi: birkaç harmonik + hafif detune (koro hissi)
function padSample(t, freq, phaseOff) {
  const d = freq * 0.003; // detune
  let v = 0;
  v += Math.sin(2 * Math.PI * (freq) * t + phaseOff);
  v += 0.6 * Math.sin(2 * Math.PI * (freq + d) * t + phaseOff * 1.3);
  v += 0.4 * Math.sin(2 * Math.PI * (freq * 2) * t) * 0.5;
  return v / 2.0;
}

// Arpej pluck: hızlı sönümlenen sinüs
function pluck(tt, freq) {
  if (tt < 0) return 0;
  const env = Math.exp(-tt * 6.0);
  return env * (Math.sin(2 * Math.PI * freq * tt) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * tt));
}

const eighth = chordDur / 8; // akor başına 8 arpej notası

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const ci = Math.min(chords.length - 1, Math.floor(t / chordDur));
  const chord = chords[ci];
  const tIn = t - ci * chordDur; // akor içi zaman

  // Akor geçişlerinde yumuşak giriş/çıkış (cross-fade hissi)
  const chordEnv = Math.min(1, tIn / 0.4) * Math.min(1, (chordDur - tIn) / 0.6);

  // Pad (akor notaları)
  let pad = 0;
  chord.notes.forEach((nm, k) => (pad += padSample(t, nf(nm), k * 1.1)));
  pad = (pad / chord.notes.length) * 0.5 * chordEnv;

  // Bas
  const bass = Math.sin(2 * Math.PI * nf(chord.bass) * t) * 0.28 * chordEnv;

  // Arpej (akor notalarını sırayla, yükselen)
  const step = Math.floor(tIn / eighth);
  const arpNote = chord.notes[step % chord.notes.length];
  const arpFreq = nf(arpNote) * 2; // bir oktav tiz, parlak
  const arp = pluck(tIn - step * eighth, arpFreq) * 0.16;

  // Stereo: arpej hafif sağda, pad genişçe
  const mono = pad + bass;
  L[i] = mono + arp * 0.7;
  R[i] = mono + arp * 1.0 + padSample(t, nf(chord.notes[1]), 2.0) * 0.04;
}

// Master: fade in/out + yumuşak limit
const fadeIn = 1.6 * SR, fadeOut = 2.6 * SR;
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const norm = 0.82 / peak;
for (let i = 0; i < N; i++) {
  let g = norm;
  if (i < fadeIn) g *= i / fadeIn;
  if (i > N - fadeOut) g *= (N - i) / fadeOut;
  // yumuşak doygunluk (tanh) — sert clip yerine
  L[i] = Math.tanh(L[i] * g * 1.05);
  R[i] = Math.tanh(R[i] * g * 1.05);
}

// 16-bit PCM stereo WAV yaz
const bytesPerSample = 2, channels = 2;
const dataLen = N * channels * bytesPerSample;
const buf = Buffer.alloc(44 + dataLen);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + dataLen, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(channels, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * channels * bytesPerSample, 28);
buf.writeUInt16LE(channels * bytesPerSample, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(dataLen, 40);
let off = 44;
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), off); off += 2;
  buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), off); off += 2;
}
const out = new URL("./public/music.wav", import.meta.url).pathname;
writeFileSync(out, buf);
console.log("Müzik yazıldı →", out, `(${(dataLen / 1e6).toFixed(1)} MB, ${DUR}s)`);
