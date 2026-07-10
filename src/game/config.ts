/**
 * 게임 밸런싱 설정. 여기 값만 만지면 난이도가 바뀐다.
 * 좌표는 논리 캔버스(LOGICAL_WIDTH × LOGICAL_HEIGHT) 기준.
 */
export const GAME_CONFIG = {
  /** 논리 캔버스 크기 (실제 픽셀은 DPR 스케일) */
  width: 400,
  height: 720,

  /** 판자 개수: 1 또는 2 (노션: config로 조정 가능하게) */
  platformCount: 1 as 1 | 2,
  /** 판자 폭 — 화면 폭 대비 비율 (UT "너무 좁다" 피드백으로 0.46→0.56) */
  platformWidthRatio: 0.56,
  /** 판자 2개일 때 각각의 폭 비율 */
  platformWidthRatioDouble: 0.3,
  /** 판자 윗면 y 좌표 */
  platformY: 560,
  platformThickness: 14,

  /** 크레인 이동 영역 (좌우 마진) */
  craneMargin: 44,
  /** 크레인 y 좌표 (아이템이 매달리는 높이) — HUD(점수/최고기록) 아래 */
  craneY: 158,
  /** 크레인 기본 속도 (논리px/초) */
  craneBaseSpeed: 150,
  /** 투하 횟수당 크레인 속도 증가율 (난이도 램프) */
  craneSpeedRampPerDrop: 0.045,
  /** 크레인 최고 속도 배율 */
  craneMaxSpeedMultiplier: 2.6,

  /** 이 y선(물/VOID)을 넘어 떨어지면 게임오버 */
  voidY: 660,

  /** 착지 판정: 이 속도 미만이 이 프레임 수만큼 지속되면 득점 */
  settleSpeedThreshold: 0.28,
  settleFrames: 25,

  /** 물리 고정 타임스텝 (ms) — 프레임레이트 무관 일관성 위해 고정 */
  fixedTimestepMs: 1000 / 60,

  /** 연속 투하 방지: 직전 아이템 착지 전 투하 금지 대신 최소 간격(ms)만 둠 */
  dropCooldownMs: 450,

  /** 낮을수록 낙하가 느려 착지 충격이 줄어든다 (난이도↓) */
  gravityY: 0.75,
  /** 공기 저항 — 낙하 종단속도 억제 (matter 기본 0.01) */
  frictionAir: 0.02,
} as const;

export type GameConfig = typeof GAME_CONFIG;
