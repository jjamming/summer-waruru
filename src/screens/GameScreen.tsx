import { useCallback, useEffect, useRef, useState } from 'react';
import GameOverModal from '../components/GameOverModal';
import TutorialModal from '../components/TutorialModal';
import { HeartCost } from '../components/HeartsRow';
import { GameEngine, type GameSnapshot } from '../game/engine';
import { getItemImageUrl } from '../game/assets';
import { render, setupCanvas } from '../game/renderer';
import { consumeHeart, heartsLeft } from '../lib/hearts';
import { kvGet, kvSet } from '../lib/kv';
import { hasSeenHowto, markHowtoSeen } from '../lib/howto';
import { sfx, unlockAudio, isSoundOn, setSoundOn } from '../lib/sound';
import { haptics, isHapticOn, setHapticOn } from '../lib/haptic';

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
  // 일시정지 메뉴 열림 / 3-2-1 카운트다운 진행 중
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  const [hapticOn, setHapticOnState] = useState(isHapticOn);
  // 튜토리얼·일시정지·카운트다운 중에는 물리 정지
  const pausedRef = useRef(false);
  pausedRef.current = showTutorial || paused || countdown !== null;

  const closeTutorial = useCallback(() => {
    markHowtoSeen();
    setShowTutorial(false);
  }, []);

  const startGame = useCallback(() => {
    engineRef.current?.destroy();
    engineRef.current = new GameEngine({
      onScore: () => {
        sfx.land();
        haptics.score();
      },
      onGameOver: (score) => {
        sfx.splash();
        haptics.fall();
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
    if (wasHolding) {
      sfx.drop();
      haptics.drop();
    }
  }, []);

  // 3-2-1 카운트다운 — 0이 되면 종료(pausedRef가 다시 false → 물리 재개)
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 700);
    return () => clearTimeout(t);
  }, [countdown]);

  const toggleSound = useCallback(() => {
    const next = !isSoundOn();
    setSoundOn(next);
    setSoundOnState(next);
  }, []);

  const toggleHaptic = useCallback(() => {
    const next = !isHapticOn();
    setHapticOn(next);
    setHapticOnState(next);
  }, []);

  // 계속하기: 메뉴 닫고 3-2-1 후 재개
  const resumeWithCountdown = useCallback(() => {
    setPaused(false);
    setCountdown(3);
  }, []);

  // 다시하기: 하트 1개 차감 → 새 게임 → 3-2-1 후 시작
  const restartFromPause = useCallback(() => {
    if (!consumeHeart()) return;
    setHearts(heartsLeft());
    startGame();
    setPaused(false);
    setCountdown(3);
  }, [startGame]);

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

        {/* HUD — 점수는 상단 중앙 대형 (낙하 시선 경로에 걸리게), 하트는 게임 중 비노출 */}
        <div className="hud">
          {!isGameOver && !showTutorial && !paused && countdown === null && (
            <button
              className="pause-btn"
              aria-label="일시정지"
              // 캔버스 탭(투하)과 분리 — 버튼 터치는 게임에 전달하지 않는다
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setPaused(true)}
            >
              <span className="pause-btn-bar" />
              <span className="pause-btn-bar" />
            </button>
          )}
          <div className="hud-score" key={snap?.score ?? 0}>
            <div className="score-value">{snap?.score.toLocaleString() ?? 0}</div>
            <div className="score-best">최고 기록 {best.toLocaleString()}</div>
          </div>
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

        {showTutorial && <TutorialModal onDone={closeTutorial} onClose={closeTutorial} />}

        {paused && (
          // 캔버스 탭과 분리 — 모달 안 터치는 게임에 전달하지 않는다
          <div className="modal-dim" onPointerDown={(e) => e.stopPropagation()}>
            <div className="modal-card">
              <h2 className="modal-title">일시정지</h2>
              <div className="modal-actions">
                <button className="pause-toggle" onClick={toggleSound}>
                  <span>효과음</span>
                  <span className={`pause-toggle-state ${soundOn ? 'on' : ''}`}>
                    {soundOn ? '켜짐' : '꺼짐'}
                  </span>
                </button>
                <button className="pause-toggle" onClick={toggleHaptic}>
                  <span>진동</span>
                  <span className={`pause-toggle-state ${hapticOn ? 'on' : ''}`}>
                    {hapticOn ? '켜짐' : '꺼짐'}
                  </span>
                </button>
                <button className="btn btn-primary" onClick={resumeWithCountdown}>
                  계속하기
                </button>
                <button className="btn btn-secondary" disabled={hearts <= 0} onClick={restartFromPause}>
                  {hearts > 0 ? (
                    <>
                      다시하기 <HeartCost />
                    </>
                  ) : (
                    '하트가 없어요'
                  )}
                </button>
                <button className="text-link" onClick={onHome}>
                  처음 화면으로
                </button>
              </div>
            </div>
          </div>
        )}

        {countdown !== null && (
          <div className="countdown-overlay">
            <span className="countdown-num" key={countdown}>
              {countdown}
            </span>
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
            onHeartsChange={setHearts}
          />
        )}
      </div>
    </div>
  );
}
