import { useCallback, useEffect, useRef, useState } from 'react';
import GameScreen from './screens/GameScreen';
import LandingScreen from './screens/LandingScreen';
import { consumeHeart } from './lib/hearts';
import { kvSet } from './lib/kv';

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'game'>('landing');
  // 랜딩 복귀 후 재시작 시 GameScreen을 새로 마운트하기 위한 키
  const [gameKey, setGameKey] = useState(0);
  // 출시 가이드: 미니앱 종료 시 확인 모달 노출
  const [exitConfirm, setExitConfirm] = useState(false);

  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    // 토스 앱 안: OS 스와이프 뒤로가기 제스처 차단 (출시 가이드)
    // 가로/세로 모두 지원하므로 방향 고정은 하지 않는다 — 밖(로컬 브라우저)에서는 조용히 무시
    import('@apps-in-toss/web-framework')
      .then((m) => {
        m.setIosSwipeGestureEnabled({ isEnabled: false }).catch(() => {});
        // env(safe-area-inset-top)이 0인 웹뷰 대비 — 네이티브 인셋을 CSS 변수로 주입
        try {
          const insets = m.SafeAreaInsets.get() as unknown as { top?: number };
          if (insets?.top && insets.top > 0) {
            document.documentElement.style.setProperty('--toss-sat', `${insets.top}px`);
          }
        } catch {
          // 토스 밖 — env()와 14px 최소값으로 충분
        }
        // 사용자 식별키 발급·저장 (출시 체크리스트 3번, 리더보드 대비)
        m.getUserKeyForGame()
          .then((key) => {
            if (key) kvSet('summer-waruru:user-key', String(key));
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // 뒤로가기: 게임 중이면 랜딩 복귀, 랜딩이면 종료 확인 모달 (기본 닫기 차단)
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    import('@apps-in-toss/web-framework')
      .then((m) => {
        if (cancelled) return;
        unsubscribe = m.graniteEvent.addEventListener('backEvent', {
          onEvent: () => {
            if (screenRef.current === 'game') setScreen('landing');
            else setExitConfirm(true);
          },
          onError: () => {},
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const startGame = useCallback(() => {
    if (!consumeHeart()) return;
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const exitApp = useCallback(() => {
    import('@apps-in-toss/web-framework')
      .then((m) => m.closeView())
      .catch(() => setExitConfirm(false));
  }, []);

  return (
    <>
      {screen === 'landing' ? (
        <LandingScreen onStart={startGame} />
      ) : (
        <GameScreen key={gameKey} onHome={() => setScreen('landing')} />
      )}

      {exitConfirm && (
        <div className="modal-dim exit-confirm" onPointerDown={(e) => e.stopPropagation()}>
          <div className="modal-card">
            <h2 className="modal-title">여름 와르르를 종료할까요?</h2>
            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => setExitConfirm(false)}>
                계속하기
              </button>
              <button className="text-link" onClick={exitApp}>
                종료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
