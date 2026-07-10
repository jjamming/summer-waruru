import { useCallback, useEffect, useState } from 'react';
import GameScreen from './screens/GameScreen';
import LandingScreen from './screens/LandingScreen';
import { consumeHeart } from './lib/hearts';
import { PHONE_LANDSCAPE_QUERY, useMediaQuery } from './lib/useMedia';

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'game'>('landing');
  // 랜딩 복귀 후 재시작 시 GameScreen을 새로 마운트하기 위한 키
  const [gameKey, setGameKey] = useState(0);
  // 정책: 스마트폰 가로모드 미지원 (태블릿은 -wide 에셋으로 대응)
  const phoneLandscape = useMediaQuery(PHONE_LANDSCAPE_QUERY);

  useEffect(() => {
    // 토스 앱 안에서는 세로 방향 고정 — 밖(로컬 브라우저)에서는 조용히 무시
    import('@apps-in-toss/web-framework')
      .then((m) => m.setDeviceOrientation({ type: 'portrait' }))
      .catch(() => {});
  }, []);

  const startGame = useCallback(() => {
    if (!consumeHeart()) return;
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  return (
    <>
      {screen === 'landing' ? (
        <LandingScreen onStart={startGame} />
      ) : (
        <GameScreen key={gameKey} onHome={() => setScreen('landing')} />
      )}
      {phoneLandscape && (
        <div className="rotate-overlay">
          <div className="rotate-emoji">📱</div>
          <p>세로 화면으로 돌려주세요</p>
        </div>
      )}
    </>
  );
}
