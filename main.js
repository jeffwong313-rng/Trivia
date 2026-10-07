// Screens and interaction. One shared screen; the whole party plays as one.
import { TITLE, MODES, PARTY_SCALING, CONFIDENCE, STATS, SKILLS, MAPS, NOAH_TIERS, TIERS, statFx, partyTierShift } from './config.js';
import { SVG_DEFS, drawNoah, drawBoss, drawShape, drawMap, nodeXY, noahTier } from './art.js';
import { QuestionSource } from './questions.js';
import { Game } from './game.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const app = $('#app');
$('#defs').innerHTML = SVG_DEFS;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const source = new QuestionSource();
source.warmUp();
const game = new Game(source);
const ui = { sel: null, result: null, timerId: null, setup: { size: 1, mode: 'standard', names: ['', '', '', ''], party: '' }, lastMapScroll: null };

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
function stopTimer() { clearInterval(ui.timerId); ui.timerId = null; }

// ── Title ─────────────────────────────────────────────────────
function showTitle() {
  stopTimer();
  const save = Game.hasSave();
  app.innerHTML = `
  <div class="screen center">
    <div class="title-wrap">
      <div class="title-noah">${drawNoah(1, { size: 190 })}</div>
      <h1 class="title">No<span class="tap-a">a</span>h<span class="colon">:</span> W<span class="tap-a">a</span>y Home</h1>
      ${source.testMode ? '<div class="chip red test-badge">TEST MODE · every question is a placeholder</div>' : ''}
      <p class="tagline">A lost boy, barely a sketch, holding a red balloon. Answer together, and draw him home.</p>
    </div>
    <div class="stack" style="margin-top:22px">
      ${save ? `<button class="btn primary" data-act="continue">Continue the journey <span class="small">(${esc(save.partyName)} · ${esc(MAPS[save.mapIndex].name)})</span></button>` : ''}
      <button class="btn ${save ? '' : 'primary'}" data-act="new">Begin a new journey</button>
      <div class="row">
        <button class="btn small ghost link" data-act="how">How to play</button>
        <button class="btn small ghost link" data-act="board">Leaderboard</button>
      </div>
    </div>
  </div>`;
  app.onclick = (e) => {
    // Secret: click an "a" in the title 10 times in a row to toggle test mode.
    if (e.target.closest('.tap-a')) {
      const now = Date.now();
      ui.taps = now - (ui.lastTap || 0) < 1500 ? (ui.taps || 0) + 1 : 1;
      ui.lastTap = now;
      if (ui.taps >= 10) {
        ui.taps = 0;
        source.testMode = !source.testMode;
        showTitle();
        toast(source.testMode ? 'Test mode on: every question is a placeholder.' : 'Test mode off.');
      }
      return;
    }
    ui.taps = 0;
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'new') showSetup();
    if (a === 'continue') { game.load(); renderGame(); }
    if (a === 'how') showHow();
    if (a === 'board') showBoard();
  };
}

function showHow() {
  app.innerHTML = `
  <div class="screen">
    <h2 style="font-size:3rem;margin-bottom:10px">How to play</h2>
    <div class="sk howto" style="padding:18px 22px">
      <ul>
        <li><b>You're one team.</b> Everyone shares one Noah, one HP bar, and one mana bar. Talk it over, then lock in one answer together.</li>
        <li><b>More friends = harder trip.</b> Questions get tougher and mistakes hurt more as the party grows (solo 0.8×, duo 1.9×, trio 3.25×, four 4.5×).</li>
        <li><b>Pick a path.</b> Noah climbs up the map. Fog hides what's ahead; <i>Perception</i> clears it.</li>
        <li><b>Wager your confidence.</b> Sure of it? Bet high for big EXP — but a wrong answer hurts more.</li>
        <li><b>Level up.</b> Each level gives one stat point. Every 4 levels, learn or upgrade a skill. Noah's drawing fills in as he grows.</li>
        <li><b>? nodes</b> are surprises. <i>Luck</i> makes them kinder; <i>Agility</i> makes more of them.</li>
        <li><b>Bosses</b> wait at the top of each map: 5 questions. Two mistakes ends the run (one, from the 4th map on). Save your mana for them.</li>
        <li>8 lands stand between Noah and home. Shortcuts: keys <b>1–4</b> pick an answer, <b>Enter</b> locks it in.</li>
      </ul>
    </div>
    <button class="btn" style="margin-top:20px" data-act="back">Back</button>
  </div>`;
  app.onclick = (e) => { if (e.target.closest('[data-act=back]')) showTitle(); };
}

function showBoard(highlight) {
  const rows = Game.leaderboard();
  app.innerHTML = `
  <div class="screen">
    <h2 style="font-size:3rem;margin-bottom:10px">Leaderboard</h2>
    <p class="muted" style="margin-bottom:12px">Ranked by how far you got, with a little extra for speed. Saved on this device.</p>
    ${rows.length ? `<div class="sk" style="padding:10px 14px;width:100%;max-width:860px;overflow-x:auto"><table class="lb">
      <tr><th>#</th><th>Party</th><th>Size</th><th>Mode</th><th>Reached</th><th>Lv</th><th>Score</th></tr>
      ${rows.map((r, i) => `<tr class="${highlight && r.date === highlight.date ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.party)}${r.players?.filter(Boolean).length ? `<div class="small muted">${esc(r.players.filter(Boolean).join(', '))}</div>` : ''}</td><td>${r.size}</td><td>${esc(r.mode)}</td><td>${r.outcome === 'victory' ? 'Home! ✦' : esc(r.reached)}</td><td>${r.level}</td><td><b>${r.score.toLocaleString()}</b></td></tr>`).join('')}
    </table></div>` : '<p class="note">No journeys yet.</p>'}
    <button class="btn" style="margin-top:20px" data-act="back">Back</button>
  </div>`;
  app.onclick = (e) => { if (e.target.closest('[data-act=back]')) showTitle(); };
}

// ── Setup ─────────────────────────────────────────────────────
function tinyFig(i) { return `<svg viewBox="0 0 20 40"><circle cx="10" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 14 L10 28 M10 18 L3 24 M10 18 L17 24 M10 28 L5 38 M10 28 L15 38" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`; }
function showSetup() {
  const st = ui.setup;
  const draw = () => {
    app.innerHTML = `
    <div class="screen">
      <div class="setup">
        <h2>Who's walking with Noah?</h2>
        <section>
          <h3>How many friends?</h3>
          <div class="choice-grid">
            ${[1, 2, 3, 4].map((n) => `<button class="choice ${st.size === n ? 'on' : ''}" data-size="${n}">
              <span class="mult">${PARTY_SCALING[n]}×</span>
              <div class="party-figs">${Array.from({ length: n }, (_, i) => tinyFig(i)).join('')}</div>
              <div class="big">${['Solo', 'Two', 'Three', 'Four'][n - 1]}</div>
              <div class="sub">${['A quiet walk', 'Questions get harder', 'Tough questions, sharper sting', 'The hardest road'][n - 1]}</div>
            </button>`).join('')}
          </div>
          <div class="names">
            ${Array.from({ length: st.size }, (_, i) => `<input type="text" maxlength="16" placeholder="Friend ${i + 1} (optional)" data-name="${i}" value="${esc(st.names[i])}">`).join('')}
          </div>
        </section>
        <section>
          <h3>How hard a road?</h3>
          <div class="choice-grid">
            ${Object.entries(MODES).map(([k, m]) => `<button class="choice ${st.mode === k ? 'on' : ''}" data-mode="${k}"><div class="big">${m.name}</div><div class="sub">${m.desc}</div></button>`).join('')}
          </div>
        </section>
        <section>
          <h3>Name your party</h3>
          <input type="text" maxlength="28" placeholder="Noah's Friends" data-party value="${esc(st.party)}">
        </section>
        <p class="note">Everyone plays together as one team: one Noah, one health bar, one answer at a time. There are no turns — talk it out, then lock it in. A bigger party just means a harder journey.</p>
        <div class="row" style="margin-top:22px">
          <button class="btn" data-act="back">Back</button>
          <button class="btn primary" data-act="go">Set off ➜</button>
        </div>
      </div>
    </div>`;
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
    else if (t.dataset.act === 'go') {
      app.oninput = null;
      game.newRun({ partySize: st.size, mode: st.mode, partyName: st.party.trim(), players: st.names.slice(0, st.size).map((n) => n.trim()) });
      renderGame();
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
  const skills = Object.entries(s.skills).filter(([, lv]) => lv).map(([k, lv]) => `<span class="chip">${SKILLS[k].tiers[lv - 1].name}</span>`).join('') || '<span class="small muted">No skills yet — your first comes at level 5.</span>';
  return `
  <aside class="hud sk">
    <div>
      <div class="who">${esc(s.partyName)}</div>
      <div class="where">Map ${s.mapIndex + 1} of ${MAPS.length} · ${esc(MAPS[s.mapIndex].name)} · ${s.partySize > 1 ? s.partySize + ' friends' : 'solo'} · ${MODES[s.mode].name}</div>
    </div>
    <div class="portrait">${drawNoah(s.level, { size: 120 })}</div>
    <div class="tiername">Lv ${s.level} · ${NOAH_TIERS[tier].name}</div>
    ${bar('hp', 'HP', s.hp, game.maxHp)}
    ${bar('mp', 'MP', s.mp, game.maxMp)}
    ${bar('exp', 'EXP', s.exp, game.expNeed)}
    <div class="statline">${Object.keys(STATS).map((k) => `<div title="${STATS[k].name}: ${STATS[k].blurb}"><b>${s.stats[k]}</b>${k}</div>`).join('')}</div>
    <div class="skills-mini">${source.testMode ? '<span class="chip red">TEST MODE</span>' : ''}<span class="chip red">${s.rerolls} reroll${s.rerolls === 1 ? '' : 's'}</span>${s.tetherArmed ? '<span class="chip">Tether ready</span>' : ''}${s.pendingTopic ? `<span class="chip">Next: ${esc(s.pendingTopic)}</span>` : ''}${skills}</div>
    <div class="hud-actions"><button class="btn small ghost link" data-act="quit">Save & quit</button><button class="btn small ghost link" data-act="howin">Help</button></div>
  </aside>`;
}

function renderGame() {
  const s = game.s;
  if (s.phase === 'defeat' || s.phase === 'victory') return showEnd();
  const sel = game.choices();
  const mapSvg = drawMap(s.map, { ...game.sight, selectable: sel });
  const hint = s.phase === 'map' ? (sel.length > 1 ? 'Choose a path together.' : 'Onward.') : '';
  app.innerHTML = `
  <div class="game">
    ${hudHTML()}
    <section class="board">
      <div class="board-head"><h2>${esc(MAPS[s.mapIndex].name)}</h2><span class="hint">${hint}</span></div>
      <div class="map-wrap" id="mapwrap">${mapSvg}</div>
    </section>
  </div>
  <div id="overlay"></div>`;
  scrollMapToNoah();
  app.onclick = onGameClick;
  renderOverlay();
}

function scrollMapToNoah() {
  const wrap = $('#mapwrap'); if (!wrap) return;
  const svg = $('svg.map', wrap);
  const s = game.s;
  const cur = s.map.current ? s.map.rows.flat().find((n) => n.id === s.map.current) : null;
  const [, y] = cur ? nodeXY(s.map, cur) : [0, svg.viewBox.baseVal.height];
  const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const target = y * scale - wrap.clientHeight * 0.62;
  wrap.style.scrollBehavior = 'auto';
  wrap.scrollTop = ui.lastMapScroll ?? target;
  wrap.style.scrollBehavior = '';
  requestAnimationFrame(() => { wrap.scrollTop = target; ui.lastMapScroll = target; });
}

function onGameClick(e) {
  const node = e.target.closest('.node.selectable');
  if (node && game.s.phase === 'map') {
    game.moveTo(node.dataset.id);
    ui.sel = null; ui.result = null;
    return renderGame();
  }
  const a = e.target.closest('[data-act]')?.dataset.act;
  if (a === 'quit') { game.save(); showTitle(); }
  if (a === 'howin') showHow();
}
app.addEventListener('keydown', (e) => {
  const n = e.target.closest?.('.node.selectable');
  if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); n.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
});

// ── Overlays ──────────────────────────────────────────────────
function renderOverlay() {
  const s = game.s;
  const ov = $('#overlay');
  stopTimer();
  if (s.phase === 'question' || s.phase === 'boss') return renderQuestion(ov);
  if (s.phase === 'bossIntro') return renderBossIntro(ov);
  if (s.phase === 'event') return renderEvent(ov);
  if (s.phase === 'levelup') return renderLevelUp(ov);
  if (s.phase === 'mapClear') return renderMapClear(ov);
  ov.innerHTML = '';
}

function answerContent(a) {
  return typeof a === 'string' ? esc(a) : drawShape(a.shape, 'opt');
}

function renderQuestion(ov) {
  const s = game.s, cq = s.q, q = cq.q;
  const boss = s.boss;
  const res = ui.result;
  const answered = cq.answered !== null;
  const stars = '★'.repeat(cq.tier) + '☆'.repeat(4 - cq.tier);
  const tools = [];
  for (const k of Object.keys(SKILLS)) if (s.skills[k]) {
    const t = SKILLS[k].tiers[s.skills[k] - 1];
    tools.push(`<button class="tool" data-skill="${k}" ${game.canCast(k) && !answered ? '' : 'disabled'} title="${esc(t.desc)}">${t.name} <span class="mp">${game.skillCost(k)} MP</span></button>`);
  }
  const canEasier = statFx.tierDrop(s.stats.C) > cq.dropped && cq.tier > 1;
  tools.push(`<button class="tool" data-act="reroll" ${s.rerolls > 0 && !answered ? '' : 'disabled'} title="Swap for a different question">↻ Reroll <span class="muted">(${s.rerolls})</span></button>`);
  if (statFx.tierDrop(s.stats.C) > 0) tools.push(`<button class="tool" data-act="easier" ${s.rerolls > 0 && canEasier && !answered ? '' : 'disabled'} title="Charisma: reroll into an easier question">"Come on, this is too hard!" ↓★</button>`);

  const visual = q.visual?.type === 'sequence'
    ? `<div class="seq">${q.visual.items.map((it, i) => drawShape(it, 'seq' + i)).join('')}<div class="qmark">?</div></div>` : '';

  const bossStage = boss ? `
    <div class="boss-stage">
      <div>${drawNoah(s.level, { size: 120 })}</div>
      <div>${drawBoss(s.mapIndex, { hurt: res && res.right })}</div>
    </div>
    <div class="q-top">
      <div><div class="boss-name">${esc(boss.name)}</div>
      <div class="pips" title="Questions">${Array.from({ length: 5 }, (_, i) => `<span class="pip ${i < boss.asked ? 'done' : ''}"></span>`).join('')}
        <span class="small muted" style="margin-left:8px">Mistakes: ${boss.mistakes}/${game.bossMistakesAllowed()}</span></div></div>
    </div>` : '';

  ov.innerHTML = `
  <div class="overlay">
    <div class="panel ${boss ? 'boss-panel' : ''}">
      ${bossStage}
      <div class="q-top">
        <div class="q-topic">${esc(q.topic)}${q.subtopic && q.subtopic !== q.topic ? ' › ' + esc(q.subtopic) : ''} · <span class="stars" title="${TIERS[cq.tier].name}">${stars}</span>
          ${q.returning ? '<div class="returning">↺ One you missed before</div>' : ''}
          ${cq.safe ? '<div class="returning" style="color:var(--green)">No harm if wrong</div>' : ''}</div>
        <div class="timer" id="timer"><svg viewBox="0 0 60 60"><circle class="t-bg" cx="30" cy="30" r="25"/><circle class="t-fg" cx="30" cy="30" r="25" stroke-dasharray="157" stroke-dashoffset="0"/></svg><span class="t-num"></span></div>
      </div>
      <div class="q-prompt">${esc(q.prompt)}</div>
      ${visual}
      <div class="answers">
        ${q.answers.map((a, i) => {
          let cls = '';
          if (cq.removed.includes(i)) cls = 'removed';
          if (answered) { if (i === q.correct) cls = 'right'; else if (i === cq.answered) cls = 'wrong'; }
          else if (ui.sel === i) cls = 'sel';
          return `<button class="answer ${cls}" data-ans="${i}" ${answered ? 'disabled' : ''}><span class="key">${'ABCD'[i]}</span><span>${answerContent(a)}</span></button>`;
        }).join('')}
      </div>
      ${game.hints().length ? `<div class="hints">${game.hints().map((h) => `<p>${esc(h)}</p>`).join('')}</div>` : ''}
      ${!answered ? `
      <div class="conf"><div class="lbl">How sure is the group?</div><div class="opts">
        ${CONFIDENCE.map((c, i) => `<button class="${cq.confidence === i ? 'on' : ''}" data-conf="${i}">${c.label}<small>×${c.exp} EXP · ×${c.dmg} hurt</small></button>`).join('')}
      </div></div>
      <div class="tools">${tools.join('')}</div>
      <div class="lockrow"><span class="kbd">1–4 to choose · Enter to lock in</span><button class="btn primary" data-act="lock" ${ui.sel === null ? 'disabled' : ''}>Lock in our answer</button></div>`
      : resultHTML()}
    </div>
  </div>`;

  ov.onclick = onQuestionClick;
  if (!answered) startTimer();
  else { const t = $('#timer'); t.style.visibility = 'hidden'; }
}

function resultHTML() {
  const r = ui.result, s = game.s;
  if (!r) return '';
  const fx = [];
  if (r.exp) fx.push(`<span class="chip">+${r.exp} EXP</span>`);
  if (r.mp) fx.push(`<span class="chip">+${r.mp} MP</span>`);
  if (r.dmg) fx.push(`<span class="chip red">−${r.dmg} HP</span>`);
  if (r.tethered) fx.push(`<span class="chip">The tether held — no harm done</span>`);
  if (r.levelUps) fx.push(`<span class="chip red">Level up! ✦</span>`);
  const title = r.right ? pick(['Yes!', 'Right!', 'Got it!', 'Nicely done.', 'Exactly.']) : r.timeout ? 'Out of time…' : pick(['Not quite.', 'Oh no…', 'Missed it.', 'The fog thickens.']);
  const last = r.defeat ? 'See what happened' : s.boss && s.boss.asked >= 5 ? 'Finish the boss' : 'Continue';
  return `<div class="result ${r.right ? 'good' : 'bad'}"><h3>${title}</h3>
    ${!r.right ? `<div>The answer was <b>${answerText(r.correctIndex)}</b>.</div>` : ''}
    <div class="fx">${fx.join('')}</div></div>
    <div class="lockrow"><button class="btn primary" data-act="next">${last} ➜</button></div>`;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function answerText(i) { const a = game.s.q.q.answers[i]; return typeof a === 'string' ? esc(a) : 'option ' + 'ABCD'[i]; }

function startTimer() {
  const total = game.timer;
  const el = $('#timer'); if (!el) return;
  const fg = $('.t-fg', el), num = $('.t-num', el);
  const tick = () => {
    const cq = game.s.q;
    if (!cq || cq.answered !== null) return stopTimer();
    const frozen = cq.frozenUntil > Date.now();
    const left = Math.max(0, Math.min(total, total - (Date.now() - cq.startedAt) / 1000));
    fg.style.strokeDashoffset = String(157 * (1 - left / total));
    num.textContent = Math.ceil(left);
    el.classList.toggle('low', left < 8 && !frozen);
    el.classList.toggle('frozen', frozen);
    if (left <= 0 && !frozen) { stopTimer(); lockIn(-1); }
  };
  tick();
  ui.timerId = setInterval(tick, 250);
}

function lockIn(index) {
  const r = game.answer(index);
  if (!r) return;
  r.timeout = index === -1;
  ui.result = r; ui.sel = null;
  stopTimer();
  // refresh HUD numbers and the question panel
  const hud = $('.hud'); if (hud) hud.outerHTML = hudHTML();
  renderQuestion($('#overlay'));
}

function onQuestionClick(e) {
  const t = e.target.closest('button'); if (!t) return;
  const cq = game.s.q;
  if (t.dataset.ans !== undefined && cq.answered === null) { ui.sel = +t.dataset.ans; return renderQuestion($('#overlay')); }
  if (t.dataset.conf !== undefined) { game.setConfidence(+t.dataset.conf); return renderQuestion($('#overlay')); }
  if (t.dataset.skill) {
    const msg = game.cast(t.dataset.skill);
    if (msg) toast(msg);
    if (ui.sel !== null && cq.removed.includes(ui.sel)) ui.sel = null;
    const hud = $('.hud'); if (hud) hud.outerHTML = hudHTML();
    return renderQuestion($('#overlay'));
  }
  const a = t.dataset.act;
  if (a === 'reroll' || a === 'easier') {
    if (game.reroll(a === 'easier')) { ui.sel = null; toast(a === 'easier' ? 'Fine — an easier one.' : 'A new question drifts in.'); }
    const hud = $('.hud'); if (hud) hud.outerHTML = hudHTML();
    return renderQuestion($('#overlay'));
  }
  if (a === 'lock' && ui.sel !== null) return lockIn(ui.sel);
  if (a === 'next') {
    const wasDefeat = ui.result?.defeat;
    ui.result = null; ui.sel = null;
    if (wasDefeat) return showEnd();
    game.continueAfterAnswer();
    return renderGame();
  }
}

document.addEventListener('keydown', (e) => {
  if (!game.s || e.target.tagName === 'INPUT') return;
  const ph = game.s.phase;
  if ((ph === 'question' || ph === 'boss') && game.s.q) {
    if (game.s.q.answered === null) {
      const i = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
      if (i >= 0 && i < game.s.q.q.answers.length && !game.s.q.removed.includes(i) && e.key.length === 1) { ui.sel = i; renderQuestion($('#overlay')); }
      else if (e.key === 'Enter' && ui.sel !== null) { e.preventDefault(); lockIn(ui.sel); }
    } else if (e.key === 'Enter') { e.preventDefault(); $('[data-act=next]')?.click(); }
  }
});

function renderBossIntro(ov) {
  const s = game.s, allowed = game.bossMistakesAllowed();
  ov.innerHTML = `
  <div class="overlay"><div class="panel">
    <div class="boss-stage"><div>${drawNoah(s.level, { size: 120 })}</div><div>${drawBoss(s.mapIndex)}</div></div>
    <h2>${esc(s.boss.name)}</h2>
    <p>A shape without a face stands where the path ends. It will ask <b>5 questions</b>.
    ${allowed === 1 ? '<b>One mistake</b> and Noah fades.' : `<b>${allowed} mistakes</b> and Noah fades.`}
    Each wrong answer also tears away ${Math.round(MAPS[s.mapIndex].bossDmg * 100)}% of his remaining HP.</p>
    <p class="muted" style="margin-top:8px">This is what you saved your mana for.</p>
    <div class="lockrow"><button class="btn red" data-act="fight">Face it together</button></div>
  </div></div>`;
  ov.onclick = (e) => { if (e.target.closest('[data-act=fight]')) { game.beginBossFight(); renderGame(); } };
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
    <div class="lockrow">
      ${ev.topics ? ev.topics.map((t) => `<button class="btn" data-topic="${esc(t)}">${esc(t)}</button>`).join('') + '<button class="btn ghost small link" data-act="ok">None of these</button>'
        : `<button class="btn primary" data-act="ok">${ev.fx?.question ? 'Answer it' : 'Continue'} ➜</button>`}
    </div>
  </div></div>`;
  ov.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.topic) { game.resolveEvent(t.dataset.topic); toast(`The next question will be about ${t.dataset.topic}.`); }
    else if (t.dataset.act === 'ok') game.resolveEvent(null);
    else return;
    renderGame();
  };
}

function statGain(k) {
  const v = game.s.stats[k], n = v + 1;
  switch (k) {
    case 'S': return `Confidence bonus ×${statFx.strengthBonus(v).toFixed(2)} → ×${statFx.strengthBonus(n).toFixed(2)}`;
    case 'P': return `See ${statFx.sightRows(n)} row${statFx.sightRows(n) > 1 ? 's' : ''} ahead${statFx.sightTier(n) ? ' + difficulty' : statFx.sightCategory(n) ? ' + topics' : ''}`;
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
      <p>Noah's outline grows a little clearer. ${noahTier(s.level) > noahTier(s.level - 1) ? `<b>He's becoming a ${NOAH_TIERS[noahTier(s.level)].name}.</b>` : ''}</p>
      <p class="muted">${skillMode ? `Choose a new skill or upgrade one (${s.skillPicks} to choose).` : `Agree on where to put ${s.statPoints > 1 ? `your ${s.statPoints} points (one at a time)` : 'your point'}.`}</p></div>
    </div>
    <div class="stat-grid">
      ${skillMode ? game.skillOptions().map((o) => `<button class="stat-card" data-skill="${o.key}"><span class="val">${o.mp} MP</span><div class="name">${o.upgrade ? '↑ ' : ''}${o.name}</div><div class="blurb">${esc(o.desc)}</div></button>`).join('')
        : Object.entries(STATS).map(([k, st]) => `<button class="stat-card" data-stat="${k}"><span class="val">${s.stats[k]}</span><div class="name">${st.name}</div><div class="blurb">${esc(st.blurb)}</div><div class="gain">${statGain(k)}</div></button>`).join('')}
    </div>
  </div></div>`;
  ov.onclick = (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.stat) game.spendStat(t.dataset.stat);
    else if (t.dataset.skill) game.pickSkill(t.dataset.skill);
    else return;
    renderGame();
  };
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
}

// ── End of a run ──────────────────────────────────────────────
function showEnd() {
  stopTimer();
  const s = game.s, win = s.phase === 'victory';
  const entry = game.lastEntry || Game.leaderboard().find((r) => r.party === s.partyName);
  const score = game.score();
  game.clearSave();
  app.innerHTML = `
  ${win ? '<div class="home-light"></div>' : ''}
  <div class="screen center end ${win ? 'victory' : 'defeat'}">
    <h1 class="title" style="font-size:clamp(2.6rem,9vw,4.6rem)">${win ? 'Noah is home.' : 'Noah fades into the fog…'}</h1>
    <div class="end-noah">${drawNoah(win ? Math.max(12, s.level) : s.level, { size: 150 })}</div>
    <p class="tagline">${win ? 'The beacon on the summit lights a door he remembers. Thank you for walking with him.' : `He made it to ${esc(MAPS[s.mapIndex].name)}. Next time, the way may be clearer.`}</p>
    <div class="scorebig" style="margin-top:10px">${score.toLocaleString()}</div>
    <p class="muted">${s.tally.maps} map${s.tally.maps === 1 ? '' : 's'} cleared · ${s.tally.nodes} nodes · ${s.tally.correct} right answers · level ${s.level}</p>
    <div class="row" style="margin-top:20px">
      <button class="btn primary" data-act="again">Walk again</button>
      <button class="btn" data-act="board">Leaderboard</button>
      <button class="btn ghost link" data-act="title">Title</button>
    </div>
  </div>`;
  app.onclick = (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'again') showSetup();
    if (a === 'board') showBoard(entry);
    if (a === 'title') showTitle();
  };
}

document.title = TITLE;
showTitle();

// expose for debugging / playtesting in the console
window.noah = { game, source };
