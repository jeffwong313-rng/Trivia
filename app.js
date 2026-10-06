/* ==========================================================================
   THE LOST BOY - TRIVIA RPG GAME ENGINE
   ========================================================================== */

// --- SAMPLE QUESTION DATABASE (Categorized with Elo, Era, and Distractors) ---
const QUESTION_DATABASE = [
  {
    id: "Q101",
    category: "90s Nostalgia",
    subtopic: "Slang",
    elo: 1050,
    prompt: "In 1990s slang, what did the phrase 'Talk to the hand' famously imply?",
    correct: "'Because the face ain't listening'",
    distractors: ["'I want a high five'", "'Let's make a deal'", "'Keep typing'"]
  },
  {
    id: "Q102",
    category: "2000s Pop Culture",
    subtopic: "Internet & Slang",
    elo: 1120,
    prompt: "Which portable MP3 device did Apple launch in late 2001 that revolutionized digital music?",
    correct: "iPod",
    distractors: ["Zune", "Walkman MiniDisc", "Nomad Jukebox"]
  },
  {
    id: "Q103",
    category: "Modern Slang",
    subtopic: "Internet Culture",
    elo: 1180,
    prompt: "If someone in modern internet slang says you have 'unspoken rizz', what do you possess?",
    correct: "Effortless natural charisma and charm",
    distractors: ["Terrible dancing skills", "Extreme bad luck", "A hidden talent for video games"]
  },
  {
    id: "Q104",
    category: "Aptitude & Math",
    subtopic: "Number Sequences",
    elo: 1250,
    prompt: "What is the next number in this Fibonacci-style sequence: 2, 3, 5, 8, 13, __?",
    correct: "21",
    distractors: ["19", "20", "24"]
  },
  {
    id: "Q105",
    category: "General Knowledge",
    subtopic: "Astronomy",
    elo: 1020,
    prompt: "Which planet in our solar system has the most prominent and visible ring system?",
    correct: "Saturn",
    distractors: ["Mars", "Jupiter", "Neptune"]
  },
  {
    id: "Q106",
    category: "90s Nostalgia",
    subtopic: "Gaming",
    elo: 1100,
    prompt: "Which 1996 handheld virtual pet required players to feed, clean, and discipline an alien creature?",
    correct: "Tamagotchi",
    distractors: ["Furby", "Game Boy Pocket", "Giga Pet"]
  },
  {
    id: "Q107",
    category: "Boss Trivia",
    subtopic: "Mythology & Logic",
    elo: 1400,
    prompt: "In Greek mythology, who flew too close to the sun with wings made of feathers and wax?",
    correct: "Icarus",
    distractors: ["Daedalus", "Perseus", "Achilles"]
  }
];

// --- GAME STATE ---
const state = {
  players: [],
  currentPlayerIndex: 0,
  currentScreen: "screen-lobby",
  mapIndex: 1,
  currentNode: 0,
  maxNodes: 5,
  hp: 100,
  maxHp: 100,
  mp: 5,
  maxMp: 5,
  rerolls: 2,
  level: 1,
  xp: 0,
  xpToNext: 100,
  stats: { S: 1, P: 1, E: 1, C: 1, I: 1, A: 1, L: 1 },
  activeQuestion: null,
  eliminatedOptions: [],
  cutsceneStep: 0,
  runStats: { questionsAnswered: 0, correctAnswers: 0, startTime: 0, nodesCleared: 0 }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  setupLobbyEvents();
  setupCutsceneEvents();
  setupGameplayEvents();
  renderLeaderboardHistory();
});

// --- LOBBY SYSTEM ---
function setupLobbyEvents() {
  const nameInput = document.getElementById("player-name-input");
  const addBtn = document.getElementById("btn-add-player");
  const startBtn = document.getElementById("btn-start-adventure");

  function addPlayer() {
    const name = nameInput.value.trim();
    if (name) {
      state.players.push(name);
      nameInput.value = "";
      renderPlayerRoster();
      startBtn.style.display = "inline-flex";
      nameInput.focus();
    }
  }

  addBtn.addEventListener("click", addPlayer);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addPlayer();
  });

  startBtn.addEventListener("click", () => {
    state.runStats.startTime = Date.now();
    recalculateDerivedStats();
    showScreen("screen-cutscene");
    startCutscene();
  });
}

function renderPlayerRoster() {
  const roster = document.getElementById("player-roster");
  roster.innerHTML = state.players
    .map((name, i) => `<div class="player-tag">🎈 Player ${i + 1}: <strong>${escapeHtml(name)}</strong></div>`)
    .join("");
}

// --- CUTSCENE ENGINE (Lost boy in grass with red balloon) ---
const cutsceneDialogues = [
  "A faint gust of wind whips across the grassland... He clutches the thin red string tightly.",
  "The boy opens his eyes. He is resting upon the silent grasslands, staring up at the distant clouds.",
  "He stands up, brushing the dirt from his knees, looking towards the vast misty horizon.",
  "\"I need to find my way back home,\" he whispers."
];

function setupCutsceneEvents() {
  document.getElementById("btn-cutscene-next").addEventListener("click", () => {
    state.cutsceneStep++;
    if (state.cutsceneStep < cutsceneDialogues.length) {
      renderCutsceneFrame();
    } else {
      showScreen("screen-map");
      renderMap();
    }
  });
}

function startCutscene() {
  state.cutsceneStep = 0;
  renderCutsceneFrame();
}

function renderCutsceneFrame() {
  const canvas = document.getElementById("cutscene-canvas");
  const ctx = canvas.getContext("2d");
  const textEl = document.getElementById("cutscene-dialogue");
  textEl.innerText = cutsceneDialogues[state.cutsceneStep];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background gradient: Grassland & horizon
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(0.65, "#1e3a2f");
  grad.addColorStop(1, "#14532d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Distant clouds
  ctx.fillStyle = "rgba(226, 232, 240, 0.25)";
  ctx.beginPath();
  ctx.arc(200, 120, 60, 0, Math.PI * 2);
  ctx.arc(260, 110, 70, 0, Math.PI * 2);
  ctx.arc(320, 130, 50, 0, Math.PI * 2);
  ctx.fill();

  // Character sketch progression (Rough sketch on early levels)
  const boyX = 440;
  const boyY = state.cutsceneStep === 1 ? 280 : 250;

  ctx.strokeStyle = "rgba(248, 250, 252, 0.85)";
  ctx.lineWidth = 2.5;

  if (state.cutsceneStep === 1) {
    // Boy lying on the ground
    ctx.beginPath();
    ctx.arc(boyX - 25, boyY, 14, 0, Math.PI * 2); // Head
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(boyX - 10, boyY);
    ctx.lineTo(boyX + 35, boyY + 10); // Body
    ctx.stroke();
  } else {
    // Boy standing
    ctx.beginPath();
    ctx.arc(boyX, boyY - 35, 15, 0, Math.PI * 2); // Head
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(boyX, boyY - 20);
    ctx.lineTo(boyX, boyY + 25); // Body
    ctx.lineTo(boyX - 12, boyY + 60); // Left Leg
    ctx.moveTo(boyX, boyY + 25);
    ctx.lineTo(boyX + 12, boyY + 60); // Right Leg
    ctx.moveTo(boyX, boyY - 10);
    ctx.lineTo(boyX + 22, boyY - 25); // Arm holding string
    ctx.stroke();
  }

  // The Iconic Red Balloon
  const balloonX = boyX + 35;
  const balloonY = boyY - 95;

  // String
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 1.2;
  ctx.moveTo(state.cutsceneStep === 1 ? boyX : boyX + 22, state.cutsceneStep === 1 ? boyY : boyY - 25);
  ctx.quadraticCurveTo(balloonX - 10, balloonY + 30, balloonX, balloonY);
  ctx.stroke();

  // Red Balloon
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(balloonX, balloonY, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Balloon shine highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.beginPath();
  ctx.arc(balloonX - 6, balloonY - 8, 4, 0, Math.PI * 2);
  ctx.fill();
}

// --- PROCEDURAL MAP & NODE EXPLORATION ---
function renderMap() {
  updateHUD();
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grassland background with bushes
  ctx.fillStyle = "#064e3b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const totalTiers = 5;
  const tierHeight = canvas.height / (totalTiers + 1);

  // Draw node branches
  for (let tier = 0; tier < totalTiers; tier++) {
    const y = canvas.height - (tier + 1) * tierHeight;
    const isBoss = tier === totalTiers - 1;
    const nodeCount = isBoss ? 1 : 3;

    for (let col = 0; col < nodeCount; col++) {
      const x = isBoss ? canvas.width / 2 : (canvas.width / (nodeCount + 1)) * (col + 1);

      // Perception Fog of War logic
      const nodesAhead = tier - state.currentNode;
      const isVisible = nodesAhead <= state.stats.P;

      ctx.beginPath();
      ctx.arc(x, y, isBoss ? 26 : 18, 0, Math.PI * 2);

      if (tier === state.currentNode) {
        ctx.fillStyle = "#f59e0b"; // Current selectable tier
      } else if (tier < state.currentNode) {
        ctx.fillStyle = "#15803d"; // Cleared tier
      } else if (isVisible) {
        ctx.fillStyle = isBoss ? "#ef4444" : "#3b82f6"; // Visible upcoming node
      } else {
        ctx.fillStyle = "#334155"; // Hidden by fog
      }
      ctx.fill();

      // Label or Fog clouds
      if (!isVisible && tier > state.currentNode) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "11px sans-serif";
        ctx.fillText("☁️ Fog", x - 14, y + 4);
      } else if (isBoss) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText("BOSS", x - 16, y + 4);
      }
    }
  }
}

// Handle Map Canvas Clicks
document.getElementById("map-canvas").addEventListener("click", () => {
  if (state.currentNode < state.maxNodes - 1) {
    loadTriviaQuestion(false);
  } else {
    loadTriviaQuestion(true); // Final Boss Gauntlet
  }
});

// --- COMBAT & QUESTION ENGINE ---
function loadTriviaQuestion(isBoss) {
  state.activeQuestion = getRandomQuestion(isBoss);
  state.eliminatedOptions = [];
  document.getElementById("hint-display").style.display = "none";

  showScreen("screen-question");

  document.getElementById("q-category").innerText = `${state.activeQuestion.category} • ${state.activeQuestion.subtopic}`;
  document.getElementById("q-elo").innerText = isBoss ? "⚠️ BOSS ENCOUNTER" : `Elo: ${state.activeQuestion.elo}`;
  document.getElementById("q-prompt").innerText = state.activeQuestion.prompt;

  renderQuestionOptions();
  updateHUD();
}

function getRandomQuestion(isBoss) {
  if (isBoss) {
    return QUESTION_DATABASE.find(q => q.subtopic === "Mythology & Logic") || QUESTION_DATABASE[0];
  }
  const pool = QUESTION_DATABASE.filter(q => q.subtopic !== "Mythology & Logic");
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderQuestionOptions() {
  const container = document.getElementById("q-options");
  container.innerHTML = "";

  const allChoices = [state.activeQuestion.correct, ...state.activeQuestion.distractors];
  // Seed-consistent shuffle
  const shuffled = allChoices.sort();

  shuffled.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = choice;

    if (state.eliminatedOptions.includes(choice)) {
      btn.classList.add("eliminated");
    }

    btn.addEventListener("click", () => handleAnswerSubmission(choice));
    container.appendChild(btn);
  });
}

function handleAnswerSubmission(selectedAnswer) {
  state.runStats.questionsAnswered++;
  const isCorrect = selectedAnswer === state.activeQuestion.correct;
  const confidence = parseInt(document.getElementById("confidence-select").value);

  if (isCorrect) {
    state.runStats.correctAnswers++;
    // Mana Regen based on Intelligence level
    const mpGain = state.stats.I >= 7 ? 3 : (state.stats.I >= 3 ? 2 : 1);
    state.mp = Math.min(state.maxMp, state.mp + mpGain);

    // EXP Calculation modified by Strength and Confidence
    const expBase = 40 * (confidence === 3 ? 1.75 : (confidence === 1 ? 0.75 : 1.0));
    const expGain = Math.round(expBase * (1 + state.stats.S * 0.15));
    state.xp += expGain;

    alert(`Correct! 🎉\nEarned ${expGain} EXP and recovered ${mpGain} MP.`);

    checkLevelUpProgress();
  } else {
    // Damage taken modified by Confidence and Endurance
    const baseDamage = 35;
    const dmgMultiplier = confidence === 3 ? 1.5 : (confidence === 1 ? 0.6 : 1.0);
    const damageTaken = Math.round(baseDamage * dmgMultiplier);

    state.hp -= damageTaken;
    alert(`Incorrect! ❌\nThe correct answer was: "${state.activeQuestion.correct}"\nTook ${damageTaken} damage!`);

    if (state.hp <= 0) {
      endGame(false);
      return;
    }
  }

  // Advance turn to next party player
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.currentNode++;
  state.runStats.nodesCleared++;

  if (state.currentNode >= state.maxNodes) {
    endGame(true); // Cleared Map!
  } else {
    showScreen("screen-map");
    renderMap();
  }
}

// --- SKILLS & CONSUMABLES ---
function setupGameplayEvents() {
  // Eliminate 1 (3 MP)
  document.getElementById("skill-eliminate").addEventListener("click", () => {
    if (state.mp >= 3) {
      const remainingDistractors = state.activeQuestion.distractors.filter(d => !state.eliminatedOptions.includes(d));
      if (remainingDistractors.length > 0) {
        state.mp -= 3;
        state.eliminatedOptions.push(remainingDistractors[0]);
        renderQuestionOptions();
        updateHUD();
      }
    }
  });

  // Hint Skill (2 MP)
  document.getElementById("skill-hint").addEventListener("click", () => {
    if (state.mp >= 2) {
      state.mp -= 2;
      const hintEl = document.getElementById("hint-display");
      hintEl.style.display = "block";
      hintEl.innerText = `💡 Clue: Think about ${state.activeQuestion.subtopic} and key contextual keywords in the prompt.`;
      updateHUD();
    }
  });

  // Charisma Reroll
  document.getElementById("skill-reroll").addEventListener("click", () => {
    if (state.rerolls > 0) {
      state.rerolls--;
      loadTriviaQuestion(false);
    }
  });

  document.getElementById("btn-restart-run").addEventListener("click", () => {
    location.reload();
  });
}

// --- PROGRESSION & S.P.E.C.I.A.L. SYSTEM ---
function recalculateDerivedStats() {
  state.maxHp = 100 + (state.stats.E - 1) * 25;
  state.hp = state.maxHp;
  state.maxMp = 1 + (state.stats.I - 1) * 2;
  state.mp = state.maxMp;
  state.rerolls = 2 * state.stats.C;
}

function checkLevelUpProgress() {
  if (state.xp >= state.xpToNext) {
    state.level++;
    state.xp -= state.xpToNext;
    state.xpToNext = Math.round(state.xpToNext * 1.4);
    showLevelUpModal();
  }
}

function showLevelUpModal() {
  showScreen("screen-levelup");
  const grid = document.getElementById("stat-allocation-grid");
  const statDefs = [
    { key: "S", name: "Strength", desc: "Increases confidence bonus EXP curve." },
    { key: "P", name: "Perception", desc: "Reveals map nodes and question topics further ahead." },
    { key: "E", name: "Endurance", desc: "Increases maximum party HP pool." },
    { key: "C", name: "Charisma", desc: "Grants more question rerolls per map." },
    { key: "I", name: "Intelligence", desc: "Increases Mana Pool and regen per correct answer." },
    { key: "A", name: "Agility", desc: "Increases final score speed multiplier." },
    { key: "L", name: "Luck", desc: "Boosts chance for favorable heal encounters." }
  ];

  grid.innerHTML = statDefs.map(s => `
    <div class="stat-card">
      <div>
        <strong>${s.name} (${s.key}): Lv ${state.stats[s.key]}</strong>
        <p style="font-size: 0.85rem; color: var(--text-dim); margin-top: 6px;">${s.desc}</p>
      </div>
      <button class="btn btn-secondary" style="margin-top: 12px; padding: 6px 12px; font-size: 0.9rem;" onclick="allocateStat('${s.key}')">+1 Upgrade</button>
    </div>
  `).join("");
}

window.allocateStat = function(statKey) {
  state.stats[statKey]++;
  recalculateDerivedStats();
  showScreen("screen-map");
  renderMap();
};

// --- HUD & SCREEN ROUTING ---
function updateHUD() {
  document.getElementById("hud").style.display = state.currentScreen === "screen-lobby" ? "none" : "flex";
  document.getElementById("hud-active-player").innerText = state.players[state.currentPlayerIndex] || "Party";
  document.getElementById("hud-hp-text").innerText = `${state.hp}/${state.maxHp}`;
  document.getElementById("hp-bar").style.width = `${Math.max(0, (state.hp / state.maxHp) * 100)}%`;
  document.getElementById("hud-mp-text").innerText = `${state.mp}/${state.maxMp}`;
  document.getElementById("mp-bar").style.width = `${Math.max(0, (state.mp / state.maxMp) * 100)}%`;
  document.getElementById("hud-map-node").innerText = `${state.mapIndex} (Node ${state.currentNode + 1})`;
  document.getElementById("hud-rerolls").innerText = state.rerolls;

  // Update skill button availability
  document.getElementById("skill-eliminate").disabled = state.mp < 3;
  document.getElementById("skill-hint").disabled = state.mp < 2;
  document.getElementById("skill-reroll").disabled = state.rerolls <= 0;
}

function showScreen(screenId) {
  state.currentScreen = screenId;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
  updateHUD();
}

// --- RUN COMPLETION & LEADERBOARD ---
function endGame(isVictory) {
  showScreen("screen-leaderboard");
  const timeTaken = Math.round((Date.now() - state.runStats.startTime) / 1000);
  const agilityMult = 1.0 + (state.stats.A * 0.08);
  const finalScore = Math.round((state.runStats.nodesCleared * 250 + state.runStats.correctAnswers * 150) * agilityMult);

  const summary = document.getElementById("run-summary-text");
  summary.innerHTML = isVictory
    ? `🎉 <strong>Map Cleared!</strong> The lost boy guided his red balloon safely to the sanctuary.`
    : `💀 <strong>Run Over.</strong> The party fell in combat, but their journey is etched into memory.`;

  // Save score locally
  const runRecord = {
    party: state.players.join(", ") || "Solo Explorer",
    score: finalScore,
    nodes: state.runStats.nodesCleared,
    accuracy: `${state.runStats.correctAnswers}/${state.runStats.questionsAnswered}`,
    time: `${timeTaken}s`,
    date: new Date().toLocaleDateString()
  };

  const history = JSON.parse(localStorage.getItem("trivia_leaderboard") || "[]");
  history.push(runRecord);
  history.sort((a, b) => b.score - a.score);
  localStorage.setItem("trivia_leaderboard", JSON.stringify(history.slice(0, 10)));

  renderLeaderboardHistory();
}

function renderLeaderboardHistory() {
  const container = document.getElementById("leaderboard-table-container");
  const history = JSON.parse(localStorage.getItem("trivia_leaderboard") || "[]");

  if (history.length === 0) {
    container.innerHTML = `<p style="color: var(--text-dim); text-align: center;">No completed runs recorded yet.</p>`;
    return;
  }

  let tableHtml = `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.95rem;">
      <thead>
        <tr style="border-bottom: 1px solid #475569; color: var(--accent-gold);">
          <th style="padding: 8px;">Rank</th>
          <th style="padding: 8px;">Party</th>
          <th style="padding: 8px;">Score</th>
          <th style="padding: 8px;">Nodes</th>
          <th style="padding: 8px;">Accuracy</th>
          <th style="padding: 8px;">Time</th>
        </tr>
      </thead>
      <tbody>
  `;

  history.forEach((row, i) => {
    tableHtml += `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 8px;">#${i + 1}</td>
        <td style="padding: 8px; font-weight: 600;">${escapeHtml(row.party)}</td>
        <td style="padding: 8px; color: var(--accent-blue); font-weight: 700;">${row.score}</td>
        <td style="padding: 8px;">${row.nodes}</td>
        <td style="padding: 8px;">${row.accuracy}</td>
        <td style="padding: 8px; color: var(--text-dim);">${row.time}</td>
      </tr>
    `;
  });

  tableHtml += `</tbody></table>`;
  container.innerHTML = tableHtml;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}
