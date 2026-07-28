/**
 * 사운드 — 효과음(Web Audio 합성) + 배경음악(bgm.mp3 루프).
 * 출시 체크리스트 1번: On/Off 설정 제공, 백그라운드 전환 시 즉시 정지·복귀 시 재개.
 * BGM도 같은 AudioContext를 타므로 suspend/resume 한 곳에서 전부 처리된다.
 */

import bgmUrl from '../assets/bgm.mp3';
import { kvGet, kvSet } from './kv';

const KEY = 'summer-waruru:sound';

let enabled = kvGet(KEY) !== '0';
let ctx: AudioContext | null = null;

export function isSoundOn(): boolean {
  return enabled;
}

export function setSoundOn(on: boolean) {
  enabled = on;
  kvSet(KEY, on ? '1' : '0');
  if (!on) ctx?.suspend().catch(() => {});
  else {
    ctx?.resume().catch(() => {});
    // 꺼진 상태로 있다가 켜면 BGM이 아직 시작 전일 수 있다 — 토글 클릭도 사용자 제스처라 시작 가능
    startBgm();
  }
}

/** 사용자 제스처 시점에 호출 — iOS 오디오 잠금 해제 */
export function unlockAudio() {
  if (!enabled) return;
  const c = ensureCtx();
  if (c.state === 'suspended') c.resume().catch(() => {});
}

function ensureCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    // 백그라운드 전환 시 즉시 정지, 복귀 시 재개
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else if (enabled) ctx.resume().catch(() => {});
    });
  }
  return ctx;
}

// ─── 배경음악 ───────────────────────────────────────────
// 60초 크로스페이드 루프(bgm.mp3)를 AudioBufferSourceNode.loop로 재생 — 이음매 없는 반복.
// 백그라운드 정지/복귀 재개·On/Off는 ctx.suspend/resume이 효과음과 함께 일괄 처리.

const BGM_VOLUME = 0.35; // 효과음(peak 0.08~0.22)을 가리지 않는 수준

let bgmStarted = false;
let bgmLoading = false;

/**
 * BGM 시작 — 사용자 제스처 시점에 호출(모바일 자동재생 정책).
 * 여러 번 불러도 안전(이미 재생 중/로딩 중이면 무시). 실패는 조용히 무시(게임 진행 무영향).
 */
export function startBgm() {
  if (!enabled || bgmStarted || bgmLoading) return;
  const c = ensureCtx();
  if (c.state === 'suspended') c.resume().catch(() => {});
  bgmLoading = true;
  fetch(bgmUrl)
    .then((r) => r.arrayBuffer())
    .then((buf) => c.decodeAudioData(buf))
    .then((buffer) => {
      if (bgmStarted) return;
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const gain = c.createGain();
      gain.gain.value = BGM_VOLUME;
      src.connect(gain).connect(c.destination);
      src.start();
      bgmStarted = true;
    })
    .catch(() => {})
    .finally(() => {
      bgmLoading = false;
    });
}

function tone(
  freq: number,
  durationS: number,
  opts: { type?: OscillatorType; peak?: number; delayS?: number; slideTo?: number } = {},
) {
  if (!enabled) return;
  const c = ensureCtx();
  const { type = 'sine', peak = 0.18, delayS = 0, slideTo } = opts;
  const t0 = c.currentTime + delayS;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + durationS);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationS);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durationS + 0.02);
}

/** 화이트노이즈 (풍덩용) */
function noise(durationS: number, opts: { peak?: number; filterFrom?: number; filterTo?: number } = {}) {
  if (!enabled) return;
  const c = ensureCtx();
  const { peak = 0.22, filterFrom = 1400, filterTo = 250 } = opts;
  const t0 = c.currentTime;
  const buffer = c.createBuffer(1, c.sampleRate * durationS, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrom, t0);
  filter.frequency.exponentialRampToValueAtTime(filterTo, t0 + durationS);
  const gain = c.createGain();
  gain.gain.setValueAtTime(peak, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durationS);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  /** 투하: 짧게 떨어지는 삑 */
  drop() {
    tone(620, 0.1, { type: 'triangle', slideTo: 320, peak: 0.14 });
  },
  /** 착지 득점: 톡 + 밝은 배음 */
  land() {
    tone(330, 0.09, { type: 'sine', peak: 0.16 });
    tone(660, 0.12, { type: 'sine', peak: 0.08, delayS: 0.03 });
  },
  /** 바다 풍덩 */
  splash() {
    noise(0.4);
    tone(200, 0.25, { type: 'sine', slideTo: 90, peak: 0.1 });
  },
  /** 게임 오버: 하강 2음 */
  gameover() {
    tone(392, 0.22, { type: 'triangle', peak: 0.14 });
    tone(262, 0.34, { type: 'triangle', peak: 0.14, delayS: 0.2 });
  },
  /** 신기록: 상승 아르페지오 */
  newBest() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, { type: 'triangle', peak: 0.13, delayS: i * 0.09 }));
  },
};
