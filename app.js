/* ==========================================================================
   NOAH: WAY HOME - COLLABORATIVE TRIVIA RPG ENGINE
   ========================================================================== */

// --- 8 BIOMES PROGRESSION MAP DEFINITIONS ---
const BIOMES = [
  { index: 1, name: "Grassland Outskirts", type: "grassland", bossName: "The Faceless Warden", bossMistakesAllowed: 2, bossDmg: 35, maxLevel: 4 },
  { index: 2, name: "Whispering Steppes", type: "grassland", bossName: "The Mirage Stalker", bossMistakesAllowed: 2, bossDmg: 40, maxLevel: 6 },
  { index: 3, name: "Shifting Dunes", type: "desert", bossName: "The Sunken Colossus", bossMistakesAllowed: 2, bossDmg: 50, maxLevel: 8 },
  { index: 4, name: "Mirage Wastes", type: "desert", bossName: "The Sandglass Sphinx", bossMistakesAllowed: 2, bossDmg: 60, maxLevel: 10 },
  { index: 5, name: "Craggy Foothills", type: "mountain", bossName: "The Canyon Arbiter", bossMistakesAllowed: 2, bossDmg: 75, maxLevel: 12 },
  { index: 6, name: "Mistveiled Crags", type: "mountain", bossName: "The Gale Phantom", bossMistakesAllowed: 1, bossDmg: 85, maxLevel: 14 },
  { index: 7, name: "Glacial Ascent", type: "mountain", bossName: "The Frostbound Chimera", bossMistakesAllowed: 1, bossDmg: 100, maxLevel: 16 },
  { index: 8, name: "Beacon Summit", type: "summit", bossName: "The Sovereign of Shadows", bossMistakesAllowed: 1, bossDmg: 100, maxLevel: 18 }
];

// --- EXTENSIBLE TRIVIA REPOSITORY WITH ELO & ERA TAXONOMY ---
const QUESTION_DATABASE = [
  // 90s Classics
  { id: "Q01", category: "90s Nostalgia", subtopic: "Slang", elo: 1050, tier: 1, prompt: "In 1990s slang, what did the phrase 'Talk to the hand' famously imply?", correct: "'Because the face ain't listening'", distractors: ["'I want a high five'", "'Let's make a deal'", "'Keep on talking'"] },
  { id: "Q02", category: "90s Nostalgia", subtopic: "Gaming", elo: 1100, tier: 1, prompt: "Which 1996 handheld virtual pet required players to feed, clean, and discipline an alien egg creature?", correct: "Tamagotchi", distractors: ["Furby", "Game Boy Pocket", "Giga Pet"] },
  { id: "Q03", category: "90s Nostalgia", subtopic: "Pop Culture", elo: 1150, tier: 2, prompt: "Which snack food was heavily promoted in the 90s with the slogan 'Betcha can't eat just one'?", correct: "Lay's Potato Chips", distractors: ["Pringles", "Doritos", "Cheetos"] },
  
  // 2000s Nostalgia
  { id: "Q04", category: "2000s Nostalgia", subtopic: "Tech & Media", elo: 1120, tier: 1, prompt: "Which portable MP3 device did Apple launch in late 2001 featuring a mechanical scroll wheel?", correct: "iPod", distractors: ["Zune", "Walkman MiniDisc", "Nomad Jukebox"] },
  { id: "Q05", category: "2000s Nostalgia", subtopic: "Slang", elo: 1140, tier: 2, prompt: "In early 2000s internet slang, what did 'FTW' universally stand for?", correct: "For The Win", distractors: ["Free The World", "Find The Way", "Feel The Wave"] },
  { id: "Q06", category: "2000s Nostalgia", subtopic: "Gaming", elo: 1200, tier: 2, prompt: "What wildly popular multiplayer life simulation game debuted on PC in February 2000 by Will Wright?", correct: "The Sims", distractors: ["SimCity 3000", "Second Life", "Spore"] },

  // Current / Internet Slang
  { id: "Q07", category: "Current Slang", subtopic: "Internet Culture", elo: 1180, tier: 1, prompt: "If someone in modern internet culture says you have 'unspoken rizz', what do you possess?", correct: "Effortless charisma and magnetic charm", distractors: ["Terrible dancing skills", "Bad luck with technology", "A loud and aggressive tone"] },
  { id: "Q08", category: "Current Slang", subtopic: "Modern Expressions", elo: 1220, tier: 2, prompt: "When someone says 'no cap' in modern conversation, what do they mean?", correct: "No lie / For real", distractors: ["No hat allowed", "Keep it quiet", "No limits"] },

  // Aptitude & Math Logic
  { id: "Q09", category: "Aptitude & Math", subtopic: "Number Sequences", elo: 1250, tier: 2, prompt: "What is the next number in this sequence: 2, 3, 5, 8, 13, __?", correct: "21", distractors: ["19", "20", "24"] },
  { id: "Q10", category: "Aptitude & Math", subtopic: "Logic Puzzles", elo: 1380, tier: 3, prompt: "If 5 machines take 5 minutes to make 5 widgets, how many minutes do 100 machines take to make 100 widgets?", correct: "5 minutes", distractors: ["100 minutes", "20 minutes", "1 minute"] },
  { id: "Q11", category: "Aptitude & Math", subtopic: "Spatial Reasoning", elo: 1420, tier: 3, prompt: "A clock shows 3:15. What is the angle between the hour and minute hands?", correct: "7.5 degrees", distractors: ["0 degrees", "12.5 degrees", "15 degrees"] },

  // General Knowledge & Science
  { id: "Q12", category: "General Knowledge", subtopic: "Astronomy", elo: 1040, tier: 1, prompt: "Which planet in our solar system has the most extensive and visible ring system?", correct: "Saturn", distractors: ["Mars", "Jupiter", "Neptune"] },
  { id: "Q13", category: "General Knowledge", subtopic: "Geography", elo: 1190, tier: 2, prompt: "What is the only sea on Earth that has no land borders?", correct: "Sargasso Sea", distractors: ["Caspian Sea", "Dead Sea", "Baltic Sea"] },
  { id: "Q14", category: "General Knowledge", subtopic: "History", elo: 1350, tier: 3, prompt: "Which ancient civilization developed cuneiform script around 3400 BCE?", correct: "Sumerians", distractors: ["Babylonians", "Phoenicians", "Egyptians"] },

  // Boss High-Tier Logic & Enigmas
  { id: "Q15", category: "Boss Enigmas", subtopic: "Mythology & Logic", elo: 1480, tier: 4, prompt: "In Greek mythology, who flew too close to the sun with wings constructed of feathers and wax?", correct: "Icarus", distractors: ["Daedalus", "Perseus", "Bellerophon"] },
  { id: "Q16", category: "Boss Enigmas", subtopic: "Ancient Lore", elo: 1520, tier: 4, prompt: "What riddle solver answered the Sphinx's riddle: 'What walks on four legs in the morning, two at noon, and three in the evening?'", correct: "Oedipus", distractors: ["Heracles", "Theseus", "Jason"] }
];

// --- GLOBAL GAME STATE ---
const state = {
  players: [],
  difficulty: "standard",
  currentScreen: "screen-lobby",
  biomeIndex: 0,
  currentNode: 0,
  maxNodes: 5,
  hp: 100,
  maxHp: 100,
  mp: 10,
  maxMp: 10,
  rerolls: 2,
  level: 1,
  xp: 0,
  xpToNext: 100,
  stats: { S: 1, P: 1, E: 1, C: 1, I: 1, A: 1, L: 1 },
  activeQuestion: null,
  eliminatedOptions: [],
  cutsceneStep: 0,
  questionTimer: null,
  timeLeft: 30,
  bossErrorsCurrentEncounter: 0,
  runStats: { questionsAnswered: 0, correctAnswers: 0, startTime: 0, nodesCleared: 0 },
  // Adaptive Learning: Category Performance Tracking
  categoryStats: {}, // { "90s Nostalgia": { answered: 3, correct: 1 } }
  seenQuestionIds: new Set()
};

// Scaling multipliers for team size
const PARTY_SCALING_MULTIPLIERS = { 1: 0.80, 2: 1.90, 3: 3.25, 4: 4.50 };

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  setupLobby();
  setupCutscene();
  setupGameplay();
  renderLeaderboard();
});

// --- LOBBY SYSTEM ---
function setupLobby() {
  const nameInput = document.getElementById("player-name-input");
  const addBtn = document.getElementById("btn-add-player");
  const startBtn = document.getElementById("btn-start-adventure");
  const diffSelect = document.getElementById("select-difficulty");

  diffSelect.addEventListener("change", (e) => {
    state.difficulty = e.target.value;
  });

  function addPlayer() {
    const name = nameInput.value.trim();
    if (name) {
      state.players.push(name);
      nameInput.value = "";
      renderRoster();
      startBtn.style.display = "inline-flex";
      updateScalingDesc();
      nameInput.focus();
    }
  }

  addBtn.addEventListener("click", addPlayer);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addPlayer();
  });

  startBtn.addEventListener("click", () => {
    if (state.players.length === 0) state.players.push("Adventurer");
    state.runStats.startTime = Date.now();
    recalculateStats();
    showScreen("screen-cutscene");
    startCutscene();
  });
}

function updateScalingDesc() {
  const count = Math.min(4, Math.max(1, state.players.length));
  const mult = PARTY_SCALING_MULTIPLIERS[count] || 4.50;
  document.getElementById("party-scaling-desc").innerText = 
    `${state.players.length} Player(s) (Party Scale: ${mult.toFixed(2)}x difficulty factor)`;
}

function renderRoster() {
  const roster = document.getElementById("player-roster");
  roster.innerHTML = state.players
    .map((name, i) => `<div class="player-tag">🎈 Player ${i + 1}: <strong>${escapeHtml(name)}</strong></div>`)
    .join("");
}

// --- CUTSCENE ENGINE (Noah & The Red Balloon) ---
const cutsceneDialogues = [
  "A quiet breeze stirs across the vast grasslands... Noah clutches his red balloon string tightly.",
  "Noah opens his eyes on the soft earth, staring up at the shifting clouds.",
  "He stands up, brushing the dirt from his knees, gazing towards the distant mountain peak.",
  "\"I need to find my way back home,\" Noah whispers."
];

function setupCutscene() {
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
  document.getElementById("cutscene-dialogue").innerText = cutsceneDialogues[state.cutsceneStep];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background: Grassland horizon
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0b1120");
  grad.addColorStop(0.6, "#142c22");
  grad.addColorStop(1, "#064e3b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Distant mountain outline with light tip
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(600, canvas.height);
  ctx.lineTo(760, 110);
  ctx.lineTo(920, canvas.height);
  ctx.fill();

  // Distant Beacon light at peak
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(760, 110, 6, 0, Math.PI * 2);
  ctx.fill();

  // Character drawing: Evolves with Noah's level
  drawNoahVisual(ctx, 420, state.cutsceneStep === 1 ? 270 : 230, state.cutsceneStep === 1);
}

// Visual art evolution (Sketch -> Filled -> Detailed -> Storybook)
function drawNoahVisual(ctx, x, y, isLyingDown) {
  const artTier = getVisualTier();
  ctx.lineWidth = artTier >= 3 ? 3 : 2;
  ctx.strokeStyle = artTier === 1 ? "rgba(226, 232, 240, 0.75)" : "#f8fafc";

  if (isLyingDown) {
    ctx.beginPath();
    ctx.arc(x - 20, y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 36, y + 10);
    ctx.stroke();
  } else {
    // Standing Noah
    ctx.beginPath();
    ctx.arc(x, y - 35, 16, 0, Math.PI * 2); // Head
    ctx.stroke();
    if (artTier >= 2) {
      ctx.fillStyle = "rgba(241, 245, 249, 0.2)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x, y - 19);
    ctx.lineTo(x, y + 25); // Body
    ctx.lineTo(x - 12, y + 62); // Left leg
    ctx.moveTo(x, y + 25);
    ctx.lineTo(x + 12, y + 62); // Right leg
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x + 22, y - 24); // Arm holding string
    ctx.stroke();
  }

  // Red Balloon
  const balloonX = x + 35;
  const balloonY = y - 90;

  // String
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 1.2;
  ctx.moveTo(isLyingDown ? x : x + 22, isLyingDown ? y : y - 24);
  ctx.quadraticCurveTo(balloonX - 12, balloonY + 35, balloonX, balloonY);
  ctx.stroke();

  // Balloon Body
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(balloonX, balloonY, 18, 23, 0, 0, Math.PI * 2);
  ctx.fill();

  // Balloon shine
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.beginPath();
  ctx.arc(balloonX - 5, balloonY - 7, 4, 0, Math.PI * 2);
  ctx.fill();
}

function getVisualTier() {
  if (state.level <= 4) return 1; // Charcoal Outline
  if (state.level <= 8) return 2; // Flat Inked Silhouette
  if (state.level <= 14) return 3; // Cel-Shaded Storybook
  return 4; // Luminous Master
}

function getVisualTierName() {
  const tiers = ["Faint Outline", "Inked Silhouette", "Cel-Shaded", "Luminous Storybook"];
  return `${tiers[getVisualTier() - 1]} (Lv ${state.level})`;
}

// --- BIOME MAP VISUALIZATION ---
function renderMap() {
  updateHUD();
  const currentBiome = BIOMES[state.biomeIndex];
  document.getElementById("map-header-title").innerText = 
    `Map ${currentBiome.index}/8: ${currentBiome.name} (${currentBiome.type.toUpperCase()})`;

  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dynamic Biome background color
  const biomeBgMap = {
    grassland: "#064e3b",
    desert: "#78350f",
    mountain: "#334155",
    summit: "#1e1b4b"
  };
  ctx.fillStyle = biomeBgMap[currentBiome.type] || "#064e3b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Summit Beacon beacon ray effect if on map 8
  if (currentBiome.type === "summit") {
    ctx.strokeStyle = "rgba(254, 240, 138, 0.25)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 40);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
  }

  const totalTiers = 5;
  const tierHeight = canvas.height / (totalTiers + 1);

  for (let tier = 0; tier < totalTiers; tier++) {
    const y = canvas.height - (tier + 1) * tierHeight;
    const isBoss = tier === totalTiers - 1;
    const nodeCount = isBoss ? 1 : 3;

    for (let col = 0; col < nodeCount; col++) {
      const x = isBoss ? canvas.width / 2 : (canvas.width / (nodeCount + 1)) * (col + 1);
      const isVisible = (tier - state.currentNode) <= state.stats.P;

      ctx.beginPath();
      ctx.arc(x, y, isBoss ? 24 : 17, 0, Math.PI * 2);

      if (tier === state.currentNode) {
        ctx.fillStyle = "#f59e0b"; // Selectable current node
      } else if (tier < state.currentNode) {
        ctx.fillStyle = "#16a34a"; // Cleared
      } else if (isVisible) {
        ctx.fillStyle = isBoss ? "#ef4444" : "#38bdf8";
      } else {
        ctx.fillStyle = "#1e293b"; // Hidden by Fog of War
      }
      ctx.fill();

      if (!isVisible && tier > state.currentNode) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "11px sans-serif";
        ctx.fillText("☁️ Fog", x - 15, y + 4);
      } else if (isBoss) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("BOSS", x - 14, y + 4);
      }
    }
  }
}

// Map Click: Advance into questions
document.getElementById("map-canvas").addEventListener("click", () => {
  const isBoss = state.currentNode >= state.maxNodes - 1;
  loadQuestion(isBoss);
});

// --- ADAPTIVE QUESTION SELECTION ENGINE ---
/*
   Adaptive Algorithm:
   1. Filters by Tier based on Difficulty mode.
   2. Weights categories where win rate is lowest (<40%) with a 3.0x bonus.
   3. Weights unseen questions with a 2.0x bonus.
*/
function selectAdaptiveQuestion(isBoss) {
  if (isBoss) {
    const bossPool = QUESTION_DATABASE.filter(q => q.category === "Boss Enigmas");
    return bossPool[Math.floor(Math.random() * bossPool.length)] || QUESTION_DATABASE[0];
  }

  // Filter pool based on difficulty mode
  let allowedTiers = [1, 2];
  if (state.difficulty === "chill") allowedTiers = [1, 2];
  if (state.difficulty === "standard") allowedTiers = [1, 2, 3];
  if (state.difficulty === "hard") allowedTiers = [2, 3];
  if (state.difficulty === "very_hard") allowedTiers = [3, 4];

  let candidatePool = QUESTION_DATABASE.filter(q => q.category !== "Boss Enigmas" && allowedTiers.includes(q.tier));
  if (candidatePool.length === 0) candidatePool = QUESTION_DATABASE.filter(q => q.category !== "Boss Enigmas");

  // Calculate draw weights
  const weightedList = [];
  candidatePool.forEach(q => {
    let weight = 1.0;

    // Boost unseen questions
    if (!state.seenQuestionIds.has(q.id)) {
      weight *= 2.0;
    }

    // Boost categories that the team has struggled on
    const catPerf = state.categoryStats[q.category];
    if (catPerf && catPerf.answered >= 2) {
      const winRate = catPerf.correct / catPerf.answered;
      if (winRate < 0.45) weight *= 3.0; // Targeted difficulty: reinforce weaknesses
    }

    for (let i = 0; i < Math.round(weight * 2); i++) {
      weightedList.push(q);
    }
  });

  const chosen = weightedList[Math.floor(Math.random() * weightedList.length)];
  state.seenQuestionIds.add(chosen.id);
  return chosen;
}

// --- QUESTION & TIMED GAMEPLAY ---
function loadQuestion(isBoss) {
  state.activeQuestion = selectAdaptiveQuestion(isBoss);
  state.eliminatedOptions = [];
  document.getElementById("hint-display").style.display = "none";
  document.getElementById("boss-warning").style.display = isBoss ? "inline" : "none";

  showScreen("screen-question");

  document.getElementById("q-category").innerText = `${state.activeQuestion.category} • ${state.activeQuestion.subtopic}`;
  document.getElementById("q-elo-label").innerText = `Elo: ${state.activeQuestion.elo} (Tier ${state.activeQuestion.tier})`;
  document.getElementById("q-prompt").innerText = state.activeQuestion.prompt;

  renderQuestionOptions();
  startTimer();
  updateHUD();
}

function startTimer() {
  clearInterval(state.questionTimer);
  // Timer base: 30s | Chill: +10s (40s) | Hard: -5s (25s) | Very Hard: -10s (20s)
  const timerSettings = { chill: 40, standard: 30, hard: 25, very_hard: 20 };
  const baseTime = timerSettings[state.difficulty] || 30;
  state.timeLeft = baseTime;

  const bar = document.getElementById("question-timer-bar");
  bar.style.width = "100%";

  state.questionTimer = setInterval(() => {
    state.timeLeft--;
    bar.style.width = `${Math.max(0, (state.timeLeft / baseTime) * 100)}%`;
    if (state.timeLeft <= 0) {
      clearInterval(state.questionTimer);
      handleAnswer(null, true); // Timeout count as incorrect
    }
  }, 1000);
}

function renderQuestionOptions() {
  const container = document.getElementById("q-options");
  container.innerHTML = "";
  const allChoices = [state.activeQuestion.correct, ...state.activeQuestion.distractors].sort();

  allChoices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = choice;
    if (state.eliminatedOptions.includes(choice)) btn.classList.add("eliminated");
    btn.addEventListener("click", () => {
      clearInterval(state.questionTimer);
      handleAnswer(choice, false);
    });
    container.appendChild(btn);
  });
}

function handleAnswer(selectedChoice, isTimeout) {
  state.runStats.questionsAnswered++;
  const isCorrect = !isTimeout && selectedChoice === state.activeQuestion.correct;
  const currentBiome = BIOMES[state.biomeIndex];

  // Track category statistics for adaptive selection
  if (!state.categoryStats[state.activeQuestion.category]) {
    state.categoryStats[state.activeQuestion.category] = { answered: 0, correct: 0 };
  }
  state.categoryStats[state.activeQuestion.category].answered++;
  if (isCorrect) state.categoryStats[state.activeQuestion.category].correct++;

  if (isCorrect) {
    state.runStats.correctAnswers++;
    // Mana Recovery
    const mpGain = state.stats.I >= 7 ? 3 : (state.stats.I >= 3 ? 2 : 1);
    state.mp = Math.min(state.maxMp, state.mp + mpGain);

    // EXP Gain
    const expGain = Math.round(45 * (1 + state.stats.S * 0.15));
    state.xp += expGain;

    alert(`Correct! 🎉\nRecovered ${mpGain} MP. Earned ${expGain} EXP.`);
    checkLevelUp();
  } else {
    // Damage calculation
    const damage = state.currentNode >= state.maxNodes - 1 ? currentBiome.bossDmg : 30;
    state.hp -= damage;
    const reason = isTimeout ? "Time expired!" : `The correct answer was: "${state.activeQuestion.correct}"`;
    alert(`Incorrect! ❌\n${reason}\nThe party took ${damage} damage.`);

    if (state.hp <= 0) {
      endRun(false);
      return;
    }
  }

  // Advance Node
  state.currentNode++;
  state.runStats.nodesCleared++;

  if (state.currentNode >= state.maxNodes) {
    // Biome Cleared
    state.biomeIndex++;
    state.currentNode = 0;
    state.rerolls = 2 * state.stats.C; // Reset rerolls per biome

    if (state.biomeIndex >= BIOMES.length) {
      endRun(true); // Reached the Beacon Summit!
    } else {
      alert(`🌟 Biome Cleared!\nAdvancing to Map ${state.biomeIndex + 1}: ${BIOMES[state.biomeIndex].name}`);
      showScreen("screen-map");
      renderMap();
    }
  } else {
    showScreen("screen-map");
    renderMap();
  }
}

// --- SKILLS & CONSUMABLES ---
function setupGameplay() {
  // Eliminate 1 (3 MP)
  document.getElementById("skill-eliminate").addEventListener("click", () => {
    if (state.mp >= 3) {
      const remaining = state.activeQuestion.distractors.filter(d => !state.eliminatedOptions.includes(d));
      if (remaining.length > 0) {
        state.mp -= 3;
        state.eliminatedOptions.push(remaining[0]);
        renderQuestionOptions();
        updateHUD();
      }
    }
  });

  // Clue / Hint (2 MP)
  document.getElementById("skill-hint").addEventListener("click", () => {
    if (state.mp >= 2) {
      state.mp -= 2;
      const hint = document.getElementById("hint-display");
      hint.style.display = "block";
      hint.innerText = `💡 Clue: Consider the context of ${state.activeQuestion.category} (${state.activeQuestion.subtopic}).`;
      updateHUD();
    }
  });

  // Charisma Reroll
  document.getElementById("skill-reroll").addEventListener("click", () => {
    if (state.rerolls > 0) {
      state.rerolls--;
      clearInterval(state.questionTimer);
      loadQuestion(state.currentNode >= state.maxNodes - 1);
    }
  });

  document.getElementById("btn-restart-run").addEventListener("click", () => {
    location.reload();
  });
}

// --- S.P.E.C.I.A.L. LEVEL UP PROGRESSION ---
function recalculateStats() {
  state.maxHp = 100 + (state.stats.E - 1) * 25;
  state.hp = state.maxHp;
  state.maxMp = 10 + (state.stats.I - 1) * 2;
  state.mp = state.maxMp;
  state.rerolls = 2 * state.stats.C;
}

function checkLevelUp() {
  if (state.xp >= state.xpToNext) {
    state.level++;
    state.xp -= state.xpToNext;
    state.xpToNext = Math.round(state.xpToNext * 1.35);
    showLevelUp();
  }
}

function showLevelUp() {
  showScreen("screen-levelup");
  const grid = document.getElementById("stat-allocation-grid");
  const statDefs = [
    { key: "S", name: "Strength", desc: "Expands confidence boost & EXP acceleration." },
    { key: "P", name: "Perception", desc: "Pierces Fog of War to see further ahead on map." },
    { key: "E", name: "Endurance", desc: "Increases party Maximum HP pool (+25 HP)." },
    { key: "C", name: "Charisma", desc: "Grants additional question rerolls each biome." },
    { key: "I", name: "Intelligence", desc: "Increases Mana Pool (+2 MP) and regen velocity." },
    { key: "A", name: "Agility", desc: "Boosts overall score speed multiplier." },
    { key: "L", name: "Luck", desc: "Increases chances for restorative node encounters." }
  ];

  grid.innerHTML = statDefs.map(s => `
    <div class="stat-card">
      <div>
        <strong>${s.name} (${s.key}): Lv ${state.stats[s.key]}</strong>
        <p style="font-size: 0.83rem; color: var(--text-dim); margin-top: 5px;">${s.desc}</p>
      </div>
      <button class="btn btn-secondary" style="margin-top: 10px; padding: 6px 10px; font-size: 0.88rem;" onclick="allocateStat('${s.key}')">+1 Upgrade</button>
    </div>
  `).join("");
}

window.allocateStat = function(statKey) {
  state.stats[statKey]++;
  recalculateStats();
  showScreen("screen-map");
  renderMap();
};

// --- HUD & SCREEN ROUTING ---
function updateHUD() {
  document.getElementById("hud").style.display = state.currentScreen === "screen-lobby" ? "none" : "flex";
  document.getElementById("hud-party-name").innerText = state.players.join(", ") || "Party";
  document.getElementById("hud-art-tier").innerText = getVisualTierName();
  document.getElementById("hud-hp-text").innerText = `${state.hp}/${state.maxHp}`;
  document.getElementById("hp-bar").style.width = `${Math.max(0, (state.hp / state.maxHp) * 100)}%`;
  document.getElementById("hud-mp-text").innerText = `${state.mp}/${state.maxMp}`;
  document.getElementById("mp-bar").style.width = `${Math.max(0, (state.mp / state.maxMp) * 100)}%`;
  document.getElementById("hud-biome-name").innerText = BIOMES[state.biomeIndex]?.name || "Summit";
  document.getElementById("hud-rerolls").innerText = state.rerolls;

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

// --- RUN COMPLETION & LOCAL LEADERBOARD ---
function endRun(isVictory) {
  clearInterval(state.questionTimer);
  showScreen("screen-leaderboard");

  const durationSec = Math.round((Date.now() - state.runStats.startTime) / 1000);
  const agilityMult = 1.0 + (state.stats.A * 0.08);
  const calculatedScore = Math.round((state.runStats.nodesCleared * 220 + state.runStats.correctAnswers * 140) * agilityMult);

  const summary = document.getElementById("run-summary-text");
  summary.innerHTML = isVictory
    ? `🎉 <strong>Noah Has Reached the Beacon Summit!</strong> With the red balloon in hand, Noah ascends into the glowing light. Home has been found.`
    : `💀 <strong>The Journey Concluded in the Mist.</strong> Noah's spirit was overwhelmed, but the memories of this run endure.`;

  const record = {
    party: state.players.join(" & ") || "Solo Adventurer",
    mode: state.difficulty.toUpperCase(),
    biomesCleared: state.biomeIndex,
    score: calculatedScore,
    accuracy: `${state.runStats.correctAnswers}/${state.runStats.questionsAnswered}`,
    time: `${durationSec}s`,
    date: new Date().toLocaleDateString()
  };

  const board = JSON.parse(localStorage.getItem("noah_leaderboard") || "[]");
  board.push(record);
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("noah_leaderboard", JSON.stringify(board.slice(0, 10)));

  renderLeaderboard();
}

function renderLeaderboard() {
  const container = document.getElementById("leaderboard-table-container");
  const board = JSON.parse(localStorage.getItem("noah_leaderboard") || "[]");

  if (board.length === 0) {
    container.innerHTML = `<p style="color: var(--text-dim); text-align: center;">No recorded runs yet. Ascend the mountain!</p>`;
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.92rem;">
      <thead>
        <tr style="border-bottom: 1px solid #475569; color: var(--accent-gold);">
          <th style="padding: 6px;">#</th>
          <th style="padding: 6px;">Party</th>
          <th style="padding: 6px;">Mode</th>
          <th style="padding: 6px;">Biomes</th>
          <th style="padding: 6px;">Score</th>
          <th style="padding: 6px;">Accuracy</th>
          <th style="padding: 6px;">Time</th>
        </tr>
      </thead>
      <tbody>
  `;

  board.forEach((r, i) => {
    html += `
      <tr style="border-bottom: 1px solid #1e293b;">
        <td style="padding: 6px;">${i + 1}</td>
        <td style="padding: 6px; font-weight: 600;">${escapeHtml(r.party)}</td>
        <td style="padding: 6px; font-size: 0.8rem; color: var(--accent-blue);">${r.mode}</td>
        <td style="padding: 6px;">${r.biomesCleared}/8</td>
        <td style="padding: 6px; color: var(--accent-gold); font-weight: 700;">${r.score}</td>
        <td style="padding: 6px;">${r.accuracy}</td>
        <td style="padding: 6px; color: var(--text-dim);">${r.time}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t] || t));
}
