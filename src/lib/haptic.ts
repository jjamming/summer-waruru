/**
 * 햅틱 진동 — 앱인토스 generateHapticFeedback.
 * 사운드와 독립 토글: 무음 모드(iOS 무음 스위치)에서도 촉각 피드백이 남아 "무음 대응" 역할.
 * 시스템 진동 비활성화 상황은 네이티브가 알아서 무시(no-op)하고, 토스 밖(로컬 브라우저)에선
 * 브릿지가 없어 던질 수 있으므로 에러를 삼킨다.
 */

import { generateHapticFeedback, type HapticFeedbackType } from '@apps-in-toss/web-framework';
import { kvGet, kvSet } from './kv';

const KEY = 'summer-waruru:haptic';

let enabled = kvGet(KEY) !== '0';

export function isHapticOn(): boolean {
  return enabled;
}

export function setHapticOn(on: boolean) {
  enabled = on;
  kvSet(KEY, on ? '1' : '0');
}

function fire(type: HapticFeedbackType) {
  if (!enabled) return;
  try {
    generateHapticFeedback({ type })?.catch(() => {});
  } catch {
    // 토스 밖 — 네이티브 브릿지 없음
  }
}

export const haptics = {
  /** 크레인에서 아이템 투하 */
  drop: () => fire('tap'),
  /** 아이템 착지 득점(+점수) */
  score: () => fire('success'),
  /** 아이템이 바다에 빠짐(게임오버) */
  fall: () => fire('error'),
};
