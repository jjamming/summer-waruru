/**
 * 키-값 저장소 파사드.
 * 읽기/쓰기는 localStorage(동기) 기준, 쓰기는 토스 네이티브 Storage에도 미러링.
 * 부팅 시 hydrateKV()가 네이티브 값을 localStorage로 복원 — 웹뷰 캐시가 삭제돼도
 * 하트·최고기록 등이 유지된다 (출시 체크리스트 3번 "재접속 시 데이터 유지").
 */

type NativeStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

/** 네이티브에 미러링할 키 목록 — 새 영구 데이터 추가 시 여기에 등록 */
const MIRROR_KEYS = [
  'summer-waruru:hearts:v1',
  'summer-waruru:best',
  'summer-waruru:howto-seen:v1',
  'summer-waruru:sound',
  'summer-waruru:haptic',
  'summer-waruru:user-key',
];

let native: NativeStorage | null = null;

/** 앱 렌더 전에 1회 호출 — 네이티브 값을 localStorage로 복원 (토스 밖에선 no-op) */
export async function hydrateKV(): Promise<void> {
  try {
    const m = await import('@apps-in-toss/web-framework');
    native = m.Storage;
    await Promise.all(
      MIRROR_KEYS.map(async (key) => {
        if (localStorage.getItem(key) != null) return; // 로컬 값이 있으면 그것이 최신
        const value = await native!.getItem(key);
        if (value != null) localStorage.setItem(key, value);
      }),
    );
  } catch {
    // 토스 밖(로컬 브라우저) — localStorage만 사용
  }
}

export function kvGet(key: string): string | null {
  return localStorage.getItem(key);
}

export function kvSet(key: string, value: string) {
  localStorage.setItem(key, value);
  native?.setItem(key, value).catch(() => {});
}
