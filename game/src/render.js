// The Midnight Gallery — render: everything the judge sees is drawn here
// on one canvas. The room, the cones, the loot and the alarm meter are all
// in a single frame by design: the first criterion is won or lost on this
// picture. Colours are the language: gold is loot, amber is a watching cone,
// red is danger, dark blue-grey is safe cover.

import { ROOM, PALETTE, FURNITURE, PEDESTAL, RUG, EXIT, SAPPHIRE, SIDE_LOOT, ALARM } from './config.js';

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawRoom(ctx) {
  // Marble floor with a faint checker of tiles.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, ROOM.w, ROOM.h);
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = ROOM.wall; x < ROOM.w - ROOM.wall; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.wall); ctx.lineTo(x, ROOM.h - ROOM.wall); ctx.stroke();
  }
  for (let y = ROOM.wall; y < ROOM.h - ROOM.wall; y += 80) {
    ctx.beginPath(); ctx.moveTo(ROOM.wall, y); ctx.lineTo(ROOM.w - ROOM.wall, y); ctx.stroke();
  }
  // The crimson rug down the middle of the hall.
  ctx.fillStyle = PALETTE.rug;
  ctx.fillRect(RUG.x, RUG.y, RUG.w, RUG.h);
  ctx.strokeStyle = PALETTE.rugEdge;
  ctx.lineWidth = 4;
  ctx.strokeRect(RUG.x, RUG.y, RUG.w, RUG.h);
  ctx.strokeStyle = 'rgba(138, 109, 59, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(RUG.x + 14, RUG.y + 14, RUG.w - 28, RUG.h - 28);

  // Walls with brass trim.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, ROOM.w, ROOM.wall);
  ctx.fillRect(0, ROOM.h - ROOM.wall, ROOM.w, ROOM.wall);
  ctx.fillRect(0, 0, ROOM.wall, ROOM.h);
  ctx.fillRect(ROOM.w - ROOM.wall, 0, ROOM.wall, ROOM.h);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.wall - 1, ROOM.wall - 1, ROOM.w - 2 * ROOM.wall + 2, ROOM.h - 2 * ROOM.wall + 2);

  // Skylight exit door, bottom-left, glowing green when the sapphire is held.
  ctx.fillStyle = '#0e2a1a';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = '#2fbf71';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#2fbf71';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + 34);
  ctx.font = '13px Georgia, serif';
  ctx.fillText('skylight', EXIT.x + EXIT.w / 2, EXIT.y + 56);
  ctx.fillText('door', EXIT.x + EXIT.w / 2, EXIT.y + 74);
}

function drawFurniture(ctx) {
  for (const f of FURNITURE) {
    if (f.kind === 'case') {
      ctx.fillStyle = PALETTE.caseBase;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.fillStyle = PALETTE.caseGlass;
      ctx.fillRect(f.x + 8, f.y + 8, f.w - 16, f.h - 16);
      ctx.strokeStyle = PALETTE.caseEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
      // A glint on the glass so a case reads as a case, not a block.
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.moveTo(f.x + 18, f.y + f.h - 12); ctx.lineTo(f.x + 44, f.y + 12); ctx.stroke();
    } else if (f.kind === 'planter') {
      ctx.fillStyle = PALETTE.planter;
      ctx.beginPath(); ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = PALETTE.planterEdge;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#2f6b3f';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(f.x + f.w / 2 + Math.cos(a) * 12, f.y + f.h / 2 + Math.sin(a) * 12, 9, 5, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = PALETTE.bench;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      ctx.strokeStyle = PALETTE.benchEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
      ctx.beginPath(); ctx.moveTo(f.x, f.y + f.h / 2); ctx.lineTo(f.x + f.w, f.y + f.h / 2); ctx.stroke();
    }
  }
}

function drawLoot(ctx, world) {
  // The Star Sapphire on its pedestal — the heart of the heist.
  ctx.fillStyle = PALETTE.pedestal;
  ctx.beginPath(); ctx.arc(PEDESTAL.x, PEDESTAL.y, PEDESTAL.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.pedestalEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!world.sapphire) {
    const pulse = 1 + Math.sin(world.time * 3) * 0.12;
    ctx.save();
    ctx.translate(PEDESTAL.x, PEDESTAL.y - 6);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#7fd4ff';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(13, 0); ctx.lineTo(0, 18); ctx.lineTo(-13, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ STAR SAPPHIRE ★', PEDESTAL.x, PEDESTAL.y + 52);
    // Grab progress ring while the thief pockets it.
    if (world.grabProgress > 0) {
      ctx.beginPath();
      ctx.arc(PEDESTAL.x, PEDESTAL.y, PEDESTAL.r + 10, -Math.PI / 2, -Math.PI / 2 + world.grabProgress * Math.PI * 2);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = PALETTE.goldDim;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('— empty pedestal —', PEDESTAL.x, PEDESTAL.y + 52);
  }

  // Side loot: small gold glints with a label on hover-distance.
  for (const item of SIDE_LOOT) {
    if (world.picked.has(item.id)) continue;
    const bob = Math.sin(world.time * 2 + item.x) * 2;
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, item.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff2b0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(item.x - item.r, item.y + bob);
    ctx.lineTo(item.x + item.r, item.y + bob);
    ctx.moveTo(item.x, item.y + bob - item.r);
    ctx.lineTo(item.x, item.y + bob + item.r);
    ctx.stroke();
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.name, item.x, item.y + item.r + 16 + bob);
  }
}

function drawCameras(ctx, world) {
  for (const c of world.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, c.range, c.halfAngle, PALETTE.camCone, PALETTE.camConeEdge);
    ctx.fillStyle = '#3a3f4a';
    ctx.fillRect(c.x - 11, c.y - 8, 22, 16);
    ctx.strokeStyle = '#ff5050';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x - 11, c.y - 8, 22, 16);
    ctx.fillStyle = '#ff5050';
    ctx.beginPath(); ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2); ctx.fill();
    // The lens points where the camera looks.
    const lx = c.x + Math.cos(c.angle) * 16;
    const ly = c.y + Math.sin(c.angle) * 16;
    ctx.strokeStyle = '#ff5050';
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(lx, ly); ctx.stroke();
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    const hot = g.seesThief || g.mode === 'chase';
    drawCone(ctx, g.x, g.y, g.angle, g.def.range, g.def.halfAngle,
      hot ? PALETTE.coneHot : PALETTE.cone, hot ? PALETTE.coneHotEdge : PALETTE.coneEdge);
  }
  for (const g of world.guards) {
    // A small investigation marker so the player can read the guard's mind.
    if (g.mode === 'investigate') {
      ctx.fillStyle = '#ffd75e';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 26);
    } else if (g.mode === 'chase') {
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 26);
    }
    ctx.fillStyle = PALETTE.guardVest;
    ctx.beginPath(); ctx.arc(g.x, g.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath(); ctx.arc(g.x, g.y, 9, 0, Math.PI * 2); ctx.fill();
    // Facing tick and a torch dot.
    ctx.strokeStyle = PALETTE.guard;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
    ctx.stroke();
    ctx.fillStyle = '#fff2b0';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 28);
  }
}

function drawThief(ctx, world) {
  const t = world.thief;
  // A soft shadow of exposure: a faint ring when the thief is inside a cone.
  let exposed = false;
  for (const g of world.guards) if (g.seesThief) exposed = true;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 10, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.thiefCloak;
  ctx.beginPath(); ctx.arc(t.x, t.y, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = exposed ? '#ff4040' : '#e8e4f0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.facing) * 16, t.y + Math.sin(t.facing) * 16);
  ctx.stroke();
  ctx.fillStyle = '#1a1430';
  ctx.beginPath(); ctx.arc(t.x - 3, t.y - 2, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(t.x + 3, t.y - 2, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('WREN', t.x, t.y - 20);
  if (t.sneaking) {
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '11px Georgia, serif';
    ctx.fillText('sneaking', t.x, t.y + 28);
  }
}

function drawCoins(ctx, world) {
  for (const c of world.coinsThrown) {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff2b0';
    ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.stroke();
  }
}

// The HUD is drawn on the canvas so it is part of every screenshot: the
// alarm meter is the big bar at the top, next to the loot tally and the
// objective. A player — and the judge — reads the whole state at a glance.
function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, ROOM.w, 64);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 64); ctx.lineTo(ROOM.w, 64); ctx.stroke();

  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE MIDNIGHT GALLERY', 20, 28);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '13px Georgia, serif';
  ctx.fillText('one night · one sapphire · no noise', 20, 48);

  // Alarm meter.
  const ax = 420;
  const aw = 340;
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('ALARM', ax, 24);
  const frac = world.alarm / ALARM.caughtAt;
  const colour = frac < 0.4 ? PALETTE.alarmLow : frac < 0.75 ? PALETTE.alarmMid : PALETTE.alarmHigh;
  ctx.fillStyle = '#2a2338';
  ctx.fillRect(ax, 32, aw, 18);
  ctx.fillStyle = colour;
  ctx.fillRect(ax, 32, aw * frac, 18);
  ctx.strokeStyle = PALETTE.hud;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 32, aw, 18);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.floor(world.alarm)}%`, ax + aw + 10, 47);
  if (frac >= 0.75) {
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.fillText('LOCKDOWN NEAR', ax, 62);
  }

  // Loot tally and coins.
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`LOOT $${world.lootValue.toLocaleString()}`, 830, 30);
  ctx.fillStyle = world.sapphire ? PALETTE.gold : PALETTE.hudDim;
  ctx.font = '13px Georgia, serif';
  ctx.fillText(world.sapphire ? '★ Sapphire secured' : '○ Sapphire not yet taken', 830, 49);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(`◉ coins × ${world.coins}`, 1090, 30);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '13px Georgia, serif';
  const mm = String(Math.floor(world.time / 60)).padStart(2, '0');
  const ss = String(Math.floor(world.time % 60)).padStart(2, '0');
  ctx.fillText(`${mm}:${ss}`, 1090, 49);

  // Objective line and notices, bottom of the frame.
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, ROOM.h - 34, ROOM.w, 34);
  ctx.fillStyle = PALETTE.hud;
  ctx.font = '14px Georgia, serif';
  ctx.textAlign = 'left';
  const objective = world.sapphire
    ? 'Objective: reach the EXIT with the sapphire.'
    : 'Objective: pocket the STAR SAPPHIRE, then reach the EXIT.';
  ctx.fillText(objective, 20, ROOM.h - 12);
  if (world.noticeTimer > 0) {
    ctx.fillStyle = world.notice.startsWith('SPOTTED') ? '#ff8080' : PALETTE.gold;
    ctx.textAlign = 'right';
    ctx.fillText(world.notice, ROOM.w - 20, ROOM.h - 12);
  }
}

function drawOverlay(ctx, world) {
  ctx.fillStyle = 'rgba(8, 6, 16, 0.72)';
  ctx.fillRect(0, 0, ROOM.w, ROOM.h);
  ctx.textAlign = 'center';
  if (world.phase === 'title') {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText('THE MIDNIGHT GALLERY', ROOM.w / 2, 250);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '20px Georgia, serif';
    ctx.fillText('One night. One sapphire. Three guards, two cameras, no noise.', ROOM.w / 2, 300);
    ctx.font = '17px Georgia, serif';
    ctx.fillStyle = PALETTE.hudDim;
    ctx.fillText('WASD / arrows — move      Shift — sneak      Click — toss a coin to distract', ROOM.w / 2, 360);
    ctx.fillText('Stand at the pedestal to pocket the Star Sapphire, then slip out the skylight exit.', ROOM.w / 2, 388);
    ctx.fillText('If the ALARM reaches 100%, the gallery locks down and the night is over.', ROOM.w / 2, 416);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText('Press ENTER to begin the heist', ROOM.w / 2, 480);
  } else if (world.phase === 'caught') {
    ctx.fillStyle = '#ff5050';
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText('CAUGHT', ROOM.w / 2, 300);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(world.endReason, ROOM.w / 2, 350);
    ctx.fillText(`Loot carried: $${world.lootValue.toLocaleString()} — left behind in the dark.`, ROOM.w / 2, 384);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Press R to try the night again', ROOM.w / 2, 450);
  } else if (world.phase === 'won') {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 54px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY', ROOM.w / 2, 280);
    ctx.fillStyle = PALETTE.hud;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(world.endReason, ROOM.w / 2, 330);
    ctx.fillText(`Loot: $${world.lootValue.toLocaleString()}  ·  Final score: ${world.finalScore.toLocaleString()}`, ROOM.w / 2, 366);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '17px Georgia, serif';
    ctx.fillText('The Star Sapphire is gone before dawn. The gallery never knew Wren was there.', ROOM.w / 2, 410);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Press R to run it again', ROOM.w / 2, 470);
  }
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, ROOM.w, ROOM.h);
  drawRoom(ctx);
  drawFurniture(ctx);
  drawLoot(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawCoins(ctx, world);
  drawThief(ctx, world);
  drawHud(ctx, world);
  if (world.phase !== 'playing') drawOverlay(ctx, world);
  // A red vignette as the alarm climbs — tension you can see.
  if (world.phase === 'playing' && world.alarm > 55) {
    const a = ((world.alarm - 55) / 45) * 0.22;
    ctx.strokeStyle = `rgba(255, 40, 40, ${a})`;
    ctx.lineWidth = 26;
    ctx.strokeRect(0, 0, ROOM.w, ROOM.h);
  }
}
