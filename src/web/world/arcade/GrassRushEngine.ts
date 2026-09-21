/** Fixed-step, seeded runner. No DOM, clock, storage or random globals. */
export type RushInput = "jump" | "slide";
export interface RushObject { x: number; kind: "cone" | "mower" | "banner-low" | "tackler-stand" | "seed" }
export interface RushState {
  distance: number; seeds: number; height: number; velocity: number; slide: number;
  spawn: number; seed: number; objects: RushObject[]; over: boolean;
}
export const RUSH_DT = 1 / 60;
/** How long a slide lasts, in seconds (the modal turns the runner onto its back for that long). */
export const RUSH_SLIDE_SECONDS = 0.7;
/** Scroll speed (px/s) at the start and its ceiling: the run keeps speeding up with distance, about 1.5x after 25 s and the cap after a minute. */
export const RUSH_SPEED_START = 210;
export const RUSH_SPEED_MAX = 600;
/**
 * The shortest time (s) between two spawns at top speed. A jump keeps the runner in the air for ~0.86 s, so anything under
 * that would be an unavoidable pair; 1 s leaves the tightest gap possible but fair.
 */
export const RUSH_MIN_GAP_SECONDS = 1;
export const rushSpeed = (distance: number) => Math.min(RUSH_SPEED_MAX, RUSH_SPEED_START + distance / 8);
export const createRush = (seed = 26): RushState => ({ distance: 0, seeds: 0, height: 0, velocity: 0, slide: 0, spawn: 1.5, seed, objects: [], over: false });
export const rushScore = (state: RushState) => Math.floor(state.distance) + state.seeds * 10;
export function stepRush(state: RushState, input?: RushInput): RushState {
  if (state.over) return state;
  const next = { ...state, objects: state.objects.map(o => ({ ...o })) };
  if (input === "jump" && next.height === 0 && next.slide <= 0) next.velocity = 470;
  if (input === "slide" && next.height === 0) next.slide = RUSH_SLIDE_SECONDS;
  next.slide = Math.max(0, next.slide - RUSH_DT);
  next.height = Math.max(0, next.height + next.velocity * RUSH_DT);
  next.velocity = next.height > 0 ? next.velocity - 1100 * RUSH_DT : 0;
  const speed = rushSpeed(next.distance);
  next.distance += speed * RUSH_DT / 8;
  next.spawn -= RUSH_DT;
  if (next.spawn <= 0) {
    next.seed = (Math.imul(next.seed, 1664525) + 1013904223) >>> 0;
    const kinds: RushObject["kind"][] = ["cone", "mower", "banner-low", "tackler-stand", "seed"];
    next.objects.push({ x: 670, kind: kinds[next.seed % kinds.length] });
    // A fixed pixel gap (as long as the old 1.5–2.1 s at the start) that shrinks in time as the run speeds up, down to the fair minimum.
    next.spawn = Math.max(RUSH_MIN_GAP_SECONDS + (next.seed % 60) / 150, (330 + (next.seed % 60) * 2.2) / speed);
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
