import { FIELD, GOAL, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN, KIND_HAZARD } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const PLAY_SECONDS = 30;
const END_LIMIT_SECONDS = 120;
const SAMPLE = 1 / 30;

function timeToHit(state, direction, horizon) {
  const player = state.player;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const x = Math.min(FIELD.width - player.width, Math.max(0, player.x + 620 * direction * t));
    for (const item of state.items) {
      if (!item.active || item.kind !== KIND_HAZARD) continue;
      const y = item.y + item.speed * t;
      if (y + item.height > player.y && y < player.y + player.height && item.x < x + player.width + 18 && item.x + item.width > x - 18) return t;
    }
  }
  return Infinity;
}

function autopilot(state) {
  let shard = null;
  for (const item of state.items) if (item.active && item.kind !== KIND_HAZARD && (shard === null || item.y > shard.y)) shard = item;
  const target = shard ? shard.x + shard.width / 2 : FIELD.width / 2;
  const centre = state.player.x + state.player.width / 2;
  const wanted = target > centre + 10 ? 1 : target < centre - 10 ? -1 : 0;
  let best = wanted;
  let bestTime = timeToHit(state, wanted, 0.55);
  for (const candidate of [0, -1, 1]) {
    const time = timeToHit(state, candidate, 0.55);
    if (time > bestTime) { bestTime = time; best = candidate; }
  }
  return best;
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < 180; i += 1) world.step(STEP, 0, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  let event = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    event = world.step(STEP, autopilot(world.state), false);
    if ((event & (EVENT_OVER | EVENT_WIN)) !== 0) break;
  }
  if (name === 'end') {
    if (event & EVENT_OVER) return { screen: SCREEN_OVER, best: world.state.score };
    world.state.won = true;
    world.state.shards = Math.max(world.state.shards, GOAL.shards);
    world.state.score += 420;
    return { screen: SCREEN_WIN, best: world.state.score };
  }
  return { screen: SCREEN_PLAY, best: world.state.score };
}

