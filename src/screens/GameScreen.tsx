import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverModal from '../components/GameOverModal';
import { GameEngine, type GameSnapshot } from '../game/engine';
import { getItemImageUrl, getSceneUrl } from '../game/assets';
import { render, setupCanvas } from '../game/renderer';
import { consumeHeart, heartsLeft } from '../lib/hearts';

const BEST_KEY = 'summer-waruru:best';

function loadBest(): number {
  return Number(localStorage.getItem(BEST_KEY)) || 0;
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

  const startGame = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = new GameEngine({
      onGameOver: (score) => {
        setBest((prev) => {
          const next = Math.max(prev, score);
          localStorage.setItem(BEST_KEY, String(next));
          return next;
        });
      },
    });
    setSnap(engineRef.current.snapshot());
  }, []);

  useEffect(() => {
    startGame();
    const canvas = canvasRef.current!;
    const { ctx, vp } = setupCanvas(canvas);

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const engine = engineRef.current;
      if (engine) {
        engine.update(now - last);
        render(ctx, engine, vp);
        setSnap(engine.snapshot());
      }
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
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
    const engine = engineRef.current;
    if (!engine || engine.phase === 'gameover') return;
    engine.drop();
  }, []);

  const isGameOver = snap?.phase === 'gameover';

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

        {isGameOver && snap && (
          <GameOverModal
            score={snap.score}
            isNewBest={snap.score >= best && snap.score > 0}
            hearts={hearts}
            onRetry={handleRetry}
            onHome={onHome}
          />
        )}
      </div>
    </div>
  );
}
