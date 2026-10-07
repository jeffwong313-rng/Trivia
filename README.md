# Noah: Way Home

A cooperative trivia adventure. Noah is a lost little boy — at first barely a pencil outline — holding a red balloon. Answer questions together to guide him up through eight lands, fog and hedges and faceless guardians, until he finds his way home. Every level he gains, his drawing fills in a little more.

**Play:** open `index.html` through any web server, or turn on GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main` / root). No build step.

## How it plays

- **One team, one Noah.** Everyone shares one HP bar, one mana bar, one answer. There are no turns or roles: talk it over, then lock in.
- **More friends = harder road**, not different rules. Party multiplier (from the design sheet): solo 0.8×, duo 1.9×, trio 3.25×, four 4.5×. It pushes questions toward harder tiers and makes wrong answers sting more. Groups get +10s on the timer to talk.
- **Map:** branching paths of 2–4 nodes per row, climbing upward. Fog hides what's ahead; Perception lifts it. Node types: question, puzzle, `?` mystery, rare campfire, and the boss at the top.
- **Confidence wager** on every answer: Unsure / I think / Sure / Certain. Higher = more EXP if right, more HP lost if wrong.
- **Stats (SPECIAL + Luck):** one point per level-up. Formulas in `js/config.js`.
- **Skills:** one new skill or upgrade every 4 level-ups — Eliminate → 50/50 → Truth, Subtle Hint → Hint → More than a Hint, Time Dilation, Ghostly Tether.
- **Bosses:** 5 questions, each mistake tears away a share of current HP. 2 mistakes ends the run; from map 4 on, 1 mistake does.
- **Eight lands:** Grassland Outskirts → Whispering Steppes → Shifting Dunes → Mirage Wastes → Craggy Foothills → Mistveiled Crags → Glacial Ascent → Beacon Summit.
- **Leaderboard:** saved on this device. Score = depth reached + correct answers, with a small speed bonus.
- Runs auto-save; close the tab and pick up later with *Continue*.

## Questions

- **Open Trivia DB** (free, thousands of questions, easy/medium/hard → tiers 1–3).
- **Generated puzzles:** number series, letter series, "which shape comes next", odd-one-out — endless and tiered.
- **Hand-written logic riddles** and a built-in fallback bank, used offline or if the API is busy.
- Questions you miss come back now and then (the sheet's "missed question recurrence").

## Tuning

Every number lives in **`js/config.js`**: party scaling, modes, tier EXP/damage, confidence, the EXP curve, stat formulas, skills, maps and bosses. After a few playtests, that's the only file you should need to touch.

## Files

```
index.html        page shell
css/style.css     paper-and-pencil look
js/config.js      all the numbers
js/game.js        rules and run state (one plain object, so online rooms can sync it later)
js/map.js         branching map generator
js/questions.js   Open Trivia DB + fallback bank + auto hints
js/puzzles.js     IQ-style puzzle generators and riddles
js/art.js         Noah, bosses, shapes and the map, all drawn as sketchy SVG
js/main.js        screens and controls
```

## Not yet

- **Online rooms** (each friend on their own phone): the game state is already a single serializable object; the next step is syncing it through a small free service such as Firebase.
- Boss special rules from the Skills_Combat tab (shuffling distractors, locked wagers, etc.).
