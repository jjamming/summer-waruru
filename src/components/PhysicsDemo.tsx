import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { getItemImage } from '../game/assets';
import { createItemBody, spriteMetrics } from '../game/bodies';
import { itemById, type ItemDef } from '../game/items';

/**
 * 튜토리얼 2단계: 실제 matter.js로 아이템 탑이 무너져 바다에 빠지는 장면.
 * 게임과 같은 물리 특성(items.ts)을 쓰므로 실플레이와 동일한 질감으로 무너진다.
 */

const H = 150;
const SEA_H = 18;
const PLANK_H = 8;
const PLANK_BOTTOM = 26; // css 데모(.demo-plank)와 동일 배치
const SCALE = 0.75;
const CYCLE_MS = 4200;

/** 살짝 어긋나게 쌓아 매 사이클 같은 모양으로 자연 붕괴를 유도 */
const STACK: { id: string; offsetX: number }[] = [
  { id: 'watermelon-slice', offsetX: 0 },
  { id: 'strawberry', offsetX: 5 },
  { id: 'patbingsu', offsetX: -7 },
  { id: 'tube', offsetX: 13 },
];

function sizeOf(def: ItemDef): { w: number; h: number } {
  const m = spriteMetrics(def);
  if (m) return { w: m.w * SCALE, h: m.h * SCALE };
  switch (def.shape.kind) {
    case 'circle':
      return { w: def.shape.radius * 2 * SCALE, h: def.shape.radius * 2 * SCALE };
    case 'box':
    case 'capsule':
      return { w: def.shape.width * SCALE, h: def.shape.height * SCALE };
  }
}

export default function PhysicsDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const W = canvas.parentElement?.clientWidth || 280;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const engine = Matter.Engine.create();
    engine.gravity.y = 0.9;

    const plankW = W * 0.42;
    const plankTopY = H - PLANK_BOTTOM - PLANK_H;
    Matter.Composite.add(
      engine.world,
      Matter.Bodies.rectangle(W / 2, plankTopY + PLANK_H / 2, plankW, PLANK_H, {
        isStatic: true,
        friction: 0.9,
      }),
    );

    let items: { body: Matter.Body; def: ItemDef }[] = [];
    let splash: { x: number; at: number } | null = null;
    let cycleStart = 0;

    const spawnStack = (now: number) => {
      for (const it of items) Matter.Composite.remove(engine.world, it.body);
      items = [];
      splash = null;
      cycleStart = now;
      let y = plankTopY;
      for (const { id, offsetX } of STACK) {
        const def = itemById(id);
        const { h } = sizeOf(def);
        y -= h / 2;
        const body = createItemBody(def, W / 2 + offsetX, y, SCALE);
        items.push({ body, def });
        Matter.Composite.add(engine.world, body);
        y -= h / 2 - 1;
      }
    };

    const draw = () => {
      // 하늘 → 모래 그라데이션 (css 데모와 동일 톤)
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#8ed0f5');
      sky.addColorStop(0.78, '#cdeefb');
      sky.addColorStop(1, '#f2dfae');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // 바다
      const sea = ctx.createLinearGradient(0, H - SEA_H, 0, H);
      sea.addColorStop(0, '#3fb3e0');
      sea.addColorStop(1, '#1a7fb8');
      ctx.fillStyle = sea;
      ctx.fillRect(0, H - SEA_H, W, SEA_H);

      // 판자
      ctx.fillStyle = '#b8763a';
      ctx.beginPath();
      ctx.roundRect((W - plankW) / 2, plankTopY, plankW, PLANK_H, 3);
      ctx.fill();

      // 아이템 (게임 렌더러와 동일하게 폴리곤 centroid 보정 정렬)
      for (const { body, def } of items) {
        const { w, h } = sizeOf(def);
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        const img = getItemImage(def.id);
        const m = spriteMetrics(def);
        if (img && m) {
          ctx.drawImage(img, -w / 2 - m.centroidX * SCALE, -h / 2 - m.centroidY * SCALE, w, h);
        } else if (img) {
          const dw = w * 1.15;
          const dh = dw * (img.naturalHeight / img.naturalWidth);
          ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        } else {
          ctx.font = `${Math.max(w, h) * 1.1}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(def.emoji, 0, 0);
        }
        ctx.restore();
      }

      // 풍덩!
      if (splash && performance.now() - splash.at < 700) {
        ctx.font = '900 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,60,100,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText('풍덩!', Math.min(splash.x, W - 24), H - SEA_H - 6);
        ctx.shadowBlur = 0;
      }
    };

    let raf = 0;
    let last = performance.now();
    spawnStack(last);
    const loop = (now: number) => {
      // 물리 진행 (고정 스텝 근사)
      const dt = Math.min(now - last, 50);
      Matter.Engine.update(engine, dt);
      last = now;

      // 바다 입수 감지 → 풍덩
      for (const { body } of items) {
        if (!splash && body.position.y > H - SEA_H) splash = { x: body.position.x, at: now };
      }

      if (now - cycleStart > CYCLE_MS) spawnStack(now);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      Matter.Engine.clear(engine);
    };
  }, []);

  return <canvas ref={canvasRef} className="demo-canvas" />;
}
