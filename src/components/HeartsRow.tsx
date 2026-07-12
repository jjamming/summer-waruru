import { getSceneUrl } from '../game/assets';
import { MAX_HEARTS } from '../lib/hearts';

function Heart({ filled, popping }: { filled: boolean; popping?: boolean }) {
  const url = getSceneUrl(filled ? 'heart-full' : 'heart-empty');
  const cls = popping ? 'heart-pop' : undefined;
  if (url) return <img className={`heart-img ${cls ?? ''}`} src={url} alt="" />;
  return <span className={`heart ${cls ?? ''}`}>{filled ? '❤️' : '🤍'}</span>;
}

/** 버튼 안에 붙이는 입장 비용 표기 (❤️×1) */
export function HeartCost() {
  const url = getSceneUrl('heart-full');
  return (
    <span className="btn-cost">
      {url ? <img className="btn-cost-img" src={url} alt="하트" /> : '❤️'}×1
    </span>
  );
}

interface Props {
  count: number;
  /** true면 마지막 찬 하트가 터지는 차감 연출 */
  consuming?: boolean;
}

/** 하트 잔량 행 — 랜딩·게임 종료 모달 공용 (같은 시각 언어) */
export default function HeartsRow({ count, consuming }: Props) {
  return (
    <div className="hearts-row" aria-label={`하트 ${count}개 남음`}>
      {Array.from({ length: MAX_HEARTS }, (_, i) => (
        <Heart key={i} filled={i < count} popping={consuming && i === count - 1} />
      ))}
    </div>
  );
}
