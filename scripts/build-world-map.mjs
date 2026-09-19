import { GOLDEN_BALLS } from "../src/web/world/data/goldenBalls.ts";
// Generates the first draft of the overworld map (docs/world/03) — `src/web/world/data/maps/overworld.json`.
//
//   node scripts/build-world-map.mjs                 write the whole file (overwrites hand edits!)
//   node scripts/build-world-map.mjs --terrain-only  rewrite only legend + terrainRows of the existing file
//   node scripts/build-world-map.mjs --ascii         print a text picture of the result (no write)
//
// The zone / road / building tables below are 03 §3–§6 with the fixes that came out of laying them on one
// grid (see docs/world/03 §5 notes): roads no longer run through houses, the stadium door is the south gate
// that is actually in the art, and building collision is the visible sprite minus the door notch. After the
// first run the JSON is meant to be hand-edited; use `--terrain-only` if only the ground needs regenerating.
//
// Imports the prop table straight from TypeScript (plain data, no runtime imports): needs Node >= 22.18.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PROP_DEFS } from "../src/web/world/data/propDefs.ts";
import { TERRAIN_SHEETS, TERRAIN_SLOTS } from "../src/web/world/data/terrainDefs.ts";

const TILE = 32;
const W = 80;
const H = 60;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/web/world/data/maps/overworld.json");

// ── tables ────────────────────────────────────────────────────────────────────────────────

/** First match wins, so the centre (which overlaps the districts' inner edges) comes first. */
export const ZONES = [
  { id: "z-center", name: "잔디동 중앙", rect: [20, 2, 55, 43], tint: "#ffe9a8", particles: "leaves", bgm: "field" },
  { id: "z-cloud", name: "구름 언덕", rect: [2, 2, 24, 17], tint: "#9fd4ff", bgm: "region-sky" },
  { id: "z-rune", name: "룬 언덕", rect: [56, 2, 78, 17], tint: "#c9a6ff", particles: "rune-dust", bgm: "region-sky" },
  { id: "z-spring", name: "봄 정원", rect: [2, 18, 24, 43], tint: "#ffb3d6", particles: "petals", bgm: "region-spring" },
  { id: "z-frost", name: "달빛·서리 호수", rect: [56, 18, 78, 43], tint: "#8fa8ff", particles: "snow-fireflies", bgm: "region-frost" },
  { id: "z-forge", name: "번개·불꽃 공업지구", rect: [2, 44, 27, 58], tint: "#ff9a5a", particles: "embers", bgm: "region-forge" },
  { id: "z-shops", name: "상점가", rect: [28, 44, 53, 58], tint: "#ffd38a", bgm: "field" },
  { id: "z-weed", name: "제초동 구역", rect: [54, 44, 78, 58], tint: "#b5b5ad", particles: "dust", bgm: "region-weed" },
];

/** rect = sprite box (tiles, inclusive), door = [x, y, w, h], skip = empty tile rows at the top of the sprite. */
export const BUILDINGS = [
  { id: "clubhouse", rect: [34, 6, 45, 13], door: [39, 12, 2, 2], interior: "clubhouse-lobby", skip: 0 },
  { id: "stadium", rect: [27, 26, 52, 41], door: [39, 41, 2, 1], interior: "stadium", skip: 0 },
  { id: "fountain", rect: [37, 19, 42, 23], skip: 0 },
  { id: "house-sjh4018", rect: [8, 3, 17, 11], door: [12, 11, 2, 1], interior: "house-sjh4018", skip: 2 },
  { id: "house-doormomo", rect: [64, 2, 70, 12], door: [66, 12, 2, 1], interior: "house-doormomo", skip: 0 },
  { id: "house-ju010228", rect: [6, 20, 13, 25], door: [9, 25, 2, 1], interior: "house-ju010228", skip: 0 },
  { id: "house-lina0108", rect: [14, 30, 21, 35], door: [17, 35, 2, 1], interior: "house-lina0108", skip: 0 },
  { id: "house-hachi97", rect: [4, 34, 11, 40], door: [7, 40, 2, 1], interior: "house-hachi97", skip: 1 },
  { id: "house-janine95kim", rect: [58, 20, 65, 26], door: [61, 26, 2, 1], interior: "house-janine95kim", skip: 2 },
  { id: "house-kaksjak0730", rect: [68, 19, 75, 26], door: [71, 26, 2, 1], interior: "house-kaksjak0730", skip: 0 },
  { id: "house-haepalin", rect: [72, 33, 78, 38], door: [74, 38, 2, 1], interior: "house-haepalin", skip: 0 },
  { id: "house-bboringirl", rect: [4, 46, 11, 51], door: [7, 51, 2, 1], interior: "house-bboringirl", skip: 0 },
  { id: "house-tleod1818", rect: [12, 46, 19, 51], door: [15, 51, 2, 1], interior: "house-tleod1818", skip: 0 },
  { id: "house-tdnlamuron", rect: [21, 47, 27, 52], door: [24, 52, 2, 1], interior: "house-tdnlamuron", skip: 1 },
  { id: "store", rect: [33, 46, 39, 50], door: [35, 50, 2, 1], interior: "store", skip: 0 },
  { id: "cafe", rect: [43, 46, 49, 50], door: [46, 50, 2, 1], interior: "cafe", skip: 0 },
  { id: "factory", rect: [62, 46, 74, 55], door: [68, 55, 2, 1], interior: "factory", skip: 1, matDx: 16 },
];

/** Roads: 2 wide unless noted. `kind` picks the material (main = stone, spur = dirt; each district re-skins them). */
const ROADS = [
  { id: "clubhouse-plaza", rect: [39, 14, 40, 17], kind: "main" },
  { id: "clubhouse-apron", rect: [36, 14, 43, 15], kind: "main" },
  { id: "west-main", rect: [14, 21, 32, 22], kind: "main" },
  { id: "east-main", rect: [48, 21, 55, 22], kind: "main" },
  { id: "west-loop", rect: [24, 23, 26, 43], kind: "main" },
  { id: "east-loop", rect: [53, 23, 55, 43], kind: "main" },
  { id: "south-main", rect: [4, 44, 53, 45], kind: "main" },
  { id: "stadium-gate", rect: [39, 42, 40, 43], kind: "main" },
  { id: "nw-road", rect: [18, 12, 19, 20], kind: "main" },
  { id: "sjh-yard", rect: [12, 12, 19, 13], kind: "spur" },
  { id: "rune-road", rect: [41, 14, 67, 15], kind: "main" },
  { id: "doormomo-yard", rect: [66, 13, 67, 13], kind: "spur" },
  { id: "spring-link", rect: [14, 23, 15, 27], kind: "spur" },
  { id: "ju-yard", rect: [9, 26, 13, 27], kind: "spur" },
  { id: "west-spur", rect: [12, 26, 13, 43], kind: "spur" },
  { id: "lina-yard", rect: [12, 36, 19, 37], kind: "spur" },
  { id: "hachi-yard", rect: [7, 41, 13, 42], kind: "spur" },
  { id: "frost-road", rect: [56, 27, 73, 28], kind: "main" },
  { id: "deck", rect: [56, 40, 78, 41], kind: "deck" },
  { id: "shops-spur", rect: [40, 46, 41, 51], kind: "spur" },
  { id: "shops-walk", rect: [33, 51, 49, 52], kind: "spur" },
  { id: "forge-spur", rect: [28, 46, 29, 54], kind: "main" },
  { id: "forge-walk-e", rect: [21, 53, 29, 54], kind: "main" },
  { id: "forge-walk-w", rect: [4, 52, 20, 53], kind: "main" },
];

const PLAZA = [33, 18, 47, 25];
const TRAINING = [20, 6, 31, 15];
const CONE_COURSE = [4, 54, 18, 58];
const LAKE = [56, 29, 76, 39];
const LAKE_DEEP = [60, 31, 72, 37];
const BRIDGE = [58, 34, 72, 35];

/** [cast, tile, ai, wander tiles [x, y, w, h] | null, when] — docs/world/03 §6 (interior residents live in the interior JSON). */
const NPCS = [
  ["elder", [36, 21], "stay"],
  ["kid", [44, 22], "wander", [33, 18, 15, 8]],
  ["cat-jandi", [38, 24], "wander", [35, 22, 6, 3]],
  ["dog-ball", [26, 10], "wander", [22, 7, 9, 8]],
  ["weeder-grunt", [54, 49], "stay"],
  ["weeder-grunt", [56, 51], "stay"],
  // after the ending (S4): the Weeder King coaches next to the stadium
  ["weedking", [55, 30], "stay", null, "flag:ending-seen"],
  ["doormomo", [66, 13], "stay"],
  ["sjh4018", [12, 12], "stay"],
  ["kaksjak0730", [71, 27], "stay"],
  ["janine95kim", [61, 27], "stay"],
  ["haepalin", [74, 39], "stay"],
  ["ju010228", [9, 26], "stay"],
  ["lina0108", [17, 36], "stay"],
  ["hachi97", [7, 41], "stay"],
  ["bboringirl", [7, 52], "stay"],
  ["tleod1818", [15, 52], "stay"],
  ["tdnlamuron", [24, 53], "stay"],
];

/** Doors that are shut until a condition holds (S4): what the player is told while it does not. */
const LOCKED_DOORS = {
  stadium: { when: "flag:stadium-open", locked: "스타디움 문이 굳게 닫혀 있다. 잔디 조각을 모두 모으면 열릴 것 같다." },
};

/** Plaza signs, district signs and the gate plates (docs/world/03 §6). Texts follow the story: a point with `when` exists only
 * while it holds, so the stadium plate and the Weeder warning read differently before and after the story moves on.
 */
const EXAMINE = [
  { id: "daily-board", tile: [44,25], text: "오늘의 훈련 게시판", size: [48,40], action: "daily" },
  { id: "collection-book", tile: [46,25], text: "잔디동 도감", size: [48,40], action: "collection" },
  { id: "sign-plaza", tile: [35, 25], text: "잔디동 광장. 표지판에는 화살표만 그려져 있다.", size: [48, 40] },
  { id: "bench-plaza", tile: [34, 23], text: "햇볕에 데워진 벤치. 앉아서 쉬고 싶어진다.", size: [64, 40] },
  { id: "fountain-statue", tile: [40, 24], text: "축구공을 든 잔디 요정 동상이다. 물줄기가 리듬을 타고 솟는다.", size: [96, 40] },
  { id: "clubhouse-plate", tile: [39, 15], text: "클럽하우스 입구. 문 옆 돌판은 비어 있다.", size: [64, 40] },
  { id: "stadium-plate", tile: [37, 43], text: "잔디동 스타디움 정문. 굳게 닫혀 있다. 잔디 조각을 모두 모으면 열린다고 한다.", size: [64, 40], when: "not:flag:stadium-open" },
  { id: "stadium-plate-open", tile: [37, 43], text: "잔디동 스타디움 정문. 문이 활짝 열려 있다. 안에서 결전이 기다린다.", size: [64, 40], when: "flag:stadium-open&not:flag:ending-seen" },
  { id: "stadium-plate-after", tile: [37, 43], text: "잔디동 스타디움 정문. 안쪽에서 응원의 여운이 아직 들리는 듯하다.", size: [64, 40], when: "flag:ending-seen" },
  { id: "weed-warning", tile: [53, 47], text: "경고판 — 빨간 줄이 그어진 새싹 그림. 이 앞은 제초동 구역이다.", size: [48, 48], when: "not:flag:area-weed-open" },
  { id: "weed-warning-after", tile: [53, 47], text: "경고판 — 새싹 그림 위에 누군가 초록 스티커를 붙여 놓았다. 이제 이 앞도 지나갈 수 있다.", size: [48, 48], when: "flag:area-weed-open" },
  { id: "store-sign", tile: [35, 51], text: "잔디 편의점. 간판에 우유병 그림이 그려져 있다.", size: [64, 40] },
  { id: "cafe-sign", tile: [45, 51], text: "왁물원 카페. 창가에 종이가 잔뜩 붙어 있다.", size: [64, 40] },
  { id: "training-sign", tile: [19, 9], text: "훈련장. '골대 정면으로 자신 있게!'라고 적혀 있다.", size: [48, 48] },
  { id: "cloud-sign", tile: [19, 16], text: "구름 요새 가는 길. 바람이 세니 모자를 조심하세요.", size: [48, 48] },
  { id: "rune-sign", tile: [60, 15], text: "룬 언덕. 돌에 새겨진 글자가 희미하게 빛난다.", size: [48, 48] },
  { id: "spring-sign", tile: [15, 22], text: "봄 정원 가는 길. 길 끝에서 벚꽃 냄새가 난다.", size: [48, 48] },
  { id: "dragon-sign", tile: [8, 42], text: "용의 언덕. 언덕 위 황금 용 조각이 햇빛에 반짝인다.", size: [48, 48] },
  { id: "forge-sign", tile: [10, 53], text: "공업지구. 어디선가 망치 소리와 번개 치는 소리가 들린다.", size: [48, 48] },
  { id: "frost-sign", tile: [58, 27], text: "서리 호수 마을. 링크 옆에 스케이트 자국이 남아 있다.", size: [48, 48] },
  { id: "lake-sign", tile: [57, 29], text: "호수 안내판. '깊은 곳은 들어가지 마세요. 랜턴 친구들이 놀고 있어요.'", size: [48, 48] },
  // delivery mailboxes (S3, docs/world/03 §7): `action` hands over the parcel that belongs to this box
  { id: "mb-west", tile: [14, 38], text: "우편함이다. 지금은 넣을 것이 없다.", size: [48, 48], action: "mailbox:mb-west" },
  { id: "mb-east", tile: [69, 27], text: "우편함이다. 지금은 넣을 것이 없다.", size: [48, 48], action: "mailbox:mb-east" },
  { id: "mb-north", tile: [68, 13], text: "우편함이다. 지금은 넣을 것이 없다.", size: [48, 48], action: "mailbox:mb-north" },
];

/**
 * World objects the missions use (S3, docs/world/03 §7–§8). Tiles unless noted; `rect` is [x, y, w, h] tiles.
 * The lanterns and the plaza grass spots only show while their mission is active.
 */
const OBJECTS = [
  { id: "daily-board-art", type: "decor", at: [1424,816], prop: "board-daily", when: "" },
  ...GOLDEN_BALLS.filter(b => b.scene === "overworld").map(b => ({ id: b.id, type: "pickup", tile: b.tile, prop: "goldball-1", autoCollect: true, prompt: "황금 축구공", ...(b.ending ? { when: "flag:ending-seen" } : {}) })),
  // 해파리 랜턴 (호수 일대)
  { id: "jelly-lantern-a", type: "pickup", tile: [57, 36], prop: "jelly-lantern-a", prompt: "줍기", when: "mission-active:m-haepalin-lanterns" },
  { id: "jelly-lantern-b", type: "pickup", tile: [66, 41], prop: "jelly-lantern-b", prompt: "줍기", when: "mission-active:m-haepalin-lanterns" },
  { id: "jelly-lantern-c", type: "pickup", tile: [74, 31], prop: "jelly-lantern-c", prompt: "줍기", when: "mission-active:m-haepalin-lanterns" },
  // 광장의 시든 잔디 자리 (잔디 할아버지 서브)
  ...[[34, 19], [36, 24], [43, 19], [45, 23], [40, 25]].map(([x, y], i) => ({ id: `water-${i + 1}`, type: "pickup", tile: [x, y], prop: "grass-tuft-prop", look: "withered", prompt: "물 주기", when: "mission-active:s-elder-water" })),
  // 광장 잔디 영구 복원 (S4): 물 주기를 끝내면 그 자리에 싱싱한 잔디가 난다
  ...[[34, 19], [36, 24], [43, 19], [45, 23], [40, 25]].map(([x, y], i) => ({ id: `plaza-grass-${i + 1}`, type: "decor", prop: "grass-tuft-prop", at: [x * 32 + 16, y * 32 + 16], when: "flag:plaza-restored" })),
  // 제초동 게이트 (S4): 엔딩 전에는 바리케이드가 막고, 엔딩이 끝나면 열린다
  { id: "weed-gate", type: "barrier", rect: [55, 49, 1, 3], when: "not:flag:area-weed-open" },
  ...[49, 50, 51].map((ty, i) => ({ id: `barricade-${i + 1}`, type: "decor", prop: "barricade", at: [55 * 32, ty * 32 + 30], when: "not:flag:area-weed-open" })),
  // 쥬멩이 킥: 훈련장의 공과 서쪽 골대
  { id: "ball-kick", type: "ball", tile: [27, 11.375], bounds: [20, 6, 12, 10] },
  { id: "goal-west", type: "goal", rect: [20, 10.78125, 2, 2.21875] },
  // 다시바 콘 코스: 시작/도착 게이트 사이를 콘 사이로 번갈아 위·아래로 지난다 (콘은 가운데 줄 y=56)
  { id: "tt-start", type: "gate", rect: [5, 54, 1, 5] },
  { id: "tt-1", type: "gate", rect: [7, 54, 1, 2] },
  { id: "tt-2", type: "gate", rect: [9, 57, 1, 2] },
  { id: "tt-3", type: "gate", rect: [11, 54, 1, 2] },
  { id: "tt-4", type: "gate", rect: [13, 57, 1, 2] },
  { id: "tt-5", type: "gate", rect: [15, 54, 1, 2] },
  { id: "tt-goal", type: "gate", rect: [17, 54, 1, 5] },
  ...[7, 9, 11, 13, 15].map((x, i) => ({ id: `cone-${i + 1}`, type: "hazard", tile: [x, 56], prop: "cone-orange" })),
];

// ── terrain legend ────────────────────────────────────────────────────────────────────────

/** Codes the generator uses, in a stable order (sheet order × slot order) so re-runs keep the same characters. */
const USED_CODES = new Set();
const CHARSET = "gGhHfFtsdDkKPQRS~,=:aAebBlyY1234567890ujJmM*nNoiIczZxXqrLTU!@#$%^&()[]{}<>;?CEOpvVwW+|.'-_/`";
let legendCache = null;

function ch(code) {
  USED_CODES.add(code);
  return code;
}

function buildLegend() {
  const ordered = [];
  for (const sheet of TERRAIN_SHEETS) for (const slot of TERRAIN_SLOTS[sheet]) if (USED_CODES.has(`${sheet}/${slot}`)) ordered.push(`${sheet}/${slot}`);
  if (ordered.length > CHARSET.length) throw new Error(`legend needs ${ordered.length} characters`);
  const legend = {};
  const byCode = new Map();
  ordered.forEach((code, index) => {
    legend[CHARSET[index]] = code;
    byCode.set(code, CHARSET[index]);
  });
  legendCache = { legend, byCode };
  return legendCache;
}

// ── helpers ───────────────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x, y, seed = 0) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const inSpan = (span, x, y) => x >= span[0] && x <= span[2] && y >= span[1] && y <= span[3];
const spanOf = (box) => [box[0], box[1], box[0] + box[2] - 1, box[1] + box[3] - 1];

function weighted(list, r) {
  const total = list.reduce((sum, [, weight]) => sum + weight, 0);
  let t = r * total;
  for (const [value, weight] of list) {
    t -= weight;
    if (t < 0) return value;
  }
  return list[list.length - 1][0];
}

function zoneAt(x, y) {
  return ZONES.find((zone) => inSpan(zone.rect, x, y))?.id ?? "z-center";
}

// ── ground palettes ───────────────────────────────────────────────────────────────────────

const GROUND = {
  "z-center": [["core/grass-a", 58], ["core/grass-b", 16], ["core/grass-c", 10], ["core/grass-d", 8], ["core/grass-flower-a", 3], ["core/grass-flower-b", 2], ["core/grass-tuft", 3]],
  "z-shops": [["core/grass-a", 55], ["core/grass-b", 18], ["core/grass-c", 10], ["core/grass-d", 10], ["core/grass-tuft", 4], ["core/grass-flower-a", 3]],
  "z-cloud": [["cloud/cloud-stone-a", 30], ["cloud/cloud-stone-b", 20], ["cloud/cloud-puff-a", 12], ["cloud/wind-grass-a", 22], ["cloud/wind-grass-b", 16]],
  "z-rune": [["cloud/rune-slab-a", 22], ["cloud/rune-slab-b", 18], ["cloud/rune-slab-dim", 12], ["cloud/moss-stone-a", 26], ["cloud/moss-stone-b", 22]],
  "z-spring": [["spring/sakura-ground-a", 38], ["spring/sakura-ground-b", 14], ["spring/sakura-ground-c", 4], ["spring/clover-a", 16], ["spring/clover-b", 8], ["spring/moss-a", 10], ["spring/meadow-tall-a", 6], ["spring/flowerbed-pink", 2], ["spring/flowerbed-yellow", 2]],
  "z-frost": [["frost/night-grass-a", 50], ["frost/night-grass-b", 26], ["frost/night-grass-c", 14], ["frost/frozen-grass-a", 6], ["frost/frozen-grass-b", 4]],
  "z-forge": [["industrial/cracked-rock-a", 50], ["industrial/cracked-rock-b", 30], ["industrial/ash-a", 10], ["industrial/ash-b", 6], ["industrial/lava-crack-a", 3], ["industrial/scorched-dirt", 4]],
  "z-weed": [["weed/gray-ground-a", 34], ["weed/gray-ground-b", 26], ["weed/gray-ground-c", 20], ["weed/gray-ground-d", 12], ["weed/barren-dirt", 5], ["weed/dead-weed-patch", 3]],
};

const ROAD_MATERIAL = {
  "z-center": { main: [["core/path-stone-a", 3], ["core/path-stone-b", 1]], spur: [["core/path-dirt-a", 3], ["core/path-dirt-b", 1]] },
  "z-shops": { main: [["core/path-stone-a", 3], ["core/path-stone-b", 1]], spur: [["core/path-dirt-a", 3], ["core/path-dirt-b", 1]] },
  "z-cloud": { main: [["cloud/blue-marble-a", 3], ["cloud/blue-marble-b", 1]], spur: [["cloud/sky-tile-a", 3], ["cloud/sky-tile-b", 1]] },
  "z-rune": { main: [["cloud/blue-marble-a", 3], ["cloud/blue-marble-b", 1]], spur: [["cloud/sky-tile-a", 3], ["cloud/sky-tile-b", 1]] },
  "z-spring": { main: [["spring/garden-path-a", 3], ["spring/garden-path-b", 1]], spur: [["spring/garden-path-a", 3], ["spring/garden-path-b", 1]] },
  "z-frost": { main: [["frost/starlit-path-a", 3], ["frost/starlit-path-b", 1]], spur: [["frost/star-stone-a", 3], ["frost/star-stone-b", 1]] },
  "z-forge": { main: [["industrial/asphalt-a", 3], ["industrial/asphalt-b", 1]], spur: [["industrial/metal-plate-a", 3], ["industrial/metal-plate-b", 1]] },
  "z-weed": { main: [["weed/concrete-a", 3], ["weed/concrete-b", 1]], spur: [["weed/concrete-a", 3], ["weed/concrete-b", 1]] },
};

// ── props ─────────────────────────────────────────────────────────────────────────────────

/** Scatter palettes per district: [prop, weight] and how many attempts per 100 tiles. */
const SCATTER = {
  "z-center": { density: 5, pool: [["tree-oak", 4], ["tree-oak-big", 2], ["tree-birch", 3], ["bush-a", 3], ["bush-flower", 2], ["bush-berry", 1], ["flower-red", 2], ["flower-yellow", 2], ["flower-white", 2], ["flower-blue", 2], ["grass-tuft-prop", 3], ["rock-small", 1], ["mushrooms", 1]] },
  "z-cloud": { density: 5, pool: [["tree-cloud", 5], ["cloud-pillar", 2], ["cloud-bench", 1], ["bush-a", 2], ["flower-white", 3], ["flower-blue", 3], ["grass-tuft-prop", 3], ["rock-small", 1]] },
  "z-rune": { density: 5, pool: [["tree-night", 3], ["rune-stone-a", 3], ["rune-stone-b", 3], ["crystal-purple", 3], ["banner-blue", 1], ["flower-blue", 2], ["mushrooms", 2], ["rock-small", 1]] },
  "z-spring": { density: 8, pool: [["tree-sakura", 6], ["bush-flower", 4], ["flower-red", 3], ["flower-yellow", 3], ["flower-white", 3], ["fern", 2], ["lantern-pink", 1], ["windchime", 1], ["scarecrow", 1]] },
  "z-frost": { density: 5, pool: [["tree-frost", 4], ["tree-night", 2], ["ice-crystal-a", 2], ["ice-crystal-b", 2], ["night-flower", 4], ["snowman", 1], ["rock-small", 1], ["rock-medium", 1]] },
  "z-forge": { density: 5, pool: [["tree-dead", 2], ["tree-lava", 2], ["barrel-red", 2], ["barrel-gray", 2], ["crate-stack", 2], ["generator", 1], ["anvil", 1], ["scrap-pile", 2], ["tool-rack", 1], ["lava-vent", 1], ["rock-medium", 2], ["rock-small", 2]] },
  "z-shops": { density: 3, pool: [["tree-oak", 3], ["tree-birch", 2], ["bush-a", 2], ["planter", 2], ["trash-bin", 1], ["bike-rack", 1], ["flower-yellow", 2], ["flower-red", 2], ["grass-tuft-prop", 2]] },
  "z-weed": { density: 4, pool: [["tree-dead", 3], ["mower-ride-on", 1], ["mower-push", 1], ["oil-drum", 2], ["tire-stack", 2], ["floodlight", 1], ["warning-sign", 1], ["cut-grass-pile", 2], ["rock-small", 1]] },
};

/** Forest that closes the two-tile border band, by district. */
const BORDER_TREES = {
  "z-center": ["tree-oak", "tree-pine", "tree-birch"],
  "z-shops": ["tree-oak", "tree-pine"],
  "z-cloud": ["tree-cloud", "tree-pine"],
  "z-rune": ["tree-night", "tree-cloud"],
  "z-spring": ["tree-sakura", "tree-birch"],
  "z-frost": ["tree-frost", "tree-night"],
  "z-forge": ["tree-dead", "tree-lava"],
  "z-weed": ["tree-dead"],
};

const footOf = (id) => PROP_DEFS[id]?.foot ?? null;

// ── build ─────────────────────────────────────────────────────────────────────────────────

export function buildOverworldMap() {
  USED_CODES.clear();
  const rng = mulberry32(0x6a616e64);

  const terrain = Array.from({ length: H }, () => Array.from({ length: W }, () => null));
  const kind = Array.from({ length: H }, () => Array.from({ length: W }, () => "ground"));

  const set = (x, y, code, k) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    terrain[y][x] = ch(code);
    if (k) kind[y][x] = k;
  };
  const paint = (span, chooser, k, seed = 1) => {
    for (let y = span[1]; y <= span[3]; y++) for (let x = span[0]; x <= span[2]; x++) set(x, y, chooser(x, y, hash2(x, y, seed)), k);
  };

  // 1. district ground
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const zone = zoneAt(x, y);
      set(x, y, weighted(GROUND[zone], hash2(x, y, 7)), "ground");
    }
  }

  // 2. special ground areas (order matters: later paints win)
  const dragonHill = [2, 32, 13, 43];
  paint(dragonHill, (x, y, r) => (r < 0.55 ? "spring/dragon-gold-grass" : "spring/sakura-ground-a"), "ground", 11);
  const blossom = [12, 28, 23, 38];
  paint(blossom, (x, y, r) => (r < 0.55 ? "spring/sakura-ground-b" : r < 0.8 ? "spring/sakura-ground-c" : "spring/sakura-ground-a"), "ground", 12);
  const snowYard = [56, 20, 67, 28];
  paint(snowYard, (x, y, r) => (r < 0.4 ? "frost/snow-a" : r < 0.7 ? "frost/snow-b" : "frost/snow-c"), "ground", 13);
  const rinkNorth = [56, 16, 66, 19];
  const rinkWest = [56, 20, 57, 26];
  for (const span of [rinkNorth, rinkWest]) paint(span, (x, y, r) => (r < 0.5 ? "frost/ice-a" : r < 0.8 ? "frost/ice-b" : "frost/ice-c"), "ground", 14);
  const factoryYard = [59, 44, 77, 57];
  paint(factoryYard, (x, y, r) => (r < 0.4 ? "weed/concrete-a" : r < 0.6 ? "weed/concrete-b" : r < 0.7 ? "weed/oil-stain" : weighted(GROUND["z-weed"], r)), "ground", 15);
  paint([54, 48, 58, 52], (x, y, r) => (r < 0.5 ? "weed/gravel-a" : "weed/gravel-b"), "ground", 16);

  paint(TRAINING, (x, y) => (Math.floor((x - TRAINING[0]) / 2) % 2 === 0 ? "pitch/turf-train-a" : "pitch/turf-train-b"), "field", 17);
  paint(CONE_COURSE, (x, y) => (Math.floor((x - CONE_COURSE[0]) / 2) % 2 === 0 ? "pitch/turf-train-a" : "pitch/turf-train-b"), "field", 18);
  paint([27, 26, 52, 41], () => "pitch/concourse", "block", 19);

  // plaza
  paint(PLAZA, (x, y, r) => (r < 0.6 ? "core/plaza-a" : "core/plaza-b"), "plaza", 20);
  paint([37, 18, 42, 24], (x, y, r) => (r < 0.5 ? "core/plaza-c" : "core/plaza-a"), "plaza", 21);
  paint([39, 24, 40, 25], () => "core/plaza-d", "plaza", 22);

  // lake: shallow water, sand ring, deep centre, bridge
  paint(LAKE, (x, y, r) => (r < 0.5 ? "water/water-1" : "water/water-2"), "water", 23);
  for (let y = LAKE[1]; y <= LAKE[3]; y++)
    for (let x = LAKE[0]; x <= LAKE[2]; x++)
      if (y === LAKE[1] || y === LAKE[3] || x === LAKE[0] || x === LAKE[2]) set(x, y, hash2(x, y, 24) < 0.5 ? "water/sand-a" : "water/sand-b", "sand");
  paint(LAKE_DEEP, (x, y, r) => (r < 0.5 ? "water/water-deep-1" : "water/water-deep-2"), "water", 25);
  for (let y = LAKE[1] + 1; y < LAKE[3]; y++) for (let x = LAKE[0] + 1; x < LAKE[2]; x++) if (hash2(x, y, 26) < 0.03 && terrain[y][x] === "water/water-1") set(x, y, "water/water-lily", "water");
  paint(BRIDGE, (x) => (x % 2 === 0 ? "water/bridge-plank-a" : "water/bridge-plank-b"), "deck", 27);

  // 3. roads
  for (const road of ROADS) {
    paint(
      road.rect,
      (x, y, r) => {
        if (road.kind === "deck") return (x + y) % 2 === 0 ? "water/bridge-plank-a" : "water/bridge-plank-b";
        const material = ROAD_MATERIAL[zoneAt(x, y)] ?? ROAD_MATERIAL["z-center"];
        return weighted(material[road.kind], r);
      },
      road.kind === "deck" ? "deck" : "road",
      31,
    );
  }

  // Bridge rows through deep water must stay planks even where a road rect touches them.
  paint(BRIDGE, (x) => (x % 2 === 0 ? "water/bridge-plank-a" : "water/bridge-plank-b"), "deck", 27);

  const { legend, byCode } = buildLegend();
  const terrainRows = terrain.map((row) => row.map((code) => byCode.get(code)).join(""));

  // ── objects ────────────────────────────────────────────────────────────────────────────

  const doors = BUILDINGS.filter((b) => b.door);

  /** Solid blocks: the visible sprite minus the door notch (docs/world/03 §11, decided in S2). */
  const collision = [];
  const tileRect = (x, y, w, h) => [x * TILE, y * TILE, w * TILE, h * TILE];
  for (const b of BUILDINGS) {
    const [x0, y0, x1, y1] = b.rect;
    const top = y0 + b.skip;
    if (!b.door) {
      collision.push(tileRect(x0, top, x1 - x0 + 1, y1 - top + 1));
      continue;
    }
    const [dx] = b.door;
    if (y1 - top > 0) collision.push(tileRect(x0, top, x1 - x0 + 1, y1 - top));
    if (dx > x0) collision.push(tileRect(x0, y1, dx - x0, 1));
    if (dx + 2 <= x1) collision.push(tileRect(dx + 2, y1, x1 - (dx + 2) + 1, 1));
  }
  // deep water except under the bridge
  collision.push(tileRect(LAKE_DEEP[0], LAKE_DEEP[1], LAKE_DEEP[2] - LAKE_DEEP[0] + 1, BRIDGE[1] - LAKE_DEEP[1]));
  collision.push(tileRect(LAKE_DEEP[0], BRIDGE[3] + 1, LAKE_DEEP[2] - LAKE_DEEP[0] + 1, LAKE_DEEP[3] - BRIDGE[3]));
  // weed zone: fence line on the north and west edges. The barricade in the gate is the `weed-gate` object (opened by the ending).
  collision.push(tileRect(54, 44, 2, 5)); // west wall, north of the gate
  collision.push(tileRect(54, 52, 2, 7)); // west wall, south of the gate
  collision.push(tileRect(56, 44, 22, 1)); // north wall

  // ── prop placement bookkeeping ─────────────────────────────────────────────────────────
  const hard = Array.from({ length: H }, () => new Uint8Array(W)); // props never go here
  const clear = Array.from({ length: H }, () => new Uint8Array(W)); // walkways: keep solid props out
  const mark = (grid, span, margin = 0) => {
    for (let y = span[1] - margin; y <= span[3] + margin; y++) for (let x = span[0] - margin; x <= span[2] + margin; x++) if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = 1;
  };
  for (const b of BUILDINGS) mark(hard, b.rect, 1);
  for (const road of ROADS) mark(clear, road.rect, 0);
  mark(hard, LAKE, 0);
  mark(hard, TRAINING, 0);
  mark(hard, CONE_COURSE, 0);
  mark(hard, PLAZA, 0);
  mark(hard, [54, 44, 77, 44], 1);
  mark(hard, [54, 44, 55, 58], 1);
  mark(hard, [0, 0, W - 1, 1], 0);
  mark(hard, [0, 58, W - 1, 59], 0);
  mark(hard, [0, 0, 1, H - 1], 0);
  mark(hard, [78, 0, 79, H - 1], 0);
  for (const b of doors) mark(clear, [b.door[0] - 1, b.door[1] + 1, b.door[0] + 2, b.door[1] + 3], 0);
  for (const [, tile, , wander] of NPCS) {
    mark(clear, [tile[0] - 1, tile[1] - 1, tile[0] + 1, tile[1] + 1], 0);
    if (wander) mark(clear, spanOf(wander), 0);
  }
  for (const e of EXAMINE) mark(clear, [e.tile[0] - 1, e.tile[1] - 1, e.tile[0] + 1, e.tile[1] + 1], 0);
  mark(clear, [4, 12, 19, 13], 0);

  const props = [];
  const at = (tx, ty, dy = 28) => [tx * TILE + 16, ty * TILE + dy];

  function footSpan(id, x, y) {
    const foot = footOf(id);
    if (!foot) return [Math.floor(x / TILE), Math.floor((y - 1) / TILE), Math.floor(x / TILE), Math.floor((y - 1) / TILE)];
    let x0 = Infinity;
    let x1 = -Infinity;
    let h = 0;
    for (const f of foot) {
      x0 = Math.min(x0, x + f.dx - f.w / 2);
      x1 = Math.max(x1, x + f.dx + f.w / 2);
      h = Math.max(h, f.h);
    }
    return [Math.floor(x0 / TILE), Math.floor((y - h) / TILE), Math.floor((x1 - 0.01) / TILE), Math.floor((y - 0.01) / TILE)];
  }

  function fits(id, x, y) {
    const span = footSpan(id, x, y);
    const solid = !!footOf(id);
    for (let ty = span[1]; ty <= span[3]; ty++) {
      for (let tx = span[0]; tx <= span[2]; tx++) {
        if (tx < 2 || ty < 2 || tx > 77 || ty > 57) return false;
        if (hard[ty][tx]) return false;
        const k = kind[ty][tx];
        if (k === "road" || k === "deck" || k === "water" || k === "plaza") return false;
        if (solid && clear[ty][tx]) return false;
        if (solid && propGrid[ty][tx]) return false;
      }
    }
    return true;
  }

  const propGrid = Array.from({ length: H }, () => new Uint8Array(W));
  function place(id, x, y, force = false) {
    if (!PROP_DEFS[id]) throw new Error(`unknown prop ${id}`);
    if (!force && !fits(id, x, y)) return false;
    props.push({ prop: id, x: Math.round(x), y: Math.round(y) });
    if (footOf(id)) {
      const span = footSpan(id, x, y);
      mark(propGrid, span, 1);
    }
    return true;
  }

  // set pieces ------------------------------------------------------------------------------
  const decal = (id, tx, ty, dx = 0, dy = 24) => props.push({ prop: id, x: tx * TILE + dx, y: ty * TILE + dy });
  for (const b of doors) decal("mat-door", b.door[0] + 1, b.door[1] + b.door[3], b.matDx ?? 0, 28); // 2×2 door mat, centred below the door's bottom row (`matDx`: px nudge when the art's door is off the tile grid)
  const forced = [
    ["lamp-post", ...at(33, 18)], ["lamp-post", ...at(47, 18)], ["lamp-post", ...at(33, 25)], ["lamp-post", ...at(47, 25)],
    ["bench-h", ...at(34, 23)], ["bench-h", ...at(46, 20)],
    ["planter", ...at(37, 14)], ["planter", ...at(43, 14)],
    ["flagpole", ...at(33, 14)], ["flagpole", ...at(46, 14)],
    ["sakura-arch", 13 * TILE, 28 * TILE + 16],
    ["stone-arch", 19 * TILE, 16 * TILE + 16],
    ["dock-post", ...at(57, 42)], ["dock-post", ...at(63, 42)], ["dock-post", ...at(69, 42)], ["dock-post", ...at(75, 42)],
    ["pier-lantern", ...at(60, 42)], ["pier-lantern", ...at(72, 42)],
    ["boat-small", ...at(66, 42, 30)],
    ["star-lamp", ...at(60, 29)], ["star-lamp", ...at(66, 29)], ["star-lamp", ...at(72, 29)],
    ["telescope", ...at(70, 28, 28)],
    ["floodlight", ...at(57, 47)], ["floodlight", ...at(76, 56)],
    ["king-statue", ...at(59, 55)],
    ["market-stall", ...at(31, 48)],
    ["signpost-arrow", ...at(35, 25)],
    ["warning-sign", ...at(53, 47)],
    ["bike-rack", ...at(44, 52)],
    ["dragon-statue", ...at(3, 36, 28)],
    ["pond-small", ...at(19, 24, 28)],
    // S3 mission props: delivery mailboxes and the training-ground goal (docs/world/03 §7)
    ["mailbox", ...at(14, 38)], ["mailbox", ...at(69, 27, 14)], ["mailbox", ...at(68, 13)],
    ["goal-west", 21 * TILE, 13 * TILE],
    // start and finish flags of the cone course
    ["corner-flag", ...at(5, 54)], ["corner-flag", ...at(5, 58)], ["corner-flag", ...at(17, 54)], ["corner-flag", ...at(17, 58)],
  ];
  for (const [id, x, y] of forced) place(id, x, y, true);
  // barbed fences along the weed zone's west and north edge (the barricade in the gate is a conditional `decor` object)
  for (let ty = 44; ty <= 48; ty++) place("fence-barbed-v", 54 * TILE + 16, ty * TILE + 30, true);
  for (let ty = 52; ty <= 57; ty++) place("fence-barbed-v", 54 * TILE + 16, ty * TILE + 30, true);
  for (let tx = 56; tx <= 77; tx += 2) place("fence-barbed-h", tx * TILE + 32, 44 * TILE + 30, true);
  // training-ground fence, just outside the pitch (the ball bounces off the pitch rect itself): gaps on the south side and the east side
  {
    const px0 = TRAINING[0] * TILE;
    const py0 = TRAINING[1] * TILE;
    const px1 = (TRAINING[2] + 1) * TILE;
    const py1 = (TRAINING[3] + 1) * TILE;
    for (let x = px0 + 24; x < px1; x += 48) {
      place("fence-wood-h", x, py0, true);
      if (x < 780 || x > 880) place("fence-wood-h", x, py1 + 10, true);
    }
    for (let y = py0 + 20; y <= py1; y += 20) {
      if (y < 340 || y > 416) place("fence-wood-v", px0 - 6, y, true); // west side: the goal fills rows 10–12
      if (y < 388 || y > 452) place("fence-wood-v", px1 + 6, y, true); // east side: gap in rows 12–13
    }
  }
  // reeds along the lake shore
  for (let tx = 57; tx <= 75; tx += 3) place("reeds", ...at(tx, 30, 20), true);
  // flower beds beside the plaza
  for (const [tx, ty] of [[32, 19], [32, 24], [48, 19], [48, 24]]) place("bush-flower", ...at(tx, ty), true);
  // cherry-blossom garden: petal piles and a picnic blanket
  for (const [tx, ty] of [[18, 26], [22, 33], [16, 39]]) decal("petal-pile", tx, ty, 16, 28);
  decal("picnic-blanket", 20, 30, 16, 30);

  // border forest ---------------------------------------------------------------------------
  const forest = (x, y) => {
    const zone = zoneAt(Math.min(Math.max(Math.floor(x / TILE), 2), 77), Math.min(Math.max(Math.floor(y / TILE), 2), 57));
    const species = BORDER_TREES[zone] ?? BORDER_TREES["z-center"];
    props.push({ prop: species[Math.floor(rng() * species.length)], x: Math.round(x), y: Math.round(y) });
  };
  for (let x = 8; x < W * TILE; x += 40 + Math.floor(rng() * 12)) forest(x, 54 + Math.floor(rng() * 8));
  for (let x = 8; x < W * TILE; x += 40 + Math.floor(rng() * 12)) forest(x, H * TILE - 10 - Math.floor(rng() * 10));
  for (let y = 80; y < (H - 2) * TILE; y += 44 + Math.floor(rng() * 14)) {
    forest(14 + Math.floor(rng() * 20), y);
    forest(W * TILE - 14 - Math.floor(rng() * 20), y);
  }

  // scatter ---------------------------------------------------------------------------------
  for (const zone of ZONES) {
    const palette = SCATTER[zone.id];
    if (!palette) continue;
    const [x0, y0, x1, y1] = zone.rect;
    const area = (x1 - x0 + 1) * (y1 - y0 + 1);
    const attempts = Math.round((area * palette.density) / 100) * 6;
    for (let n = 0; n < attempts; n++) {
      const tx = x0 + Math.floor(rng() * (x1 - x0 + 1));
      const ty = y0 + Math.floor(rng() * (y1 - y0 + 1));
      if (zoneAt(tx, ty) !== zone.id) continue;
      const id = weighted(palette.pool, rng());
      const x = tx * TILE + 6 + Math.floor(rng() * 20);
      const y = ty * TILE + 12 + Math.floor(rng() * 18);
      place(id, x, y);
    }
  }

  props.sort((a, b) => a.y - b.y || a.x - b.x);

  // ── npcs, triggers, buildings ──────────────────────────────────────────────────────────
  const npcs = NPCS.map(([cast, tile, ai, wander, when]) => ({ cast, tile, ai, ...(wander ? { wander } : {}), ...(when ? { when } : {}) }));
  const triggers = doors.map((b) => ({
    type: "door",
    rect: b.door,
    to: { scene: `interior:${b.interior}`, tile: [10, 10], facing: "up" },
    ...(LOCKED_DOORS[b.id] ?? {}),
  }));
  const buildings = BUILDINGS.map(({ id, rect, door, interior }) => ({ id, rect, ...(door ? { door } : {}), ...(interior ? { interior } : {}) }));

  return {
    id: "overworld",
    size: [W, H],
    tile: TILE,
    walkable: [2, 2, 76, 56],
    spawn: [40, 17],
    legend,
    terrainRows,
    zones: ZONES,
    props,
    buildings,
    collision,
    npcs,
    triggers,
    examine: EXAMINE,
    objects: OBJECTS,
  };
}

/** Where a door on the overworld drops the player when leaving an interior: in front of the right door tile. */
export function exitTileOf(building) {
  return [building.door[0] + 1, building.door[1] + 1];
}

// ── output ────────────────────────────────────────────────────────────────────────────────

function formatMap(map) {
  const line = (value) => JSON.stringify(value);
  const list = (items) => (items.length === 0 ? "[]" : `[\n${items.map((item) => `    ${line(item)}`).join(",\n")}\n  ]`);
  const parts = [
    `  "id": ${line(map.id)}`,
    `  "size": ${line(map.size)}`,
    `  "tile": ${map.tile}`,
    `  "walkable": ${line(map.walkable)}`,
    `  "spawn": ${line(map.spawn)}`,
    `  "legend": ${JSON.stringify(map.legend, null, 2).replace(/\n/g, "\n  ")}`,
    `  "terrainRows": ${list(map.terrainRows)}`,
    `  "zones": ${list(map.zones)}`,
    `  "props": ${list(map.props)}`,
    `  "buildings": ${list(map.buildings)}`,
    `  "collision": ${list(map.collision)}`,
    `  "npcs": ${list(map.npcs)}`,
    `  "triggers": ${list(map.triggers)}`,
    `  "examine": ${list(map.examine)}`,
    `  "objects": ${list(map.objects)}`,
  ];
  return `{\n${parts.join(",\n")}\n}\n`;
}

function ascii(map) {
  const grid = map.terrainRows.map((row) => row.split(""));
  const glyph = { "core/plaza-a": "P" };
  const canvas = grid.map((row, y) => row.map((c, x) => {
    const code = map.legend[c];
    if (code.startsWith("water/water-deep")) return "≈";
    if (code.startsWith("water/water")) return "~";
    if (code.startsWith("water/sand")) return "s";
    if (code.startsWith("water/bridge")) return "=";
    if (code.includes("plaza")) return "P";
    if (code.includes("path") || code.includes("marble") || code.includes("sky-tile") || code.includes("star") || code.includes("asphalt") || code.includes("metal-plate") || code.includes("concrete")) return "#";
    if (code.includes("turf-train")) return "t";
    if (code.includes("ice")) return "i";
    return ".";
  }));
  for (const b of map.buildings) {
    const [x0, y0, x1, y1] = b.rect;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (canvas[y]?.[x] !== undefined) canvas[y][x] = b.id === "fountain" ? "O" : "B";
    if (b.door) for (let i = 0; i < 2; i++) canvas[b.door[1]][b.door[0] + i] = "D";
  }
  for (const n of map.npcs) canvas[n.tile[1]][n.tile[0]] = "N";
  for (const [x, y, w, h] of map.collision) {
    for (let ty = Math.floor(y / TILE); ty < Math.ceil((y + h) / TILE); ty++)
      for (let tx = Math.floor(x / TILE); tx < Math.ceil((x + w) / TILE); tx++) if (canvas[ty]?.[tx] === "." || canvas[ty]?.[tx] === "≈" || canvas[ty]?.[tx] === "~") canvas[ty][tx] = "X";
  }
  return canvas.map((row, y) => `${String(y).padStart(2)} ${row.join("")}`).join("\n");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const map = buildOverworldMap();
  if (args.includes("--ascii")) {
    console.log(ascii(map));
    console.log(`\nprops ${map.props.length}, collision rects ${map.collision.length}, legend ${Object.keys(map.legend).length}`);
  } else if (args.includes("--terrain-only")) {
    const existing = JSON.parse(fs.readFileSync(OUT, "utf8"));
    fs.writeFileSync(OUT, formatMap({ ...existing, legend: map.legend, terrainRows: map.terrainRows }));
    console.log(`updated legend + terrainRows in ${path.relative(process.cwd(), OUT)}`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, formatMap(map));
    console.log(`wrote ${path.relative(process.cwd(), OUT)}: ${map.props.length} props, ${map.collision.length} collision rects, ${map.npcs.length} npcs`);
  }
}
