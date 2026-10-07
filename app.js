const SAMPLE_QUESTIONS = [
    {
        id: 1,
        category: "history",
        question: "In ancient lore, which legendary artifact was forged by the elven smiths of Eregion under the sway of Annatar?",
        options: ["The One Ring", "The Rings of Power", "The Silmarils", "The Arkenstone"],
        answer: 1,
        explanation: "Annatar (Sauron in disguise) aided the Elven-smiths of Eregion in forging the Rings of Power, though the Three Rings were crafted by Celebrimbor alone in secret."
    },
    {
        id: 2,
        category: "science",
        question: "According to alchemical principles, what is the theoretical transmutation process of converting base metals into noble gold called?",
        options: ["Magnum Opus", "Chrysopoeia", "Philosophia", "Athanor"],
        answer: 1,
        explanation: "Chrysopoeia literally translates from Greek as 'gold-making', denoting the alchemical transmutation of base metals such as lead or copper into gold."
    },
    {
        id: 3,
        category: "arts",
        question: "Which mystical medieval musical mode is frequently associated with otherworldly mystery and Gregorian chant mysticism?",
        options: ["Ionian Mode", "Dorian Mode", "Locrian Mode", "Lydian Mode"],
        answer: 1,
        explanation: "The Dorian mode carries a haunting, contemplative quality deeply rooted in ancient ecclesiastical and modal folk traditions."
    },
    {
        id: 4,
        category: "history",
        question: "The great celestial observatory of Ulugh Beg was erected in the 15th century within which historic Silk Road bastion?",
        options: ["Baghdad", "Samarkand", "Cairo", "Constantinople"],
        answer: 1,
        explanation: "Ulugh Beg built his monumental astronomical observatory in Samarkand around 1420, producing tables of stellar positions of unprecedented accuracy."
    },
    {
        id: 5,
        category: "science",
        question: "In quantum mechanics and arcane analogy, what principle states that certain pairs of physical properties cannot be simultaneously known with precision?",
        options: ["Entanglement Principle", "Uncertainty Principle", "Superposition Theorem", "Wave-Particle Duality"],
        answer: 1,
        explanation: "Heisenberg's Uncertainty Principle establishes the fundamental limit to the precision with which certain complementary variables (like position and momentum) can be known."
    },
    {
        id: 6,
        category: "arts",
        question: "What ancient illuminated manuscript, crafted in Ireland around 800 AD, is renowned for its intricate Celtic knotwork and gospel texts?",
        options: ["Book of Kells", "Lindisfarne Gospels", "Codex Aureus", "Ashburnham Pentateuch"],
        answer: 0,
        explanation: "The Book of Kells is a masterwork of western calligraphy and insular art, created by Celtic monks around 800 AD."
    },
    {
        id: 7,
        category: "history",
        question: "Which legendary Greek mathematician and inventor purportedly defended Syracuse using burning mirrors and claw-like siege engines?",
        options: ["Pythagoras", "Archimedes", "Euclid", "Hero of Alexandria"],
        answer: 1,
        explanation: "Archimedes designed brilliant mechanical defenses during the Siege of Syracuse, including compound pulleys and massive claw cranes."
    },
    {
        id: 8,
        category: "science",
        question: "What stellar phenomenon represents the dense core left behind after a massive star undergoes gravitational collapse and supernova?",
        options: ["Red Giant", "Neutron Star", "White Dwarf", "Quasar"],
        answer: 1,
        explanation: "When a massive star collapses, its protons and electrons combine to form neutrons, leaving behind an incredibly dense neutron star."
    },
    {
        id: 9,
        category: "arts",
        question: "In architectural history, what soaring vertical supports and external arched masonry allowed Gothic cathedrals to reach unprecedented heights?",
        options: ["Flying Buttresses", "Doric Columns", "Coffered Domes", "Load-bearing Lintels"],
        answer: 0,
        explanation: "Flying buttresses transferred the outward thrust of high vaulted ceilings away from the walls, permitting expansive stained glass windows."
    },
    {
        id: 10,
        category: "history",
        question: "The legendary library containing the accumulated scrolls of the ancient world was famously situated in which Mediterranean metropolis?",
        options: ["Rome", "Alexandria", "Athens", "Babylon"],
        answer: 1,
        explanation: "The Great Library of Alexandria was the premier center of learning and scholarship in the Hellenistic world."
    }
];

class TriviaApp {
    constructor() {
        this.questions = [...SAMPLE_QUESTIONS];
        this.currentIndex = 0;
        this.score = 0;
        this.elo = parseInt(localStorage.getItem('arcane_elo')) || 1200;
        this.selectedCategory = 'all';
        this.gameMode = 'standard';
        this.activeQuestions = [];
        this.isAnswered = false;

        this.initDOM();
        this.bindEvents();
        this.updateHUD();
    }

    initDOM() {
        this.screens = {
            start: document.getElementById('start-screen'),
            quiz: document.getElementById('quiz-screen'),
            results: document.getElementById('results-screen')
        };
        this.startBtn = document.getElementById('start-btn');
        this.categorySelect = document.getElementById('category-select');
        this.modeSelect = document.getElementById('mode-select');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.explanationBox = document.getElementById('explanation-box');
        this.explanationText = document.getElementById('explanation-text');
        this.nextBtn = document.getElementById('next-btn');
        this.progressIndicator = document.getElementById('progress-indicator');
        this.eloBadge = document.getElementById('elo-badge');
        this.finalScoreSummary = document.getElementById('final-score-summary');
        this.statCorrect = document.getElementById('stat-correct');
        this.statElo = document.getElementById('stat-elo');
        this.restartBtn = document.getElementById('restart-btn');
        this.exportBtn = document.getElementById('export-btn');
        this.resetDataBtn = document.getElementById('reset-data');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.restartBtn.addEventListener('click', () => this.showScreen('start'));
        this.exportBtn.addEventListener('click', () => this.exportProgress());
        this.resetDataBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you wish to reset your stored arcane progress?")) {
                localStorage.clear();
                this.elo = 1200;
                this.updateHUD();
                alert("Progress reset to default.");
            }
        });
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    updateHUD() {
        this.eloBadge.textContent = `ELO: ${this.elo}`;
    }

    startGame() {
        this.selectedCategory = this.categorySelect.value;
        this.gameMode = this.modeSelect.value;

        if (this.selectedCategory === 'all') {
            this.activeQuestions = [...this.questions];
        } else {
            this.activeQuestions = this.questions.filter(q => q.category === this.selectedCategory);
        }

        this.activeQuestions.sort(() => Math.random() - 0.5);

        if (this.gameMode === 'standard' && this.activeQuestions.length > 10) {
            this.activeQuestions = this.activeQuestions.slice(0, 10);
        }

        if (this.activeQuestions.length === 0) {
            alert("No questions found for this realm. Defaulting to all realms.");
            this.activeQuestions = [...this.questions];
        }

        this.currentIndex = 0;
        this.score = 0;
        this.showScreen('quiz');
        this.loadQuestion();
    }

    loadQuestion() {
        this.isAnswered = false;
        this.explanationBox.classList.add('hidden');
        this.optionsContainer.innerHTML = '';

        const q = this.activeQuestions[this.currentIndex];
        const total = this.activeQuestions.length;

        this.progressIndicator.textContent = `Trial ${this.currentIndex + 1} of ${total}`;
        this.questionText.textContent = q.question;

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
            btn.addEventListener('click', () => this.handleAnswer(idx, q.answer, btn));
            this.optionsContainer.appendChild(btn);
        });
    }

    handleAnswer(selectedIndex, correctIndex, selectedBtn) {
        if (this.isAnswered) return;
        this.isAnswered = true;

        const allButtons = this.optionsContainer.querySelectorAll('.option-btn');
        const q = this.activeQuestions[this.currentIndex];

        allButtons.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === correctIndex) {
                btn.classList.add('correct');
            } else if (idx === selectedIndex) {
                btn.classList.add('incorrect');
            }
        });

        const isCorrect = (selectedIndex === correctIndex);
        if (isCorrect) {
            this.score++;
            this.elo += 15;
        } else {
            this.elo = Math.max(800, this.elo - 10);
        }

        localStorage.setItem('arcane_elo', this.elo);
        this.updateHUD();

        this.explanationText.textContent = q.explanation;
        this.explanationBox.classList.remove('hidden');
    }

    nextQuestion() {
        this.currentIndex++;
        if (this.currentIndex < this.activeQuestions.length) {
            this.loadQuestion();
        } else {
            this.endGame();
        }
    }

    endGame() {
        this.showScreen('results');
        const total = this.activeQuestions.length;
        this.statCorrect.textContent = `${this.score}/${total}`;
        this.statElo.textContent = this.elo;

        let rankTitle = "Novice Adept";
        if (this.elo >= 1300) rankTitle = "Master Loremaster";
        else if (this.elo >= 1250) rankTitle = "Arcane Scholar";

        this.finalScoreSummary.textContent = `Trial completed with distinction. Your standing is rated as: ${rankTitle}.`;
    }

    exportProgress() {
        const data = {
            elo: this.elo,
            timestamp: new Date().toISOString(),
            mode: this.gameMode
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'arcane_codex_progress.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.triviaApp = new TriviaApp();
});