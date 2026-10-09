<div align="center">
  <img src="src/assets/logo.webp" alt="여름 와르르" width="280" />

  **크레인 타이밍으로 여름 아이템을 판자 위에 아슬아슬 쌓아 올리는 원터치 캐주얼 물리 게임**

  [앱인토스](https://apps-in-toss.toss.im/) 여름 시즌 미니앱 · 원스토어 출시
</div>

---

## 🎮 게임

좌우로 움직이는 크레인에서 타이밍 맞춰 아이템을 떨어뜨려, 바다 위 판자에 수박·튜브·오리·아이스크림 같은 여름 아이템을 쌓습니다. 높이 쌓을수록 점수가 오르지만, 하나라도 바다에 빠지면 게임 오버. matter.js 물리 엔진 위에서 돌아가는 **한 손가락 타이밍 게임**입니다.

- 🏗 **크레인 타이밍** — 원터치 투하, 투하할수록 빨라지는 난이도 램프
- 🍉 **12종 여름 아이템** — 모양·무게·배점이 제각각 (쌓기 난이도에 영향)
- ❤️ **하트 시스템** — 최대 5개, 개별 24시간 회복 (과몰입 방지)
- 🔊 **사운드 & 햅틱** — Web Audio 합성 효과음 + 배경음악 루프 + 진동 피드백 (각각 On/Off)
- 📤 **공유** — 점수 자랑 딥링크 공유, 친구 초대 하트 리필

## 🛠 기술 스택

| 영역 | 사용 |
|---|---|
| 런타임 | [앱인토스 web-framework](https://developers-apps-in-toss.toss.im/) (granite) |
| UI | React 18 + 바닐라 CSS |
| 물리 | matter.js + poly-decomp (오목 폴리곤 충돌) |
| 렌더링 | Canvas 2D (물리와 분리) |
| 빌드 | Vite + TypeScript |
| 안드로이드 | Capacitor 래핑 (원스토어 자체 서명 APK) |

## 🧱 구조

게임 코어는 **React에 의존하지 않는 순수 TypeScript**로 격리되어 있어, 아트·UI를 갈아끼워도 게임 로직은 그대로입니다.

```
src/
├─ game/              # React 무관 순수 TS 게임 코어
│  ├─ config.ts       #   모든 밸런싱 상수 (난이도 조절은 여기만)
│  ├─ items.ts        #   아이템 로스터 (모양·배점·물리 특성)
│  ├─ engine.ts       #   matter.js 물리 + 크레인 + 득점/게임오버 (고정 타임스텝)
│  └─ renderer.ts     #   canvas 렌더링 (아트 교체 시 여기만)
├─ screens/           # 화면 (랜딩 / 게임)
├─ components/        # 모달·HUD 조각
├─ lib/               # 하트·사운드·햅틱·공유·저장소 등 유틸
└─ App.tsx            # React HUD + rAF 루프 + 게임 생명주기
```

## 🚀 개발

```bash
pnpm install

pnpm exec vite dev     # 순수 웹 dev 서버 (localhost:5173, 로컬 플레이 확인)
pnpm dev               # granite dev (토스 샌드박스 연동)
pnpm exec tsc --noEmit # 타입체크
pnpm build             # ait build (.ait 아티팩트)
```

아이템 이미지를 교체·추가하면 충돌 폴리곤을 재생성합니다:

```bash
python3 scripts/gen-hitboxes.py
```

## 📦 상태

- ✅ 원스토어 출시 완료 (안드로이드, IARC 등급 발급)
- 🚧 앱인토스 미니앱 심사 준비 중

---

<sub>코드는 학습·참고용으로 공개합니다. 이미지·배경음악 등 에셋은 AI 생성물로 별도 이용 조건이 있을 수 있습니다.</sub>
