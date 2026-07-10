import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverModal from '../components/GameOverModal';
import TutorialModal from '../components/TutorialModal';
import { GameEngine, type GameSnapshot } from '../game/engine';
import { getItemImageUrl, getSceneUrl } from '../game/assets';
import { render, setupCanvas } from '../game/renderer';
import { consumeHeart, heartsLeft } from '../lib/hearts';
import { hasSeenHowto, markHowtoSeen } from '../lib/howto';
import { LANDSCAPE_QUERY, WIDE_LAYOUT_QUERY, useMediaQuery } from '../lib/useMedia';

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
  // 최초 플레이어에겐 게임 화면 위에서 튜토리얼을 먼저 — 닫을 때까지 물리(크레인) 정지
  const [showTutorial, setShowTutorial] = useState(() => !hasSeenHowto());
  // 게임은 기기 불문 세로 전용 — 가로면 일시정지 + 회전 안내
  const landscape = useMediaQuery(LANDSCAPE_QUERY);
  const pausedRef = useRef(false);
  pausedRef.current = showTutorial || landscape;

  const closeTutorial = useCallback(() => {
    markHowtoSeen();
    setShowTutorial(false);
  }, []);

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
        if (!pausedRef.current) engine.update(now - last);
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
    if (!engine || engine.phase === 'gameover' || pausedRef.current) return;
    engine.drop();
  }, []);

  const isGameOver = snap?.phase === 'gameover';

  // 게임오버 연출: 탑이 무너지는 걸 잠깐 보여준 뒤 모달 (물리는 계속 돈다)
  const [gameOverVisible, setGameOverVisible] = useState(false);
  useEffect(() => {
    if (!isGameOver) {
      setGameOverVisible(false);
      return;
    }
    const t = setTimeout(() => setGameOverVisible(true), 1100);
    return () => clearTimeout(t);
  }, [isGameOver]);

  // 넓은 화면에선 스테이지 좌우 여백을 가로판 배경으로 채움 (없으면 기본 단색)
  const wide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const wideBgUrl = wide ? getSceneUrl('background-wide') : null;

  return (
    <div className="app" onPointerDown={handleTap}>
      {/* 스테이지 좌우 여백: 블러 처리한 가로판 배경 (이음새·이중 태양 문제 회피) */}
      {wideBgUrl && <div className="side-fill" style={{ backgroundImage: `url(${wideBgUrl})` }} />}
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

        {showTutorial && !landscape && (
          <TutorialModal onDone={closeTutorial} onClose={closeTutorial} />
        )}

        {landscape && (
          <div className="rotate-overlay rotate-overlay-game">
            <div className="rotate-emoji">📱</div>
            <p>게임은 세로 화면에서만 플레이할 수 있어요</p>
          </div>
        )}

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
