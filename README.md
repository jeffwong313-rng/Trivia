# Noah: Way Home

A cooperative trivia adventure. Noah is a lost little boy, about six — at first barely a pencil sketch — holding a red balloon. The journey opens on a white page that fades into Noah waking up in a field of grass. Answer questions together to guide him up through eight lands, past fog, hedges and faceless guardians, until he finds his way home. Every level he gains, his drawing fills in a little more.

**Play:** turn on GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main` / root). No build step, no accounts.

## How it plays

- **One team, one Noah.** Everyone shares one HP bar, one mana bar, one answer. No turns, no roles.
- **Party size = difficulty**, not different rules: Solo 0.8× · Partner 1.9× · Trio 3.25× · Quartet 4.5× · Party (5+) 5.75×.
- **Answer + confidence in one tap.** Each answer is split in three: left = *not sure*, middle = *sure*, right = *definitely*. Then **Lock in** (bottom right).
- **No timer.** Speed still adds a small score bonus that fades out at 2 minutes.
- **Map:** almost every step offers 3 paths. *Perception* reveals each path's topic (level 2) and difficulty (level 3).
- **Difficulty ramp:** map 1 is nearly all easy questions; it climbs steadily from there. Bosses: map 1 ends on the 3rd mistake, maps 2–5 on the 2nd, maps 6–8 on the 1st.
- **Topics screen:** 34 topics, all on by default — untick anything the group doesn't want.
- **⚑ Flag question** (too niche / incomplete question / other + optional note): it's pulled from the game, the party gets a free replacement on the same topic, and it's saved under **Flagged questions** on the title screen. Review each one: *Delete from bank* or *Keep it*. Then **Copy removal list** and paste it over `js/removed.js` on GitHub to remove those questions for everyone.
- **Tutorial:** a short S.P.E.C.I.A.L. walkthrough at the start of each journey, with *Skip Tutorial*. **Settings** (title screen or ⚙ in game): turn off tutorials, the opening story, piano music or sound effects, and set the volume.
- **Sound:** soft taps and gentle right/wrong chimes, plus a slow, quiet piano theme that loops seamlessly — all synthesized in the browser (no audio files).
- **Topics screen:** an **All set — set off** button at the very top skips straight past the topic list. Open Trivia DB questions about exact years, release dates, episodes, album tracks etc. are filtered out automatically; landmark dates (1776, 1969, 2001…) come from the hand-written bank.
- **Stats (SPECIAL + Luck)**, **skills** every 4 levels (Eliminate → 50/50 → Truth, Hint ladder, Second Guess, Ghostly Tether), `?` events, campfires, 8 biomes, auto-save, local leaderboard.

- **Easy-only topics:** Quick Math, Spelling and Emoji only appear at levels 1–2 (old levels 1–2 → 1, 3–4 → 2). Tune with `maxTier` in `js/config.js`.
- **Second Guess:** lock in **two** answers and submit them together. Right pair = half EXP, no damage; wrong pair = damage and the correct one is shown.
- **Reroll** and **flag** replacements stay on the same topic.
- **Boss fights** switch to a dark palette with their own sounds (a low drone, brass stabs); it returns to light afterwards.
- **Leaderboard 🏆** (title screen, and in the HUD): every finished journey is saved with squad name, players, score, difficulty, party size, maps, nodes, accuracy, stats, skills and play time. Name your squad on the setup screen or phone, or rename it on the end screen. Filter by difficulty/party size; export, copy or import the list. Stored on that device (`noah_board`).

- **Answer reveal:** the right answer always shows, with a "Learn more on Google" link. Optional **auto explanations**: a short "why" written by Claude through a tiny Cloudflare Worker that holds your API key (setup in `worker/README.md`, then paste its URL in Settings). Cached on the device; without it, nothing changes. Bank rows can also carry a hand-written `{"e": "…"}` explanation.

## Question bank

`js/bank.json` holds the reviewed questions (27,580 rows marked **Keep** in the review sheet; Fix, Cut and unreviewed rows are left out). The game always draws from it first. When a topic runs low (Sports, TV, Tech, Vehicles, Video Games, Books, Board games have ~50 each), Open Trivia DB tops it up online, skipping any question the sheet marked Fix / Cut / unreviewed. Brain teasers are still generated fresh.

## TV + phones

1. Open the game on whatever drives the TV (laptop on HDMI, a cast Chrome tab, or a TV browser) and choose **Play on a TV with phones**.
2. Everyone scans the QR code (or opens the game on their phone, taps **Join a game**, and types the 4-letter code).
3. Each phone shows the question. As people tap, their picks show live on the TV and on every phone. Once everyone has picked (or you tap **Go without them** on the TV), **Choose this for the team** appears next to each answer; the chosen answer lights up on the TV, and anyone can **Lock in** from a phone, agreed or not. Phones also have a **Squad name** box (it names the run on the leaderboard).
4. Phones mirror every button on the TV screen — paths, level-ups, setup, topics — so the game can be run entirely from phones.

Phones connect straight to the TV page with WebRTC via PeerJS's free public broker (no accounts or server to run). If a phone can't connect within ~20 seconds it starts over automatically, and after two misses shows tips and a **Try again** button. Phones work best on the same Wi-Fi as the big screen, opened in Chrome or Safari (not inside the camera / Lens app). A keyboard or TV remote also works: arrows move, Enter selects, 1–4 picks an answer (press again to change how sure). Several STUN servers are tried, and the phone's "Having trouble?" screen shows the last error. On networks that block direct connections, add your own relay with `?turn=turn:host:3478,user,password` (remembered on that device).

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
js/questions.js     question supply: reviewed bank first, Open Trivia DB top-up, hints
js/bank.json        the question bank — only rows marked Keep in the review sheet
js/puzzles.js       brain teasers: colors, spelling, math, patterns, shapes, riddles, word play, odd one out, emoji
js/art.js           Noah, bosses, shapes, map — all drawn as sketchy SVG
js/main.js          big-screen UI, keyboard/remote navigation
js/remote.js        phone room (PeerJS)
js/audio.js         settings, sound effects, piano theme (Web Audio)
js/explain.js       optional auto explanations (asks your Worker)
js/feedback.js      flagged questions saved for review
js/removed.js       question IDs removed for everyone (paste from the review screen)
js/phone.js         phone controller UI
js/vendor/          PeerJS 1.5.4 and qrcode-generator 1.4.4 (both MIT)
```

When uploading by hand, keep the `css/`, `js/` and `js/vendor/` folders — files dropped loose at the top level won't be found.
