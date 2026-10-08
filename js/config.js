// ─────────────────────────────────────────────────────────────
//  Noah: Way Home — every tunable number lives here.
//  Tweak freely after playtesting.
// ─────────────────────────────────────────────────────────────

export const TITLE = 'Noah: Way Home';

// Party size → difficulty multiplier. Everyone shares ONE Noah, ONE HP pool,
// ONE MP pool. No turns, no roles — a bigger party only means a harder road.
export const PARTIES = [
  { id: 1, name: 'Solo',    sub: 'A quiet walk',               mult: 0.8,  names: 1 },
  { id: 2, name: 'Partner', sub: 'Questions get harder',       mult: 1.9,  names: 2 },
  { id: 3, name: 'Trio',    sub: 'Tougher, and they sting',    mult: 3.25, names: 3 },
  { id: 4, name: 'Quartet', sub: 'A hard road',                mult: 4.5,  names: 4 },
  { id: 5, name: 'Party',   sub: '5 or more. The hardest road', mult: 5.75, names: 8 },
];
export const partyById = (id) => PARTIES.find((p) => p.id === id) || PARTIES[0];
// What the multiplier does:
export const partyTierShift  = (m) => (m - 1) * 0.22;   // solo −0.04 · partner +0.2 · trio +0.5 · quartet +0.77 · party +1.05 tiers
export const partyDamageMult = (m) => 0.88 + 0.12 * m;  // solo 0.98 · partner 1.11 · trio 1.27 · quartet 1.42 · party 1.57
// Harder tiers already pay more EXP, so bigger parties get a small EXP trim
// to keep level-ups on the same pace.
export const partyExpMult    = (m) => 1 / (1 + 0.14 * (m - 1));

// Difficulty modes. tierOffset nudges every question harder/easier.
export const MODES = {
  chill:    { name: 'Chill',     desc: 'Relaxed. Easier questions, half damage, an extra boss mistake.', tierOffset: -0.5, dmg: 0.5,  bossExtraMistakes: 1, exp: 0.9 },
  standard: { name: 'Standard',  desc: 'The intended journey. Gentle start, steady climb.',              tierOffset: 0,    dmg: 1.0,  bossExtraMistakes: 0, exp: 1.0 },
  hard:     { name: 'Hard',      desc: 'Deeper questions from the start, 1.25× damage.',               tierOffset: 0.5,  dmg: 1.25, bossExtraMistakes: 0, exp: 1.3 },
  veryhard: { name: 'Very Hard', desc: 'Mastery trial. 1.5× damage, lethal bosses from map 3.',        tierOffset: 1.0,  dmg: 1.5,  bossExtraMistakes: 0, exp: 1.6, lethalFromMap: 3 },
};

// Question tiers
export const TIERS = {
  1: { name: 'Easy',    exp: 50,  dmg: 10 },
  2: { name: 'Medium',  exp: 90,  dmg: 18 },
  3: { name: 'Hard',    exp: 150, dmg: 28 },
  4: { name: 'Master',  exp: 240, dmg: 40 },
};

// Confidence lives inside each answer: left = not sure, middle = sure, right = definitely.
export const CONFIDENCE = [
  { id: 'unsure', label: 'Not sure',   exp: 0.6, dmg: 0.5 },
  { id: 'sure',   label: 'Sure',       exp: 1.0, dmg: 1.0 },
  { id: 'def',    label: 'Definitely', exp: 1.7, dmg: 1.6 },
];
export const DEFAULT_CONFIDENCE = 1;

// No countdown. Speed still counts toward score: answering instantly earns the
// full bonus, which fades to nothing at 2 minutes (so breaks don't matter).
export const SPEED_CAP_SECONDS = 120;

// The 8 lands. avgTier = typical question difficulty on that map (before
// party/mode adjustments). Map 1 is meant to be almost a breeze.
export const MAPS = [
  { name: 'Grassland Outskirts', biome: 'grass',    rows: 10, avgTier: 0.75, dmg: 0.6,  boss: 'The Faceless Warden',      bossDmg: 0.25 },
  { name: 'Whispering Steppes',  biome: 'savanna',  rows: 11, avgTier: 1.3, dmg: 0.8,  boss: 'The Mirage Stalker',       bossDmg: 0.35 },
  { name: 'Shifting Dunes',      biome: 'desert',   rows: 11, avgTier: 1.7, dmg: 0.95, boss: 'The Sunken Colossus',      bossDmg: 0.45 },
  { name: 'Mirage Wastes',       biome: 'desert2',  rows: 12, avgTier: 2.05, dmg: 1.05, boss: 'The Sandglass Sphinx',     bossDmg: 0.55 },
  { name: 'Craggy Foothills',    biome: 'foothill', rows: 12, avgTier: 2.35, dmg: 1.15, boss: 'The Canyon Arbiter',       bossDmg: 0.7 },
  { name: 'Mistveiled Crags',    biome: 'crag',     rows: 13, avgTier: 2.65, dmg: 1.25, boss: 'The Gale Phantom',         bossDmg: 0.85 },
  { name: 'Glacial Ascent',      biome: 'glacier',  rows: 13, avgTier: 2.9, dmg: 1.35, boss: 'The Frostbound Chimera',   bossDmg: 1.0 },
  { name: 'Beacon Summit',       biome: 'summit',   rows: 14, avgTier: 3.15, dmg: 1.45, boss: 'The Sovereign of Shadows', bossDmg: 1.0 },
];
// Target level-ups per map on a normal run: 4, 3, then 2–3.

// Bosses: 5 questions. "Mistakes allowed" = the mistake that ends the run.
// Map 1: 3rd mistake (a gentle first boss) · maps 2–5: 2nd mistake ·
// maps 6–8: the first mistake ends it.
export const BOSS = {
  questions: 5,
  mistakesAllowed: (mapIndex) => (mapIndex === 0 ? 3 : mapIndex >= 5 ? 1 : 2),
  tierBonus: 0.25,            // boss questions lean a little harder than the map
};

// EXP needed to go from level L to L+1.
export const expToNext = (level) =>
  Math.round(150 * Math.pow(1.22, Math.min(level, 10) - 1) * Math.pow(1.05, Math.max(0, level - 10)));

// Stats (SPECIAL + Luck). Every level-up = 1 point.
export const STATS = {
  S: { name: 'Strength',     blurb: 'Bigger EXP when you answer with confidence.' },
  P: { name: 'Perception',   blurb: 'See farther through the fog: topics, then difficulty.' },
  E: { name: 'Endurance',    blurb: 'More HP to survive wrong answers.' },
  C: { name: 'Charisma',     blurb: '"Come on, this is too hard!" More rerolls; every 3 levels a reroll can ask an easier question.' },
  I: { name: 'Intelligence', blurb: 'More mana for skills, and more mana back per correct answer.' },
  A: { name: 'Agility',      blurb: 'More ? on the map, and a bigger bonus for answering quickly.' },
  L: { name: 'Luck',         blurb: 'Kinder surprises at ? nodes: heals, mana, EXP, favourite topics.' },
};
export const statFx = {
  strengthBonus: (S) => 1 + S * 0.15,
  sightRows:     (P) => 1 + Math.floor(P / 2),            // rows of fog lifted ahead (1,2,2,3,3,4…)
  sightCategory: (P) => P >= 2,                           // see each path's topic
  sightTier:     (P) => P >= 3,                           // see each path's difficulty
  maxHp:         (E) => 100 + (E - 1) * 25,
  rerolls:       (C) => 2 * C,
  tierDrop:      (C) => Math.floor(C / 3),
  maxMp:         (I) => 1 + (I - 1) * 2,
  mpRegen:       (I) => 1 + (I >= 3 ? 1 : 0) + (I >= 7 ? 1 : 0),
  speedMult:     (A) => 1 + A * 0.08,
  mysteryChance: (A) => 0.10 + A * 0.02,
  luckChance:    (L) => 0.15 + L * 0.035,
};

// Skills. A new skill (or an upgrade) every 4 level-ups.
export const SKILLS = {
  eliminate: { name: 'Eliminate', tiers: [
    { name: 'Eliminate', mp: 3, desc: 'Removes 1 wrong answer.' },
    { name: '50/50',     mp: 5, desc: 'Removes 2 wrong answers.' },
    { name: 'Truth',     mp: 7, desc: 'Removes every wrong answer.' },
  ]},
  hint: { name: 'Hint', tiers: [
    { name: 'Subtle Hint',      mp: 2, desc: 'A small nudge: a keyword or the shape of the answer.' },
    { name: 'Hint',             mp: 4, desc: 'More context that makes the answer easier to reason out.' },
    { name: 'More than a Hint', mp: 6, desc: 'Practically points at the answer.' },
  ]},
  second: { name: 'Second Guess', tiers: [
    { name: 'Second Guess', mp: 3, desc: 'If this answer is wrong, it is crossed out and you get one more try (no damage, half EXP).' },
  ]},
  tether: { name: 'Ghostly Tether', tiers: [
    { name: 'Ghostly Tether', mp: 5, desc: 'The next wrong answer does nothing. Once per map.' },
  ]},
};

// ── Topics ────────────────────────────────────────────────────
// src: 'otdb' = Open Trivia DB category (+ local bank as backup),
//      'bank' = hand-written questions, 'gen' = generated puzzles.
// kind 'puzzle' shows a puzzle icon on the map.
export const TOPIC_GROUPS = [
  { name: 'Knowledge', topics: [
    { id: 'general',    name: 'General Knowledge', short: 'General',   src: 'otdb', otdb: [9] },
    { id: 'geography',  name: 'Geography',         short: 'Geography', src: 'otdb', otdb: [22] },
    { id: 'history',    name: 'History & Big Moments', short: 'History', src: 'otdb', otdb: [23] },
    { id: 'science',    name: 'Science & Nature',  short: 'Science',   src: 'otdb', otdb: [17] },
    { id: 'animals',    name: 'Animals',           short: 'Animals',   src: 'otdb', otdb: [27] },
    { id: 'space',      name: 'Space',             short: 'Space',     src: 'bank' },
    { id: 'body',       name: 'Human Body',        short: 'Body',      src: 'bank' },
    { id: 'food',       name: 'Food & Drink',      short: 'Food',      src: 'bank' },
    { id: 'landmarks',  name: 'Landmarks & Wonders', short: 'Landmarks', src: 'bank' },
    { id: 'holidays',   name: 'Holidays & Traditions', short: 'Holidays', src: 'bank' },
    { id: 'mythology',  name: 'Mythology & Legends', short: 'Myths',   src: 'otdb', otdb: [20] },
    { id: 'books',      name: 'Books & Stories',   short: 'Books',     src: 'otdb', otdb: [10] },
    { id: 'art',        name: 'Art & Artists',     short: 'Art',       src: 'otdb', otdb: [25] },
    { id: 'tech',       name: 'Technology & Inventions', short: 'Tech', src: 'otdb', otdb: [18, 30] },
    { id: 'sports',     name: 'Sports',            short: 'Sports',    src: 'otdb', otdb: [21] },
    { id: 'vehicles',   name: 'Vehicles',          short: 'Vehicles',  src: 'otdb', otdb: [28] },
  ]},
  { name: 'Entertainment', topics: [
    { id: 'movies',     name: 'Movies',            short: 'Movies',    src: 'otdb', otdb: [11] },
    { id: 'tv',         name: 'TV Shows',          short: 'TV',        src: 'otdb', otdb: [14] },
    { id: 'music',      name: 'Music',             short: 'Music',     src: 'otdb', otdb: [12] },
    { id: 'theatre',    name: 'Musicals & Theatre', short: 'Theatre',  src: 'otdb', otdb: [13] },
    { id: 'games',      name: 'Video Games',       short: 'Games',     src: 'otdb', otdb: [15] },
    { id: 'boardgames', name: 'Board & Card Games', short: 'Board games', src: 'otdb', otdb: [16] },
    { id: 'cartoons',   name: 'Cartoons & Animation', short: 'Cartoons', src: 'otdb', otdb: [32] },
    { id: 'comics',     name: 'Comics & Superheroes', short: 'Comics', src: 'otdb', otdb: [29] },
    { id: 'anime',      name: 'Anime & Manga',     short: 'Anime',     src: 'otdb', otdb: [31] },
  ]},
  { name: 'Brain Teasers', topics: [
    { id: 'colors',     name: 'Color Mixing',      short: 'Colors',    src: 'gen', kind: 'puzzle' },
    { id: 'spelling',   name: 'Spelling',          short: 'Spelling',  src: 'gen', kind: 'puzzle' },
    { id: 'math',       name: 'Quick Math',        short: 'Math',      src: 'gen', kind: 'puzzle' },
    { id: 'patterns',   name: 'Number & Letter Patterns', short: 'Patterns', src: 'gen', kind: 'puzzle' },
    { id: 'shapes',     name: 'Shape Puzzles',     short: 'Shapes',    src: 'gen', kind: 'puzzle' },
    { id: 'logic',      name: 'Logic & Riddles',   short: 'Riddles',   src: 'gen', kind: 'puzzle' },
    { id: 'words',      name: 'Word Play',         short: 'Words',     src: 'gen', kind: 'puzzle' },
    { id: 'oddone',     name: 'Odd One Out',       short: 'Odd one out', src: 'gen', kind: 'puzzle' },
    { id: 'emoji',      name: 'Emoji Puzzles',     short: 'Emoji',     src: 'gen', kind: 'puzzle' },
  ]},
];
export const TOPICS = Object.fromEntries(TOPIC_GROUPS.flatMap((g) => g.topics).map((t) => [t.id, t]));
export const ALL_TOPIC_IDS = Object.keys(TOPICS);

// Map generation
export const REST_CHANCE = 0.05;

// Noah's look by level
export const NOAH_TIERS = [
  { from: 1,  name: 'Faint Sketch' },
  { from: 4,  name: 'Pencil Outline' },
  { from: 8,  name: 'Watercolor Wash' },
  { from: 12, name: 'Restored Noah' },
];

// Score: depth matters most, speed a little
export const SCORE = {
  perNode: 100,
  perMap: 1500,
  perCorrect: 60,
  speedWeight: 0.15,
};
