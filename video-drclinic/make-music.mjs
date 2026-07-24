// Telifsiz ENERJİK fon müziği — saf JS sentez. Kick + hat + bas + arpej + riser.
import { writeFileSync } from "node:fs";

const SR = 44100;
const DUR = 18.2; // 546 kare / 30fps
const N = Math.floor(SR * DUR);
const BPM = 125;
const beat = 60 / BPM;
const L = new Float64Array(N), R = new Float64Array(N);

// deterministik gürültü
let seed = 12345;
const noise = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed / 0x3fffffff) - 1; };

const nf = (name) => {
  const map = { C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11 };
  const m = name.match(/^([A-G]#?)(\d)$/);
  const s = map[m[1]] + (parseInt(m[2]) - 4) * 12;
  return 440 * Math.pow(2, (s - 9) / 12);
};

// Akorlar: Am - F - C - G (enerjik vi-IV-I-V), 2 beat'te bir değişim
const prog = [
  { root: "A1", notes: ["A3","C4","E4"] },
  { root: "F1", notes: ["F3","A3","C4"] },
  { root: "C2", notes: ["C4","E4","G4"] },
  { root: "G1", notes: ["G3","B3","D4"] },
];

const env = (t, a, d) => t < 0 ? 0 : t < a ? t / a : Math.exp(-(t - a) * d);

function addKick(start) {
  for (let i = 0; i < SR * 0.4; i++) {
    const idx = Math.floor(start * SR) + i; if (idx >= N) break;
    const t = i / SR;
    const f = 130 * Math.exp(-t * 28) + 45;
    const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 8) * 0.95;
    L[idx] += v; R[idx] += v;
  }
}
function addHat(start, len = 0.05, amp = 0.22) {
  for (let i = 0; i < SR * len; i++) {
    const idx = Math.floor(start * SR) + i; if (idx >= N) break;
    const t = i / SR;
    const v = noise() * Math.exp(-t * 60) * amp;
    L[idx] += v * 0.8; R[idx] += v;
  }
}
function addSnare(start, amp = 0.5) {
  for (let i = 0; i < SR * 0.2; i++) {
    const idx = Math.floor(start * SR) + i; if (idx >= N) break;
    const t = i / SR;
    const v = (noise() * 0.7 + Math.sin(2 * Math.PI * 190 * t) * 0.3) * Math.exp(-t * 18) * amp;
    L[idx] += v; R[idx] += v;
  }
}

const totalBeats = Math.ceil(DUR / beat);
const ctaStart = (84 + 156 + 174) / 30; // ~13.8s
const grooveStart = 84 / 30; // hook bitince groove

// Ritim
for (let b = 0; b < totalBeats; b++) {
  const t = b * beat;
  if (t < grooveStart - 0.5) continue; // hook'ta sadece build (aşağıda)
  addKick(t);
  addHat(t + beat / 2, 0.05, 0.18);
  addHat(t + beat / 4, 0.03, 0.1);
  addHat(t + (beat * 3) / 4, 0.03, 0.12);
  if (b % 2 === 1) addSnare(t, 0.42);
}

// Bas + arpej + chord stabs (groove boyunca)
for (let i = 0; i < N; i++) {
  const t = i / SR;
  if (t < grooveStart - 0.3) continue;
  const chordIdx = Math.floor((t / (beat * 2))) % prog.length;
  const ch = prog[chordIdx];
  const tb = t - grooveStart;

  // Bas (kısık testere, beat senkron pluck)
  const bf = nf(ch.root);
  const bphase = (t % (beat / 2));
  let bass = 0;
  for (let h = 1; h <= 3; h++) bass += Math.sin(2 * Math.PI * bf * h * t) / h;
  bass *= env(bphase, 0.005, 14) * 0.3;

  // Arpej (16'lık, parlak)
  const six = beat / 4;
  const step = Math.floor((t / six));
  const an = ch.notes[step % ch.notes.length];
  const af = nf(an) * 2;
  const ap = t - step * six;
  const arp = (Math.sin(2 * Math.PI * af * ap) + 0.4 * Math.sin(2 * Math.PI * af * 2 * ap)) * env(ap, 0.004, 9) * 0.16;

  // Chord stab her beat
  const sp = t % beat;
  let stab = 0;
  ch.notes.forEach((nm) => stab += Math.sin(2 * Math.PI * nf(nm) * t));
  stab = (stab / 3) * env(sp, 0.008, 11) * 0.14;

  // Sidechain pump (kick'e göre nefes)
  const sc = 0.55 + 0.45 * Math.min(1, (t % beat) / (beat * 0.5));

  const mono = (bass + stab) * sc + arp;
  L[i] += mono - arp * 0.3;
  R[i] += mono + arp * 0.3;
}

// Hook build: 0 → grooveStart yükselen riser (gürültü süpürme) + ters zil
for (let i = 0; i < grooveStart * SR; i++) {
  const t = i / SR;
  const p = t / grooveStart;
  const v = noise() * p * p * 0.18;
  L[i] += v; R[i] += v;
  // yükselen ton
  const f = 200 + p * 1400;
  const tone = Math.sin(2 * Math.PI * f * t) * p * p * 0.06;
  L[i] += tone; R[i] += tone;
}

// CTA öncesi riser (1 sn) + büyük hit
const riseFrom = ctaStart - 1.0;
for (let i = Math.floor(riseFrom * SR); i < Math.floor(ctaStart * SR); i++) {
  const t = i / SR; const p = (t - riseFrom) / 1.0;
  const v = noise() * p * p * 0.3;
  const f = 300 + p * 2200;
  L[i] += v + Math.sin(2 * Math.PI * f * t) * p * 0.08;
  R[i] += v + Math.sin(2 * Math.PI * f * t) * p * 0.08;
}
addKick(ctaStart); addSnare(ctaStart, 0.7);
// CTA crash
for (let i = 0; i < SR * 1.2; i++) {
  const idx = Math.floor(ctaStart * SR) + i; if (idx >= N) break;
  const t = i / SR; const v = noise() * Math.exp(-t * 3.5) * 0.3;
  L[idx] += v; R[idx] += v * 0.95;
}

// Master: fade + yumuşak limit
const fi = 0.05 * SR, fo = 1.4 * SR;
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = 0.9 / peak;
for (let i = 0; i < N; i++) {
  let m = g; if (i < fi) m *= i / fi; if (i > N - fo) m *= (N - i) / fo;
  L[i] = Math.tanh(L[i] * m * 1.1); R[i] = Math.tanh(R[i] * m * 1.1);
}

// WAV yaz
const dl = N * 4, buf = Buffer.alloc(44 + dl);
buf.write("RIFF",0); buf.writeUInt32LE(36+dl,4); buf.write("WAVE",8);
buf.write("fmt ",12); buf.writeUInt32LE(16,16); buf.writeUInt16LE(1,20);
buf.writeUInt16LE(2,22); buf.writeUInt32LE(SR,24); buf.writeUInt32LE(SR*4,28);
buf.writeUInt16LE(4,32); buf.writeUInt16LE(16,34); buf.write("data",36); buf.writeUInt32LE(dl,40);
let o = 44;
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(L[i]*32767))),o); o+=2;
  buf.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(R[i]*32767))),o); o+=2;
}
const out = new URL("./public/music.wav", import.meta.url).pathname;
writeFileSync(out, buf);
console.log("Enerjik müzik yazıldı →", out, `(${DUR}s)`);
