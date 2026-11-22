// The Midnight Gallery — input: keyboard movement and mouse coin tosses.
// WASD or arrows move the thief; Shift sneaks; a mouse click tosses a coin
// to that spot. R restarts after a win or a catch, Enter starts the night.

export function createInput(canvas, onCoinToss, onStart, onRestart) {
  const keys = new Set();
  const input = {
    keys,
    // The last coin-toss target in room coordinates, consumed by the world.
    coinTarget: null,
    // True on the frame a coin was tossed.
    coinTossed: false,
  };

  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS.includes(e.code) || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'Enter') onStart();
    if (e.code === 'KeyR') onRestart();
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1280;
    const y = ((e.clientY - rect.top) / rect.height) * 800;
    input.coinTarget = { x, y };
    input.coinTossed = true;
    onCoinToss();
  });

  return input;
}

// A unit movement vector from the held keys, or null when standing still.
export function moveVector(keys) {
  let x = 0;
  let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

export function isSneaking(keys) {
  return keys.has('ShiftLeft') || keys.has('ShiftRight');
}
