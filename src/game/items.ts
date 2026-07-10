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
}

export const ITEMS: ItemDef[] = [
  {
    id: 'watermelon',
    label: '수박',
    emoji: '🍉',
    shape: { kind: 'circle', radius: 27 },
    points: 50,
    density: 0.0022,
    friction: 0.55,
    restitution: 0.04,
    weight: 10,
  },
  {
    id: 'tube',
    // 노션: 링 형태지만 물리는 단순 원형, 점수 하향
    label: '튜브',
    emoji: '🛟',
    shape: { kind: 'circle', radius: 23 },
    points: 15,
    density: 0.0008,
    friction: 0.65,
    restitution: 0.1,
    weight: 12,
  },
  {
    id: 'peach',
    label: '복숭아',
    emoji: '🍑',
    shape: { kind: 'circle', radius: 18 },
    points: 20,
    density: 0.0012,
    friction: 0.55,
    restitution: 0.06,
    weight: 14,
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
    weight: 16,
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
];

export function itemById(id: string): ItemDef {
  const def = ITEMS.find((it) => it.id === id);
  if (!def) throw new Error(`unknown item: ${id}`);
  return def;
}
