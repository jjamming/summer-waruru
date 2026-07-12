import { getSceneUrl } from '../game/assets';
import { MAX_HEARTS } from '../lib/hearts';

function Heart({ filled }: { filled: boolean }) {
  const url = getSceneUrl(filled ? 'heart-full' : 'heart-empty');
  if (url) return <img className="heart-img" src={url} alt="" />;
  return <span className="heart">{filled ? '❤️' : '🤍'}</span>;
}

/** 하트 잔량 행 — 랜딩·게임 종료 모달 공용 (같은 시각 언어) */
export default function HeartsRow({ count }: { count: number }) {
  return (
    <div className="hearts-row" aria-label={`하트 ${count}개 남음`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Heart key={i} filled={i < count} />
      ))}
    </div>
  );
}
