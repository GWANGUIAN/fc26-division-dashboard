// Fixed-step game loop (docs/world/01 §2): update at 60 Hz, render once per animation frame.

export interface Accumulator {
  /** Seconds of simulation time not yet consumed by update steps. */
  carry: number;
}

/**
 * Adds a frame's elapsed time and returns how many fixed steps to run. `maxFrame` caps the elapsed
 * time so a long stall (tab switch, breakpoint) cannot trigger a spiral of catch-up updates.
 */
export function advance(acc: Accumulator, frameSeconds: number, step: number, maxFrame: number): number {
  acc.carry += Math.min(Math.max(frameSeconds, 0), maxFrame);
  let steps = 0;
  while (acc.carry >= step) {
    acc.carry -= step;
    steps++;
  }
  return steps;
}

export interface Loop {
  start(): void;
  stop(): void;
  readonly running: boolean;
}

export function createLoop({
  update,
  render,
  step = 1 / 60,
  maxFrame = 0.25,
}: {
  update: (dt: number) => void;
  render: (alpha: number, frameSeconds: number) => void;
  step?: number;
  maxFrame?: number;
}): Loop {
  const acc: Accumulator = { carry: 0 };
  let frame = 0;
  let last = 0;
  let running = false;

  const tick = (now: number) => {
    if (!running) return;
    frame = requestAnimationFrame(tick);
    const seconds = (now - last) / 1000;
    last = now;
    const steps = advance(acc, seconds, step, maxFrame);
    for (let i = 0; i < steps; i++) update(step);
    render(acc.carry / step, seconds);
  };

  return {
    start() {
      if (running) return;
      running = true;
      acc.carry = 0;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
    get running() {
      return running;
    },
  };
}
