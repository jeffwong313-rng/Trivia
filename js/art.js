// All the art is drawn in code as rough pencil-sketch SVG, so Noah can
// gradually "fill in" as the party levels up. No image files needed.
import { NOAH_TIERS, TOPICS, TIERS } from './config.js';

// Seeded random so a sketch doesn't wiggle every time the screen redraws.
function rng(seed) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A hand-drawn line through points: slightly jittered, smoothed.
function sketchPath(pts, r, j = 1.6, closed = false) {
  const p = pts.map(([x, y]) => [x + (r() - 0.5) * j * 2, y + (r() - 0.5) * j * 2]);
  if (closed) p.push(p[0]);
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i];
    const mx = (x0 + x1) / 2 + (r() - 0.5) * j, my = (y0 + y1) / 2 + (r() - 0.5) * j;
    d += ` Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
  return d;
}
const circlePts = (cx, cy, rx, ry, n = 18, start = 0, overshoot = 1.08) =>
  Array.from({ length: Math.round(n * overshoot) + 1 }, (_, i) => { const a = start + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

// Several passes of the same line = pencil look.
function strokes(pts, r, { passes = 2, j = 1.6, closed = false, cls = '', w = 2, color = 'currentColor', op = 1, dash = '' } = {}) {
  let out = '';
  for (let i = 0; i < passes; i++) {
    out += `<path class="${cls}" d="${sketchPath(pts, r, j, closed)}" fill="none" stroke="${color}" stroke-width="${(w * (i ? 0.6 : 1)).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="${(op * (i ? 0.6 : 1)).toFixed(2)}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  }
  return out;
}
function hatch(x0, y0, x1, y1, r, { gap = 6, color = 'currentColor', op = 0.5, w = 1, angle = 1 } = {}) {
  let out = '';
  for (let x = x0 - (y1 - y0); x < x1; x += gap) {
    out += `<path d="${sketchPath([[x, y1], [x + (y1 - y0) * angle, y0]], r, 0.8)}" stroke="${color}" stroke-width="${w}" opacity="${op}" fill="none"/>`;
  }
  return out;
}

export const SVG_DEFS = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="pencil" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="fog" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="8" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="40"/>
      <feGaussianBlur stdDeviation="9"/>
    </filter>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="ghost"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="soft" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="0.25"/>
    </filter>
    <filter id="wash" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="0.9"/>
    </filter>
    <radialGradient id="noahAura"><stop offset="0" stop-color="#e3e8ff" stop-opacity=".5"/><stop offset="1" stop-color="#e3e8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="balloonGlow"><stop offset="0" stop-color="#ff6b6b" stop-opacity=".7"/><stop offset="1" stop-color="#ff6b6b" stop-opacity="0"/></radialGradient>
    <radialGradient id="beacon"><stop offset="0" stop-color="#fff6c8"/><stop offset=".4" stop-color="#ffd86b" stop-opacity=".6"/><stop offset="1" stop-color="#ffd86b" stop-opacity="0"/></radialGradient>
  </defs>
</svg>`;

export function noahTier(level) {
  let t = 0;
  NOAH_TIERS.forEach((x, i) => { if (level >= x.from) t = i; });
  return t; // 0..3
}

// ── Noah ──────────────────────────────────────────────────────
// A small boy in a t-shirt and trousers, holding a red balloon. He starts as
// a faint pencil sketch — light construction lines you can barely make out —
// and gets clearer, then softly painted, as the party levels up.
export function drawNoah(level, { walking = false, size = 200 } = {}) {
  const tier = noahTier(level);
  const from = NOAH_TIERS[tier].from, to = NOAH_TIERS[tier + 1]?.from ?? from + 4;
  const within = Math.max(0, Math.min(1, (level - from) / (to - from)));
  const r = rng('noah-v2-' + tier);
  const st = [
    { ink: '#8a847c', op: 0.26 + 0.14 * within, passes: 3, j: 1.9, w: 1.15 },
    { ink: '#625b53', op: 0.55 + 0.2 * within,  passes: 3, j: 1.3, w: 1.35 },
    { ink: '#4d463f', op: 0.78,                  passes: 2, j: 1.0, w: 1.5 },
    { ink: '#3d3631', op: 0.88,                  passes: 2, j: 0.8, w: 1.6 },
  ][tier];
  const L = (pts, o = {}) => strokes(pts, r, { passes: st.passes, j: st.j, color: st.ink, op: st.op, w: st.w, ...o });

  // ── Shapes (viewBox 0 -30 200 310, feet on y≈268) ──
  const headD = sketchPath(circlePts(100, 88, 21, 23, 18, 0, 1), rng('hd'), 0.5, true);
  const hairD = 'M79,86 Q78,66 92,62 Q100,57 109,61 Q122,65 121,86 Q117,74 110,73 Q104,70 100,74 Q94,69 88,73 Q82,75 79,86 Z';
  const shirtD = 'M86,119 L93,116 Q100,121 107,116 L114,119 L127,137 L120,144 L115,138 L115,180 L85,180 L85,138 L80,144 L73,137 Z';
  const pantsD = 'M85,178 L115,178 L114,256 L103,256 L100,198 L97,256 L86,256 Z';
  const shoesD = 'M84,256 L98,256 Q99,264 92,265 L80,265 Q79,259 84,256 Z M102,256 L116,256 Q121,259 120,265 L108,265 Q101,264 102,256 Z';
  const colors = { skin: '#f0d5bf', hair: '#7a5638', shirt: '#93afcf', pants: '#7c6a58', shoes: '#4d423a' };

  let paint = '';
  if (tier >= 2) {
    const op = tier === 2 ? 0.38 + 0.25 * within : 0.82;
    const off = tier === 2 ? 'translate(2.5,1.5)' : '';
    paint = `<g filter="url(#wash)" opacity="${op.toFixed(2)}" transform="${off}">
      <path d="${pantsD}" fill="${colors.pants}"/><path d="${shirtD}" fill="${colors.shirt}"/>
      <path d="${headD}" fill="${colors.skin}"/><path d="${hairD}" fill="${colors.hair}"/><path d="${shoesD}" fill="${colors.shoes}"/>
      <path d="M71,140 L79,146 L76,176 L68,176 Z M121,146 L129,140 L139,157 L132,162 Z" fill="${colors.skin}"/>
    </g>`;
  }

  let ink = '';
  // Construction lines: the very first marks an artist makes
  if (tier === 0) {
    const g = { color: st.ink, op: 0.16 + 0.06 * within, w: 0.8, passes: 1, j: 1.5 };
    ink += strokes(circlePts(100, 88, 23, 25, 14, 0.4), r, g);
    ink += strokes([[100, 60], [100, 120], [100, 180], [100, 266]], r, g);
    ink += strokes([[80, 120], [120, 119]], r, g) + strokes([[84, 180], [116, 179]], r, g);
  }
  // Head, ears, hair
  ink += L(circlePts(100, 88, 21, 23, 16, -1.3));
  ink += L([[79, 84], [76, 88], [77, 95], [80, 97]], { w: st.w * 0.85, passes: 2 });
  ink += L([[121, 84], [124, 88], [123, 95], [120, 97]], { w: st.w * 0.85, passes: 2 });
  ink += L([[79, 84], [80, 70], [90, 62], [100, 59], [111, 62], [119, 70], [121, 84]], { w: st.w * 0.9 });
  ink += L([[86, 74], [90, 66]], { passes: 1, w: st.w * 0.8 }) + L([[95, 72], [98, 63]], { passes: 1, w: st.w * 0.8 }) + L([[104, 72], [106, 62]], { passes: 1, w: st.w * 0.8 }) + L([[112, 74], [113, 66]], { passes: 1, w: st.w * 0.8 });
  // Neck + t-shirt (round collar, short sleeves)
  ink += L([[96, 110], [96, 117]], { passes: 2 }) + L([[104, 110], [104, 117]], { passes: 2 });
  ink += L([[93, 116], [100, 121], [107, 116]], { passes: 2, w: st.w * 0.9 });
  ink += L([[93, 116], [86, 119], [73, 137], [80, 144], [85, 138], [85, 180], [115, 180], [115, 138], [120, 144], [127, 137], [114, 119], [107, 116]]);
  // Arms: left hangs down, right reaches up to the balloon string
  ink += L([[74, 140], [70, 160], [69, 175]], { w: st.w * 0.95 }) + L([[79, 145], [76, 161], [76, 175]], { w: st.w * 0.95 });
  ink += strokes(circlePts(72.5, 179, 4.2, 4.6, 9), r, { passes: 2, j: 0.8, color: st.ink, op: st.op, w: st.w * 0.9 });
  ink += L([[121, 145], [128, 154], [132, 161]], { w: st.w * 0.95 }) + L([[126, 139], [133, 149], [137, 157]], { w: st.w * 0.95 });
  ink += strokes(circlePts(136, 161, 4.2, 4.6, 9), r, { passes: 2, j: 0.8, color: st.ink, op: st.op, w: st.w * 0.9 });
  // Trousers: waistband, two straight legs, little cuffs
  ink += L([[85, 178], [86, 220], [86, 256], [97, 256], [100, 199], [103, 256], [114, 256], [114, 220], [115, 178]]);
  ink += L([[85, 184], [115, 184]], { passes: 1, w: st.w * 0.7 });
  // Shoes
  ink += L([[86, 257], [80, 260], [80, 265], [92, 265], [98, 262], [97, 257]], { w: st.w * 0.9 });
  ink += L([[103, 257], [102, 262], [108, 265], [120, 265], [120, 260], [114, 257]], { w: st.w * 0.9 });
  // Shading: light hatching on the shirt and the trousers' shadow side
  if (tier >= 1) {
    const hop = tier === 1 ? 0.26 : 0.14;
    ink += `<clipPath id="nsh${tier}"><path d="${shirtD}"/></clipPath><g clip-path="url(#nsh${tier})">${hatch(70, 140, 130, 180, rng('h1'), { gap: tier === 1 ? 6 : 8, op: hop, color: st.ink, w: 0.8 })}</g>`;
    ink += `<clipPath id="npa${tier}"><path d="M100,190 L114,180 L114,256 L103,256 Z"/></clipPath><g clip-path="url(#npa${tier})">${hatch(98, 180, 116, 256, rng('h2'), { gap: 5, op: hop, color: st.ink, w: 0.8 })}</g>`;
  }
  // Face: none at first — he only gets a face once he starts to remember himself
  if (tier >= 1) {
    const fo = tier === 1 ? 0.55 + 0.3 * within : 0.9;
    ink += `<g opacity="${fo.toFixed(2)}"><ellipse cx="92.5" cy="91" rx="1.9" ry="2.3" fill="${st.ink}"/><ellipse cx="107.5" cy="91" rx="1.9" ry="2.3" fill="${st.ink}"/>`;
    ink += strokes([[95, 101], [100, 103.5], [105, 101]], r, { passes: 1, j: 0.4, color: st.ink, w: 1.3 });
    if (tier >= 2) ink += strokes([[89, 85], [95, 84]], r, { passes: 1, j: 0.4, color: st.ink, w: 1, op: 0.6 }) + strokes([[105, 84], [111, 85]], r, { passes: 1, j: 0.4, color: st.ink, w: 1, op: 0.6 });
    ink += '</g>';
  }
  if (tier >= 3) ink += `<circle cx="88" cy="99" r="4" fill="#e89a8a" opacity=".3"/><circle cx="112" cy="99" r="4" fill="#e89a8a" opacity=".3"/>`;

  // Balloon: pale and faint → crimson → glowing ruby with drifting motes
  const br = rng('balloon');
  const bFill = ['#ecc5c3', '#c94a3e', '#d63a2f', '#e2343a'][tier];
  const bOp = [0.22 + 0.2 * within, 0.75, 0.88, 1][tier];
  let balloon = '';
  if (tier >= 3) balloon += `<circle cx="150" cy="38" r="58" fill="url(#balloonGlow)"/>`;
  balloon += `<path d="${sketchPath(circlePts(150, 38, 21, 26, 20), br, 1)}" fill="${bFill}" opacity="${bOp.toFixed(2)}" ${tier >= 2 ? 'filter="url(#wash)"' : ''}/>`;
  balloon += strokes(circlePts(150, 38, 21, 26, 20), br, { passes: 2, j: 1.2, color: tier === 0 ? '#b98a86' : '#7a2a22', op: tier === 0 ? 0.45 : 0.8, w: 1.4 });
  balloon += `<path d="M142,27 q4,-8 10,-9" stroke="#fff" stroke-width="3" opacity="${tier ? 0.5 : 0.25}" fill="none" stroke-linecap="round"/>`;
  balloon += `<path d="M150,64 l-3,5 l6,0 z" fill="${bFill}" opacity="${bOp.toFixed(2)}"/>`;
  balloon += strokes([[150, 68], [146, 95], [150, 125], [137, 158]], br, { passes: 1, j: 1.6, color: st.ink, op: st.op * 0.8, w: 1 });
  if (tier >= 2) for (let i = 0; i < 6 + tier * 3; i++) {
    const a = br() * Math.PI * 2, d = 30 + br() * 30;
    balloon += `<circle class="mote" style="animation-delay:${(br() * 3).toFixed(2)}s" cx="${(150 + Math.cos(a) * d).toFixed(1)}" cy="${(38 + Math.sin(a) * d).toFixed(1)}" r="${(1 + br() * 1.8).toFixed(1)}" fill="#ffb3a7" opacity=".8"/>`;
  }

  const aura = tier === 0 ? `<ellipse cx="100" cy="165" rx="52" ry="108" fill="url(#noahAura)"/>` : '';
  const shadow = `<ellipse cx="100" cy="268" rx="${tier ? 30 : 22}" ry="5" fill="#2c2723" opacity="${[0.05, 0.1, 0.14, 0.18][tier]}"/>`;
  return `<svg class="noah ${walking ? 'walking' : ''} tier-${tier}" viewBox="0 -30 200 310" width="${size}" height="${size * 1.55}" role="img" aria-label="Noah">
    ${aura}${shadow}
    <g class="balloon">${balloon}</g>
    <g class="body">${paint}<g filter="url(#soft)">${ink}</g></g>
  </svg>`;
}

// ── Bosses: sketched, faceless, unsettling but not scary ──────
const BOSS_SHAPES = [
  { w: 70, h: 230, hood: 1, horns: 0, wings: 0, tint: '#3a4a33' },  // Faceless Warden
  { w: 85, h: 220, hood: 1, horns: 0, wings: 0, tint: '#6b5a2e', waver: 1 },  // Mirage Stalker
  { w: 120, h: 210, hood: 0, horns: 0, wings: 0, tint: '#7a6040', bulk: 1 },  // Sunken Colossus
  { w: 95, h: 220, hood: 0, horns: 1, wings: 0, tint: '#8a6a3a', glass: 1 },  // Sandglass Sphinx
  { w: 105, h: 235, hood: 0, horns: 1, wings: 0, tint: '#5a4636' },  // Canyon Arbiter
  { w: 80, h: 250, hood: 1, horns: 0, wings: 1, tint: '#4a5566' },  // Gale Phantom
  { w: 100, h: 240, hood: 0, horns: 1, wings: 1, tint: '#4d6a80' },  // Frostbound Chimera
  { w: 110, h: 260, hood: 1, horns: 1, wings: 1, tint: '#2a2433' },  // Sovereign of Shadows
];
export function drawBoss(index, { hurt = 0 } = {}) {
  const base = BOSS_SHAPES[index] || BOSS_SHAPES[0];
  const s = { ...base, w: base.w * 1.55 };
  const r = rng('boss' + index);
  const cx = 150, top = 290 - s.h, headR = s.bulk ? 30 : 24;
  const headY = top + headR + 8;
  const sh = [cx - s.w * 0.3, headY + headR + 6], sh2 = [cx + s.w * 0.3, headY + headR + 6];
  const hem = 292;
  const ragged = [];
  for (let i = 0; i <= 10; i++) ragged.push([cx + s.w / 2 - (s.w * i) / 10, hem - (i % 2 ? 10 + r() * 14 : 0)]);
  const body = [sh2, [cx + s.w * 0.42, headY + 120], [cx + s.w / 2, hem - 24], ...ragged, [cx - s.w / 2, hem - 24], [cx - s.w * 0.42, headY + 120], sh, sh2];
  const bodyD = sketchPath(body, rng('bd' + index), 1.5, true);
  let g = '';
  // Charcoal scribble fill clipped to the cloak
  g += `<clipPath id="bc${index}"><path d="${bodyD}"/><ellipse cx="${cx}" cy="${headY}" rx="${headR}" ry="${headR * 1.15}"/></clipPath>`;
  let scrib = '';
  for (let i = 0; i < 150; i++) {
    const y = top - 20 + r() * (hem - top + 20), x = cx - s.w / 2 - 40 + r() * (s.w + 40);
    scrib += `<path d="${sketchPath([[x, y], [x + 30 + r() * 50, y + 14 + r() * 30]], r, 4)}" stroke="${s.tint}" stroke-width="${(1 + r() * 2.5).toFixed(1)}" opacity="${(0.25 + r() * 0.4).toFixed(2)}" fill="none"/>`;
  }
  g += `<g clip-path="url(#bc${index})"><rect x="0" y="0" width="300" height="300" fill="${s.tint}" opacity=".35"/>${scrib}</g>`;
  if (s.wings) for (const side of [-1, 1]) {
    g += strokes([[cx + side * s.w * 0.3, headY + 40], [cx + side * (s.w * 0.9), top + 10], [cx + side * (s.w * 1.1), headY + 60], [cx + side * (s.w * 0.85), headY + 110], [cx + side * s.w * 0.45, headY + 90]], r, { passes: 3, j: 4, color: '#222', op: 0.6, w: 1.6 });
  }
  g += strokes(body, r, { passes: 3, j: 3.5, color: '#1d1a17', op: 0.8, w: 2.2 });
  // Long arms
  for (const side of [-1, 1]) g += strokes([[cx + side * s.w * 0.35, headY + 45], [cx + side * (s.w * 0.55 + 10), headY + 110], [cx + side * (s.w * 0.5 + 18), headY + 170], [cx + side * (s.w * 0.5 + 12), headY + 182]], r, { passes: 2, j: 3, color: '#1d1a17', op: 0.75, w: 2 });
  // Head: blank. No face, just a smudge.
  if (s.hood) g += strokes([[cx - headR - 10, headY + headR + 4], [cx - headR - 6, headY - headR], [cx, headY - headR * 1.6], [cx + headR + 6, headY - headR], [cx + headR + 10, headY + headR + 4]], r, { passes: 3, j: 3, color: '#1d1a17', op: 0.8, w: 2.2 });
  g += `<ellipse cx="${cx}" cy="${headY}" rx="${headR - 4}" ry="${headR}" fill="#e9e1cf" opacity=".85"/>`;
  g += strokes(circlePts(cx, headY, headR - 4, headR, 16), r, { passes: 2, j: 2, color: '#1d1a17', op: 0.75, w: 1.8 });
  g += `<ellipse cx="${cx}" cy="${headY + 4}" rx="${headR * 0.5}" ry="${headR * 0.35}" fill="#1d1a17" opacity=".12" filter="url(#ghost)"/>`;
  if (s.horns) for (const side of [-1, 1]) g += strokes([[cx + side * 10, headY - headR + 4], [cx + side * 26, headY - headR - 22], [cx + side * 18, headY - headR - 40]], r, { passes: 2, j: 2, color: '#1d1a17', op: 0.8, w: 2.4 });
  if (s.glass) g += strokes([[cx - 22, headY + 70], [cx + 22, headY + 70], [cx - 22, headY + 130], [cx + 22, headY + 130], [cx - 22, headY + 70]], r, { passes: 2, j: 2, color: '#e7d4a0', op: 0.7, w: 2 });
  if (index === 7) g += `<circle cx="${cx}" cy="${headY}" r="70" fill="#000" opacity=".12" filter="url(#ghost)"/>`;
  return `<svg class="boss ${hurt ? 'hurt' : ''} ${s.waver ? 'waver' : ''}" viewBox="-60 -10 420 310" aria-label="Boss"><g filter="url(#pencil)">${g}</g></svg>`;
}

// ── Shapes for puzzle questions ───────────────────────────────
export function drawShape(spec, seed = 's') {
  const r = rng(seed + JSON.stringify(spec));
  const cx = 50, cy = 50, R = 32;
  let pts;
  if (!spec.sides) pts = circlePts(cx, cy, R, R, 20, 0, 1);
  else pts = Array.from({ length: spec.sides }, (_, i) => { const a = -Math.PI / 2 + (i / spec.sides) * Math.PI * 2; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R]; });
  let g = '';
  const d = sketchPath(pts, r, 1, true);
  const id = 'c' + Math.floor(r() * 1e9);
  if (spec.fill === 'solid') g += `<path d="${d}" fill="#2c2723" opacity=".75"/>`;
  if (spec.fill === 'hatch') g += `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${hatch(10, 10, 90, 90, r, { gap: 7, op: 0.7, color: '#2c2723', w: 1.4 })}</g>`;
  g += strokes(spec.sides ? [...pts, pts[0]] : pts, r, { passes: 2, j: 1, color: '#2c2723', w: 2.4 });
  if (spec.arrow) g += strokes([[cx, cy + 14], [cx, cy - 14]], r, { passes: 1, color: spec.fill === 'solid' ? '#f5efe2' : '#b23a2c', w: 3 }) + `<path d="M${cx - 6},${cy - 6} L${cx},${cy - 16} L${cx + 6},${cy - 6}" fill="none" stroke="${spec.fill === 'solid' ? '#f5efe2' : '#b23a2c'}" stroke-width="3" stroke-linecap="round"/>`;
  if (spec.dots) {
    const n = spec.dots, cols = Math.ceil(Math.sqrt(n));
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols), col = i % cols, rows = Math.ceil(n / cols);
      g += `<circle cx="${cx + (col - (cols - 1) / 2) * 10}" cy="${cy + (row - (rows - 1) / 2) * 10 + 4}" r="3.2" fill="${spec.fill === 'solid' ? '#f5efe2' : '#2c2723'}"/>`;
    }
  }
  return `<svg class="shape" viewBox="0 0 100 100"><g transform="rotate(${spec.rot || 0} 50 50)">${g}</g></svg>`;
}

// ── The map ───────────────────────────────────────────────────
const BIOMES = {
  grass:    { sky: ['#e9eedb', '#d8e4c0'], ground: '#9fb77a', bush: '#5f7f45', tuft: '#6c8c4c' },
  savanna:  { sky: ['#f1e8cf', '#e6d6a6'], ground: '#cdb36d', bush: '#8a8a45', tuft: '#a08a45' },
  desert:   { sky: ['#f6ead2', '#ecd6aa'], ground: '#dcc08a', bush: '#9a8a5c', tuft: '#b49a64' },
  desert2:  { sky: ['#f4e3cd', '#e8c9a0'], ground: '#d6b07c', bush: '#9c7c55', tuft: '#b48a5e' },
  foothill: { sky: ['#e8e2d6', '#d6cbb8'], ground: '#a99a80', bush: '#6f6a52', tuft: '#857a60' },
  crag:     { sky: ['#e1e4e6', '#c9d0d6'], ground: '#9aa3a8', bush: '#5d6b6a', tuft: '#76848a' },
  glacier:  { sky: ['#eaf2f6', '#d5e5ee'], ground: '#bcd2de', bush: '#7d97a6', tuft: '#93acbb' },
  summit:   { sky: ['#ece6f2', '#d8cde6'], ground: '#a99ab8', bush: '#6b5d80', tuft: '#857799' },
};
const ROW_GAP = 104, W = 560, PAD_B = 104, PAD_T = 150;

// What the party can tell about a path (used for the map and for phones)
export function nodeLabel(n, { showCategory, showTier } = {}) {
  if (n.type === 'mystery') return '? Mystery';
  if (n.type === 'rest') return 'Campfire';
  if (n.type === 'boss') return 'Boss';
  const t = TOPICS[n.topic];
  const kind = t?.kind === 'puzzle' ? 'Puzzle' : 'Question';
  return [showCategory && t ? t.name : kind, showTier && n.tier ? `${'★'.repeat(n.tier)} ${TIERS[n.tier].name}` : ''].filter(Boolean).join(' · ');
}
export const mapHeight = (map) => PAD_B + PAD_T + (map.rows.length - 1) * ROW_GAP;
export const nodeXY = (map, n) => [n.x * W, mapHeight(map) - PAD_B - n.row * ROW_GAP];

const ICONS = {
  question: (r) => strokes([[-6, -4], [-5, -9], [0, -11], [5, -9], [5, -4], [0, 0], [0, 4]], r, { passes: 1, w: 2.4, j: 0.6 }) + '<circle cx="0" cy="9" r="1.8" fill="currentColor"/>',
  puzzle:   (r) => strokes([[-8, -8], [8, -8], [8, 8], [-8, 8], [-8, -8]], r, { passes: 1, w: 2, j: 0.8 }) + strokes([[0, -8], [0, 8]], r, { passes: 1, w: 1.4, j: 0.6 }) + strokes([[-8, 0], [8, 0]], r, { passes: 1, w: 1.4, j: 0.6 }),
  mystery:  () => '<text y="7" text-anchor="middle" class="mystery-q">?</text>',
  rest:     (r) => strokes([[-8, 6], [8, 6]], r, { passes: 1, w: 2 }) + strokes([[0, 5], [-4, -2], [0, -9], [3, -3], [0, 5]], r, { passes: 1, w: 1.8, color: '#c0612b' }),
  boss:     (r) => strokes(circlePts(0, -2, 8, 10, 12), r, { passes: 2, w: 2, j: 1.2 }),
};

export function drawMap(map, { sightRows, showCategory, showTier, selectable = [], seed = 'm' }) {
  const b = BIOMES[map.biome] || BIOMES.grass;
  const H = mapHeight(map);
  const r = rng(seed + map.index);
  const cur = map.current ? map.rows.flat().find((n) => n.id === map.current) : null;
  const curRow = cur ? cur.row : -1;
  const visibleUpTo = curRow + sightRows;

  let s = `<svg class="map" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax meet">`;
  s += `<defs><linearGradient id="sky${map.index}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${b.sky[0]}"/><stop offset="1" stop-color="${b.sky[1]}"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#sky${map.index})"/>`;

  // Ground wash + grass tufts + stones
  let deco = '';
  for (let i = 0; i < map.rows.length * 9; i++) {
    const x = r() * W, y = 40 + r() * (H - 60);
    const kind = r();
    if (kind < 0.7) deco += strokes([[x, y], [x - 3, y - 7 - r() * 5]], r, { passes: 1, color: b.tuft, w: 1.2, op: 0.55 }) + strokes([[x + 3, y], [x + 4, y - 6 - r() * 6]], r, { passes: 1, color: b.tuft, w: 1.2, op: 0.55 });
    else deco += strokes(circlePts(x, y, 4 + r() * 4, 2.5 + r() * 2, 8), r, { passes: 1, color: '#6b625a', w: 1, op: 0.35 });
  }
  // Maze-like hedges: little walls of bushes between the lanes
  for (let i = 0; i < map.rows.length * 1.6; i++) {
    const y = H - PAD_B - (Math.floor(r() * (map.rows.length - 1)) + 0.5) * ROW_GAP;
    const x = r() < 0.5 ? 10 + r() * 90 : W - 100 - r() * 90;
    const len = 30 + r() * 60, vertical = r() < 0.35;
    const pts = [];
    const n = Math.max(3, Math.round(len / 12));
    for (let k = 0; k < n; k++) pts.push(vertical ? [x, y - len / 2 + (k * len) / n] : [x + (k * len) / n, y]);
    for (const [px, py] of pts) deco += `<path d="${sketchPath(circlePts(px, py, 9, 8, 10), r, 1.4, true)}" fill="${b.bush}" opacity=".55"/>` + strokes(circlePts(px, py, 9, 8, 10), r, { passes: 1, color: '#2c2723', op: 0.35, w: 1 });
  }
  s += `<g class="deco">${deco}</g>`;

  // Paths between nodes
  let paths = '';
  for (const row of map.rows) for (const n of row) {
    const [x1, y1] = nodeXY(map, n);
    for (const id of n.next) {
      const m = map.rows.flat().find((k) => k.id === id);
      const [x2, y2] = nodeXY(map, m);
      const walked = n.visited && m.visited;
      paths += strokes([[x1, y1], [(x1 + x2) / 2 + (r() - 0.5) * 18, (y1 + y2) / 2], [x2, y2]], r, { passes: walked ? 2 : 1, j: 2, color: walked ? '#7a2f22' : '#3a332c', op: walked ? 0.75 : 0.4, w: walked ? 2.4 : 1.6, dash: walked ? '' : '6 7' });
    }
  }
  s += `<g class="paths">${paths}</g>`;

  // Start marker
  s += `<g transform="translate(${W / 2},${H - 8})"><text text-anchor="middle" class="map-label">start</text></g>`;

  // Nodes
  let nodes = '';
  for (const row of map.rows) for (const n of row) {
    const [x, y] = nodeXY(map, n);
    const known = n.visited || n.row <= visibleUpTo || n.type === 'boss' && n.row <= visibleUpTo;
    const sel = selectable.some((k) => k.id === n.id);
    const nr = rng('n' + n.id);
    const rad = n.type === 'boss' ? 24 : 18;
    const t = TOPICS[n.topic];
    const icon = n.type === 'question' && t?.kind === 'puzzle' ? 'puzzle' : n.type;
    const order = [...selectable].sort((a, b) => a.x - b.x);
    const pos = sel && order.length > 1 ? (order.length === 2 ? ['Left', 'Right'] : ['Left', 'Middle', 'Right', 'Far right'])[order.findIndex((k) => k.id === n.id)] : '';
    const label = (pos ? `${pos} path · ` : '') + nodeLabel(n, { showCategory, showTier });
    let g = `<g class="node ${n.type} ${n.visited ? 'visited' : ''} ${sel ? 'selectable' : ''}" data-id="${n.id}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})" ${sel ? `tabindex="0" role="button" aria-label="${label}"` : ''}>`;
    if (sel) g += `<circle class="halo" r="${rad + 9}"/>`;
    g += `<path d="${sketchPath(circlePts(0, 0, rad, rad, 14, 0, 1), nr, 1, true)}" class="node-fill"/>`;
    g += strokes(circlePts(0, 0, rad, rad, 14), nr, { passes: 2, j: 1.2, w: 2 });
    if (known) {
      g += `<g class="icon">${(ICONS[icon] || ICONS.question)(nr)}</g>`;
      if (!n.visited && n.type === 'question') {
        if (showCategory && t) g += `<text class="node-label" y="${rad + 15}" text-anchor="middle">${t.short}</text>`;
        if (showTier && n.tier) g += `<text class="node-stars" y="${rad + (showCategory ? 29 : 15)}" text-anchor="middle">${'★'.repeat(n.tier)}</text>`;
      }
      if (n.type === 'boss') g += `<text class="node-label boss-label" y="${-rad - 10}" text-anchor="middle">boss</text>`;
    }
    g += '</g>';
    nodes += g;
  }
  s += `<g class="nodes">${nodes}</g>`;

  // Fog of war over rows the party can't see yet
  let fog = '';
  const fogFrom = visibleUpTo + 1;
  if (fogFrom < map.rows.length) {
    const yBottom = H - PAD_B - fogFrom * ROW_GAP + ROW_GAP * 0.55;
    fog += `<rect x="-40" y="-40" width="${W + 80}" height="${yBottom + 40}" fill="#f6f2ea" opacity=".96" filter="url(#fog)"/>`;
    // Drifting pencil-outlined cumulus puffs inside the fog
    for (let y = yBottom - 60; y > 20; y -= 80) {
      for (let k = 0; k < 2; k++) {
        const cx = 70 + r() * (W - 140), cy = y - r() * 30, n = 3 + Math.floor(r() * 3), span = 34 * n;
        let fill = '', ink = '';
        for (let i = 0; i < n; i++) {
          const bx = cx - span / 2 + (i + 0.5) * (span / n), br = 18 + r() * 16 + (i > 0 && i < n - 1 ? 8 : 0);
          fill += `<circle cx="${bx.toFixed(1)}" cy="${(cy - br * 0.35).toFixed(1)}" r="${br.toFixed(1)}"/>`;
          ink += strokes(circlePts(bx, cy - br * 0.35, br, br, 12, Math.PI * 1.05, 0.45), r, { passes: 1, j: 1.4, color: '#8f8c9c', op: 0.45, w: 1.3 });
        }
        fog += `<g fill="#fbf8f2" opacity=".95">${fill}<ellipse cx="${cx}" cy="${cy}" rx="${span / 2 + 6}" ry="14"/></g>${ink}`;
        fog += strokes([[cx - span / 2 - 4, cy + 12], [cx + span / 2 + 4, cy + 12]], r, { passes: 1, j: 2, color: '#8f8c9c', op: 0.3, w: 1.1 });
      }
    }
    const fr = rng('fogline' + fogFrom);
    for (let i = 0; i < 3; i++) fog += strokes(Array.from({ length: 13 }, (_, k) => [k * 47, yBottom - 18 - i * 22 + Math.sin(k + i) * 9]), fr, { passes: 1, j: 3, color: '#8b8fa0', op: 0.18, w: 1.1 });
  }
  if (map.biome === 'summit') fog += `<circle cx="${W / 2}" cy="40" r="120" fill="url(#beacon)" opacity=".8"/>`;
  s += `<g class="fog" pointer-events="none">${fog}</g>`;

  // Noah's token on the map
  const tok = cur ? nodeXY(map, cur) : [W / 2, H - 30];
  s += `<g class="noah-token" transform="translate(${tok[0]},${tok[1] - 6})"><circle r="7" fill="#c0392b" opacity=".9"/><path d="M0,7 L0,22" stroke="#2c2723" stroke-width="1.4"/></g>`;
  s += '</svg>';
  return s;
}

// ── Question visuals (shape sequences, paint blobs, emoji) ────
function blob(color, seed, label) {
  const r = rng('blob' + seed + color);
  const pts = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2, d = 30 + r() * 7; return [50 + Math.cos(a) * d, 50 + Math.sin(a) * d * 0.9]; });
  const d = sketchPath(pts, r, 1.2, true);
  const light = color.toLowerCase() === '#ffffff';
  return `<svg class="blob" viewBox="0 0 100 100" role="img" aria-label="${label || 'color'}"><path d="${d}" fill="${color}" ${light ? '' : 'filter="url(#wash)"'}/>${strokes([...pts, pts[0]], r, { passes: 2, j: 1, color: '#2c2723', w: 1.6, op: 0.7 })}</svg>`;
}
export function drawVisual(v) {
  if (!v) return '';
  if (v.type === 'sequence') return `<div class="seq">${v.items.map((it, i) => drawShape(it, 'seq' + i)).join('')}<div class="qmark">?</div></div>`;
  if (v.type === 'emoji') return `<div class="emoji-clue" aria-label="emoji clue">${v.text}</div>`;
  if (v.type === 'mix') {
    if (v.mode === 'wheel' || v.mode === 'target') return `<div class="seq mix">${blob(v.colors[0], 0)}${v.mode === 'wheel' ? '<div class="op">↔</div><div class="qmark">?</div>' : '<div class="op">=</div><div class="qmark">? + ?</div>'}</div>`;
    const sep = v.mode === 'light' ? '<div class="op light">+ light</div>' : '<div class="op">+</div>';
    return `<div class="seq mix">${blob(v.colors[0], 1)}${sep}${blob(v.colors[1], 2)}<div class="op">=</div><div class="qmark">?</div></div>`;
  }
  return '';
}
export function drawSwatch(color) {
  return `<span class="swatch" style="background:${color}"></span>`;
}
