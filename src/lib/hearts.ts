/**
 * 하트(게임 입장권) 시스템 — kv 저장소 기반 (localStorage + 토스 네이티브 미러).
 * 최대 5개. 게임 시작마다 1개 차감, 각 하트는 사용 시점부터 24시간 뒤 개별 회복.
 * 저장값: 아직 회복되지 않은 사용 시각(ms) 배열.
 */

import { kvGet, kvSet } from './kv';

const KEY = 'summer-waruru:hearts:v1';

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 24 * 60 * 60 * 1000;

/** 회복 안 된 사용 기록만 남긴다 */
function loadUsedAt(now: number): number[] {
  try {
    const raw = JSON.parse(kvGet(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t): t is number => typeof t === 'number')
      .filter((t) => t <= now && now - t < HEART_REFILL_MS);
  } catch {
    return [];
  }
}

function save(usedAt: number[]) {
  kvSet(KEY, JSON.stringify(usedAt));
}

export function heartsLeft(now = Date.now()): number {
  return MAX_HEARTS - loadUsedAt(now).length;
}

/** 하트 1개 차감. 남은 게 없으면 false */
export function consumeHeart(now = Date.now()): boolean {
  const usedAt = loadUsedAt(now);
  if (usedAt.length >= MAX_HEARTS) return false;
  usedAt.push(now);
  save(usedAt);
  return true;
}

/** 가장 이른 하트 회복 시각 (전부 차 있으면 null) */
export function nextRefillAt(now = Date.now()): number | null {
  const usedAt = loadUsedAt(now);
  if (usedAt.length === 0) return null;
  return Math.min(...usedAt) + HEART_REFILL_MS;
}

/** "3시간 12분" / "45분" / "1분 미만" */
export function formatRemaining(ms: number): string {
  if (ms < 60_000) return '1분 미만';
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
