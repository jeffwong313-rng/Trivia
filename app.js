/**
 * Adaptive Infinite Trivia Engine
 * Includes: ELO Rating Engine, SM-2 Spaced Repetition, Procedural Generators, & Seed Bank
 */

const STORAGE_KEY = 'trivia_adaptive_engine_state_v1';
const K_FACTOR = 32;

// --- State Management ---
const defaultState = {
  playerElo: 1200,
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    categories: {} // { categoryName: { elo: 1200, answered: 0, correct: 0 } }
  },
  srsQueue: [] // Array of { questionId, repetitions, interval, nextReviewDate, easeFactor }
};

let appState = loadState();
let currentQuestion = null;
let currentIsReview = false;

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : structuredClone(defaultState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// --- Curated Seed Bank ---
const staticQuestionBank = [
  // Japan Trivia
  {
    id: "jp_001",
    category: "Asian History & Culture",
    difficulty: 1250,
    question: "Which warlord completed the initial unification of Japan in the late 16th century prior to the Tokugawa shogunate?",
    options: ["Oda Nobunaga", "Toyotomi Hideyoshi", "Tokugawa Ieyasu", "Minamoto no Yoritomo"],
    answerIndex: 1,
    explanation: "While Oda Nobunaga initiated the unification during the Sengoku period, Toyotomi Hideyoshi completed it through major campaigns, land surveys, and sword hunts before Tokugawa Ieyasu established the enduring Edo shogunate."
  },
  {
    id: "jp_002",
    category: "Asian History & Culture",
    difficulty: 1100,
    question: "What is the northernmost main island of the Japanese archipelago?",
    options: ["Honshu", "Kyushu", "Shikoku", "Hokkaido"],
    answerIndex: 3,
    explanation: "Hokkaido is Japan's second largest and northernmost of the four main islands, renowned for cold winters, volcano-rich national parks, and agriculture."
  },
  // Thailand Trivia
  {
    id: "th_001",
    category: "Asian History & Culture",
    difficulty: 1200,
    question: "Which historical kingdom served as the capital of Siam from 1350 until its destruction in 1767?",
    options: ["Sukhothai", "Ayutthaya", "Thonburi", "Lanna"],
    answerIndex: 1,
    explanation: "The Ayutthaya Kingdom flourished for over four centuries as a major global trading hub until it was sacked by the Burmese Konbaung dynasty in 1767, prompting King Taksin to establish the brief Thonburi capital."
  },
  {
    id: "th_002",
    category: "Asian History & Culture",
    difficulty: 1050,
    question: "What is the formal ceremonial ceremonial name of Bangkok abbreviated as in common Thai usage?",
    options: ["Krung Thep Maha Nakhon", "Chiang Mai", "Nakhon Ratchasima", "Phra Nakhon Si Ayutthaya"],
    answerIndex: 0,
    explanation: "Locally abbreviated to 'Krung Thep', the full ceremonial name holds the Guinness World Record for the longest place name, meaning 'City of Angels, Great City of Immortals'."
  },
  // American History & Civics
  {
    id: "us_001",
    category: "American Civics & History",
    difficulty: 1150,
    question: "How many amendments comprise the original Bill of Rights ratified in 1791?",
    options: ["8", "10", "12", "14"],
    answerIndex: 1,
    explanation: "Of the twelve amendments drafted by James Madison and passed by Congress in 1789, ten were ratified by the states on December 15, 1791, becoming the Bill of Rights."
  },
  {
    id: "us_002",
    category: "American Civics & History",
    difficulty: 1300,
    question: "Which executive department was established directly in response to the September 11 terrorist attacks?",
    options: ["Department of Veterans Affairs", "Department of Homeland Security", "Department of Energy", "Department of Defense"],
    answerIndex: 1,
    explanation: "The Department of Homeland Security (DHS) was established under the Homeland Security Act of 2002 to consolidate 22 federal agencies into a unified cabinet department."
  },
  // Technology & Computer Science
  {
    id: "tech_001",
    category: "Technology",
    difficulty: 1200,
    question: "In computational complexity theory, what does the class 'NP' stand for?",
    options: ["Non-Polynomial time", "Non-deterministic Polynomial time", "Network Protocol", "Node Priority"],
    answerIndex: 1,
    explanation: "NP stands for 'Non-deterministic Polynomial time'. It refers to decision problems for which a proposed solution can be verified in polynomial time by a deterministic Turing machine."
  },
  {
    id: "tech_002",
    category: "Technology",
    difficulty: 1050,
    question: "What HTTP response status code signifies that a requested resource is permanently moved?",
    options: ["301 Moved Permanently", "302 Found", "404 Not Found", "503 Service Unavailable"],
    answerIndex: 0,
    explanation: "HTTP 301 is an HTTP redirection status code indicating that the resource has been permanently assigned a new URI and future references should use one of the returned URIs."
  }
];

// --- Procedural Question Generators (Infinite Bank) ---
const proceduralGenerators = [
  // Arithmetic & Mental Math
  () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    if (op === '+') {
      a = Math.floor(Math.random() * 85) + 15;
      b = Math.floor(Math.random() * 85) + 15;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 90) + 20;
      b = Math.floor(Math.random() * (a - 10)) + 5;
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 14) + 6;
      b = Math.floor(Math.random() * 14) + 6;
      answer = a * b;
    }

    const distractors = new Set();
    while (distractors.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 6) + 1);
      const val = answer + offset;
      if (val !== answer && val > 0) distractors.add(val);
    }

    const options = Array.from(distractors);
    const insertIdx = Math.floor(Math.random() * 4);
    options.splice(insertIdx, 0, answer);

    return {
      id: `proc_math_${Date.now()}_${Math.random()}`,
      category: "Mathematics",
      difficulty: op === '*' ? 1200 : 1000,
      question: `Evaluate the mathematical expression: ${a} ${op} ${b}`,
      options: options.map(String),
      answerIndex: insertIdx,
      explanation: `Step-by-step arithmetic: ${a} ${op} ${b} equals ${answer}.`
    };
  },

  // Modular Arithmetic
  () => {
    const num = Math.floor(Math.random() * 70) + 15;
    const mod = Math.floor(Math.random() * 6) + 4; // 4 to 9
    const answer = num % mod;

    const distractors = new Set();
    for (let i = 0; i < mod; i++) {
      if (i !== answer) distractors.add(i);
    }
    const distList = Array.from(distractors).sort(() => 0.5 - Math.random()).slice(0, 3);
    const insertIdx = Math.floor(Math.random() * 4);
    distList.splice(insertIdx, 0, answer);

    return {
      id: `proc_mod_${Date.now()}_${Math.random()}`,
      category: "Mathematics",
      difficulty: 1300,
      question: `What is the remainder when ${num} is divided by ${mod} (${num} mod ${mod})?`,
      options: distList.map(String),
      answerIndex: insertIdx,
      explanation: `${num} divided by ${mod} is ${Math.floor(num / mod)} with a remainder of ${answer} (${Math.floor(num / mod)} × ${mod} + ${answer} = ${num}).`
    };
  },

  // Science / Physics / Chemistry Conversion
  () => {
    const celsius = Math.floor(Math.random() * 40) * 5; // clean multiples
    const fahrenheit = (celsius * 9 / 5) + 32;

    const distractors = new Set([
      fahrenheit + 10,
      fahrenheit - 10,
      celsius + 32
    ]);

    const options = Array.from(distractors).slice(0, 3);
    const insertIdx = Math.floor(Math.random() * 4);
    options.splice(insertIdx, 0, fahrenheit);

    return {
      id: `proc_sci_${Date.now()}_${Math.random()}`,
      category: "Science",
      difficulty: 1100,
      question: `Convert ${celsius}°C to Fahrenheit.`,
      options: options.map(v => `${v}°F`),
      answerIndex: insertIdx,
      explanation: `Using the formula F = (C × 9/5) + 32: (${celsius} × 1.8) + 32 = ${fahrenheit}°F.`
    };
  }
];

// --- Core Algorithm: Adaptive Selection Engine ---
function getNextQuestion() {
  const now = Date.now();
  
  // 1. Spaced Repetition Queue check (due cards)
  const dueIndex = appState.srsQueue.findIndex(item => item.nextReviewDate <= now);
  if (dueIndex !== -1) {
    const dueItem = appState.srsQueue[dueIndex];
    const candidate = staticQuestionBank.find(q => q.id === dueItem.questionId);
    if (candidate) {
      currentIsReview = true;
      return candidate;
    }
  }

  currentIsReview = false;

  // 2. Identify Weakest Topic to boost probability
  const categories = Object.keys(appState.stats.categories);
  let weakCategory = null;
  if (categories.length > 0) {
    weakCategory = categories.reduce((lowest, cat) => {
      const currentElo = appState.stats.categories[cat].elo;
      return (currentElo < appState.stats.categories[lowest].elo) ? cat : lowest;
    }, categories[0]);
  }

  // 3. Balance 50% Procedural generation and 50% Curated Bank
  const chooseProcedural = Math.random() > 0.5;

  if (chooseProcedural) {
    const gen = proceduralGenerators[Math.floor(Math.random() * proceduralGenerators.length)];
    return gen();
  } else {
    // Pick from static bank close to player ELO
    let candidates = staticQuestionBank;
    if (weakCategory && Math.random() < 0.4) {
      const catMatches = staticQuestionBank.filter(q => q.category === weakCategory);
      if (catMatches.length > 0) candidates = catMatches;
    }

    // Sort by absolute distance to current ELO
    const sorted = [...candidates].sort((a, b) => 
      Math.abs(a.difficulty - appState.playerElo) - Math.abs(b.difficulty - appState.playerElo)
    );
    // Add randomness among top matches
    return sorted[Math.floor(Math.random() * Math.min(sorted.length, 3))];
  }
}

// --- ELO Computation ---
function calculateEloDelta(playerElo, questionElo, won) {
  const expected = 1 / (1 + Math.pow(10, (questionElo - playerElo) / 400));
  const actual = won ? 1 : 0;
  return Math.round(K_FACTOR * (actual - expected));
}

// --- Spaced Repetition (SuperMemo SM-2 adaptation) ---
function updateSrsQueue(questionId, isCorrect) {
  let record = appState.srsQueue.find(item => item.questionId === questionId);
  const now = Date.now();

  if (!record) {
    if (!isCorrect) {
      // Register new missed question: due in 2 minutes
      appState.srsQueue.push({
        questionId,
        repetitions: 0,
        intervalMinutes: 2,
        easeFactor: 2.5,
        nextReviewDate: now + 2 * 60 * 1000
      });
    }
    return;
  }

  if (isCorrect) {
    record.repetitions += 1;
    if (record.repetitions === 1) record.intervalMinutes = 10;
    else if (record.repetitions === 2) record.intervalMinutes = 60;
    else record.intervalMinutes = Math.round(record.intervalMinutes * record.easeFactor);
    record.nextReviewDate = now + record.intervalMinutes * 60 * 1000;
  } else {
    record.repetitions = 0;
    record.intervalMinutes = 2;
    record.easeFactor = Math.max(1.3, record.easeFactor - 0.2);
    record.nextReviewDate = now + 2 * 60 * 1000;
  }
}

// --- UI Binding & Game Loop ---
function initCategoryStats(category) {
  if (!appState.stats.categories[category]) {
    appState.stats.categories[category] = {
      elo: 1200,
      answered: 0,
      correct: 0
    };
  }
}

function renderUI() {
  document.getElementById('player-elo').textContent = appState.playerElo;
  document.getElementById('total-answered').textContent = appState.stats.totalAnswered;
  
  const acc = appState.stats.totalAnswered > 0
    ? Math.round((appState.stats.totalCorrect / appState.stats.totalAnswered) * 100)
    : 0;
  document.getElementById('accuracy-rate').textContent = `${acc}%`;

  // Render weak badge
  const cats = Object.keys(appState.stats.categories);
  const badge = document.getElementById('weakest-topic-badge');
  if (cats.length > 1) {
    const weakest = cats.reduce((lowest, c) => 
      appState.stats.categories[c].elo < appState.stats.categories[lowest].elo ? c : lowest, cats[0]);
    document.getElementById('weakest-topic-name').textContent = weakest;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  // Render Domain Matrix
  const matrixContainer = document.getElementById('category-matrix');
  matrixContainer.innerHTML = '';
  cats.forEach(cat => {
    const data = appState.stats.categories[cat];
    const item = document.createElement('div');
    item.className = 'p-2 rounded-lg bg-slate-800/50 border border-slate-700/40 flex justify-between items-center';
    item.innerHTML = `
      <span class="text-slate-300 truncate mr-2">${cat}</span>
      <span class="font-mono font-semibold ${data.elo >= 1200 ? 'text-emerald-400' : 'text-amber-400'}">${data.elo}</span>
    `;
    matrixContainer.appendChild(item);
  });
}

function loadQuestion() {
  currentQuestion = getNextQuestion();
  initCategoryStats(currentQuestion.category);

  // Set card contents
  document.getElementById('question-category').textContent = currentQuestion.category;
  document.getElementById('question-difficulty').textContent = `Diff: ${currentQuestion.difficulty}`;
  document.getElementById('question-text').textContent = currentQuestion.question;

  const srsBadge = document.getElementById('srs-status');
  if (currentIsReview) srsBadge.classList.remove('hidden');
  else srsBadge.classList.add('hidden');

  // Options
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';
  document.getElementById('explanation-panel').classList.add('hidden');

  currentQuestion.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="text-slate-400 font-mono mr-2">${String.fromCharCode(65 + idx)}.</span> ${opt}`;
    btn.addEventListener('click', () => handleAnswer(idx));
    grid.appendChild(btn);
  });
}

function handleAnswer(selectedIndex) {
  const isCorrect = selectedIndex === currentQuestion.answerIndex;
  const buttons = document.querySelectorAll('#options-grid button');

  // Lock options and mark colors
  buttons.forEach((btn, idx) => {
    btn.classList.add('option-disabled');
    btn.disabled = true;
    if (idx === currentQuestion.answerIndex) {
      btn.classList.add('option-correct');
    } else if (idx === selectedIndex && !isCorrect) {
      btn.classList.add('option-incorrect');
    }
  });

  // Calculate ELO Delta
  const eloDelta = calculateEloDelta(appState.playerElo, currentQuestion.difficulty, isCorrect);
  appState.playerElo = Math.max(400, appState.playerElo + eloDelta);

  // Category stats
  const catStats = appState.stats.categories[currentQuestion.category];
  const catDelta = calculateEloDelta(catStats.elo, currentQuestion.difficulty, isCorrect);
  catStats.elo = Math.max(400, catStats.elo + catDelta);
  catStats.answered += 1;
  if (isCorrect) catStats.correct += 1;

  appState.stats.totalAnswered += 1;
  if (isCorrect) appState.stats.totalCorrect += 1;

  // SRS Update for static questions
  if (!currentQuestion.id.startsWith('proc_')) {
    updateSrsQueue(currentQuestion.id, isCorrect);
  }

  saveState();
  renderUI();

  // Show Inline Explanation Panel Immediately
  const panel = document.getElementById('explanation-panel');
  const icon = document.getElementById('feedback-icon');
  const headline = document.getElementById('feedback-headline');
  const explanation = document.getElementById('feedback-text');
  const deltaDisplay = document.getElementById('elo-delta-display');

  if (isCorrect) {
    icon.textContent = '✅';
    headline.textContent = 'Correct!';
    headline.className = 'text-base font-bold text-emerald-400';
  } else {
    icon.textContent = '❌';
    headline.textContent = 'Incorrect';
    headline.className = 'text-base font-bold text-rose-400';
  }

  document.getElementById('explanation-text').textContent = currentQuestion.explanation;
  deltaDisplay.textContent = `ELO: ${eloDelta >= 0 ? '+' : ''}${eloDelta} (Rating: ${appState.playerElo})`;
  panel.classList.remove('hidden');
}

// Next Question Trigger
document.getElementById('next-question-btn').addEventListener('click', loadQuestion);

// Reset handler
document.getElementById('reset-stats-btn').addEventListener('click', () => {
  if (confirm("Reset all ratings, answer logs, and review intervals?")) {
    localStorage.removeItem(STORAGE_KEY);
    appState = structuredClone(defaultState);
    saveState();
    renderUI();
    loadQuestion();
  }
});

// App Initialization
window.addEventListener('DOMContentLoaded', () => {
  renderUI();
  loadQuestion();
});
