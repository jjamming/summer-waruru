/**
 * 이미지 에셋 로더 — src/assets/에 이미지가 있으면 사용, 없거나 로딩 전이면 null.
 * renderer는 null일 때 이모지 폴백으로 그린다 (에셋 교체가 코드 수정 없이 가능).
 *
 * 기대 경로 (png/webp 모두 지원, webp 권장 — 용량 우위):
 * - 아이템: src/assets/items/<item id>.webp  (예: watermelon.webp)
 * - 장면:   src/assets/background.webp / src/assets/hero.webp / src/assets/crane.webp
 */

const itemModules = import.meta.glob<{ default: string }>('../assets/items/*.{png,webp}', {
  eager: true,
});
const sceneModules = import.meta.glob<{ default: string }>('../assets/*.{png,webp}', {
  eager: true,
});

function fileStem(path: string): string {
  return path.split('/').pop()!.replace(/\.(png|webp)$/, '');
}

function loadImage(url: string): HTMLImageElement {
  const img = new Image();
  img.src = url;
  return img;
}

const itemUrls = new Map<string, string>(
  Object.entries(itemModules).map(([path, mod]) => [fileStem(path), mod.default]),
);
const itemImages = new Map<string, HTMLImageElement>(
  [...itemUrls].map(([id, url]) => [id, loadImage(url)]),
);
const sceneUrls = new Map<string, string>(
  Object.entries(sceneModules).map(([path, mod]) => [fileStem(path), mod.default]),
);
const sceneImages = new Map<string, HTMLImageElement>(
  [...sceneUrls].map(([name, url]) => [name, loadImage(url)]),
);

function ready(img: HTMLImageElement | undefined): HTMLImageElement | null {
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** 캔버스에 그릴 수 있는 아이템 이미지 (없으면 null → 이모지 폴백) */
export function getItemImage(id: string): HTMLImageElement | null {
  return ready(itemImages.get(id));
}

/** <img src>용 아이템 이미지 URL (NEXT 카드 등 DOM에서 사용, 없으면 null → 이모지 폴백) */
export function getItemImageUrl(id: string): string | null {
  return itemUrls.get(id) ?? null;
}

/** 캔버스에 그릴 수 있는 장면 이미지 (background, crane 등) */
export function getSceneImage(name: 'background' | 'crane'): HTMLImageElement | null {
  return ready(sceneImages.get(name));
}

/** <img src>용 URL (hero, logo, heart-full 등 DOM에서 쓰는 이미지) */
export function getSceneUrl(name: string): string | null {
  return sceneUrls.get(name) ?? null;
}
