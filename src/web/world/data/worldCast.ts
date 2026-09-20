import type { CastDef, CastId } from "../types";

// Hard-coded on purpose: roster.yaml is not read by the web app and guests are hard-coded by project
// rule (docs/world/01 §10). Names/ids follow docs/world/02 §3, spawns follow docs/world/03 §6 (tiles),
// member colours mirror src/web/toty-card/totyCardTheme.ts, voice clips follow docs/world/07 §3.

const TILE = 32;
/** Centre of a tile in world pixels (entities are positioned by their feet). */
const at = (tx: number, ty: number) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

const member = (
  id: CastId,
  displayName: string,
  themeColor: string,
  voiceSfx: string,
  tile: [number, number],
): CastDef => ({
  id,
  displayName,
  playable: true,
  role: "member",
  home: `interior:house-${id}`,
  themeColor,
  voiceSfx,
  spawn: { scene: "overworld", ...at(tile[0], tile[1]), ai: "stay" },
});

export const WORLD_CAST: CastDef[] = [
  member("janine95kim", "재닌", "#a6dcff", "/sfxes/jaenin.mp3", [62, 27]),
  member("bboringirl", "뽀린걸", "#ff5c5c", "/sfxes/bboringirl.mp3", [6, 52]),
  member("sjh4018", "핑구", "#ffe9b0", "/sfxes/pinggu.mp3", [14, 12]),
  member("doormomo", "문모모", "#c9a6ff", "/sfxes/doormomo.mp3", [66, 13]),
  member("hachi97", "하치", "#ffe29e", "/sfxes/hachi.mp3", [6, 41]),
  member("kaksjak0730", "한결", "#7ec8ff", "/sfxes/hangyeul.mp3", [73, 27]),
  member("ju010228", "쥬멩이", "#d9f27a", "/sfxes/jyumenge.mp3", [8, 26]),
  member("haepalin", "해파린", "#e0a6ff", "/sfxes/haeparin.mp3", [73, 39]),
  member("tleod1818", "빙밍", "#5cffb8", "/sfxes/bingming.mp3", [17, 52]),
  member("tdnlamuron", "다시바", "#ffb454", "/sfxes/dashiba.mp3", [26, 53]),
  member("lina0108", "리냐", "#ff8fc0", "/sfxes/linya.mp3", [19, 36]),
  {
    id: "woowakgood",
    displayName: "우왁굳",
    playable: false,
    role: "host",
    themeColor: "#7fdca4",
    voiceSfx: "/sfxes/woowakgood.mp3",
    spawn: { scene: "interior:clubhouse-office", ...at(10, 7), ai: "stay" },
  },
  {
    id: "elder",
    displayName: "잔디 할아버지",
    playable: false,
    role: "original",
    themeColor: "#c8b27a",
    spawn: { scene: "overworld", ...at(36, 21), ai: "stay" },
  },
  {
    id: "shopkeeper",
    displayName: "편의점 사장님",
    playable: false,
    role: "original",
    themeColor: "#7fe8c8",
    spawn: { scene: "interior:store", ...at(12, 6), ai: "stay" },
  },
  {
    id: "kid",
    displayName: "꼬마 팬",
    playable: false,
    role: "original",
    themeColor: "#ff9a8a",
    spawn: { scene: "overworld", ...at(44, 22), ai: "wander", wanderRect: { x: 33 * TILE, y: 18 * TILE, w: 15 * TILE, h: 8 * TILE } },
  },
  {
    id: "referee",
    displayName: "심판",
    playable: false,
    role: "original",
    themeColor: "#ffe14a",
    spawn: { scene: "interior:stadium", ...at(7, 6), ai: "stay" },
  },
  {
    id: "weedking",
    displayName: "제초왕",
    playable: false,
    role: "original",
    themeColor: "#b98a6a",
    drawScale: 1.5,
    // Before the ending he waits inside the factory; the story moves him to the stadium later.
    spawn: { scene: "interior:factory", ...at(10, 7), ai: "stay" },
  },
  {
    id: "weeder-grunt",
    displayName: "제초 요원",
    playable: false,
    role: "original",
    themeColor: "#9aa0a6",
    spawn: { scene: "overworld", ...at(54, 49), ai: "stay" },
  },
  {
    id: "cat-jandi",
    displayName: "잔디냥",
    playable: false,
    role: "animal",
    themeColor: "#b8f0d0",
    spawn: { scene: "overworld", ...at(38, 24), ai: "wander", wanderRect: { x: 35 * TILE, y: 22 * TILE, w: 6 * TILE, h: 3 * TILE } },
  },
  {
    id: "dog-ball",
    displayName: "공돌이",
    playable: false,
    role: "animal",
    themeColor: "#d9a066",
    spawn: { scene: "overworld", ...at(26, 10), ai: "wander", wanderRect: { x: 22 * TILE, y: 7 * TILE, w: 9 * TILE, h: 8 * TILE } },
  },
];

const BY_ID = new Map<string, CastDef>(WORLD_CAST.map((cast) => [cast.id, cast]));

export const PLAYABLE_CAST: CastDef[] = WORLD_CAST.filter((cast) => cast.playable);

export function isCastId(value: unknown): value is CastId {
  return typeof value === "string" && BY_ID.has(value);
}

export function isPlayableCastId(value: unknown): value is CastId {
  return typeof value === "string" && BY_ID.get(value)?.playable === true;
}

export function getCast(id: CastId): CastDef {
  return BY_ID.get(id)!;
}
