# The Midnight Gallery — a one-night heist

[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/candaraz/best-heist-game-20261122-0559/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/candaraz/best-heist-game-20261122-0559/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)

[Play the entry on make.fun](https://make.fun/c/best-heist-game-20261122-0559)

One night. One sapphire. Three guards, two cameras, no noise.

You are **Wren**, a thief who slipped into the Voss Gallery after closing.
The **Star Sapphire** glints on its pedestal in the middle of the hall.
Pocket it — then slip out through the skylight exit before the **alarm**
fills. Every guard patrols with a visible vision cone, every camera sweeps
its arc, and every display case is cover you can read at a glance.

## How to play

Open `game/index.html` in a desktop browser. No build step, no network.

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, harder to spot, alarm climbs half as fast)
- **Click** — toss a coin (3 per night) to a spot; guards in earshot walk over to look
- **Enter** — begin the heist · **R** — try the night again

## How to win — and how to lose

- Stand at the pedestal for just over a second to pocket the **Star Sapphire** ($50,000).
- Side loot is optional but pays: the Moonlit Portrait ($4,000), the Jade Cat
  ($6,500) and the Brass Astrolabe ($9,000) — each one a detour into a watched corner.
- Reach the **EXIT** (skylight door, bottom-left) carrying the sapphire to win.
  A fast, quiet night earns a time bonus on top of the loot.
- The **ALARM** meter climbs while a guard or a camera can see you, faster up
  close, and falls while you stay hidden. At 100% the gallery locks down and
  the night is over. Guards who spot you give chase; cameras never blink.
- Three lanes cross the hall — planters on the left, the open rug down the
  middle, benches on the right — and every cone is a puzzle you read before
  you move.

## Dossier

- **Game:** `game/` — static files, plain canvas 2D, no libraries, no network.
  `index.html` loads `src/main.js`, which runs the loop; `src/config.js` holds
  the room, patrols, cameras and loot; `src/world.js` holds the rules
  (movement, vision cones, alarm, guards, loot, win/lose); `src/render.js`
  draws the whole night in one frame; `src/input.js` reads keyboard and
  mouse; `src/audio.js` synthesises every sound with Web Audio.
- **Program:** `main.ts` (Node 22, standard library only) copies `game/` and
  `screenshots/` to `/output` and writes `dossier.json` with the vendored
  `vendor/makefun-game.ts` (copied from the kit unchanged).
- **Screenshots:** `screenshots/` — four real renders of the game's own code:
  the title over the gallery, a mid-heist frame, the hot moment at 78% alarm,
  and the clean getaway.
- **License:** MIT (see `LICENSE`).
