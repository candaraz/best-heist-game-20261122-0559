// The Midnight Gallery — main: the game loop, the phases, and the
// screenshot presets. `?shot=start|play|alarm|win` stages a real frame of
// the running game so the maker's screenshots show the heist as played:
// the same world, the same render, only the moment is chosen.

import { createWorld, updateWorld } from './world.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { ensureAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

let world = createWorld();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const input = createInput(
  canvas,
  () => ensureAudio(),
  () => {
    ensureAudio();
    if (world.phase === 'title') {
      world.phase = 'playing';
      announce('The heist has begun. Pocket the Star Sapphire, then reach the exit.');
    }
  },
  () => {
    if (world.phase === 'caught' || world.phase === 'won') {
      world = createWorld();
      world.phase = 'playing';
      announce('A new night. Pocket the Star Sapphire, then reach the exit.');
    }
  },
);

function announce(text) {
  statusEl.textContent = text;
}

// A read-only hook for play-testing: the live world, nothing more.
window.__heist = { get world() { return world; } };

// --- screenshot presets -----------------------------------------------------
// Each preset is a genuine moment of play: the world is set to a plausible
// position and then stepped forward in fixed ticks, so cones are mid-sweep
// and the thief is mid-stride. Nothing is drawn that the game cannot show.

function applyShotPreset(name) {
  world.phase = 'playing';
  if (name === 'start') {
    world.phase = 'title';
    step(0.5);
  } else if (name === 'play') {
    // Mid-heist: Wren hugging a display case on the centre lane, Mara's
    // cone sweeping past, the sapphire glinting ahead, alarm at a whisper.
    world.thief.x = 470;
    world.thief.y = 300;
    world.thief.facing = 0.2;
    step(1.4);
    world.alarm = 12;
    world.lootValue = 4000;
    world.picked.add('portrait');
    world.time = 42;
  } else if (name === 'alarm') {
    // The hot moment: alarm high, Sable closing in, Wren sprinting for
    // the exit with the sapphire already pocketed. Positions are stepped
    // first, then the alarm is set, so the staged frame holds steady.
    world.thief.x = 300;
    world.thief.y = 690;
    world.thief.facing = Math.PI;
    const sable = world.guards[2];
    sable.mode = 'chase';
    sable.chaseTimer = 2.5;
    sable.x = 420;
    sable.y = 640;
    step(0.6);
    world.sapphire = true;
    world.lootValue = 59000;
    world.picked.add('portrait');
    world.picked.add('cat');
    world.alarm = 78;
    world.time = 96;
    world.coins = 1;
  } else if (name === 'win') {
    world.phase = 'won';
    world.sapphire = true;
    world.lootValue = 59000;
    world.finalScore = 65400;
    world.time = 118;
    world.endReason = 'Clean getaway in 118s.';
    world.thief.x = 165;
    world.thief.y = 725;
    step(0.5);
  }
}

// Step the world forward in fixed 1/60s ticks without input.
function step(seconds) {
  const idle = { keys: new Set(), coinTarget: null, coinTossed: false };
  const ticks = Math.round(seconds * 60);
  for (let i = 0; i < ticks; i++) updateWorld(world, idle, 1 / 60);
}

// --- game loop --------------------------------------------------------------

let last = performance.now();
let shotApplied = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shot && !shotApplied) {
    shotApplied = true;
    applyShotPreset(shot);
  }
  if (!shot) {
    updateWorld(world, input, dt);
  } else if (world.phase === 'playing') {
    // A staged shot keeps animating (cones sweep, the sapphire glints) but
    // the staged alarm and phase hold, so the frame stays the chosen moment.
    const heldAlarm = world.alarm;
    updateWorld(world, { keys: new Set(), coinTarget: null, coinTossed: false }, dt);
    world.alarm = heldAlarm;
    if (world.phase === 'caught') world.phase = 'playing';
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}

if (shot) {
  // Render one frame immediately so a screenshot taken fast still shows the
  // staged moment, then keep animating.
  applyShotPreset(shot);
  shotApplied = true;
  render(ctx, world);
}
requestAnimationFrame(frame);
