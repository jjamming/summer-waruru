# 아이템 스프라이트(webp)의 알파 실루엣 → 충돌 폴리곤(컨벡스 헐, 최대 12 꼭짓점) 생성.
# 아트 교체 시 재실행: python3 scripts/gen-hitboxes.py
# 출력: src/game/hitboxes.json (좌표는 이미지 중심 원점, 폭/높이 대비 -0.5~0.5 정규화)

import glob
import json
import os

from PIL import Image

MAX_VERTS = 12
ALPHA_THRESHOLD = 30
SAMPLE_MAX = 256  # 헐 계산용 다운스케일 (정밀도 충분 + 빠름)


def convex_hull(points):
    """Andrew monotone chain."""
    points = sorted(set(points))
    if len(points) <= 2:
        return points

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def simplify(hull, max_n):
    """기여 면적이 가장 작은 꼭짓점부터 제거 — 실루엣 손실 최소화."""
    hull = list(hull)

    def tri_area(a, b, c):
        return abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2

    while len(hull) > max_n:
        n = len(hull)
        idx = min(range(n), key=lambda i: tri_area(hull[i - 1], hull[i], hull[(i + 1) % n]))
        hull.pop(idx)
    return hull


def main():
    out = {}
    for path in sorted(glob.glob('src/assets/items/*.webp')):
        item_id = os.path.basename(path).rsplit('.', 1)[0]
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        scale = min(1.0, SAMPLE_MAX / max(w, h))
        sw, sh = round(w * scale), round(h * scale)
        alpha = img.resize((sw, sh), Image.BILINEAR).getchannel('A')
        px = alpha.load()

        points = [(x, y) for y in range(sh) for x in range(sw) if px[x, y] > ALPHA_THRESHOLD]
        if not points:
            print(f'skip {item_id}: no opaque pixels')
            continue

        verts = simplify(convex_hull(points), MAX_VERTS)
        # 이미지 중심 원점, 폭/높이 대비 정규화 (-0.5 ~ 0.5)
        out[item_id] = {
            'aspect': round(h / w, 4),
            'verts': [[round(x / sw - 0.5, 4), round(y / sh - 0.5, 4)] for x, y in verts],
        }
        print(f'{item_id}: {len(verts)} verts')

    with open('src/game/hitboxes.json', 'w') as f:
        json.dump(out, f, indent=2, sort_keys=True)
    print(f'\nwrote src/game/hitboxes.json ({len(out)} items)')


if __name__ == '__main__':
    main()
