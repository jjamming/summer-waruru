/**
 * 점수 공유 — 토스 네이티브 공유 시트 우선, 토스 밖(로컬 브라우저)에선
 * Web Share API → 클립보드 순으로 폴백.
 */

import { share as tossShare } from '@apps-in-toss/web-framework';

export type ShareResult = 'shared' | 'copied' | 'failed';

export async function shareScore(score: number): Promise<ShareResult> {
  const message = `🍉 여름 와르르에서 ${score.toLocaleString()}점을 쌓았어요! 토스에서 도전해 보세요.`;

  try {
    await tossShare({ message });
    return 'shared';
  } catch {
    // 토스 앱 밖에서는 브릿지가 없어 실패 — 아래 폴백으로
  }

  if (navigator.share) {
    try {
      await navigator.share({ text: message });
      return 'shared';
    } catch {
      // 사용자가 시트를 닫았거나 미지원 — 클립보드로
    }
  }

  try {
    await navigator.clipboard.writeText(message);
    return 'copied';
  } catch {
    return 'failed';
  }
}
