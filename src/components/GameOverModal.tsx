import { useState } from 'react';
import { formatRemaining, nextRefillAt } from '../lib/hearts';
import { shareScore } from '../lib/share';

interface Props {
  score: number;
  isNewBest: boolean;
  hearts: number;
  onRetry: () => void;
  onHome: () => void;
}

export default function GameOverModal({ score, isNewBest, hearts, onRetry, onHome }: Props) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const canRetry = hearts > 0;
  const refillAt = nextRefillAt();

  const handleShare = async () => {
    const result = await shareScore(score);
    if (result === 'copied') setShareNote('클립보드에 복사했어요');
    else if (result === 'failed') setShareNote('공유에 실패했어요');
  };

  return (
    // 캔버스 탭(투하)과 분리 — 모달 안 터치는 게임에 전달하지 않는다
    <div className="modal-dim" onPointerDown={(e) => e.stopPropagation()}>
      <div className="modal-card">
        <div className="modal-emoji">🌊</div>
        <h2 className="modal-title">게임 끝!</h2>
        {isNewBest && <div className="modal-best-badge">🏆 최고 기록 달성</div>}
        <div className="modal-score">
          <span className="modal-score-label">점수</span>
          <span className="modal-score-value">{score.toLocaleString()}</span>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" disabled={!canRetry} onClick={onRetry}>
            {canRetry ? `다시하기 (❤️ ${hearts})` : '하트가 다 떨어졌어요'}
          </button>
          <button className="btn btn-secondary" onClick={handleShare}>
            공유하기
          </button>
          {!canRetry && refillAt && (
            <p className="modal-refill">다음 하트까지 {formatRemaining(refillAt - Date.now())}</p>
          )}
          {shareNote && <p className="modal-share-note">{shareNote}</p>}
          <button className="btn btn-ghost" onClick={onHome}>
            처음 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
