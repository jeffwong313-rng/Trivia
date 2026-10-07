// Question supply: Open Trivia DB (free, thousands of questions) + a local
// fallback bank (used offline or if the API is busy) + generated puzzles.
import { makePuzzle } from './puzzles.js';

const API = 'https://opentdb.com/api.php';
const TOKEN_API = 'https://opentdb.com/api_token.php';
const DIFF = { 1: 'easy', 2: 'medium', 3: 'hard' };

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── Local fallback bank: [tier, topic, subtopic, prompt, correct, [wrong×3]]
// Includes the examples from the Question_Schema tab.
const BANK = [
  [1, 'Pop Culture', 'Gaming Consoles', 'What was the default controller color of the original Nintendo 64 (1996)?', 'Grey', ['Atomic Purple', 'Jungle Green', 'Gold']],
  [2, 'Music', 'Hip-Hop & R&B', "Which 1995 Coolio hit sampled Stevie Wonder's 'Pastime Paradise'?", "Gangsta's Paradise", ["1, 2, 3, 4 (Sumpin' New)", 'Fantastic Voyage', 'Too Hot']],
  [1, 'Technology', 'Social Media', "Who was everyone's automatic first friend on Myspace?", 'Tom', ['Mark', 'Jack', 'Kevin']],
  [2, 'Cinema', 'Fantasy Franchises', 'What is the second film in the Lord of the Rings trilogy (2002)?', 'The Two Towers', ['The Fellowship of the Ring', 'The Return of the King', 'The Battle of the Five Armies']],
  [1, 'Modern Slang', 'Internet Vernacular', "In internet slang, what does having 'rizz' mean?", 'Charm / flirting skill', ['Extreme wealth', 'Gaming skill', 'Anger']],
  [2, 'Modern Slang', 'Gen-Z Idioms', "What does 'no cap' mean?", 'No lie / for real', ['No limit', 'Free entry', 'Bald']],
  [1, 'Science', 'Astronomy', 'Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Jupiter', 'Mercury']],
  [1, 'Science', 'Biology', 'How many legs does a spider have?', '8', ['6', '10', '12']],
  [1, 'Geography', 'Capitals', 'What is the capital of Japan?', 'Tokyo', ['Kyoto', 'Osaka', 'Seoul']],
  [1, 'Geography', 'Landmarks', 'In which city is the Eiffel Tower?', 'Paris', ['Lyon', 'Brussels', 'Rome']],
  [1, 'Science', 'Chemistry', 'What gas do plants take in from the air?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Helium']],
  [1, 'Animals', 'Mammals', 'What is the largest mammal on Earth?', 'Blue whale', ['African elephant', 'Giraffe', 'Orca']],
  [1, 'Food', 'Cuisine', 'Sushi originally comes from which country?', 'Japan', ['China', 'Korea', 'Thailand']],
  [1, 'Art', 'Painting', 'Who painted the Mona Lisa?', 'Leonardo da Vinci', ['Michelangelo', 'Raphael', 'Van Gogh']],
  [1, 'Sports', 'Basketball', 'How many players per team are on a basketball court?', '5', ['6', '7', '4']],
  [1, 'Music', 'Instruments', 'How many keys does a standard piano have?', '88', ['76', '92', '64']],
  [2, 'Science', 'Physics', 'What is the speed of light, roughly?', '300,000 km/s', ['30,000 km/s', '3,000 km/s', '3,000,000 km/s']],
  [2, 'History', 'Ancient World', 'Which ancient wonder stood in Alexandria?', 'The Lighthouse (Pharos)', ['The Colossus', 'The Hanging Gardens', 'The Mausoleum']],
  [2, 'Geography', 'Rivers', 'Which river flows through Baghdad?', 'Tigris', ['Euphrates', 'Nile', 'Jordan']],
  [2, 'Science', 'Human Body', 'What is the largest organ of the human body?', 'Skin', ['Liver', 'Brain', 'Lungs']],
  [2, 'History', 'Exploration', 'In what year did humans first land on the Moon?', '1969', ['1965', '1972', '1959']],
  [2, 'Literature', 'Classics', 'Who wrote "Pride and Prejudice"?', 'Jane Austen', ['Charlotte Brontë', 'Mary Shelley', 'George Eliot']],
  [2, 'Technology', 'Computing', 'What does "CPU" stand for?', 'Central Processing Unit', ['Computer Power Unit', 'Core Program Utility', 'Central Peripheral Unit']],
  [2, 'Geography', 'Countries', 'Which country has the most natural lakes?', 'Canada', ['Russia', 'Finland', 'USA']],
  [2, 'Mythology', 'Greek', 'Who is the Greek god of the sea?', 'Poseidon', ['Hades', 'Apollo', 'Hermes']],
  [2, 'Science', 'Chemistry', 'What is the chemical symbol for gold?', 'Au', ['Ag', 'Gd', 'Go']],
  [3, 'History', 'Science', 'Ulugh Beg built his famous 15th-century observatory in which city?', 'Samarkand', ['Baghdad', 'Cairo', 'Constantinople']],
  [3, 'Science', 'Alchemy', 'What is the alchemical term for turning base metal into gold?', 'Chrysopoeia', ['Magnum Opus', 'Philosophia', 'Athanor']],
  [3, 'Art', 'Manuscripts', 'Which illuminated manuscript was made in Ireland around 800 AD?', 'Book of Kells', ['Lindisfarne Gospels', 'Codex Aureus', 'Ashburnham Pentateuch']],
  [3, 'Science', 'Astronomy', 'What is left when a massive star collapses in a supernova (if not a black hole)?', 'Neutron star', ['Red giant', 'White dwarf', 'Quasar']],
  [3, 'Geography', 'Capitals', 'What is the capital of Mongolia?', 'Ulaanbaatar', ['Astana', 'Bishkek', 'Tashkent']],
  [3, 'Science', 'Biology', 'What organelle is known as the powerhouse of the cell?', 'Mitochondria', ['Ribosome', 'Golgi apparatus', 'Nucleus']],
  [3, 'History', 'Medieval', 'In what year was the Magna Carta sealed?', '1215', ['1066', '1314', '1415']],
  [3, 'Music', 'Theory', 'How many semitones are in an octave?', '12', ['8', '7', '10']],
  [3, 'Literature', 'Poetry', 'Who wrote "The Divine Comedy"?', 'Dante Alighieri', ['Petrarch', 'Boccaccio', 'Virgil']],
  [4, 'Science', 'Physics', 'Which principle says position and momentum cannot both be known exactly?', 'Uncertainty principle', ['Pauli exclusion', 'Superposition', 'Complementarity']],
  [4, 'History', 'Ancient World', 'Which king of Persia built the first Royal Road?', 'Darius I', ['Cyrus the Great', 'Xerxes I', 'Artaxerxes']],
  [4, 'Geography', 'Extremes', 'What is the deepest point in Earth\'s oceans?', 'Challenger Deep', ['Puerto Rico Trench', 'Java Trench', 'Tonga Trench']],
  [4, 'Science', 'Chemistry', 'Which element has the highest melting point?', 'Tungsten', ['Titanium', 'Osmium', 'Iron']],
  [4, 'Art', 'Architecture', 'Which architect designed the Sagrada Família?', 'Antoni Gaudí', ['Le Corbusier', 'Frank Gehry', 'Santiago Calatrava']],
];

function bankQuestion(row, i) {
  const [tier, topic, subtopic, prompt, correct, wrongs] = row;
  const answers = shuffle([correct, ...wrongs]);
  return { id: 'BANK-' + i, kind: 'trivia', source: 'bank', topic, subtopic, tier, prompt, answers, correct: answers.indexOf(correct) };
}

// ── Auto hints for questions that don't come with their own ──
// Subtle: the topic + the "shape" of the answer. Hint: first letters.
// More than a hint: most of the letters.
function mask(word, reveal) {
  return [...word].map((ch, i) => (/[\p{L}\p{N}]/u.test(ch) ? (reveal(i, word.length) ? ch : '_') : ch)).join(' ');
}
export function hintsFor(q) {
  if (q.hints && q.hints.length) return q.hints;
  const ans = typeof q.answers[q.correct] === 'string' ? q.answers[q.correct] : '';
  const words = ans.split(/\s+/).filter(Boolean);
  const isNum = /^[\d.,%°$¢\s-]+$/.test(ans);
  const subtle = isNum ? `It's about ${q.subtopic || q.topic}. The answer is a number.`
    : `It's about ${q.subtopic || q.topic}. The answer is ${words.length} word${words.length > 1 ? 's' : ''}: ${words.map((w) => mask(w, () => false)).join('   ')}`;
  const hint = isNum ? `It starts with ${ans.trim()[0]}.`
    : `It looks like: ${words.map((w) => mask(w, (i) => i === 0)).join('   ')}`;
  const more = isNum ? `It's ${ans.trim().length <= 2 ? 'exactly' : 'close to'} ${ans.trim().slice(0, Math.ceil(ans.trim().length / 2))}…`
    : `Nearly there: ${words.map((w) => mask(w, (i, n) => i === 0 || i % 2 === 0 || i === n - 1)).join('   ')}`;
  return [subtle, hint, more];
}

// ── Open Trivia DB pool ──────────────────────────────────────
const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class QuestionSource {
  constructor() {
    this.pools = { 1: [], 2: [], 3: [] };
    this.seen = new Set(JSON.parse(localStorage.getItem('noah_seen') || '[]'));
    this.missed = JSON.parse(localStorage.getItem('noah_missed') || '[]');  // re-queue weak spots
    this.token = null;
    this.online = navigator.onLine !== false;
    this.queue = Promise.resolve();
    this.lastCall = 0;
  }

  async warmUp() {
    try {
      const r = await fetch(`${TOKEN_API}?command=request`);
      this.token = (await r.json()).token;
    } catch { this.online = false; return; }
    for (const t of [1, 2, 3]) this.refill(t);
  }

  // OpenTDB allows one request per ~5 seconds per IP; queue them.
  refill(tier) {
    if (!this.online || this.pools[tier].length > 15) return;
    if (this.pools[tier]._filling) return;
    this.pools[tier]._filling = true;
    this.queue = this.queue.then(async () => {
      const wait = 5200 - (Date.now() - this.lastCall);
      if (wait > 0) await sleep(wait);
      this.lastCall = Date.now();
      try {
        const url = `${API}?amount=40&type=multiple&encode=url3986&difficulty=${DIFF[tier]}${this.token ? '&token=' + this.token : ''}`;
        const data = await (await fetch(url)).json();
        if (data.response_code === 4 && this.token) {     // token exhausted: reset it
          await fetch(`${TOKEN_API}?command=reset&token=${this.token}`);
        }
        for (const r of data.results || []) {
          const correct = dec(r.correct_answer);
          const answers = shuffle([correct, ...r.incorrect_answers.map(dec)]);
          const [topic, subtopic] = dec(r.category).split(': ');
          const prompt = dec(r.question);
          const id = 'OTDB-' + hash(prompt);
          if (this.seen.has(id)) continue;
          this.pools[tier].push({ id, kind: 'trivia', source: 'otdb', topic, subtopic: subtopic || topic, tier, prompt, answers, correct: answers.indexOf(correct) });
        }
      } catch { this.online = false; }
      this.pools[tier]._filling = false;
    });
  }

  markSeen(q) {
    this.seen.add(q.id);
    try { localStorage.setItem('noah_seen', JSON.stringify([...this.seen].slice(-3000))); } catch {}
  }
  markMissed(q) {
    if (q.kind !== 'trivia') return;
    this.missed = [q, ...this.missed.filter((m) => m.id !== q.id)].slice(0, 40);
    try { localStorage.setItem('noah_missed', JSON.stringify(this.missed)); } catch {}
  }
  markRight(q) {
    const before = this.missed.length;
    this.missed = this.missed.filter((m) => m.id !== q.id);
    if (before !== this.missed.length) try { localStorage.setItem('noah_missed', JSON.stringify(this.missed)); } catch {}
  }

  // Get a question of a tier. kind: 'trivia' | 'puzzle'. opts.topic biases a topic.
  get(tier, kind = 'trivia', opts = {}) {
    tier = Math.max(1, Math.min(4, Math.round(tier)));
    if (kind === 'puzzle') return makePuzzle(tier, this.seen);

    // Missed-question recurrence (Game_Overview): occasionally bring one back
    if (!opts.noRepeat && this.missed.length && Math.random() < 0.08) {
      const m = this.missed.find((x) => Math.abs(x.tier - tier) <= 1);
      if (m) return { ...m, answers: [...m.answers], returning: true };
    }

    // Tier 4 = hard API question flagged as master, or a top bank question
    const apiTier = Math.min(3, tier);
    const pool = this.pools[apiTier];
    let q = null;
    if (opts.topic) {
      const i = pool.findIndex((x) => x.topic === opts.topic || x.subtopic === opts.topic);
      if (i >= 0) q = pool.splice(i, 1)[0];
    }
    if (!q && pool.length) q = pool.shift();
    this.refill(apiTier);
    if (q) return { ...q, tier };

    const fresh = BANK.map(bankQuestion).filter((b) => b.tier === tier && !this.seen.has(b.id));
    const any = BANK.map(bankQuestion).filter((b) => Math.abs(b.tier - tier) <= 1);
    return { ...(pick(fresh.length ? fresh : any)), tier };
  }

  topicsAvailable() {
    const t = new Set();
    for (const k of [1, 2, 3]) for (const q of this.pools[k]) t.add(q.topic);
    if (!t.size) BANK.forEach((b) => t.add(b[1]));
    return [...t];
  }
}

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
