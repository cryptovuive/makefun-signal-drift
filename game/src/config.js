// Signal Drift's deterministic tuning sheet. The simulation uses a 1280x720 logical field.
export const FIELD = { width: 1280, height: 720, groundY: 650 };
export const STEP = 1 / 60;

export const PLAYER = {
  width: 128,
  height: 74,
  speed: 620,
  invulnerable: 1.35,
};

export const LIVES = 3;

export const HAZARD = {
  minWidth: 42,
  maxWidth: 108,
  minHeight: 30,
  maxHeight: 62,
  speed: 205,
  speedPerLevel: 28,
  drift: 64,
  interval: 0.68,
  intervalScale: 0.90,
  minInterval: 0.19,
  points: 3,
};

export const SHARD = {
  size: 30,
  speed: 170,
  speedPerLevel: 12,
  interval: 1.25,
  jitter: 0.65,
  points: 20,
};

export const GOAL = { seconds: 42, shards: 18, maxLevel: 8 };
export const POOL_SIZE = 72;

export const PALETTE = {
  backdrop: '#070b18',
  panel: 'rgba(7, 14, 31, 0.92)',
  panelEdge: '#3fe8ec',
  text: '#f4fbff',
  muted: '#9bb0c7',
  cyan: '#4ff3e8',
  cyanBright: '#b8fff4',
  amber: '#ffc96b',
  red: '#ff596f',
  redDark: '#a20f48',
  blue: '#5376ff',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'signal-drift.best';

