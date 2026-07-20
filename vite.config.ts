import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor(원스토어 APK) 빌드는 file:// 로딩이라 상대경로 필요.
  // ait(토스) 빌드는 granite가 base를 처리하므로 기본값 유지 — CAP_BUILD 환경변수로만 분기.
  base: process.env.CAP_BUILD ? './' : '/',
  server: {
    host: 'localhost',
    port: 5173,
  },
});
