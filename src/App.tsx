import { useCallback, useState } from 'react';
import GameScreen from './screens/GameScreen';
import LandingScreen from './screens/LandingScreen';
import { consumeHeart } from './lib/hearts';

export default function App() {
  const [screen, setScreen] = useState<'landing' | 'game'>('landing');
  // 랜딩 복귀 후 재시작 시 GameScreen을 새로 마운트하기 위한 키
  const [gameKey, setGameKey] = useState(0);

  const startGame = useCallback(() => {
    if (!consumeHeart()) return;
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  return screen === 'landing' ? (
    <LandingScreen onStart={startGame} />
  ) : (
    <GameScreen key={gameKey} onHome={() => setScreen('landing')} />
  );
}
