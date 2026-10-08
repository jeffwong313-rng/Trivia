// Phones ⇄ big screen, using PeerJS (WebRTC). The big screen opens a "room"
// with a short code; phones connect straight to it. PeerJS's free public
// server only introduces the devices — game data goes device to device.
// No accounts, no setup, works from GitHub Pages.
//
// For local testing you can point at your own PeerJS server: ?peer=localhost:9000

export const ID_PREFIX = 'noah-way-home-';
const COLORS = ['#c0392b', '#2f6db3', '#3f8a4a', '#b88a2c', '#7b4aa0', '#d2691e', '#1f8a8a', '#a0466e', '#5d6d7e', '#8a6d3b'];
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // no I or O (they look like 1 and 0)

export function peerOptions() {
  const p = new URLSearchParams(location.search).get('peer');
  const base = { debug: 0, config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };
  if (!p) return base;
  const [host, port] = p.split(':');
  return { ...base, host, port: +port || 9000, path: '/', secure: false };
}
export function joinUrl(code) {
  const peer = new URLSearchParams(location.search).get('peer');
  return `${location.origin}${location.pathname}?join=${code}${peer ? '&peer=' + encodeURIComponent(peer) : ''}`;
}

let peerLib = null;
export function loadPeer() {
  if (window.Peer) return Promise.resolve(window.Peer);
  if (peerLib) return peerLib;
  peerLib = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('./vendor/peerjs.min.js', import.meta.url).href;
    s.onload = () => (window.Peer ? resolve(window.Peer) : reject(new Error('PeerJS missing')));
    s.onerror = () => reject(new Error('Could not load PeerJS'));
    document.head.appendChild(s);
  });
  return peerLib;
}
let qrLib = null;
function loadQr() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (qrLib) return qrLib;
  qrLib = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = new URL('./vendor/qrcode.js', import.meta.url).href;
    s.onload = () => resolve(window.qrcode);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return qrLib;
}

export class Room {
  constructor(handlers) {
    this.h = handlers;
    this.players = [];           // { id, name, color, conn, connected }
    this.code = null;
  }

  async open() {
    const Peer = await loadPeer();
    await loadQr();
    let saved = null;
    try { saved = localStorage.getItem('noah_room'); } catch {}
    for (let attempt = 0; attempt < 6; attempt++) {
      const code = attempt === 0 && saved ? saved : Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
      try {
        await this.tryOpen(Peer, code);
        this.code = code;
        try { localStorage.setItem('noah_room', code); } catch {}
        return this;
      } catch (e) {
        if (e && e.type !== 'unavailable-id') throw e;
      }
    }
    throw new Error('No room code available');
  }

  tryOpen(Peer, code) {
    return new Promise((resolve, reject) => {
      const peer = new Peer(ID_PREFIX + code, peerOptions());
      let opened = false;
      peer.on('open', () => { opened = true; this.peer = peer; resolve(); });
      peer.on('error', (err) => {
        if (!opened) { peer.destroy(); reject(err); return; }
        if (err.type === 'network' || err.type === 'server-error') this.h.onError?.('Lost touch with the phone server — retrying…');
      });
      peer.on('disconnected', () => { if (!peer.destroyed) setTimeout(() => peer.reconnect(), 1500); });
      peer.on('connection', (conn) => this.accept(conn));
    });
  }

  accept(conn) {
    conn.on('data', (m) => {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'hello') {
        const name = String(m.name || 'Friend').slice(0, 16).trim() || 'Friend';
        let p = this.players.find((x) => x.id === m.clientId);
        if (!p) {
          p = { id: String(m.clientId || conn.peer), name, color: COLORS[this.players.length % COLORS.length], conn, connected: true };
          this.players.push(p);
        } else {
          if (p.conn && p.conn !== conn) try { p.conn.close(); } catch {}
          Object.assign(p, { name, conn, connected: true });
        }
        conn.player = p;
        this.h.onPlayers?.();
        return;
      }
      const p = conn.player;
      if (!p) return;
      if (m.t === 'vote') this.h.onVote?.(p, m);
      else if (m.t === 'action') this.h.onAction?.(p, m);
      else if (m.t === 'useMine') this.h.onUseMine?.(p);
    });
    conn.on('close', () => {
      const p = conn.player;
      if (p && p.conn === conn) { p.connected = false; this.h.onPlayers?.(); }
    });
  }

  broadcast(fn) {
    for (const p of this.players) if (p.connected && p.conn?.open) {
      try { p.conn.send(fn(p)); } catch {}
    }
  }

  qrSvg(text) {
    if (!window.qrcode) return '';
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }
}
