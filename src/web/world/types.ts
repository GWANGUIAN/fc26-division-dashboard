// Shared types for 잔디동 월드 (docs/world/01-concept-and-architecture.md §7).

export type CastId =
  | "janine95kim" | "bboringirl" | "sjh4018" | "doormomo" | "hachi97" | "kaksjak0730"
  | "ju010228" | "haepalin" | "tleod1818" | "tdnlamuron" | "lina0108" // members (playable)
  | "woowakgood" | "elder" | "shopkeeper" | "kid" | "referee" | "weedking" | "weeder-grunt"
  | "cat-jandi" | "dog-ball"; // NPC only

export type SceneId = "overworld" | `interior:${string}`;

export type Facing = "down" | "up" | "left" | "right";

export type MissionStatus = "locked" | "available" | "active" | "ready" | "completed";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CastDef {
  id: CastId;
  displayName: string;
  playable: boolean;
  role: "member" | "host" | "original" | "animal";
  /** Interior scene id of the member's house (members only). */
  home?: string;
  /** TOTY card text colour — UI accent for this character. */
  themeColor: string;
  /** Greeting voice clip played on the first conversation (path under public/). */
  voiceSfx?: string;
  spawn: { scene: SceneId; x: number; y: number; ai: "stay" | "idle" | "wander"; wanderRect?: Rect };
}

export interface MissionProgress {
  status: MissionStatus;
  progress?: unknown;
  startedAt?: number;
}

export interface WorldSave {
  schemaVersion: number;
  player: CastId | null;
  scene: SceneId;
  x: number;
  y: number;
  facing: Facing;
  missions: Record<string, MissionProgress>;
  /** 0–10, one per completed main mission (the player's own mission is excluded). */
  shards: number;
  flags: Record<string, true>;
  /** Collected item ids (golden balls, jellyfish lanterns, ...). */
  collected: string[];
  /** Conversation count per NPC (rotating dialogue index). */
  talked: Record<string, number>;
  bests: { rush?: number; sum10?: number; kickups?: number; freekick?: number; cardmatch?: number };
  daily: { date: string; picks: string[]; done: string[]; stamps: string[] };
  coachDone: boolean;
}

export interface WorldSettings {
  bgm: boolean;
  bgmVolume: number;
  sfx: boolean;
  sfxVolume: number;
}

export interface MinigameRoundResult {
  game: "soccer-sum10" | "kickups" | "freekick" | "cardmatch";
  /** cardmatch reports the number of turns (lower is better). */
  score: number;
  cleared?: boolean;
}
