// ─────────────────────────────────────────────────────────────
//  Noah: Way Home — every tunable number lives here.
//  Values come from the "Noah: Way Home" design sheet (TRIVIA tab
//  wins wherever tabs disagree). Tweak freely after playtesting.
// ─────────────────────────────────────────────────────────────

export const TITLE = 'Noah: Way Home';

// Party size → difficulty multiplier (TRIVIA tab).
// The multiplier does two things:
//   1. pushes questions toward harder tiers   (tierShift)
//   2. makes wrong answers hurt a bit more    (damageMult)
// Everyone shares ONE Noah, ONE HP pool, ONE MP pool. No turns, no roles.
export const PARTY_SCALING = {
  1: 0.8,
  2: 1.9,
  3: 3.25,
  4: 4.5,
};
export const partyTierShift  = (m) => (m - 1) * 0.42;   // solo -0.08, duo +0.38, trio +0.95, quad +1.47 tiers
export const partyDamageMult = (m) => 0.85 + 0.15 * m;  // solo 0.97, duo 1.14, trio 1.34, quad 1.53
// Harder tiers already pay more EXP, so bigger parties get a small EXP trim
// to keep level-ups on the same pace (4 on map 1, 3 on map 2, then 2–3).
export const partyExpMult    = (m) => 1 / (1 + 0.18 * (m - 1));

// Difficulty modes (Game_Overview tab). Gold dropped — nothing uses it.
export const MODES = {
  chill:    { name: 'Chill',     desc: 'Relaxed. Half damage, an extra boss mistake, 40s timer.', tierWeights: [70, 25, 5, 0],   dmg: 0.5,  bossExtraMistakes: 1,  timer: 40, exp: 0.85 },
  standard: { name: 'Standard',  desc: 'The intended journey. 30s timer.',                          tierWeights: [40, 40, 15, 5],  dmg: 1.0,  bossExtraMistakes: 0,  timer: 30, exp: 1.0 },
  hard:     { name: 'Hard',      desc: 'Deeper questions, 1.25× damage, 25s timer.',                 tierWeights: [15, 45, 30, 10], dmg: 1.25, bossExtraMistakes: 0,  timer: 25, exp: 1.35 },
  veryhard: { name: 'Very Hard', desc: 'Mastery trial. 1.5× damage, 20s timer, lethal bosses early.', tierWeights: [5, 25, 45, 25],  dmg: 1.5,  bossExtraMistakes: 0,  timer: 20, exp: 1.75, lethalFromMap: 3 },
};

// Question tiers (Question_Schema tab)
export const TIERS = {
  1: { name: 'Novice',  exp: 50,  dmg: 10 },
  2: { name: 'Adept',   exp: 100, dmg: 20 },
  3: { name: 'Scholar', exp: 180, dmg: 35 },
  4: { name: 'Master',  exp: 300, dmg: 50 },
};

// Confidence wager (TRIVIA tab: higher = more EXP if right, more HP lost if wrong)
export const CONFIDENCE = [
  { id: 'unsure',  label: 'Unsure',  exp: 0.6, dmg: 0.6 },
  { id: 'think',   label: 'I think', exp: 1.0, dmg: 1.0 },
  { id: 'sure',    label: 'Sure',    exp: 1.5, dmg: 1.4 },
  { id: 'certain', label: 'Certain', exp: 2.2, dmg: 2.0 },
];

// The 8 biomes Noah climbs through. levelUps = target level-ups on a normal run
// (TRIVIA tab: 4 on map 1, 3 on map 2, then 2–3).
export const MAPS = [
  { name: 'Grassland Outskirts', biome: 'grass',    rows: 11, levelUps: 4, boss: 'The Faceless Warden',      bossDmg: 0.35, tierBump: 0 },
  { name: 'Whispering Steppes',  biome: 'savanna',  rows: 12, levelUps: 3, boss: 'The Mirage Stalker',       bossDmg: 0.40, tierBump: 0.3 },
  { name: 'Shifting Dunes',      biome: 'desert',   rows: 12, levelUps: 3, boss: 'The Sunken Colossus',      bossDmg: 0.50, tierBump: 0.6 },
  { name: 'Mirage Wastes',       biome: 'desert2',  rows: 13, levelUps: 2, boss: 'The Sandglass Sphinx',     bossDmg: 0.60, tierBump: 0.9 },
  { name: 'Craggy Foothills',    biome: 'foothill', rows: 13, levelUps: 2, boss: 'The Canyon Arbiter',       bossDmg: 0.75, tierBump: 1.2 },
  { name: 'Mistveiled Crags',    biome: 'crag',     rows: 14, levelUps: 2, boss: 'The Gale Phantom',         bossDmg: 0.85, tierBump: 1.5 },
  { name: 'Glacial Ascent',      biome: 'glacier',  rows: 14, levelUps: 2, boss: 'The Frostbound Chimera',   bossDmg: 1.00, tierBump: 1.8 },
  { name: 'Beacon Summit',       biome: 'summit',   rows: 15, levelUps: 3, boss: 'The Sovereign of Shadows', bossDmg: 1.00, tierBump: 2.1 },
];

// Bosses: 5 questions. TRIVIA tab: 2 wrong answers ends the run;
// from map 4 on ("3 maps in"), 1 wrong answer ends it.
export const BOSS = {
  questions: 5,
  mistakesAllowed: (mapIndex) => (mapIndex >= 3 ? 1 : 2),
  tierBonus: 1,               // boss questions are one tier harder than the map
};

// EXP needed to go from level L to L+1. Tuned so a typical run hits the
// level-up targets above; adjust the base/growth if levels come too fast/slow.
export const expToNext = (level) =>
  Math.round(380 * Math.pow(1.18, Math.min(level, 12) - 1) * Math.pow(1.06, Math.max(0, level - 12)));

// Stats (SPECIAL + Luck). Every level-up = 1 point. Formulas from SPECIAL_Progression.
export const STATS = {
  S: { name: 'Strength',     blurb: 'Bigger EXP when you answer with confidence.' },
  P: { name: 'Perception',   blurb: 'See farther through the fog, and what lies there.' },
  E: { name: 'Endurance',    blurb: 'More HP to survive wrong answers.' },
  C: { name: 'Charisma',     blurb: '"Come on, this is too hard!" More rerolls; every 3 levels a reroll can ask an easier question.' },
  I: { name: 'Intelligence', blurb: 'More mana for skills, and more mana back per correct answer.' },
  A: { name: 'Agility',      blurb: 'More ? on the map, and a bigger bonus for answering fast.' },
  L: { name: 'Luck',         blurb: 'Kinder surprises at ? nodes: heals, mana, EXP, favourite topics.' },
};
export const statFx = {
  strengthBonus: (S) => 1 + S * 0.15,                     // multiplies the confidence EXP bonus
  sightRows:     (P) => 1 + Math.floor(P / 2),            // rows of fog lifted ahead (1,2,2,3,3,4…)
  sightCategory: (P) => P >= 2,
  sightTier:     (P) => P >= 3,
  sightPreview:  (P) => P >= 9,
  maxHp:         (E) => 100 + (E - 1) * 25,
  rerolls:       (C) => 2 * C,
  tierDrop:      (C) => Math.floor(C / 3),
  maxMp:         (I) => 1 + (I - 1) * 2,
  mpRegen:       (I) => 1 + (I >= 3 ? 1 : 0) + (I >= 7 ? 1 : 0),
  speedMult:     (A) => 1 + A * 0.08,
  mysteryChance: (A) => 0.10 + A * 0.02,
  luckChance:    (L) => 0.15 + L * 0.035,                  // chance a ? event is a "great" one
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
  dilation: { name: 'Time Dilation', tiers: [
    { name: 'Time Dilation', mp: 3, desc: 'Freezes the timer for 15 seconds.' },
  ]},
  tether: { name: 'Ghostly Tether', tiers: [
    { name: 'Ghostly Tether', mp: 5, desc: 'The next wrong answer does nothing. Once per map.' },
  ]},
};

// Map generation
export const NODE_TYPES = {
  question: { label: 'Question' },
  puzzle:   { label: 'Puzzle' },
  mystery:  { label: '?' },
  rest:     { label: 'Rest' },
  boss:     { label: 'Boss' },
};
export const PUZZLE_CHANCE = 0.22;
export const REST_CHANCE = 0.05;

// Noah's look by level (Game_Overview tab)
export const NOAH_TIERS = [
  { from: 1,  name: 'Faint Spirit' },
  { from: 4,  name: 'Defined Memory' },
  { from: 8,  name: 'Solidifying Soul' },
  { from: 12, name: 'Restored Noah' },
];

// Score (Party_Leaderboard: depth matters most, speed a little)
export const SCORE = {
  perNode: 100,
  perMap: 1500,
  perCorrect: 60,
  speedWeight: 0.15,  // up to +15% from fast answering (× agility)
};
