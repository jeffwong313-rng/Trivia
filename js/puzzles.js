// Brain-teaser topics. Each generator makes endless questions at a given tier
// (1 easy → 4 master). Answers are strings, {shape} or {text, swatch}.

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const near = (pool, tier) => { for (const d of [0, 1, -1, 2, -2, 3, -3]) { const p = pool.filter((x) => x[0] === tier + d); if (p.length) return p; } return pool; };

let uid = 0;
const mk = (topic, fields) => ({ id: `GEN-${topic}-${++uid}-${Date.now().toString(36)}`, kind: 'puzzle', source: 'gen', topic, ...fields });

// Put the correct answer among wrongs (strings), shuffle, record index.
function opts(q, correct, wrongs) {
  const uniq = [...new Set(wrongs.map(String))].filter((w) => w !== String(correct)).slice(0, 3);
  const answers = shuffle([String(correct), ...uniq]);
  return { ...q, answers, correct: answers.indexOf(String(correct)) };
}
function numOpts(q, correct, spread = 3) {
  const cands = shuffle([correct + 1, correct - 1, correct + 2, correct - 2, correct + spread, correct - spread, correct + 10, correct - 10, correct * 2, Math.round(correct / 2)])
    .filter((x) => x !== correct && x >= 0 && Number.isInteger(x));
  return opts(q, correct, [...new Set(cands)].slice(0, 3));
}
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

// ══ Color mixing ═══════════════════════════════════════════════
const C = {
  red: '#d63a2f', yellow: '#f2c12e', blue: '#2f5fb3', orange: '#ec8a2c', green: '#3f9a4a', purple: '#7b4aa0',
  pink: '#f2a2b5', white: '#ffffff', black: '#2a2623', gray: '#8a8a8a', 'light blue': '#9cc6ec', brown: '#7a5133',
  teal: '#2a8f8a', lavender: '#c4b0e0', magenta: '#d23ca0', cyan: '#34c4dc', 'light green': '#a6d98a',
};
const sw = (name) => ({ text: name[0].toUpperCase() + name.slice(1), swatch: C[name] });
// [tier, mode, colorA, colorB, result, [wrong results]]
const MIXES = [
  [1, 'paint', 'red', 'yellow', 'orange', ['purple', 'green', 'pink']],
  [1, 'paint', 'blue', 'yellow', 'green', ['purple', 'orange', 'brown']],
  [1, 'paint', 'red', 'blue', 'purple', ['green', 'orange', 'pink']],
  [1, 'paint', 'red', 'white', 'pink', ['orange', 'purple', 'gray']],
  [1, 'paint', 'black', 'white', 'gray', ['brown', 'light blue', 'purple']],
  [1, 'paint', 'blue', 'white', 'light blue', ['teal', 'lavender', 'gray']],
  [2, 'paint', 'purple', 'white', 'lavender', ['pink', 'light blue', 'gray']],
  [2, 'paint', 'green', 'white', 'light green', ['teal', 'yellow', 'gray']],
  [2, 'paint', 'blue', 'green', 'teal', ['purple', 'brown', 'lavender']],
  [2, 'paint', 'red', 'green', 'brown', ['yellow', 'orange', 'purple']],
  [2, 'paint', 'orange', 'blue', 'brown', ['green', 'purple', 'teal']],
  [3, 'light', 'red', 'green', 'yellow', ['brown', 'orange', 'cyan']],
  [3, 'light', 'red', 'blue', 'magenta', ['purple', 'brown', 'cyan']],
  [3, 'light', 'green', 'blue', 'cyan', ['teal', 'yellow', 'magenta']],
  [4, 'ink', 'cyan', 'yellow', 'green', ['blue', 'brown', 'teal']],
  [4, 'ink', 'cyan', 'magenta', 'blue', ['purple', 'red', 'green']],
  [4, 'ink', 'magenta', 'yellow', 'red', ['orange', 'pink', 'brown']],
];
const MODE_TEXT = { paint: 'Mixing paint', light: 'Mixing colored light (like a screen)', ink: 'Mixing printer ink' };
function colors(tier) {
  const kind = tier >= 3 && Math.random() < 0.35 ? (tier === 3 ? 'opposite' : 'primary') : tier <= 2 && Math.random() < 0.25 ? 'reverse' : 'mix';
  if (kind === 'opposite') {
    const [a, b, w] = pick([['red', 'green', ['blue', 'orange', 'purple']], ['blue', 'orange', ['green', 'purple', 'red']], ['yellow', 'purple', ['green', 'orange', 'blue']], ['green', 'red', ['yellow', 'blue', 'purple']]]);
    const answers = shuffle([sw(b), ...w.map(sw)]);
    return mk('colors', { subtopic: 'Color Wheel', tier: 3, prompt: `On a painter's color wheel, which color sits directly opposite ${a}?`, visual: { type: 'mix', colors: [C[a]], mode: 'wheel' },
      answers, correct: answers.findIndex((x) => x.text.toLowerCase() === b), hints: ['Opposite colors are called complementary colors.', `Mix the other two primaries (not ${a}).`, `It's ${b[0].toUpperCase()}…`] });
  }
  if (kind === 'primary') {
    const answers = shuffle(['Cyan, magenta, yellow', 'Red, yellow, blue', 'Red, green, blue', 'Orange, green, purple']);
    return mk('colors', { subtopic: 'Printer Colors', tier: 4, prompt: 'Besides black, which three ink colors does a color printer use?', answers, correct: answers.indexOf('Cyan, magenta, yellow'),
      hints: ['They are not the paint primaries.', 'Look on an ink cartridge box: C, M, Y, K.', 'C = cyan.'] });
  }
  const [t, mode, a, b, res, wrong] = pick(near(MIXES.filter((m) => m[1] === 'paint' || tier >= 3), tier));
  if (kind === 'reverse' && mode === 'paint') {
    const others = shuffle(MIXES.filter((m) => m[1] === 'paint' && m[4] !== res)).slice(0, 3);
    const label = (x, y) => `${x[0].toUpperCase() + x.slice(1)} + ${y}`;
    const answers = shuffle([label(a, b), ...others.map((m) => label(m[2], m[3]))]);
    return mk('colors', { subtopic: 'Color Mixing', tier: t, prompt: `Which two paints mix to make ${res}?`, visual: { type: 'mix', colors: [C[res]], mode: 'target' },
      answers, correct: answers.indexOf(label(a, b)), hints: [`Think of ${res} as a blend.`, `One of them is ${a}.`, `${a} and ${b}.`] });
  }
  const answers = shuffle([sw(res), ...wrong.map(sw)]);
  return mk('colors', { subtopic: MODE_TEXT[mode], tier: t, prompt: `${MODE_TEXT[mode]}: ${a} + ${b} = ?`, visual: { type: 'mix', colors: [C[a], C[b]], mode },
    answers, correct: answers.findIndex((x) => x.text.toLowerCase() === res),
    hints: [mode === 'light' ? 'Light adds up: mixing light gets brighter, not darker.' : mode === 'ink' ? 'Ink works by soaking up colors, like paint.' : 'Think of finger painting.', `It starts with "${res[0].toUpperCase()}".`, `It's ${res}.`] });
}

// ══ Spelling ═══════════════════════════════════════════════════
// [tier, correct, wrong×3]  (avoids US/UK spelling differences)
const SPELL = [
  [1, 'friend', ['freind', 'frend', 'friennd']], [1, 'because', ['becuase', 'becase', 'becouse']], [1, 'beautiful', ['beautifull', 'beatiful', 'beutiful']],
  [1, 'believe', ['beleive', 'belive', 'beleve']], [1, 'tomorrow', ['tommorow', 'tomorow', 'tommorrow']], [1, 'library', ['libary', 'liberry', 'librery']],
  [1, 'different', ['diffrent', 'diferent', 'differant']], [1, 'surprise', ['suprise', 'surprize', 'surprice']], [1, 'school', ['shcool', 'skool', 'scool']],
  [1, 'people', ['peopel', 'poeple', 'peeple']], [1, 'animal', ['aminal', 'animle', 'anamal']], [1, 'enough', ['enuf', 'enogh', 'enouhg']],
  [2, 'necessary', ['neccessary', 'necesary', 'nessecary']], [2, 'separate', ['seperate', 'separete', 'seperete']], [2, 'definitely', ['definately', 'definetly', 'defanitely']],
  [2, 'receive', ['recieve', 'receeve', 'receve']], [2, 'Wednesday', ['Wensday', 'Wednsday', 'Wedensday']], [2, 'February', ['Febuary', 'Februrary', 'Feburary']],
  [2, 'calendar', ['calender', 'calandar', 'calander']], [2, 'restaurant', ['restaraunt', 'resturant', 'restaurent']], [2, 'government', ['goverment', 'govermant', 'govenment']],
  [2, 'environment', ['enviroment', 'envirnment', 'environmant']], [2, 'business', ['buisness', 'busness', 'bussiness']], [2, 'weird', ['wierd', 'weerd', 'wiered']],
  [2, 'beginning', ['begining', 'beggining', 'beginnig']], [2, 'argument', ['arguement', 'argumant', 'arguemant']], [2, 'until', ['untill', 'intil', 'untel']],
  [3, 'accommodate', ['accomodate', 'acommodate', 'accommadate']], [3, 'embarrass', ['embarass', 'embarras', 'embaress']], [3, 'rhythm', ['rythm', 'rhythym', 'rhytm']],
  [3, 'conscience', ['concience', 'consience', 'conscence']], [3, 'occurrence', ['occurence', 'ocurrence', 'occurance']], [3, 'millennium', ['millenium', 'milennium', 'millenniem']],
  [3, 'privilege', ['priviledge', 'privelege', 'privilige']], [3, 'mischievous', ['mischievious', 'mischevous', 'mischievos']], [3, 'questionnaire', ['questionaire', 'questionnair', 'questionairre']],
  [3, 'maintenance', ['maintainance', 'maintenence', 'maintanance']], [3, 'cemetery', ['cemetary', 'cematery', 'semetery']], [3, 'exaggerate', ['exagerate', 'exaggerrate', 'exxagerate']],
  [3, 'harass', ['harrass', 'haras', 'harras']], [3, 'committee', ['comittee', 'commitee', 'committe']], [3, 'occasion', ['occassion', 'ocasion', 'ocassion']],
  [4, 'onomatopoeia', ['onomatopeia', 'onomatopoea', 'onamatopoeia']], [4, 'connoisseur', ['conoisseur', 'connoiseur', 'connaisseur']], [4, 'conscientious', ['consciencious', 'conscientous', 'consientious']],
  [4, 'pharaoh', ['pharoah', 'pharao', 'pharoh']], [4, 'liaison', ['liason', 'liasion', 'laison']], [4, 'bureaucracy', ['beaurocracy', 'bureaucrasy', 'burocracy']],
  [4, 'entrepreneur', ['entrepeneur', 'entreprenuer', 'enterpreneur']], [4, 'fluorescent', ['flourescent', 'florescent', 'fluorecent']], [4, 'minuscule', ['miniscule', 'minuscle', 'minniscule']],
  [4, 'supersede', ['supercede', 'superseed', 'superceed']], [4, 'idiosyncrasy', ['idiosyncracy', 'idiosyncrasie', 'ideosyncrasy']], [4, 'sacrilegious', ['sacreligious', 'sacrilegous', 'sacriligious']],
  [4, 'handkerchief', ['handkercheif', 'hankerchief', 'handkerchif']], [4, 'dumbbell', ['dumbell', 'dumbel', 'dumbbel']],
];
function spelling(tier) {
  if (tier <= 2 && Math.random() < 0.3) {   // "which one is spelled wrong?"
    const pool = near(SPELL, tier);
    const [bad, ...good] = shuffle(pool).slice(0, 4);
    const wrongWord = pick(bad[2]);
    const answers = shuffle([wrongWord, ...good.map((g) => g[1])]);
    return mk('spelling', { subtopic: 'Spot the Mistake', tier: bad[0], prompt: 'Which word is spelled WRONG?', answers, correct: answers.indexOf(wrongWord),
      hints: ['Three of these are fine.', 'Sound each one out letter by letter.', `The right spelling is "${bad[1]}".`] });
  }
  const [t, right, wrongs] = pick(near(SPELL, tier));
  const answers = shuffle([right, ...wrongs]);
  return mk('spelling', { subtopic: 'Spelling', tier: t, prompt: 'Which one is spelled correctly?', answers, correct: answers.indexOf(right),
    hints: ['Watch for doubled letters.', `It has ${right.length} letters.`, `It starts "${right.slice(0, Math.ceil(right.length / 2))}…"`] });
}

// ══ Quick math ═════════════════════════════════════════════════
function math(tier) {
  const t = Math.max(1, Math.min(4, tier));
  const make = {
    1: () => pick([
      () => { const a = rnd(3, 20), b = rnd(2, 15); return [`${a} + ${b} = ?`, a + b, `Add ${b} to ${a}.`]; },
      () => { const a = rnd(10, 30), b = rnd(2, 9); return [`${a} − ${b} = ?`, a - b, `Count back ${b} from ${a}.`]; },
      () => { const a = rnd(2, 5), b = rnd(2, 10); return [`${a} × ${b} = ?`, a * b, `${b} added ${a} times.`]; },
      () => { const a = rnd(3, 12) * 2; return [`What is half of ${a}?`, a / 2, `Split ${a} into two equal piles.`]; },
      () => { const a = rnd(4, 15); return [`What is double ${a}?`, a * 2, `${a} + ${a}.`]; },
    ])(),
    2: () => pick([
      () => { const a = rnd(11, 19), b = rnd(3, 9); return [`${a} × ${b} = ?`, a * b, `Do 10 × ${b}, then add ${a - 10} × ${b}.`]; },
      () => { const b = rnd(3, 9), q = rnd(4, 12); return [`${b * q} ÷ ${b} = ?`, q, `What times ${b} makes ${b * q}?`]; },
      () => { const p = pick([10, 25, 50]), n = pick([40, 60, 80, 120, 200, 240]); return [`What is ${p}% of ${n}?`, (p * n) / 100, p === 50 ? 'Half of it.' : p === 25 ? 'A quarter: half of half.' : 'Move the decimal one place left.']; },
      () => { const a = rnd(12, 40), b = rnd(12, 40), c = rnd(5, 20); return [`${a} + ${b} + ${c} = ?`, a + b + c, `Add the first two, then ${c}.`]; },
      () => { const n = rnd(2, 8) * 4; return [`What is three quarters of ${n}?`, (n / 4) * 3, `A quarter of ${n} is ${n / 4}.`]; },
    ])(),
    3: () => pick([
      () => { const a = rnd(11, 19); return [`${a}² (${a} × ${a}) = ?`, a * a, `${a} × 10 + ${a} × ${a - 10}.`]; },
      () => { const a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); return [`${a} + ${b} × ${c} = ?`, a + b * c, 'Multiply before you add.']; },
      () => { const n = pick([20, 40, 60, 80, 120]); return [`What is 15% of ${n}?`, (15 * n) / 100, `10% is ${n / 10}, 5% is half of that.`]; },
      () => { const x = rnd(8, 40), a = rnd(5, 30); return [`If x + ${a} = ${x + a}, what is x?`, x, `Take ${a} away from ${x + a}.`]; },
      () => { const n = rnd(3, 9); return [`How many minutes are in ${n} and a half hours?`, n * 60 + 30, `${n} × 60, plus 30.`]; },
    ])(),
    4: () => pick([
      () => { const x = rnd(3, 12), a = rnd(2, 6), b = rnd(3, 20); return [`If ${a}x + ${b} = ${a * x + b}, what is x?`, x, `First subtract ${b}, then divide by ${a}.`]; },
      () => { const a = rnd(13, 24), b = rnd(13, 24); return [`${a} × ${b} = ?`, a * b, `${a} × ${b - 10} + ${a} × 10.`]; },
      () => { const n = pick([10, 20, 30, 40, 50]); return [`What is the sum of every whole number from 1 to ${n}?`, (n * (n + 1)) / 2, `Pair them up: 1 + ${n}, 2 + ${n - 1}…`]; },
      () => { const p = pick([40, 60, 80, 100]); return [`A $${p} jacket is 25% off, then another 10% off the new price. What does it cost?`, p * 0.75 * 0.9, `After 25% off it's $${p * 0.75}.`]; },
      () => { const s = pick([12, 13, 14, 15, 16, 18, 21, 25]); return [`What is the square root of ${s * s}?`, s, `What number times itself is ${s * s}?`]; },
      () => { const v = [rnd(2, 10), rnd(2, 10), rnd(2, 10)]; const sum = v[0] + v[1] + v[2]; const d = 4 - (sum % 4 || 4); const last = sum % 4 === 0 ? 4 : 4 + d; const all = [...v, last]; return [`What is the average of ${all.join(', ')}?`, all.reduce((a, b) => a + b) / 4, 'Add them up, divide by 4.']; },
    ])(),
  }[t];
  const [prompt, ans, h] = make();
  const q = mk('math', { subtopic: 'Quick Math', tier: t, prompt, hints: [h, `The answer is ${ans % 2 === 0 ? 'even' : 'odd'}.`, `It's between ${Math.max(0, Math.floor(ans - 3))} and ${Math.ceil(ans + 3)}.`] });
  if (!Number.isInteger(ans)) return opts(q, fmt(ans), [fmt(ans + 1), fmt(ans - 2), fmt(ans + 4.5)]);
  return numOpts(q, ans, Math.max(3, Math.round(ans * 0.1)));
}

// ══ Number & letter patterns ═══════════════════════════════════
const series = [
  { tier: 1, gen() { const a = rnd(1, 20), d = rnd(2, 9); const s = [0, 1, 2, 3, 4].map((i) => a + d * i); return { s, next: a + d * 5, rule: `add ${d} each time` }; } },
  { tier: 1, gen() { const a = rnd(1, 5); const s = [0, 1, 2, 3, 4].map((i) => a * 2 ** i); return { s, next: a * 2 ** 5, rule: 'double each time' }; } },
  { tier: 1, gen() { const a = rnd(40, 90), d = rnd(2, 6); const s = [0, 1, 2, 3, 4].map((i) => a - d * i); return { s, next: a - d * 5, rule: `take away ${d} each time` }; } },
  { tier: 2, gen() { const a = rnd(1, 3); const s = [0, 1, 2, 3].map((i) => a * 3 ** i); return { s, next: a * 3 ** 4, rule: 'multiply by 3' }; } },
  { tier: 2, gen() { const o = rnd(1, 4); const s = [0, 1, 2, 3, 4].map((i) => (i + o) * (i + o + 1)); return { s, next: (5 + o) * (6 + o), rule: 'the gaps grow by 2 each time' }; } },
  { tier: 2, gen() { const o = rnd(1, 5); const s = [0, 1, 2, 3, 4].map((i) => (i + o) ** 2); return { s, next: (5 + o) ** 2, rule: 'square numbers' }; } },
  { tier: 2, gen() { const a = rnd(1, 4), b = rnd(2, 6); const s = [a, b]; while (s.length < 6) s.push(s[s.length - 1] + s[s.length - 2]); return { s, next: s[4] + s[5], rule: 'each number is the two before it added together' }; } },
  { tier: 3, gen() { const a = rnd(2, 6), m = rnd(2, 3), d = rnd(1, 5); const s = [a]; for (let i = 0; i < 5; i++) s.push(i % 2 === 0 ? s[s.length - 1] * m : s[s.length - 1] + d); return { s, next: s[5] * m, rule: `alternate ×${m} and +${d}` }; } },
  { tier: 3, gen() { const p = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]; const o = rnd(0, 5); return { s: p.slice(o, o + 5), next: p[o + 5], rule: 'prime numbers' }; } },
  { tier: 3, gen() { const a = rnd(1, 9), b = rnd(20, 40), d1 = rnd(2, 5), d2 = rnd(1, 3); const s = []; for (let i = 0; i < 6; i++) s.push(i % 2 === 0 ? a + d1 * (i / 2) : b - d2 * ((i - 1) / 2)); return { s, next: a + d1 * 3, rule: `two series woven together: +${d1} and −${d2}` }; } },
  { tier: 4, gen() { const o = rnd(1, 3); const s = [0, 1, 2, 3, 4].map((i) => (i + o) ** 3); return { s, next: (5 + o) ** 3, rule: 'cube numbers' }; } },
  { tier: 4, gen() { const a = rnd(1, 4); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * 2 + (i % 2 ? 1 : -1)); return { s, next: s[5] * 2 + 1, rule: 'double, then alternately +1 and −1' }; } },
  { tier: 4, gen() { const a = rnd(2, 5); const s = [a]; for (let i = 1; i < 5; i++) s.push(s[i - 1] + i * i); return { s, next: s[4] + 25, rule: 'add 1, 4, 9, 16… (square numbers)' }; } },
];
function numberSeries(tier) {
  const pool = series.filter((g) => g.tier === tier);
  const g = pick(pool.length ? pool : series);
  const { s, next, rule } = g.gen();
  const q = mk('patterns', { subtopic: 'Number Pattern', tier: g.tier, prompt: `What number comes next?\n${s.join(',  ')},  ___`,
    hints: ['Look at how each number gets from the one before it.', 'Write out the gaps between the numbers.', `The rule: ${rule}.`] });
  return numOpts(q, next, Math.max(2, Math.round(Math.abs(next - s[s.length - 1]) / 2)));
}
function letterSeries(tier) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const step = tier <= 1 ? 2 : tier === 2 ? 3 : rnd(4, 5);
  const start = rnd(0, 25 - step * 5);
  const s = [0, 1, 2, 3].map((i) => A[start + step * i]);
  const next = A[start + step * 4];
  const q = mk('patterns', { subtopic: 'Letter Pattern', tier: Math.min(4, tier), prompt: `Which letter comes next?\n${s.join(',  ')},  ___`,
    hints: ['Count how far apart the letters are in the alphabet.', `Each step skips ${step - 1} letter${step > 2 ? 's' : ''}.`, `Move ${step} letters forward from ${s[3]}.`] });
  return opts(q, next, [A[start + step * 4 + 1], A[start + step * 4 - 1], A[start + step * 3 + 1], A[Math.min(25, start + step * 5)]].filter(Boolean));
}
function patterns(tier) { return Math.random() < 0.7 ? numberSeries(tier) : letterSeries(tier); }

// ══ Shapes ═════════════════════════════════════════════════════
const FILLS = ['none', 'hatch', 'solid'];
function shapeSeq(tier) {
  const kinds = tier === 1 ? ['sides', 'rotate', 'dots'] : tier === 2 ? ['sides', 'rotate', 'dots', 'fillcycle'] : ['rotfill', 'sidesdots', 'dots', 'fillcycle'];
  const kind = pick(kinds);
  let items, answer, wrongs, hints;
  if (kind === 'sides') {
    const s0 = rnd(3, 4);
    items = [0, 1, 2, 3].map((i) => ({ sides: s0 + i, fill: 'none' }));
    answer = { sides: s0 + 4, fill: 'none' };
    wrongs = [{ sides: s0 + 3, fill: 'none' }, { sides: s0 + 5, fill: 'none' }, { sides: 0, fill: 'none' }];
    hints = ['Count the corners.', 'Each shape gains something.', 'One more side every step.'];
  } else if (kind === 'rotate') {
    const step = pick([45, 90]);
    items = [0, 1, 2, 3].map((i) => ({ sides: 3, rot: step * i, fill: 'none', arrow: true }));
    answer = { sides: 3, rot: step * 4, fill: 'none', arrow: true };
    wrongs = [{ sides: 3, rot: step * 3, fill: 'none', arrow: true }, { sides: 3, rot: step * 4 + 90, fill: 'none', arrow: true }, { sides: 3, rot: step * 4 + 180, fill: 'none', arrow: true }];
    hints = ['Watch which way the arrow points.', 'It turns the same amount each step.', `It turns ${step}° clockwise each time.`];
  } else if (kind === 'dots') {
    const sides = pick([0, 4]); const d0 = rnd(1, 2), d = tier >= 3 ? 2 : 1, n = d0 + d * 4;
    items = [0, 1, 2, 3].map((i) => ({ sides, fill: 'none', dots: d0 + d * i }));
    answer = { sides, fill: 'none', dots: n };
    wrongs = [{ sides, fill: 'none', dots: n - 1 }, { sides, fill: 'none', dots: n + 1 }, { sides: sides ? 0 : 4, fill: 'none', dots: n }];
    hints = ['Count what is inside.', `The dots go up by ${d}.`, `The next one has ${n} dots.`];
  } else if (kind === 'fillcycle') {
    const sides = pick([0, 4, 6]);
    items = [0, 1, 2, 3].map((i) => ({ sides, fill: FILLS[i % 3] }));
    answer = { sides, fill: FILLS[1] };
    wrongs = [{ sides, fill: 'none' }, { sides, fill: 'solid' }, { sides: sides === 4 ? 6 : 4, fill: 'hatch' }];
    hints = ['Look at the inside of each shape.', 'The fills repeat in a cycle of three.', 'Empty → striped → solid → empty → …'];
  } else if (kind === 'rotfill') {
    items = [0, 1, 2, 3].map((i) => ({ sides: 3, rot: 90 * i, fill: i % 2 ? 'solid' : 'none', arrow: true }));
    answer = { sides: 3, rot: 360, fill: 'none', arrow: true };
    wrongs = [{ sides: 3, rot: 360, fill: 'solid', arrow: true }, { sides: 3, rot: 450, fill: 'none', arrow: true }, { sides: 3, rot: 270, fill: 'solid', arrow: true }];
    hints = ['Two things change at once.', 'It turns 90° and the fill flips each time.', 'Pointing up again, and empty.'];
  } else {
    items = [0, 1, 2, 3].map((i) => ({ sides: 3 + i, fill: 'none', dots: 4 - i }));
    answer = { sides: 7, fill: 'none', dots: 0 };
    wrongs = [{ sides: 7, fill: 'none', dots: 1 }, { sides: 6, fill: 'none', dots: 0 }, { sides: 8, fill: 'none', dots: 0 }];
    hints = ['Count sides and dots separately.', 'Sides go up while dots go down.', '7 sides, no dots.'];
  }
  const all = shuffle([answer, ...wrongs]);
  return mk('shapes', { subtopic: 'What Comes Next', tier: Math.min(4, tier), prompt: 'Which shape comes next?', visual: { type: 'sequence', items },
    answers: all.map((o) => ({ shape: o })), correct: all.indexOf(answer), hints });
}
function shapeOdd(tier) {
  const sides = pick([3, 4, 5, 6]);
  const base = { sides, fill: pick(FILLS) };
  const odd = tier <= 1 ? { ...base, sides: sides === 4 ? 5 : 4 } : pick([{ ...base, sides: sides + 1 }, { ...base, fill: base.fill === 'none' ? 'solid' : 'none' }, { ...base, dots: 1 }]);
  const all = shuffle([base, { ...base }, { ...base }, odd]);
  return mk('shapes', { subtopic: 'Odd Shape Out', tier: Math.min(2, tier), prompt: 'Which shape does not belong?', answers: all.map((o) => ({ shape: o })), correct: all.indexOf(odd),
    hints: ['Three of these are identical.', 'Compare the corners, the inside and any dots.', 'Look for the one that is different in just one way.'] });
}
function shapes(tier) { return tier <= 2 && Math.random() < 0.3 ? shapeOdd(tier) : shapeSeq(tier); }

// ══ Logic & riddles ════════════════════════════════════════════
const RIDDLES = [
  [1, 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops Lazzies?', 'Yes', ['No', 'Only some', 'Cannot tell'], ['Follow the chain.', 'Bloop → Razzie → Lazzie.', 'Inside a box inside a box is still inside the big box.']],
  [1, 'A farmer has 17 sheep. All but 9 run away. How many are left?', '9', ['8', '0', '17'], ['Read "all but" carefully.', '"All but 9" means 9 stayed.', 'It is a number in the question.']],
  [1, 'What has to be broken before you can use it?', 'An egg', ['A promise', 'A seal', 'A code'], ['Think kitchen.', 'Breakfast.', 'It comes from a chicken.']],
  [1, 'How many months have 28 days?', 'All 12', ['1', '2', '6'], ['Not "only" 28.', 'Every month reaches day 28.', 'All of them.']],
  [1, 'What has hands but cannot clap?', 'A clock', ['A glove', 'A statue', 'A tree'], ['It hangs on a wall.', 'It tells you something all day.', 'Tick, tock.']],
  [1, 'What gets wetter the more it dries?', 'A towel', ['A sponge', 'Rain', 'Soap'], ['You use it after a bath.', 'It dries you.', 'Bathroom.']],
  [1, 'What has keys but can\'t open locks?', 'A piano', ['A map', 'A janitor', 'A car'], ['Think music.', 'Black and white keys.', 'You play it.']],
  [2, 'A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much is the ball?', '5¢', ['10¢', '1¢', '15¢'], ['10¢ is the trap answer.', 'If the ball is x, the bat is x + $1.00.', '2x + 1.00 = 1.10.']],
  [2, 'Mary\'s father has five daughters: Nana, Nene, Nini, Nono. What is the fifth daughter\'s name?', 'Mary', ['Nunu', 'Nina', 'Nan'], ['Re-read the first word.', 'Whose father is it?', 'She is in the question.']],
  [2, 'You\'re in a race and pass the person in 2nd place. What place are you in now?', '2nd', ['1st', '3rd', 'Last'], ['You did not pass the leader.', 'You took their spot.', 'You replace the person you passed.']],
  [2, 'It takes 5 machines 5 minutes to make 5 widgets. How long would 100 machines take to make 100 widgets?', '5 minutes', ['100 minutes', '20 minutes', '50 minutes'], ['How long does one machine take for one widget?', 'Each machine makes 1 widget in 5 minutes.', 'More machines, same time.']],
  [2, 'The more you take, the more you leave behind. What are they?', 'Footsteps', ['Memories', 'Breaths', 'Photos'], ['You do it walking.', 'Look behind you on the beach.', 'Feet.']],
  [2, 'What can you catch but not throw?', 'A cold', ['A ball', 'A fish', 'A bus'], ['It makes you sneeze.', 'You get it in winter.', 'Achoo.']],
  [2, 'What runs but never walks, has a mouth but never talks?', 'A river', ['A clock', 'A dog', 'A road'], ['It is outdoors.', 'It has a bed too.', 'It flows to the sea.']],
  [3, 'A patch of lily pads doubles in size every day. It covers the lake on day 48. When did it cover half?', 'Day 47', ['Day 24', 'Day 36', 'Day 46'], ['Work backwards from day 48.', 'It doubles from half to full in one day.', 'One day before full.']],
  [3, 'A clock shows 3:15. What is the angle between the hour and minute hands?', '7.5°', ['0°', '15°', '22.5°'], ['The hour hand moves too.', 'In 15 minutes the hour hand moves a quarter of 30°.', '30° ÷ 4.']],
  [3, 'Tom is taller than Ann. Ann is taller than Joe. Kim is shorter than Joe. Who is second shortest?', 'Joe', ['Ann', 'Kim', 'Tom'], ['Line them up.', 'Tom > Ann > Joe > Kim.', 'One above the shortest.']],
  [3, 'If 3 cats catch 3 mice in 3 minutes, how many cats catch 100 mice in 100 minutes?', '3', ['100', '33', '10'], ['What is one cat\'s pace?', 'Each cat catches 1 mouse every 3 minutes.', 'The same 3 cats keep going.']],
  [3, 'A man pushes his car to a hotel and tells the owner he\'s bankrupt. Why?', 'He\'s playing Monopoly', ['His car broke down', 'He lost a bet', 'He was robbed'], ['It is a game.', 'Hotels, cars and bankruptcy all fit one board.', 'The car is a playing piece.']],
  [3, 'What word becomes shorter when you add two letters to it?', 'Short', ['Long', 'Small', 'Tiny'], ['Take it literally.', 'Add "er" to it.', 'The answer is in the question.']],
  [4, 'A clock loses 4 minutes every 3 hours. Set right at noon, what does it show at 6 PM the next day?', '5:20 PM', ['5:12 PM', '5:32 PM', '5:00 PM'], ['How many hours pass?', '30 hours = 10 blocks of 3 hours.', '10 × 4 = 40 minutes slow.']],
  [4, 'Two ropes each burn for exactly 60 minutes, but unevenly. How do you time exactly 45 minutes?', 'Light rope A at both ends and B at one; when A is gone, light B\'s other end', ['Burn A, then half of B', 'Cut each rope in half', 'Light both ropes at both ends'], ['Lighting both ends halves the time.', 'One rope lit at both ends lasts 30 minutes.', '30 + 15 = 45.']],
  [4, 'Three boxes are labelled Apples, Oranges and Mixed, and every label is wrong. Which box do you open (one fruit only) to fix every label?', 'Mixed', ['Apples', 'Oranges', 'Any of them'], ['Every label is wrong.', 'The "Mixed" box must hold just one kind.', 'One fruit from it tells you everything.']],
  [4, 'What is the next number: 1, 11, 21, 1211, 111221, ___', '312211', ['122111', '1112221', '211211'], ['Read the previous number out loud.', 'Describe it: "one 1", "two 1s"…', '111221 = three 1s, two 2s, one 1.']],
  [4, 'You have 8 identical-looking balls; one is heavier. What is the fewest balance weighings to be sure which?', '2', ['3', '1', '4'], ['Split into three groups, not two.', '3 vs 3, with 2 set aside.', 'Each weighing has three outcomes.']],
];
function logic(tier) {
  const [t, prompt, right, wrongs, hints] = pick(near(RIDDLES, tier));
  const answers = shuffle([right, ...wrongs]);
  return mk('logic', { id: 'RID-' + RIDDLES.findIndex((r) => r[1] === prompt), subtopic: 'Riddle', tier: t, prompt, answers, correct: answers.indexOf(right), hints });
}

// ══ Word play ══════════════════════════════════════════════════
const WORDS = {
  animal: ['cat', 'dog', 'horse', 'zebra', 'tiger', 'rabbit', 'donkey', 'monkey', 'giraffe', 'dolphin', 'penguin', 'kangaroo', 'elephant', 'crocodile', 'alligator', 'chimpanzee'],
  fruit: ['pear', 'lemon', 'mango', 'peach', 'grape', 'banana', 'cherry', 'orange', 'apricot', 'avocado', 'coconut', 'pineapple', 'blueberry', 'raspberry', 'watermelon', 'strawberry'],
  country: ['peru', 'chad', 'spain', 'japan', 'egypt', 'italy', 'france', 'mexico', 'brazil', 'canada', 'norway', 'germany', 'ireland', 'portugal', 'argentina', 'australia'],
  sport: ['golf', 'judo', 'rugby', 'tennis', 'soccer', 'hockey', 'boxing', 'cricket', 'cycling', 'archery', 'baseball', 'swimming', 'gymnastics', 'basketball', 'volleyball'],
};
const OPPOSITES = [
  [1, 'hot', 'cold', ['warm', 'wet', 'loud']], [1, 'happy', 'sad', ['glad', 'tired', 'calm']], [1, 'early', 'late', ['soon', 'fast', 'first']],
  [1, 'empty', 'full', ['open', 'heavy', 'clean']], [1, 'quiet', 'loud', ['calm', 'still', 'soft']],
  [2, 'ancient', 'modern', ['old', 'broken', 'famous']], [2, 'brave', 'cowardly', ['bold', 'clever', 'lazy']], [2, 'generous', 'stingy', ['kind', 'wealthy', 'humble']],
  [2, 'expand', 'shrink', ['grow', 'stretch', 'repeat']], [2, 'temporary', 'permanent', ['brief', 'modern', 'sudden']], [2, 'shallow', 'deep', ['narrow', 'flat', 'wide']],
  [3, 'scarce', 'plentiful', ['rare', 'scary', 'hidden']], [3, 'transparent', 'opaque', ['clear', 'shiny', 'fragile']], [3, 'optimist', 'pessimist', ['realist', 'dreamer', 'idealist']],
  [3, 'vague', 'precise', ['unclear', 'empty', 'wavy']], [3, 'reluctant', 'eager', ['hesitant', 'slow', 'tired']],
  [4, 'frugal', 'extravagant', ['thrifty', 'fragile', 'careful']], [4, 'benevolent', 'malevolent', ['kind', 'violent', 'generous']], [4, 'verbose', 'concise', ['wordy', 'vocal', 'clever']],
  [4, 'ephemeral', 'enduring', ['fleeting', 'heavenly', 'gentle']], [4, 'zenith', 'nadir', ['peak', 'summit', 'horizon']],
];
const SYNONYMS = [
  [1, 'big', 'large', ['tiny', 'fast', 'soft']], [1, 'quick', 'fast', ['slow', 'quiet', 'odd']], [1, 'angry', 'mad', ['glad', 'sleepy', 'shy']], [1, 'begin', 'start', ['end', 'stop', 'wait']],
  [2, 'enormous', 'gigantic', ['tiny', 'noisy', 'normal']], [2, 'exhausted', 'worn out', ['excited', 'hungry', 'nervous']], [2, 'courageous', 'brave', ['careful', 'curious', 'cruel']],
  [2, 'rapid', 'swift', ['steady', 'rough', 'rare']], [2, 'peculiar', 'strange', ['particular', 'polite', 'plain']],
  [3, 'candid', 'frank', ['sweet', 'shy', 'secret']], [3, 'meticulous', 'careful', ['messy', 'quick', 'musical']], [3, 'gloomy', 'dismal', ['glowing', 'grateful', 'sticky']],
  [3, 'tranquil', 'peaceful', ['tropical', 'tiny', 'tense']], [3, 'feeble', 'weak', ['fierce', 'cheap', 'free']],
  [4, 'ubiquitous', 'everywhere', ['unique', 'unknown', 'ugly']], [4, 'gregarious', 'sociable', ['greedy', 'serious', 'graceful']], [4, 'lethargic', 'sluggish', ['legal', 'lively', 'lonely']],
  [4, 'cacophony', 'din', ['harmony', 'silence', 'melody']], [4, 'obstinate', 'stubborn', ['obvious', 'obedient', 'ordinary']],
];
const LINKS = [
  [2, 'fly', 'cup', 'butter', ['tea', 'fire', 'coffee']], [2, 'flower', 'glasses', 'sun', ['wine', 'wild', 'eye']], [2, 'works', 'place', 'fire', ['work', 'home', 'market']],
  [2, 'bow', 'coat', 'rain', ['over', 'rib', 'fur']], [2, 'ball', 'print', 'foot', ['base', 'finger', 'snow']], [2, 'man', 'flake', 'snow', ['corn', 'super', 'sea']],
  [3, 'fish', 'light', 'star', ['gold', 'flash', 'moon']], [3, 'shelf', 'worm', 'book', ['earth', 'silk', 'glass']], [3, 'brush', 'paste', 'tooth', ['hair', 'paint', 'tomato']],
  [3, 'shell', 'horse', 'sea', ['egg', 'race', 'nut']], [3, 'board', 'hole', 'key', ['skate', 'black', 'rabbit']], [3, 'fall', 'melon', 'water', ['night', 'free', 'honey']],
];
function words(tier) {
  const kind = pick(tier === 1 ? ['scramble', 'scramble', 'opposite', 'synonym'] : ['scramble', 'opposite', 'synonym', 'link']);
  if (kind === 'scramble') {
    const cat = pick(Object.keys(WORDS));
    const len = tier === 1 ? [3, 5] : tier === 2 ? [6, 6] : tier === 3 ? [7, 8] : [9, 12];
    let pool = WORDS[cat].filter((w) => w.length >= len[0] && w.length <= len[1]);
    if (!pool.length) pool = WORDS[cat];
    const w = pick(pool);
    let s = w; for (let i = 0; i < 10 && s === w; i++) s = shuffle([...w]).join('');
    const others = shuffle(WORDS[cat].filter((x) => x !== w)).sort((a, b) => Math.abs(a.length - w.length) - Math.abs(b.length - w.length)).slice(0, 3);
    const cap = (x) => x[0].toUpperCase() + x.slice(1);
    const q = mk('words', { subtopic: 'Unscramble', tier, prompt: `Unscramble these letters to find a${cat === 'animal' ? 'n' : ''} ${cat}:\n${s.toUpperCase().split('').join(' ')}`,
      hints: ['Look for common letter pairs.', `It starts with ${w[0].toUpperCase()}.`, `It starts "${cap(w.slice(0, Math.ceil(w.length / 2)))}…"`] });
    return opts(q, cap(w), others.map(cap));
  }
  if (kind === 'link') {
    const [t, a, b, right, wrongs] = pick(near(LINKS, tier));
    const q = mk('words', { subtopic: 'Missing Link', tier: t, prompt: `Which word goes in front of both "${a}" and "${b}"?\n___${a}   ·   ___${b}`, hints: ['Try each answer with both words.', 'The two words make compound words.', `${right[0].toUpperCase()}… ${a}.`] });
    return opts(q, right, wrongs);
  }
  const list = kind === 'opposite' ? OPPOSITES : SYNONYMS;
  const [t, word, right, wrongs] = pick(near(list, tier));
  const q = mk('words', { subtopic: kind === 'opposite' ? 'Opposites' : 'Same Meaning', tier: t,
    prompt: kind === 'opposite' ? `What is the opposite of "${word}"?` : `Which word means the same as "${word}"?`,
    hints: [kind === 'opposite' ? 'Two of the wrong answers are close in meaning, not opposite.' : 'Try each one in a sentence.', `It starts with "${right[0]}".`, `It has ${right.length} letters.`] });
  return opts(q, right, wrongs);
}

// ══ Odd one out (words) ════════════════════════════════════════
// [tier, [items], odd, reason]
const ODD = [
  [1, ['Apple', 'Banana', 'Carrot', 'Cherry'], 'Carrot', 'The rest are fruits.'], [1, ['Red', 'Blue', 'Circle', 'Green'], 'Circle', 'The rest are colors.'],
  [1, ['Piano', 'Guitar', 'Violin', 'Hammer'], 'Hammer', 'The rest are instruments.'], [1, ['Monday', 'Friday', 'June', 'Sunday'], 'June', 'The rest are days.'],
  [1, ['Dog', 'Cat', 'Eagle', 'Horse'], 'Eagle', 'The rest are four-legged mammals.'], [1, ['Shirt', 'Socks', 'Spoon', 'Hat'], 'Spoon', 'The rest are clothes.'],
  [2, ['Shark', 'Salmon', 'Dolphin', 'Tuna'], 'Dolphin', 'The rest are fish; a dolphin is a mammal.'], [2, ['Mercury', 'Venus', 'Moon', 'Mars'], 'Moon', 'The rest are planets.'],
  [2, ['Square', 'Triangle', 'Cube', 'Circle'], 'Cube', 'The rest are flat shapes.'], [2, ['Paris', 'Rome', 'Madrid', 'Sydney'], 'Sydney', 'The rest are capital cities.'],
  [2, ['Penguin', 'Ostrich', 'Emu', 'Eagle'], 'Eagle', 'The rest can\'t fly.'], [2, ['Spider', 'Ant', 'Bee', 'Beetle'], 'Spider', 'The rest are insects; spiders have 8 legs.'],
  [2, ['Amazon', 'Nile', 'Sahara', 'Danube'], 'Sahara', 'The rest are rivers.'], [2, ['Violin', 'Cello', 'Flute', 'Harp'], 'Flute', 'The rest have strings.'],
  [3, ['Mozart', 'Beethoven', 'Picasso', 'Bach'], 'Picasso', 'The rest are composers.'], [3, ['Jupiter', 'Saturn', 'Neptune', 'Mars'], 'Mars', 'The rest are gas or ice giants.'],
  [3, ['Python', 'Java', 'Ruby', 'Cobra'], 'Cobra', 'The rest are programming languages.'], [3, ['2', '3', '5', '9'], '9', 'The rest are prime numbers.'],
  [3, ['16', '25', '36', '48'], '48', 'The rest are square numbers.'], [3, ['Kangaroo', 'Koala', 'Wombat', 'Panda'], 'Panda', 'The rest carry babies in a pouch.'],
  [3, ['Tomato', 'Cucumber', 'Pumpkin', 'Lettuce'], 'Lettuce', 'The rest are fruits, botanically.'], [3, ['Oxygen', 'Gold', 'Iron', 'Silver'], 'Oxygen', 'The rest are metals.'],
  [4, ['21', '35', '49', '54'], '54', 'The rest are multiples of 7.'], [4, ['Iron', 'Copper', 'Bronze', 'Gold'], 'Bronze', 'The rest are pure elements; bronze is an alloy.'],
  [4, ['Haiku', 'Sonnet', 'Limerick', 'Sonata'], 'Sonata', 'The rest are kinds of poem.'], [4, ['Rhombus', 'Trapezoid', 'Pentagon', 'Kite'], 'Pentagon', 'The rest have four sides.'],
  [4, ['Mercury', 'Venus', 'Earth', 'Mars'], 'Earth', 'The rest are named after Roman gods.'], [4, ['Bat', 'Whale', 'Platypus', 'Shark'], 'Shark', 'The rest are mammals.'],
];
function oddone(tier) {
  const [t, items, odd, reason] = pick(near(ODD, tier));
  const answers = shuffle(items);
  return mk('oddone', { subtopic: 'Odd One Out', tier: t, prompt: 'Which one doesn\'t belong?', answers, correct: answers.indexOf(odd),
    hints: ['Three of them share something.', 'Think about what kind of thing each one is.', reason] });
}

// ══ Emoji puzzles ══════════════════════════════════════════════
// [tier, emoji, answer, wrongs, kind]
const EMOJI = [
  [1, '☀️ + 🌼', 'Sunflower', ['Daisy', 'Sunrise', 'Sunlight'], 'word'], [1, '⭐ + 🐟', 'Starfish', ['Goldfish', 'Swordfish', 'Jellyfish'], 'word'],
  [1, '🌧️ + 🧥', 'Raincoat', ['Rainbow', 'Raindrop', 'Umbrella'], 'word'], [1, '🧈 + 🪰', 'Butterfly', ['Dragonfly', 'Firefly', 'Buttercup'], 'word'],
  [1, '❄️ + 👨', 'Snowman', ['Snowflake', 'Iceman', 'Snowball'], 'word'], [1, '🦷 + 🪥', 'Toothbrush', ['Toothpaste', 'Hairbrush', 'Paintbrush'], 'word'],
  [1, '🦶 + ⚽', 'Football', ['Footprint', 'Footstep', 'Basketball'], 'word'], [1, '🦇 + 🧑', 'Batman', ['Spider-Man', 'Dracula', 'Robin'], 'movie'],
  [2, '🍯 + 🌙', 'Honeymoon', ['Moonlight', 'Honeycomb', 'Moonbeam'], 'word'], [2, '🔥 + 🎆', 'Fireworks', ['Firewood', 'Fireplace', 'Firefly'], 'word'],
  [2, '🐴 + 👞', 'Horseshoe', ['Horsepower', 'Racehorse', 'Shoelace'], 'word'], [2, '💧 + 🍈', 'Watermelon', ['Waterfall', 'Honeydew', 'Cantaloupe'], 'word'],
  [2, '🔑 + 🕳️', 'Keyhole', ['Keyboard', 'Doorknob', 'Pothole'], 'word'], [2, '🏠 + ⛵', 'Houseboat', ['Lighthouse', 'Sailboat', 'Treehouse'], 'word'],
  [2, '🦁👑', 'The Lion King', ['Madagascar', 'The Jungle Book', 'Tarzan'], 'movie'], [2, '❄️👸', 'Frozen', ['Snow White', 'Cinderella', 'Tangled'], 'movie'],
  [2, '🐠🔍', 'Finding Nemo', ['The Little Mermaid', 'Shark Tale', 'Moana'], 'movie'], [2, '🕷️🧑', 'Spider-Man', ['Ant-Man', 'Batman', 'Iron Man'], 'movie'],
  [2, '🧸🤠🚀', 'Toy Story', ['Cars', 'Up', 'WALL-E'], 'movie'], [2, '🙈🙉🙊', 'See no evil, hear no evil, speak no evil', ['Monkey see, monkey do', 'Silence is golden', 'Three wise men'], 'saying'],
  [3, '🏠🎈👴', 'Up', ['Coco', 'Ratatouille', 'Inside Out'], 'movie'], [3, '🐀👨‍🍳', 'Ratatouille', ['Stuart Little', 'Chef', 'Flushed Away'], 'movie'],
  [3, '🚢🧊💔', 'Titanic', ['Jaws', 'Life of Pi', 'Moby Dick'], 'movie'], [3, '🦖🏝️', 'Jurassic Park', ['King Kong', 'Godzilla', 'Cast Away'], 'movie'],
  [3, '🐼🥋', 'Kung Fu Panda', ['The Karate Kid', 'Mulan', 'Big Hero 6'], 'movie'], [3, '🧞🪔', 'Aladdin', ['Mulan', 'Hercules', 'Sinbad'], 'movie'],
  [3, '👻🚫', 'Ghostbusters', ['Casper', 'Beetlejuice', 'Poltergeist'], 'movie'], [3, '🌧️🐱🐶', 'Raining cats and dogs', ['It\'s a dog\'s life', 'Cat got your tongue', 'Let sleeping dogs lie'], 'saying'],
  [3, '🌙🔵', 'Once in a blue moon', ['Over the moon', 'Feeling blue', 'Blue sky thinking'], 'saying'], [3, '🧊🔨', 'Break the ice', ['On thin ice', 'Tip of the iceberg', 'Ice cold'], 'saying'],
  [3, '⏰💰', 'Time is money', ['Money talks', 'Time flies', 'Pay the price'], 'saying'], [3, '🐘🏠', 'The elephant in the room', ['A white elephant', 'Elephants never forget', 'Big as a house'], 'saying'],
  [4, '🧙‍♂️💍🌋', 'The Lord of the Rings', ['Narnia', 'Star Wars', 'Harry Potter'], 'movie'], [4, '🍫🏭', 'Charlie and the Chocolate Factory', ['Chocolat', 'Matilda', 'Coraline'], 'movie'],
  [4, '🌪️🏠👠', 'The Wizard of Oz', ['Twister', 'Alice in Wonderland', 'Peter Pan'], 'movie'], [4, '⏰🔙🚗', 'Back to the Future', ['Cars', 'Fast & Furious', 'Interstellar'], 'movie'],
  [4, '🐴🛒', 'Putting the cart before the horse', ['Hold your horses', 'A dark horse', 'Horse sense'], 'saying'], [4, '🍎👁️', 'The apple of my eye', ['A bad apple', 'The Big Apple', 'An apple a day'], 'saying'],
  [4, '🐦🐦🪨', 'Two birds, one stone', ['The early bird gets the worm', 'A bird in the hand', 'Birds of a feather'], 'saying'],
];
const EMOJI_PROMPT = { word: 'What word do these emoji make?', movie: 'Which movie is this?', saying: 'Which saying is this?' };
function emoji(tier) {
  const [t, e, right, wrongs, kind] = pick(near(EMOJI, tier));
  const answers = shuffle([right, ...wrongs]);
  return mk('emoji', { id: 'EMO-' + EMOJI.findIndex((x) => x[1] === e), subtopic: 'Emoji ' + (kind === 'word' ? 'Words' : kind === 'movie' ? 'Movies' : 'Sayings'), tier: t,
    prompt: EMOJI_PROMPT[kind], visual: { type: 'emoji', text: e }, answers, correct: answers.indexOf(right),
    hints: [kind === 'word' ? 'Put the two pictures together as one word.' : kind === 'movie' ? 'Think of the main character.' : 'It\'s an everyday expression.', `It starts with "${right.replace(/^The /, '')[0]}".`, `It's ${right.split(' ').length} word${right.split(' ').length > 1 ? 's' : ''}: ${right.split(' ').map((w) => w[0] + '…').join(' ')}`] });
}

const GENERATORS = { colors, spelling, math, patterns, shapes, logic, words, oddone, emoji };
export const GEN_TOPICS = Object.keys(GENERATORS);

export function generate(topic, tier, avoidIds = new Set()) {
  const g = GENERATORS[topic] || patterns;
  tier = Math.max(1, Math.min(4, Math.round(tier)));
  let q;
  for (let i = 0; i < 6; i++) { q = g(tier); if (!avoidIds.has(q.id)) break; }
  return q;
}
