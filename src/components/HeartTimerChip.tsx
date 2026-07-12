import { useEffect, useState } from 'react';
import { nextRefillAt } from '../lib/hearts';

function fmt(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** 다음 하트 회복까지 실시간 카운트다운 칩 — 하트가 가득이면 렌더하지 않음 */
export default function HeartTimerChip() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const at = nextRefillAt(now);
  if (!at) return null;
  return <span className="heart-timer">⏱ {fmt(at - now)}</span>;
}
