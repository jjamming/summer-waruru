/**
 * 공유 리워드 — 친구에게 공유하고 하트를 받는 바이럴 루프.
 * 앱인토스 `contactsViral`(연락처 모듈 + 토스 알림 푸시)로 진행한다.
 * 친구 한 명 공유 완료마다 `sendViral` 이벤트가 오고, 우리 로직으로 하트 +1(최대 5 캡).
 *
 * moduleId는 콘솔 > 공유 리워드 메뉴에서 발급되는 UUID (리워드 단위 '하트', 수량 1).
 * 미설정(빈 문자열)이면 기능이 자동으로 비활성화된다 — 콘솔 설정 타이밍과 코드를 분리.
 *
 * 지급 규칙(플랫폼): 하나의 리워드 ID 기준 한 사용자에게 하루 1회, 매일 초기화.
 * 즉 하트 24h 회복과 겹쳐 매일 보충되는 데일리 루프가 된다.
 */

import { grantHeart } from './hearts';

/** 콘솔 > 공유 리워드에서 발급된 리워드 ID (UUID). 빈 문자열이면 기능 비활성. */
export const HEART_REWARD_MODULE_ID = '71c68c26-97f4-4307-9bd0-aa278c569c08';

/** 공유 리워드 기능을 쓸 수 있는지 (moduleId 설정 여부) */
export function isHeartRewardEnabled(): boolean {
  return HEART_REWARD_MODULE_ID.length > 0;
}

interface InviteHandlers {
  /** 친구 1명 공유 완료 시 — 하트 지급 후 새 잔량을 전달 */
  onGranted: (heartsLeft: number) => void;
  /** 모듈이 정상 종료됐을 때 (뒤로가기·더 받을 리워드 없음 등) */
  onClose?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * 친구 공유 → 하트 받기 플로우를 띄운다.
 * 토스 밖(로컬 브라우저)이나 moduleId 미설정이면 조용히 no-op.
 * contactsViral cleanup은 모듈 종료(close) 시 자동 호출한다.
 */
export function inviteForHearts({ onGranted, onClose, onError }: InviteHandlers): void {
  if (!isHeartRewardEnabled()) return;

  import('@apps-in-toss/web-framework')
    .then((m) => {
      let cleanup: (() => void) | undefined;
      cleanup = m.contactsViral({
        options: { moduleId: HEART_REWARD_MODULE_ID },
        onEvent: (event) => {
          if (event.type === 'sendViral') {
            // 친구 1명 공유 완료 — 하트 +1 (grantHeart가 5 캡 처리)
            onGranted(grantHeart());
          } else if (event.type === 'close') {
            cleanup?.();
            onClose?.();
          }
        },
        onError: (error) => {
          cleanup?.();
          onError?.(error);
        },
      });
    })
    .catch((error) => {
      // 토스 밖 — 네이티브 브릿지 없음
      onError?.(error);
    });
}
