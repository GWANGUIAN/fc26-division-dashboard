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

/** Tile span with inclusive corners: [x0, y0, x1, y1] (docs/world/03 §10). */
export type TileSpan = [number, number, number, number];
/** Box in tiles as [x, y, w, h] (door and trigger rects). */
export type TileBox = [number, number, number, number];
/** Box in pixels as [x, y, w, h] (collision rects). */
export type PxBox = [number, number, number, number];

export type NpcAi = "stay" | "idle" | "wander";

export interface MapZone {
  id: string;
  name: string;
  rect: TileSpan;
  /** Colour grade for the zone (applied by S4). */
  tint: string;
  particles?: string;
  bgm?: string;
}

export interface MapBuilding {
  id: string;
  /** Sprite box in tiles; the sprite is anchored to its bottom edge. */
  rect: TileSpan;
  /** Door in tiles [x, y, w, h]; the doorstep row is the last row of `rect`. */
  door?: TileBox;
  interior?: string;
}

export interface MapProp {
  prop: string;
  /** Feet position in pixels (bottom centre of the sprite). */
  x: number;
  y: number;
}

export interface MapNpc {
  cast: CastId;
  tile: [number, number];
  ai: NpcAi;
  /** Wander area in tiles [x, y, w, h]. */
  wander?: TileBox;
  /** Spawn condition (mission/flag expression, evaluated from S3). NPCs with a condition are not spawned in S2. */
  when?: string;
}

export type MapTrigger = {
  type: "door";
  rect: TileBox;
  to: { scene: SceneId; tile: [number, number]; facing?: Facing };
};

export interface MapExamine {
  id?: string;
  /** Centre of the examine area in tiles. */
  tile: [number, number];
  text: string;
  /** Examine area in pixels [w, h] around the tile centre (default 64×48). */
  size?: [number, number];
}

export interface OverworldMapData {
  id: "overworld";
  size: [number, number];
  tile: number;
  /** Walkable region in tiles [x, y, w, h]; the rest is the forest/cliff band. */
  walkable: TileBox;
  /** Default entry tile (debug teleport, broken-save fallback). */
  spawn: [number, number];
  legend: Record<string, string>;
  terrainRows: string[];
  zones: MapZone[];
  props: MapProp[];
  buildings: MapBuilding[];
  collision: PxBox[];
  npcs: MapNpc[];
  triggers: MapTrigger[];
  examine: MapExamine[];
}

export interface InteriorMapData {
  id: string;
  /** Asset key of the room image, e.g. "interiors/int-house-doormomo". */
  image: string;
  size: [number, number];
  spawn: [number, number];
  /** Where the bottom door leads back to. */
  exitTo: { scene: SceneId; tile: [number, number] };
  collision: PxBox[];
  examine: MapExamine[];
  npcs: MapNpc[];
  triggers: MapTrigger[];
}

export interface MinigameRoundResult {
  game: "soccer-sum10" | "kickups" | "freekick" | "cardmatch";
  /** cardmatch reports the number of turns (lower is better). */
  score: number;
  cleared?: boolean;
}
