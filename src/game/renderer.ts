/**
 * 캔버스 렌더러 — 여름 해변 배경 + 이모지 아이템 (MVP 아트).
 * 논리 좌표(400×720)로 그리고 DPR 스케일은 setup에서 처리.
 */

import { getItemImage, getSceneImage } from './assets';
import { GAME_CONFIG as C } from './config';
import type { GameEngine, DroppedItem } from './engine';
import type { ItemDef } from './items';

/**
 * 블리드 뷰포트: 논리 폭은 400 고정, 높이는 화면 비율만큼 늘어난다.
 * 게임 월드(400×720)는 top 오프셋 위치에 고정되고, 나머지는 배경 블리드로만 채운다
 * → 기기 비율이 달라도 게임플레이는 동일.
 */
export interface Viewport {
  w: number;
  h: number;
  /** 월드(720) 위쪽 여백 — 여분의 25%만 위로 (크레인이 HUD에서 멀어지지 않게) */
  top: number;
}

export function setupCanvas(canvas: HTMLCanvasElement): {
  ctx: CanvasRenderingContext2D;
  vp: Viewport;
} {
  const stage = canvas.parentElement!;
  const logicalH = Math.max(
    C.height,
    Math.round((C.width * stage.clientHeight) / stage.clientWidth),
  );
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = C.width * dpr;
  canvas.height = logicalH * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  return { ctx, vp: { w: C.width, h: logicalH, top: Math.round((logicalH - C.height) * 0.25) } };
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

function drawBackground(ctx: CanvasRenderingContext2D, vp: Viewport) {
  const bg = getSceneImage('background');
  if (bg) {
    // 백스톱: 이미지 블리드가 화면보다 짧아도 위(하늘)/아래(바다) 색으로 이어진다
    ctx.fillStyle = '#8ed0f5';
    ctx.fillRect(0, 0, vp.w, vp.top + C.voidY);
    ctx.fillStyle = '#1a7fb8';
    ctx.fillRect(0, vp.top + C.voidY, vp.w, vp.h - vp.top - C.voidY);

    // 이미지의 원본 9:16 프레임(세로 중앙 가정)을 게임 월드(400×720)에 정렬해
    // 확장분(블리드)이 월드 위아래로 자연스럽게 삐져나오게 그린다.
    // 구형 9:16 이미지도 dh === C.height로 동일하게 동작.
    const scale = C.width / bg.naturalWidth;
    const dh = bg.naturalHeight * scale;
    ctx.drawImage(bg, 0, vp.top + (C.height - dh) / 2, C.width, dh);
    return;
  }

  // ---- 폴백: 절차적 배경 (이미지 에셋이 없을 때) ----
  const seaY = vp.top + C.voidY;

  // 하늘 (캔버스 맨 위부터)
  const sky = ctx.createLinearGradient(0, 0, 0, seaY);
  sky.addColorStop(0, '#7ec8f2');
  sky.addColorStop(1, '#c9ecfa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, C.width, seaY);

  // 해
  drawEmoji(ctx, '☀️', 46, vp.top + 60, 44);

  // 야자수
  drawEmoji(ctx, '🌴', 30, vp.top + C.platformY - 30, 72);
  drawEmoji(ctx, '🌴', C.width - 30, vp.top + C.platformY - 36, 84);

  // 모래사장 (판 뒤쪽)
  ctx.fillStyle = '#f2dfae';
  ctx.beginPath();
  ctx.ellipse(C.width / 2, seaY + 8, C.width * 0.62, 42, 0, Math.PI, 2 * Math.PI);
  ctx.fill();

  // 바다 (VOID, 캔버스 맨 아래까지)
  const sea = ctx.createLinearGradient(0, seaY - 10, 0, vp.h);
  sea.addColorStop(0, '#3fb3e0');
  sea.addColorStop(1, '#1a7fb8');
  ctx.fillStyle = sea;
  ctx.fillRect(0, seaY, C.width, vp.h - seaY);

  // 물결
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const y = seaY + 14 + i * 16;
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

  // HUD(점수/최고기록) 바로 아래에 배치
  const wireY = 92;
  const cloudY = 104;

  // 와이어 (구름이 매달려 이동하는 가로줄)
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, wireY);
  ctx.lineTo(C.width, wireY);
  ctx.stroke();

  // 구름 크레인 캐릭터 — 이미지 있으면 이미지, 없으면 이모지 폴백
  const crane = getSceneImage('crane');
  if (crane) {
    const w = 64;
    const h = w * (crane.naturalHeight / crane.naturalWidth);
    ctx.drawImage(crane, x - w / 2, cloudY - h / 2, w, h);
  } else {
    drawEmoji(ctx, '☁️', x, cloudY, 56);
  }

  // 로프 — 구름 아래에서 아이템 윗부분까지 이어 붙인다 (사이 뜨는 공간 없게)
  ctx.strokeStyle = '#7a6a55';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, cloudY + 16);
  ctx.lineTo(x, C.craneY + 4);
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

export function render(ctx: CanvasRenderingContext2D, engine: GameEngine, vp: Viewport) {
  ctx.clearRect(0, 0, vp.w, vp.h);
  drawBackground(ctx, vp);
  // 게임 월드는 vp.top 아래에 고정 — 기기 비율과 무관하게 동일한 플레이 영역
  ctx.save();
  ctx.translate(0, vp.top);
  drawPlatforms(ctx, engine);
  drawItems(ctx, engine.droppedItems);
  drawCrane(ctx, engine);
  ctx.restore();
}
