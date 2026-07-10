# 아이템 스프라이트(webp)의 알파 실루엣 → 충돌 폴리곤 생성.
# 컨투어 추적(Moore-Neighbor) + RDP 단순화 — 파인 부분(오목)도 보존한다.
# 런타임에서 matter.js가 poly-decomp로 볼록 조각으로 분해해 사용.
#
# 아트 교체 시 재실행: python3 scripts/gen-hitboxes.py
# 출력: src/game/hitboxes.json (좌표는 이미지 중심 원점, 폭/높이 대비 -0.5~0.5 정규화)

import glob
import json
import math
import os

from PIL import Image

MAX_VERTS = 16
ALPHA_THRESHOLD = 30
SAMPLE_MAX = 256  # 컨투어 계산용 다운스케일 (정밀도 충분 + 빠름)

def trace_contour(mask, w, h):
    """픽셀 경계선(edge) 체이닝으로 외곽 컨투어 추적.

    채워진 픽셀과 빈 픽셀 사이의 경계선을 '채움이 왼쪽'이 되는 방향으로 모은 뒤
    시작점→끝점으로 이어 붙이면 닫힌 루프가 된다. 가장 큰 루프가 외곽 컨투어.
    """

    def filled(x, y):
        return 0 <= x < w and 0 <= y < h and mask[y * w + x]

    edges = {}  # start vertex -> end vertex (시계 방향)
    for y in range(h):
        for x in range(w):
            if not filled(x, y):
                continue
            if not filled(x, y - 1):
                edges[(x, y)] = (x + 1, y)  # top
            if not filled(x + 1, y):
                edges[(x + 1, y)] = (x + 1, y + 1)  # right
            if not filled(x, y + 1):
                edges[(x + 1, y + 1)] = (x, y + 1)  # bottom
            if not filled(x - 1, y):
                edges[(x, y + 1)] = (x, y)  # left

    best = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        cur = edges.pop(start)
        while cur != start and cur in edges:
            loop.append(cur)
            cur = edges.pop(cur)
        if len(loop) > len(best):
            best = loop
    return best


def rdp(points, epsilon):
    """Ramer-Douglas-Peucker 단순화."""
    if len(points) < 3:
        return points

    def perp_dist(p, a, b):
        if a == b:
            return math.dist(p, a)
        (x, y), (x1, y1), (x2, y2) = p, a, b
        num = abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1))
        return num / math.dist(a, b)

    dmax, idx = 0.0, 0
    for i in range(1, len(points) - 1):
        d = perp_dist(points[i], points[0], points[-1])
        if d > dmax:
            dmax, idx = d, i
    if dmax > epsilon:
        left = rdp(points[: idx + 1], epsilon)
        right = rdp(points[idx:], epsilon)
        return left[:-1] + right
    return [points[0], points[-1]]


def simplify_closed(contour, max_verts):
    """닫힌 컨투어를 RDP로 단순화 — 꼭짓점 수가 목표 이하가 될 때까지 epsilon 증가."""
    # 닫힘 처리를 위해 시작점을 끝에 붙이고, 결과에서 중복 제거
    eps = 1.0
    for _ in range(30):
        pts = rdp(contour + [contour[0]], eps)[:-1]
        if len(pts) <= max_verts:
            return pts
        eps *= 1.35
    return pts


def polygon_area(pts):
    return sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts))) / 2


def main():
    out = {}
    for path in sorted(glob.glob('src/assets/items/*.webp')):
        item_id = os.path.basename(path).rsplit('.', 1)[0]
        img = Image.open(path).convert('RGBA')
        w, h = img.size
        scale = min(1.0, SAMPLE_MAX / max(w, h))
        sw, sh = round(w * scale), round(h * scale)
        alpha = img.resize((sw, sh), Image.BILINEAR).getchannel('A')
        data = alpha.tobytes()
        mask = [b > ALPHA_THRESHOLD for b in data]

        contour = trace_contour(mask, sw, sh)
        if len(contour) < 3:
            print(f'skip {item_id}: contour not found')
            continue

        verts = simplify_closed(contour, MAX_VERTS)
        if abs(polygon_area(verts)) < 4:
            print(f'skip {item_id}: degenerate polygon')
            continue

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
