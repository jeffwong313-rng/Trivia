# Noah: Way Home

A cooperative trivia adventure. Noah is a lost little boy — at first barely a pencil sketch — holding a red balloon. Answer questions together to guide him up through eight lands, past fog, hedges and faceless guardians, until he finds his way home. Every level he gains, his drawing fills in a little more.

**Play:** turn on GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main` / root). No build step, no accounts.

## How it plays

- **One team, one Noah.** Everyone shares one HP bar, one mana bar, one answer. No turns, no roles.
- **Party size = difficulty**, not different rules: Solo 0.8× · Partner 1.9× · Trio 3.25× · Quartet 4.5× · Party (5+) 5.75×.
- **Answer + confidence in one tap.** Each answer is split in three: left = *not sure*, middle = *sure*, right = *definitely*. Then **Lock in** (bottom right).
- **No timer.** Speed still adds a small score bonus that fades out at 2 minutes.
- **Map:** almost every step offers 3 paths. *Perception* reveals each path's topic (level 2) and difficulty (level 3).
- **Difficulty ramp:** map 1 is nearly all easy questions; it climbs steadily from there. Bosses: map 1 ends on the 3rd mistake, maps 2–5 on the 2nd, maps 6–8 on the 1st.
- **Topics screen:** 34 topics, all on by default — untick anything the group doesn't want.
- **Too obscure?** Flag a question: free swap, never shown again. Open Trivia DB questions about exact years, release dates, episodes, album tracks etc. are filtered out automatically; landmark dates (1776, 1969, 2001…) come from the hand-written bank.
- **Stats (SPECIAL + Luck)**, **skills** every 4 levels (Eliminate → 50/50 → Truth, Hint ladder, Second Guess, Ghostly Tether), `?` events, campfires, 8 biomes, auto-save, local leaderboard.

## TV + phones

1. Open the game on whatever drives the TV (laptop on HDMI, a cast Chrome tab, or a TV browser) and choose **Play on a TV with phones**.
2. Everyone scans the QR code (or opens the game on their phone, taps **Join a game**, and types the 4-letter code).
3. Each phone shows the question; people pick privately. When everyone has picked, the picks are revealed on the TV, you discuss, someone taps **Use my pick as the team answer** (or adjusts on the TV), and anyone locks it in.
4. Phones mirror every button on the TV screen — paths, level-ups, setup, topics — so the game can be run entirely from phones.

Phones connect straight to the TV page with WebRTC via PeerJS's free public broker (no accounts or server to run). A keyboard or TV remote also works: arrows move, Enter selects, 1–4 picks an answer (press again to change how sure).

## Test mode

Click either "a" in the title 10 times in a row. Every question becomes "Questions: Testing in progress" (A = Answer, B–D = Wrong). Test runs stay off the leaderboard. Same again to turn it off.

## Tuning

Every number lives in **`js/config.js`**: party scaling, modes, tier EXP/damage, confidence, per-map difficulty, boss rules, the EXP curve, stat formulas, skills and the topic list.

## Files

```
index.html          page shell
css/style.css       paper-and-pencil look (scales up on TVs)
js/config.js        all the numbers + topic list
js/game.js          rules and run state
js/map.js           branching map generator
js/questions.js     Open Trivia DB (filtered) + hand-written bank + hints
js/puzzles.js       brain teasers: colors, spelling, math, patterns, shapes, riddles, word play, odd one out, emoji
js/art.js           Noah, bosses, shapes, map — all drawn as sketchy SVG
js/main.js          big-screen UI, keyboard/remote navigation
js/remote.js        phone room (PeerJS)
js/phone.js         phone controller UI
js/vendor/          PeerJS 1.5.4 and qrcode-generator 1.4.4 (both MIT)
```

When uploading by hand, keep the `css/`, `js/` and `js/vendor/` folders — files dropped loose at the top level won't be found.
