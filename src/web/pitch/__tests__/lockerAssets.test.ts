import { describe, expect, it } from "vitest";
import { ASSET_GROUPS, getPitchAssetUrl } from "../engine/assets";
import { PITCH_ASSET_META } from "../data/assetMeta.generated";

const size = (key: string) => PITCH_ASSET_META[key];

describe("locker gate / room / stat UI assets (A3)", () => {
  it("gate sprites: 3 states 128x128 + arrow 24x32 + plate 64x24, all in the core group", () => {
    for (const name of ["gate-closed", "gate-open", "gate-glow"]) expect(size(`env/${name}`)).toMatchObject({ w: 128, h: 128 });
    expect(size("env/gate-arrow")).toMatchObject({ w: 24, h: 32 });
    expect(size("env/gate-plate")).toMatchObject({ w: 64, h: 24 });
    const core = ASSET_GROUPS.core.map((spec) => spec.key);
    for (const name of ["gate-closed", "gate-open", "gate-glow", "gate-arrow", "gate-plate"]) expect(core).toContain(`env/${name}`);
  });

  it("locker background is a full 960x540 scene", () => {
    expect(size("env/locker-bg")).toMatchObject({ w: 960, h: 540 });
  });

  it("props: stat terminal 3 states 96x128, exit door 2 states 64x96, locker unit 2 states 48x80", () => {
    for (const name of ["terminal-off", "terminal-idle", "terminal-active"]) expect(size(`env/${name}`)).toMatchObject({ w: 96, h: 128 });
    for (const name of ["exit-closed", "exit-open"]) expect(size(`env/${name}`)).toMatchObject({ w: 64, h: 96 });
    for (const name of ["locker-unit", "locker-unit-open"]) expect(size(`env/${name}`)).toMatchObject({ w: 48, h: 80 });
    expect(size("env/bench")).toMatchObject({ w: 96, h: 40 });
    expect(size("env/whiteboard")).toMatchObject({ w: 56, h: 72 });
  });

  it("stat UI: hexagon layers 280, nodes 12/16/16, detail panel + terminal frame are 9-slice", () => {
    for (const name of ["hex-bg", "hex-fill"]) expect(size(`ui/${name}`)).toMatchObject({ w: 280, h: 280 });
    expect(size("ui/hex-frame")).toMatchObject({ w: 320, h: 280 });
    expect(size("ui/node-normal")).toMatchObject({ w: 12, h: 12 });
    expect(size("ui/node-hover")).toMatchObject({ w: 16, h: 16 });
    expect(size("ui/node-selected")).toMatchObject({ w: 16, h: 16 });
    expect(size("ui/detail-panel")).toMatchObject({ w: 400, h: 392 });
    expect(size("ui/detail-panel").slice).toBeUndefined();
    expect(size("ui/terminal-frame").slice).toBe(24);
    expect(size("ui/coming-soon")).toMatchObject({ w: 216, h: 40 });
    expect(size("ui/axis-plate")).toMatchObject({ w: 72, h: 22 });
  });

  it("all 24 icons are 24x24", () => {
    const icons = Object.keys(PITCH_ASSET_META).filter((key) => key.startsWith("ui/icon-"));
    expect(icons).toHaveLength(24);
    for (const key of icons) expect(size(key), key).toMatchObject({ w: 24, h: 24 });
  });

  it("locker group is complete, byte-weighted, and holds the icons the stat screen uses", () => {
    const specs = ASSET_GROUPS.locker;
    expect(new Set(specs.map((spec) => spec.key)).size).toBe(specs.length);
    for (const spec of specs) {
      expect(getPitchAssetUrl(spec.key), spec.key).toBeDefined();
      expect(spec.bytes, spec.key).toBeGreaterThan(0);
    }
    const keys = specs.map((spec) => spec.key);
    for (const key of ["env/locker-bg", "env/terminal-idle", "env/exit-open", "ui/hex-frame", "ui/detail-panel", "ui/coming-soon", "ui/icon-question"]) expect(keys).toContain(key);
  });
});
