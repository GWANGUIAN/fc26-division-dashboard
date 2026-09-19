import { describe, expect, it } from "vitest";
import { SpatialHash, footBox } from "./collision";
import { NPC_BOX, createNpc, endTalk, facingToward, npcBox, startTalk, stepNpc } from "./npc";
import type { NpcSpawn } from "./scene";

const spawn = (over: Partial<NpcSpawn> = {}): NpcSpawn => ({ key: "kid#0", cast: "kid", x: 160, y: 160, ai: "stay", ...over });
/** Deterministic "random" stream. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
const open = new SpatialHash(64);

describe("facingToward", () => {
  it("points along the dominant axis, horizontal on ties", () => {
    expect(facingToward({ x: 0, y: 0 }, { x: 10, y: 2 })).toBe("right");
    expect(facingToward({ x: 0, y: 0 }, { x: -10, y: 2 })).toBe("left");
    expect(facingToward({ x: 0, y: 0 }, { x: 2, y: -10 })).toBe("up");
    expect(facingToward({ x: 0, y: 0 }, { x: 2, y: 10 })).toBe("down");
    expect(facingToward({ x: 0, y: 0 }, { x: 5, y: 5 })).toBe("right");
  });
});

describe("stay", () => {
  it("never moves or turns", () => {
    const npc = createNpc(spawn(), false, seq(0.5));
    for (let i = 0; i < 600; i++) stepNpc(npc, 1 / 60, open, seq(0.1));
    expect(npc).toMatchObject({ x: 160, y: 160, facing: "down", moving: false });
  });
});

describe("idle", () => {
  it("turns to a different direction now and then without moving", () => {
    const npc = createNpc(spawn({ ai: "idle" }), false, seq(0));
    const seen = new Set<string>([npc.facing]);
    const rand = seq(0.1, 0.5, 0.9, 0.3);
    for (let i = 0; i < 60 * 30; i++) {
      stepNpc(npc, 1 / 60, open, rand);
      seen.add(npc.facing);
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(npc).toMatchObject({ x: 160, y: 160, moving: false });
  });
});

describe("wander", () => {
  const wanderSpawn = spawn({ ai: "wander", wander: { x: 100, y: 100, w: 200, h: 120 } });

  it("stays inside its rect and actually walks", () => {
    const npc = createNpc(wanderSpawn, false, seq(0));
    let moved = false;
    const rand = seq(0.9, 0.2, 0.7, 0.4, 0.1, 0.8);
    for (let i = 0; i < 60 * 60; i++) {
      stepNpc(npc, 1 / 60, open, rand);
      if (npc.moving) moved = true;
      const box = npcBox(npc);
      expect(box.x).toBeGreaterThanOrEqual(100 - 1e-6);
      expect(box.x + box.w).toBeLessThanOrEqual(300 + 1e-6);
      expect(box.y).toBeGreaterThanOrEqual(100 - 1e-6);
      expect(box.y + box.h).toBeLessThanOrEqual(220 + 1e-6);
    }
    expect(moved).toBe(true);
  });

  it("gives up a target that is walled off instead of pushing forever", () => {
    const hash = new SpatialHash(64);
    hash.insert({ x: 170, y: 100, w: 20, h: 120 }); // a wall across the area
    const npc = createNpc({ ...wanderSpawn, x: 120, y: 160 }, false, seq(0));
    npc.target = { x: 280, y: 160 };
    for (let i = 0; i < 120; i++) stepNpc(npc, 1 / 60, hash, seq(0.5));
    expect(npc.target).toBeNull();
  });

  it("never walks into another obstacle (the player or a neighbour)", () => {
    const npc = createNpc(wanderSpawn, false, seq(0));
    const blocker = footBox(200, 160);
    const hash = new SpatialHash(64);
    hash.insert(blocker);
    npc.target = { x: 260, y: 160 };
    for (let i = 0; i < 240; i++) {
      stepNpc(npc, 1 / 60, hash, seq(0.5));
      const box = footBox(npc.x, npc.y, NPC_BOX.w, NPC_BOX.h);
      expect(box.x + box.w).toBeLessThanOrEqual(blocker.x + 1e-6);
    }
  });
});

describe("talking", () => {
  it("faces the player and freezes, then turns back afterwards", () => {
    const npc = createNpc(spawn({ ai: "idle" }), false, seq(0));
    npc.facing = "up";
    startTalk(npc, { x: 300, y: 160 });
    expect(npc.facing).toBe("right");
    expect(npc.talking).toBe(true);
    for (let i = 0; i < 600; i++) stepNpc(npc, 1 / 60, open, seq(0.9));
    expect(npc.facing).toBe("right");
    endTalk(npc);
    expect(npc.talking).toBe(false);
    expect(npc.facing).toBe("up");
  });

  it("lets a wanderer keep the facing it had while talking", () => {
    const npc = createNpc(spawn({ ai: "wander", wander: { x: 0, y: 0, w: 300, h: 300 } }), false, seq(0));
    startTalk(npc, { x: 0, y: 160 });
    endTalk(npc);
    expect(npc.talking).toBe(false);
    expect(npc.facing).toBe("left");
  });
});
