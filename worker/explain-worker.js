// Cloudflare Worker: turns a trivia question + right answer into a short
// explanation using the Claude API. The API key lives only here (as a secret),
// never in the game. See worker/README.md for the 5-minute setup.
//
// Variables (Worker → Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  (secret)  your key
//   ALLOWED_ORIGIN     (text)    where the game is hosted, e.g. https://jeffwong313-rng.github.io
//   MODEL              (text, optional) defaults to claude-haiku-5-5

const clip = (s, n) => String(s ?? '').slice(0, n);

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGIN || '';
    const ok = allowed && origin === allowed;
    const cors = {
      'Access-Control-Allow-Origin': ok ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST' || !ok) return new Response('Not allowed', { status: 403, headers: cors });

    let body;
    try { body = await req.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }
    const q = clip(body.q, 400), a = clip(body.a, 200);
    if (!q || !a) return new Response('Bad request', { status: 400, headers: cors });

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: env.MODEL || 'claude-haiku-5-5',
        max_tokens: 160,
        system: 'You write the "why" for a family-friendly trivia game. Given a question and its correct answer, reply with 1-2 short, plain sentences (under 45 words) that explain why that answer is right or give one interesting related fact. Stay factual; if you are not sure of a detail, leave it out. No preamble, no markdown.',
        messages: [{ role: 'user', content: `Question: ${q}\nCorrect answer: ${a}` }],
      }),
    });
    if (!r.ok) return new Response('Upstream error', { status: 502, headers: cors });
    const data = await r.json();
    const text = clip((data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join(' ').trim(), 400);
    return new Response(JSON.stringify({ text }), { headers: { ...cors, 'content-type': 'application/json' } });
  },
};
