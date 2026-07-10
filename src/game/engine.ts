/**
 * 게임 코어 엔진 — matter.js 물리 + 크레인 + 득점/게임오버 판정.
 * React와 무관한 순수 클래스. 고정 타임스텝으로 프레임레이트 무관 일관성 유지.
 */

import Matter from 'matter-js';
import { GAME_CONFIG as C } from './config';
import type { ItemDef } from './items';
import { createItemSequence, randomSeed } from './rng';

export interface DroppedItem {
  body: Matter.Body;
  def: ItemDef;
  /** 착지 득점 완료 여부 */
  scored: boolean;
  /** 저속 유지 프레임 수 (착지 판정용) */
  settleCount: number;
}

export type GamePhase = 'ready' | 'playing' | 'gameover';

export interface GameSnapshot {
  phase: GamePhase;
  score: number;
  dropCount: number;
  craneX: number;
  current: ItemDef;
  next: ItemDef;
  /** 크레인에 아이템이 매달려 있는지 (쿨다운 중이면 false) */
  holding: boolean;
}

export interface GameEvents {
  onScore?: (points: number, total: number) => void;
  onGameOver?: (score: number, culprit: ItemDef) => void;
}

export class GameEngine {
  private engine: Matter.Engine;
  private items: DroppedItem[] = [];
  private nextItem: () => ItemDef;

  phase: GamePhase = 'ready';
  score = 0;
  dropCount = 0;

  craneX: number;
  private craneDir: 1 | -1 = 1;

  current: ItemDef;
  next: ItemDef;
  private holdTimerMs = 0;

  /** 게임오버 원인 아이템 (연출용) */
  culprit: ItemDef | null = null;

  private accumulatorMs = 0;

  constructor(private events: GameEvents = {}, seed = randomSeed()) {
    this.engine = Matter.Engine.create();
    this.engine.gravity.y = C.gravityY;

    this.nextItem = createItemSequence(seed);
    this.current = this.nextItem();
    this.next = this.nextItem();
    this.craneX = C.width / 2;

    this.createPlatforms();
  }

  private createPlatforms() {
    const bodies: Matter.Body[] = [];
    const opts: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      friction: 0.9,
      label: 'platform',
    };
    const y = C.platformY + C.platformThickness / 2;
    if (C.platformCount === 1) {
      const w = C.width * C.platformWidthRatio;
      bodies.push(Matter.Bodies.rectangle(C.width / 2, y, w, C.platformThickness, opts));
    } else {
      const w = C.width * C.platformWidthRatioDouble;
      const gap = C.width * 0.08;
      bodies.push(
        Matter.Bodies.rectangle(C.width / 2 - w / 2 - gap / 2, y, w, C.platformThickness, opts),
        Matter.Bodies.rectangle(C.width / 2 + w / 2 + gap / 2, y, w, C.platformThickness, opts),
      );
    }
    Matter.Composite.add(this.engine.world, bodies);
  }

  /** 판자 렌더링용 rect 목록 */
  get platformRects(): { x: number; y: number; w: number; h: number }[] {
    return Matter.Composite.allBodies(this.engine.world)
      .filter((b) => b.label === 'platform')
      .map((b) => {
        const { min, max } = b.bounds;
        return { x: min.x, y: min.y, w: max.x - min.x, h: max.y - min.y };
      });
  }

  get droppedItems(): readonly DroppedItem[] {
    return this.items;
  }

  private craneSpeed(): number {
    const mult = Math.min(1 + this.dropCount * C.craneSpeedRampPerDrop, C.craneMaxSpeedMultiplier);
    return C.craneBaseSpeed * mult;
  }

  get holding(): boolean {
    return this.phase !== 'gameover' && this.holdTimerMs <= 0;
  }

  /** 탭 → 현재 크레인 위치에서 투하 */
  drop() {
    if (this.phase === 'gameover' || !this.holding) return;
    this.phase = 'playing';

    const def = this.current;
    const body = this.createBody(def, this.craneX, C.craneY + this.hangOffset(def));
    this.items.push({ body, def, scored: false, settleCount: 0 });
    Matter.Composite.add(this.engine.world, body);

    this.dropCount += 1;
    this.current = this.next;
    this.next = this.nextItem();
    this.holdTimerMs = C.dropCooldownMs;
  }

  /** 크레인 고리 아래 아이템 중심까지의 거리 */
  hangOffset(def: ItemDef): number {
    switch (def.shape.kind) {
      case 'circle':
        return def.shape.radius + 6;
      case 'box':
      case 'capsule':
        return def.shape.height / 2 + 6;
    }
  }

  private createBody(def: ItemDef, x: number, y: number): Matter.Body {
    const opts: Matter.IChamferableBodyDefinition = {
      density: def.density,
      friction: def.friction,
      restitution: def.restitution,
      frictionAir: C.frictionAir,
      label: def.id,
    };
    switch (def.shape.kind) {
      case 'circle':
        return Matter.Bodies.circle(x, y, def.shape.radius, opts);
      case 'box':
        return Matter.Bodies.rectangle(x, y, def.shape.width, def.shape.height, opts);
      case 'capsule':
        return Matter.Bodies.rectangle(x, y, def.shape.width, def.shape.height, {
          ...opts,
          chamfer: { radius: def.shape.height / 2 - 1 },
        });
    }
  }

  /** rAF에서 호출. 내부적으로 고정 타임스텝으로 나눠 밟는다. */
  update(dtMs: number) {
    // 탭 전환 등으로 dt가 튀면 물리 폭주 방지
    this.accumulatorMs += Math.min(dtMs, 100);
    while (this.accumulatorMs >= C.fixedTimestepMs) {
      this.step(C.fixedTimestepMs);
      this.accumulatorMs -= C.fixedTimestepMs;
    }
  }

  private step(dtMs: number) {
    // 크레인 좌우 왕복
    if (this.phase !== 'gameover') {
      this.craneX += this.craneDir * this.craneSpeed() * (dtMs / 1000);
      if (this.craneX > C.width - C.craneMargin) {
        this.craneX = C.width - C.craneMargin;
        this.craneDir = -1;
      } else if (this.craneX < C.craneMargin) {
        this.craneX = C.craneMargin;
        this.craneDir = 1;
      }
    }

    if (this.holdTimerMs > 0) this.holdTimerMs -= dtMs;

    Matter.Engine.update(this.engine, dtMs);

    for (const item of this.items) {
      // 착지 득점: 저속 유지 + VOID 위
      if (!item.scored && item.body.position.y < C.voidY) {
        if (item.body.speed < C.settleSpeedThreshold) {
          item.settleCount += 1;
          if (item.settleCount >= C.settleFrames) {
            item.scored = true;
            this.score += item.def.points;
            this.events.onScore?.(item.def.points, this.score);
          }
        } else {
          item.settleCount = 0;
        }
      }

      // VOID 낙하 → 즉사 (득점했던 아이템이 굴러떨어져도 게임오버)
      if (this.phase !== 'gameover' && item.body.position.y > C.voidY) {
        this.phase = 'gameover';
        this.culprit = item.def;
        this.events.onGameOver?.(this.score, item.def);
      }
    }
  }

  snapshot(): GameSnapshot {
    return {
      phase: this.phase,
      score: this.score,
      dropCount: this.dropCount,
      craneX: this.craneX,
      current: this.current,
      next: this.next,
      holding: this.holding,
    };
  }

  destroy() {
    Matter.Engine.clear(this.engine);
  }
}
