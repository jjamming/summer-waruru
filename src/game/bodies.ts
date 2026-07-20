/**
 * 아이템 물리 바디 생성 — 스프라이트 실루엣 기반 커스텀 폴리곤.
 * hitboxes.json(scripts/gen-hitboxes.py 생성)의 컨벡스 헐을 쓰면 시각과 충돌 경계가 일치한다.
 * 폴리곤이 없는 아이템(이미지 미보유)은 기존 원/박스/캡슐 근사로 폴백.
 */

import Matter from 'matter-js';
import decomp from 'poly-decomp';
import rawHitboxes from './hitboxes.json';
import { GAME_CONFIG as C } from './config';
import type { ItemDef } from './items';

// 오목(concave) 폴리곤을 볼록 조각으로 분해할 수 있게 등록 — fromVertices가 내부에서 사용
Matter.Common.setDecomp(decomp);

interface HitboxData {
  /** 이미지 height / width */
  aspect: number;
  /** 이미지 중심 원점, 폭/높이 대비 -0.5~0.5 정규화 꼭짓점 */
  verts: [number, number][];
}

const HITBOXES = rawHitboxes as unknown as Record<string, HitboxData>;

/** 아이템의 화면 렌더 폭 (물리 shape 크기에서 유도 — 밸런싱 수치 유지, itemScale 전역 배율 포함) */
export function spriteWidth(def: ItemDef): number {
  switch (def.shape.kind) {
    case 'circle':
      return def.shape.radius * 2.1 * C.itemScale;
    case 'box':
      return Math.max(def.shape.width, def.shape.height) * 1.15 * C.itemScale;
    case 'capsule':
      return def.shape.width * 0.95 * C.itemScale;
  }
}

export interface SpriteMetrics {
  /** 렌더 폭/높이 (논리 px) */
  w: number;
  h: number;
  /** 폴리곤 centroid의 스프라이트 중심 기준 오프셋 (논리 px) — 바디 원점 보정용 */
  centroidX: number;
  centroidY: number;
}

function polygonCentroid(verts: [number, number][]): { x: number; y: number } {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < verts.length; i++) {
    const [x0, y0] = verts[i];
    const [x1, y1] = verts[(i + 1) % verts.length];
    const f = x0 * y1 - x1 * y0;
    area += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  area /= 2;
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

const metricsCache = new Map<string, SpriteMetrics>();

/** 스프라이트 정렬 정보 — 폴리곤 기반 아이템만 (없으면 null → 기존 렌더 경로) */
export function spriteMetrics(def: ItemDef): SpriteMetrics | null {
  const hb = HITBOXES[def.id];
  if (!hb) return null;
  const cached = metricsCache.get(def.id);
  if (cached) return cached;
  const w = spriteWidth(def);
  const h = w * hb.aspect;
  const c = polygonCentroid(hb.verts);
  // comOffsetY로 무게중심을 옮기면 바디 원점도 함께 이동 — 렌더 보정에 포함 (itemScale 동일 적용)
  const m: SpriteMetrics = {
    w,
    h,
    centroidX: c.x * w,
    centroidY: c.y * h + (def.comOffsetY ?? 0) * C.itemScale,
  };
  metricsCache.set(def.id, m);
  return m;
}

/** 스케일 적용된 물리용 꼭짓점 (스프라이트 중심 원점, 논리 px) */
export function hitboxVerts(def: ItemDef, scale = 1): Matter.Vector[] | null {
  const hb = HITBOXES[def.id];
  if (!hb) return null;
  const w = spriteWidth(def) * scale;
  const h = w * hb.aspect;
  return hb.verts.map(([x, y]) => ({ x: x * w, y: y * h }));
}

/** 아이템 물리 바디 — 폴리곤 우선, 없으면 shape 근사 폴백 */
export function createItemBody(def: ItemDef, x: number, y: number, scale = 1): Matter.Body {
  const opts: Matter.IChamferableBodyDefinition = {
    density: def.density,
    friction: def.friction,
    restitution: def.restitution,
    frictionAir: C.frictionAir,
    label: def.id,
  };

  const verts = hitboxVerts(def, scale);
  if (verts) {
    // fromVertices는 바디 원점을 폴리곤 centroid에 둔다 (렌더 시 spriteMetrics로 보정)
    const body = Matter.Bodies.fromVertices(x, y, [verts], opts);
    if (def.comOffsetY) {
      // 무게중심을 아래로 — 위가 무거운 아이템(팥빙수 등)이 덜 넘어지게
      Matter.Body.setCentre(body, { x: 0, y: def.comOffsetY * scale * C.itemScale }, true);
    }
    return body;
  }

  const s = scale * C.itemScale;
  switch (def.shape.kind) {
    case 'circle':
      return Matter.Bodies.circle(x, y, def.shape.radius * s, opts);
    case 'box':
      return Matter.Bodies.rectangle(x, y, def.shape.width * s, def.shape.height * s, opts);
    case 'capsule':
      return Matter.Bodies.rectangle(x, y, def.shape.width * s, def.shape.height * s, {
        ...opts,
        chamfer: { radius: (def.shape.height * s) / 2 - 1 },
      });
  }
}
