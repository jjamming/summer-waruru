# 여름와르르 (summer-waruru)

앱인토스 여름 시즌 미니게임. 크레인 타이밍으로 여름 아이템을 판자 위에 쌓는 물리 게임.
기획 원본: 노션 "🍉 여름 미니앱 아이디어 — 여름 아이템 쌓기 (크레인 타이밍)".

## 명령어

- `pnpm dev` — granite dev (토스 샌드박스 연동 dev 서버)
- `pnpm exec vite dev` — 순수 웹 dev 서버 (localhost:5173, 로컬 플레이 확인용)
- `pnpm exec tsc --noEmit` — 타입체크
- `pnpm build` — ait build (.ait 아티팩트 생성)
- `python3 scripts/gen-hitboxes.py` — 아이템 이미지 교체·추가 시 충돌 폴리곤 재생성 (src/game/hitboxes.json)

## 구조

- `src/game/` — React 무관 순수 TS 게임 코어
  - `config.ts` — 모든 밸런싱 상수 (난이도 조절은 여기만)
  - `items.ts` — 아이템 로스터 (모양·배점·물리 특성)
  - `rng.ts` — 데일리 시드 PRNG (전원 동일 아이템 순서)
  - `engine.ts` — matter.js 물리 + 크레인 + 득점/게임오버 (고정 타임스텝)
  - `renderer.ts` — canvas 렌더링 (물리와 분리 — 아트 교체 시 여기만 수정)
- `src/App.tsx` — React HUD + rAF 루프 + 게임 생명주기
- `granite.config.ts` — 앱인토스 설정 (brand.icon은 string 필수, null이면 ait build 실패)

## 문서 규칙 (중요)

작업 히스토리·결정·TODO는 `docs/`에 축적한다.
사용자가 **"문서 갱신해줘"**라고 하면:
1. `docs/sessions/YYYY-MM-DD.md`에 이번 세션 작업 내역·사용자 피드백 기록 (같은 날 파일 있으면 이어서)
2. 새 설계 결정이 있으면 `docs/decisions.md`에 결정+이유 추가
3. `docs/todo.md` 갱신 (완료 체크, 새 항목 추가)

세션 시작 시 `docs/todo.md`와 최근 세션 로그를 먼저 읽고 맥락을 이어갈 것.

## 컨벤션

- 스타일: 바닐라 CSS (`src/styles.css`) — Tailwind/emotion 도입하지 않음 (2026-07-10 결정, docs/decisions.md 참고)
- 밸런싱 수치는 코드에 흩뿌리지 말고 `config.ts`/`items.ts`에만
- 게임 로직에 React 의존성 넣지 않기 (엔진은 순수 TS 유지)
