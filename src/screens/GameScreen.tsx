import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverModal from '../components/GameOverModal';
import TutorialModal from '../components/TutorialModal';
import { GameEngine, type GameSnapshot } from '../game/engine';
import { getItemImageUrl, getSceneUrl } from '../game/assets';
import { render, setupCanvas } from '../game/renderer';
import { consumeHeart, heartsLeft } from '../lib/hearts';
import { kvGet, kvSet } from '../lib/kv';
import { hasSeenHowto, markHowtoSeen } from '../lib/howto';
import { sfx, unlockAudio } from '../lib/sound';

const BEST_KEY = 'summer-waruru:best';

function loadBest(): number {
  return Number(kvGet(BEST_KEY)) || 0;
}

interface Props {
  /** 랜딩으로 복귀 */
  onHome: () => void;
}

export default function GameScreen({ onHome }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [snap, setSnap] = useState<GameSnapshot | null>(null);
  const [best, setBest] = useState(loadBest);
  const [hearts, setHearts] = useState(heartsLeft);
  // 최초 플레이어에겐 게임 화면 위에서 튜토리얼을 먼저 — 닫을 때까지 물리(크레인) 정지
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenHowto());
  const pausedRef = useRef(false);
  pausedRef.current = showTutorial;

  const closeTutorial = useCallback(() => {
    markHowtoSeen();
    setShowTutorial(false);
  }, []);

  const startGame = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = new GameEngine({
      onScore: () => sfx.land(),
      onGameOver: (score) => {
        sfx.splash();
        setBest((prev) => {
          const next = Math.max(prev, score);
          kvSet(BEST_KEY, String(next));
          // 풍덩 소리가 잦아든 뒤 결과음
          setTimeout(() => (score >= prev && score > 0 ? sfx.newBest() : sfx.gameover()), 450);
          return next;
        });
      },
    });
    setSnap(engineRef.current.snapshot());
  }, []);

  useEffect(() => {
    startGame();
    const canvas = canvasRef.current!;
    let view = setupCanvas(canvas);
    // 화면 크기·회전 변경 시 뷰포트 재계산 (기기 회전 + 데브툴 디버깅 대응)
    const onResize = () => {
      view = setupCanvas(canvas);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const engine = engineRef.current;
      if (engine) {
        if (!pausedRef.current) engine.update(now - last);
        render(view.ctx, engine, view.vp);
        setSnap(engine.snapshot());
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      engineRef.current?.destroy();
    };
  }, [startGame]);

  // 재시작도 게임 1판 = 하트 1개
  const handleRetry = useCallback(() => {
    if (!consumeHeart()) return;
    setHearts(heartsLeft());
    startGame();
  }, [startGame]);

  const handleTap = useCallback(() => {
    unlockAudio(); // 사용자 제스처 시점에 iOS 오디오 잠금 해제
    const engine = engineRef.current;
    if (!engine || engine.phase === 'gameover' || pausedRef.current) return;
    const wasHolding = engine.holding;
    engine.drop();
    if (wasHolding) sfx.drop();
  }, []);

  const isGameOver = snap?.phase === 'gameover';

  // 게임오버 연출: 탑이 무너지는 걸 잠깐 보여준 뒤 모달 (물리는 계속 돈다)
  const [gameOverVisible, setGameOverVisible] = useState(false);
  useEffect(() => {
    if (!isGameOver) {
      setGameOverVisible(false);
      return;
    }
    const t = setTimeout(() => setGameOverVisible(true), 800);
    return () => clearTimeout(t);
  }, [isGameOver]);

  return (
    <div className="app" onPointerDown={handleTap}>
      <div className="stage">
        <canvas ref={canvasRef} className="game-canvas" />

        {/* HUD */}
        <div className="hud">
          <div className="hud-top">
            <div className="badge">점수 {snap?.score.toLocaleString() ?? 0}</div>
            <div className="badge">최고 기록 {best.toLocaleString()}</div>
          </div>
          <div className="hud-sub">
            <div className="life-badge">
              {getSceneUrl('heart-full') ? (
                <img className="life-badge-img" src={getSceneUrl('heart-full')!} alt="하트" />
              ) : (
                '❤️'
              )}{' '}
              {hearts}
            </div>
            {/* 다음 아이템은 최고 기록 아래(우측) */}
            <div className="next-card">
              <div className="next-title">다음</div>
              {snap && (
                <div className="next-emoji">
                  {getItemImageUrl(snap.next.id) ? (
                    <img className="next-img" src={getItemImageUrl(snap.next.id)!} alt="" />
                  ) : (
                    snap.next.emoji
                  )}
                </div>
              )}
              <div className="next-label">{snap?.next.label}</div>
            </div>
          </div>
        </div>

        {showTutorial && <TutorialModal onDone={closeTutorial} onClose={closeTutorial} />}

        {isGameOver && gameOverVisible && snap && (
          <GameOverModal
            score={snap.score}
            best={best}
            isNewBest={snap.score >= best && snap.score > 0}
            culprit={snap.culprit}
            stackedCount={snap.stackedCount}
            hearts={hearts}
            onRetry={handleRetry}
            onHome={onHome}
          />
        )}
      </div>
    </div>
  );
}
