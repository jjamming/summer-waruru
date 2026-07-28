/**
 * 점수 공유 — 토스 안에서는 딥링크(앱 복귀 + OG 썸네일)를 포함해 공유,
 * 토스 밖(로컬 브라우저)에선 Web Share API → 클립보드 순으로 폴백.
 *
 * 딥링크: 받는 사람이 링크를 누르면 토스 앱이 실행되며 우리 게임으로 진입한다
 * (앱 없으면 스토어로). OG 이미지는 카톡 등에서 뜨는 미리보기 썸네일.
 */

import { share as tossShare, getTossShareLink } from '@apps-in-toss/web-framework';

export type ShareResult = 'shared' | 'copied' | 'failed';

/** 토스 앱 딥링크 경로 — granite.config appName 기준 */
const DEEP_LINK = 'intoss://summer-waruru';
/**
 * OG 썸네일 URL (1200×600). 아직 미제작 — 호스팅 후 여기에 URL을 넣으면 링크에 썸네일이 붙는다.
 * 빈 문자열이면 콘솔 마케팅 > OG 이미지에 등록한 전역 기본값이 사용된다(등록돼 있을 때).
 */
const OG_IMAGE_URL = '';

export async function shareScore(score: number): Promise<ShareResult> {
  const text = `🍉 여름 와르르에서 ${score.toLocaleString()}점을 쌓았어요! 토스에서 도전해 보세요.`;

  // 1) 토스 안: 딥링크(앱 복귀 + OG 썸네일)를 포함해 네이티브 공유
  try {
    const link = await getTossShareLink(DEEP_LINK, OG_IMAGE_URL || undefined);
    await tossShare({ message: `${text}\n${link}` });
    return 'shared';
  } catch {
    // 딥링크 생성/공유 실패 — 아래로
  }

  // 2) 토스 안이지만 딥링크가 실패한 경우: 텍스트만이라도 네이티브 공유
  try {
    await tossShare({ message: text });
    return 'shared';
  } catch {
    // 토스 앱 밖에서는 브릿지가 없어 실패 — 아래 폴백으로
  }

  // 3) 토스 밖(로컬 브라우저): Web Share API → 클립보드
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch {
      // 사용자가 시트를 닫았거나 미지원 — 클립보드로
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}
