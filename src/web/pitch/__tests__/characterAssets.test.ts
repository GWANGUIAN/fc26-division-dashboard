import { describe, expect, it } from "vitest";
import { ASSET_GROUPS, getPitchAssetUrl, groupSpecs } from "../engine/assets";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";
import { PITCH_ASSET_META } from "../data/assetMeta.generated";

const PORTRAITS = ["neutral", "confident", "celebrate", "disappointed"];

describe("12 field characters (A2)", () => {
  it("has 12 unique ids, woowakgood first", () => {
    expect(PITCH_CHARACTER_IDS).toHaveLength(12);
    expect(new Set(PITCH_CHARACTER_IDS).size).toBe(12);
    expect(PITCH_CHARACTER_IDS[0]).toBe("woowakgood");
  });

  it.each([...PITCH_CHARACTER_IDS])("%s: atlas 960x960, 4 portraits 192x192, hero ~384 tall", (id) => {
    const atlas = PITCH_ASSET_META[`characters/${id}-atlas`];
    expect(atlas).toMatchObject({ w: 960, h: 960 });
    for (const name of PORTRAITS) expect(PITCH_ASSET_META[`portraits/${id}-${name}`]).toMatchObject({ w: 192, h: 192 });
    const hero = PITCH_ASSET_META[`characters/${id}-hero`];
    expect(hero.h).toBeGreaterThanOrEqual(383);
    expect(hero.h).toBeLessThanOrEqual(384);
    expect(getPitchAssetUrl(`characters/${id}-atlas`)).toBeDefined();
  });

  it("char:<id> group = atlas + 4 portraits, all present", () => {
    for (const id of PITCH_CHARACTER_IDS) {
      const specs = groupSpecs(`char:${id}`);
      expect(specs).toHaveLength(5);
      for (const spec of specs) expect(getPitchAssetUrl(spec.key), spec.key).toBeDefined();
    }
  });

  it("select group is complete and byte-weighted", () => {
    const specs = ASSET_GROUPS.select;
    for (const spec of specs) {
      expect(getPitchAssetUrl(spec.key), spec.key).toBeDefined();
      expect(spec.bytes, spec.key).toBeGreaterThan(0);
    }
    for (const id of PITCH_CHARACTER_IDS) {
      const keys = specs.map((spec) => spec.key);
      expect(keys).toContain(`characters/${id}-hero`);
      expect(keys).toContain(`portraits/${id}-neutral`);
    }
  });

  it("select UI frames: card 96x128, name-plate 9-slice inset 12, confirm 216x48", () => {
    for (const name of ["card-normal", "card-hover", "card-selected"]) expect(PITCH_ASSET_META[`ui/${name}`]).toMatchObject({ w: 96, h: 128 });
    expect(PITCH_ASSET_META["ui/name-plate"].slice).toBe(12);
    expect(PITCH_ASSET_META["ui/confirm"]).toMatchObject({ w: 216, h: 48 });
    expect(PITCH_ASSET_META["keyart/select-bg"]).toMatchObject({ w: 960, h: 540 });
  });

  it("fx-celebrate strips are 4-frame and listed in core", () => {
    const core = ASSET_GROUPS.core.map((spec) => spec.key);
    for (const name of ["fx-confetti", "fx-firework", "fx-rays", "fx-save-sparkle"]) {
      expect(PITCH_ASSET_META[`fx/${name}`].frames).toBe(4);
      expect(core).toContain(`fx/${name}`);
    }
  });
});
