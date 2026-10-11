// Soft sounds and a slow piano theme, all synthesized with the Web Audio API
// (no sound files). The theme is scheduled on the audio clock, so its loop is
// seamless. Browsers only allow sound after the first tap/click/key press.

const KEY = 'noah_settings';
const DEFAULTS = { skipTutorial: false, skipStory: false, music: true, sfx: true, volume: 0.6 };

export const Settings = {
  get() { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; } },
  set(patch) {
    const next = { ...Settings.get(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    Sound.apply();
    return next;
  },
};

let ctx = null, master = null, sfxBus = null, musicBus = null, verb = null;
let musicOn = false, musicTimer = null, musicStart = 0, nextBeat = 0;
let wantMusic = false;   // the host page asks for music; phones only use sfx
let bossOn = false;      // boss fights: darker sound effects, and a low drone instead of the piano theme
let droneBus = null, droneLP = null, droneNodes = null;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.connect(ctx.destination);
  // A small, soft room: a generated impulse response
  verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  verb.buffer = ir;
  const wet = ctx.createGain(); wet.gain.value = 0.32;
  verb.connect(wet).connect(master);
  sfxBus = ctx.createGain(); sfxBus.connect(master); sfxBus.connect(verb);
  musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master); musicBus.connect(verb);
  droneBus = ctx.createGain(); droneBus.gain.value = 0; droneBus.connect(master); droneBus.connect(verb);
  droneLP = ctx.createBiquadFilter(); droneLP.type = 'lowpass'; droneLP.frequency.value = 180; droneLP.Q.value = 0.7; droneLP.connect(droneBus);
  apply();
  return ctx;
}

function apply() {
  if (!ctx) return;
  const s = Settings.get();
  master.gain.setTargetAtTime(Math.max(0, Math.min(1, s.volume)), ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(s.sfx ? 0.9 : 0, ctx.currentTime, 0.05);
  if (wantMusic && s.music) { if (bossOn) { stopMusic(); startDrone(); } else { stopDrone(); startMusic(); } }
  else { stopMusic(); stopDrone(); }
}

// A soft felt-piano-ish note: a few sine partials, fast attack, long decay, low-passed.
function piano(note, t, { vel = 0.3, dur = 2.4, dest = sfxBus, bright = 2200 } = {}) {
  const f = midi(note);
  const out = ctx.createGain();
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright; lp.Q.value = 0.3;
  out.connect(lp).connect(dest);
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(vel, t + 0.012);
  out.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.35);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  for (const [mult, g, det] of [[1, 1, 0], [2, 0.32, 3], [3, 0.1, -4], [4, 0.04, 2]]) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f * mult; o.detune.value = det;
    og.gain.value = g;
    o.connect(og).connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

// ── Background theme ──────────────────────────────────────────
// 66 bpm, 16 bars: Cmaj7 · Am7 · Fmaj7 · G · Em7 · Fmaj7 · Dm7 · G, twice,
// with a gentle melody that changes the second time round.
const BPM = 66, BEAT = 60 / BPM;
const CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59], [40, 47, 50, 55], [41, 48, 52, 57], [38, 45, 48, 53], [43, 50, 53, 59]];
const MELODY = [
  [[0, 76, 2], [2, 79, 2]], [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 2]], [[0, 69, 2], [2, 72, 2]], [[0, 74, 3], [3, 71, 1]],
  [[0, 71, 2], [2, 74, 2]], [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 2]], [[0, 74, 2], [2, 77, 2]], [[0, 79, 4]],
  [[0, 79, 2], [2, 76, 2]], [[0, 72, 3], [3, 76, 1]], [[0, 77, 2], [2, 76, 1], [3, 72, 1]], [[0, 74, 4]],
  [[0, 71, 2], [2, 67, 2]], [[0, 69, 2], [2, 72, 2]], [[0, 74, 2], [2, 72, 1], [3, 71, 1]], [[0, 74, 4]],
];
const BARS = 16, LOOP_BEATS = BARS * 4;

function scheduleBeat(b, t) {
  const beatInLoop = b % LOOP_BEATS, bar = Math.floor(beatInLoop / 4), beat = beatInLoop % 4;
  const chord = CHORDS[bar % 8];
  // left hand: a slow broken chord, one note per beat
  piano(chord[[0, 1, 2, 3][beat]], t, { vel: beat === 0 ? 0.16 : 0.1, dur: 3.2, dest: musicBus, bright: 1400 });
  if (beat === 0) piano(chord[0] - 12, t, { vel: 0.08, dur: 4, dest: musicBus, bright: 900 });
  for (const [at, note, len] of MELODY[bar]) {
    if (Math.floor(at) !== beat) continue;
    piano(note, t + (at - beat) * BEAT, { vel: 0.2, dur: Math.max(2, len * BEAT * 1.3), dest: musicBus, bright: 2000 });
  }
}
function startMusic() {
  if (musicOn || !ctx) return;
  musicOn = true;
  musicStart = ctx.currentTime + 0.15; nextBeat = 0;
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);
  const tick = () => {
    if (!musicOn) return;
    while (musicStart + nextBeat * BEAT < ctx.currentTime + 1.2) {
      const t = musicStart + nextBeat * BEAT;
      if (t >= ctx.currentTime - 0.05) scheduleBeat(nextBeat, t);
      nextBeat++;
    }
  };
  tick();
  musicTimer = setInterval(tick, 250);
}
function stopMusic() {
  if (!musicOn || !ctx) return;
  musicOn = false;
  clearInterval(musicTimer);
  musicBus.gain.cancelScheduledValues(ctx.currentTime);
  musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
  musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
}

// ── Boss fights ───────────────────────────────────────────────
// A low, slowly trembling drone replaces the piano theme.
function startDrone() {
  if (droneNodes || !ctx) return;
  const t = ctx.currentTime;
  droneBus.gain.cancelScheduledValues(t);
  droneBus.gain.setValueAtTime(droneBus.gain.value, t);
  droneBus.gain.linearRampToValueAtTime(0.5, t + 2.5);
  const mk = (type, f, g, det = 0) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; og.gain.value = g; o.connect(og).connect(droneLP); o.start(t); return o; };
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 0.18; lg.gain.value = 60; lfo.connect(lg).connect(droneLP.frequency); lfo.start(t);
  droneNodes = [mk('sawtooth', 55, 0.22), mk('sawtooth', 55.4, 0.18, 6), mk('sine', 27.5, 0.4), mk('triangle', 82.4, 0.12), lfo];
}
function stopDrone() {
  if (!droneNodes || !ctx) return;
  const nodes = droneNodes; droneNodes = null;
  const t = ctx.currentTime;
  droneBus.gain.cancelScheduledValues(t);
  droneBus.gain.setValueAtTime(droneBus.gain.value, t);
  droneBus.gain.linearRampToValueAtTime(0, t + 1.2);
  setTimeout(() => nodes.forEach((o) => { try { o.stop(); } catch {} }), 1500);
}
// Heavy, dark versions of the sound effects
function thud(t, f0 = 150, f1 = 48, vel = 0.35, dur = 0.5) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function brass(note, t, { vel = 0.1, dur = 1.2, bright = 1100 } = {}) {
  const f = midi(note), out = ctx.createGain(), lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.Q.value = 2;
  lp.frequency.setValueAtTime(220, t); lp.frequency.exponentialRampToValueAtTime(bright, t + 0.12); lp.frequency.exponentialRampToValueAtTime(260, t + dur);
  out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(vel, t + 0.05); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(lp).connect(sfxBus);
  for (const det of [-7, 7]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(out); o.start(t); o.stop(t + dur + 0.05); }
}
function ring(freq, t, { vel = 0.05, dur = 2.2 } = {}) {   // a cold, metallic ring
  for (const [m, g] of [[1, 1], [2.76, 0.5], [5.4, 0.25]]) {
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq * m;
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(vel * g, t + 0.01); og.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
    o.connect(og).connect(sfxBus); o.start(t); o.stop(t + dur + 0.05);
  }
}

function sfx(fn) {
  const s = Settings.get();
  if (!s.sfx || !ensure()) return;
  if (ctx.state === 'suspended') ctx.resume();
  fn(ctx.currentTime + 0.01);
}

export const Sound = {
  apply,
  // Call once on the host page: music plays after the first interaction.
  enableMusic() { wantMusic = true; if (ctx) apply(); },
  unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    apply();
  },
  // Boss fights use darker, heavier sounds (the page calls this when a boss appears or ends)
  setBoss(on) { on = !!on; if (on === bossOn) return; bossOn = on; if (ctx) apply(); },
  // A soft wooden "tock" for menu taps (a low thud during boss fights)
  click() {
    if (bossOn) return sfx((t) => thud(t, 230, 90, 0.17, 0.18));
    sfx((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(720, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.07);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(g).connect(sfxBus); o.start(t); o.stop(t + 0.14);
    });
  },
  good() { if (bossOn) return sfx((t) => { thud(t, 150, 40, 0.5, 0.7); [45, 52, 57].forEach((n) => brass(n, t + 0.02, { vel: 0.09, dur: 1.1 })); ring(1318, t + 0.04, { vel: 0.04, dur: 1.4 }); }); sfx((t) => { piano(76, t, { vel: 0.22 }); piano(79, t + 0.09, { vel: 0.22 }); piano(84, t + 0.18, { vel: 0.24, dur: 3 }); }); },
  bad() { if (bossOn) return sfx((t) => { thud(t, 110, 32, 0.6, 1.1); brass(33, t, { vel: 0.12, dur: 2.2, bright: 700 }); brass(34, t + 0.05, { vel: 0.1, dur: 2.2, bright: 700 }); ring(110, t, { vel: 0.05, dur: 2.8 }); }); sfx((t) => { piano(57, t, { vel: 0.2, bright: 1200 }); piano(53, t + 0.16, { vel: 0.2, dur: 3, bright: 1100 }); }); },
  levelUp() { if (bossOn) return sfx((t) => [45, 48, 52, 57, 60].forEach((n, i) => brass(n, t + i * 0.1, { vel: 0.08, dur: 1.4 }))); sfx((t) => [72, 76, 79, 84, 88].forEach((n, i) => piano(n, t + i * 0.08, { vel: 0.18, dur: 3 }))); },
  page() { sfx((t) => piano(81, t, { vel: 0.08, dur: 1.2, bright: 2600 })); },
};

// Unlock audio on the first gesture (browser autoplay rules)
for (const ev of ['pointerdown', 'keydown', 'touchend']) {
  document.addEventListener(ev, () => Sound.unlock(), { capture: true, passive: true });
}

// Boss fights flip the page from the light paper look to a dark one, and swap the sounds.
export function setBossTheme(on) {
  document.body.classList.toggle('boss-mode', !!on);
  const m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', on ? '#17141c' : '#efe8da');
  Sound.setBoss(!!on);
}
