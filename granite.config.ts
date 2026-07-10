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
      dev: 'vite dev',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
