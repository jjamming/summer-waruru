import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { hydrateKV } from './lib/kv';
import './styles.css';

// 네이티브 저장소 복원 후 렌더 — 하트/최고기록이 웹뷰 캐시 삭제에도 유지되게
hydrateKV().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
