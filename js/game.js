// Game rules. All state lives in one plain object (this.s) so a run can be
// saved, resumed, and later synced between phones for online co-op.
import { MODES, TIERS, CONFIDENCE, MAPS, BOSS, STATS, SKILLS, SCORE, PARTY_SCALING,
  partyDamageMult, partyExpMult, expToNext, statFx } from './config.js';
import { generateMap, findNode, choices, rollTier } from './map.js';
import { hintsFor } from './questions.js';

const SAVE_KEY = 'noah_run';
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class Game {
  constructor(source) {
    this.src = source;
    this.s = null;
  }

  // ── Run lifecycle ───────────────────────────────────────────
  newRun({ partySize, mode, partyName, players }) {
    const stats = Object.fromEntries(Object.keys(STATS).map((k) => [k, 1]));
    this.s = {
      v: 1, partySize, partyMult: PARTY_SCALING[partySize], mode, partyName: partyName || 'Noah\'s Friends', players,
      level: 1, exp: 0, levelUpsThisMap: 0, totalLevelUps: 0,
      stats, statPoints: 0, skillPicks: 0,
      skills: { eliminate: 0, hint: 0, dilation: 0, tether: 0 },
      hp: statFx.maxHp(1), mp: statFx.maxMp(1),
      rerolls: statFx.rerolls(1), tetherUsed: false, tetherArmed: false,
      mapIndex: 0, map: null,
      phase: 'map', q: null, event: null, boss: null, pendingTopic: null,
      tally: { nodes: 0, maps: 0, correct: 0, wrong: 0, speed: 0, answered: 0 },
      startedAt: Date.now(), log: [],
    };
    this.startMap(0);
    this.save();
  }

  startMap(i) {
    const s = this.s;
    s.mapIndex = i;
    s.map = generateMap(i, { mode: s.mode, partyMult: s.partyMult, agility: s.stats.A, topics: this.src.topicsAvailable() });
    s.levelUpsThisMap = 0;
    s.rerolls = statFx.rerolls(s.stats.C);
    s.tetherUsed = false; s.tetherArmed = false;
    s.phase = 'map';
  }

  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.s)); } catch {} }
  static hasSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && !['victory', 'defeat'].includes(s.phase) ? s : null; } catch { return null; } }
  load() { this.s = JSON.parse(localStorage.getItem(SAVE_KEY)); }
  clearSave() { localStorage.removeItem(SAVE_KEY); }

  // ── Derived numbers ────────────────────────────────────────
  get maxHp() { return statFx.maxHp(this.s.stats.E); }
  get maxMp() { return statFx.maxMp(this.s.stats.I); }
  get expNeed() { return expToNext(this.s.level); }
  get mode() { return MODES[this.s.mode]; }
  get mapDef() { return MAPS[this.s.mapIndex]; }
  get timer() { return this.mode.timer + (this.s.partySize > 1 ? 10 : 0); } // groups need a moment to talk
  get sight() {
    const P = this.s.stats.P;
    return { sightRows: statFx.sightRows(P), showCategory: statFx.sightCategory(P), showTier: statFx.sightTier(P), showPreview: statFx.sightPreview(P) };
  }
  choices() { return this.s.phase === 'map' ? choices(this.s.map) : []; }
  bossMistakesAllowed() {
    const m = this.mode;
    if (m.lethalFromMap !== undefined && this.s.mapIndex >= m.lethalFromMap - 1) return 1;
    return BOSS.mistakesAllowed(this.s.mapIndex) + m.bossExtraMistakes;
  }

  // ── Moving on the map ──────────────────────────────────────
  moveTo(nodeId) {
    const s = this.s;
    const node = choices(s.map).find((n) => n.id === nodeId);
    if (!node) return;
    s.map.current = node.id;
    node.visited = true;
    if (node.type === 'question' || node.type === 'puzzle') this.ask(node.tier, node.type === 'puzzle' ? 'puzzle' : 'trivia', { topic: node.type === 'puzzle' ? null : (s.pendingTopic || node.topic) });
    else if (node.type === 'mystery') this.mystery();
    else if (node.type === 'rest') this.rest();
    else if (node.type === 'boss') this.startBoss();
    this.save();
  }

  ask(tier, kind, opts = {}) {
    const s = this.s;
    const q = this.src.get(tier, kind, opts);
    if (kind === 'trivia' && opts.topic && opts.topic === s.pendingTopic) s.pendingTopic = null;
    s.q = { q, tier: q.tier, kind, confidence: 1, removed: [], hintLevel: 0, dropped: 0, startedAt: Date.now(), frozenUntil: 0, answered: null, bonus: opts.bonus || null };
    s.phase = s.boss ? 'boss' : 'question';
  }

  // ── Party tools during a question ─────────────────────────
  setConfidence(i) { if (this.s.q && this.s.q.answered === null) { this.s.q.confidence = i; this.save(); } }

  reroll(easier = false) {
    const s = this.s, cq = s.q;
    if (!cq || cq.answered !== null || s.rerolls <= 0) return false;
    if (easier && cq.dropped >= statFx.tierDrop(s.stats.C)) return false;
    s.rerolls--;
    const tier = easier ? Math.max(1, cq.tier - 1) : cq.tier;
    const dropped = cq.dropped + (easier ? 1 : 0);
    const conf = cq.confidence;
    this.src.markSeen(cq.q);
    this.ask(tier, cq.kind, { noRepeat: true });
    s.q.dropped = dropped; s.q.confidence = conf;
    this.save();
    return true;
  }

  skillCost(key) { const lv = this.s.skills[key]; return lv ? SKILLS[key].tiers[lv - 1].mp + (this.s.boss && this.s.mapIndex === 4 ? 1 : 0) : Infinity; }
  canCast(key) {
    const s = this.s, cq = s.q;
    if (!cq || cq.answered !== null || !s.skills[key] || s.mp < this.skillCost(key)) return false;
    if (key === 'eliminate') return cq.removed.length < cq.q.answers.length - 1;
    if (key === 'hint') return cq.hintLevel < s.skills.hint;
    if (key === 'tether') return !s.tetherUsed && !s.tetherArmed;
    if (key === 'dilation') return cq.frozenUntil < Date.now();
    return true;
  }
  cast(key) {
    if (!this.canCast(key)) return null;
    const s = this.s, cq = s.q, lv = s.skills[key];
    s.mp -= this.skillCost(key);
    let msg = '';
    if (key === 'eliminate') {
      const n = [1, 2, 3][lv - 1];
      const wrong = cq.q.answers.map((_, i) => i).filter((i) => i !== cq.q.correct && !cq.removed.includes(i));
      for (let k = 0; k < n && wrong.length; k++) cq.removed.push(wrong.splice(Math.floor(Math.random() * wrong.length), 1)[0]);
      msg = SKILLS.eliminate.tiers[lv - 1].name;
    } else if (key === 'hint') {
      cq.hintLevel = lv;
      msg = SKILLS.hint.tiers[lv - 1].name;
    } else if (key === 'dilation') {
      cq.frozenUntil = Date.now() + 15000;
      cq.startedAt += 15000;
      msg = 'Time slows…';
    } else if (key === 'tether') {
      s.tetherArmed = true;
      msg = 'Ghostly Tether: the next mistake won\'t hurt.';
    }
    this.save();
    return msg;
  }
  hints() { const cq = this.s.q; return cq ? hintsFor(cq.q).slice(0, cq.hintLevel) : []; }

  // ── Answering ──────────────────────────────────────────────
  answer(index /* -1 = ran out of time */) {
    const s = this.s, cq = s.q;
    if (!cq || cq.answered !== null) return null;
    const elapsed = (Date.now() - cq.startedAt) / 1000;
    const right = index === cq.q.correct;
    cq.answered = index;
    const conf = CONFIDENCE[cq.confidence];
    const speed = Math.max(0, 1 - elapsed / this.timer);
    s.tally.answered++; s.tally.speed += speed;
    this.src.markSeen(cq.q);
    const result = { right, correctIndex: cq.q.correct, exp: 0, dmg: 0, mp: 0, tethered: false, levelUps: 0 };

    if (right) {
      s.tally.correct++;
      this.src.markRight(cq.q);
      const base = TIERS[cq.tier].exp;
      const confMult = conf.exp > 1 ? 1 + (conf.exp - 1) * statFx.strengthBonus(s.stats.S) / statFx.strengthBonus(1) : conf.exp;
      let exp = base * confMult * this.mode.exp * partyExpMult(s.partyMult) * (1 + 0.2 * speed);
      if (cq.bonus === 'double') exp *= 2;
      result.exp = Math.round(exp);
      result.mp = Math.min(this.maxMp - s.mp, statFx.mpRegen(s.stats.I));
      s.mp += result.mp;
      result.levelUps = this.gainExp(result.exp);
    } else {
      s.tally.wrong++;
      this.src.markMissed(cq.q);
      if (s.tetherArmed) { s.tetherArmed = false; s.tetherUsed = true; result.tethered = true; }
      else {
        let dmg;
        if (s.boss) dmg = Math.max(1, Math.round(s.hp * this.mapDef.bossDmg));
        else dmg = Math.round(TIERS[cq.tier].dmg * conf.dmg * this.mode.dmg * partyDamageMult(s.partyMult));
        if (cq.bonus === 'safe' || cq.safe) dmg = 0;
        result.dmg = dmg;
        s.hp = Math.max(0, s.hp - dmg);
      }
    }

    if (s.boss) {
      s.boss.asked++;
      if (!right && !result.tethered) s.boss.mistakes++;
      result.boss = { ...s.boss, allowed: this.bossMistakesAllowed() };
    }
    if (s.hp <= 0 || (s.boss && s.boss.mistakes >= this.bossMistakesAllowed())) {
      s.phase = 'defeat';
      result.defeat = true;
      this.recordScore('defeat');
    }
    this.save();
    return result;
  }

  // After the party has seen the answer reveal
  continueAfterAnswer() {
    const s = this.s;
    if (s.phase === 'defeat') return;
    s.q = null;
    if (s.boss) {
      if (s.boss.asked >= BOSS.questions) return this.bossDefeated();
      const t = rollTier(s.mode, s.partyMult, s.mapIndex, 1, BOSS.tierBonus);
      this.ask(t, Math.random() < (s.mapIndex === 3 ? 0.5 : 0.25) ? 'puzzle' : 'trivia');
    } else {
      s.tally.nodes++;
      s.phase = s.statPoints || s.skillPicks ? 'levelup' : 'map';
    }
    this.save();
  }

  gainExp(n) {
    const s = this.s;
    s.exp += n;
    s.tally.exp = (s.tally.exp || 0) + n;
    (s.tally.expByMap = s.tally.expByMap || {})[s.mapIndex] = (s.tally.expByMap[s.mapIndex] || 0) + n;
    let ups = 0;
    while (s.exp >= this.expNeed) {
      s.exp -= this.expNeed;
      s.level++; ups++;
      s.levelUpsThisMap++; s.totalLevelUps++;
      s.statPoints++;
      if (s.totalLevelUps % 4 === 0) s.skillPicks++;
      s.hp = Math.min(this.maxHp, s.hp + Math.round(this.maxHp * 0.15));   // a small breath of relief
    }
    return ups;
  }

  // ── Level-up choices ───────────────────────────────────────
  spendStat(key) {
    const s = this.s;
    if (!s.statPoints || !STATS[key]) return;
    const hpBefore = this.maxHp, mpBefore = this.maxMp, rrBefore = statFx.rerolls(s.stats.C);
    s.stats[key]++; s.statPoints--;
    s.hp += this.maxHp - hpBefore;
    s.mp += this.maxMp - mpBefore;
    s.rerolls += statFx.rerolls(s.stats.C) - rrBefore;
    this.afterLevelChoice();
  }
  skillOptions() {
    const s = this.s;
    return Object.keys(SKILLS).filter((k) => s.skills[k] < SKILLS[k].tiers.length).map((k) => {
      const next = SKILLS[k].tiers[s.skills[k]];
      return { key: k, upgrade: s.skills[k] > 0, ...next };
    });
  }
  pickSkill(key) {
    const s = this.s;
    if (!s.skillPicks || s.skills[key] >= SKILLS[key].tiers.length) return;
    s.skills[key]++; s.skillPicks--;
    this.afterLevelChoice();
  }
  afterLevelChoice() {
    const s = this.s;
    if (!s.statPoints && !s.skillPicks) s.phase = s.boss ? 'boss' : 'map';
    this.save();
  }

  // ── Mystery (?) and rest nodes ─────────────────────────────
  mystery() {
    const s = this.s;
    const great = Math.random() < statFx.luckChance(s.stats.L);
    const bad = !great && Math.random() < Math.max(0.05, 0.22 - s.stats.L * 0.02);
    const topics = this.src.topicsAvailable();
    const pool = great ? [
      { id: 'spring', title: 'A moonlit spring', text: 'Noah drinks from a spring that hums like a lullaby. He feels whole for a moment.', fx: { hpPct: 0.5, mpFull: true } },
      { id: 'memory', title: 'A memory returns', text: 'A warm memory surfaces: a kitchen, a voice calling his name. It makes him stronger.', fx: { expPct: 0.6 } },
      { id: 'favtopic', title: 'A friendly lantern', text: 'A lantern offers to light the way. Pick a subject you know well, and the next question will be about it.', fx: { chooseTopic: pick([3, 3, 4]) } },
      { id: 'pebbles', title: 'Lucky pebbles', text: 'Smooth pebbles that let you ask the path for a different question.', fx: { rerolls: 3 } },
      { id: 'gift', title: 'A paper bird', text: 'A paper bird asks an easy riddle. Get it right for double EXP — no harm if wrong.', fx: { question: { tierDelta: -1, bonus: 'double', safe: true } } },
    ] : bad ? [
      { id: 'thorns', title: 'Thorny hedge', text: 'The maze closes in and scratches at Noah\'s outline.', fx: { hp: -12 } },
      { id: 'riddler', title: 'A hooded riddler', text: 'Someone blocks the path and won\'t move until you answer something hard.', fx: { question: { tierDelta: 1 } } },
      { id: 'draft', title: 'A cold draft', text: 'A gust scatters Noah\'s thoughts. He loses a little mana.', fx: { mp: -2 } },
    ] : [
      { id: 'berries', title: 'Dream berries', text: 'Sweet berries along the hedge. A little HP back.', fx: { hpPct: 0.18 } },
      { id: 'stars', title: 'Fallen stars', text: 'Tiny stars in the grass restore some mana.', fx: { mp: 3 } },
      { id: 'scribble', title: 'A page of notes', text: 'Someone\'s old notes. Noah learns something.', fx: { expPct: 0.25 } },
      { id: 'puzzlebox', title: 'A puzzle box', text: 'A little box with a lock made of shapes. Solve it for double EXP — no harm if wrong.', fx: { question: { kind: 'puzzle', bonus: 'double', safe: true } } },
    ];
    const ev = pick(pool);
    const fx = ev.fx;
    const out = [];
    if (fx.hpPct) { const h = Math.round(this.maxHp * fx.hpPct); const real = Math.min(h, this.maxHp - s.hp); s.hp += real; out.push(`+${real} HP`); }
    if (fx.hp) { s.hp = Math.max(1, s.hp + fx.hp); out.push(`${fx.hp} HP`); }
    if (fx.mpFull) { out.push(`+${this.maxMp - s.mp} MP`); s.mp = this.maxMp; }
    if (fx.mp) { const before = s.mp; s.mp = Math.max(0, Math.min(this.maxMp, s.mp + fx.mp)); out.push(`${s.mp - before >= 0 ? '+' : ''}${s.mp - before} MP`); }
    if (fx.expPct) { const e = Math.round(this.expNeed * fx.expPct); out.push(`+${e} EXP`); ev.levelUps = this.gainExp(e); }
    if (fx.rerolls) { s.rerolls += fx.rerolls; out.push(`+${fx.rerolls} rerolls`); }
    if (fx.chooseTopic) ev.topics = [...topics].sort(() => Math.random() - 0.5).slice(0, fx.chooseTopic);
    s.event = { ...ev, tone: great ? 'great' : bad ? 'bad' : 'ok', effects: out };
    s.phase = 'event';
  }
  rest() {
    const s = this.s;
    const h = Math.min(this.maxHp - s.hp, Math.round(this.maxHp * 0.3));
    const m = Math.min(this.maxMp - s.mp, 3);
    s.hp += h; s.mp += m;
    s.event = { id: 'rest', title: 'A quiet campfire', text: 'Noah sits by a small fire drawn in orange pencil. The fog keeps its distance for a while.', tone: 'great', effects: [`+${h} HP`, `+${m} MP`] };
    s.phase = 'event';
  }
  resolveEvent(choice) {
    const s = this.s, ev = s.event;
    if (!ev) return;
    s.event = null;
    if (ev.topics && choice) { s.pendingTopic = choice; }
    if (ev.fx && ev.fx.question) {
      const qd = ev.fx.question;
      const node = findNode(s.map, s.map.current);
      const baseTier = rollTier(s.mode, s.partyMult, s.mapIndex, node ? node.row / s.map.rows.length : 0);
      this.ask(Math.max(1, Math.min(4, baseTier + (qd.tierDelta || 0))), qd.kind || 'trivia', { bonus: qd.safe ? (qd.bonus === 'double' ? 'double' : 'safe') : null });
      if (qd.safe) s.q.safe = true;
      this.save();
      return;
    }
    s.tally.nodes++;
    s.phase = s.statPoints || s.skillPicks ? 'levelup' : 'map';
    this.save();
  }

  // ── Bosses ────────────────────────────────────────────────
  startBoss() {
    const s = this.s;
    s.boss = { name: this.mapDef.boss, asked: 0, mistakes: 0 };
    s.phase = 'bossIntro';
  }
  beginBossFight() {
    const s = this.s;
    const t = rollTier(s.mode, s.partyMult, s.mapIndex, 1, BOSS.tierBonus);
    this.ask(t, 'trivia');
    this.save();
  }
  bossDefeated() {
    const s = this.s;
    s.tally.maps++;
    s.boss = null;
    if (s.mapIndex >= MAPS.length - 1) {
      s.phase = 'victory';
      this.recordScore('victory');
    } else {
      s.hp = Math.min(this.maxHp, s.hp + Math.round((this.maxHp - s.hp) * 0.5));
      s.phase = 'mapClear';
    }
    this.save();
  }
  nextMap() {
    this.startMap(this.s.mapIndex + 1);
    this.s.phase = this.s.statPoints || this.s.skillPicks ? 'levelup' : 'map';
    this.save();
  }

  // ── Score & leaderboard (this device) ─────────────────────
  score() {
    const t = this.s.tally;
    const avgSpeed = t.answered ? t.speed / t.answered : 0;
    const base = t.nodes * SCORE.perNode + t.maps * SCORE.perMap + t.correct * SCORE.perCorrect;
    return Math.round(base * (1 + SCORE.speedWeight * avgSpeed * statFx.speedMult(this.s.stats.A)));
  }
  recordScore(outcome) {
    const s = this.s;
    if (s.recorded) return;
    if (this.src.testMode) { s.recorded = true; return; }   // test runs stay off the leaderboard
    s.recorded = true;
    const entry = {
      party: s.partyName, players: s.players, size: s.partySize, mode: MODES[s.mode].name,
      maps: s.tally.maps, nodes: s.tally.nodes, correct: s.tally.correct, level: s.level,
      reached: MAPS[s.mapIndex].name, outcome, score: this.score(), date: new Date().toISOString(),
    };
    const board = Game.leaderboard();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    try { localStorage.setItem('noah_board', JSON.stringify(board.slice(0, 50))); } catch {}
    this.lastEntry = entry;
  }
  static leaderboard() { try { return JSON.parse(localStorage.getItem('noah_board') || '[]'); } catch { return []; } }
}
