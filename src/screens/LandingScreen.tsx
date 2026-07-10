import { useEffect, useState } from 'react';
import TutorialModal from '../components/TutorialModal';
import { getSceneUrl } from '../game/assets';
import { MAX_HEARTS, formatRemaining, heartsLeft, nextRefillAt } from '../lib/hearts';
import { hasSeenHowto, markHowtoSeen } from '../lib/howto';

interface Props {
  onStart: () => void;
}

function Heart({ filled }: { filled: boolean }) {
  const url = getSceneUrl(filled ? 'heart-full' : 'heart-empty');
  if (url) return <img className="heart-img" src={url} alt="" />;
  return <span className="heart">{filled ? '❤️' : '🤍'}</span>;
}

export default function LandingScreen({ onStart }: Props) {
  // 하트 회복 카운트다운 갱신용
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // 'entry': 첫 게임 시작 시 자동 노출(완료하면 바로 게임 진입), 'manual': 게임 방법 버튼
  const [tutorial, setTutorial] = useState<'entry' | 'manual' | null>(null);

  const hearts = heartsLeft(now);
  const refillAt = nextRefillAt(now);
  const heroUrl = getSceneUrl('hero');
  const logoUrl = getSceneUrl('logo');

  const handleStart = () => {
    if (hasSeenHowto()) onStart();
    else setTutorial('entry');
  };

  const closeTutorial = () => {
    markHowtoSeen();
    setTutorial(null);
  };

  const finishTutorial = () => {
    const mode = tutorial;
    closeTutorial();
    if (mode === 'entry') onStart();
  };

  return (
    <div className="landing" style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : undefined}>
      <div className="landing-hero">
        {logoUrl ? (
          <img className="landing-logo" src={logoUrl} alt="여름 와르르!" />
        ) : (
          <h1 className="landing-title">여름 와르르</h1>
        )}
      </div>

      <div className="landing-bottom">
        <div className="landing-hearts">
          <div className="landing-hearts-row" aria-label={`하트 ${hearts}개 남음`}>
            {Array.from({ length: MAX_HEARTS }, (_, i) => (
              <Heart key={i} filled={i < hearts} />
            ))}
          </div>
          {hearts < MAX_HEARTS && refillAt && (
            <p className="landing-hearts-refill">다음 하트까지 {formatRemaining(refillAt - now)}</p>
          )}
        </div>

        <div className="landing-cta">
          <button className="btn btn-primary btn-xl" disabled={hearts <= 0} onClick={handleStart}>
            {hearts > 0 ? '게임 시작' : '하트가 다 떨어졌어요'}
          </button>
          <button className="btn btn-ghost" onClick={() => setTutorial('manual')}>
            게임 방법
          </button>
        </div>
      </div>

      {tutorial && <TutorialModal onDone={finishTutorial} onClose={closeTutorial} />}
    </div>
  );
}
