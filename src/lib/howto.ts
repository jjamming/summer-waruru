/** 게임 방법(튜토리얼) 노출 여부 — 한 번 본 유저에겐 게임 시작 시 자동 노출하지 않는다 */

import { kvGet, kvSet } from './kv';

const KEY = 'summer-waruru:howto-seen:v1';

export function hasSeenHowto(): boolean {
  return kvGet(KEY) === '1';
}

export function markHowtoSeen() {
  kvSet(KEY, '1');
}
