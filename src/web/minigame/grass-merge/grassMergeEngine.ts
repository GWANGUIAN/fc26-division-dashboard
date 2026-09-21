/** Measured from grass-merge-board.webp's alpha opening (480×720 source). */
export const BOARD_INTERIOR = { x: 60, y: 40, width: 360, height: 605 } as const;
export const BOARD_FRAME_WIDTH = 480;
export const BOARD_FRAME_HEIGHT = 720;
export const BOARD_WIDTH = BOARD_INTERIOR.width;
export const BOARD_HEIGHT = BOARD_INTERIOR.height;
export const DROP_Y = 50;
export const DANGER_Y = 90;
export const FIXED_STEP = 1 / 60;

export const TIERS = [
  { tier: 1, name: "씨앗", radius: 17, color: "#9b633e" },
  { tier: 2, name: "새싹", radius: 25, color: "#a9df58" },
  { tier: 3, name: "클로버", radius: 33, color: "#238a47" },
  { tier: 4, name: "잔디 뭉치", radius: 42, color: "#39aa52" },
  { tier: 5, name: "낡은 축구공", radius: 51, color: "#b8b3a7" },
  { tier: 6, name: "새 축구공", radius: 63, color: "#9ff6df" },
  { tier: 7, name: "은메달", radius: 76, color: "#cbd6dc" },
  { tier: 8, name: "금메달", radius: 92, color: "#ffd44f" },
  { tier: 9, name: "트로피", radius: 109, color: "#d9a92f" },
  { tier: 10, name: "잔디동 엠블럼", radius: 128, color: "#48e0b0" },
  { tier: 11, name: "황금 왕관 잔디구", radius: 149, color: "#f5b92b" },
] as const;

const GRAVITY = 1400;
const SUBSTEPS = 4;
const RESTITUTION = 0.15;
const WALL_FRICTION = 0.4;
const VELOCITY_DAMPING = 0.995;
const SLEEP_SPEED = 8;
const SLEEP_STEPS = 30;
const DROP_COOLDOWN = 0.45;
const DANGER_GRACE = 0.5;
const DANGER_DURATION = 1.5;

export type GrassMergePhase = "playing" | "over";

export interface GrassMergeBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  sleepSteps: number;
  sleeping: boolean;
  graceLeft: number;
  dangerTime: number;
}

export interface GrassMergeState {
  seed: number;
  bodies: GrassMergeBody[];
  score: number;
  phase: GrassMergePhase;
  aimX: number;
  nextTier: number;
  cooldown: number;
  nextId: number;
}

function radius(tier: number) {
  return TIERS[tier - 1].radius;
}

function seededRandom(seed: number) {
  let next = seed >>> 0;
  next ^= next << 13;
  next ^= next >>> 17;
  next ^= next << 5;
  return { seed: next >>> 0, value: (next >>> 0) / 0x1_0000_0000 };
}

function rollTier(seed: number) {
  const random = seededRandom(seed);
  const value = random.value;
  const tier = value < .35 ? 1 : value < .65 ? 2 : value < .85 ? 3 : value < .95 ? 4 : 5;
  return { seed: random.seed, tier };
}

function scoreForMerge(tier: number) {
  return (tier * (tier + 1)) / 2;
}

function cloneBody(body: GrassMergeBody): GrassMergeBody {
  return { ...body };
}

export function createGame(seed = 1): GrassMergeState {
  const rolled = rollTier(seed >>> 0);
  return {
    seed: rolled.seed,
    bodies: [],
    score: 0,
    phase: "playing",
    aimX: BOARD_WIDTH / 2,
    nextTier: rolled.tier,
    cooldown: 0,
    nextId: 1,
  };
}

export function setAim(state: GrassMergeState, x: number): GrassMergeState {
  const r = radius(state.nextTier);
  return { ...state, aimX: Math.max(r, Math.min(BOARD_WIDTH - r, x)) };
}

export function drop(state: GrassMergeState): GrassMergeState {
  if (state.phase !== "playing" || state.cooldown > 0) return state;
  const r = radius(state.nextTier);
  const rolled = rollTier(state.seed);
  const body: GrassMergeBody = {
    id: state.nextId,
    tier: state.nextTier,
    x: Math.max(r, Math.min(BOARD_WIDTH - r, state.aimX)),
    y: DROP_Y,
    vx: 0,
    vy: 0,
    sleepSteps: 0,
    sleeping: false,
    graceLeft: DANGER_GRACE,
    dangerTime: 0,
  };
  return {
    ...state,
    seed: rolled.seed,
    bodies: [...state.bodies, body],
    nextTier: rolled.tier,
    cooldown: DROP_COOLDOWN,
    nextId: state.nextId + 1,
  };
}

function solveWall(body: GrassMergeBody) {
  const r = radius(body.tier);
  if (body.x - r < 0) {
    body.x = r;
    if (body.vx < 0) body.vx = -body.vx * RESTITUTION;
  } else if (body.x + r > BOARD_WIDTH) {
    body.x = BOARD_WIDTH - r;
    if (body.vx > 0) body.vx = -body.vx * RESTITUTION;
  }
  if (body.y + r > BOARD_HEIGHT) {
    body.y = BOARD_HEIGHT - r;
    if (body.vy > 0) body.vy = -body.vy * RESTITUTION;
    body.vx *= WALL_FRICTION;
    if (Math.abs(body.vy) < SLEEP_SPEED) body.vy = 0;
  }
}

function solveCircle(a: GrassMergeBody, b: GrassMergeBody) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const minDistance = radius(a.tier) + radius(b.tier);
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= minDistance * minDistance) return false;
  const distance = Math.sqrt(distanceSquared) || 0.0001;
  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;
  const correction = overlap * .5;
  a.x -= nx * correction;
  a.y -= ny * correction;
  b.x += nx * correction;
  b.y += ny * correction;
  const relativeNormalSpeed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (relativeNormalSpeed < 0) {
    const impulse = (-(1 + RESTITUTION) * relativeNormalSpeed) / 2;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
  }
  if ((a.sleeping || b.sleeping) && relativeNormalSpeed < -SLEEP_SPEED) {
    a.sleeping = false;
    b.sleeping = false;
    a.sleepSteps = 0;
    b.sleepSteps = 0;
  }
  return true;
}

function mergeContacts(bodies: GrassMergeBody[], score: number, nextId: number) {
  const consumed = new Set<number>();
  const created: GrassMergeBody[] = [];
  let nextScore = score;
  let id = nextId;
  for (let left = 0; left < bodies.length; left += 1) {
    const a = bodies[left];
    if (consumed.has(a.id)) continue;
    for (let right = left + 1; right < bodies.length; right += 1) {
      const b = bodies[right];
      if (consumed.has(b.id) || a.tier !== b.tier) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const contact = radius(a.tier) + radius(b.tier);
      if (dx * dx + dy * dy > contact * contact) continue;
      consumed.add(a.id);
      consumed.add(b.id);
      if (a.tier === TIERS.length) {
        nextScore += 100;
      } else {
        const tier = a.tier + 1;
        nextScore += scoreForMerge(tier);
        created.push({
          id: id++, tier, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2,
          vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2,
          sleepSteps: 0, sleeping: false, graceLeft: 0, dangerTime: 0,
        });
      }
      break;
    }
  }
  return { bodies: [...bodies.filter((body) => !consumed.has(body.id)), ...created], score: nextScore, nextId: id };
}

export function step(state: GrassMergeState, dt = FIXED_STEP): GrassMergeState {
  if (state.phase === "over" || dt <= 0) return state;
  const bodies = state.bodies.map(cloneBody);
  const substep = dt / SUBSTEPS;
  const damping = Math.pow(VELOCITY_DAMPING, substep / FIXED_STEP);
  for (let sub = 0; sub < SUBSTEPS; sub += 1) {
    for (const body of bodies) {
      if (body.sleeping) continue;
      body.vy += GRAVITY * substep;
      body.x += body.vx * substep;
      body.y += body.vy * substep;
      body.vx *= damping;
      body.vy *= damping;
      solveWall(body);
    }
    for (let pass = 0; pass < 2; pass += 1) {
      for (let left = 0; left < bodies.length; left += 1) {
        for (let right = left + 1; right < bodies.length; right += 1) solveCircle(bodies[left], bodies[right]);
      }
      bodies.forEach(solveWall);
    }
  }
  for (const body of bodies) {
    const speed = Math.hypot(body.vx, body.vy);
    if (speed <= SLEEP_SPEED && body.y + radius(body.tier) >= BOARD_HEIGHT - .05) {
      body.sleepSteps += 1;
      if (body.sleepSteps >= SLEEP_STEPS) {
        body.sleeping = true;
        body.vx = 0;
        body.vy = 0;
      }
    } else {
      body.sleepSteps = 0;
    }
  }
  const merged = mergeContacts(bodies, state.score, state.nextId);
  let over = false;
  for (const body of merged.bodies) {
    body.graceLeft = Math.max(0, body.graceLeft - dt);
    if (body.graceLeft > 0) {
      body.dangerTime = 0;
    } else if (body.y - radius(body.tier) < DANGER_Y) {
      body.dangerTime += dt;
      if (body.dangerTime > DANGER_DURATION) over = true;
    } else {
      body.dangerTime = 0;
    }
  }
  return {
    ...state,
    bodies: merged.bodies,
    score: merged.score,
    nextId: merged.nextId,
    cooldown: Math.max(0, state.cooldown - dt),
    phase: over ? "over" : "playing",
  };
}
