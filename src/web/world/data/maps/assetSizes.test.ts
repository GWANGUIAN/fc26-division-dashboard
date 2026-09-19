import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { INTERIOR_IDS, INTERIOR_MAPS, OVERWORLD_MAP } from "./index";
import { PROP_DEFS } from "../propDefs";

// docs/world/09 §10–§11: the converted image files are exactly the size the tables (and propDefs) say — only
// the visible art inside is smaller. This test reads the real webp headers so a regenerated/re-converted
// sheet that comes out at a different size is reported here instead of drawing at the wrong scale.

const file = (key: string) => fileURLToPath(new URL(`../../../assets/world/${key}.webp`, import.meta.url));
const size = async (key: string) => {
  const { width, height } = await sharp(file(key)).metadata();
  return [width, height];
};

describe("converted image sizes match the definitions", () => {
  it("props: file size == propDefs w×h (and the visible art fits inside)", async () => {
    for (const [id, def] of Object.entries(PROP_DEFS)) {
      expect(await size(`props/${id}`), id).toEqual([def.w, def.h]);
      expect(def.content[0], id).toBeLessThanOrEqual(def.w);
      expect(def.content[1], id).toBeLessThanOrEqual(def.h);
      for (const foot of def.foot ?? []) expect(foot.h, `${id} foot height`).toBeLessThanOrEqual(def.content[1]);
    }
  });

  it("buildings: file size == the tile box the map gives them", async () => {
    for (const building of OVERWORLD_MAP.buildings) {
      const [x0, y0, x1, y1] = building.rect;
      expect(await size(`buildings/${building.id}`), building.id).toEqual([(x1 - x0 + 1) * 32, (y1 - y0 + 1) * 32]);
    }
  });

  it("interiors: 640×384", async () => {
    for (const id of INTERIOR_IDS) expect(await size(INTERIOR_MAPS[id].image), id).toEqual([640, 384]);
  });

  it("character atlases: 192×256 for people, 128×128 for animals", async () => {
    for (const id of ["janine95kim", "elder", "woowakgood", "weeder-grunt", "kid"]) expect(await size(`characters/${id}-atlas`), id).toEqual([192, 256]);
    for (const id of ["cat-jandi", "dog-ball"]) expect(await size(`characters/${id}-atlas`), id).toEqual([128, 128]);
  });

  it("terrain sheets: 128×128", async () => {
    for (const sheet of ["core", "water", "spring", "frost", "industrial", "cloud", "weed", "pitch"]) expect(await size(`terrain/${sheet}`), sheet).toEqual([128, 128]);
  });
});
