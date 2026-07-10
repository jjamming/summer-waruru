import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'summer-waruru',
  brand: {
    displayName: '여름와르르',
    primaryColor: '#4AB3E8',
    // TODO: 배포 전 실제 아이콘 이미지 주소로 교체 (null이면 ait build 검증 실패)
    icon: 'https://placehold.co/512x512/4AB3E8/ffffff.png?text=W',
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
  permissions: [],
  outdir: 'dist',
});
