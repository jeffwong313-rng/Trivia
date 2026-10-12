// Screens and interaction. One shared screen (a laptop or a TV); phones can
// join as controllers. The whole party plays as one.
import { TITLE, MODES, PARTIES, CONFIDENCE, STATS, SKILLS, MAPS, NOAH_TIERS, TIERS, TOPIC_GROUPS, TOPICS, ALL_TOPIC_IDS, LIVE_PICKS, statFx, partyById } from './config.js';
import { SVG_DEFS, drawNoah, drawBoss, drawShape, drawMap, drawVisual, drawSwatch, drawStoryScene, nodeXY, noahTier } from './art.js';
import { Sound, Settings, setBossTheme } from './audio.js';
import { Feedback, FLAG_REASONS, reasonLabel } from './feedback.js';
import { REMOVED } from './removed.js';
import { QuestionSource, answerText, learnUrl } from './questions.js';
import { explainUrl, setExplainUrl, fetchExplain } from './explain.js';
import { Game } from './game.js';
import { Room, joinUrl } from './remote.js';
import { startPhone } from './phone.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
document.getElementById('defs').innerHTML = SVG_DEFS;
const params = new URLSearchParams(location.search);

if (params.get('join')) startPhone(params.get('join').toUpperCase());
else startHost();

function startHost() {
const app = $('#app');
const source = new QuestionSource();
const game = new Game(source);
const savedSetup = store.get('noah_setup', {});
const ui = {
  sels: [], result: null, kbd: false, lastMapScroll: null,
  setup: { size: savedSetup.size || 1, mode: savedSetup.mode || 'standard', names: ['', '', '', '', '', '', '', ''], party: savedSetup.party || '',
    topics: new Set((savedSetup.topics || ALL_TOPIC_IDS).filter((t) => TOPICS[t])) },
  room: null, votes: new Map(), voteKey: null, revealed: LIVE_PICKS, forced: false, rv: 0,
};
if (!ui.setup.topics.size) ui.setup.topics = new Set(ALL_TOPIC_IDS);
const saveSetup = () => store.set('noah_setup', { size: ui.setup.size, mode: ui.setup.mode, party: ui.setup.party, topics: [...ui.setup.topics] });
source.setTopics([...ui.setup.topics]);
Sound.enableMusic();
// Soft tap sound on every button / path (the lock-in button plays right/wrong instead)
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('button, .node.selectable');
  if (b && !b.disabled && !b.matches('[data-act=lock]')) Sound.click();
}, true);

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
const letter = (i) => 'ABCD'[i];

// ── Title ─────────────────────────────────────────────────────
function showTitle() {
  setBossTheme(false);
  const save = Game.hasSave();
  app.innerHTML = `
  <div class="screen center">
    <div class="title-wrap">
      <div class="title-noah">${drawNoah(1, { size: 170 })}</div>
      <h1 class="title">No<span class="tap-a">a</span>h<span class="colon">:</span> W<span class="tap-a">a</span>y Home</h1>
      ${source.testMode ? '<div class="chip red test-badge">TEST MODE · every question is a placeholder</div>' : ''}
      <p class="tagline">A lost boy, barely a sketch, holding a red balloon. Answer together, and draw him home.</p>
    </div>
    <div class="stack" style="margin-top:22px">
      ${save ? `<button class="btn primary" data-act="continue">Continue the journey <span class="small">(${esc(save.partyName)} · ${esc(MAPS[save.mapIndex].name)})</span></button>` : ''}
      <button class="btn ${save ? '' : 'primary'}" data-act="new">Begin a new journey</button>
      <button class="btn" data-act="phones">📺 Play on a TV with phones${ui.room ? ` <span class="small">(${ui.room.players.filter((p) => p.connected).length} joined)</span>` : ''}</button>
      <button class="btn small ghost link" data-act="joincode">📱 Join a game on this phone</button>
      <div class="row">
        <button class="btn small ghost link" data-act="how">How to play</button>
        <button class="btn small ghost link" data-act="board">🏆 Leaderboard</button>
        <button class="btn small ghost link" data-act="settings">Settings</button>
        <button class="btn small ghost link" data-act="feedback">Flagged questions${Feedback.pending() ? ` (${Feedback.pending()})` : ''}</button>
      </div>
    </div>
  </div>`;
  app.onclick = (e) => {
    if (e.target.closest('.tap-a')) return tapA();
    ui.taps = 0;
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'new') showSetup();
    if (a === 'continue') { game.load(); renderGame(); }
    if (a === 'phones') showLobby();
    if (a === 'joincode') showJoinCode();
    if (a === 'how') showHow();
    if (a === 'board') showBoard();
    if (a === 'settings') showSettings();
    if (a === 'feedback') showFeedback();
  };
  focusFirst();
}
function showJoinCode() {
  app.innerHTML = `
  <div class="screen center">
    <h2 class="page-title">Join a game</h2>
    <p class="muted">Type the 4-letter code shown on the big screen.</p>
    <div class="join-code-box" style="margin-top:14px"><input type="text" id="jcode" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD"><button class="btn primary" data-act="go">Join</button></div>
    <button class="btn small ghost link" style="margin-top:20px" data-act="back">Back</button>
  </div>`;
  const go = () => {
    const code = $('#jcode').value.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (code.length !== 4) return toast('The code has 4 letters.');
    const peer = params.get('peer');
    location.href = `${location.pathname}?join=${code}${peer ? '&peer=' + encodeURIComponent(peer) : ''}`;
  };
  $('#jcode').focus();
  $('#jcode').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  app.onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'go') go();
    if (a === 'back') showTitle();
  };
}
// Secret: click an "a" in the title 10 times in a row to toggle test mode.
function tapA() {
  const now = Date.now();
  ui.taps = now - (ui.lastTap || 0) < 1500 ? (ui.taps || 0) + 1 : 1;
  ui.lastTap = now;
  if (ui.taps >= 10) {
    ui.taps = 0;
    source.testMode = !source.testMode;
    showTitle();
    toast(source.testMode ? 'Test mode on: every question is a placeholder.' : 'Test mode off.');
  }
}

function showHow() {
  app.innerHTML = `
  <div class="screen">
    <h2 class="page-title">How to play</h2>
    <div class="sk howto">
      <ul>
        <li><b>You're one team.</b> Everyone shares one Noah, one HP bar, and one mana bar. Talk it over, then lock in one answer together.</li>
        <li><b>More friends = harder road.</b> Questions get tougher and mistakes hurt more as the party grows: Solo, Partner, Trio, Quartet, or Party (5+).</li>
        <li><b>Answer and confidence in one tap.</b> Each answer has three parts: tap the <i>left</i> if you're not sure, the <i>middle</i> if you're sure, the <i>right</i> if you're definitely sure. Then press <b>Lock in</b>. More sure = more EXP if right, more damage if wrong.</li>
        <li><b>No timer.</b> Take your time. Answering quickly earns a small score bonus, which fades away at 2 minutes.</li>
        <li><b>Pick a path.</b> Usually three paths at every step. <i>Perception</i> clears the fog and shows each path's topic, then its difficulty.</li>
        <li><b>Level up.</b> One stat point per level. Every 4 levels, learn or upgrade a skill. Noah's drawing fills in as he grows.</li>
        <li><b>⚑ Flag question</b> if it's too niche, incomplete, or wrong. It's removed from the game, saved under <i>Flagged questions</i> on the title screen for review, and you get a fresh question on the same topic, free.</li>
        <li><b>Bosses</b> wait at the top of each map: 5 questions. Save your mana for them.</li>
        <li><b>Phones + TV:</b> on the big screen choose "Play on a TV with phones", then scan the code (or tap "Join a game on this phone" and type it). Everyone reads the question and taps an answer; picks show live on the TV. When everyone is in, anyone can choose an answer for the team and lock it in from their phone. Phones can also press every button on the big screen, so a TV with no mouse works fine.</li>
        <li><b>Keyboard / TV remote:</b> arrow keys move, Enter selects. Keys 1–4 pick an answer (press again to change how sure).</li>
      </ul>
    </div>
    <button class="btn" style="margin-top:20px" data-act="back">Back</button>
  </div>`;
  app.onclick = (e) => { if (e.target.closest('[data-act=back]')) backFromMenu(); };
  focusFirst();
}

const modeIdOf = (r) => r.modeId || Object.entries(MODES).find(([, m]) => m.name === r.mode)?.[0] || 'standard';
function showBoard(highlight) {
  const f = (ui.boardFilter ||= { mode: 'all', size: 'all' });
  const all = Game.leaderboard();
  const rows = all.filter((r) => (f.mode === 'all' || modeIdOf(r) === f.mode) && (f.size === 'all' || String(r.size) === f.size));
  const mins = (ms) => (ms ? (ms < 90000 ? '<2 min' : `${Math.round(ms / 60000)} min`) : '–');
  const chip = (kind, val, label) => `<button class="btn small ${f[kind] === val ? 'primary' : ''}" data-f-${kind}="${val}" data-rlabel="${label}${f[kind] === val ? ' (on)' : ''}">${label}</button>`;
  const line = (r) => {
    const st = r.stats ? Object.keys(STATS).map((k) => `${k}${r.stats[k] ?? 1}`).join(' ') : '';
    return `${r.players?.filter(Boolean).length ? esc(r.players.filter(Boolean).join(', ')) : ''}${st ? `${r.players?.filter(Boolean).length ? ' · ' : ''}${st}` : ''}`;
  };
  app.innerHTML = `
  <div class="screen">
    <h2 class="page-title">🏆 Leaderboard</h2>
    <p class="muted" style="margin-bottom:10px">Every journey that ends is saved here with its squad, players, score, difficulty and stats. Ranked by score (how far you got, plus a little for speed). Kept on this device.</p>
    ${all.length ? `<div class="lb-filters" data-rsection="Filter">
      <div class="row small">${chip('mode', 'all', 'Any difficulty')}${Object.entries(MODES).map(([k, m]) => chip('mode', k, m.name)).join('')}</div>
      <div class="row small">${chip('size', 'all', 'Any size')}${PARTIES.map((p) => chip('size', String(p.id), p.name)).join('')}</div>
    </div>` : ''}
    ${rows.length ? `<div class="sk lb-wrap"><table class="lb">
      <tr><th>#</th><th>Squad</th><th>Size</th><th>Difficulty</th><th>Reached</th><th>Lv</th><th>Right</th><th>Time</th><th>Score</th></tr>
      ${rows.map((r, i) => `<tr class="${highlight && (r.id ? r.id === highlight.id : r.date === highlight.date) ? 'me' : ''}"><td>${i + 1}</td><td><b>${esc(r.party)}</b><div class="small muted">${line(r)}</div><div class="small muted">${new Date(r.date).toLocaleDateString()}</div></td><td>${esc(r.sizeName || partyById(r.size).name)}</td><td>${esc(r.mode)}</td><td>${r.outcome === 'victory' ? 'Home! ✦' : esc(r.reached)}<div class="small muted">${r.maps} map${r.maps === 1 ? '' : 's'} cleared</div></td><td>${r.level}</td><td>${r.correct}${r.wrong != null ? `<div class="small muted">${Math.round((100 * r.correct) / Math.max(1, r.correct + r.wrong))}%</div>` : ''}</td><td>${mins(r.activeMs)}</td><td><b>${r.score.toLocaleString()}</b></td></tr>`).join('')}
    </table></div>`
      : all.length ? '<p class="note">Nothing matches those filters.</p>' : '<p class="note">No journeys yet. When a journey ends (Noah gets home, or fades), the squad and score land here.</p>'}
    <div class="row" style="margin-top:18px">
      <button class="btn" data-act="back">Back</button>
      ${all.length ? '<button class="btn small ghost link no-remote" data-act="export">Download a copy</button><button class="btn small ghost link no-remote" data-act="copyboard">Copy as text</button>' : ''}
      <button class="btn small ghost link no-remote" data-act="import">Add scores from a copy</button>
    </div>
    <div id="import-box" hidden class="note" style="margin-top:10px;width:100%;max-width:640px"><b>Paste a copy of a leaderboard</b> (from “Copy as text” or “Download a copy”). Scores already here are skipped.
      <textarea id="import-text" rows="5" style="width:100%;margin-top:6px"></textarea>
      <div class="row" style="margin-top:6px"><button class="btn small primary" data-act="doimport">Add them</button></div></div>
  </div>`;
  app.oninput = null;
  app.onclick = async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.fMode) { f.mode = t.dataset.fMode; return showBoard(highlight); }
    if (t.dataset.fSize) { f.size = t.dataset.fSize; return showBoard(highlight); }
    const a = t.dataset.act;
    if (a === 'back') backFromMenu();
    else if (a === 'export') {
      const blob = new Blob([JSON.stringify(Game.leaderboard(), null, 2)], { type: 'application/json' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'noah-leaderboard.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 2000);
    } else if (a === 'copyboard') {
      try { await navigator.clipboard.writeText(JSON.stringify(Game.leaderboard(), null, 2)); toast('Copied. Paste it somewhere safe.'); } catch { toast('Couldn\'t copy. Use “Download a copy” instead.'); }
    } else if (a === 'import') { $('#import-box').hidden = false; $('#import-text').focus(); }
    else if (a === 'doimport') {
      const n = Game.importBoard($('#import-text').value.trim());
      if (n < 0) return toast('That doesn\'t look like a leaderboard copy.');
      toast(n ? `Added ${n} score${n === 1 ? '' : 's'}.` : 'Nothing new to add.');
      showBoard(highlight);
    }
  };
  focusFirst('[data-act=back]');
}

const backFromMenu = () => (game.s && !['victory', 'defeat'].includes(game.s.phase) && app.dataset.from === 'game' ? renderGame() : showTitle());

// ── Settings ──────────────────────────────────────────────────
function showSettings() {
  const draw = () => {
    const st = Settings.get();
    const toggle = (key, title, sub, invert = false) => {
      const on = invert ? !st[key] : !!st[key];
      return `<button class="choice setting ${on ? 'on' : ''}" data-toggle="${key}" data-invert="${invert ? 1 : ''}" aria-pressed="${on}" data-rlabel="${title}: ${on ? 'on' : 'off'}">
        <div class="big">${on ? '✓ ' : ''}${title}</div><div class="sub">${sub}</div></button>`;
    };
    app.innerHTML = `
    <div class="screen">
      <div class="setup">
        <h2>Settings</h2>
        <section data-rsection="Story & tutorials">
          <h3>Story & tutorials</h3>
          <div class="choice-grid">
            ${toggle('skipTutorial', 'Tutorials', 'Show the short stats tutorial at the start of each journey.', true)}
            ${toggle('skipStory', 'Opening story', 'Show Noah waking up in the field before each journey.', true)}
          </div>
        </section>
        <section data-rsection="Sound">
          <h3>Sound</h3>
          <div class="choice-grid">
            ${toggle('music', 'Piano music', 'A slow, quiet piano theme in the background.')}
            ${toggle('sfx', 'Sound effects', 'Soft taps, and gentle chimes for right and wrong answers.')}
          </div>
          <label class="vol-row"><span>Volume</span>
            <input type="range" id="vol" min="0" max="100" step="5" value="${Math.round(st.volume * 100)}">
            <span id="volnum">${Math.round(st.volume * 100)}%</span></label>
          <div class="row small" style="margin-top:8px"><button class="btn small ghost link" data-vol="-10" data-rlabel="Volume down">− Quieter</button><button class="btn small ghost link" data-vol="10" data-rlabel="Volume up">+ Louder</button></div>
        </section>
        <section data-rsection="Auto explanations">
          <h3>Auto explanations</h3>
          <p class="small muted">Optional. Paste your explanation Worker's address to get a short "why" after each answer (see worker/README.md). Needs internet.</p>
          <input type="text" id="explain-url" placeholder="https://noah-explain.yourname.workers.dev" value="${esc(explainUrl())}" autocomplete="off" style="width:100%;max-width:520px">
        </section>
        <div class="row" style="margin-top:22px"><button class="btn primary" data-act="back">Done</button></div>
      </div>
    </div>`;
    $('#explain-url').onchange = (e) => setExplainUrl(e.target.value);
    $('#vol').oninput = (e) => { Settings.set({ volume: +e.target.value / 100 }); $('#volnum').textContent = `${e.target.value}%`; };
    $('#vol').onchange = () => Sound.click();
  };
  draw();
  app.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.toggle) { const k = t.dataset.toggle; Settings.set({ [k]: !Settings.get()[k] }); draw(); if (ui.kbd) $(`[data-toggle="${k}"]`)?.focus(); }
    else if (t.dataset.vol) { const v = Math.max(0, Math.min(1, Settings.get().volume + +t.dataset.vol / 100)); Settings.set({ volume: Math.round(v * 100) / 100 }); draw(); }
    else if (t.dataset.act === 'back') backFromMenu();
  };
  focusFirst('.choice');
}

// ── Flagged questions: review later, then remove from the bank ──
function showFeedback() {
  const draw = () => {
    const list = Feedback.all();
    const removed = list.filter((f) => f.status === 'removed');
    const fixed = (f) => !(f.source === 'gen' && !/^(RID|EMO)-/.test(f.id));   // generated puzzles are new every time
    const card = (f) => `
      <div class="sk fb-card ${f.status}">
        <div class="fb-head"><span class="chip red">${esc(reasonLabel(f.reason))}</span>
          <span class="small muted">${esc(f.topicName || f.topic)} · ${'★'.repeat(f.tier || 1)} · ${new Date(f.date).toLocaleDateString()} · <code>${esc(f.id)}</code></span>
          ${f.status === 'removed' ? '<span class="chip">Deleted from bank</span>' : ''}</div>
        <div class="fb-q">${esc(f.prompt)}</div>
        <div class="small">${f.answers.map((a) => (a === f.correct ? `<b>✓ ${esc(a)}</b>` : esc(a))).join(' · ')}</div>
        ${f.note ? `<div class="fb-note">“${esc(f.note)}”</div>` : ''}
        <div class="row fb-actions">
          ${!fixed(f) ? `<span class="small muted">A generated puzzle (made fresh each time), so there's nothing to delete — this is a note about that puzzle type.</span><button class="btn small" data-restore="${esc(f.id)}">Dismiss</button>`
            : `${f.status === 'pending' ? `<button class="btn small red" data-del="${esc(f.id)}" data-rlabel="Delete from bank: ${esc(f.prompt.slice(0, 40))}">Delete from bank</button>` : `<button class="btn small" data-undo="${esc(f.id)}">Undo delete</button>`}
          <button class="btn small ghost link" data-restore="${esc(f.id)}" data-rlabel="Restore: ${esc(f.prompt.slice(0, 40))}">Keep it (put back in the game)</button>`}
        </div>
      </div>`;
    app.innerHTML = `
    <div class="screen">
      <div class="setup feedback">
        <h2>Flagged questions</h2>
        <p class="center-text muted">Questions players flagged during games on this device. Flagged questions are already out of the game here. Review them: <b>Delete from bank</b> if you agree, or <b>Keep it</b> to put it back.</p>
        ${removed.length ? `<div class="note fb-export">
          <b>${removed.length} marked for deletion.</b> To remove them for everyone, copy the list and paste it over <code>js/removed.js</code> on GitHub.
          <div class="row" style="margin-top:8px;justify-content:flex-start"><button class="btn small primary" data-act="copy">Copy removal list</button><button class="btn small" data-act="download">Download all feedback</button></div>
          <textarea id="removed-out" readonly rows="4" hidden></textarea>
        </div>` : ''}
        ${list.length ? list.map(card).join('') : '<p class="note">Nothing flagged yet. During a question, tap ⚑ Flag question.</p>'}
        <div class="row" style="margin-top:22px"><button class="btn" data-act="back">Back</button></div>
      </div>
    </div>`;
  };
  const removalFile = () => {
    const ids = [...new Set([...REMOVED, ...Feedback.all().filter((f) => f.status === 'removed' && !(f.source === 'gen' && !/^(RID|EMO)-/.test(f.id))).map((f) => f.id)])];
    return `// Questions removed from the game for everyone, after reviewing flags.\n// In the game: title screen → Flagged questions → "Delete from bank" on each\n// one you agree with → "Copy removal list", then paste the result over this\n// whole file on GitHub. IDs are stable, so nothing else needs editing.\nexport const REMOVED = [\n${ids.map((id) => `  ${JSON.stringify(id)},`).join('\n')}\n];\n`;
  };
  draw();
  app.onclick = async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.del) { Feedback.setStatus(t.dataset.del, 'removed'); draw(); }
    else if (t.dataset.undo) { Feedback.setStatus(t.dataset.undo, 'pending'); draw(); }
    else if (t.dataset.restore) { source.unblock(t.dataset.restore); Feedback.remove(t.dataset.restore); toast('Back in the game.'); draw(); }
    else if (t.dataset.act === 'copy') {
      const text = removalFile();
      const out = $('#removed-out'); out.hidden = false; out.value = text; out.select();
      try { await navigator.clipboard.writeText(text); toast('Copied! Paste it over js/removed.js on GitHub.'); } catch { toast('Select the text below and copy it.'); }
    } else if (t.dataset.act === 'download') {
      const blob = new Blob([JSON.stringify(Feedback.all(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'noah-flagged-questions.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } else if (t.dataset.act === 'back') showTitle();
  };
  focusFirst();
}

// ── Opening story: white, then Noah asleep in the grass ───────
function showStory(done) {
  if (Settings.get().skipStory) return done();
  app.dataset.from = '';
  app.innerHTML = `
  <div class="story" data-screen="story">
    ${drawStoryScene()}
    <div class="story-white"></div>
    <div class="story-text">
      <p class="l1">“Where am I?…”</p>
      <p class="l2">“I guess I need to find my way home…”</p>
    </div>
    <button class="btn small ghost story-skip" data-act="skip" data-rlabel="Skip the story">Skip ➜</button>
    <div class="story-go"><button class="btn primary" data-act="go" data-rlabel="Begin the journey">Begin ➜</button></div>
  </div>`;
  let finished = false;
  const finish = () => { if (finished) return; finished = true; app.onclick = null; done(); };
  app.onclick = (e) => { if (e.target.closest('[data-act=skip], [data-act=go]')) finish(); };
  focusFirst('[data-act=skip]');
}
function startJourney() {
  ui.lastMapScroll = null;
  showStory(() => {
    ui.tutorialPage = Settings.get().skipTutorial ? null : 0;
    renderGame();
  });
}

// ── Phones: lobby with a QR code ───────────────────────────────
async function ensureRoom() {
  if (ui.room) return ui.room;
  ui.room = new Room({
    onPlayers: () => { refreshPlayerBits(); syncRemote(); },
    onVote: (p, m) => onVote(p, m),
    onAction: (p, m) => onRemoteAction(p, m),
    onTeam: (p, m) => onTeam(p, m),
    onSquad: (p, m) => onSquad(m),
    onError: (msg) => toast(msg),
  });
  try { await ui.room.open(); } catch (e) { toast('Couldn\'t open a room for phones. Check the internet connection.'); ui.room = null; }
  return ui.room;
}
async function showLobby() {
  app.innerHTML = `<div class="screen center"><h2 class="page-title">Opening a room…</h2><p class="muted">Getting a code for phones to join.</p></div>`;
  const room = await ensureRoom();
  if (!room) return showTitle();
  const save = Game.hasSave();
  const url = joinUrl(room.code);
  app.innerHTML = `
  <div class="screen lobby" data-screen="lobby">
    <h2 class="page-title">Join on your phone</h2>
    <div class="lobby-grid">
      <div class="sk qr-card">
        <div class="qr">${room.qrSvg(url)}</div>
        <div class="code-label">or open the game on a phone, tap “Join a game”, and enter</div>
        <div class="room-code">${room.code}</div>
        <div class="small muted url">${esc(url)}</div>
      </div>
      <div class="sk lobby-players">
        <h3>Who's here</h3>
        <ul id="lobby-list"></ul>
        <p class="small muted">Each phone shows the question so everyone can read it and pick privately. Picks are revealed together, then you discuss and lock in a team answer. Phones can also press every button on this screen.</p>
      </div>
    </div>
    <div class="row" style="margin-top:20px">
      <button class="btn" data-act="back">Back</button>
      ${save ? `<button class="btn" data-act="continue">Continue the journey</button>` : ''}
      <button class="btn primary" data-act="new">Begin a new journey</button>
    </div>
  </div>`;
  refreshPlayerBits();
  app.onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'back') showTitle();
    if (a === 'new') showSetup();
    if (a === 'continue') { game.load(); renderGame(); }
  };
  focusFirst();
}
function refreshPlayerBits() {
  const list = $('#lobby-list');
  const ps = ui.room ? ui.room.players : [];
  if (list) list.innerHTML = ps.length ? ps.map((p) => `<li><span class="pdot" style="background:${p.color}"></span>${esc(p.name)} ${p.connected ? '' : '<span class="small muted">(reconnecting…)</span>'}</li>`).join('') : '<li class="muted">Nobody yet. Scan the code!</li>';
  const chip = $('#phone-chip');
  if (chip && ui.room) chip.innerHTML = `📱 ${ui.room.code} · ${ps.filter((p) => p.connected).length}`;
  const vb = $('#votebar');
  if (vb) vb.outerHTML = voteBarHTML();
  maybeReady();
}

// ── Setup ─────────────────────────────────────────────────────
function tinyFig() { return `<svg viewBox="0 0 20 40"><circle cx="10" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 14 L10 28 M10 18 L3 24 M10 18 L17 24 M10 28 L5 38 M10 28 L15 38" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`; }
function showSetup() {
  const st = ui.setup;
  if (ui.room) {   // fill names from joined phones
    const names = ui.room.players.map((p) => p.name);
    names.forEach((n, i) => { if (!st.names[i]) st.names[i] = n; });
    const n = names.length;
    if (n > 1 && st.size < Math.min(5, n)) st.size = Math.min(5, n);
  }
  const draw = () => {
    const party = partyById(st.size);
    app.innerHTML = `
    <div class="screen">
      <div class="setup">
        <h2>Who's walking with Noah?</h2>
        <section data-rsection="Squad name">
          <h3>Name your squad</h3>
          <input type="text" maxlength="28" placeholder="Noah's Friends" data-party data-squad value="${esc(st.party)}">
          <p class="small muted" style="margin-top:6px">Your squad, its players, score, difficulty and stats are saved to the leaderboard when the journey ends.</p>
        </section>
        <section data-rsection="Party size">
          <h3>How many friends?</h3>
          <div class="choice-grid party-grid">
            ${PARTIES.map((p) => `<button class="choice ${st.size === p.id ? 'on' : ''}" data-size="${p.id}" data-rlabel="${p.name} (${p.id === 5 ? '5+' : p.id}) · ${p.mult}× difficulty">
              <div class="party-figs">${Array.from({ length: p.id }, tinyFig).join('')}${p.id === 5 ? '<span class="plus">+</span>' : ''}</div>
              <div class="big">${p.name}</div>
              <div class="sub">${p.id === 5 ? '5 or more · ' : ''}${p.sub.replace('5 or more. ', '')}</div>
              <div class="mult-line">${p.mult}× difficulty</div>
            </button>`).join('')}
          </div>
          <div class="names">
            ${Array.from({ length: party.names }, (_, i) => `<input type="text" maxlength="16" placeholder="Player ${i + 1}'s name (optional)" data-name="${i}" value="${esc(st.names[i])}">`).join('')}
          </div>
        </section>
        <section data-rsection="Difficulty">
          <h3>How hard a road?</h3>
          <div class="choice-grid">
            ${Object.entries(MODES).map(([k, m]) => `<button class="choice ${st.mode === k ? 'on' : ''}" data-mode="${k}" data-rlabel="${m.name}: ${m.desc}"><div class="big">${m.name}</div><div class="sub">${m.desc}</div></button>`).join('')}
          </div>
        </section>
        <p class="note">Everyone plays together as one team: one Noah, one health bar, one answer at a time. There are no turns. Talk it out, then lock it in. A bigger party just means a harder journey.</p>
        <div class="row" style="margin-top:22px">
          <button class="btn" data-act="back">Back</button>
          <button class="btn primary" data-act="topics">Next: choose topics ➜</button>
        </div>
      </div>
    </div>`;
    focusFirst('.choice.on');
  };
  draw();
  app.oninput = (e) => {
    if (e.target.dataset.name !== undefined) st.names[+e.target.dataset.name] = e.target.value;
    if (e.target.dataset.party !== undefined) st.party = e.target.value;
  };
  app.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.size) { st.size = +t.dataset.size; draw(); }
    else if (t.dataset.mode) { st.mode = t.dataset.mode; draw(); }
    else if (t.dataset.act === 'back') { app.oninput = null; showTitle(); }
    else if (t.dataset.act === 'topics') { app.oninput = null; saveSetup(); showTopics(); }
  };
}

function showTopics() {
  const st = ui.setup;
  const draw = () => {
    app.innerHTML = `
    <div class="screen">
      <div class="setup topics">
        <div class="all-set">
          <button class="btn primary big-go" data-act="go" ${st.topics.size ? '' : 'disabled'} data-rlabel="All set — set off with ${st.topics.size} topics">All set — set off ➜</button>
          <span class="small muted">${st.topics.size === ALL_TOPIC_IDS.length ? 'Every topic is on.' : `${st.topics.size} of ${ALL_TOPIC_IDS.length} topics on.`} Happy with that? Go straight in.</span>
        </div>
        <h2>What should the questions be about?</h2>
        <p class="center-text muted">Everything is on. Or tap anything your group would rather skip.</p>
        ${TOPIC_GROUPS.map((g) => `
        <section data-rsection="${g.name}">
          <div class="group-head"><h3>${g.name}</h3>
            <span class="row small"><button class="btn small ghost link" data-group-all="${g.name}">All</button><button class="btn small ghost link" data-group-none="${g.name}">None</button></span></div>
          <div class="topic-grid">
            ${g.topics.map((t) => `<button class="topic ${st.topics.has(t.id) ? 'on' : ''}" data-topic="${t.id}" aria-pressed="${st.topics.has(t.id)}" data-rlabel="${t.name}"><span class="check">${st.topics.has(t.id) ? '✓' : ''}</span>${t.name}</button>`).join('')}
          </div>
        </section>`).join('')}
        <p class="note">${st.topics.size} of ${ALL_TOPIC_IDS.length} topics on. Questions come from your reviewed question bank${source.bankCount ? ` (${source.bankCount.toLocaleString()} questions)` : ''}; when a topic runs low, Open Trivia DB tops it up online (skipping anything the review cut). Brain teasers are made fresh every time.</p>
        <div class="row" style="margin-top:22px">
          <button class="btn" data-act="back">Back</button>
          <button class="btn primary" data-act="go" ${st.topics.size ? '' : 'disabled'}>Set off ➜</button>
        </div>
      </div>
    </div>`;
  };
  draw();
  focusFirst('.topic');
  app.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    const groupOf = (name) => TOPIC_GROUPS.find((g) => g.name === name).topics.map((x) => x.id);
    const refocus = (sel) => { draw(); if (ui.kbd) $(sel)?.focus(); };
    if (t.dataset.topic) { st.topics.has(t.dataset.topic) ? st.topics.delete(t.dataset.topic) : st.topics.add(t.dataset.topic); saveSetup(); refocus(`[data-topic="${t.dataset.topic}"]`); }
    else if (t.dataset.groupAll) { groupOf(t.dataset.groupAll).forEach((id) => st.topics.add(id)); saveSetup(); refocus(`[data-group-all="${t.dataset.groupAll}"]`); }
    else if (t.dataset.groupNone) { groupOf(t.dataset.groupNone).forEach((id) => st.topics.delete(id)); saveSetup(); refocus(`[data-group-none="${t.dataset.groupNone}"]`); }
    else if (t.dataset.act === 'back') showSetup();
    else if (t.dataset.act === 'go' && st.topics.size) {
      if (!source.bankLoaded) {   // first load of the question bank can take a moment
        t.disabled = true; t.textContent = 'Loading questions…';
        return source.ready.then(() => { t.disabled = false; t.click(); });
      }
      const party = partyById(st.size);
      const players = st.names.slice(0, party.names).map((n) => n.trim()).filter(Boolean);
      for (const p of ui.room?.players || []) if (!players.some((n) => n.toLowerCase() === p.name.toLowerCase())) players.push(p.name);
      game.newRun({ partySize: st.size, mode: st.mode, partyName: st.party.trim(), players, topics: [...st.topics] });
      startJourney();
    }
  };
}

// ── In-game ───────────────────────────────────────────────────
function bar(cls, lbl, val, max) {
  return `<div class="bar ${cls}"><span class="lbl">${lbl}</span><div class="track"><div class="fill" style="width:${max ? Math.max(0, Math.min(100, (val / max) * 100)) : 0}%"></div></div><span class="num">${Math.round(val)}/${max}</span></div>`;
}
function hudHTML() {
  const s = game.s;
  const tier = noahTier(s.level);
  const skills = Object.entries(s.skills).filter(([, lv]) => lv).map(([k, lv]) => `<span class="chip">${SKILLS[k].tiers[lv - 1].name}</span>`).join('') || '<span class="small muted">First skill at level 5.</span>';
  return `
  <aside class="hud sk">
    <div>
      <div class="who">${esc(s.partyName)}</div>
      <div class="where">Map ${s.mapIndex + 1} of ${MAPS.length} · ${esc(MAPS[s.mapIndex].name)} · ${game.party.name} · ${MODES[s.mode].name}</div>
    </div>
    <div class="portrait">${drawNoah(s.level, { size: 120 })}</div>
    <div class="tiername">Lv ${s.level} · ${NOAH_TIERS[tier].name}</div>
    ${bar('hp', 'HP', s.hp, game.maxHp)}
    ${bar('mp', 'MP', s.mp, game.maxMp)}
    ${bar('exp', 'EXP', s.exp, game.expNeed)}
    <div class="statline">${Object.keys(STATS).map((k) => `<div title="${STATS[k].name}: ${STATS[k].blurb}"><b>${s.stats[k]}</b>${k}</div>`).join('')}</div>
    <div class="skills-mini">${source.testMode ? '<span class="chip red">TEST MODE</span>' : ''}<span class="chip red">${s.rerolls} reroll${s.rerolls === 1 ? '' : 's'}</span>${s.tetherArmed ? '<span class="chip">Tether ready</span>' : ''}${s.pendingTopic ? `<span class="chip">Next: ${esc(TOPICS[s.pendingTopic]?.short)}</span>` : ''}${skills}</div>
    <div class="hud-actions">
      <button class="btn small ghost link no-remote" data-act="quit">Save & quit</button>
      ${ui.room ? `<button class="btn small ghost link no-remote" id="phone-chip" data-act="showjoin">📱 ${ui.room.code} · ${ui.room.players.filter((p) => p.connected).length}</button>` : `<button class="btn small ghost link no-remote" data-act="addphones">📱 Phones</button>`}
      <button class="btn small ghost link no-remote" data-act="boardin" title="Leaderboard">🏆</button>
      <button class="btn small ghost link no-remote" data-act="howin">Help</button>
      <button class="btn small ghost link no-remote" data-act="settingsin" title="Settings">⚙</button>
    </div>
  </aside>`;
}
const refreshHud = () => { const hud = $('.hud'); if (hud) hud.outerHTML = hudHTML(); };

// The boss fight turns the page dark (and the sounds darker); everything else is the light paper
function applyTheme() { setBossTheme(!!(game.s && game.s.boss && app.dataset.from === 'game' && !['victory', 'defeat'].includes(game.s.phase))); }
function renderGame() {
  const s = game.s;
  app.dataset.from = 'game';
  applyTheme();
  if (s.phase === 'defeat' || s.phase === 'victory') return showEnd();
  const sel = game.choices();
  const mapSvg = drawMap(s.map, { ...game.sight, selectable: sel });
  const hint = s.phase === 'map' ? (sel.length > 1 ? `Choose a path together (${sel.length} ways).` : 'Onward.') : '';
  app.innerHTML = `
  <div class="game">
    ${hudHTML()}
    <section class="board" data-rsection="Choose a path">
      <div class="board-head"><h2>${esc(MAPS[s.mapIndex].name)}</h2><span class="hint">${hint}</span></div>
      <div class="map-wrap" id="mapwrap">${mapSvg}</div>
    </section>
  </div>
  <div id="overlay"></div>`;
  scrollMapToNoah();
  app.onclick = onGameClick;
  renderOverlay();
  if (s.phase === 'map') focusFirst('.node.selectable');
}

function scrollMapToNoah() {
  const wrap = $('#mapwrap'); if (!wrap) return;
  const svg = $('svg.map', wrap);
  const s = game.s;
  const cur = s.map.current ? s.map.rows.flat().find((n) => n.id === s.map.current) : null;
  const [, y] = cur ? nodeXY(s.map, cur) : [0, svg.viewBox.baseVal.height];
  const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const target = y * scale - wrap.clientHeight * 0.66;
  wrap.style.scrollBehavior = 'auto';
  wrap.scrollTop = ui.lastMapScroll ?? target;
  wrap.style.scrollBehavior = '';
  requestAnimationFrame(() => { wrap.scrollTop = target; ui.lastMapScroll = target; });
}

function onGameClick(e) {
  const node = e.target.closest('.node.selectable');
  if (node && game.s.phase === 'map') {
    game.moveTo(node.dataset.id);
    ui.sels = []; ui.result = null;
    return renderGame();
  }
  const a = e.target.closest('[data-act]')?.dataset.act;
  if (a === 'quit') { game.save(); app.dataset.from = ''; showTitle(); }
  if (a === 'howin') showHow();
  if (a === 'boardin') showBoard();
  if (a === 'settingsin') showSettings();
  if (a === 'showjoin') showJoinModal();
  if (a === 'addphones') ensureRoom().then((r) => { if (r) { refreshHud(); showJoinModal(); } });
}
function showJoinModal() {
  if (!ui.room) return;
  const m = document.createElement('div');
  m.className = 'overlay join-modal';
  m.innerHTML = `<div class="panel" style="text-align:center;max-width:460px">
    <h2>Join on your phone</h2><div class="qr">${ui.room.qrSvg(joinUrl(ui.room.code))}</div>
    <div class="room-code">${ui.room.code}</div><div class="small muted url">${esc(joinUrl(ui.room.code))}</div>
    <ul class="mini-players">${ui.room.players.map((p) => `<li><span class="pdot" style="background:${p.color}"></span>${esc(p.name)}</li>`).join('')}</ul>
    <button class="btn primary" data-close>Done</button></div>`;
  document.body.appendChild(m);
  m.querySelector('[data-close]').focus();
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) m.remove(); };
}

// ── Overlays ──────────────────────────────────────────────────
function renderOverlay() {
  const s = game.s;
  const ov = $('#overlay');
  if (s.phase === 'question' || s.phase === 'boss') return renderQuestion(ov);
  if (s.phase === 'bossIntro') return renderBossIntro(ov);
  if (s.phase === 'event') return renderEvent(ov);
  if (s.phase === 'levelup') return renderLevelUp(ov);
  if (s.phase === 'mapClear') return renderMapClear(ov);
  if (s.phase === 'map' && ui.tutorialPage != null) return renderTutorial(ov);
  ov.innerHTML = '';
}

function answerHTML(a) {
  if (typeof a === 'string') return esc(a);
  if (a.shape) return drawShape(a.shape, 'opt');
  if (a.swatch) return `${drawSwatch(a.swatch)}${esc(a.text)}`;
  return esc(a.text || '');
}
const answerLabel = (a, i) => `${letter(i)}: ${typeof a === 'string' ? a : a.text || 'shape ' + letter(i)}`;

// Phone picks for the current question. Every phone's pick shows on the big
// screen (and on every phone) as it's made. When every connected phone has
// picked, the team is "ready": anyone can then choose an answer for the team and
// lock it in, whether or not everyone agrees.
function syncVoteKey() {
  const key = game.s?.q?.key || null;
  if (key !== ui.voteKey) { ui.voteKey = key; ui.votes = new Map(); ui.revealed = LIVE_PICKS; ui.forced = false; ui.flagging = false; ui.sels = []; }
}
function connectedPlayers() { return ui.room ? ui.room.players.filter((p) => p.connected) : []; }
function votesAt(i, c) { return [...ui.votes.entries()].filter(([, v]) => v.i === i && (c === undefined || v.c === c)).map(([id]) => ui.room?.players.find((p) => p.id === id)).filter(Boolean); }
function chipsHTML(i, c) {
  if (!ui.revealed) return '';
  return votesAt(i, c).map((p) => `<span class="vchip" style="background:${p.color}" title="${esc(p.name)}">${esc(p.name.slice(0, 1).toUpperCase())}</span>`).join('');
}
const everyoneIn = () => { const ps = connectedPlayers(); return ps.length > 0 && ps.every((p) => ui.votes.has(p.id)); };
const ready = () => ui.forced || everyoneIn();
// How many answers the team locks in: one, or two while Second Guess is armed
const maxPicks = () => (game.s?.q ? game.picksNeeded() : 1);
// The team answer(s): choosing replaces the old one, except while Second Guess
// is armed, when two can be held at once (tap a chosen zone again to drop it).
function chooseTeam(i, c) {
  const need = maxPicks();
  if (need === 1) { ui.sels = [{ i, c }]; return; }
  const at = ui.sels.findIndex((x) => x.i === i);
  if (at >= 0) { if (ui.sels[at].c === c) ui.sels.splice(at, 1); else ui.sels[at] = { i, c }; }
  else { ui.sels.push({ i, c }); if (ui.sels.length > need) ui.sels.shift(); }
}
const teamLabel = () => ui.sels.map((x) => `${letter(x.i)} · ${CONFIDENCE[x.c].label}`).join('  +  ');
function voteBarHTML() {
  const cq = game.s?.q;
  const ps = connectedPlayers();
  if (!cq || !ps.length || cq.answered !== null) return '<div id="votebar"></div>';
  const n = ps.filter((p) => ui.votes.has(p.id)).length;
  const waiting = ps.filter((p) => !ui.votes.has(p.id)).map((p) => p.name);
  return `<div id="votebar" class="votebar ${ready() ? 'ready' : ''}">
    <span>📱 ${ps.map((p) => `<span class="pname ${ui.votes.has(p.id) ? 'done' : ''}"><span class="pdot" style="background:${p.color}"></span>${esc(p.name)}${ui.votes.has(p.id) ? ' ✓' : ''}</span>`).join('')}</span>
    ${ready() ? '<span class="ready-tag">✓ Ready. Talk it over, then anyone can lock in.</span>'
      : `<span class="small muted">Waiting for ${esc(waiting.join(', '))} (${n}/${ps.length})</span>${n ? '<button class="btn small no-remote" data-act="skipwait" data-rlabel="Go without them">Go without them</button>' : ''}`}
  </div>`;
}
// Everyone is in (or the screen said go). If one answer clearly leads, it becomes the team answer
// to start with; if the picks are tied there's no starting answer, so somebody has to choose.
function readyUp() {
  ui.revealed = true;
  if (!ui.sels.length && ui.votes.size) {
    const need = maxPicks();
    const tally = {};
    for (const v of ui.votes.values()) (tally[v.i] ||= []).push(v.c);
    const groups = Object.entries(tally).sort((a, b) => b[1].length - a[1].length);
    const cut = groups[need]?.[1].length ?? 0;      // anything level with the first answer left out is a tie
    ui.sels = groups.filter(([, cs]) => cs.length > cut).slice(0, need)
      .map(([i, cs]) => ({ i: +i, c: Math.round(cs.reduce((a, b) => a + b, 0) / cs.length) }));
  }
}
// Re-draw the question if it's what's on screen (a phone may act while Help or Settings is open)
function rerenderQuestion() {
  const ov = $('#overlay');
  if (ov && game.s?.q && (game.s.phase === 'question' || game.s.phase === 'boss')) renderQuestion(ov);
}
function maybeReady() {   // a phone dropped out: the rest may now be everyone
  const cq = game.s?.q;
  if (!cq || cq.answered !== null || !$('#overlay .q-panel') || !everyoneIn() || ui.sels.length) return;
  readyUp();
  rerenderQuestion();
}
function onVote(p, m) {
  const cq = game.s?.q;
  if (!cq || m.key !== cq.key || cq.answered !== null || !Number.isInteger(m.i) || m.i < 0 || m.i >= cq.q.answers.length || ![0, 1, 2].includes(m.c) || cq.removed.includes(m.i)) return;
  syncVoteKey();
  ui.votes.set(p.id, { i: m.i, c: m.c });
  if (everyoneIn()) readyUp();
  rerenderQuestion();
  syncRemote();
}
// A phone chose an answer for the team (only once everyone's ready). Its
// confidence is the average of the picks already on that answer.
function onTeam(p, m) {
  const cq = game.s?.q;
  if (!cq || m.key !== cq.key || cq.answered !== null || !Number.isInteger(m.i) || m.i < 0 || m.i >= cq.q.answers.length || cq.removed.includes(m.i)) return;
  syncVoteKey();
  if (!ready()) return;
  const vs = [...ui.votes.values()].filter((v) => v.i === m.i);
  chooseTeam(m.i, vs.length ? Math.round(vs.reduce((a, v) => a + v.c, 0) / vs.length) : 1);
  rerenderQuestion();
  syncRemote();
}

function renderQuestion(ov) {
  syncVoteKey();
  const s = game.s, cq = s.q, q = cq.q;
  const boss = s.boss;
  const res = ui.result;
  const answered = cq.answered !== null;
  const picked = cq.picked || [cq.answered];
  const need = game.picksNeeded();
  const stars = '★'.repeat(cq.tier) + '☆'.repeat(4 - cq.tier);
  const tools = [];
  for (const k of Object.keys(SKILLS)) if (s.skills[k]) {
    const t = SKILLS[k].tiers[s.skills[k] - 1];
    const armed = (k === 'second' && cq.secondArmed) || (k === 'tether' && s.tetherArmed);
    tools.push(`<button class="tool ${armed ? 'armed' : ''}" data-skill="${k}" ${game.canCast(k) && !answered ? '' : 'disabled'} title="${esc(t.desc)}" data-rlabel="Use ${t.name} (${game.skillCost(k)} MP)">${t.name} <span class="mp">${game.skillCost(k)} MP</span>${armed ? ' ✓' : ''}</button>`);
  }
  const canEasier = statFx.tierDrop(s.stats.C) > cq.dropped && cq.tier > 1;
  tools.push(`<button class="tool" data-act="reroll" ${s.rerolls > 0 && !answered ? '' : 'disabled'} title="A fresh question on the same topic" data-rlabel="Reroll: same topic (${s.rerolls} left)">↻ Reroll <span class="muted">(${s.rerolls})</span></button>`);
  if (statFx.tierDrop(s.stats.C) > 0) tools.push(`<button class="tool" data-act="easier" ${s.rerolls > 0 && canEasier && !answered ? '' : 'disabled'} title="Charisma: reroll into an easier question" data-rlabel="Reroll into an easier question">"Come on, this is too hard!" ↓★</button>`);

  const bossStage = boss ? `
    <div class="boss-stage">
      <div>${drawNoah(s.level, { size: 120 })}</div>
      <div>${drawBoss(s.mapIndex, { hurt: res && res.right })}</div>
    </div>
    <div class="q-top">
      <div><div class="boss-name">${esc(boss.name)}</div>
      <div class="pips" title="Questions">${Array.from({ length: 5 }, (_, i) => `<span class="pip ${i < boss.asked ? 'done' : ''}"></span>`).join('')}
        <span class="small muted" style="margin-left:8px">Mistakes: ${boss.mistakes} · the ${['', '1st', '2nd', '3rd', '4th'][game.bossMistakesAllowed()]} ends it</span></div></div>
    </div>` : '';

  ov.innerHTML = `
  <div class="overlay">
    <div class="panel q-panel ${boss ? 'boss-panel' : ''}">
      ${bossStage}
      <div class="q-top">
        <div class="q-topic">${esc(q.topicName || TOPICS[cq.topic]?.name || q.topic)}${q.subtopic && q.subtopic !== q.topicName ? ' › ' + esc(q.subtopic) : ''} · <span class="stars" title="${TIERS[cq.tier].name}">${stars}</span>
          ${q.returning ? '<div class="returning">↺ One you missed before</div>' : ''}
          ${cq.safe ? '<div class="returning" style="color:var(--green)">No harm if wrong</div>' : ''}
          ${cq.bonus === 'double' ? '<div class="returning" style="color:var(--gold)">Double EXP</div>' : ''}
          ${!answered && need === 2 ? '<div class="returning" style="color:var(--gold)">Second Guess: choose TWO answers, then lock in both</div>' : ''}</div>
        ${!answered && !q.test && !ui.flagging ? '<button class="flag" data-act="flag" title="Too niche or broken? Flag it: it\'s removed and you get a free replacement on the same topic" data-rlabel="⚑ Flag this question">⚑ Flag question</button>' : ''}
      </div>
      <div class="q-prompt">${esc(q.prompt)}</div>
      ${drawVisual(q.visual)}
      <div class="answers ${answered ? 'done' : ''}">
        ${q.answers.map((a, i) => {
          const removed = cq.removed.includes(i);
          let cls = removed ? 'removed' : '';
          const mine = ui.sels.find((x) => x.i === i);
          if (answered) cls += i === q.correct ? ' right' : picked.includes(i) ? ' wrong' : '';
          else if (mine) cls += ` sel conf${mine.c}`;
          return `<div class="answer ${cls}">
            <div class="a-body"><span class="key">${letter(i)}</span><span class="a-text">${answerHTML(a)}</span></div>
            ${answered || removed ? (answered && i === cq.answered ? `<div class="your-conf">${CONFIDENCE[cq.conf].label}</div>` : '') : `<div class="zones">${CONFIDENCE.map((c, k) => `<button class="zone z${k} ${mine && mine.c === k ? 'on' : ''}" data-ans="${i}" data-conf="${k}" aria-label="${esc(answerLabel(a, i))} — ${c.label}"><span class="zl">${c.label}</span><span class="zchips">${chipsHTML(i, k)}</span></button>`).join('')}</div>`}
          </div>`;
        }).join('')}
      </div>
      ${!answered ? `<div class="conf-legend"><span>← not sure <small>×${CONFIDENCE[0].exp} EXP · ½ damage</small></span><span>sure</span><span>definitely → <small>×${CONFIDENCE[2].exp} EXP · ×${CONFIDENCE[2].dmg} damage</small></span></div>` : ''}
      ${game.hints().length ? `<div class="hints">${game.hints().map((h) => `<p>${esc(h)}</p>`).join('')}</div>` : ''}
      ${!answered && ui.flagging ? `
      <div class="flag-box sk" data-rsection="Flag this question">
        <h3>Flag this question?</h3>
        <p class="small muted">It's taken out of the game and saved to your feedback for review. You get a fresh question on the same topic, free.</p>
        <div class="row flag-reasons">${FLAG_REASONS.map((r) => `<button class="btn ${r.id === 'other' ? '' : 'red'}" data-flag="${r.id}" data-rlabel="Flag: ${r.label}">${r.label}</button>`).join('')}</div>
        <input type="text" id="flag-note" maxlength="300" placeholder="Optional note (what's wrong with it?)" value="${esc(ui.flagNote || '')}">
        <div class="row" style="margin-top:8px"><button class="btn small ghost link" data-act="flag-cancel" data-rlabel="Cancel flag">Cancel</button></div>
      </div>` : !answered ? `
      <div class="tools">${tools.join('')}</div>
      ${voteBarHTML()}
      <div class="lockrow"><span class="kbd">${need === 2 ? 'Second Guess: tap two answers · tap a chosen one again to drop it' : 'Tap the left, middle or right of an answer · 1–4 on a keyboard'}</span>
        <button class="btn primary lock ${connectedPlayers().length && !ready() ? 'no-remote' : ''}" data-act="lock" ${ui.sels.length === need ? '' : 'disabled'}>${ui.sels.length === need ? `Lock in${need === 2 ? ' both' : ''}: ${teamLabel()}` : need === 2 ? `Lock in both (${ui.sels.length}/2 chosen)` : 'Lock in'}</button></div>`
      : resultHTML()}
    </div>
  </div>`;
  ov.onclick = onQuestionClick;
  const note = $('#flag-note', ov);
  if (note) note.oninput = (e) => { ui.flagNote = e.target.value; };
  if (ui.kbd) {
    const want = ui.focusWant;
    ui.focusWant = null;
    if (want) $(want, ov)?.focus(); else if (answered) $('[data-act=next]', ov)?.focus(); else if (!ov.contains(document.activeElement)) $('.zone.z1', ov)?.focus();
  }
}

function resultHTML() {
  const r = ui.result, s = game.s;
  if (!r) return '';
  const fx = [];
  if (r.exp) fx.push(`<span class="chip">+${r.exp} EXP</span>`);
  if (r.mp) fx.push(`<span class="chip">+${r.mp} MP</span>`);
  if (r.dmg) fx.push(`<span class="chip red">−${r.dmg} HP</span>`);
  if (r.tethered) fx.push('<span class="chip">The tether held — no harm done</span>');
  if (r.safe) fx.push('<span class="chip">No harm done</span>');
  if (r.levelUps) fx.push('<span class="chip red">Level up! ✦</span>');
  const title = r.right ? (r.conf === 2 ? 'Definitely right!' : pick(['Yes!', 'Right!', 'Got it!', 'Nicely done.'])) : pick(['Not quite.', 'Oh no…', 'Missed it.', 'The fog thickens.']);
  const last = r.defeat ? 'See what happened' : s.boss && s.boss.asked >= 5 ? 'Finish the boss' : 'Continue';
  return `<div class="result ${r.right ? 'good' : 'bad'}"><h3>${title}</h3>
    ${r.two ? `<div class="small muted">Second Guess: ${r.picked.map(letter).join(' and ')} locked in together.</div>` : ''}
    <div class="reveal-ans">${r.right ? 'Answer' : 'The answer was'}: <b>${esc(answerText(s.q.q.answers[r.correctIndex]) || 'option ' + letter(r.correctIndex))}</b></div>
    ${s.q.q.explain ? `<p class="explain">${esc(s.q.q.explain)}</p>` : ui.explaining === s.q.key ? '<p class="explain muted">Looking up why…</p>' : ''}
    ${learnUrl(s.q.q) ? `<a class="learn" href="${learnUrl(s.q.q)}" target="_blank" rel="noopener" data-rlabel="Learn more on Google">🔎 Learn more on Google</a>` : ''}
    <div class="fx">${fx.join('')}</div></div>
    <div class="lockrow"><button class="btn primary" data-act="next">${last} ➜</button></div>`;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Ask the Worker (if set up) for a short "why"; the reveal updates when it lands.
function startExplain() {
  const cq = game.s.q;
  if (!cq || cq.q.explain || !explainUrl()) return;
  const q = cq.q, key = cq.key;
  ui.explaining = key;
  fetchExplain(q).then((text) => {
    if (ui.explaining !== key) return;
    ui.explaining = null;
    if (text && game.s.q && game.s.q.key === key) { game.s.q.q.explain = text; game.save?.(); }
    rerenderQuestion();
  });
}

function lockIn() {
  const picks = ui.sels.map((x) => ({ ...x }));
  if (picks.length !== game.picksNeeded()) return;
  const r = game.answer(picks);
  if (!r) return;
  ui.result = r; ui.sels = [];
  startExplain();
  if (r.right) { Sound.good(); if (r.levelUps) setTimeout(() => Sound.levelUp(), 450); } else Sound.bad();
  refreshHud();
  renderQuestion($('#overlay'));
}

function onQuestionClick(e) {
  const t = e.target.closest('button'); if (!t) return;
  const cq = game.s.q;
  if (t.dataset.ans !== undefined && cq.answered === null) {
    chooseTeam(+t.dataset.ans, +t.dataset.conf);
    ui.focusWant = `[data-ans="${t.dataset.ans}"][data-conf="${t.dataset.conf}"]`;
    return renderQuestion($('#overlay'));
  }
  if (t.dataset.skill) {
    const msg = game.cast(t.dataset.skill);
    if (msg) toast(msg);
    ui.sels = ui.sels.filter((x) => !cq.removed.includes(x.i)).slice(-game.picksNeeded());
    refreshHud();
    return renderQuestion($('#overlay'));
  }
  const a = t.dataset.act;
  if (a === 'reroll' || a === 'easier') {
    if (game.reroll(a === 'easier')) { ui.sels = []; toast(a === 'easier' ? 'Fine — an easier one, same topic.' : 'A fresh question, same topic.'); }
    refreshHud();
    return renderQuestion($('#overlay'));
  }
  if (a === 'flag') { ui.flagging = true; ui.flagNote = ''; ui.focusWant = '[data-flag]'; return renderQuestion($('#overlay')); }
  if (a === 'flag-cancel') { ui.flagging = false; return renderQuestion($('#overlay')); }
  if (t.dataset.flag) {
    const note = (ui.flagNote || '').trim();
    ui.flagging = false;
    if (game.flag(t.dataset.flag, note)) { ui.sels = []; toast(`Flagged (${reasonLabel(t.dataset.flag).toLowerCase()}) — saved for review. Here's a fresh one on the same topic.`); }
    refreshHud();
    return renderQuestion($('#overlay'));
  }
  if (a === 'skipwait') { ui.forced = true; readyUp(); return renderQuestion($('#overlay')); }
  if (a === 'lock') return lockIn();
  if (a === 'next') {
    const wasDefeat = ui.result?.defeat;
    ui.result = null; ui.sels = [];
    if (wasDefeat) return showEnd();
    game.continueAfterAnswer();
    return renderGame();
  }
}

// ── Tutorial: a quick look at S.P.E.C.I.A.L. before the first path ──
const STAT_TIPS = {
  S: { does: 'Answering “Definitely” earns much more EXP.', when: 'Your group usually knows when it’s right.' },
  P: { does: 'Clears the fog. At 2 you see each path’s topic, at 3 its difficulty.', when: 'You want to steer toward topics you know.' },
  E: { does: '+25 max HP per point, so mistakes hurt less.', when: 'Wrong answers keep knocking you down.' },
  C: { does: '+2 rerolls per map. Every 3 points, a reroll can make a question easier.', when: 'You keep getting stuck on hard questions.' },
  I: { does: 'More mana, and more mana back per right answer, for skills like 50/50 and Hint.', when: 'You love using skills (first one at level 5).' },
  A: { does: 'More ? surprises on the map, and a bigger speed bonus to your score.', when: 'You answer fast and chase high scores.' },
  L: { does: 'Better odds of good surprises at ? spots: healing, mana, EXP, choosing a topic.', when: 'You like gambling on the ? spots.' },
};
const TUTORIAL_PAGES = 3;
function renderTutorial(ov) {
  const p = ui.tutorialPage;
  const s = game.s;
  let body = '';
  if (p === 0) body = `
    <div class="lv-head">${drawNoah(s.level, { size: 90 })}
      <div><h2>How Noah grows</h2>
      <p>Right answers give <b>EXP</b>. Every level-up gives the team <b>1 point</b> to put into one of Noah’s seven stats: <b>S.P.E.C.I.A.L.</b></p>
      <p class="muted">Every 4 levels he also learns a skill. Next: what each stat does, so you know where to put your points.</p></div>
    </div>`;
  else if (p === 1) body = `
    <h2>S.P.E.C.I.A.L.</h2>
    <div class="tut-stats">
      ${Object.entries(STATS).map(([k, st]) => `<div class="tut-stat sk"><span class="tut-letter">${k}</span><div><div class="name">${st.name}</div><div class="blurb">${STAT_TIPS[k].does}</div><div class="tut-when">Pick it if: ${STAT_TIPS[k].when}</div></div></div>`).join('')}
    </div>`;
  else body = `
    <h2>Before you set off</h2>
    <ul class="tut-list">
      <li><b>Tap an answer where you feel it:</b> left = not sure, middle = sure, right = definitely. More sure = more EXP if right, more damage if wrong. Then <b>Lock in</b>.</li>
      <li><b>↻ Reroll</b> swaps a question for a fresh one on the same topic (Charisma gives more).</li>
      <li><b>⚑ Flag question</b> if it’s too niche or broken: it’s removed, and the swap is free.</li>
      <li><b>Pick paths together.</b> A boss waits at the top of every map.</li>
    </ul>`;
  ov.innerHTML = `
  <div class="overlay"><div class="panel tutorial">
    <div class="tut-top"><span class="small muted">Tutorial · ${p + 1} of ${TUTORIAL_PAGES}</span>
      <button class="btn small ghost link" data-act="tut-skip" data-rlabel="Skip Tutorial">Skip Tutorial</button></div>
    ${body}
    <div class="tut-dots">${Array.from({ length: TUTORIAL_PAGES }, (_, i) => `<span class="${i === p ? 'on' : ''}"></span>`).join('')}</div>
    <div class="lockrow">
      ${p > 0 ? '<button class="btn" data-act="tut-back">Back</button>' : '<button class="btn small ghost link" data-act="tut-never" data-rlabel="Never show tutorials">Don’t show tutorials again</button>'}
      <button class="btn primary" data-act="tut-next">${p < TUTORIAL_PAGES - 1 ? 'Next ➜' : 'Let’s go ➜'}</button>
    </div>
  </div></div>`;
  ov.onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (!a) return;
    if (a === 'tut-next') ui.tutorialPage = p + 1 >= TUTORIAL_PAGES ? null : p + 1;
    else if (a === 'tut-back') ui.tutorialPage = Math.max(0, p - 1);
    else if (a === 'tut-skip') ui.tutorialPage = null;
    else if (a === 'tut-never') { Settings.set({ skipTutorial: true }); ui.tutorialPage = null; toast('Tutorials are off. Turn them back on in Settings.'); }
    else return;
    if (ui.tutorialPage == null) return renderGame();
    renderTutorial(ov);
  };
  focusFirst('[data-act=tut-next]');
}

function renderBossIntro(ov) {
  const s = game.s, allowed = game.bossMistakesAllowed();
  ov.innerHTML = `
  <div class="overlay"><div class="panel">
    <div class="boss-stage"><div>${drawNoah(s.level, { size: 120 })}</div><div>${drawBoss(s.mapIndex)}</div></div>
    <h2>${esc(s.boss.name)}</h2>
    <p>A shape without a face stands where the path ends. It will ask <b>5 questions</b>.
    ${allowed === 1 ? '<b>One mistake</b> and Noah fades.' : `The <b>${['', '1st', '2nd', '3rd', '4th'][allowed]} mistake</b> and Noah fades.`}
    Each wrong answer also tears away about ${Math.round(MAPS[s.mapIndex].bossDmg * 100)}% of his remaining HP.</p>
    <p class="muted" style="margin-top:8px">This is what you saved your mana for.</p>
    <div class="lockrow"><button class="btn red" data-act="fight">Face it together</button></div>
  </div></div>`;
  ov.onclick = (e) => { if (e.target.closest('[data-act=fight]')) { game.beginBossFight(); renderGame(); } };
  focusFirst('[data-act=fight]');
}

function renderEvent(ov) {
  const ev = game.s.event;
  const icon = ev.id === 'rest' ? '☾' : ev.tone === 'bad' ? '!' : ev.tone === 'great' ? '✦' : '?';
  ov.innerHTML = `
  <div class="overlay"><div class="panel tone-${ev.tone}">
    <div class="event-art">${icon}</div>
    <h2 style="text-align:center">${esc(ev.title)}</h2>
    <p>${esc(ev.text)}</p>
    ${ev.effects?.length ? `<div class="fxlist">${ev.effects.map((x) => `<span class="chip ${x.startsWith('-') ? 'red' : ''}">${esc(x)}</span>`).join('')}</div>` : ''}
    ${ev.levelUps ? '<p><b>Level up! ✦</b></p>' : ''}
    <div class="lockrow wrap">
      ${ev.topics ? ev.topics.map((t) => `<button class="btn" data-topic="${t}">${esc(TOPICS[t]?.name)}</button>`).join('') + '<button class="btn ghost small link" data-act="ok">None of these</button>'
        : `<button class="btn primary" data-act="ok">${ev.fx?.question ? 'Answer it' : 'Continue'} ➜</button>`}
    </div>
  </div></div>`;
  ov.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.topic) { game.resolveEvent(t.dataset.topic); toast(`The next question will be about ${TOPICS[t.dataset.topic].name}.`); }
    else if (t.dataset.act === 'ok') game.resolveEvent(null);
    else return;
    renderGame();
  };
  focusFirst('.lockrow .btn');
}

function statGain(k) {
  const v = game.s.stats[k], n = v + 1;
  switch (k) {
    case 'S': return `Confidence bonus ×${statFx.strengthBonus(v).toFixed(2)} → ×${statFx.strengthBonus(n).toFixed(2)}`;
    case 'P': { const parts = [`See ${statFx.sightRows(n)} row${statFx.sightRows(n) > 1 ? 's' : ''} ahead`]; if (statFx.sightCategory(n) && !statFx.sightCategory(v)) parts.push('+ each path\'s topic'); if (statFx.sightTier(n) && !statFx.sightTier(v)) parts.push('+ difficulty'); return parts.join(' '); }
    case 'E': return `Max HP ${statFx.maxHp(v)} → ${statFx.maxHp(n)}`;
    case 'C': return `Rerolls ${statFx.rerolls(v)} → ${statFx.rerolls(n)} per map${statFx.tierDrop(n) > statFx.tierDrop(v) ? ' · unlocks easier rerolls' : ''}`;
    case 'I': return `Max MP ${statFx.maxMp(v)} → ${statFx.maxMp(n)} · +${statFx.mpRegen(n)} MP per right answer`;
    case 'A': return `More ? nodes · speed bonus ×${statFx.speedMult(n).toFixed(2)}`;
    case 'L': return `Great surprises ${Math.round(statFx.luckChance(v) * 100)}% → ${Math.round(statFx.luckChance(n) * 100)}%`;
  }
}
function renderLevelUp(ov) {
  const s = game.s;
  const skillMode = !s.statPoints && s.skillPicks;
  ov.innerHTML = `
  <div class="overlay"><div class="panel">
    <div class="lv-head">${drawNoah(s.level, { size: 110 })}
      <div><h2>Level ${s.level}!</h2>
      <p>Noah's outline grows a little clearer. ${noahTier(s.level) > noahTier(s.level - 1) ? `<b>He's become a ${NOAH_TIERS[noahTier(s.level)].name.toLowerCase()}.</b>` : ''}</p>
      <p class="muted">${skillMode ? `Choose a new skill or upgrade one (${s.skillPicks} to choose).` : `Agree on where to put ${s.statPoints > 1 ? `your ${s.statPoints} points (one at a time)` : 'your point'}.`}</p></div>
    </div>
    <div class="stat-grid">
      ${skillMode ? game.skillOptions().map((o) => `<button class="stat-card" data-skill="${o.key}" data-rlabel="${o.upgrade ? 'Upgrade to ' : 'Learn '}${o.name} (${o.mp} MP): ${esc(o.desc)}"><span class="val">${o.mp} MP</span><div class="name">${o.upgrade ? '↑ ' : ''}${o.name}</div><div class="blurb">${esc(o.desc)}</div></button>`).join('')
        : Object.entries(STATS).map(([k, st]) => `<button class="stat-card" data-stat="${k}" data-rlabel="${st.name} ${s.stats[k]} → ${s.stats[k] + 1}: ${esc(statGain(k))}"><span class="val">${s.stats[k]}</span><div class="name">${st.name}</div><div class="blurb">${esc(st.blurb)}</div><div class="gain">${statGain(k)}</div></button>`).join('')}
    </div>
  </div></div>`;
  ov.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.stat) game.spendStat(t.dataset.stat);
    else if (t.dataset.skill) game.pickSkill(t.dataset.skill);
    else return;
    renderGame();
  };
  focusFirst('.stat-card');
}

function renderMapClear(ov) {
  const s = game.s, next = MAPS[s.mapIndex + 1];
  ov.innerHTML = `
  <div class="overlay"><div class="panel" style="text-align:center">
    <h2>${esc(MAPS[s.mapIndex].boss)} fades into the fog.</h2>
    <div style="display:flex;justify-content:center">${drawNoah(s.level, { size: 120 })}</div>
    <p>The path opens. Beyond the hedges, Noah sees <b>${esc(next.name)}</b>${s.mapIndex + 2 === MAPS.length ? ' — and at its peak, a light that feels like home.' : '.'}</p>
    <p class="muted">Half of his missing HP returns. Rerolls refresh.</p>
    <div class="lockrow" style="justify-content:center"><button class="btn primary" data-act="next">Walk on ➜</button></div>
  </div></div>`;
  ov.onclick = (e) => { if (e.target.closest('[data-act=next]')) { ui.lastMapScroll = null; game.nextMap(); renderGame(); } };
  focusFirst('[data-act=next]');
}

// ── End of a run ──────────────────────────────────────────────
function showEnd() {
  const s = game.s, win = s.phase === 'victory';
  const entry = game.lastEntry;
  const score = game.score();
  const board = Game.leaderboard();
  const rank = entry ? board.findIndex((r) => r.id === entry.id) + 1 : 0;
  game.clearSave();
  app.dataset.from = '';
  setBossTheme(false);
  app.innerHTML = `
  ${win ? '<div class="home-light"></div>' : ''}
  <div class="screen center end ${win ? 'victory' : 'defeat'}">
    <h1 class="title end-title">${win ? 'Noah is home.' : 'Noah fades into the fog…'}</h1>
    <div class="end-noah">${drawNoah(win ? Math.max(12, s.level) : s.level, { size: 150 })}</div>
    <p class="tagline">${win ? 'The beacon on the summit lights a door he remembers. Thank you for walking with him.' : `He made it to ${esc(MAPS[s.mapIndex].name)}. Next time, the way may be clearer.`}</p>
    <div class="scorebig">${score.toLocaleString()}</div>
    <p class="muted">${s.tally.maps} map${s.tally.maps === 1 ? '' : 's'} cleared · ${s.tally.nodes} nodes · ${s.tally.correct} right answers · level ${s.level}</p>
    ${entry ? `<div class="squad-edit sk">
      <label class="stack"><span>Squad name</span><input type="text" id="squad-end" data-squad maxlength="28" value="${esc(entry.party)}"></label>
      <p class="small muted">${rank ? `<b>#${rank}</b> of ${board.length} on the leaderboard · ` : ''}${esc(entry.mode)} · ${esc(entry.sizeName)}${entry.players.filter(Boolean).length ? ' · ' + esc(entry.players.filter(Boolean).join(', ')) : ''}. Saved. Change the name any time here.</p>
    </div>` : '<p class="muted small">Test runs aren\'t saved to the leaderboard.</p>'}
    <div class="row" style="margin-top:20px">
      <button class="btn primary" data-act="again">Walk again</button>
      <button class="btn" data-act="board">Leaderboard</button>
      <button class="btn ghost link" data-act="title">Title</button>
    </div>
  </div>`;
  app.oninput = (e) => { if (entry && e.target.id === 'squad-end') Game.renameEntry(entry.id, e.target.value); };
  app.onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'again') { app.oninput = null; showSetup(); }
    if (a === 'board') { app.oninput = null; showBoard(entry); }
    if (a === 'title') { app.oninput = null; showTitle(); }
  };
  focusFirst('[data-act=again]');
}

// ── Keyboard & TV remote: arrows move between buttons, Enter presses ──
function topLayer() {
  const modal = $$('.join-modal').pop();
  if (modal) return modal;
  const ov = $('#overlay .overlay');
  return ov || app;
}
function focusables(root) {
  return $$('button:not(:disabled), [tabindex="0"], input, a[href]', root).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !el.closest('[hidden]');
  });
}
function focusFirst(sel) {
  if (!ui.kbd) return;
  requestAnimationFrame(() => {
    const root = topLayer();
    if (root.contains(document.activeElement) && document.activeElement !== document.body) return;
    const el = (sel && $(sel, root)) || focusables(root)[0];
    el?.focus({ preventScroll: false });
  });
}
function moveFocus(dir) {
  const root = topLayer();
  const all = focusables(root);
  const cur = document.activeElement;
  if (!all.includes(cur)) return all[0]?.focus();
  const a = cur.getBoundingClientRect();
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = null, bestScore = Infinity;
  for (const el of all) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const dx = bx - ax, dy = by - ay;
    const main = { ArrowRight: dx, ArrowLeft: -dx, ArrowDown: dy, ArrowUp: -dy }[dir];
    const cross = dir === 'ArrowRight' || dir === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
    if (main <= 4) continue;
    const score = main + cross * 2.2;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) { best.focus(); best.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}
document.addEventListener('keydown', (e) => {
  const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
  if (e.key.startsWith('Arrow') && (!inInput || e.key === 'ArrowUp' || e.key === 'ArrowDown')) { ui.kbd = true; e.preventDefault(); moveFocus(e.key); return; }
  if (e.key === 'Tab') ui.kbd = true;
  if (inInput) return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.node.selectable')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
  if (!game.s) return;
  const ph = game.s.phase;
  if ((ph === 'question' || ph === 'boss') && game.s.q && game.s.q.answered === null && !$('.join-modal')) {
    const i = '1234'.indexOf(e.key);
    if (i >= 0 && i < game.s.q.q.answers.length && !game.s.q.removed.includes(i)) {
      const cur = ui.sels.find((x) => x.i === i);
      chooseTeam(i, cur ? (cur.c + 1) % 3 : 1);
      renderQuestion($('#overlay'));
    }
  }
});
document.addEventListener('mousedown', () => { ui.kbd = false; });
document.addEventListener('touchstart', () => { ui.kbd = false; }, { passive: true });

// ── Mirror the screen to phones ───────────────────────────────
// Every enabled button in the top layer becomes a button on each phone, so
// phones can drive the whole game (handy on a TV with no mouse).
function harvestActions() {
  const root = topLayer();
  ui.rv++;
  const els = $$('button:not(:disabled):not(.zone):not(.no-remote), .node.selectable', root).filter((el) => !el.closest('.hud'));
  return els.map((el, i) => {
    el.dataset.rid = `${ui.rv}.${i}`;
    const label = (el.dataset.rlabel || el.getAttribute('aria-label') || el.innerText || '').trim().replace(/\s+/g, ' ');
    return { rid: el.dataset.rid, label, section: el.closest('[data-rsection]')?.dataset.rsection || '', on: el.classList.contains('on') || el.getAttribute('aria-pressed') === 'true', primary: el.classList.contains('primary') || el.classList.contains('red'), lock: el.dataset.act === 'lock' };
  });
}
function remoteState() {
  const s = game.s;
  const root = topLayer();
  const inGame = !!(s && app.dataset.from === 'game' && $('.game'));
  const title = $('.panel h2', root)?.innerText || $('.board-head h2', root)?.innerText || $('h2, h1', root)?.innerText || TITLE;
  const text = $('.panel > p', root)?.innerText || (inGame && s.phase === 'map' ? 'Choose a path together.' : $('.tagline, .note', root)?.innerText || '');
  const squadEl = $('[data-squad]', root);
  const base = { t: 'state', title, text, squad: squadEl ? { value: squadEl.value } : null, actions: harvestActions(), rv: ui.rv, players: (ui.room?.players || []).map((p) => ({ id: p.id, name: p.name, color: p.color, connected: p.connected })) };
  if (inGame) base.hud = { hp: s.hp, maxHp: game.maxHp, mp: s.mp, maxMp: game.maxMp, level: s.level, map: MAPS[s.mapIndex].name, party: s.partyName, boss: !!s.boss };
  if (inGame && s.q && (s.phase === 'question' || s.phase === 'boss')) {
    syncVoteKey();
    const cq = s.q, q = cq.q, answered = cq.answered !== null;
    base.q = {
      key: cq.key, prompt: q.prompt, topic: q.topicName || TOPICS[cq.topic]?.name, subtopic: q.subtopic, tier: cq.tier, visual: q.visual || null,
      answers: q.answers, removed: cq.removed, hints: game.hints(), boss: s.boss ? { name: s.boss.name, asked: s.boss.asked, mistakes: s.boss.mistakes } : null,
      answered, chosen: cq.answered, conf: cq.conf, correct: answered ? q.correct : null, result: answered && ui.result ? { right: ui.result.right, exp: ui.result.exp, dmg: ui.result.dmg, answer: answerText(q.answers[q.correct]), explain: q.explain || '', explaining: ui.explaining === cq.key && !q.explain, learn: learnUrl(q) } : null,
      team: ui.sels, need: game.picksNeeded(), ready: ready(), revealed: ui.revealed, votes: ui.revealed ? [...ui.votes.entries()].map(([id, v]) => ({ id, ...v })) : null,
      voted: [...ui.votes.keys()], picked: cq.picked || null,
    };
  }
  return base;
}
let syncTimer = null;
function syncRemote() {
  if (!ui.room || !ui.room.players.length) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    const st = remoteState();
    ui.room.broadcast((p) => ({ ...st, you: { id: p.id, vote: ui.votes.get(p.id) || null } }));
  }, 60);
}
new MutationObserver(() => syncRemote()).observe(document.body, { childList: true, subtree: true });
// A phone typed the squad name: put it in the squad box on the big screen
function onSquad(m) {
  const el = document.querySelector('[data-squad]');
  if (!el) return;
  el.value = String(m.name ?? '').slice(0, 28);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
function onRemoteAction(p, m) {
  if (m.rv !== ui.rv) return syncRemote();          // stale button list: resend
  const el = document.querySelector(`[data-rid="${m.rid}"]`);
  if (!el || el.disabled) return syncRemote();
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

document.title = TITLE;
showTitle();
window.noah = { game, source, ui, render: () => renderGame() };
}
