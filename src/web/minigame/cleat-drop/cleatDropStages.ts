/** A target's position/hitbox can move over time; only the axes actually used by a stage are set. */
export interface CleatDropTargetMotion {
  swayAxis?: "x" | "y";
  swayAmplitudePx?: number;
  swayFrequencyHz?: number;
  /** Visual-only spin (e.g. a sprinkler head) — doesn't move the hitbox, so the engine ignores it for collision. */
  spinDegPerSec?: number;
  widthFlutterAmplitudePx?: number;
  widthFlutterFrequencyHz?: number;
}

export interface CleatDropStage {
  id: number;
  tier: 1 | 2 | 3 | 4 | 5;
  targetName: string;
  assetKey: string;
  /** Judged width in px, on the 960x540 logical canvas. */
  catchWidthPx: number;
  /** Curved surfaces reflect their curvature directly in catchWidthPx (no separate tilt penalty). */
  curved: boolean;
  /** Degrees, negative = tilted left. Ignored (0) when curved is true. */
  tiltDeg: number;
  /** 0 (no bounce) to 1 (perfectly elastic), relative. */
  restitution: number;
  /** Lateral wind acceleration, px/s^2, negative = leftward. */
  windAccelPxPerSec2: number;
  /** If set, windAccelPxPerSec2's sign flips every this many seconds. */
  windReversalPeriodSec?: number;
  motion?: CleatDropTargetMotion;
  /** Flavor-only dynamic element with no numeric spec in the design doc (visual polish for a later session). */
  dynamicNote?: string;
}

export const STAGES: CleatDropStage[] = [
  // Tier 1 — wide and flat, no wind.
  { id: 1, tier: 1, targetName: "코치 벤치 좌석", assetKey: "target-bench", catchWidthPx: 150, curved: false, tiltDeg: 0, restitution: 0.15, windAccelPxPerSec2: 0 },
  { id: 2, tier: 1, targetName: "선수 가방 위", assetKey: "target-kitbag", catchWidthPx: 140, curved: false, tiltDeg: 0, restitution: 0.20, windAccelPxPerSec2: 0 },
  { id: 3, tier: 1, targetName: "물통 캐리어 상단", assetKey: "target-bottle-carrier", catchWidthPx: 135, curved: false, tiltDeg: 0, restitution: 0.35, windAccelPxPerSec2: 0 },
  { id: 4, tier: 1, targetName: "코치 클립보드", assetKey: "target-clipboard", catchWidthPx: 130, curved: false, tiltDeg: 0, restitution: 0.40, windAccelPxPerSec2: 0 },
  { id: 5, tier: 1, targetName: "접은 응원 배너 뭉치", assetKey: "target-banner-roll", catchWidthPx: 125, curved: false, tiltDeg: 0, restitution: 0.10, windAccelPxPerSec2: 0 },
  { id: 6, tier: 1, targetName: "골키퍼 훈련 매트", assetKey: "target-gk-mat", catchWidthPx: 120, curved: false, tiltDeg: 0, restitution: 0.25, windAccelPxPerSec2: 0 },

  // Tier 2 — a bit narrower or tilted, light wind.
  { id: 7, tier: 2, targetName: "축구 콘(주황 삼각뿔)", assetKey: "target-cone", catchWidthPx: 110, curved: false, tiltDeg: 5, restitution: 0.35, windAccelPxPerSec2: 15 },
  { id: 8, tier: 2, targetName: "코너 깃발 받침대", assetKey: "target-corner-flag-base", catchWidthPx: 105, curved: false, tiltDeg: -6, restitution: 0.30, windAccelPxPerSec2: -15 },
  { id: 9, tier: 2, targetName: "세숫대야(아이싱용)", assetKey: "target-basin", catchWidthPx: 100, curved: false, tiltDeg: 7, restitution: 0.30, windAccelPxPerSec2: 20 },
  { id: 10, tier: 2, targetName: "접이식 응원 의자 등받이", assetKey: "target-chair-back", catchWidthPx: 95, curved: false, tiltDeg: -8, restitution: 0.30, windAccelPxPerSec2: -20 },
  { id: 11, tier: 2, targetName: "팀 로고 방석", assetKey: "target-team-cushion", catchWidthPx: 90, curved: false, tiltDeg: 9, restitution: 0.15, windAccelPxPerSec2: 25 },
  { id: 12, tier: 2, targetName: "라인기(라인 마카) 손잡이", assetKey: "target-line-marker", catchWidthPx: 85, curved: false, tiltDeg: -10, restitution: 0.40, windAccelPxPerSec2: -25, dynamicNote: "굴림 진동 소" },

  // Tier 3 — curved or narrow, medium wind.
  { id: 13, tier: 3, targetName: "트로피 컵 테두리", assetKey: "target-trophy-rim", catchWidthPx: 80, curved: true, tiltDeg: 0, restitution: 0.55, windAccelPxPerSec2: 30 },
  { id: 14, tier: 3, targetName: "골대 크로스바 위", assetKey: "target-crossbar", catchWidthPx: 75, curved: true, tiltDeg: 0, restitution: 0.60, windAccelPxPerSec2: -30 },
  { id: 15, tier: 3, targetName: "코너킥 깃대 꼭대기", assetKey: "target-corner-flag-top", catchWidthPx: 72, curved: true, tiltDeg: 0, restitution: 0.50, windAccelPxPerSec2: 35, dynamicNote: "깃발 펄럭임(시각)" },
  { id: 16, tier: 3, targetName: "축구공 카트 테두리", assetKey: "target-ball-cart-rim", catchWidthPx: 68, curved: true, tiltDeg: 0, restitution: 0.45, windAccelPxPerSec2: -35 },
  { id: 17, tier: 3, targetName: "호루라기 걸이", assetKey: "target-whistle-hook", catchWidthPx: 64, curved: false, tiltDeg: 12, restitution: 0.50, windAccelPxPerSec2: 40 },
  { id: 18, tier: 3, targetName: "스코어보드 상단 모서리", assetKey: "target-scoreboard-corner", catchWidthPx: 60, curved: false, tiltDeg: -14, restitution: 0.55, windAccelPxPerSec2: -40 },

  // Tier 4 — small and unstable, strong wind.
  { id: 19, tier: 4, targetName: "물병 뚜껑", assetKey: "target-bottle-cap", catchWidthPx: 55, curved: true, tiltDeg: 0, restitution: 0.40, windAccelPxPerSec2: 45 },
  { id: 20, tier: 4, targetName: "골키퍼 장갑 손등", assetKey: "target-gk-glove-back", catchWidthPx: 52, curved: false, tiltDeg: 10, restitution: 0.30, windAccelPxPerSec2: -45, dynamicNote: "미세 진동" },
  { id: 21, tier: 4, targetName: "주장 완장 걸이", assetKey: "target-armband-hook", catchWidthPx: 48, curved: false, tiltDeg: -12, restitution: 0.25, windAccelPxPerSec2: 50, motion: { swayAxis: "x", swayAmplitudePx: 6, swayFrequencyHz: 1.2 } },
  { id: 22, tier: 4, targetName: "심판 카드 지갑", assetKey: "target-card-wallet", catchWidthPx: 45, curved: false, tiltDeg: 14, restitution: 0.35, windAccelPxPerSec2: -50 },
  { id: 23, tier: 4, targetName: "축구화 끈 고리(다른 신발 위)", assetKey: "target-lace-loop", catchWidthPx: 42, curved: true, tiltDeg: 0, restitution: 0.20, windAccelPxPerSec2: 55 },
  { id: 24, tier: 4, targetName: "응원 뿔나팔 입구", assetKey: "target-megaphone-mouth", catchWidthPx: 38, curved: true, tiltDeg: 0, restitution: 0.35, windAccelPxPerSec2: -55 },

  // Tier 5 — very narrow, moving or steeply tilted.
  { id: 25, tier: 5, targetName: "회전하는 스프링클러 헤드", assetKey: "target-sprinkler", catchWidthPx: 34, curved: true, tiltDeg: 0, restitution: 0.40, windAccelPxPerSec2: 60, motion: { spinDegPerSec: 90 } },
  { id: 26, tier: 5, targetName: "흔들리는 응원 풍선 꼭대기", assetKey: "target-balloon-top", catchWidthPx: 30, curved: true, tiltDeg: 0, restitution: 0.60, windAccelPxPerSec2: -65, motion: { swayAxis: "x", swayAmplitudePx: 20, swayFrequencyHz: 0.8 } },
  { id: 27, tier: 5, targetName: "기울어진 전광판 모서리", assetKey: "target-tilted-board-corner", catchWidthPx: 28, curved: false, tiltDeg: -18, restitution: 0.50, windAccelPxPerSec2: 70 },
  { id: 28, tier: 5, targetName: "회전하는 드론 카메라 위", assetKey: "target-drone-top", catchWidthPx: 25, curved: false, tiltDeg: 0, restitution: 0.35, windAccelPxPerSec2: -70, motion: { swayAxis: "y", swayAmplitudePx: 10, swayFrequencyHz: 1.5 } },
  { id: 29, tier: 5, targetName: "흔들리는 그물망 상단 로프", assetKey: "target-net-rope", catchWidthPx: 22, curved: true, tiltDeg: 0, restitution: 0.15, windAccelPxPerSec2: 80, motion: { swayAxis: "x", swayAmplitudePx: 14, swayFrequencyHz: 1 } },
  { id: 30, tier: 5, targetName: "바람에 펄럭이는 우승기 깃대 끝", assetKey: "target-flagpole-tip", catchWidthPx: 20, curved: true, tiltDeg: 0, restitution: 0.45, windAccelPxPerSec2: -80, windReversalPeriodSec: 5, motion: { widthFlutterAmplitudePx: 5, widthFlutterFrequencyHz: 2.5 } },
];

export const STAGE_COUNT = STAGES.length;
