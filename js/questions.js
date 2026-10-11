// Question supply, by topic:
//   • js/bank.json — the reviewed question bank (only rows marked "Keep" in
//     the review sheet). Always used first.
//   • Open Trivia DB (online) tops up topics when the bank runs low, filtered
//     to drop overly specific ones, and never shows a question the sheet
//     marked Fix / Cut / unreviewed.
//   • generated brain teasers (puzzles.js)
import { REMOVED } from './removed.js';
import { TOPICS, ALL_TOPIC_IDS, topicMaxTier } from './config.js';
import { generate } from './puzzles.js';

const API = 'https://opentdb.com/api.php';
const TOKEN_API = 'https://opentdb.com/api_token.php';
const OTDB_TIER = { easy: 1, medium: 2, hard: 3 };

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const DATE_Q = /\b(what|which|in what) year\b|\bwhen (was|were|did|is)\b|\brelease date\b|\bwhat date\b|\bwhich decade\b|\bhow many years\b|\bwhat century\b|\byear (was|did)\b/i;
const NICHE_Q = /\bepisode\b|\bseason \d|\bwhich album\b|\btrack (number|listing)\b|\bb-side\b|\bjersey number\b|\bvoice actor\b|\bvoiced by\b|\bdeveloper of\b|\bpublisher\b|\bsoundtrack\b|\bcomposer of the\b|\bdebut album\b|\bcatchphrase of the character\b/i;
const DATE_A = new RegExp(`^\\s*(\\d{3,4}s?|\\d{1,2}(st|nd|rd|th)? century|(${MONTHS})\\b.*|\\d{1,2} (${MONTHS}).*)\\s*$`, 'i');
export function tooSpecific(prompt, correct, wrongs = []) {
  if (DATE_Q.test(prompt) || NICHE_Q.test(prompt)) return true;
  if ([correct, ...wrongs].some((a) => DATE_A.test(a))) return true;
  if (/\d{1,3}(,\d{3}){2,}|\d{6,}/.test(correct)) return true;      // huge exact numbers
  if (prompt.length > 190) return true;
  if (/which of these|which of the following/i.test(prompt) && /not\b/i.test(prompt) && prompt.length > 120) return true;
  return false;
}

// ── Auto hints for questions without their own ──────────────────
function mask(word, reveal) {
  return [...word].map((ch, i) => (/[\p{L}\p{N}]/u.test(ch) ? (reveal(i, word.length) ? ch : '_') : ch)).join(' ');
}
export const answerText = (a) => (typeof a === 'string' ? a : a.text || '');
export function hintsFor(q) {
  if (q.hints && q.hints.length) return q.hints;
  if (q.hint) return [q.hint, ...autoHints(q).slice(1)];
  return autoHints(q);
}
function autoHints(q) {
  const ans = answerText(q.answers[q.correct]);
  const words = ans.split(/\s+/).filter(Boolean);
  const isNum = /^[\d.,%°$¢\s–-]+$/.test(ans);
  const subject = q.subtopic || q.topicName || 'this';
  if (isNum) return [`It's about ${subject}. The answer is a number.`, `It starts with ${ans.trim()[0]}.`, `It's ${ans.trim().length > 2 ? 'close to ' : ''}${ans.trim().slice(0, Math.ceil(ans.trim().length / 2))}…`];
  return [
    `It's about ${subject}. The answer is ${words.length} word${words.length > 1 ? 's' : ''}: ${words.map((w) => mask(w, () => false)).join('   ')}`,
    `It looks like: ${words.map((w) => mask(w, (i) => i === 0)).join('   ')}`,
    `Nearly there: ${words.map((w) => mask(w, (i, n) => i === 0 || i % 2 === 0 || i === n - 1)).join('   ')}`,
  ];
}

const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
// Same key the bank builder uses: lower-case, whitespace squashed, hashed
const promptKey = (s) => hash(String(s || '').replace(/\s+/g, ' ').trim().toLowerCase());
const TOPIC_BY_NAME = Object.fromEntries(Object.values(TOPICS).map((t) => [t.name.toLowerCase(), t.id]));

export class QuestionSource {
  constructor() {
    this.pools = {};                       // "topic|tier" → [question]
    this.seen = new Set(store.get('noah_seen', []));
    this.blocked = new Set([...store.get('noah_blocked', []), ...REMOVED]);
    this.missed = store.get('noah_missed', []);
    this.recent = [];
    this.token = null;
    this.online = typeof navigator === 'undefined' || navigator.onLine !== false;
    this.topics = [...ALL_TOPIC_IDS];
    this.fetchState = {};                  // topic → { amount, done }
    this.running = false;
    this.lastCall = 0;
    this.bank = {};                        // topic → { 1: [q], 2: [q], 3: [q], 4: [q] }
    this.bankKeys = new Set();             // prompts already in the bank
    this.excl = new Set();                 // prompts the sheet marked Fix / Cut / unreviewed
    this.bankCount = 0;
    this.ready = this.loadBank();
  }

  async loadBank() {
    try {
      const data = await (await fetch(new URL('./bank.json', import.meta.url))).json();
      const ids = new Set();
      for (const [ti, tier, prompt, correct, ...rest] of data.q) {
        const topic = TOPIC_BY_NAME[String(data.topics[ti]).toLowerCase()];
        if (!topic) continue;
        const extra = rest.length && typeof rest[rest.length - 1] === 'object' ? rest.pop() : null;
        const k = promptKey(prompt);
        let id = 'Q-' + k;
        for (let n = 2; ids.has(id); n++) id = `Q-${k}-${n}`;
        ids.add(id);
        this.bankKeys.add(k);
        const t = Math.max(1, Math.min(4, tier | 0));
        ((this.bank[topic] ||= { 1: [], 2: [], 3: [], 4: [] })[t]).push({ id, topic, tier: t, prompt, correct, wrongs: rest, hint: extra?.h || '' });
        this.bankCount++;
      }
      this.excl = new Set(data.excl || []);
    } catch (e) {
      console.warn('Question bank failed to load', e);
    }
    this.bankLoaded = true;
    return this;
  }
  bankSize(topic) { const b = this.bank[topic]; return b ? b[1].length + b[2].length + b[3].length + b[4].length : 0; }
  // Build a playable question (answers shuffled fresh each time)
  fromBank(b) {
    const answers = shuffle([b.correct, ...b.wrongs]);
    const def = TOPICS[b.topic];
    return { id: b.id, kind: 'trivia', source: 'bank', topic: b.topic, topicName: def?.name, subtopic: def?.name, tier: b.tier, prompt: b.prompt, answers, correct: answers.indexOf(b.correct), hint: b.hint || undefined };
  }
  // A bank question near this tier. fresh = never seen on this device.
  pickBank(topic, tier, { fresh = true } = {}) {
    const b = this.bank[topic];
    if (!b) return null;
    const ok = (q) => !this.blocked.has(q.id) && !this.recent.includes(q.id) && (!fresh || !this.seen.has(q.id));
    for (const t of [tier, tier - 1, tier + 1]) {
      const list = b[t];
      if (!list || !list.length) continue;
      for (let i = 0; i < 40; i++) { const q = pick(list); if (ok(q)) return this.fromBank(q); }   // fast path
      const all = list.filter(ok);
      if (all.length) return this.fromBank(pick(all));
    }
    return null;
  }

  // ── Test mode: every question is the same placeholder ──
  get testMode() { return store.get('noah_test', false) === true; }
  set testMode(on) { store.set('noah_test', !!on); }
  testQuestion(tier, topic) {
    return { id: 'TEST', kind: 'trivia', source: 'test', topic, topicName: 'Test Mode', subtopic: 'Test Mode', tier, test: true,
      prompt: 'Questions: Testing in progress', answers: ['Answer', 'Wrong', 'Wrong', 'Wrong'], correct: 0,
      hints: ['Test hint 1: it is not "Wrong".', 'Test hint 2: it starts with A.', 'Test hint 3: pick A.'] };
  }

  setTopics(ids) {
    this.topics = ids.filter((id) => TOPICS[id]);
    if (!this.topics.length) this.topics = [...ALL_TOPIC_IDS];
    this.startFetching();
  }

  async warmUp() {
    if (!this.online || this.token) return;
    try { this.token = (await (await fetch(`${TOKEN_API}?command=request`)).json()).token; } catch { /* fine without a token */ }
  }

  // Cycle through enabled Open Trivia DB topics, one request every ~5s (their limit).
  async startFetching() {
    if (this.running || !this.online) return;
    this.running = true;
    await this.ready;
    await this.warmUp();
    while (this.online) {
      // Only top up topics where the reviewed bank is thin
      const need = this.topics.filter((t) => TOPICS[t].src === 'otdb' && this.bankSize(t) < 400 && !this.fetchState[t]?.done && this.poolSize(t) < 12);
      if (!need.length) { await sleep(4000); continue; }
      need.sort((a, b) => this.poolSize(a) - this.poolSize(b));
      await this.fetchTopic(need[0]);
    }
    this.running = false;
  }
  poolSize(topic) { return [1, 2, 3].reduce((n, t) => n + (this.pools[`${topic}|${t}`]?.length || 0), 0); }

  async fetchTopic(topic) {
    const st = (this.fetchState[topic] ||= { amount: 50, cat: 0, done: false });
    const cats = TOPICS[topic].otdb;
    const cat = cats[st.cat++ % cats.length];
    const wait = 5200 - (Date.now() - this.lastCall);
    if (wait > 0) await sleep(wait);
    this.lastCall = Date.now();
    try {
      const url = `${API}?amount=${st.amount}&type=multiple&encode=url3986&category=${cat}${this.token ? '&token=' + this.token : ''}`;
      const data = await (await fetch(url)).json();
      if (data.response_code === 1) { st.amount = Math.floor(st.amount / 2); if (st.amount < 5) st.done = true; return; }
      if (data.response_code === 4) { st.done = true; return; }             // exhausted for this session
      if (data.response_code === 5) { await sleep(5000); return; }          // rate limited
      let kept = 0;
      for (const r of data.results || []) {
        const correct = dec(r.correct_answer);
        const wrongs = r.incorrect_answers.map(dec);
        const prompt = dec(r.question);
        const id = 'OTDB-' + hash(prompt);
        const k = promptKey(prompt);
        if (this.seen.has(id) || this.blocked.has(id) || this.excl.has(k) || this.bankKeys.has(k) || tooSpecific(prompt, correct, wrongs)) continue;
        const answers = shuffle([correct, ...wrongs]);
        const tier = OTDB_TIER[r.difficulty] || 2;
        const [, sub] = dec(r.category).split(': ');
        (this.pools[`${topic}|${tier}`] ||= []).push({ id, kind: 'trivia', source: 'otdb', topic, topicName: TOPICS[topic].name, subtopic: sub || TOPICS[topic].name, tier, prompt, answers, correct: answers.indexOf(correct) });
        kept++;
      }
      if (!kept && st.amount <= 10) st.done = true;
    } catch {
      this.online = false;                     // offline or blocked: use the bank, try again later
      setTimeout(() => { this.online = true; this.startFetching(); }, 30000);
    }
  }

  markSeen(q) {
    if (q.test || q.source === 'gen' && !/^(RID|EMO)-/.test(q.id)) return;
    this.seen.add(q.id);
    this.recent = [q.id, ...this.recent].slice(0, 60);
    store.set('noah_seen', [...this.seen].slice(-4000));
  }
  markMissed(q) {
    if (q.test || q.source === 'gen') return;
    this.missed = [q, ...this.missed.filter((m) => m.id !== q.id)].slice(0, 40);
    store.set('noah_missed', this.missed);
  }
  markRight(q) {
    const n = this.missed.length;
    this.missed = this.missed.filter((m) => m.id !== q.id);
    if (n !== this.missed.length) store.set('noah_missed', this.missed);
  }
  // Flagged: never show this question again (until it's restored in the review screen)
  block(q) {
    if (q.test) return;
    this.blocked.add(q.id);
    store.set('noah_blocked', [...this.blocked].filter((id) => !REMOVED.includes(id)));
    this.missed = this.missed.filter((m) => m.id !== q.id);
    store.set('noah_missed', this.missed);
  }
  unblock(id) {
    if (REMOVED.includes(id)) return;
    this.blocked.delete(id);
    store.set('noah_blocked', [...this.blocked].filter((x) => !REMOVED.includes(x)));
  }

  // Get a question for a topic at (roughly) a tier.
  get(tier, topic, opts = {}) {
    tier = Math.max(1, Math.min(4, Math.round(tier)));
    if (!TOPICS[topic]) topic = pick(this.topics);
    tier = Math.min(tier, topicMaxTier(topic));       // Math / Spelling / Emoji top out at level 2
    if (this.testMode) return this.testQuestion(tier, topic);
    const def = TOPICS[topic];
    // Brain teasers: generated fresh, mixed with any bank questions for that topic
    if (def.src === 'gen') {
      const bq = this.bankSize(topic) && Math.random() < 0.5 ? this.pickBank(topic, tier) : null;
      return bq || { ...generate(topic, tier, this.recentSet()), topicName: def.name };
    }

    // Questions you missed come back now and then
    if (!opts.noRepeat && Math.random() < 0.08) {
      const m = this.missed.find((x) => x.topic === topic && Math.abs(x.tier - tier) <= 1 && !this.recent.includes(x.id) && !this.blocked.has(x.id));
      if (m) return { ...m, answers: [...m.answers], returning: true };
    }
    // 1. The reviewed bank: unseen questions, nearest tier
    const fresh = this.pickBank(topic, tier);
    if (fresh) return fresh;
    // 2. Open Trivia DB top-up (online), closest tier first (tier 4 uses their "hard")
    const order = [Math.min(3, tier), Math.min(3, tier) - 1, Math.min(3, tier) + 1].filter((t) => t >= 1 && t <= 3);
    if (def.src === 'otdb') for (const t of order) {
      const pool = this.pools[`${topic}|${t}`];
      while (pool && pool.length) { const q = pool.shift(); if (!this.blocked.has(q.id)) return q; }
    }
    // 3. Topic ran dry: borrow another enabled topic
    if (!opts.borrowed) {
      for (const t of shuffle(this.topics.filter((x) => x !== topic))) {
        const q = this.get(tier, t, { ...opts, borrowed: true });
        if (q) return q;
      }
    }
    if (opts.borrowed) return null;
    // 4. Everything has been seen: allow repeats from the bank, then a puzzle
    return this.pickBank(topic, tier, { fresh: false }) || { ...generate('logic', tier), topicName: TOPICS.logic.name };
  }
  recentSet() { return new Set([...this.recent, ...this.blocked]); }
}
