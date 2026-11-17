import { FIELD, FONT, GOAL, PALETTE } from './config.js';
import { KIND_HAZARD, KIND_SHARD } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const background = new Image();
background.src = './assets/signal-drift-bg.png';
const ship = new Image();
ship.src = './assets/courier-skiff.png';

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }
  function text(value, x, y, size, color, align = 'left', weight = 500) {
    context.font = `${weight} ${size}px ${FONT}`;
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }
  function glow(color, blur) {
    context.shadowColor = color;
    context.shadowBlur = blur;
  }
  function drawFallbackField() {
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    for (let i = 0; i < 90; i += 1) {
      const x = (i * 157) % FIELD.width;
      const y = (i * 83) % FIELD.height;
      context.fillStyle = i % 5 === 0 ? PALETTE.cyan : 'rgba(255,255,255,.35)';
      context.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
  }
  function drawField(state) {
    if (background.complete && background.naturalWidth > 0) context.drawImage(background, 0, 0, FIELD.width, FIELD.height);
    else drawFallbackField();
    const gradient = context.createLinearGradient(0, FIELD.groundY - 80, 0, FIELD.height);
    gradient.addColorStop(0, 'rgba(4,9,23,0)');
    gradient.addColorStop(1, 'rgba(4,9,23,.72)');
    context.fillStyle = gradient;
    context.fillRect(0, FIELD.groundY - 80, FIELD.width, FIELD.height - FIELD.groundY + 80);

    for (const item of state.items) {
      if (!item.active) continue;
      if (item.kind === KIND_SHARD) {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        context.save();
        context.translate(cx, cy);
        context.rotate(Math.sin(item.phase) * 0.18);
        glow(PALETTE.cyan, 18);
        context.fillStyle = PALETTE.cyanBright;
        context.beginPath();
        context.moveTo(0, -item.height / 2);
        context.lineTo(item.width / 2, 0);
        context.lineTo(0, item.height / 2);
        context.lineTo(-item.width / 2, 0);
        context.closePath();
        context.fill();
        context.restore();
      } else {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        context.save();
        context.translate(cx, cy);
        context.rotate(item.phase * 0.5);
        glow(PALETTE.red, 24);
        context.fillStyle = PALETTE.redDark;
        context.strokeStyle = PALETTE.red;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-item.width / 2, item.height / 4);
        context.lineTo(-item.width / 5, -item.height / 2);
        context.lineTo(item.width / 2, -item.height / 5);
        context.lineTo(item.width / 4, item.height / 2);
        context.lineTo(-item.width / 3, item.height / 3);
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
      }
    }
    const player = state.player;
    if (player.invulnerable === 0 || Math.floor(player.invulnerable * 12) % 2 === 1) {
      if (ship.complete && ship.naturalWidth > 0) context.drawImage(ship, player.x, player.y, player.width, player.height);
      else {
        context.fillStyle = PALETTE.cyan;
        context.beginPath();
        context.moveTo(player.x + player.width, player.y + player.height / 2);
        context.lineTo(player.x, player.y);
        context.lineTo(player.x + 22, player.y + player.height / 2);
        context.lineTo(player.x, player.y + player.height);
        context.closePath();
        context.fill();
      }
    }
  }
  function drawProgress(state) {
    const x = 360;
    const y = 18;
    const width = 300;
    const ratio = Math.min(1, state.shards / GOAL.shards);
    context.fillStyle = 'rgba(6, 14, 31, .78)';
    roundedRect(context, x, y, width, 28, 14);
    context.fill();
    context.fillStyle = PALETTE.cyan;
    roundedRect(context, x + 4, y + 4, Math.max(8, (width - 8) * ratio), 20, 10);
    context.fill();
    text(`SIGNAL ${state.shards}/${GOAL.shards}`, x + width / 2, y + 20, 13, PALETTE.text, 'center', 700);
  }
  function drawHud(state) {
    context.textBaseline = 'top';
    text(`SCORE ${Math.floor(state.score)}`, 34, 24, 17, PALETTE.text, 'left', 700);
    text(`SECTOR ${String(state.level).padStart(2, '0')}`, FIELD.width / 2, 25, 14, PALETTE.muted, 'center', 700);
    text(`SHIELD ${'◆'.repeat(state.shield)}${'◇'.repeat(3 - state.shield)}`, FIELD.width - 34, 24, 15, PALETTE.cyanBright, 'right', 700);
    drawProgress(state);
    if (state.combo > 1) text(`${state.combo}x COMBO`, FIELD.width / 2, 58, 18, PALETTE.amber, 'center', 800);
  }
  function drawPanel(title, lines, prompt, accent = PALETTE.cyan) {
    const width = 690;
    const height = 330 + lines.length * 10;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.strokeStyle = accent;
    context.lineWidth = 2;
    roundedRect(context, x, y, width, height, 22);
    context.fill();
    context.stroke();
    text(title, FIELD.width / 2, y + 92, 50, PALETTE.text, 'center', 800);
    for (let i = 0; i < lines.length; i += 1) text(lines[i], FIELD.width / 2, y + 145 + i * 32, 21, PALETTE.muted, 'center', 500);
    text(prompt, FIELD.width / 2, y + height - 46, 22, accent, 'center', 800);
  }
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.textBaseline = 'alphabetic';
    drawField(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('SIGNAL DRIFT', ['Thread the debris stream.', 'Collect 18 signal shards and reach the relay.', `Best run: ${Math.floor(best)} points`], 'PRESS SPACE OR CLICK TO LAUNCH');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('PAUSED', ['The stream is holding its breath.'], 'PRESS P TO RESUME', PALETTE.amber);
    else if (screen === SCREEN_OVER) drawPanel('SIGNAL LOST', [`Run score: ${Math.floor(state.score)}`, `Best score: ${Math.floor(best)}`, 'The relay is still out there.'], 'PRESS SPACE TO RETRY', PALETTE.red);
    else if (screen === SCREEN_WIN) drawPanel('RELAY REACHED', [`Final score: ${Math.floor(state.score)}`, `${state.shards} shards recovered`, 'The signal made it home.'], 'PRESS SPACE TO FLY AGAIN', PALETTE.amber);
  }
  resize();
  window.addEventListener('resize', resize);
  return { draw };
}

