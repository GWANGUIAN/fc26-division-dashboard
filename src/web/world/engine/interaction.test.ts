import { describe, expect, it } from "vitest";
import { INTERACT_REACH, findInteractTarget, interactionProbe, npcHitArea } from "./interaction";
import { createNpc } from "./npc";
import type { ExaminePoint, NpcSpawn } from "./scene";

const npcAt = (x: number, y: number, key = "elder#0") => createNpc({ key, cast: "elder", x, y, ai: "stay" } as NpcSpawn, false, () => 0);

describe("interactionProbe", () => {
  it("reaches 28px in front of the foot box in the facing direction", () => {
    const feet = { x: 100, y: 200 };
    expect(interactionProbe(feet, "down")).toMatchObject({ y: 200, h: INTERACT_REACH });
    expect(interactionProbe(feet, "up")).toMatchObject({ y: 200 - 10 - INTERACT_REACH, h: INTERACT_REACH });
    expect(interactionProbe(feet, "left")).toMatchObject({ x: 100 - 10 - INTERACT_REACH, w: INTERACT_REACH });
    expect(interactionProbe(feet, "right")).toMatchObject({ x: 110, w: INTERACT_REACH });
  });
});

describe("findInteractTarget", () => {
  it("picks an NPC standing right in front of the player", () => {
    const npc = npcAt(100, 170);
    expect(findInteractTarget({ x: 100, y: 200 }, "up", [npc], [])).toMatchObject({ kind: "npc", cast: "elder" });
  });

  it("ignores an NPC behind the player or too far away", () => {
    const behind = npcAt(100, 230);
    expect(findInteractTarget({ x: 100, y: 200 }, "up", [behind], [])).toBeNull();
    const far = npcAt(100, 120);
    expect(findInteractTarget({ x: 100, y: 200 }, "up", [far], [])).toBeNull();
  });

  it("works from the side (left/right) with the NPC body height", () => {
    const npc = npcAt(140, 200);
    expect(findInteractTarget({ x: 100, y: 200 }, "right", [npc], [])).toMatchObject({ kind: "npc" });
    expect(findInteractTarget({ x: 100, y: 200 }, "left", [npc], [])).toBeNull();
  });

  it("chooses the nearer of two NPCs", () => {
    const near = npcAt(100, 170, "near#0");
    const far = npcAt(112, 160, "far#0");
    expect(findInteractTarget({ x: 100, y: 200 }, "up", [far, near], [])).toMatchObject({ key: "near#0" });
  });

  it("finds an examine point whose area the probe touches, and prefers a person over furniture", () => {
    const point: ExaminePoint = { id: "bench", text: "벤치", area: { x: 80, y: 150, w: 64, h: 40 } };
    expect(findInteractTarget({ x: 100, y: 200 }, "up", [], [point])).toMatchObject({ kind: "examine", id: "bench" });
    const npc = npcAt(100, 175);
    expect(findInteractTarget({ x: 100, y: 200 }, "up", [npc], [point])).toMatchObject({ kind: "npc" });
    expect(findInteractTarget({ x: 100, y: 200 }, "down", [], [point])).toBeNull();
  });

  it("uses a smaller hit area for animals", () => {
    expect(npcHitArea({ x: 0, y: 0, animal: true }).h).toBeLessThan(npcHitArea({ x: 0, y: 0, animal: false }).h);
  });
});
