import type { AmbienceId, SfxId } from "../audio/worldAudio";

// The post-credits stinger (docs/world/14): six stills after the credits card that hint at the next story — a mysterious
// character picks up the Weeder King's dropped trimmer. The speaker is only ever "???". Text is drawn by the DOM,
// never baked into the images.
//
// The player steps through it: a still plays its entrance (fade / motion / caption) and then holds until Enter is
// pressed, which brings in the next one. The last press closes it.

/** How a still moves while it is on screen (CSS keyframes in world-mission.css; all of them are dropped for reduced motion). */
export type StingerMotion = "zoom-in" | "shake" | "tilt-up" | "pan-right" | "punch" | "settle";

export interface StingerCaption {
  text: string;
  /** Seconds after the cut starts. A caption stays until the next one replaces it or the player moves on. */
  at: number;
}

export interface StingerCut {
  id: string;
  /** Asset key under assets/world (converted by `pnpm convert:world-art -- ending`). */
  image: string;
  alt: string;
  /** Seconds the entrance takes (motion and captions included); from then on the still holds and Enter brings in the next one. */
  settleSeconds: number;
  /** Seconds the still takes to fade in over the one before it (0 = a hard cut). */
  fadeIn: number;
  motion: StingerMotion;
  captions: readonly StingerCaption[];
}

export const STINGER_SPEAKER = "???";
/** Black screen before the first still, and the fade to black after the last press. */
export const STINGER_LEAD_SECONDS = 1.5;
export const STINGER_OUT_SECONDS = 1;
/** Esc (skip everything) is ignored for this long after the stinger starts, so the press that ended the credits cannot also skip it. */
export const STINGER_SKIP_GUARD_MS = 700;

export const STINGER_CUTS: readonly StingerCut[] = [
  {
    id: "dropped-trimmer",
    image: "ending/pc-01-dropped-trimmer",
    alt: "모두가 돌아간 밤의 스타디움. 잔디 위에 제초왕의 제초기가 떨어져 있고, 오른쪽에서 누군가의 그림자가 드리운다.",
    settleSeconds: 4,
    fadeIn: 1.2,
    motion: "zoom-in",
    captions: [],
  },
  {
    id: "glove-grab",
    image: "ending/pc-02-glove-grab",
    alt: "하늘색 소매의 흰 장갑이 제초기의 손잡이를 움켜쥔다.",
    settleSeconds: 2,
    fadeIn: 0,
    motion: "shake",
    captions: [],
  },
  {
    id: "silhouette-rise",
    image: "ending/pc-03-silhouette-rise",
    alt: "달빛을 등진 실루엣이 제초기를 어깨에 메고 일어선다.",
    settleSeconds: 3.5,
    fadeIn: 0.6,
    motion: "tilt-up",
    captions: [{ text: "…이거, 아직 쓸 만하네.", at: 0.8 }],
  },
  {
    id: "scheme-room",
    image: "ending/pc-04-scheme-room",
    alt: "제초 공장 지하. 하늘색 후드티의 인물이 작업대에서 제초기를 개조하고, 벽의 잔디동 지도에는 빨간 엑스 표시가 가득하다.",
    settleSeconds: 4.5,
    fadeIn: 0.8,
    motion: "pan-right",
    captions: [
      { text: "제초왕은 너무 물렀어.", at: 0.6 },
      { text: "이번엔 뿌리째 밀어 주지.", at: 2.6 },
    ],
  },
  {
    id: "eye-v-sign",
    image: "ending/pc-05-eye-v-sign",
    alt: "눈가에 브이를 댄 채 능글맞게 웃는 하늘색 후드티의 인물. 뒤로 제초기 군단이 늘어서 있다.",
    settleSeconds: 3,
    fadeIn: 0.3,
    motion: "punch",
    captions: [{ text: "다음 시즌엔… 내가 나간다.", at: 0.8 }],
  },
  {
    id: "village-hint",
    image: "ending/pc-06-village-hint",
    alt: "새벽의 잔디동 전경. 남동쪽 구석에 회색 얼룩과 하늘색 연기가 피어오른다.",
    settleSeconds: 4,
    fadeIn: 1.2,
    motion: "settle",
    captions: [],
  },
];

/** "To be continued" over the last still, shown from `at` seconds after that cut starts and kept until the last press. */
export const STINGER_END_CARD = { text: "— 다음 이야기에서 계속 —", at: 1.6 } as const;

/** Sound cues, played when their cut comes in (missing files are silence, like everywhere else in the world audio). */
export interface StingerCue {
  cut: number;
  /** Seconds after that cut starts. */
  at: number;
  sfx?: SfxId;
  /** null = silence; undefined = leave it. */
  ambience?: AmbienceId | null;
}

export const STINGER_CUES: readonly StingerCue[] = [
  { cut: 0, at: 0, ambience: "frost-night" },
  { cut: 1, at: 0, sfx: "mower-rev" },
  { cut: 2, at: 0.3, sfx: "mower-rev" },
  { cut: 3, at: 0, ambience: "weed" },
  { cut: 4, at: 0.1, sfx: "mission-ready" },
  { cut: 5, at: 0, ambience: "field-day" },
];
