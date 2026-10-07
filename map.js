// Branching node map: rows from the bottom (row 0) up to the boss.
// Each row has 2–4 nodes; each node links to 1–3 nodes in the next row.
import { MODES, MAPS, PUZZLE_CHANCE, REST_CHANCE, partyTierShift, statFx } from './config.js';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function rollTier(mode, partyMult, mapIndex, progress /* 0..1 through map */, extraShift = 0) {
  const w = MODES[mode].tierWeights;
  const total = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * total, base = 1;
  for (let i = 0; i < 4; i++) { if (r < w[i]) { base = i + 1; break; } r -= w[i]; }
  const shift = partyTierShift(partyMult) + MAPS[mapIndex].tierBump + progress * 0.4 + extraShift;
  const t = base + shift;
  const whole = Math.floor(t), frac = t - whole;
  return Math.max(1, Math.min(4, whole + (Math.random() < frac ? 1 : 0)));
}

export function generateMap(mapIndex, ctx) {
  const { mode, partyMult, agility, topics } = ctx;
  const def = MAPS[mapIndex];
  const rows = [];
  const mysteryChance = statFx.mysteryChance(agility);

  for (let r = 0; r < def.rows; r++) {
    const count = r === 0 ? rnd(2, 3) : rnd(2, 4);
    const row = [];
    for (let c = 0; c < count; c++) {
      const x = count === 1 ? 0.5 : 0.16 + (0.68 * c) / (count - 1) + (Math.random() - 0.5) * 0.06;
      let type = 'question';
      const roll = Math.random();
      if (r > 0 && roll < mysteryChance) type = 'mystery';
      else if (roll < mysteryChance + PUZZLE_CHANCE) type = 'puzzle';
      else if (r > 3 && r < def.rows - 1 && roll < mysteryChance + PUZZLE_CHANCE + REST_CHANCE) type = 'rest';
      const node = { id: `${r}-${c}`, row: r, col: c, x, type, next: [], visited: false };
      if (type === 'question' || type === 'puzzle') {
        node.tier = rollTier(mode, partyMult, mapIndex, r / def.rows);
        node.topic = type === 'puzzle' ? 'Puzzle' : pick(topics);
      }
      row.push(node);
    }
    rows.push(row);
  }
  // Boss at the top
  rows.push([{ id: `${def.rows}-0`, row: def.rows, col: 0, x: 0.5, type: 'boss', next: [], visited: false }]);

  // Connect rows: each node links to the nearest 1–2 nodes above; then make sure every node above is reachable.
  for (let r = 0; r < rows.length - 1; r++) {
    const cur = rows[r], up = rows[r + 1];
    for (const n of cur) {
      const sorted = [...up].sort((a, b) => Math.abs(a.x - n.x) - Math.abs(b.x - n.x));
      n.next.push(sorted[0].id);
      if (sorted[1] && Math.random() < 0.55 && Math.abs(sorted[1].x - n.x) < 0.45) n.next.push(sorted[1].id);
    }
    for (const u of up) {
      if (!cur.some((n) => n.next.includes(u.id))) {
        const nearest = [...cur].sort((a, b) => Math.abs(a.x - u.x) - Math.abs(b.x - u.x))[0];
        nearest.next.push(u.id);
      }
    }
  }
  return { index: mapIndex, name: def.name, biome: def.biome, rows, current: null /* node id; null = at the start */ };
}

export function findNode(map, id) {
  for (const row of map.rows) for (const n of row) if (n.id === id) return n;
  return null;
}

// Which nodes can the party move to now?
export function choices(map) {
  if (!map.current) return map.rows[0];
  const cur = findNode(map, map.current);
  return cur.next.map((id) => findNode(map, id));
}
