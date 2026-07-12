import { useEffect, useState } from 'react';
import HeartsRow, { HeartCost } from '../components/HeartsRow';
import HeartTimerChip from '../components/HeartTimerChip';
import TutorialModal from '../components/TutorialModal';
import { getSceneUrl } from '../game/assets';
import { heartsLeft } from '../lib/hearts';
import soundOffIcon from '../assets/sound-off.svg';
import soundOnIcon from '../assets/sound-on.svg';
import { markHowtoSeen } from '../lib/howto';
import { isSoundOn, setSoundOn } from '../lib/sound';
import { WIDE_LAYOUT_QUERY, useMediaQuery } from '../lib/useMedia';

interface Props {
  onStart: () => void;
}

export default function LandingScreen({ onStart }: Props) {
  // 하트 회복 카운트다운 갱신용
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // 게임 방법 버튼으로 여는 재열람 모달 (최초 자동 노출은 게임 화면에서 처리)
  const [tutorial, setTutorial] = useState(false);
  // 사운드 On/Off (출시 체크리스트: 사용자가 직접 설정 가능)
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  const toggleSound = () => {
    setSoundOn(!soundOn);
    setSoundOnState(!soundOn);
  };

  const hearts = heartsLeft(now);
  // 시작 시 하트 차감 연출 후 게임 진입
  const [consuming, setConsuming] = useState(false);
  const handleStart = () => {
    if (hearts <= 0 || consuming) return;
    setConsuming(true);
    setTimeout(onStart, 450);
  };
  // 넓은 화면(태블릿 가로 등)에선 가로판 히어로 우선, 없으면 세로판 폴백
  const wide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const heroUrl = (wide && getSceneUrl('hero-wide')) || getSceneUrl('hero');
  const logoUrl = getSceneUrl('logo');

  const closeTutorial = () => {
    markHowtoSeen();
    setTutorial(false);
  };

  return (
    <div className="landing" style={heroUrl ? { backgroundImage: `url(${heroUrl})` } : undefined}>
      <button
        className="sound-toggle"
        onClick={toggleSound}
        aria-label={soundOn ? '사운드 끄기' : '사운드 켜기'}
      >
        <img className="sound-toggle-icon" src={soundOn ? soundOnIcon : soundOffIcon} alt="" />
      </button>

      <div className="landing-hero">
        {logoUrl ? (
          <img className="landing-logo" src={logoUrl} alt="여름 와르르!" />
        ) : (
          <h1 className="landing-title">여름 와르르</h1>
        )}
      </div>

      <div className="landing-bottom">
        <div className="landing-hearts">
          <div className="landing-hearts-line">
            <HeartsRow count={hearts} consuming={consuming} />
            <HeartTimerChip />
          </div>
        </div>

        <div className="landing-cta">
          <button className="btn btn-primary btn-xl" disabled={hearts <= 0} onClick={handleStart}>
            {hearts > 0 ? (
              <>
                게임 시작 <HeartCost />
              </>
            ) : (
              '하트가 다 떨어졌어요'
            )}
          </button>
          <button className="btn btn-ghost" onClick={() => setTutorial(true)}>
            게임 방법
          </button>
        </div>
      </div>

      {tutorial && <TutorialModal onDone={closeTutorial} onClose={closeTutorial} />}
    </div>
  );
}
