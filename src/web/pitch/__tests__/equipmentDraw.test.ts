import { describe, expect, it } from "vitest";
import manifest from "../../../../scripts/pitch-art-manifest.json";
import { CELL_SIZE, clipDef, frameRect } from "../data/animations";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";
import { CHARACTER_ANCHORS, HEAD_REF } from "../data/equipmentAnchors.generated";
import { directionOfCell, directionOfRect, drawEquippedFrame, headAnchor, itemScale } from "../engine/equipment";

/** Records drawImage calls (body or item sheet key) in draw order, with the mirror state at the time. */
function recorder() {
  const calls: Array<{ key: string; mirrored: boolean; dx: number; dy: number; dw: number; dh: number }> = [];
  let sign = 1;
  const stack: number[] = [];
  const g = {
    save: () => void stack.push(sign),
    restore: () => void (sign = stack.pop() ?? 1),
    translate: () => undefined,
    scale: (x: number) => void (sign *= Math.sign(x)),
    globalAlpha: 1,
    drawImage: (img: { key: string }, _sx: number, _sy: number, _sw: number, _sh: number, dx: number, dy: number, dw: number, dh: number) =>
      void calls.push({ key: img.key, mirrored: sign < 0, dx, dy, dw, dh }),
  } as unknown as CanvasRenderingContext2D;
  return { g, calls };
}

const lookup = (key: string) => (key.startsWith("equipment/") ? ({ key, width: 156, height: 176 } as never) : undefined);
const body = { key: "body" } as never;

describe("directions of atlas cells", () => {
  it("matches the clip table for every clip that has a direction", () => {
    for (const dir of ["down", "side", "up"] as const) {
      for (const clip of ["idle", "run", "shoot"] as const) {
        const def = clipDef(clip, dir);
        for (let f = 0; f < def.frames; f++) expect(directionOfRect(frameRect(def, f)), `${clip} ${dir} #${f}`).toBe(dir);
      }
    }
    expect(directionOfCell(4, 2)).toBe("side");
    expect(directionOfCell(7, 6)).toBe("up");
    expect(directionOfCell(8, 3)).toBe("down");
    expect(directionOfCell(9, 0)).toBe("down");
  });
});

describe("head anchors", () => {
  it("cover all twelve characters with 80 filled cells and a sane head width", () => {
    expect(Object.keys(CHARACTER_ANCHORS).sort()).toEqual([...PITCH_CHARACTER_IDS].sort());
    for (const id of PITCH_CHARACTER_IDS) {
      const entry = CHARACTER_ANCHORS[id];
      expect(entry.cells).toHaveLength(100);
      expect(entry.cells.filter(Boolean).length, `${id} filled cells`).toBe(80);
      expect(entry.headW).toBeGreaterThanOrEqual(10);
      expect(entry.headW).toBeLessThanOrEqual(34);
      for (const cell of entry.cells) {
        if (!cell) continue;
        expect(cell[0]).toBeGreaterThan(0);
        expect(cell[0]).toBeLessThan(CELL_SIZE);
        expect(cell[1]).toBeGreaterThanOrEqual(0);
        expect(cell[1]).toBeLessThan(60);
      }
    }
  });

  it("uses the head reference width of the manifest and clamps the item scale", () => {
    expect(HEAD_REF).toBe(manifest.equipment.headRef);
    expect(itemScale(HEAD_REF)).toBe(1);
    expect(itemScale(1)).toBe(0.7);
    expect(itemScale(100)).toBe(1.3);
  });

  it("returns nothing for an unknown character or an empty cell", () => {
    expect(headAnchor("nobody", frameRect(clipDef("idle", "down"), 0))).toBeUndefined();
    expect(headAnchor("woowakgood", { sx: 0, sy: 96 * 9, sw: 96, sh: 96 })).toBeDefined();
    expect(headAnchor("woowakgood", { sx: 96 * 6, sy: 0, sw: 96, sh: 96 })).toBeUndefined();
  });
});

describe("drawEquippedFrame layers", () => {
  const loadout = { hat: "cap", face: "sunglasses", back: "cape" };
  const draw = (dir: "down" | "side" | "up", mirror = false) => {
    const { g, calls } = recorder();
    drawEquippedFrame(g, body, frameRect(clipDef("idle", dir), 0), "woowakgood", loadout, lookup, 100, 200, { scale: 2, mirror });
    return calls;
  };

  it("draws back behind the body for down and side, over it for up (and hides the face from behind)", () => {
    expect(draw("down").map((c) => c.key)).toEqual(["equipment/acc-back-a", "body", "equipment/acc-face-a", "equipment/acc-hat-a"]);
    expect(draw("side").map((c) => c.key)).toEqual(["equipment/acc-back-a", "body", "equipment/acc-face-a", "equipment/acc-hat-a"]);
    expect(draw("up").map((c) => c.key)).toEqual(["body", "equipment/acc-back-a", "equipment/acc-hat-a"]);
  });

  it("mirrors the items together with the body", () => {
    expect(draw("side", true).every((c) => c.mirrored)).toBe(true);
    expect(draw("side", false).some((c) => c.mirrored)).toBe(false);
  });

  it("puts the hat above the head top and the centre of the face items below it", () => {
    const calls = draw("down");
    const anchor = headAnchor("woowakgood", frameRect(clipDef("idle", "down"), 0));
    const headTopY = 200 + ((anchor?.y ?? 0) - 92) * 2;
    const hat = calls.find((c) => c.key === "equipment/acc-hat-a");
    const face = calls.find((c) => c.key === "equipment/acc-face-a");
    expect(hat?.dy).toBeLessThan(headTopY);
    expect((face?.dy ?? 0) + (face?.dh ?? 0) / 2).toBeGreaterThan(headTopY);
  });

  it("is the plain body when nothing is worn, when the art is missing, or when the character has no anchors", () => {
    const rect = frameRect(clipDef("idle", "down"), 0);
    const plain = recorder();
    drawEquippedFrame(plain.g, body, rect, "woowakgood", {}, lookup, 100, 200);
    expect(plain.calls.map((c) => c.key)).toEqual(["body"]);
    const noArt = recorder();
    drawEquippedFrame(noArt.g, body, rect, "woowakgood", loadout, () => undefined, 100, 200);
    expect(noArt.calls.map((c) => c.key)).toEqual(["body"]);
    const stranger = recorder();
    drawEquippedFrame(stranger.g, body, rect, "nobody", loadout, lookup, 100, 200);
    expect(stranger.calls.map((c) => c.key)).toEqual(["body"]);
  });
});

describe("backpack faces", () => {
  it("shows the pocket face (FRONT column) from behind and the strap face (BACK column) from the front", () => {
    const columns = (dir: "down" | "side" | "up", back: string) => {
      const sx: number[] = [];
      const g = {
        save: () => undefined,
        restore: () => undefined,
        translate: () => undefined,
        scale: () => undefined,
        globalAlpha: 1,
        drawImage: (img: { key: string }, x: number) => void (img.key.startsWith("equipment/") && sx.push(x)),
      } as unknown as CanvasRenderingContext2D;
      drawEquippedFrame(g, body, frameRect(clipDef("idle", dir), 0), "woowakgood", { back }, lookup, 100, 200);
      return sx.map((x) => x / 76);
    };
    expect(columns("up", "backpack")).toEqual([0]);
    expect(columns("down", "backpack")).toEqual([2]);
    expect(columns("side", "backpack")).toEqual([1]);
    // a cape is drawn outer-face-last: the BACK column is the outside seen from behind
    expect(columns("up", "cape")).toEqual([2]);
    expect(columns("down", "cape")).toEqual([0]);
  });
});
