// The Midnight Gallery — world: the state of one night and how it changes.
// Movement, collision, patrols, vision cones, cameras, the alarm, loot and
// the win/lose rules all live here. Rendering never mutates the world; it
// only reads it, so a screenshot is always a true frame of play.

import {
  ROOM, FURNITURE, PEDESTAL, EXIT, SPAWN, GUARDS, CAMERAS,
  SIDE_LOOT, SAPPHIRE, ALARM, THIEF, COIN, SCORING,
} from './config.js';
import { sounds } from './audio.js';

export function createWorld() {
  return {
    phase: 'title', // title | playing | caught | won
    time: 0,
    alarm: 0,
    coins: COIN.count,
    lootValue: 0,
    picked: new Set(),
    sapphire: false,
    grabProgress: 0, // 0..1 while standing at the pedestal
    thief: { x: SPAWN.x, y: SPAWN.y, facing: 0, moving: false, sneaking: false, stepTimer: 0 },
    guards: GUARDS.map((g) => ({
      name: g.name, def: g, wp: 0, x: g.waypoints[0][0], y: g.waypoints[0][1],
      angle: 0, pause: 0.6, mode: 'patrol', // patrol | investigate | chase
      investigate: null, investigateTimer: 0, chaseTimer: 0, seesThief: false,
      // Where the guard last saw the thief. A chase runs to this spot, never
      // to the thief's live position: breaking line of sight is a real escape.
      lastSeen: null,
    })),
    cameras: CAMERAS.map((c) => ({ ...c, angle: c.baseAngle, t: Math.random() * 6 })),
    coinsThrown: [],
    notice: '', // one-line hint shown under the HUD, e.g. "Mara heard the coin"
    noticeTimer: 0,
    endReason: '',
    finalScore: 0,
  };
}

// --- geometry helpers -------------------------------------------------------

function rectsOverlapCircle(rect, cx, cy, r) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

function circleHitsFurniture(x, y, r) {
  if (x < ROOM.wall + r || x > ROOM.w - ROOM.wall - r) return true;
  if (y < ROOM.wall + r || y > ROOM.h - ROOM.wall - r) return true;
  return FURNITURE.some((f) => rectsOverlapCircle(f, x, y, r));
}

// Does the segment from (x0,y0) to (x1,y1) cross any furniture rectangle?
// Used for line of sight: a case between a guard and the thief breaks the cone.
function segmentBlocked(x0, y0, x1, y1) {
  for (const f of FURNITURE) {
    if (segmentHitsRect(x0, y0, x1, y1, f)) return true;
  }
  return false;
}

function segmentHitsRect(x0, y0, x1, y1, r) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x0 < r.x || x0 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x0) / dx;
    let t2 = (r.x + r.w - x0) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y0 < r.y || y0 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y0) / dy;
    let t2 = (r.y + r.h - y0) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can `eye` see `target`? Within range, inside the half-angle, and with a
// clear line of sight past the furniture.
function canSee(eye, target, range, halfAngle, facing) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 26) return true; // bumping into a guard is always seen
  if (Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfAngle) return false;
  return !segmentBlocked(eye.x, eye.y, target.x, target.y);
}

// --- per-frame update -------------------------------------------------------

export function updateWorld(world, input, dt) {
  if (world.phase !== 'playing') return;
  world.time += dt;
  if (world.noticeTimer > 0) world.noticeTimer -= dt;

  const t = world.thief;
  const mv = moveVectorOf(input);
  const sneaking = isSneakingOf(input);
  t.sneaking = sneaking;
  t.moving = !!mv;
  if (mv) {
    const speed = sneaking ? THIEF.sneak : THIEF.walk;
    const nx = t.x + mv.x * speed * dt;
    const ny = t.y + mv.y * speed * dt;
    if (!circleHitsFurniture(nx, t.y, THIEF.radius)) t.x = nx;
    if (!circleHitsFurniture(t.x, ny, THIEF.radius)) t.y = ny;
    t.facing = Math.atan2(mv.y, mv.x);
    t.stepTimer -= dt;
    if (t.stepTimer <= 0) {
      sounds.step(sneaking);
      t.stepTimer = sneaking ? 0.42 : 0.30;
    }
  }

  // A tossed coin: the nearest guards walk over to look. It costs one coin.
  if (input.coinTossed && input.coinTarget) {
    tossCoin(world, input.coinTarget);
    input.coinTossed = false;
  }

  updateCameras(world, dt);
  updateGuards(world, dt);
  updateAlarm(world, dt);
  updateLoot(world, dt);
  updateWinLose(world);
}

function moveVectorOf(input) {
  const k = input.keys;
  let x = 0;
  let y = 0;
  if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
  if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
  if (k.has('KeyW') || k.has('ArrowUp')) y -= 1;
  if (k.has('KeyS') || k.has('ArrowDown')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

function isSneakingOf(input) {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}

function tossCoin(world, target) {
  if (world.coins <= 0 || world.phase !== 'playing') return;
  const t = world.thief;
  const dx = target.x - t.x;
  const dy = target.y - t.y;
  const dist = Math.hypot(dx, dy);
  if (dist > COIN.range) return; // too far to throw
  world.coins -= 1;
  const landing = { x: target.x, y: target.y, timer: 0.9 };
  world.coinsThrown.push(landing);
  sounds.coin();
  let heard = false;
  for (const g of world.guards) {
    if (Math.hypot(g.x - target.x, g.y - target.y) < COIN.hear) {
      g.mode = 'investigate';
      g.investigate = { x: target.x, y: target.y };
      g.investigateTimer = COIN.investigateSeconds;
      heard = true;
    }
  }
  if (heard) {
    world.notice = 'A guard heard the coin and went to look.';
    world.noticeTimer = 3;
  }
  setTimeout(() => sounds.clink(), 350);
}

function updateCameras(world, dt) {
  for (const c of world.cameras) {
    c.t += dt;
    c.angle = c.baseAngle + Math.sin(c.t * c.speed) * c.sweep;
  }
}

function updateGuards(world, dt) {
  const t = world.thief;
  for (const g of world.guards) {
    g.seesThief = canSee(g, t, g.def.range, g.def.halfAngle, g.angle);
    if (g.mode === 'investigate') {
      g.investigateTimer -= dt;
      const target = g.investigate;
      const dx = target.x - g.x;
      const dy = target.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        const step = Math.min(dist, g.def.speed * 1.25 * dt);
        g.x += (dx / dist) * step;
        g.y += (dy / dist) * step;
        g.angle = Math.atan2(dy, dx);
      } else {
        g.angle += dt * 1.4; // look around the spot
      }
      if (g.investigateTimer <= 0) {
        g.mode = 'patrol';
        g.investigate = null;
      }
      continue;
    }
    if (g.mode === 'chase') {
      g.chaseTimer -= dt;
      // Chase the last place the thief was SEEN, not the thief: ducking
      // behind a display case breaks the chase, and the guard searches
      // the spot instead of homing in on the thief.
      const target = g.lastSeen || { x: t.x, y: t.y };
      const dx = target.x - g.x;
      const dy = target.y - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        const step = Math.min(dist, g.def.speed * 1.45 * dt);
        g.x += (dx / dist) * step;
        g.y += (dy / dist) * step;
        g.angle = Math.atan2(dy, dx);
      } else {
        g.angle += dt * 1.6; // look around the spot
      }
      if (g.chaseTimer <= 0 && !g.seesThief) {
        g.mode = 'patrol';
        g.lastSeen = null;
      }
      continue;
    }
    // Patrol: walk to the next waypoint, pause at each corner.
    if (g.pause > 0) {
      g.pause -= dt;
      if (g.pause <= 0) {
        g.wp = (g.wp + 1) % g.def.waypoints.length;
      }
      continue;
    }
    const [wx, wy] = g.def.waypoints[g.wp];
    const dx = wx - g.x;
    const dy = wy - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 5) {
      g.pause = g.def.pause;
      continue;
    }
    const step = Math.min(dist, g.def.speed * dt);
    g.x += (dx / dist) * step;
    g.y += (dy / dist) * step;
    g.angle = Math.atan2(dy, dx);
  }
}

function updateAlarm(world, dt) {
  const t = world.thief;
  let seenByGuard = false;
  let seenByCamera = false;
  for (const g of world.guards) {
    if (g.seesThief) {
      seenByGuard = true;
      // A fresh sighting refreshes the chase: the guard runs to where the
      // thief was just seen and keeps looking while the trail is warm.
      g.lastSeen = { x: t.x, y: t.y };
      if (world.alarm < ALARM.chaseAt) {
        g.mode = 'chase';
        g.chaseTimer = 2.5;
      }
    }
  }
  for (const c of world.cameras) {
    if (canSee(c, t, c.range, c.halfAngle, c.angle)) seenByCamera = true;
  }
  const sneak = t.sneaking ? ALARM.sneakFactor : 1;
  const wasSeen = seenByGuard || seenByCamera;
  if (seenByGuard) {
    world.alarm += ALARM.guardRate * sneak * dt;
    if (!world._spotted) {
      sounds.spotted();
      world.notice = 'SPOTTED — break line of sight!';
      world.noticeTimer = 2;
    }
  } else if (seenByCamera) {
    world.alarm += ALARM.cameraRate * sneak * dt;
    if (!world._spotted) {
      sounds.spotted();
      world.notice = 'A camera has you — move!';
      world.noticeTimer = 2;
    }
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM.decay * dt);
  }
  world._spotted = wasSeen;
  if (world.alarm >= 80 && !world._alarmHigh) sounds.alarm();
  world._alarmHigh = world.alarm >= 80;
  world.alarm = Math.min(ALARM.caughtAt, world.alarm);
}

function updateLoot(world, dt) {
  const t = world.thief;
  for (const item of SIDE_LOOT) {
    if (world.picked.has(item.id)) continue;
    if (Math.hypot(t.x - item.x, t.y - item.y) < THIEF.radius + item.r + 6) {
      world.picked.add(item.id);
      world.lootValue += item.value;
      sounds.pickup();
      world.notice = `${item.name} pocketed — $${item.value.toLocaleString()}.`;
      world.noticeTimer = 3;
    }
  }
  // The sapphire needs a steady hand: stand at the pedestal and hold still.
  const dPed = Math.hypot(t.x - PEDESTAL.x, t.y - PEDESTAL.y);
  if (!world.sapphire && dPed < PEDESTAL.r + THIEF.radius + 14) {
    world.grabProgress += dt / SAPPHIRE.grabSeconds;
    if (world.grabProgress >= 1) {
      world.sapphire = true;
      world.lootValue += SAPPHIRE.value;
      sounds.sapphire();
      world.notice = 'STAR SAPPHIRE pocketed — get to the skylight exit!';
      world.noticeTimer = 4;
    }
  } else {
    world.grabProgress = Math.max(0, world.grabProgress - dt * 1.5);
  }
}

function updateWinLose(world) {
  const t = world.thief;
  if (world.alarm >= ALARM.caughtAt) {
    world.phase = 'caught';
    world.endReason = 'The alarm hit 100% — the gallery locked down.';
    sounds.caught();
    return;
  }
  if (
    world.sapphire &&
    t.x > EXIT.x && t.x < EXIT.x + EXIT.w &&
    t.y > EXIT.y && t.y < EXIT.y + EXIT.h
  ) {
    world.phase = 'won';
    const timeBonus = Math.max(0, SCORING.maxTimeBonus - Math.floor(world.time) * SCORING.timeBonusPerSecond);
    world.finalScore = world.lootValue + timeBonus;
    world.endReason = `Clean getaway in ${Math.floor(world.time)}s.`;
    sounds.win();
  }
}
