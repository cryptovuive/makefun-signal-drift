import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_OVER, EVENT_SHARD, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private mode is fine */ }
}
function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint); else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}
function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  function announce(message) { status.textContent = message; }
  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Signal Drift active. ${LIVES} lives. Collect 18 shards.`);
  }
  function finish(screenName) {
    screen = screenName;
    if (world.state.score > best) { best = Math.floor(world.state.score); saveBest(best); }
    announce(screenName === SCREEN_WIN ? `Relay reached. Score ${Math.floor(world.state.score)}.` : `Signal lost. Score ${Math.floor(world.state.score)}. Best ${best}.`);
  }
  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
    else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Signal Drift active.'); }
  }
  function step() {
    if (screen === SCREEN_TITLE) { world.step(STEP, 0, true); return; }
    const events = world.step(STEP, input.direction(), false);
    if (events & EVENT_OVER) finish(SCREEN_OVER);
    else if (events & EVENT_WIN) finish(SCREEN_WIN);
    else if (events & EVENT_HIT) announce(`Impact. ${world.state.lives} lives, ${world.state.shield} shield charges.`);
    else if (events & EVENT_SHARD) announce(`Signal shard recovered. ${world.state.shards} of 18.`);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) { step(); accumulator -= STEP; }
    } else accumulator = 0;
    renderer.draw(world.state, screen, best);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused while the tab was hidden.'); }
  });
  announce('Signal Drift. Press Space or click to launch.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot); else runGame();

