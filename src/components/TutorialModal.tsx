import { useState } from 'react';
import PhysicsDemo from './PhysicsDemo';
import { getItemImageUrl, getSceneUrl } from '../game/assets';

interface Props {
  onDone: () => void;
  onClose: () => void;
}

/** 게임 에셋으로 만든 루프 데모 3단계 튜토리얼 */
export default function TutorialModal({ onDone, onClose }: Props) {
  const [step, setStep] = useState(0);

  const crane = getSceneUrl('crane');
  const melon = getItemImageUrl('watermelon');
  const slice = getItemImageUrl('watermelon-slice');
  const patbingsu = getItemImageUrl('patbingsu');
  const tube = getItemImageUrl('tube');

  const steps = [
    {
      title: '아이템을 잡은 구름이 움직여요',
      desc: '화면을 터치해서 아이템을 떨어뜨려요.',
      demo: (
        <div className="demo demo-drop">
          {/* 구름·로프·아이템을 한 리그로 묶어 항상 같이 움직인다 */}
          <div className="demo-crane-rig">
            {crane ? <img className="demo-crane" src={crane} alt="" /> : <span className="demo-crane demo-fallback">☁️</span>}
            <div className="demo-rope" />
            {melon ? <img className="demo-hang" src={melon} alt="" /> : <span className="demo-hang demo-fallback">🍉</span>}
          </div>
          <div className="demo-tap" />
          <div className="demo-plank" />
          <div className="demo-sea" />
        </div>
      ),
    },
    {
      title: '차곡차곡 쌓아봐요',
      desc: '떨어뜨린 아이템은 그 자리에 그대로 쌓여요.',
      demo: (
        <div className="demo demo-merge">
          {melon ? <img className="demo-merge-bottom" src={melon} alt="" /> : <span className="demo-merge-bottom demo-fallback">🍉</span>}
          {melon ? <img className="demo-merge-top" src={melon} alt="" /> : <span className="demo-merge-top demo-fallback">🍉</span>}
          <div className="demo-merge-note">차곡차곡!</div>
          <div className="demo-plank" />
          <div className="demo-sea" />
        </div>
      ),
    },
    {
      title: '아이템이 바다에 떨어지면 탈락!',
      desc: '무너지지 않게 조심하세요.',
      demo: (
        <div className="demo demo-fail">
          {/* 실제 물리엔진(matter.js)으로 무너지는 탑 */}
          <PhysicsDemo />
        </div>
      ),
    },
    {
      title: '아이템을 쌓아 점수 획득',
      desc: '최대한 많은 아이템을 쌓아보세요!',
      demo: (
        <div className="demo demo-stack">
          {slice ? <img className="demo-stack-1" src={slice} alt="" /> : <span className="demo-stack-1 demo-fallback">🍉</span>}
          {patbingsu ? <img className="demo-stack-2" src={patbingsu} alt="" /> : <span className="demo-stack-2 demo-fallback">🍧</span>}
          {tube ? <img className="demo-stack-3" src={tube} alt="" /> : <span className="demo-stack-3 demo-fallback">🛟</span>}
          <div className="demo-score">+25 +20 +15</div>
          <div className="demo-plank" />
          <div className="demo-sea" />
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="modal-dim" onPointerDown={(e) => e.stopPropagation()}>
      <div className="modal-card tutorial-card">
        <button className="tutorial-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {/* key로 리마운트해서 단계 전환마다 애니메이션 재시작 */}
        <div key={step}>{current.demo}</div>

        <h2 className="tutorial-title">{current.title}</h2>
        <p className="tutorial-desc">{current.desc}</p>

        <div className="tutorial-dots">
          {steps.map((_, i) => (
            <span key={i} className={i === step ? 'dot active' : 'dot'} />
          ))}
        </div>

        <div className="modal-actions">
          {isLast ? (
            <button className="btn btn-primary" onClick={onDone}>
              이해했어요!
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)}>
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
