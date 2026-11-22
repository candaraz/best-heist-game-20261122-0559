// The Midnight Gallery — sound: everything is synthesised in code with the
// Web Audio API. No audio files, no network, nothing to load. A tiny helper
// builds short tones and filtered noise; the game calls the named sounds.

// Audio starts only after the first key or click (browsers block sound
// before a gesture), so `ensure` is called from the input handlers.
let ctx = null;
let master = null;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
}

function tone(freq, seconds, type, slideTo, when = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + seconds);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.9, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

function noise(seconds, filterFreq, when = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t0);
}

// Named sounds. Each one is a small gesture: a coin is a bright metallic
// ping, a pickup is a rising chime, the alarm is a low two-note sting, and
// being caught is a falling buzz. Footsteps are soft ticks, quieter while
// sneaking, so sound itself tells the player how exposed they are.
export const sounds = {
  step(sneaking) {
    if (!ctx) return;
    noise(0.05, sneaking ? 500 : 900);
  },
  coin() {
    tone(2093, 0.09, 'sine');
    tone(2637, 0.16, 'sine', null, 0.07);
    noise(0.08, 5200, 0.02);
  },
  clink() {
    noise(0.22, 3400);
    tone(1568, 0.12, 'triangle', null, 0.02);
  },
  pickup() {
    tone(660, 0.10, 'sine');
    tone(880, 0.12, 'sine', null, 0.08);
    tone(1320, 0.20, 'sine', null, 0.16);
  },
  sapphire() {
    tone(523, 0.14, 'sine');
    tone(659, 0.14, 'sine', null, 0.10);
    tone(784, 0.14, 'sine', null, 0.20);
    tone(1047, 0.34, 'sine', null, 0.30);
  },
  spotted() {
    tone(220, 0.16, 'sawtooth', 180);
    tone(233, 0.16, 'sawtooth', 190, 0.14);
  },
  alarm() {
    tone(440, 0.22, 'square', 415);
    tone(440, 0.22, 'square', 415, 0.26);
  },
  caught() {
    tone(196, 0.7, 'sawtooth', 55);
    tone(98, 0.7, 'triangle', 49, 0.05);
  },
  win() {
    tone(523, 0.16, 'sine');
    tone(659, 0.16, 'sine', null, 0.14);
    tone(784, 0.16, 'sine', null, 0.28);
    tone(1047, 0.5, 'sine', null, 0.42);
  },
  exit() {
    noise(0.3, 300);
    tone(330, 0.25, 'sine', 392);
  },
};
