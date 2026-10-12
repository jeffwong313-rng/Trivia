// Optional auto-explanations: asks the user's own Worker (see worker/README.md)
// for a short "why" after an answer. Fails quietly: no URL, no internet or a slow
// reply just means no explanation is shown.
import { answerText } from './questions.js';

const KEY = 'noah_explain_url', CACHE = 'noah_explain_cache';
export function explainUrl() {
  let u = new URLSearchParams(location.search).get('explain');
  try { if (u) localStorage.setItem(KEY, u); else u = localStorage.getItem(KEY); } catch {}
  return /^(https:\/\/|http:\/\/localhost)/.test(u || '') ? u : '';
}
export function setExplainUrl(u) { try { u ? localStorage.setItem(KEY, u.trim()) : localStorage.removeItem(KEY); } catch {} }

const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE)) || {}; } catch { return {}; } };

export async function fetchExplain(q) {
  const url = explainUrl();
  if (!url || !q || q.kind !== 'trivia' || q.test || !q.id) return '';
  const cache = readCache();
  if (cache[q.id]) return cache[q.id];
  const a = answerText(q.answers?.[q.correct]);
  if (!a) return '';
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 9000);
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ q: q.prompt, a }), signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return '';
    const text = String((await r.json()).text || '').trim();
    if (text) {
      cache[q.id] = text;
      const keys = Object.keys(cache);
      if (keys.length > 300) for (const k of keys.slice(0, keys.length - 300)) delete cache[k];
      try { localStorage.setItem(CACHE, JSON.stringify(cache)); } catch {}
    }
    return text;
  } catch { return ''; }
}
