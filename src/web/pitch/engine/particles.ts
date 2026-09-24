// Fixed-capacity particle pool (docs/pitch/01 §7: no allocation inside the frame loop). Used for run / sprint dust
// now, later for grass, sparkles and confetti. Slots are recycled in place; when the pool is full the oldest
// particle is overwritten.

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

export interface ParticlePool {
  readonly items: readonly Particle[];
  readonly activeCount: number;
  emit(x: number, y: number, vx: number, vy: number, life: number, size?: number): void;
  update(dt: number, drag?: number): void;
  clear(): void;
}

export function createParticlePool(capacity: number): ParticlePool {
  const items: Particle[] = Array.from({ length: capacity }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 1 }));
  let cursor = 0;
  let activeCount = 0;

  return {
    items,
    get activeCount() {
      return activeCount;
    },
    emit(x, y, vx, vy, life, size = 1) {
      const slot = items[cursor]!;
      cursor = (cursor + 1) % capacity;
      if (!slot.active) activeCount++;
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.vx = vx;
      slot.vy = vy;
      slot.age = 0;
      slot.life = life;
      slot.size = size;
    },
    update(dt, drag = 0) {
      const damp = drag > 0 ? Math.exp(-drag * dt) : 1;
      for (const particle of items) {
        if (!particle.active) continue;
        particle.age += dt;
        if (particle.age >= particle.life) {
          particle.active = false;
          activeCount--;
          continue;
        }
        particle.vx *= damp;
        particle.vy *= damp;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      }
    },
    clear() {
      for (const particle of items) particle.active = false;
      activeCount = 0;
      cursor = 0;
    },
  };
}

/** 0 at birth → 1 at death. */
export function particleProgress(particle: Particle) {
  return particle.life > 0 ? Math.min(1, particle.age / particle.life) : 1;
}
