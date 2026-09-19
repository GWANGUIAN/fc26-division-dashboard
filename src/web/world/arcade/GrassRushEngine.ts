/** Fixed-step, seeded runner. No DOM, clock, storage or random globals. */
export type RushInput = "jump" | "slide";
export interface RushObject { x: number; kind: "cone" | "mower" | "banner-low" | "tackler-stand" | "seed" }
export interface RushState {
  distance: number; seeds: number; height: number; velocity: number; slide: number;
  spawn: number; seed: number; objects: RushObject[]; over: boolean;
}
export const RUSH_DT = 1 / 60;
export const createRush = (seed = 26): RushState => ({ distance: 0, seeds: 0, height: 0, velocity: 0, slide: 0, spawn: 1.5, seed, objects: [], over: false });
export const rushScore = (state: RushState) => Math.floor(state.distance) + state.seeds * 10;
export function stepRush(state: RushState, input?: RushInput): RushState {
  if (state.over) return state;
  const next = { ...state, objects: state.objects.map(o => ({ ...o })) };
  if (input === "jump" && next.height === 0 && next.slide <= 0) next.velocity = 470;
  if (input === "slide" && next.height === 0) next.slide = 0.7;
  next.slide = Math.max(0, next.slide - RUSH_DT);
  next.height = Math.max(0, next.height + next.velocity * RUSH_DT);
  next.velocity = next.height > 0 ? next.velocity - 1100 * RUSH_DT : 0;
  const speed = Math.min(390, 210 + next.distance / 15);
  next.distance += speed * RUSH_DT / 8;
  next.spawn -= RUSH_DT;
  if (next.spawn <= 0) {
    next.seed = (Math.imul(next.seed, 1664525) + 1013904223) >>> 0;
    const kinds: RushObject["kind"][] = ["cone", "mower", "banner-low", "tackler-stand", "seed"];
    next.objects.push({ x: 670, kind: kinds[next.seed % kinds.length] });
    next.spawn = 1.5 + (next.seed % 60) / 100;
  }
  for (const object of next.objects) {
    object.x -= speed * RUSH_DT;
    if (object.x < 124 && object.x > 72) {
      if (object.kind === "seed") { next.seeds++; object.x = -100; }
      else if (object.kind === "banner-low" ? next.slide <= 0 : next.height < 54) next.over = true;
    }
  }
  next.objects = next.objects.filter(o => o.x > -60);
  return next;
}
