import { useState } from 'react';
import HeartsRow, { HeartCost } from './HeartsRow';
import HeartTimerChip from './HeartTimerChip';
import { getItemImageUrl } from '../game/assets';
import type { ItemDef } from '../game/items';

import { shareScore } from '../lib/share';
import { inviteForHearts, isHeartRewardEnabled } from '../lib/reward';

interface Props {
  score: number;
  best: number;
  isNewBest: boolean;
  /** 바다에 빠져 게임을 끝낸 아이템 */
  culprit: ItemDef | null;
  /** 이번 판에 쌓은(득점한) 아이템 수 */
  stackedCount: number;
  hearts: number;
  onRetry: () => void;
  onHome: () => void;
  /** 공유 리워드로 하트가 지급됐을 때 새 잔량 전달 */
  onHeartsChange: (heartsLeft: number) => void;
}

/** '수박이' / '튜브가' — 받침 유무로 주격 조사 선택 */
function withSubjectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${word}이(가)`;
  return word + ((code - 0xac00) % 28 > 0 ? '이' : '가');
}

export default function GameOverModal({
  score,
  best,
  isNewBest,
  culprit,
  stackedCount,
  hearts,
  onRetry,
  onHome,
  onHeartsChange,
}: Props) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  // 다시하기 시 하트 차감 연출 후 재시작
  const [consuming, setConsuming] = useState(false);
  const canRetry = hearts > 0;
  // 하트가 0이고 공유 리워드가 켜져 있을 때만 초대 CTA 노출 (강제 유도 금지)
  const canInvite = hearts <= 0 && isHeartRewardEnabled();

  const handleInvite = () => {
    inviteForHearts({
      onGranted: (left) => {
        onHeartsChange(left);
        setShareNote('하트를 받았어요!');
      },
    });
  };

  const handleRetry = () => {
    if (!canRetry || consuming) return;
    setConsuming(true);
    setTimeout(onRetry, 450);
  };

  // "아까웠다" 프레이밍: 최고 기록의 80% 이상으로 아쉽게 못 미쳤을 때
  const gapToBest = best - score;
  const nearMiss = !isNewBest && best > 0 && gapToBest > 0 && score >= best * 0.8;

  const culpritUrl = culprit ? getItemImageUrl(culprit.id) : null;

  const handleShare = async () => {
    const result = await shareScore(score);
    if (result === 'copied') setShareNote('클립보드에 복사했어요');
    else if (result === 'failed') setShareNote('공유에 실패했어요');
  };

  return (
    // 캔버스 탭(투하)과 분리 — 모달 안 터치는 게임에 전달하지 않는다
    <div className="modal-dim" onPointerDown={(e) => e.stopPropagation()}>
      <div className="modal-card">
        <h2 className="modal-title">게임 종료!</h2>

        {culprit && (
          <p className="modal-culprit">
            {culpritUrl ? (
              <img className="modal-culprit-img" src={culpritUrl} alt="" />
            ) : (
              <span>{culprit.emoji}</span>
            )}
            {withSubjectParticle(culprit.label)} 바다에 빠졌어요
          </p>
        )}

        {isNewBest && <div className="modal-best-badge">🏆 최고 기록 달성</div>}

        <div className="modal-score">
          <span className="modal-score-label">점수</span>
          <span className="modal-score-value">{score.toLocaleString()}</span>
          {stackedCount > 0 && (
            <span className="modal-summary">아이템 {stackedCount}개를 쌓았어요</span>
          )}
        </div>

        {nearMiss && <p className="modal-near-miss">최고 기록까지 단 {gapToBest.toLocaleString()}점!</p>}

        <div className="modal-actions">
          {/* 랜딩과 같은 시각 언어로 하트 잔량 표시 — 버튼 라벨은 행동만 */}
          <div className="modal-hearts">
            <HeartsRow count={hearts} consuming={consuming} />
            <HeartTimerChip />
          </div>
          {canRetry ? (
            <button className="btn btn-primary" onClick={handleRetry}>
              다시하기 <HeartCost />
            </button>
          ) : canInvite ? (
            <button className="btn btn-primary" onClick={handleInvite}>
              친구에게 공유하고 하트 받기
            </button>
          ) : (
            <button className="btn btn-primary" disabled>
              하트가 다 떨어졌어요
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleShare}>
            공유하기
          </button>
          {shareNote && <p className="modal-share-note">{shareNote}</p>}
          <button className="text-link" onClick={onHome}>
            처음 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
