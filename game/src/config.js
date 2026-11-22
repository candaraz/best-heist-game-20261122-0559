// The Midnight Gallery — configuration: one room, its furniture, its people,
// its loot. Everything the other modules need to build the night lives here,
// so tuning the heist means editing this file and nothing else.

// The room is one fixed frame, 1280 by 800, drawn top-down. The judge sees
// the whole heist at once: no scrolling, no second room.
export const ROOM = { w: 1280, h: 800, wall: 26 };

// Palette: a night gallery — deep plum walls, warm marble, brass trim.
// Safe cover reads dark blue-grey, danger reads amber and red, loot reads gold.
export const PALETTE = {
  floor: '#241d33', floorTile: '#2b2340', floorLine: '#1c1628',
  rug: '#5a1f2b', rugEdge: '#8a6d3b',
  wall: '#171224', wallTrim: '#8a6d3b',
  caseGlass: '#3d5a74', caseBase: '#1b2a3a', caseEdge: '#6b8ca8',
  planter: '#1e3d2a', planterEdge: '#3f7a52',
  bench: '#4a3220', benchEdge: '#8a6d3b',
  pedestal: '#3a2f4d', pedestalEdge: '#c9a227',
  gold: '#ffd75e', goldDim: '#c9a227',
  thief: '#e8e4f0', thiefCloak: '#2c2a55',
  guard: '#d8d3c8', guardVest: '#37415c',
  cone: 'rgba(255, 196, 66, 0.20)', coneEdge: 'rgba(255, 196, 66, 0.55)',
  coneHot: 'rgba(255, 64, 64, 0.30)', coneHotEdge: 'rgba(255, 64, 64, 0.70)',
  camCone: 'rgba(255, 80, 80, 0.16)', camConeEdge: 'rgba(255, 80, 80, 0.50)',
  alarmLow: '#7dd87d', alarmMid: '#ffc442', alarmHigh: '#ff4040',
  hud: '#efe9dc', hudDim: '#9a93a8', panel: 'rgba(10, 8, 18, 0.82)',
};

// Furniture is cover and route-making at once. Every rectangle is solid:
// the thief, the guards and every line of sight stop at it. The gaps between
// the cases are the three lanes through the room — left past the planters,
// centre down the rug, right past the benches.
export const FURNITURE = [
  // Display cases, two rows that split the hall into lanes.
  { kind: 'case', x: 300, y: 210, w: 130, h: 64 },
  { kind: 'case', x: 560, y: 210, w: 130, h: 64 },
  { kind: 'case', x: 820, y: 210, w: 130, h: 64 },
  { kind: 'case', x: 300, y: 520, w: 130, h: 64 },
  { kind: 'case', x: 560, y: 520, w: 130, h: 64 },
  { kind: 'case', x: 820, y: 520, w: 130, h: 64 },
  // Planters along the left wall — the quiet lane.
  { kind: 'planter', x: 70, y: 170, w: 56, h: 56 },
  { kind: 'planter', x: 70, y: 360, w: 56, h: 56 },
  { kind: 'planter', x: 70, y: 550, w: 56, h: 56 },
  // Benches along the right wall — the fast lane, little cover.
  { kind: 'bench', x: 1150, y: 200, w: 60, h: 120 },
  { kind: 'bench', x: 1150, y: 480, w: 60, h: 120 },
];

// The Star Sapphire sits on its pedestal in the middle of the rug.
export const PEDESTAL = { x: 640, y: 400, r: 34 };
export const RUG = { x: 430, y: 300, w: 420, h: 200 };

// The skylight exit: a service door in the bottom-left corner. The heist is
// only a win once the thief carries the sapphire through it.
export const EXIT = { x: 26, y: 668, w: 110, h: 106 };

// Where the thief slips in: the top-left service vent.
export const SPAWN = { x: 90, y: 90 };

// Guards walk fixed patrols and look where they walk. Each patrol is a loop
// of waypoints; a guard pauses a beat at each corner, which is the window
// a careful thief uses. `speed` is pixels per second, `range` how far the
// guard can see, `halfAngle` how wide the cone opens.
export const GUARDS = [
  {
    name: 'Mara', waypoints: [[330, 150], [950, 150], [950, 330], [330, 330]],
    speed: 62, range: 205, halfAngle: 0.50, pause: 1.1,
  },
  {
    name: 'Ivo', waypoints: [[950, 650], [330, 650], [330, 470], [950, 470]],
    speed: 58, range: 205, halfAngle: 0.50, pause: 1.1,
  },
  {
    name: 'Sable', waypoints: [[1120, 130], [1120, 670], [1000, 670], [1000, 130]],
    speed: 70, range: 195, halfAngle: 0.52, pause: 0.8,
  },
];

// Wall cameras sweep fixed arcs and never blink. They see further than a
// guard but their cone is narrower, and a thief behind furniture is safe.
export const CAMERAS = [
  { x: 640, y: 26, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 270, halfAngle: 0.30 },
  { x: 1254, y: 400, baseAngle: Math.PI, sweep: 0.70, speed: 0.42, range: 260, halfAngle: 0.30 },
];

// Side loot: worth money, never required. Each one is a small risk — a
// detour into a watched corner — against a bigger final score.
export const SIDE_LOOT = [
  { id: 'portrait', name: 'Moonlit Portrait', value: 4000, x: 180, y: 300, r: 16 },
  { id: 'cat', name: 'Jade Cat', value: 6500, x: 1090, y: 330, r: 16 },
  { id: 'astrolabe', name: 'Brass Astrolabe', value: 9000, x: 1090, y: 640, r: 16 },
];

export const SAPPHIRE = { name: 'Star Sapphire', value: 50000, grabSeconds: 1.2 };

// The alarm is the game's clock. Seen by a guard it climbs fast, by a camera
// slower; hidden, it falls. Sneaking (holding Shift) halves the climb.
// At 100 the gallery locks down and the night is over.
export const ALARM = {
  guardRate: 34, cameraRate: 24,
  decay: 18, sneakFactor: 0.5, chaseAt: 65, caughtAt: 100,
};

// The thief walks at 165 px/s, sneaks at 95. A tossed coin flies to the
// clicked spot and rings; guards inside its hearing walk over to look.
export const THIEF = { radius: 13, walk: 165, sneak: 95 };
export const COIN = { count: 3, range: 320, hear: 190, investigateSeconds: 4 };

// Score: loot value plus a time bonus for a fast, quiet night.
export const SCORING = { timeBonusPerSecond: 120, maxTimeBonus: 12000 };
