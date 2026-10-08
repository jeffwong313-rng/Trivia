// Branching node map: rows from the bottom (row 0) up to the boss.
// Rows alternate 4 and 5 nodes (3 at the start) and every node links to the
// 3 nearest nodes above, so nearly every step offers 3 paths to choose from.
import { MODES, MAPS, REST_CHANCE, TOPICS, partyTierShift, statFx } from './config.js';

const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Typical difficulty: the map's base tier + mode + party size + a slight climb
// through the map, plus a little randomness.
export function rollTier(mode, partyMult, mapIndex, progress = 0, extra = 0) {
  const mean = MAPS[mapIndex].avgTier + MODES[mode].tierOffset + partyTierShift(partyMult) + progress * 0.3 + extra;
  const t = mean + (Math.random() - 0.5) * 0.9;
  const whole = Math.floor(t), frac = t - whole;
  return Math.max(1, Math.min(4, whole + (Math.random() < frac ? 1 : 0)));
}

export function generateMap(mapIndex, ctx) {
  const { mode, partyMult, agility, topics } = ctx;
  const def = MAPS[mapIndex];
  const rows = [];
  const mysteryChance = statFx.mysteryChance(agility);
  let topicBag = [];
  const nextTopic = (avoid) => {
    if (!topicBag.length) topicBag = shuffle(topics);
    let i = topicBag.findIndex((t) => !avoid.has(t));
    if (i < 0) i = 0;
    return topicBag.splice(i, 1)[0];
  };

  for (let r = 0; r < def.rows; r++) {
    const count = r === 0 ? 3 : r % 2 ? 4 : 5;
    const spacing = { 3: 0.27, 4: 0.22, 5: 0.185 }[count];
    const row = [];
    const used = new Set();
    for (let c = 0; c < count; c++) {
      const x = 0.5 + (c - (count - 1) / 2) * spacing + (Math.random() - 0.5) * 0.03;
      let type = 'question';
      const roll = Math.random();
      if (r > 0 && roll < mysteryChance) type = 'mystery';
      else if (r > 2 && r < def.rows - 1 && roll < mysteryChance + REST_CHANCE) type = 'rest';
      const node = { id: `${r}-${c}`, row: r, col: c, x, type, next: [], visited: false };
      if (type === 'question') {
        node.topic = nextTopic(used);
        used.add(node.topic);
        node.tier = rollTier(mode, partyMult, mapIndex, r / def.rows);
      }
      row.push(node);
    }
    rows.push(row);
  }
  rows.push([{ id: `${def.rows}-0`, row: def.rows, col: 0, x: 0.5, type: 'boss', next: [], visited: false }]);

  for (let r = 0; r < rows.length - 1; r++) {
    const up = rows[r + 1];
    for (const n of rows[r]) {
      n.next = [...up].sort((a, b) => Math.abs(a.x - n.x) - Math.abs(b.x - n.x)).slice(0, 3).sort((a, b) => a.x - b.x).map((u) => u.id);
    }
    // Make sure two choices from one node never share a topic, when we can help it
    for (const n of rows[r]) {
      const seenT = new Set();
      for (const id of n.next) {
        const u = up.find((k) => k.id === id);
        if (u.topic && seenT.has(u.topic) && topics.length > 3) {
          const rowTopics = new Set(up.map((k) => k.topic));
          const alt = shuffle(topics).find((t) => !rowTopics.has(t) && !seenT.has(t));
          if (alt) u.topic = alt;
        }
        if (u.topic) seenT.add(u.topic);
      }
    }
  }
  return { index: mapIndex, name: def.name, biome: def.biome, rows, current: null };
}

export function findNode(map, id) {
  for (const row of map.rows) for (const n of row) if (n.id === id) return n;
  return null;
}

export function choices(map) {
  if (!map.current) return map.rows[0];
  const cur = findNode(map, map.current);
  return cur.next.map((id) => findNode(map, id));
}

export const isPuzzleTopic = (id) => TOPICS[id]?.kind === 'puzzle';
