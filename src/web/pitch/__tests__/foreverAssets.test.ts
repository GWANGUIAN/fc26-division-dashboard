import { describe, expect, it } from "vitest";
import { PITCH_ASSET_META } from "../data/assetMeta.generated";
import { ASSET_GROUPS, getPitchAssetUrl } from "../engine/assets";
import { FOREVER_PROPS } from "../game/forever";

const size = (key: string) => PITCH_ASSET_META[key];

describe("Jandi Forever art (docs/forever/03 §3)", () => {
  it("gate sprites: 3 states 128x128 + arrow 24x32 + plate 64x24", () => {
    for (const name of ["closed", "open", "glow"]) expect(size(`env/forever-gate-${name}`)).toMatchObject({ w: 128, h: 128 });
    expect(size("env/forever-gate-arrow")).toMatchObject({ w: 24, h: 32 });
    expect(size("env/forever-gate-plate")).toMatchObject({ w: 64, h: 24 });
  });

  it("logo is 480x160 and both backgrounds are full 960x540 scenes", () => {
    expect(size("ui/forever-logo")).toMatchObject({ w: 480, h: 160 });
    expect(size("env/forever-loading-bg")).toMatchObject({ w: 960, h: 540 });
    expect(size("env/forever-hub-bg")).toMatchObject({ w: 960, h: 540 });
  });

  it("NPCs are 2-frame strips of 96x96 cells, monsters 2-frame strips", () => {
    for (const id of ["questgiver", "streamer", "leroy", "innkeeper", "flightmaster", "guard"]) expect(size(`characters/forever-npc-${id}`), id).toMatchObject({ w: 192, h: 96, frames: 2 });
    for (const id of ["rabbit", "boar", "murloc", "kobold"]) expect(size(`characters/forever-mob-${id}`)?.frames, id).toBe(2);
  });

  it("every prop the hub places exists", () => {
    for (const prop of FOREVER_PROPS) expect(size(`env/forever-prop-${prop.id}`), prop.id).toBeDefined();
    expect(FOREVER_PROPS).toHaveLength(8);
  });

  it("the forever group is complete and byte-weighted", () => {
    const specs = ASSET_GROUPS.forever;
    expect(new Set(specs.map((spec) => spec.key)).size).toBe(specs.length);
    for (const spec of specs) {
      expect(getPitchAssetUrl(spec.key), spec.key).toBeDefined();
      expect(spec.bytes, spec.key).toBeGreaterThan(0);
    }
    expect(specs).toHaveLength(40);
  });
});
