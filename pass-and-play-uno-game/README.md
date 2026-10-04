# 🎴 UNO Royale — 10-Player Pass & Play

Party UNO for **2–10 players on a single device**. Everyone crowds around one phone, takes their
turn, and passes it on. Full official deck, wilds, skips, reverses, draw penalties, a UNO call
window, and juicy screen-shake / confetti feedback.

**▶ Play:** https://01a10577-3224-7886-831c-42ac5c114972.arena.site/

---

## ✨ Features

- **2–10 players, one device.** Configurable roster with names, avatars, and per-seat human/bot toggle.
- **Privacy hand-off screens.** Between every turn the hand is hidden behind an opaque
  "PASS THE PHONE" screen, so the next player never sees the previous player's cards.
- **Official 108-card deck** and official matching / action-card rules.
- **UNO call window** — drop to one card and you get ~4 seconds to shout it, or draw 2.
- **Bots** — flip any seat to a bot to fill empty chairs or play solo.
- **Juice:** canvas particles, screen shake, card flight animations, haptics, and a WebAudio synth
  SFX kit (zero audio assets).
- **Local high-score table** and persisted settings via `localStorage`.
- **60fps on desktop and mobile.** Single rAF FX loop that idles at zero cost; compositor-only
  card flights via the Web Animations API.
- **Keyboard + touch** controls throughout.

---

## 🎮 How to play

1. Pick a player count (2–10), name everyone, and optionally mark seats as bots.
2. Choose a match target (200 / 300 / 500 points).
3. Deal. Each player gets **7 cards**.
4. On your turn the phone shows a hand-off screen — tap to reveal **your** hand.
5. Match the top card by **colour**, **number**, or **symbol**, or play a wild.
6. Can't play? Tap the deck to draw one card. If it plays, you may throw it down immediately.
7. First to empty their hand wins the round and banks everyone's card points.
8. First to the target score wins the match.

### Cards

| Card | Effect |
| --- | --- |
| Number (0–9) | Match colour or number |
| ⦸ Skip | Next player loses their turn |
| ⇄ Reverse | Flips direction (acts as Skip in a 2-player game) |
| +2 Draw Two | Next player draws 2 and is skipped |
| ★ Wild | Play on anything; choose the next colour |
| +4 Wild Draw Four | Play **only if you hold no card of the current colour**; next player draws 4 and is skipped |

### UNO

Down to one card? A countdown appears — call **UNO!** in time (tap the button or press `U`) or draw
2 as a penalty.

### Scoring

The round winner scores the total value of every other player's remaining hand
(numbers = face value, action cards = 20, wilds = 50) plus a **+10 bonus** for having called UNO.

---

## ⌨️ Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Select card | Tap | `←` `→` or `1`–`9` |
| Play card | Tap card | `Enter` / `Space` |
| Draw | Tap deck / Draw button | `D` |
| Call UNO | UNO button | `U` |
| Pick wild colour | Tap a colour | `1`–`4` |
| Keep drawn card | Keep button | `K` |
| Pause | ⏸ button | `Esc` |

---

## 🛠 Tech stack

- **React 19** + **TypeScript**
- **Vite 7** (single-file production build via `vite-plugin-singlefile`)
- **Tailwind CSS 4**
- Web Animations API + Canvas 2D + WebAudio — no animation or audio dependencies

Game state lives in a **pure reducer** (`src/game/engine.ts`) with no side effects, so every
transition is deterministic and every action is validated against the current phase.

---

## 🚀 Getting started

Requires **Node 18+** (Node 20 recommended).

```bash
git clone https://github.com/meeran-ahmed/uno-game.git
cd uno-game
npm install
npm run dev      # start the dev server
```

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check + build a self-contained `dist/index.html` |
| `npm run preview` | Preview the production build locally |

---

## 📁 Project structure

```
src/
├── App.tsx                  # Orchestration: screens, FX wiring, input, overlays
├── game/
│   ├── cards.ts             # Deck composition, shuffle, matching rules
│   ├── engine.ts            # Pure reducer: phases, turns, penalties, scoring, invariants
│   └── storage.ts           # localStorage: settings + high scores
├── components/
│   ├── StartScreen.tsx      # Roster setup, rules, hall of fame
│   ├── TableCenter.tsx      # Draw pile, discard pile, active colour, direction ring
│   ├── HandArea.tsx         # Card fan for the active player
│   ├── OpponentRail.tsx     # Opponent chips + live score strip
│   ├── UnoCard.tsx          # Card rendering (pure SVG/CSS, no images)
│   ├── Overlays.tsx         # Hand-off, UNO, colour picker, pause, round/match end, help
│   └── ui.tsx               # Buttons / panels / chips
└── fx/
    ├── index.ts             # Particle engine, screen shake, synth SFX
    └── fly.ts               # DOM card-flight animations (Web Animations API)
```

---

## 🌐 Deploying

`npm run build` emits a **single self-contained `dist/index.html`** — all JS and CSS are inlined, so
it can be dropped on any static host (GitHub Pages, Netlify, Vercel, S3, or even opened from disk)
with no base-path configuration.

An optional GitHub Actions workflow is included at
`.github/workflows/deploy-pages.yml`. To use it, push to `main` and set
**Settings → Pages → Source → GitHub Actions** once. Delete the `.github/` folder if you don't
want automatic deploys.

---

## ✅ QA notes

The game has been audited across **2, 3, 4, 5, 6, 7, 8, 9 and 10 players**, including:

- Deck composition and card conservation (exactly 108 cards at all times, each card in exactly one place)
- Turn-order matrix for 10 players, forward and reversed
- Skip / Reverse / +2 / +4 interactions, including 2-player edge cases
- Wild Draw Four legality restriction and colour selection
- Draw-pile exhaustion and repeated discard reshuffles
- Win detection on every card type, including finishing on a penalty card
- Pass-and-play privacy (no DOM, animation, or refresh leak of another player's hand)
- Rapid-click / duplicate-action protection
- State-consistency assertions that self-report to the console if an invariant ever breaks

---

## 📄 License

MIT — see [LICENSE](LICENSE).
