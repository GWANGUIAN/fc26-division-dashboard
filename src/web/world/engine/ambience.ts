// District atmosphere (docs/world/03 §3): a colour grade over the map and a few drifting particles per zone —
// leaves, cloud shadows, rune dust, petals, snow and fireflies, embers, mower dust. Purely cosmetic and cheap
// (at most a few dozen 1–3px rects per frame). Screen space: particles live in the 640×360 view, not the map.

import type { AmbienceId } from "../audio/worldAudio";
import type { SceneId } from "../types";

export type ParticleKind = "leaves" | "cloud-shadows" | "rune-dust" | "petals" | "snow" | "fireflies" | "embers" | "dust";

/** The JSON `zones[].particles` names → what is spawned (snow-fireflies is both). */
const KINDS_OF: Record<string, readonly ParticleKind[]> = {
  leaves: ["leaves"],
  "cloud-shadows": ["cloud-shadows"],
  "rune-dust": ["rune-dust"],
  petals: ["petals"],
  "snow-fireflies": ["snow", "fireflies"],
  embers: ["embers"],
  dust: ["dust"],
};

/** How many of each kind are alive at once (before the reduced-motion factor). */
const COUNT: Record<ParticleKind, number> = { leaves: 10, "cloud-shadows": 3, "rune-dust": 22, petals: 16, snow: 20, fireflies: 6, embers: 16, dust: 12 };

/** Strength of the colour grade per district (0 = none). The zone's own `tint` is the colour. Frost is the darkest (docs/world/03 §3). */
const GRADE: Record<string, { alpha: number; dark: number }> = {
  "z-center": { alpha: 0.1, dark: 0 },
  "z-cloud": { alpha: 0.14, dark: 0 },
  "z-rune": { alpha: 0.22, dark: 0.06 },
  "z-spring": { alpha: 0.13, dark: 0 },
  "z-frost": { alpha: 0.24, dark: 0.1 },
  "z-forge": { alpha: 0.18, dark: 0.03 },
  "z-shops": { alpha: 0.1, dark: 0 },
  "z-weed": { alpha: 0.24, dark: 0.04 },
};
const DEFAULT_GRADE = { alpha: 0.08, dark: 0 };

/** How fast the grade follows the district the player is in (per second, exponential). */
const GRADE_FOLLOW = 1.6;
export const REDUCED_MOTION_FACTOR = 0.3;

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  /** 0..1 per particle, for sway phase, size and colour picks. */
  seed: number;
}

export interface Grade {
  r: number;
  g: number;
  b: number;
  alpha: number;
  dark: number;
}

export interface ZoneLook {
  id: string;
  tint: string;
  particles?: string;
}

export const NO_GRADE: Grade = { r: 255, g: 255, b: 255, alpha: 0, dark: 0 };

export function parseHex(color: string): { r: number; g: number; b: number } {
  const hex = color.replace("#", "");
  const value = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.padEnd(6, "0");
  return { r: parseInt(value.slice(0, 2), 16) || 0, g: parseInt(value.slice(2, 4), 16) || 0, b: parseInt(value.slice(4, 6), 16) || 0 };
}

/** The grade a district asks for. */
export function gradeOf(zone: ZoneLook | null): Grade {
  if (!zone) return NO_GRADE;
  const { alpha, dark } = GRADE[zone.id] ?? DEFAULT_GRADE;
  return { ...parseHex(zone.tint), alpha, dark };
}

export const particleKindsOf = (name: string | undefined): readonly ParticleKind[] => (name ? KINDS_OF[name] ?? [] : []);

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** One step of the grade towards its target (exponential, frame-rate independent). */
export function followGrade(current: Grade, target: Grade, dt: number): Grade {
  const k = 1 - Math.exp(-dt * GRADE_FOLLOW);
  const close = (a: number, b: number) => (Math.abs(a - b) < 0.05 ? b : lerp(a, b, k));
  return { r: close(current.r, target.r), g: close(current.g, target.g), b: close(current.b, target.b), alpha: close(current.alpha, target.alpha), dark: close(current.dark, target.dark) };
}

/** A fresh particle of a kind, entering at the edge it drifts in from (or anywhere, for the first fill). */
export function spawnParticle(kind: ParticleKind, view: { w: number; h: number }, rand: () => number, anywhere: boolean): Particle {
  const seed = rand();
  const base = { kind, age: 0, seed, x: rand() * view.w, y: rand() * view.h, vx: 0, vy: 0, life: 6 + rand() * 4 };
  switch (kind) {
    case "leaves":
      return { ...base, y: anywhere ? base.y : -4, vx: 14 + rand() * 10, vy: 12 + rand() * 8 };
    case "petals":
      return { ...base, y: anywhere ? base.y : -4, vx: 10 + rand() * 12, vy: 14 + rand() * 10 };
    case "snow":
      return { ...base, y: anywhere ? base.y : -4, vx: 4 + rand() * 6, vy: 16 + rand() * 12 };
    case "embers":
      return { ...base, y: anywhere ? base.y : view.h + 4, vx: -3 + rand() * 6, vy: -(22 + rand() * 20), life: 3 + rand() * 3 };
    case "rune-dust":
      return { ...base, y: anywhere ? base.y : view.h + 4, vx: -2 + rand() * 4, vy: -(6 + rand() * 8), life: 7 + rand() * 4 };
    case "fireflies":
      return { ...base, vx: -4 + rand() * 8, vy: -4 + rand() * 8, life: 5 + rand() * 4 };
    case "dust":
      return { ...base, x: anywhere ? base.x : -4, vx: 18 + rand() * 14, vy: -2 + rand() * 4 };
    case "cloud-shadows":
      return { ...base, x: anywhere ? base.x : -140, y: rand() * view.h, vx: 9 + rand() * 6, vy: 0, life: 40 };
  }
}

/** Moves a particle; returns false once it is done (left the view or lived out its time). */
export function stepParticle(p: Particle, dt: number, view: { w: number; h: number }): boolean {
  p.age += dt;
  const sway = Math.sin(p.age * 2 + p.seed * 6.28);
  p.x += (p.vx + (p.kind === "leaves" || p.kind === "petals" ? sway * 6 : p.kind === "fireflies" ? sway * 5 : 0)) * dt;
  p.y += p.vy * dt;
  if (p.kind === "fireflies") {
    p.vx += (Math.cos(p.age * 1.3 + p.seed * 9) * 8 - p.vx * 0.5) * dt;
    p.vy += (Math.sin(p.age * 1.1 + p.seed * 7) * 8 - p.vy * 0.5) * dt;
  }
  if (p.age >= p.life) return false;
  const margin = p.kind === "cloud-shadows" ? 160 : 8;
  return p.x > -margin && p.x < view.w + margin && p.y > -margin && p.y < view.h + margin;
}

export interface AmbienceOptions {
  view: { w: number; h: number };
  rand?: () => number;
  /** prefers-reduced-motion: far fewer particles, slower. */
  reduced?: boolean;
}

export class Ambience {
  particles: Particle[] = [];
  grade: Grade = NO_GRADE;
  private kinds: readonly ParticleKind[] = [];
  private target: Grade = NO_GRADE;
  private readonly view: { w: number; h: number };
  private readonly rand: () => number;
  private readonly factor: number;
  private started = false;

  constructor(options: AmbienceOptions) {
    this.view = options.view;
    this.rand = options.rand ?? Math.random;
    this.factor = options.reduced ? REDUCED_MOTION_FACTOR : 1;
  }

  /** The district the player stands in (null = an interior: no grade, no particles). */
  setZone(zone: ZoneLook | null) {
    this.target = gradeOf(zone);
    this.kinds = zone ? particleKindsOf(zone.particles) : [];
    if (!zone) {
      this.grade = NO_GRADE;
      this.particles = [];
      this.started = false;
      return;
    }
    if (!this.started) {
      this.grade = { ...this.target };
      this.started = true;
    }
  }

  private want(kind: ParticleKind) {
    return Math.max(1, Math.round(COUNT[kind] * this.factor));
  }

  update(dt: number) {
    this.grade = followGrade(this.grade, this.target, dt);
    const speed = this.factor < 1 ? 0.6 : 1;
    this.particles = this.particles.filter((p) => stepParticle(p, dt * speed, this.view));
    for (const kind of this.kinds) {
      const alive = this.particles.filter((p) => p.kind === kind).length;
      const missing = this.want(kind) - alive;
      // The first frames of a district fill the whole view; afterwards new ones drift in from the edge.
      const fill = alive === 0;
      for (let i = 0; i < Math.min(missing, fill ? missing : 1); i++) this.particles.push(spawnParticle(kind, this.view, this.rand, fill));
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { w, h } = this.view;
    const g = this.grade;
    if (g.alpha > 0.004) {
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = g.alpha * 2.4;
      ctx.fillStyle = `rgb(${Math.round(g.r)}, ${Math.round(g.g)}, ${Math.round(g.b)})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    if (g.dark > 0.004) {
      ctx.fillStyle = `rgba(6, 12, 40, ${g.dark.toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    for (const p of this.particles) drawParticle(ctx, p);
  }
}

const fade = (p: Particle) => Math.min(1, p.age / 0.8, (p.life - p.age) / 0.8);

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const a = Math.max(0, fade(p));
  switch (p.kind) {
    case "leaves":
      ctx.fillStyle = `rgba(${p.seed < 0.5 ? "150, 200, 90" : "224, 190, 84"}, ${(0.85 * a).toFixed(2)})`;
      ctx.fillRect(x, y, 3, 2);
      return;
    case "petals":
      ctx.fillStyle = `rgba(255, ${p.seed < 0.5 ? "196" : "170"}, 214, ${(0.9 * a).toFixed(2)})`;
      ctx.fillRect(x, y, 2, 2);
      return;
    case "snow":
      ctx.fillStyle = `rgba(240, 248, 255, ${(0.85 * a).toFixed(2)})`;
      ctx.fillRect(x, y, p.seed < 0.3 ? 2 : 1, p.seed < 0.3 ? 2 : 1);
      return;
    case "fireflies": {
      const pulse = 0.35 + 0.65 * Math.abs(Math.sin(p.age * 2.4 + p.seed * 6));
      ctx.fillStyle = `rgba(214, 255, 130, ${(pulse * a).toFixed(2)})`;
      ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = `rgba(214, 255, 130, ${(pulse * a * 0.25).toFixed(2)})`;
      ctx.fillRect(x - 1, y - 1, 4, 4);
      return;
    }
    case "embers": {
      const flicker = 0.55 + 0.45 * Math.abs(Math.sin(p.age * 9 + p.seed * 12));
      ctx.fillStyle = `rgba(255, ${p.seed < 0.5 ? "150" : "200"}, 70, ${(flicker * a).toFixed(2)})`;
      ctx.fillRect(x, y, p.seed < 0.25 ? 2 : 1, p.seed < 0.25 ? 2 : 1);
      return;
    }
    case "rune-dust": {
      const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(p.age * 3 + p.seed * 8));
      ctx.fillStyle = `rgba(206, 160, 255, ${(twinkle * a).toFixed(2)})`;
      ctx.fillRect(x, y, 1, 1);
      if (p.seed > 0.7) ctx.fillRect(x - 1, y, 3, 1);
      return;
    }
    case "dust":
      ctx.fillStyle = `rgba(150, 140, 120, ${(0.5 * a).toFixed(2)})`;
      ctx.fillRect(x, y, 2, 1);
      return;
    case "cloud-shadows":
      ctx.fillStyle = "rgba(30, 60, 110, 0.07)";
      ctx.beginPath();
      ctx.ellipse(x, y, 90 + p.seed * 50, 30 + p.seed * 14, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
  }
}

// ── the golden grass blooming (stadium, S4) ────────────────────────────────────────────────

/** Length of the bloom cut once it is triggered. */
export const BLOOM_SECONDS = 4.5;
/** The glow the golden grass keeps after the showdown (0..1). */
export const BLOOM_RESTING_GLOW = 0.55;

/**
 * The bloom timeline: the gold glow swells for three seconds, a bright flash peaks near the end of the swell and fades,
 * and the glow settles to its resting value. `t` is seconds since the cut began; a negative `t` means "no cut, just the resting look".
 */
export function bloomEnvelope(t: number): { glow: number; flash: number } {
  if (t < 0 || t >= BLOOM_SECONDS) return { glow: BLOOM_RESTING_GLOW, flash: 0 };
  const swell = Math.min(1, t / 3);
  const flash = t < 2.4 ? 0 : t < 3.1 ? (t - 2.4) / 0.7 : Math.max(0, 1 - (t - 3.1) / 1.4);
  if (t < 3) return { glow: swell * swell * (3 - 2 * swell), flash }; // smoothstep up to full glow
  return { glow: lerp(1, BLOOM_RESTING_GLOW, (t - 3) / (BLOOM_SECONDS - 3)), flash };
}

const hash01 = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const BLOOM_SPARKLES = 28;

/** Where sparkle `i` is, relative to the centre, `time` seconds into the show (it drifts up and outward, then loops). */
export function sparklePosition(i: number, time: number): { dx: number; dy: number; twinkle: number } {
  const angle = hash01(i + 1) * Math.PI * 2;
  const reach = 14 + hash01(i + 40) * 64;
  const phase = (time * (0.16 + hash01(i + 80) * 0.14) + hash01(i + 120)) % 1;
  return { dx: Math.cos(angle) * reach * (0.4 + phase), dy: Math.sin(angle) * reach * 0.5 * (0.4 + phase) - phase * 26, twinkle: Math.abs(Math.sin(time * 4 + i * 1.7)) };
}

/** Draws the golden glow and sparkles around the golden grass at a screen position, plus the flash over the whole view. */
export function drawBloom(ctx: CanvasRenderingContext2D, view: { w: number; h: number }, centre: { x: number; y: number }, time: number, cut: number) {
  const { glow, flash } = bloomEnvelope(cut);
  if (glow > 0.003) {
    const pulse = 1 + Math.sin(time * 2) * 0.05;
    const radius = (26 + 90 * glow) * pulse;
    const gradient = ctx.createRadialGradient(centre.x, centre.y, 2, centre.x, centre.y, radius);
    gradient.addColorStop(0, `rgba(255, 236, 130, ${(0.55 * glow).toFixed(3)})`);
    gradient.addColorStop(0.5, `rgba(255, 214, 90, ${(0.22 * glow).toFixed(3)})`);
    gradient.addColorStop(1, "rgba(255, 214, 90, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = gradient;
    ctx.fillRect(centre.x - radius, centre.y - radius, radius * 2, radius * 2);
    ctx.restore();
    const count = Math.round(BLOOM_SPARKLES * Math.min(1, glow * 1.2));
    for (let i = 0; i < count; i++) {
      const s = sparklePosition(i, time);
      ctx.fillStyle = `rgba(${i % 3 === 0 ? "255, 255, 255" : "255, 232, 120"}, ${(0.35 + 0.6 * s.twinkle).toFixed(2)})`;
      const size = i % 5 === 0 ? 2 : 1;
      ctx.fillRect(Math.round(centre.x + s.dx), Math.round(centre.y + s.dy), size, size);
    }
  }
  if (flash > 0.004) {
    ctx.fillStyle = `rgba(255, 246, 200, ${(flash * 0.55).toFixed(3)})`;
    ctx.fillRect(0, 0, view.w, view.h);
  }
}

// ── which loop plays where ─────────────────────────────────────────────────────────────────

const ZONE_AMBIENCE: Record<string, AmbienceId> = {
  "z-center": "field-day",
  "z-shops": "field-day",
  "z-cloud": "sky-wind",
  "z-rune": "sky-wind",
  "z-spring": "spring",
  "z-frost": "frost-night",
  "z-forge": "forge",
  "z-weed": "weed",
};

/** The ambience loop of a place: a district outdoors, the crowd in the stadium, the arcade hall; other rooms are quiet. */
export function ambienceIdFor(scene: SceneId, zoneId: string | null): AmbienceId | null {
  if (scene === "interior:stadium") return "crowd";
  if (scene === "interior:arcade") return "arcade";
  if (scene !== "overworld") return null;
  return zoneId ? ZONE_AMBIENCE[zoneId] ?? null : null;
}
