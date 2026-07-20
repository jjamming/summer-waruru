/** 아이템 로스터 — 모양·배점·물리 특성 (노션 배점표 초안) */

export type ItemShape =
  | { kind: 'circle'; radius: number }
  | { kind: 'box'; width: number; height: number }
  /** 돌고래처럼 길쭉한 모양: 모서리 깎은 직사각형 */
  | { kind: 'capsule'; width: number; height: number };

export interface ItemDef {
  id: string;
  /** NEXT 카드에 표시할 이름 */
  label: string;
  emoji: string;
  shape: ItemShape;
  /** 착지 시 득점 */
  points: number;
  /** matter.js density (기본 0.001) — 무게감 차이 */
  density: number;
  friction: number;
  restitution: number;
  /** 시드 뽑기 가중치 (높을수록 자주 등장) */
  weight: number;
  /** 초반 보장 등장 아이템 (평평·안정 — "쌓는 게임" 멘탈모델 형성용, rng.ts 참고) */
  opener?: boolean;
  /** 무게중심 세로 오프셋 (논리 px, +아래) — 유리잔처럼 위가 무거운 아이템 안정화 */
  comOffsetY?: number;
}

export const ITEMS: ItemDef[] = [
  {
    id: 'watermelon',
    label: '수박',
    emoji: '🍉',
    shape: { kind: 'circle', radius: 23 },
    points: 50,
    density: 0.0022,
    friction: 0.55,
    restitution: 0.04,
    weight: 10,
  },
  {
    id: 'tube',
    // 누워 있는 튜브 — 위가 평평한 납작 캡슐, 쌓기 좋은 안정재 (UT 피드백으로 원형→납작 전환)
    label: '튜브',
    emoji: '🛟',
    shape: { kind: 'capsule', width: 46, height: 16 },
    points: 15,
    density: 0.0009,
    friction: 0.7,
    restitution: 0.05,
    weight: 12,
    opener: true,
  },
  {
    id: 'strawberry',
    label: '딸기',
    emoji: '🍓',
    shape: { kind: 'circle', radius: 13 },
    points: 10,
    density: 0.001,
    friction: 0.6,
    restitution: 0.06,
    weight: 12,
  },
  {
    id: 'cooler',
    // 대형 안정 박스 — 탑의 토대용
    label: '아이스박스',
    emoji: '🧊',
    shape: { kind: 'box', width: 44, height: 30 },
    points: 20,
    density: 0.0016,
    friction: 0.75,
    restitution: 0.02,
    weight: 10,
    opener: true,
  },
  {
    id: 'bucket',
    label: '모래 양동이',
    emoji: '🪣',
    shape: { kind: 'box', width: 30, height: 26 },
    points: 20,
    density: 0.0012,
    friction: 0.65,
    restitution: 0.04,
    weight: 8,
    opener: true,
  },
  {
    id: 'patbingsu',
    label: '팥빙수',
    emoji: '🍧',
    shape: { kind: 'box', width: 34, height: 30 },
    points: 30,
    density: 0.0014,
    friction: 0.7,
    restitution: 0.02,
    weight: 12,
    opener: true,
    comOffsetY: 10,
  },
  {
    id: 'watermelon-slice',
    // 사다리꼴 조각 — 넓은 바닥이라 안정적, 배점 중간. 물리는 박스로 근사
    label: '수박 조각',
    emoji: '🍉',
    shape: { kind: 'box', width: 40, height: 28 },
    points: 25,
    density: 0.0014,
    friction: 0.6,
    restitution: 0.04,
    weight: 10,
    opener: true,
  },
  {
    id: 'icecream',
    // 위가 무겁고 아래가 좁은 꼴 → 세로 박스로 근사, 쌓기 까다로워 중상 배점
    label: '아이스크림',
    emoji: '🍦',
    shape: { kind: 'box', width: 22, height: 36 },
    points: 35,
    density: 0.001,
    friction: 0.6,
    restitution: 0.05,
    weight: 10,
  },
  {
    id: 'fan',
    label: '선풍기',
    emoji: '🪭',
    shape: { kind: 'box', width: 24, height: 40 },
    points: 30,
    density: 0.0013,
    friction: 0.6,
    restitution: 0.04,
    weight: 8,
  },
  {
    id: 'sunglasses',
    // 얇고 넓적함 → 돌고래처럼 캡슐, 균형 잡기 어려워 고배점
    label: '썬글라스',
    emoji: '🕶️',
    shape: { kind: 'capsule', width: 46, height: 14 },
    points: 40,
    density: 0.0008,
    friction: 0.55,
    restitution: 0.06,
    weight: 8,
  },
  {
    id: 'dolphin',
    // 길쭉해서 쌓기 까다로움 → 고배점
    label: '돌고래',
    emoji: '🐬',
    shape: { kind: 'capsule', width: 52, height: 20 },
    points: 40,
    density: 0.0011,
    friction: 0.5,
    restitution: 0.08,
    weight: 8,
  },
  {
    id: 'duck',
    // 앱 아이콘 마스코트. 바닥은 평평해 잘 앉지만 머리 쪽이 불룩해 위에 쌓기는 중간 난이도
    label: '오리',
    emoji: '🦆',
    shape: { kind: 'box', width: 32, height: 30 },
    points: 25,
    density: 0.001, // 속 빈 고무 장난감이지만 튜브(0.0009)보다 살짝 묵직하게
    friction: 0.65,
    restitution: 0.07, // 고무 반발감, 튜닝된 저반발 월드 기준 중상
    weight: 10,
    comOffsetY: 4, // 오뚝이처럼 아래가 무거운 장난감 — 살짝 하향
  },
];

export function itemById(id: string): ItemDef {
  const def = ITEMS.find((it) => it.id === id);
  if (!def) throw new Error(`unknown item: ${id}`);
  return def;
}
