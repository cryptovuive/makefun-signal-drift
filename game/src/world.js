import { FIELD, GOAL, HAZARD, LIVES, PLAYER, POOL_SIZE, SHARD } from './config.js';

export const KIND_HAZARD = 0;
export const KIND_SHARD = 1;
export const EVENT_HIT = 1;
export const EVENT_SHARD = 2;
export const EVENT_OVER = 4;
export const EVENT_WIN = 8;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = { x: 0, y: FIELD.groundY - PLAYER.height, width: PLAYER.width, height: PLAYER.height, invulnerable: 0, shield: 3 };
  const items = [];
  for (let index = 0; index < POOL_SIZE; index += 1) {
    items.push({ active: false, kind: KIND_HAZARD, x: 0, y: 0, width: 0, height: 0, speed: 0, drift: 0, phase: 0 });
  }
  const state = { player, items, score: 0, lives: LIVES, shield: 3, level: 1, elapsed: 0, shards: 0, combo: 0, comboTimer: 0, hazardTimer: 0, shardTimer: 0, won: false };

  function reset() {
    player.x = (FIELD.width - player.width) / 2;
    player.invulnerable = 0;
    player.shield = 3;
    for (const item of items) item.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.shield = 3;
    state.level = 1;
    state.elapsed = 0;
    state.shards = 0;
    state.combo = 0;
    state.comboTimer = 0;
    state.hazardTimer = HAZARD.interval;
    state.shardTimer = SHARD.interval;
    state.won = false;
  }

  function freeItem() {
    for (const item of items) if (!item.active) return item;
    return null;
  }

  function spawnHazard() {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_HAZARD;
    item.width = HAZARD.minWidth + random() * (HAZARD.maxWidth - HAZARD.minWidth);
    item.height = HAZARD.minHeight + random() * (HAZARD.maxHeight - HAZARD.minHeight);
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height - random() * 110;
    item.speed = HAZARD.speed + HAZARD.speedPerLevel * (state.level - 1) + random() * 80;
    item.drift = (random() * 2 - 1) * HAZARD.drift;
    item.phase = random() * Math.PI * 2;
  }

  function spawnShard() {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_SHARD;
    item.width = SHARD.size;
    item.height = SHARD.size;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height - random() * 60;
    item.speed = SHARD.speed + SHARD.speedPerLevel * (state.level - 1);
    item.drift = (random() * 2 - 1) * 38;
    item.phase = random() * Math.PI * 2;
  }

  function hazardInterval() {
    return Math.max(HAZARD.minInterval, HAZARD.interval * HAZARD.intervalScale ** (state.level - 1));
  }

  function step(dt, direction, harmless) {
    let events = 0;
    state.elapsed += dt;
    state.level = Math.min(GOAL.maxLevel, 1 + Math.floor(state.elapsed / 8));
    player.x = Math.min(FIELD.width - player.width, Math.max(0, player.x + direction * PLAYER.speed * dt));
    if (player.invulnerable > 0) player.invulnerable = Math.max(0, player.invulnerable - dt);
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) state.combo = 0;

    state.hazardTimer -= dt;
    if (state.hazardTimer <= 0) {
      spawnHazard();
      state.hazardTimer += hazardInterval();
    }
    state.shardTimer -= dt;
    if (state.shardTimer <= 0) {
      spawnShard();
      state.shardTimer += SHARD.interval + random() * SHARD.jitter;
    }

    for (const item of items) {
      if (!item.active) continue;
      item.phase += dt * 2.6;
      item.x += item.drift * dt;
      if (item.x < -item.width) item.x = FIELD.width;
      if (item.x > FIELD.width) item.x = -item.width;
      item.y += item.speed * dt;
      if (item.y > FIELD.groundY + item.height) {
        item.active = false;
        if (item.kind === KIND_HAZARD && !harmless) state.score += HAZARD.points;
        continue;
      }
      if (harmless || !overlaps(item, player)) continue;
      if (item.kind === KIND_SHARD) {
        item.active = false;
        state.shards += 1;
        state.combo = Math.min(5, state.combo + 1);
        state.comboTimer = 3.5;
        state.score += SHARD.points * (1 + state.combo * 0.25);
        events |= EVENT_SHARD;
        continue;
      }
      if (player.invulnerable === 0) {
        item.active = false;
        player.invulnerable = PLAYER.invulnerable;
        if (state.shield > 0) {
          state.shield -= 1;
          events |= EVENT_HIT;
        } else {
          state.lives -= 1;
          state.shield = 2;
          events |= EVENT_HIT;
          if (state.lives === 0) {
            events |= EVENT_OVER;
            break;
          }
        }
      }
    }

    if (!harmless && state.elapsed >= GOAL.seconds && state.shards >= GOAL.shards) {
      state.won = true;
      events |= EVENT_WIN;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}

