import type { CastId, MinigameRoundResult } from "../types";

// Mission definitions (docs/world/02 §7–§10). Everything tunable lives here — thresholds, times, counts,
// which world objects a mission uses — so balancing never touches code (docs/world/08 §0 #5).
//
// What the NPCs say about these missions lives in `dialogueData.ts` (keyed by mission id); the rules that pick a
// line are in `state/npcDialogue.ts`.
//
// Plain data with type-only imports so a script or a test can import it without pulling in the engine.

export type MinigameGame = MinigameRoundResult["game"];

export type MissionKind =
  | "collection_count" | "card_collection" | "daily_stamp" | "talk" | "card_reveal" | "card_variant" | "minigame_best"
  | "collect" | "delivery" | "time_trial" | "kick_goals" | "talk_chain" | "finale";

/** How each minigame is called and counted ("축구공 합 10", "점"), for round prompts and progress text. */
export const MINIGAME_INFO: Record<MinigameGame, { name: string; unit: string }> = {
  "soccer-sum10": { name: "축구공 합 10", unit: "점" },
  kickups: { name: "축구공 튀기기", unit: "회" },
  freekick: { name: "3D 프리킥", unit: "골" },
  rush: { name: "잔디 러시", unit: "m" },
  cardmatch: { name: "카드 짝 맞추기", unit: "턴" },
};

/** One round of the final showdown: the round's game must be played in the stadium and reach `min`. */
export interface FinaleRound {
  game: MinigameGame;
  /** score ≥ min */
  min: number;
}

/** What a delivery item has to reach: a mailbox (world object id) or a person (cast id). */
export type DeliveryTarget = { mailbox: string } | { cast: CastId };

export interface DeliveryItem {
  id: string;
  /** Shown in the tracker and toasts ("잔디 우유"). */
  label: string;
  to: DeliveryTarget;
  /** Where the player is told to go ("서쪽 우편함"). */
  where: string;
}

export interface MissionReward {
  /** Grass shards (main missions: 1). */
  shard?: number;
  badge?: string;
  /** Flags set when the mission is completed. */
  flags?: string[];
}

interface MissionBase {
  id: string;
  giver: CastId;
  title: string;
  /** One line for the mission log and the tracker. */
  objective: string;
  /** Where to go / what to do, for the mission log. */
  hint: string;
  /** `flag:` conditions that must hold before the mission is offered (state/conditions.ts atoms). */
  requiresFlags?: string[];
  /** The player's entire personal shard quota must be collected before this mission is offered. */
  requiresAllShards?: boolean;
  /** Never offered once any of these flags is set (saves whose stadium was opened before this mission existed). */
  unlessFlags?: string[];
  /** Missions that must be completed first. */
  requires?: string[];
  reward: MissionReward;
  /** Main missions give the shards that restore the map. */
  main: boolean;
  /** Tutorial step (not a main mission, no shard). */
  tutorial?: boolean;
}

export type MissionSpec =
  | { kind: "collection_count"; count: number }
  | { kind: "card_collection" }
  | { kind: "daily_stamp" }
  | { kind: "talk" }
  | { kind: "card_reveal"; /** "@player" = the chosen member's own card. */ cardId: string }
  | { kind: "card_variant"; cardId: string; variant: string }
  | { kind: "minigame_best"; game: MinigameGame | "any"; /** score ≥ min (turns ≤ max for cardmatch). */ min?: number; max?: number }
  | { kind: "collect"; /** Pickup object ids (data/maps/overworld.json objects). */ items: string[]; noun: string }
  | { kind: "delivery"; items: DeliveryItem[]; /** Timed run when set (the parcels come from the giver). */ seconds?: number }
  | { kind: "time_trial"; /** Ordered gate ids: start, checkpoints…, goal. */ gates: string[]; hazards: string[]; seconds: number; penalty: number }
  | { kind: "kick_goals"; goal: string; ball: string; goals: number; seconds: number }
  | { kind: "talk_chain"; targets: CastId[] }
  | { kind: "finale"; /** Played in order; a cleared round stays cleared. */ rounds: FinaleRound[]; /** Golden balls that clear one round without playing it. Usable once per showdown; unset = not offered. */ ballSkip?: number };

export type MissionDef = MissionBase & MissionSpec;

const MAIN_REWARD: MissionReward = { shard: 1 };

export const MISSION_DEFS: readonly MissionDef[] = [
  { id: "s-kid-hide", giver: "kid", title: "황금 공 숨바꼭질", kind: "collection_count", count: 5, main: false, objective: "황금 축구공 아무 5개 찾기", hint: "마을 곳곳 · 도감에서 위치 확인", requiresFlags: ["ending-seen"], reward: { badge: "ball-hunter" } },
  { id: "s-arcade-rank", giver: "shopkeeper", title: "오락실 랭크 도전", kind: "minigame_best", game: "rush", min: 1000, main: false, objective: "잔디 러시 1000m 달성", hint: "오락실 5번 기계 · 모든 기계의 최고 랭크는 도감에 누적", requiresFlags: ["ending-seen"], reward: { badge: "rush-1000" } },
  { id: "m-91-cards", giver: "woowakgood", title: "열한 명의 카드 도감", kind: "card_collection",  main: false, objective: "멤버 11명의 카드 공개", hint: "감독실 카드 수납장 · 도감에서 미공개 멤버 확인", requiresFlags: ["ending-seen"], reward: { badge: "card-collector" } },
  { id: "s-rush-daily", giver: "weedking", title: "잔디 코치의 매일 훈련", kind: "daily_stamp",  main: false, objective: "일일 미션 3개 완료 후 스탬프 받기", hint: "광장 게시판 · KST 자정에 새 과제", requiresFlags: ["ending-seen"], reward: { badge: "daily-first" } },
  { id: "s-factory-garden", giver: "weeder-grunt", title: "공장을 정원으로", kind: "talk_chain", targets: ["elder", "weedking"], main: false, objective: "할아버지와 잔디 코치에게 정원 조언 듣기", hint: "공장 정원사 → 광장 할아버지 → 스타디움 옆 제초왕", requiresFlags: ["ending-seen"], reward: { badge: "factory-gardener", flags: ["factory-garden"] } },
  // ── tutorial (act 1) ────────────────────────────────────────────────────────────────────
  {
    id: "m-00-hello", giver: "elder", title: "마을 인사", kind: "talk", main: false, tutorial: true,
    objective: "잔디 할아버지에게 인사하기", hint: "중앙 광장 분수 옆",
    reward: {},
  },
  {
    id: "m-01-mycard", giver: "woowakgood", title: "감독님의 인사", kind: "card_reveal", cardId: "@player", main: false, tutorial: true,
    objective: "감독실 카드 수납장에서 내 카드 공개하기", hint: "클럽하우스 감독실(로비 왼쪽 문)",
    requires: ["m-00-hello"],
    reward: { flags: ["main-open"] },
  },
  {
    id: "m-02-arcade", giver: "shopkeeper", title: "오락실 워밍업", kind: "minigame_best", game: "any", main: false, tutorial: true,
    objective: "오락실 기계로 미니게임 한 판 하기", hint: "클럽하우스 로비 안쪽 계단 아래 오락실",
    requires: ["m-00-hello"],
    reward: { badge: "first-game" },
  },

  // ── main missions (act 2) ───────────────────────────────────────────────────────────────
  {
    id: "m-doormomo-sum10", giver: "doormomo", title: "천리안 셈법", kind: "minigame_best", game: "soccer-sum10", min: 60, main: true,
    objective: "오락실 합 10 기계에서 60점 이상", hint: "북동 룬 언덕 · 오락실 1번 기계",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-sjh4018-kickups", giver: "sjh4018", title: "공중 요새 수비 훈련", kind: "minigame_best", game: "kickups", min: 15, main: true,
    objective: "오락실 공 튀기기 기계에서 15회 이상", hint: "북서 구름 요새 · 오락실 2번 기계",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-kaksjak0730-freekick", giver: "kaksjak0730", title: "별빛 프리킥", kind: "minigame_best", game: "freekick", min: 4, main: true,
    objective: "오락실 3D 프리킥 기계에서 4골 이상", hint: "동쪽 천문대 · 오락실 3번 기계",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-janine95kim-cardmatch", giver: "janine95kim", title: "서리 카드 뒤집기", kind: "minigame_best", game: "cardmatch", max: 22, main: true,
    objective: "오락실 카드 짝 맞추기 기계에서 22턴 이내 클리어", hint: "동쪽 얼음 링크 하우스 · 오락실 4번 기계",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-haepalin-lanterns", giver: "haepalin", title: "잃어버린 해파리 랜턴", kind: "collect", noun: "해파리 랜턴", main: true,
    items: ["jelly-lantern-a", "jelly-lantern-b", "jelly-lantern-c"],
    objective: "호수 주변의 해파리 랜턴 3개 찾기", hint: "동쪽 호수 · 물가, 데크 아래, 갈대밭",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-ju010228-kickgoals", giver: "ju010228", title: "봄의 골잡이", kind: "kick_goals", goal: "goal-west", ball: "ball-kick", goals: 5, seconds: 60, main: true,
    objective: "훈련장 골대에 60초 안에 5골", hint: "북쪽 훈련장 · 공 앞에서 E로 킥",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-lina0108-card-lowq", giver: "lina0108", title: "벚꽃길 스케치", kind: "card_variant", cardId: "lina0108", variant: "lowq", main: true,
    objective: "리냐의 카드를 '조카의 스케치북'으로 열어 보기", hint: "감독실 카드 수납장 · 테마 선택",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-hachi97-talkchain", giver: "hachi97", title: "용볼 소문", kind: "talk_chain", targets: ["kid", "shopkeeper", "elder"], main: true,
    objective: "꼬마 팬 · 편의점 사장님 · 잔디 할아버지에게 소문 묻기", hint: "광장의 꼬마, 편의점, 분수 옆 할아버지",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-bboringirl-card-retro", giver: "bboringirl", title: "복고 도트 감성", kind: "card_variant", cardId: "bboringirl", variant: "retro", main: true,
    objective: "뽀린걸의 카드를 '90년대 고전 도트'로 열어 보기", hint: "감독실 카드 수납장 · 테마 선택",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-tleod1818-delivery", giver: "tleod1818", title: "번개 배달", kind: "delivery", seconds: 90, main: true,
    items: [
      { id: "parcel-a", label: "파란 택배", to: { mailbox: "mb-west" }, where: "서쪽 집 골목 우편함" },
      { id: "parcel-b", label: "빨간 택배", to: { mailbox: "mb-east" }, where: "동쪽 서리 길 우편함" },
      { id: "parcel-c", label: "초록 택배", to: { mailbox: "mb-north" }, where: "북쪽 룬 탑 앞 우편함" },
    ],
    objective: "택배 3개를 90초 안에 우편함에 배달", hint: "남서 번개 배달소 · 서쪽/동쪽/북쪽 우편함",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },
  {
    id: "m-tdnlamuron-conerun", giver: "tdnlamuron", title: "돌격병 콘 드리블", kind: "time_trial", seconds: 25, penalty: 1, main: true,
    gates: ["tt-start", "tt-1", "tt-2", "tt-3", "tt-4", "tt-5", "tt-goal"], hazards: ["cone-1", "cone-2", "cone-3", "cone-4", "cone-5"],
    objective: "콘 코스를 25초 안에 통과 (콘 접촉 +1초)", hint: "남서 용암 훈련장 · 콘 코스",
    requiresFlags: ["main-open"], reward: MAIN_REWARD,
  },

  // ── act 3 ────────────────────────────────────────────────────────────────────────────────
  {
    id: "m-89-director-report", giver: "woowakgood", title: "결전 준비", kind: "talk", main: false,
    objective: "우왁굳 감독에게 잔디 조각을 모두 모았다고 보고하기", hint: "클럽하우스 감독실 · 우왁굳 감독",
    requiresAllShards: true, requiresFlags: ["main-open"], unlessFlags: ["stadium-open"],
    reward: { flags: ["stadium-open", "beat-3", "beat-6", "beat-9"] },
  },
  {
    id: "m-90-finale", giver: "referee", title: "제초동 결전", kind: "finale", main: false,
    rounds: [
      { game: "soccer-sum10", min: 80 },
      { game: "kickups", min: 20 },
      { game: "freekick", min: 5 },
    ],
    // 17 balls lie outside the sealed weed zone (the other three come after the ending), so 12 asks for most of the map and
    // leaves 5 of all 20 for the kid's "any 5 balls" mission after the ending (it counts held balls, spent ones do not).
    ballSkip: 12,
    objective: "스타디움 결전 3연전에서 모두 승리", hint: "잔디동 스타디움 · 심판에게 말 걸기",
    requiresFlags: ["stadium-open"], reward: { badge: "weed-buster", flags: ["finale-won"] },
  },

  // ── side missions that only need act-2 mechanics (the rest come with S5) ─────────────────
  {
    id: "s-shop-milk", giver: "shopkeeper", title: "잔디 우유 배달", kind: "delivery", main: false,
    items: [{ id: "milk", label: "잔디 우유", to: { cast: "elder" }, where: "광장의 잔디 할아버지" }],
    objective: "잔디 우유를 잔디 할아버지에게 전달", hint: "편의점 → 중앙 광장 분수 옆",
    requiresFlags: ["main-open"], reward: { badge: "delivery-rookie" },
  },
  {
    id: "s-elder-water", giver: "elder", title: "광장 잔디 물 주기", kind: "collect", noun: "시든 잔디 자리",
    items: ["water-1", "water-2", "water-3", "water-4", "water-5"], main: false,
    objective: "광장의 시든 잔디 5곳에 물 주기", hint: "중앙 광장 · 시든 잔디 자리에서 E",
    requiresFlags: ["main-open"], reward: { badge: "green-thumb", flags: ["plaza-restored"] },
  },
];

const BY_ID = new Map<string, MissionDef>(MISSION_DEFS.map((def) => [def.id, def]));

export function getMissionDef(id: string): MissionDef | undefined {
  return BY_ID.get(id);
}

/** Every main mission whose giver is the player is skipped: nobody hands themselves a shard. */
export function isMissionEnabled(def: MissionDef, player: CastId | null): boolean {
  return def.giver !== player;
}

/** The missions this player can actually do, in log order. */
export function missionDefsFor(player: CastId | null): MissionDef[] {
  return MISSION_DEFS.filter((def) => isMissionEnabled(def, player));
}

/** Shards a player can earn in total (always 10: eleven main missions minus their own). */
export function totalShardsFor(player: CastId | null): number {
  return missionDefsFor(player).reduce((sum, def) => sum + (def.main ? (def.reward.shard ?? 0) : 0), 0);
}

// ── badges ─────────────────────────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  label: string;
  /** `ui/<icon>` asset key when art exists. */
  icon?: string;
}

export const BADGES: Record<string, BadgeDef> = {
  "ball-hunter": { id: "ball-hunter", label: "공 사냥꾼" },
  "ball-collector": { id: "ball-collector", label: "공 수집가" },
  "ball-master": { id: "ball-master", label: "공 마스터" },
  "card-collector": { id: "card-collector", label: "카드 수집가" },
  "rush-1000": { id: "rush-1000", label: "러시 1000m" },
  "daily-first": { id: "daily-first", label: "첫 일일 훈련" },
  "daily-7": { id: "daily-7", label: "일일 스탬프 7" },
  "daily-14": { id: "daily-14", label: "일일 스탬프 14" },
  "daily-30": { id: "daily-30", label: "일일 스탬프 30" },
  "factory-gardener": { id: "factory-gardener", label: "공장 정원사" },

  "first-game": { id: "first-game", label: "첫 한 판", icon: "ui/bd-first-game" },
  "delivery-rookie": { id: "delivery-rookie", label: "배달 왕초보" },
  "green-thumb": { id: "green-thumb", label: "초록 손", icon: "ui/bd-green-thumb" },
  "weed-buster": { id: "weed-buster", label: "제초동 격파" },
  "shard-5": { id: "shard-5", label: "잔디 조각 5개", icon: "ui/bd-shard-5" },
  "shard-10": { id: "shard-10", label: "잔디 조각 10개", icon: "ui/bd-shard-10" },
};

/** Flag that stores an earned badge in `WorldSave.flags`. */
export const badgeFlag = (id: string) => `badge:${id}`;

// ── where each member's mission restores the map ────────────────────────────────────────────

/** District (data/maps/overworld.json zone id) around each member's house (docs/world/03 §3–§4). */
export const MEMBER_ZONE: Partial<Record<CastId, string>> = {
  sjh4018: "z-cloud",
  doormomo: "z-rune",
  ju010228: "z-spring",
  lina0108: "z-spring",
  hachi97: "z-spring",
  janine95kim: "z-frost",
  kaksjak0730: "z-frost",
  haepalin: "z-frost",
  bboringirl: "z-forge",
  tleod1818: "z-forge",
  tdnlamuron: "z-forge",
};
