/** 반응형 레이아웃 판정 — 화면 정책은 docs/decisions.md 참고 */

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * 세로판(9:21) 이미지가 커버하기 어려운 화면 → -wide(16:9) 에셋 사용.
 * 경계 근거: 가장 넓은 폰(16:9 = 0.5625)까지는 세로판의 중앙 크롭이 원본 구도와 일치하지만,
 * 태블릿 세로(3:4 = 0.75)부터는 하단 물결·모래가 잘린다. 와이드판은 좌우 장식만 잘려 안전.
 */
export const WIDE_LAYOUT_QUERY = '(min-aspect-ratio: 3/5)';

/** 스마트폰 가로모드 (가로인데 세로가 짧음) → 앱 전체 미지원, 회전 안내 */
export const PHONE_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 500px)';

/** 게임 화면은 기기 불문 세로 전용 — 가로면 일시정지 + 회전 안내 (랜딩은 가로 허용) */
export const LANDSCAPE_QUERY = '(orientation: landscape)';
