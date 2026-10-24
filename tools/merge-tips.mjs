// Merges hand-written tips (tips/<topic>.json: { "<normalised question>": "tip" }) and
// the review sheet's tips into js/bank.json as the {"e": "..."} extra on each row.
//   node tools/merge-tips.mjs
import { readFile, writeFile, readdir } from 'node:fs/promises';
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
const bankPath = new URL('../js/bank.json', import.meta.url);
const bank = JSON.parse(await readFile(bankPath, 'utf8'));
const tips = {};
for (const f of (await readdir(new URL('../tips/', import.meta.url))).filter((n) => n.endsWith('.json')).sort())
  Object.assign(tips, JSON.parse(await readFile(new URL('../tips/' + f, import.meta.url), 'utf8')));
let withTip = 0;
for (const row of bank.q) {
  const last = row[row.length - 1];
  const extra = last && typeof last === 'object' ? last : null;
  const t = tips[norm(row[2])];
  if (t) { if (extra) extra.e = t; else row.push({ e: t }); }
  if ((extra && extra.e) || t) withTip++;
}
await writeFile(bankPath, JSON.stringify(bank));
console.log(`bank rows with a tip: ${withTip} / ${bank.q.length}`);
