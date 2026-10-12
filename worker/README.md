# Auto-explanations (optional)

The game can write a short "why" after each trivia answer. It asks a tiny
Cloudflare Worker, which holds your Claude API key so the key is never in the game.
Without it the game works exactly as before.

1. Create a free Cloudflare account → **Workers & Pages → Create → Worker**. Name it e.g. `noah-explain`, deploy, then **Edit code** and paste in `explain-worker.js`.
2. **Settings → Variables and Secrets**: add secret `ANTHROPIC_API_KEY` (your key from console.anthropic.com), and text `ALLOWED_ORIGIN` = your game's site, e.g. `https://jeffwong313-rng.github.io` (no trailing slash or path).
3. Optional: **Security → WAF → Rate limiting** rule (e.g. 30 requests/minute per IP) so nobody can run up your bill. Also set a monthly spend limit in the Anthropic console.
4. In the game: **Settings → Auto explanations**, paste the Worker URL (`https://noah-explain.<you>.workers.dev`). Or open the game once with `?explain=<that URL>`.

Each explanation is ~100 tokens, a fraction of a cent, and is cached on the device so a repeated question costs nothing.
