// Jandi Forever numbers (docs/forever/02 §2, §3). Pure geometry and dates, no DOM, so the gate radii, the map's
// interaction circles and the colliders can be tested. Coordinates are logical 960×540 px, measured from the feet.

import { withinCircle, type Box, type Circle } from "./locker";

/**
 * Pitch-side gate on the right edge, mirroring the locker gate (`GATE`, x 16): same y line and size, so
 * `x + w + 16 === 960`. Prompt radius 70 around its centre; the `forever` group preloads inside 200.
 */
export const GATE_FOREVER = { x: 778, y: 316, w: 166, h: 166, centerX: 861, centerY: 399, promptRadius: 70, preloadRadius: 200 } as const;

/** Where the player appears on the pitch after coming back from Forever: in front of the gate, on its inner (left) side. */
export const FOREVER_SPAWN = { x: 745, y: 440 } as const;

export function gateForeverDistance(x: number, y: number): number {
  return Math.hypot(x - GATE_FOREVER.centerX, y - GATE_FOREVER.centerY);
}

export const nearGateForever = (x: number, y: number) => gateForeverDistance(x, y) <= GATE_FOREVER.promptRadius;
/** Close enough to start fetching the `forever` assets. */
export const nearGateForeverPreload = (x: number, y: number) => gateForeverDistance(x, y) < GATE_FOREVER.preloadRadius;

/**
 * Walkable floor of the hub square, fitted to `env/forever-hub-bg` (960×540): the buildings, stairs and fountain steps end at
 * y≈285, below that is the open dirt/grass yard; the big trees frame x<90 and x>850. To be confirmed by eye (03 §5).
 */
export const FOREVER_AREA = { minX: 90, maxX: 850, minY: 290, maxY: 505 } as const;

/** Foot boxes: the foreground bush and the base of every solid prop of `FOREVER_PROPS` (and of the portal). */
export const FOREVER_COLLIDERS: readonly Box[] = [
  { x: 75, y: 405, w: 85, h: 70 }, // left bush
  { x: 772, y: 490, w: 56, h: 10 }, // portal to the monster meadow
  { x: 88, y: 292, w: 56, h: 8 }, // barrels
  { x: 288, y: 288, w: 24, h: 8 }, // inn signboard post
  { x: 226, y: 424, w: 28, h: 8 }, // mailbox
  { x: 407, y: 318, w: 46, h: 12 }, // campfire
  { x: 458, y: 462, w: 44, h: 10 }, // hearthstone
  { x: 546, y: 304, w: 28, h: 8 }, // signpost
  { x: 688, y: 434, w: 24, h: 8 }, // training dummy
  { x: 758, y: 332, w: 24, h: 8 }, // griffin perch
];

export const FOREVER_SPAWN_POINT = { x: 480, y: 392 } as const;

/** Prop sprites (`env/forever-prop-<id>`, 03 §3) drawn at 1×, anchored bottom-centre on the feet line and y-sorted with the actors. */
export const FOREVER_PROPS: ReadonlyArray<{ id: string; x: number; y: number }> = [
  { id: "barrels", x: 108, y: 300 },
  { id: "signboard", x: 300, y: 296 },
  { id: "mailbox", x: 240, y: 432 },
  { id: "campfire", x: 430, y: 330 },
  { id: "hearthstone", x: 480, y: 472 },
  { id: "signpost", x: 560, y: 312 },
  { id: "dummy", x: 700, y: 442 },
  { id: "perch", x: 770, y: 340 },
];

export type ForeverTarget = "questgiver" | "leroy" | "innkeeper" | "flightmaster" | "mailbox" | "dummy" | "hearthstone" | "portal";

/** Interaction circles of the hub (02 §3.2); the monsters are free-placed and live on the meadow (`FIELD_MOBS`). */
export const FOREVER_ZONES: Readonly<Record<ForeverTarget, Circle>> = {
  questgiver: { x: 330, y: 365, r: 46 },
  leroy: { x: 620, y: 395, r: 46 },
  innkeeper: { x: 200, y: 315, r: 46 },
  flightmaster: { x: 820, y: 350, r: 46 },
  mailbox: { x: 240, y: 420, r: 40 },
  dummy: { x: 700, y: 430, r: 44 },
  hearthstone: { x: 480, y: 460, r: 44 },
  portal: { x: 800, y: 472, r: 50 },
};

/** The interaction a spot offers; where circles overlap the one whose centre is nearest wins. */
export function foreverTargetAt(x: number, y: number, zones: Readonly<Partial<Record<ForeverTarget, Circle>>> = FOREVER_ZONES): ForeverTarget | null {
  let best: ForeverTarget | null = null;
  let bestDistance = Infinity;
  for (const id of Object.keys(zones) as ForeverTarget[]) {
    const zone = zones[id];
    if (!zone || !withinCircle(x, y, zone)) continue;
    const distance = Math.hypot(x - zone.x, y - zone.y);
    if (distance < bestDistance) {
      best = id;
      bestDistance = distance;
    }
  }
  return best;
}

// ---- NPCs, rabbits, timings and chat lines (session 4, docs/forever/02 §3.2-§6) ----

/** Seconds of the hearthstone cast bar (the original takes 10). Moving cancels it. */
export const CAST_SECONDS = 5;
/** The cast sound is 2.5s long, so it is re-triggered at this interval while the bar runs. */
export const CAST_LOOP_SECONDS = 2.5;
/** Fade + "그리핀 비행 중…" before the flight master puts the player back on the pitch. */
export const GRIFFIN_SECONDS = 0.6;
/** DING! burst, pillar and text. */
export const DING_SECONDS = 1.2;
export const ACHIEVEMENT_TOAST_SECONDS = 4;
export const CHAT_MAX_LINES = 5;
export const CHAT_LINE_SECONDS = 8;
/** A random `[월드]` line every 45–90 s. */
export const WORLD_CHAT_MIN_SECONDS = 45;
export const WORLD_CHAT_MAX_SECONDS = 90;
export const MOB_RADIUS = 30;
export const MOB_RESPAWN_SECONDS = 8;
/** Fade of the walk through a portal. */
export const PORTAL_SECONDS = 0.5;
/** The portal frames (3) play at this rate. */
export const PORTAL_FPS = 4;
/** The portal group is fetched from this close to the portal of the first map. */
export const PORTAL_PRELOAD_RADIUS = 200;

export type ForeverNpcId = "questgiver" | "leroy" | "innkeeper" | "flightmaster" | "streamer" | "guard";

export interface ForeverNpcDef {
  /** The four interactive ones carry the id of their `ForeverTarget`; decorations any other. */
  id: string;
  /** Asset key of the 2-frame idle strip. */
  sprite: string;
  x: number;
  y: number;
  name: string;
  color?: string;
}

/** NPC stands (feet) of the town square. The first four are the interactive ones and stand on the centre of their `FOREVER_ZONES` circle. */
export const FOREVER_NPCS: ReadonlyArray<ForeverNpcDef & { id: ForeverNpcId }> = [
  { id: "questgiver", sprite: "characters/forever-npc-questgiver", x: 330, y: 365, name: "잔디지기 노병" },
  { id: "leroy", sprite: "characters/forever-npc-leroy", x: 620, y: 395, name: "리로이 잔킨스" },
  { id: "innkeeper", sprite: "characters/forever-npc-innkeeper", x: 200, y: 315, name: "여관주인 포근" },
  { id: "flightmaster", sprite: "characters/forever-npc-flightmaster", x: 820, y: 350, name: "그리핀 조련사" },
  { id: "guard", sprite: "characters/forever-npc-guard", x: 690, y: 312, name: "성문 경비병" },
];

/** The veteran orc of the monster meadow (was the streamer NPC of the square): a name plate in legendary orange, nothing to press. */
export const FIELD_NPCS: ReadonlyArray<ForeverNpcDef & { id: ForeverNpcId }> = [
  { id: "streamer", sprite: "characters/forever-npc-streamer", x: 420, y: 250, name: "투르카 (전설)", color: "#ff8000" },
];

export type ForeverMobKind = "rabbit" | "boar" | "murloc" | "kobold";

export interface ForeverMobSpot {
  kind: ForeverMobKind;
  x: number;
  y: number;
}

export const MOB_NAMES: Readonly<Record<ForeverMobKind, string>> = { rabbit: "토끼", boar: "멧돼지", murloc: "멀록", kobold: "코볼트" };

/** The monsters of the meadow, at least 110px apart. They come back `MOB_RESPAWN_SECONDS` after being hit, so the rabbit quest can always be finished. */
export const FIELD_MOBS: ReadonlyArray<ForeverMobSpot> = [
  { kind: "rabbit", x: 160, y: 280 },
  { kind: "rabbit", x: 520, y: 300 },
  { kind: "rabbit", x: 720, y: 290 },
  { kind: "rabbit", x: 250, y: 400 },
  { kind: "rabbit", x: 640, y: 395 },
  { kind: "rabbit", x: 830, y: 440 },
  { kind: "boar", x: 400, y: 355 },
  { kind: "boar", x: 720, y: 490 },
  { kind: "murloc", x: 860, y: 320 },
  { kind: "murloc", x: 540, y: 480 },
  { kind: "kobold", x: 110, y: 390 },
  { kind: "kobold", x: 400, y: 470 },
];

/** Index of the nearest alive monster within `MOB_RADIUS` of the feet, or -1. */
export function mobAt(x: number, y: number, alive: readonly boolean[], spots: ReadonlyArray<{ x: number; y: number }> = FIELD_MOBS): number {
  let best = -1;
  let bestDistance = Infinity;
  spots.forEach((spot, index) => {
    if (!alive[index]) return;
    const distance = Math.hypot(x - spot.x, y - spot.y);
    if (distance <= MOB_RADIUS && distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/** Fixed rotation of fake `[월드]` chatter (01 dialogue drafts); nobody is really typing. */
export const WORLD_CHAT_LINES: readonly string[] = [
  "누군가: 잔디 포에버 언제 열려요?",
  "누군가: 탱커 구합니다 (수비수 가능)",
  "누군가: 힐러 없으면 골키퍼라도 오세요",
  "누군가: 리로이 어디 갔어요? 또 혼자 돌진했나요",
  "누군가: 파티 구함 LFM 잔디 5인 던전",
  "누군가: 우편함에 편지 왔대요 ㅋㅋ",
  "누군가: 토끼 5마리 퀘 끝났는데 왜 안 뜨죠",
  "누군가: 멀록 조심하세요 음르글글글",
];

// ---- maps (session 5, docs/forever/02 §11) ----

export type ForeverMapId = "elwynn" | "orgrimmar" | "field";

/** The letter of the mailbox (docs/forever/07 §1-3): `hidden` parts are shown as they are — smudged `~~~~` and `???` in a lighter ink. */
export const LETTER_TITLE = "우왁굳에게 온 편지";
export interface LetterPart {
  text: string;
  hidden?: boolean;
}
export const LETTER_LINES: ReadonlyArray<readonly LetterPart[]> = [
  [{ text: "???", hidden: true }, { text: " 님께," }],
  [],
  [{ text: "~~~~~~~~~~~~~~~~~~~~~~~~", hidden: true }],
  [{ text: "~~~~~~~~~~~~~~~~~~", hidden: true }],
  [],
  [{ text: "~~~~~~~~~~~~~~~~~~~~~~~~~~", hidden: true }],
  [{ text: "~~~~~~~~~~~~~~~~~~~~", hidden: true }],
  [{ text: "~~~~~~~~~~~~~~~~~~~~~~", hidden: true }],
  [],
  [{ text: "- 우왁굳 드림" }],
  [{ text: "추신. " }, { text: "~~~~~~~~~~~~~~", hidden: true }],
];

export interface ForeverMapDef {
  id: ForeverMapId;
  /** Banner and chat text on arrival. */
  zoneName: string;
  bg: string;
  /** Asset group that holds this map's art (the first map's is loaded by the loading screen). */
  group: "forever" | "forever2" | "forever-field";
  spawn: { x: number; y: number };
  area: { minX: number; maxX: number; minY: number; maxY: number };
  colliders: readonly Box[];
  props: ReadonlyArray<{ id: string; x: number; y: number }>;
  zones: Readonly<Partial<Record<ForeverTarget, Circle>>>;
  npcs: readonly ForeverNpcDef[];
  /** Monsters to hit with E (they respawn); only rabbits count for the rabbit quest. */
  mobs: ReadonlyArray<ForeverMobSpot>;
  /** The portal of this map (its `zones.portal` circle is where E works): sprite key of the 3-frame strip, base point and destination. */
  portal?: { sprite: string; x: number; y: number; to: ForeverMapId };
  /** Quests and their marks exist on this map. */
  quests: boolean;
  /** Small talk of the interactive NPCs where `quests` is false. */
  talk: Readonly<Partial<Record<"questgiver" | "leroy" | "innkeeper", string>>>;
  /** Where the flight master can take you from here (besides the pitch). */
  flightTo: ForeverMapId;
}

export const FOREVER_MAP_ELWYNN: ForeverMapDef = {
  id: "elwynn",
  zoneName: "잔디 포에버 — 엘윈 잔디숲",
  bg: "env/forever-hub-bg",
  group: "forever",
  spawn: FOREVER_SPAWN_POINT,
  area: FOREVER_AREA,
  colliders: FOREVER_COLLIDERS,
  props: FOREVER_PROPS,
  zones: FOREVER_ZONES,
  npcs: FOREVER_NPCS,
  mobs: [],
  portal: { sprite: "env/forever-portal-field", x: 800, y: 500, to: "field" },
  quests: true,
  talk: {},
  flightTo: "orgrimmar",
};

/** Third map: the monster meadow (art J11/J12/J14). A wide open field with a stone dais whose portal leads back to the square. */
export const FOREVER_MAP_FIELD: ForeverMapDef = {
  id: "field",
  zoneName: "잔디 포에버 — 토끼 초원",
  bg: "env/forever-field-bg",
  group: "forever-field",
  spawn: { x: 340, y: 275 },
  // the pond fills the upper right down to y≈245, the standing-stone wall the upper left; the yard below is open
  area: { minX: 75, maxX: 875, minY: 195, maxY: 510 },
  colliders: [
    { x: 70, y: 195, w: 155, h: 35 }, // stone wall in front of the dais, left of the stairs
    { x: 630, y: 195, w: 340, h: 50 }, // pond and reeds
    { x: 60, y: 445, w: 80, h: 70 }, // lower-left bushes
    { x: 800, y: 480, w: 90, h: 40 }, // lower-right bushes
    { x: 590, y: 252, w: 40, h: 10 }, // stump
    { x: 748, y: 262, w: 44, h: 10 }, // boulder
  ],
  props: [
    { id: "burrow", x: 270, y: 425 },
    { id: "burrow", x: 545, y: 310 },
    { id: "stump", x: 610, y: 262 },
    { id: "boulder", x: 770, y: 270 },
    { id: "mushrooms", x: 330, y: 350 },
  ],
  zones: { portal: { x: 285, y: 195, r: 50 } },
  npcs: FIELD_NPCS,
  mobs: FIELD_MOBS,
  portal: { sprite: "env/forever-portal-town", x: 255, y: 158, to: "elwynn" },
  quests: false,
  talk: {},
  flightTo: "elwynn",
};

/** Second map: the red-dust fortress square (art J9/J10). Same interaction slots as the first, without the quests. */
export const FOREVER_MAP_ORGRIMMAR: ForeverMapDef = {
  id: "orgrimmar",
  zoneName: "오그리 잔디마 — 붉은 협곡 광장",
  bg: "env/forever-orgrimmar-bg",
  group: "forever2",
  spawn: { x: 480, y: 385 },
  // the fortress steps end at y≈300; rock ledges frame the two lower corners
  area: { minX: 90, maxX: 870, minY: 305, maxY: 505 },
  colliders: [
    { x: 60, y: 440, w: 90, h: 70 }, // lower-left rocks
    { x: 850, y: 430, w: 110, h: 90 }, // lower-right rocks
    { x: 256, y: 444, w: 28, h: 8 }, // mailbox
    { x: 458, y: 462, w: 44, h: 10 }, // hearthstone
    { x: 688, y: 454, w: 24, h: 8 }, // training dummy
    { x: 826, y: 370, w: 24, h: 8 }, // wind rider perch
  ],
  props: [
    { id: "mailbox", x: 270, y: 452 },
    { id: "hearthstone", x: 480, y: 472 },
    { id: "dummy", x: 700, y: 462 },
    { id: "perch", x: 838, y: 378 },
  ],
  zones: {
    questgiver: { x: 300, y: 380, r: 46 },
    leroy: { x: 620, y: 390, r: 46 },
    innkeeper: { x: 200, y: 340, r: 46 },
    flightmaster: { x: 800, y: 360, r: 46 },
    mailbox: { x: 250, y: 430, r: 40 },
    dummy: { x: 700, y: 440, r: 44 },
    hearthstone: { x: 480, y: 450, r: 44 },
  },
  npcs: [
    { id: "questgiver", sprite: "characters/forever-npc2-orc", x: 300, y: 380, name: "족장 잔드록" },
    { id: "leroy", sprite: "characters/forever-npc2-goblin", x: 620, y: 390, name: "고블린 상인 짤랑" },
    { id: "innkeeper", sprite: "characters/forever-npc2-cook", x: 200, y: 340, name: "요리사 뚝배기" },
    { id: "flightmaster", sprite: "characters/forever-npc2-rider", x: 800, y: 360, name: "늑대기수 조련사" },
    { id: "elder", sprite: "characters/forever-npc2-elder", x: 400, y: 345, name: "황소뿔 장로" },
    { id: "grunt", sprite: "characters/forever-npc2-grunt", x: 560, y: 335, name: "성문 척후병" },
  ],
  mobs: [],
  quests: false,
  talk: {
    questgiver: "여긴 붉은 잔디의 땅이다. 이 협곡에서는 골이 곧 명예지.",
    leroy: "싸게 해 주겠소, 동전은 장식용이지만! 짤랑짤랑.",
    innkeeper: "배고픈 자는 골을 못 넣는 법이야. 국자 맞을래?",
  },
  flightTo: "elwynn",
};

export const FOREVER_MAPS: Readonly<Record<ForeverMapId, ForeverMapDef>> = { elwynn: FOREVER_MAP_ELWYNN, orgrimmar: FOREVER_MAP_ORGRIMMAR, field: FOREVER_MAP_FIELD };
