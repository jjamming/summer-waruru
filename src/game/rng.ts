/** 아이템 시퀀스 PRNG — 매판 랜덤 시드 (2026-07-10 데일리 시드 제거, decisions.md 참고) */

import { ITEMS, type ItemDef } from './items';

/** mulberry32: 작고 결정적인 PRNG */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 매판 새로 뽑는 랜덤 시드 */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

/** 초반에 보장 등장시킬 안정(평평) 아이템 개수 — "쌓는 게임" 멘탈모델 형성 (UT 피드백) */
const OPENING_FLAT_COUNT = 3;

function pickWeighted(pool: ItemDef[], roll01: number): ItemDef {
  const total = pool.reduce((sum, it) => sum + it.weight, 0);
  let roll = roll01 * total;
  for (const it of pool) {
    roll -= it.weight;
    if (roll <= 0) return it;
  }
  return pool[pool.length - 1];
}

/** 가중치 기반 아이템 시퀀스 생성기 — 첫 N개는 opener(평평·안정) 풀에서만 */
export function createItemSequence(seed: number): () => ItemDef {
  const rand = mulberry32(seed);
  const openers = ITEMS.filter((it) => it.opener);
  let count = 0;
  return () => {
    const pool = count < OPENING_FLAT_COUNT && openers.length > 0 ? openers : ITEMS;
    count += 1;
    return pickWeighted(pool, rand());
  };
}
