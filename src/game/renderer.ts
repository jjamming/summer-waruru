/**
 * 캔버스 렌더러 — 여름 해변 배경 + 이모지 아이템 (MVP 아트).
 * 논리 좌표(400×720)로 그리고 DPR 스케일은 setup에서 처리.
 */

import { getItemImage, getSceneImage } from './assets';
import { GAME_CONFIG as C } from './config';
import type { GameEngine, DroppedItem } from './engine';
import type { ItemDef } from './items';

export function setupCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = C.width * dpr;
  canvas.height = C.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return ctx;
}

function emojiFontSize(def: ItemDef): number {
  switch (def.shape.kind) {
    case 'circle':
      return def.shape.radius * 2.1;
    case 'box':
      return Math.max(def.shape.width, def.shape.height) * 1.15;
    case 'capsule':
      return def.shape.width * 0.95;
  }
}

function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  size: number,
  angle = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.font = `${size}px "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 0, size * 0.05);
  ctx.restore();
}

/** 아이템 스프라이트: 이미지가 있으면 이미지, 없으면 이모지 폴백 */
function drawItemSprite(
  ctx: CanvasRenderingContext2D,
  def: ItemDef,
  x: number,
  y: number,
  angle = 0,
) {
  const img = getItemImage(def.id);
  if (!img) {
    drawEmoji(ctx, def.emoji, x, y, emojiFontSize(def), angle);
    return;
  }
  const w = emojiFontSize(def) * 1.06;
  const h = w * (img.naturalHeight / img.naturalWidth);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const bg = getSceneImage('background');
  if (bg) {
    // cover 방식으로 논리 캔버스 채우기
    const scale = Math.max(C.width / bg.naturalWidth, C.height / bg.naturalHeight);
    const w = bg.naturalWidth * scale;
    const h = bg.naturalHeight * scale;
    ctx.drawImage(bg, (C.width - w) / 2, (C.height - h) / 2, w, h);
    return;
  }

  // ---- 폴백: 절차적 배경 (이미지 에셋이 없을 때) ----
  // 하늘
  const sky = ctx.createLinearGradient(0, 0, 0, C.voidY);
  sky.addColorStop(0, '#7ec8f2');
  sky.addColorStop(1, '#c9ecfa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, C.width, C.voidY);

  // 해
  drawEmoji(ctx, '☀️', 46, 60, 44);

  // 야자수
  drawEmoji(ctx, '🌴', 30, C.platformY - 30, 72);
  drawEmoji(ctx, '🌴', C.width - 30, C.platformY - 36, 84);

  // 모래사장 (판 뒤쪽)
  ctx.fillStyle = '#f2dfae';
  ctx.beginPath();
  ctx.ellipse(C.width / 2, C.voidY + 8, C.width * 0.62, 42, 0, Math.PI, 2 * Math.PI);
  ctx.fill();

  // 바다 (VOID)
  const sea = ctx.createLinearGradient(0, C.voidY - 10, 0, C.height);
  sea.addColorStop(0, '#3fb3e0');
  sea.addColorStop(1, '#1a7fb8');
  ctx.fillStyle = sea;
  ctx.fillRect(0, C.voidY, C.width, C.height - C.voidY);

  // 물결
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const y = C.voidY + 14 + i * 16;
    ctx.beginPath();
    for (let x = 0; x <= C.width; x += 8) {
      const wy = y + Math.sin((x + i * 40) / 18) * 3;
      x === 0 ? ctx.moveTo(x, wy) : ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
}

function drawPlatforms(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const r of engine.platformRects) {
    // 나무 판자
    ctx.fillStyle = '#b8763a';
    ctx.beginPath();
    ctx.roundRect(r.x, r.y, r.w, r.h, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(r.x + 3, r.y + 2, r.w - 6, 3);
    // 다리
    ctx.fillStyle = '#8e5a2a';
    ctx.fillRect(r.x + 8, r.y + r.h, 6, C.voidY - r.y - r.h + 6);
    ctx.fillRect(r.x + r.w - 14, r.y + r.h, 6, C.voidY - r.y - r.h + 6);
  }
}

function drawCrane(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  const x = engine.craneX;

  // 와이어 (화면 상단 가로줄)
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.lineTo(C.width, 34);
  ctx.stroke();

  // 구름 크레인 캐릭터 — 이미지 있으면 이미지, 없으면 이모지 폴백
  const crane = getSceneImage('crane');
  if (crane) {
    const w = 64;
    const h = w * (crane.naturalHeight / crane.naturalWidth);
    ctx.drawImage(crane, x - w / 2, 44 - h / 2, w, h);
  } else {
    drawEmoji(ctx, '☁️', x, 44, 56);
  }

  // 로프 + 고리
  ctx.strokeStyle = '#7a6a55';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, 62);
  ctx.lineTo(x, C.craneY - 4);
  ctx.stroke();

  // 매달린 현재 아이템
  if (engine.holding) {
    const def = engine.snapshot().current;
    drawItemSprite(ctx, def, x, C.craneY + engine.hangOffset(def));
  }
}

function drawItems(ctx: CanvasRenderingContext2D, items: readonly DroppedItem[]) {
  for (const item of items) {
    drawItemSprite(ctx, item.def, item.body.position.x, item.body.position.y, item.body.angle);
  }
}

export function render(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  ctx.clearRect(0, 0, C.width, C.height);
  drawBackground(ctx);
  drawPlatforms(ctx, engine);
  drawItems(ctx, engine.droppedItems);
  drawCrane(ctx, engine);
}
