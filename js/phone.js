// Phone controller. Opened from the QR code (…?join=CODE). Shows the
// question so each person can read it and pick privately; picks are revealed
// together on the big screen. Every button on the big screen is mirrored here
// too, so the game can be driven entirely from phones.
import { CONFIDENCE, TIERS } from './config.js';
import { drawNoah, drawShape, drawVisual, drawSwatch } from './art.js';
import { ID_PREFIX, loadPeer, peerOptions } from './remote.js';
import { Sound } from './audio.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const letter = (i) => 'ABCD'[i];
const get = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };

export function startPhone(code) {
  document.body.classList.add('phone-mode');
  const app = $('#app');
  const clientId = get('noah_client', null) || (() => { const id = 'p' + Math.random().toString(36).slice(2, 10); set('noah_client', id); return id; })();
  let name = get('noah_name', '');
  let peer = null, conn = null, state = null, myVote = null, status = 'idle', lastKey = null, soundedKey = null;

  function showJoin(msg = '') {
    app.innerHTML = `
    <div class="screen center phone-join">
      <div class="title-noah">${drawNoah(1, { size: 110 })}</div>
      <h1 class="title small-title">Noah<span class="colon">:</span> Way Home</h1>
      <p class="muted">Joining room <b class="room-code inline">${esc(code)}</b></p>
      <label class="stack" style="width:100%;max-width:320px;margin-top:14px">
        <span>Your name</span>
        <input type="text" id="pname" maxlength="16" placeholder="e.g. Sam" value="${esc(name)}" autocomplete="nickname">
      </label>
      <button class="btn primary" id="joinbtn" style="margin-top:16px">Join the journey</button>
      ${msg ? `<p class="note" style="margin-top:14px">${esc(msg)}</p>` : ''}
    </div>`;
    const go = () => { name = $('#pname').value.trim() || 'Friend'; set('noah_name', name); connect(); };
    $('#joinbtn').onclick = go;
    $('#pname').onkeydown = (e) => { if (e.key === 'Enter') go(); };
  }

  // Connecting: phone → PeerJS broker → the big screen (WebRTC data channel).
  // Each step has a timeout, so a phone never sits on "Connecting…" forever;
  // it tears everything down and tries again, and after a couple of misses
  // shows tips plus a Try again button.
  let attempt = 0, fails = 0, openTimer = null;
  function cleanup() {
    clearTimeout(openTimer);
    try { conn?.close(); } catch {}
    try { peer?.destroy(); } catch {}
    conn = null; peer = null;
  }
  async function connect() {
    clearTimeout(retryTimer);
    cleanup();
    status = 'connecting';
    attempt++;
    const mine = attempt;
    renderStatus('Reaching the phone server…');
    try {
      const Peer = await loadPeer();
      peer = new Peer(undefined, peerOptions());
      peer.on('error', (e) => {
        if (mine !== attempt) return;
        if (e.type === 'peer-unavailable') { cleanup(); status = 'idle'; showJoin(`Couldn't find room ${code}. Check the code on the big screen, and that it's still open.`); }
        else if (status !== 'connected') retrySoon(e.type);
      });
      peer.on('disconnected', () => { if (peer && !peer.destroyed && status === 'connected') setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1500); });
      await new Promise((res, rej) => { peer.once('open', res); setTimeout(() => rej(new Error('server timeout')), 12000); });
      if (mine !== attempt) return;
      renderStatus('Found the room — connecting to the big screen…');
      // JSON is the most compatible way to send data (some Android browsers
      // stall with PeerJS's default binary packing).
      conn = peer.connect(ID_PREFIX + code, { reliable: true, serialization: 'json' });
      openTimer = setTimeout(() => { if (mine === attempt && status !== 'connected') retrySoon('timeout'); }, 12000);
      conn.on('open', () => {
        if (mine !== attempt) return;
        clearTimeout(openTimer);
        status = 'connected'; fails = 0;
        conn.send({ t: 'hello', clientId, name });
        renderStatus('Connected! Look at the big screen.');
      });
      conn.on('data', (m) => { if (m && m.t === 'state') { state = m; render(); } });
      conn.on('error', () => { if (mine === attempt && status !== 'connected') retrySoon('conn'); });
      conn.on('close', () => { if (mine === attempt && status === 'connected') { status = 'lost'; state = null; retrySoon('lost'); } });
    } catch { if (mine === attempt) retrySoon('server'); }
  }
  let retryTimer = null;
  function retrySoon() {
    clearTimeout(retryTimer);
    clearTimeout(openTimer);
    status = 'retrying';
    fails++;
    renderStatus(fails >= 2 ? 'Still trying to reach the big screen…' : 'Reconnecting…', fails >= 2);
    retryTimer = setTimeout(connect, Math.min(8000, 1500 + fails * 1000));
  }
  function renderStatus(text, help = false) {
    if (state && status === 'connected') return;
    app.innerHTML = `<div class="screen center"><div class="title-noah">${drawNoah(1, { size: 100 })}</div><p class="tagline">${esc(text)}</p>
      ${help ? `<div class="note" style="max-width:340px;margin-top:14px;text-align:left">
        <b>Having trouble?</b><br>• Put this phone on the <b>same Wi-Fi</b> as the big screen (not mobile data).<br>• Open the link in <b>Chrome</b> (or Safari), not inside the camera or Lens app — tap ⋮ → “Open in Chrome”.<br>• Check the code: <b>${esc(code)}</b>.</div>
        <div class="row" style="margin-top:14px"><button class="btn primary" id="tryagain">Try again now</button><button class="btn small ghost link" id="changename">Change name</button></div>` : ''}</div>`;
    const ta = $('#tryagain'); if (ta) ta.onclick = () => connect();
    const cn = $('#changename'); if (cn) cn.onclick = () => { clearTimeout(retryTimer); cleanup(); attempt++; fails = 0; status = 'idle'; showJoin(); };
  }
  const send = (m) => { try { conn?.open && conn.send(m); } catch {} };

  function answerHTML(a) {
    if (typeof a === 'string') return esc(a);
    if (a.shape) return drawShape(a.shape, 'opt');
    if (a.swatch) return `${drawSwatch(a.swatch)}${esc(a.text)}`;
    return esc(a.text || '');
  }
  function playerName(id) { return state.players.find((p) => p.id === id); }

  function render() {
    const s = state;
    const q = s.q;
    if (q && q.key !== lastKey) { lastKey = q.key; myVote = null; }
    if (s.you?.vote) myVote = s.you.vote;
    if (q && q.answered && q.result && soundedKey !== q.key) { soundedKey = q.key; q.result.right ? Sound.good() : Sound.bad(); }
    const hud = s.hud ? `<div class="p-hud">
      <div class="p-noah">${drawNoah(s.hud.level, { size: 46 })}</div>
      <div class="p-bars"><div class="p-where">${esc(s.hud.map)} · Lv ${s.hud.level}</div>
        <div class="bar hp"><span class="lbl">HP</span><div class="track"><div class="fill" style="width:${(100 * s.hud.hp) / s.hud.maxHp}%"></div></div><span class="num">${Math.round(s.hud.hp)}</span></div>
        <div class="bar mp"><span class="lbl">MP</span><div class="track"><div class="fill" style="width:${(100 * s.hud.mp) / s.hud.maxMp}%"></div></div><span class="num">${s.hud.mp}</span></div>
      </div><div class="p-me">${esc(name)}</div></div>` : `<div class="p-hud simple"><span>📱 ${esc(name)} · room ${esc(code)}</span></div>`;

    let body = '';
    if (q) {
      const done = q.answered;
      const votes = q.votes || [];
      body += `<div class="p-q">
        <div class="q-topic">${q.boss ? `<b>${esc(q.boss.name)}</b> · ` : ''}${esc(q.topic)} · <span class="stars">${'★'.repeat(q.tier)}${'☆'.repeat(4 - q.tier)}</span></div>
        <div class="q-prompt">${esc(q.prompt)}</div>
        ${drawVisual(q.visual)}
        <div class="answers ${done ? 'done' : ''}">
        ${q.answers.map((a, i) => {
          const removed = q.removed.includes(i);
          let cls = removed ? 'removed' : '';
          if (done) cls += i === q.correct ? ' right' : i === q.chosen ? ' wrong' : '';
          else if (myVote && myVote.i === i) cls += ` sel conf${myVote.c}`;
          if (q.team && q.team.i === i && !done) cls += ' team';
          const zones = done || removed ? '' : `<div class="zones">${CONFIDENCE.map((c, k) => {
            const here = q.revealed ? votes.filter((v) => v.i === i && v.c === k).map((v) => playerName(v.id)).filter(Boolean) : [];
            return `<button class="zone z${k} ${myVote && myVote.i === i && myVote.c === k ? 'on' : ''}" data-i="${i}" data-c="${k}"><span class="zl">${c.label}</span><span class="zchips">${here.map((p) => `<span class="vchip" style="background:${p.color}">${esc(p.name[0].toUpperCase())}</span>`).join('')}</span></button>`;
          }).join('')}</div>`;
          const badge = q.team && q.team.i === i && !done ? `<span class="team-badge">Team · ${CONFIDENCE[q.team.c].label}</span>` : '';
          return `<div class="answer ${cls}"><div class="a-body"><span class="key">${letter(i)}</span><span class="a-text">${answerHTML(a)}</span>${badge}</div>${zones}</div>`;
        }).join('')}
        </div>
        ${q.hints?.length ? `<div class="hints">${q.hints.map((h) => `<p>${esc(h)}</p>`).join('')}</div>` : ''}
        ${done ? `<div class="result ${q.result?.right ? 'good' : 'bad'}"><h3>${q.result?.right ? 'Right!' : 'Not quite.'}</h3>${q.result?.exp ? `<span class="chip">+${q.result.exp} EXP</span>` : ''}${q.result?.dmg ? `<span class="chip red">−${q.result.dmg} HP</span>` : ''}</div>`
          : `<div class="p-status">${myVote ? `Your pick: <b>${letter(myVote.i)} · ${CONFIDENCE[myVote.c].label}</b>. ` : 'Tap the left, middle or right of an answer. '}${q.revealed ? 'Everyone\'s picks are shown — talk it over!' : `${q.voted.length}/${s.players.filter((p) => p.connected).length} have picked.`}</div>
          ${q.revealed && myVote ? '<button class="btn" id="usemine">Use my pick as the team answer</button>' : ''}`}
      </div>`;
    } else {
      body += `<div class="p-panel"><h2>${esc(s.title)}</h2>${s.text ? `<p>${esc(s.text)}</p>` : ''}</div>`;
    }
    // Mirrored buttons from the big screen
    const acts = s.actions || [];
    if (acts.length) {
      let lastSec = null;
      body += `<div class="p-actions">${q && !q.answered ? '<div class="p-sec">Team controls</div>' : ''}${acts.map((a) => {
        let head = '';
        if (a.section && a.section !== lastSec) { head = `<div class="p-sec">${esc(a.section)}</div>`; lastSec = a.section; }
        return `${head}<button class="pbtn ${a.primary ? 'primary' : ''} ${a.on ? 'on' : ''} ${a.lock ? 'lock' : ''}" data-rid="${a.rid}">${a.on ? '✓ ' : ''}${esc(a.label)}</button>`;
      }).join('')}</div>`;
    }
    app.innerHTML = `<div class="phone">${hud}${body}</div>`;
    app.onclick = (e) => {
      const z = e.target.closest('.zone');
      if (z || e.target.closest('#usemine, .pbtn')) Sound.click();
      if (z) { myVote = { i: +z.dataset.i, c: +z.dataset.c }; send({ t: 'vote', key: state.q.key, ...myVote }); navigator.vibrate?.(15); return render(); }
      if (e.target.closest('#usemine')) { send({ t: 'useMine' }); navigator.vibrate?.(15); return; }
      const b = e.target.closest('.pbtn');
      if (b) { send({ t: 'action', rid: b.dataset.rid, rv: state.rv }); b.classList.add('pressed'); navigator.vibrate?.(15); }
    };
  }

  if (name) connect(); else showJoin();
}
