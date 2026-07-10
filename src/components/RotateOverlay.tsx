import { getSceneUrl } from '../game/assets';

/** 가로 화면 안내 — hero 이미지 위에 딤 처리 */
export default function RotateOverlay() {
  const heroUrl = getSceneUrl('hero');
  return (
    <div
      className="rotate-overlay"
      style={
        heroUrl
          ? { backgroundImage: `linear-gradient(rgba(6, 24, 44, 0.66), rgba(6, 24, 44, 0.66)), url(${heroUrl})` }
          : undefined
      }
    >
      <div className="rotate-emoji">📱</div>
      <p>여름 와르르는 세로 화면에서 플레이 할 수 있어요.</p>
    </div>
  );
}
