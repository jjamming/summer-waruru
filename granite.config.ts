import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'summer-waruru',
  brand: {
    // 콘솔 "앱 정보등록" 이름과 동일해야 함 (심사 요건) — 띄어쓰기 포함 일치
    displayName: '여름 와르르',
    primaryColor: '#4AB3E8',
    // 앱 아이콘 — GitHub Pages(개인정보처리방침 레포)에 호스팅. 원본은 src/assets/app-icon/
    icon: 'https://jjamming.github.io/summer-waruru-privacy/icon-512.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      // --host: 실기기(샌드박스 앱)에서 같은 와이파이로 접속할 수 있게 외부 바인딩
      dev: 'vite dev --host',
      build: 'vite build',
    },
  },
  // 게임용 내비게이션 바 (더보기 + 닫기 X) — 출시 가이드 필수
  webViewProps: {
    type: 'game',
  },
  // 내비바 투명 배경 — 웹뷰가 상태바(다이나믹 아일랜드)까지 풀스크린으로 확장됨.
  // 없으면 iOS에서 상단이 흰 띠로 분리됨 (커뮤니티 #4200 운영진 답변)
  navigationBar: {
    transparentBackground: true,
  },
  permissions: [],
  outdir: 'dist',
});
