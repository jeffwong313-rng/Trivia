// Puzzle questions: IQ-style number/letter series, "find the next shape",
// odd-one-out, and hand-written logic riddles. Generators give endless variety.

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let uid = 0;
const mk = (fields) => ({ id: 'PUZ-' + (++uid) + '-' + Date.now().toString(36), kind: 'puzzle', source: 'puzzle', topic: 'Puzzle', ...fields });

// Build 4 answer options from a correct answer + wrong ones, then shuffle.
function withOptions(q, correct, wrongs) {
  const uniq = [...new Set(wrongs.map(String))].filter((w) => w !== String(correct)).slice(0, 3);
  while (uniq.length < 3) uniq.push(String(Number(correct) + rnd(2, 9) * (Math.random() < 0.5 ? -1 : 1)));
  const answers = shuffle([String(correct), ...uniq]);
  return { ...q, answers, correct: answers.indexOf(String(correct)) };
}
const numberWrongs = (c, spread) => shuffle([c + 1, c - 1, c + 2, c - 2, c + spread, c - spread, c + spread * 2, c * 2, Math.round(c * 1.5)]).filter((x) => x !== c && x >= 0);

// ── Number series ──────────────────────────────────────────────
const series = [
  { tier: 1, gen() { const a = rnd(1, 20), d = rnd(2, 9); const s = [0, 1, 2, 3, 4].map((i) => a + d * i); return { s, next: a + d * 5, rule: `add ${d} each time`, sub: 'Number Series' }; } },
  { tier: 1, gen() { const a = rnd(1, 5), r = 2; const s = [0, 1, 2, 3, 4].map((i) => a * r ** i); return { s, next: a * r ** 5, rule: 'double each time', sub: 'Number Series' }; } },
  { tier: 2, gen() { const a = rnd(1, 3), r = 3; const s = [0, 1, 2, 3].map((i) => a * r ** i); return { s, next: a * r ** 4, rule: 'multiply by 3', sub: 'Number Series' }; } },
  { tier: 2, gen() { const o = rnd(1, 4); const s = [0, 1, 2, 3, 4].map((i) => (i + o) * (i + o + 1)); return { s, next: (5 + o) * (6 + o), rule: 'n × (n+1): the gaps grow by 2', sub: 'Number Series' }; } },
  { tier: 2, gen() { const o = rnd(1, 5); const s = [0, 1, 2, 3, 4].map((i) => (i + o) ** 2); return { s, next: (5 + o) ** 2, rule: 'square numbers', sub: 'Number Series' }; } },
  { tier: 2, gen() { let a = rnd(1, 4), b = rnd(2, 6); const s = [a, b]; while (s.length < 6) s.push(s[s.length - 1] + s[s.length - 2]); return { s, next: s[4] + s[5], rule: 'each number is the sum of the two before it', sub: 'Number Series' }; } },
  { tier: 3, gen() { const a = rnd(2, 6), m = rnd(2, 3), d = rnd(1, 5); const s = [a]; for (let i = 0; i < 5; i++) s.push(i % 2 === 0 ? s[s.length - 1] * m : s[s.length - 1] + d); return { s, next: s[5] * m, rule: `alternate ×${m} and +${d}`, sub: 'Alternating Series' }; } },
  { tier: 3, gen() { const p = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37]; const o = rnd(0, 5); const s = p.slice(o, o + 5); return { s, next: p[o + 5], rule: 'prime numbers', sub: 'Number Series' }; } },
  { tier: 3, gen() { const a = rnd(1, 9), b = rnd(20, 40), d1 = rnd(2, 5), d2 = rnd(1, 3); const s = []; for (let i = 0; i < 6; i++) s.push(i % 2 === 0 ? a + d1 * (i / 2) : b - d2 * ((i - 1) / 2)); return { s, next: a + d1 * 3, rule: `two interleaved series: +${d1} and −${d2}`, sub: 'Interleaved Series' }; } },
  { tier: 4, gen() { const o = rnd(1, 3); const s = [0, 1, 2, 3, 4].map((i) => (i + o) ** 3); return { s, next: (5 + o) ** 3, rule: 'cube numbers', sub: 'Number Series' }; } },
  { tier: 4, gen() { const a = rnd(1, 4); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * 2 + (i % 2 ? 1 : -1)); return { s, next: s[5] * 2 + (6 % 2 ? 1 : -1), rule: 'double, then alternately +1 and −1', sub: 'Hidden Rule' }; } },
  { tier: 4, gen() { const a = rnd(2, 5); const s = [a]; for (let i = 1; i < 5; i++) s.push(s[i - 1] + i * i); return { s, next: s[4] + 25, rule: 'add 1, 4, 9, 16… (square numbers)', sub: 'Hidden Rule' }; } },
];

function numberSeries(tier) {
  const pool = series.filter((g) => g.tier === tier);
  const g = pick(pool.length ? pool : series);
  const { s, next, rule, sub } = g.gen();
  const q = mk({ subtopic: sub, tier: g.tier, prompt: `What number comes next?\n${s.join(',  ')},  ___`,
    hints: [`Look at how each number gets from the one before it.`, `Write out the gaps between the numbers.`, `The rule: ${rule}.`] });
  return withOptions(q, next, numberWrongs(next, Math.max(2, Math.round(Math.abs(next - s[s.length - 1]) / 2))));
}

// ── Letter series ─────────────────────────────────────────────
function letterSeries(tier) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const step = tier <= 2 ? rnd(2, 3) : rnd(3, 5);
  const start = rnd(0, 25 - step * 5);
  const s = [0, 1, 2, 3].map((i) => A[start + step * i]);
  const next = A[start + step * 4];
  const wrongs = [A[start + step * 4 + 1], A[start + step * 4 - 1], A[start + step * 3 + 1], A[start + step * 5] || 'Z'].filter(Boolean);
  const q = mk({ subtopic: 'Letter Series', tier: Math.min(4, tier), prompt: `Which letter comes next?\n${s.join(',  ')},  ___`,
    hints: ['Count how far apart the letters are in the alphabet.', `Each step skips ${step - 1} letter${step > 2 ? 's' : ''}.`, `Move ${step} letters forward from ${s[3]}.`] });
  return withOptions(q, next, wrongs);
}

// ── Shape sequences (rendered as sketchy SVG) ────────────────
// shape spec: { sides: 0 (circle) | 3..8, rot, fill: 'none'|'solid'|'hatch', dots }
const FILLS = ['none', 'hatch', 'solid'];
function shapeSeq(tier) {
  const kinds = tier === 1 ? ['sides', 'rotate'] : tier === 2 ? ['sides', 'rotate', 'dots', 'fillcycle'] : ['rotfill', 'sidesdots', 'dots', 'rotate'];
  const kind = pick(kinds);
  let items = [], answer, wrongs = [], hints;
  if (kind === 'sides') {
    const s0 = rnd(3, 4);
    items = [0, 1, 2, 3].map((i) => ({ sides: s0 + i, rot: 0, fill: 'none' }));
    answer = { sides: s0 + 4, rot: 0, fill: 'none' };
    wrongs = [{ sides: s0 + 3, rot: 0, fill: 'none' }, { sides: s0 + 5, rot: 0, fill: 'none' }, { sides: 0, rot: 0, fill: 'none' }];
    hints = ['Count the corners.', 'Each shape gains something.', 'One more side every step.'];
  } else if (kind === 'rotate') {
    const step = pick([45, 90]);
    items = [0, 1, 2, 3].map((i) => ({ sides: 3, rot: step * i, fill: 'none', arrow: true }));
    answer = { sides: 3, rot: step * 4, fill: 'none', arrow: true };
    wrongs = [{ sides: 3, rot: step * 3, fill: 'none', arrow: true }, { sides: 3, rot: step * 4 + 90, fill: 'none', arrow: true }, { sides: 3, rot: step * 4 + 180, fill: 'none', arrow: true }];
    hints = ['Watch which way it points.', 'It turns the same amount each step.', `It turns ${step}° clockwise each time.`];
  } else if (kind === 'dots') {
    const sides = pick([0, 4]); const d0 = rnd(1, 2), d = tier >= 3 ? 2 : 1;
    items = [0, 1, 2, 3].map((i) => ({ sides, rot: 0, fill: 'none', dots: d0 + d * i }));
    const n = d0 + d * 4;
    answer = { sides, rot: 0, fill: 'none', dots: n };
    wrongs = [{ sides, rot: 0, fill: 'none', dots: n - 1 }, { sides, rot: 0, fill: 'none', dots: n + 1 }, { sides: sides ? 0 : 4, rot: 0, fill: 'none', dots: n }];
    hints = ['Count what is inside.', `The dots increase by ${d}.`, `The next one has ${n} dots.`];
  } else if (kind === 'fillcycle') {
    const sides = pick([0, 4, 6]);
    items = [0, 1, 2, 3].map((i) => ({ sides, rot: 0, fill: FILLS[i % 3] }));
    answer = { sides, rot: 0, fill: FILLS[4 % 3] };
    wrongs = FILLS.filter((f) => f !== answer.fill).map((f) => ({ sides, rot: 0, fill: f })).concat([{ sides: sides === 4 ? 6 : 4, rot: 0, fill: answer.fill }]);
    hints = ['Look at the inside of each shape.', 'The fills repeat in a cycle of three.', `Empty → hatched → solid → empty → …`];
  } else if (kind === 'rotfill') {
    items = [0, 1, 2, 3].map((i) => ({ sides: 3, rot: 90 * i, fill: i % 2 ? 'solid' : 'none', arrow: true }));
    answer = { sides: 3, rot: 360, fill: 'none', arrow: true };
    wrongs = [{ sides: 3, rot: 360, fill: 'solid', arrow: true }, { sides: 3, rot: 450, fill: 'none', arrow: true }, { sides: 3, rot: 270, fill: 'solid', arrow: true }];
    hints = ['Two things change at once.', 'It turns 90° and the fill alternates.', 'Pointing up again, and empty.'];
  } else { // sidesdots
    const s0 = 3;
    items = [0, 1, 2, 3].map((i) => ({ sides: s0 + i, rot: 0, fill: 'none', dots: 4 - i }));
    answer = { sides: 7, rot: 0, fill: 'none', dots: 0 };
    wrongs = [{ sides: 7, rot: 0, fill: 'none', dots: 1 }, { sides: 6, rot: 0, fill: 'none', dots: 0 }, { sides: 8, rot: 0, fill: 'none', dots: 0 }];
    hints = ['Count sides and dots separately.', 'Sides go up while dots go down.', '7 sides, no dots.'];
  }
  const opts = shuffle([answer, ...wrongs.slice(0, 3)]);
  return mk({ subtopic: 'Shape Pattern', tier: Math.min(4, tier), prompt: 'Which shape comes next?',
    visual: { type: 'sequence', items }, answers: opts.map((o) => ({ shape: o })), correct: opts.indexOf(answer), hints });
}

function oddOneOut(tier) {
  const sides = pick([3, 4, 5, 6]);
  const base = { sides, rot: 0, fill: pick(FILLS) };
  const odd = tier <= 1 ? { ...base, sides: sides === 4 ? 5 : 4 } : pick([{ ...base, sides: sides + 1 }, { ...base, fill: base.fill === 'none' ? 'solid' : 'none' }]);
  const opts = shuffle([base, { ...base }, { ...base, rot: tier >= 2 ? 0 : 0 }, odd]);
  return mk({ subtopic: 'Odd One Out', tier: Math.min(2, tier), prompt: 'Which one does not belong?', answers: opts.map((o) => ({ shape: o })), correct: opts.indexOf(odd),
    hints: ['Three of these are identical.', 'Compare the sides and the fill.', 'Look for the one with a different count or fill.'] });
}

// ── Hand-written logic & lateral thinking ─────────────────────
const RIDDLES = [
  [1, 'Logic', 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?', 'Yes', ['No', 'Only some', 'Cannot tell'], ['Follow the chain.', 'Bloop → Razzie → Lazzie.', 'If A is in B and B is in C, A is in C.']],
  [1, 'Logic', 'A farmer has 17 sheep. All but 9 run away. How many are left?', '9', ['8', '0', '17'], ['Read "all but" carefully.', '"All but 9" means 9 stayed.', 'It is the number in the sentence.']],
  [1, 'Logic', 'What has to be broken before you can use it?', 'An egg', ['A promise', 'A seal', 'A code'], ['Think kitchen.', 'Breakfast.', 'It comes from a chicken.']],
  [1, 'Logic', 'How many months have 28 days?', 'All 12', ['1', '2', '6'], ['Not "only" 28.', 'Every month reaches day 28.', 'All of them.']],
  [2, 'Logic', 'A bat and a ball cost $1.10 together. The bat costs $1.00 more than the ball. How much is the ball?', '5¢', ['10¢', '1¢', '15¢'], ['10¢ is the trap answer.', 'If the ball is x, the bat is x + 1.00.', '2x + 1.00 = 1.10.']],
  [2, 'Logic', 'Mary\'s father has five daughters: Nana, Nene, Nini, Nono. What is the fifth daughter\'s name?', 'Mary', ['Nunu', 'Nina', 'Nan'], ['Re-read the first word.', 'Whose father is it?', 'She is in the question.']],
  [2, 'Logic', 'If you are running a race and pass the person in 2nd place, what place are you in?', '2nd', ['1st', '3rd', 'Last'], ['You did not pass the leader.', 'You took their spot.', 'You replace the person you passed.']],
  [2, 'Logic', 'It takes 5 machines 5 minutes to make 5 widgets. How long would 100 machines take to make 100 widgets?', '5 minutes', ['100 minutes', '20 minutes', '50 minutes'], ['How long does one machine take for one widget?', 'Each machine makes 1 widget in 5 minutes.', 'More machines, same time each.']],
  [2, 'Lateral Thinking', 'The more you take, the more you leave behind. What are they?', 'Footsteps', ['Memories', 'Breaths', 'Photos'], ['You do it walking.', 'Look behind you on sand.', 'Feet.']],
  [2, 'Logic', 'Which word is the odd one out: Apple, Banana, Carrot, Cherry?', 'Carrot', ['Apple', 'Banana', 'Cherry'], ['Think about how they grow.', 'Three are fruits.', 'One is a root vegetable.']],
  [3, 'Logic', 'In a lake, a patch of lily pads doubles in size every day. It takes 48 days to cover the lake. How long to cover half?', '47 days', ['24 days', '36 days', '46 days'], ['Work backwards from day 48.', 'It doubles from half to full in one day.', 'One day before full.']],
  [3, 'Logic', 'A clock shows 3:15. What is the angle between the hour and minute hands?', '7.5°', ['0°', '15°', '22.5°'], ['The hour hand moves too.', 'In 15 minutes the hour hand moves a quarter of 30°.', '30° ÷ 4.']],
  [3, 'Logic', 'Tom is taller than Ann. Ann is taller than Joe. Kim is shorter than Joe. Who is second shortest?', 'Joe', ['Ann', 'Kim', 'Tom'], ['Line them up.', 'Tom > Ann > Joe > Kim.', 'One above the shortest.']],
  [3, 'Logic', 'If 3 cats catch 3 mice in 3 minutes, how many cats are needed to catch 100 mice in 100 minutes?', '3', ['100', '33', '10'], ['What is one cat\'s rate?', 'Each cat catches 1 mouse per 3 minutes.', '3 cats keep that pace forever.']],
  [3, 'Logic', 'A regular hexagon has 9 diagonals. How many does a regular heptagon (7 sides) have?', '14', ['12', '16', '18'], ['Use n(n−3)/2.', 'n = 7.', '7 × 4 ÷ 2.']],
  [3, 'Lateral Thinking', 'A man pushes his car to a hotel and tells the owner he is bankrupt. Why?', 'He is playing Monopoly', ['His car broke down', 'He lost a bet', 'He was robbed'], ['It is a game.', 'Hotels, cars and bankruptcy all fit one board.', 'The car is a token.']],
  [4, 'Logic', 'A clock loses 4 minutes every 3 hours. Set right at noon, what does it show at 6 PM the next day?', '5:20 PM', ['5:12 PM', '5:32 PM', '5:00 PM'], ['How many hours pass?', '30 hours = 10 blocks of 3 hours.', '10 × 4 = 40 minutes slow.']],
  [4, 'Logic', 'You have two ropes; each burns in exactly 60 minutes but unevenly. How can you time exactly 45 minutes?', 'Light rope A at both ends and B at one; when A is done, light B\'s other end', ['Burn A, then half of B', 'Cut each rope in half', 'Light both at both ends'], ['Lighting both ends halves the time.', 'One rope gives 30 minutes when lit from both ends.', '30 + 15 = 45.']],
  [4, 'Logic', 'Three boxes are labelled Apples, Oranges, Mixed — all labels are wrong. Which box should you open (one fruit only) to fix every label?', 'Mixed', ['Apples', 'Oranges', 'Any of them'], ['Every label is wrong.', 'The "Mixed" box must hold just one kind.', 'One fruit from it tells you everything.']],
  [4, 'Logic', 'What is the next number: 1, 11, 21, 1211, 111221, ___', '312211', ['122111', '1112221', '211211'], ['Read the previous number out loud.', 'Describe it: "one 1", "two 1s"…', '111221 = three 1s, two 2s, one 1.']],
  [4, 'Logic', 'You have 8 identical-looking balls; one is heavier. What is the fewest balance weighings to be sure which?', '2', ['3', '1', '4'], ['Split into three groups, not two.', '3 vs 3 with 2 aside.', 'Each weighing has three outcomes.']],
];

function riddle(tier) {
  let pool = RIDDLES.filter((r) => r[0] === tier);
  if (!pool.length) pool = RIDDLES;
  const [t, sub, prompt, correct, wrongs, hints] = pick(pool);
  const answers = shuffle([correct, ...wrongs]);
  return mk({ id: 'RID-' + RIDDLES.findIndex((r) => r[2] === prompt), subtopic: sub, tier: t, prompt, answers, correct: answers.indexOf(correct), hints });
}

export function makePuzzle(tier, avoidIds = new Set()) {
  const makers = [numberSeries, numberSeries, shapeSeq, shapeSeq, riddle, riddle, letterSeries];
  if (tier <= 2) makers.push(oddOneOut);
  for (let i = 0; i < 8; i++) {
    const q = pick(makers)(tier);
    if (!avoidIds.has(q.id)) return q;
  }
  return numberSeries(tier);
}
