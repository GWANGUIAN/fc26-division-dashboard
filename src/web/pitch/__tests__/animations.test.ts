import { describe, expect, it } from "vitest";
import manifest from "../../../../scripts/pitch-art-manifest.json";
import { ASSET_GROUPS } from "../engine/assets";
import { ATLAS_SIZE, CELL_SIZE, CLIPS, KEEPER_ATLAS, KEEPER_CLIPS, clipDef, frameAt, frameRect, resolveDirection, totalFrames } from "../data/animations";
import { PITCH_ASSET_META } from "../data/assetMeta.generated";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";

type Row = { clip: string; dir: string; frames: number; cellW: number; atlas: [number, number] };
const rowsOf = (kind: "field" | "keeper") =>
  Object.values(manifest[kind].sheets).flatMap((sheet) => sheet.rows as unknown as Row[]);

describe("animations", () => {
  it("field clips total 80 frames (04 §3)", () => {
    expect(totalFrames()).toBe(80);
  });

  it("every clip cell lies inside the 960×960 atlas and no two clips overlap", () => {
    const used = new Set<string>();
    for (const dirs of Object.values(CLIPS)) {
      for (const def of Object.values(dirs)) {
        for (let f = 0; f < def.frames; f++) {
          const r = frameRect(def, f);
          expect(r.sx + r.sw).toBeLessThanOrEqual(ATLAS_SIZE);
          expect(r.sy + r.sh).toBeLessThanOrEqual(ATLAS_SIZE);
          const key = `${r.sx},${r.sy}`;
          expect(used.has(key)).toBe(false);
          used.add(key);
        }
      }
    }
  });

  it("matches the converter manifest row for row", () => {
    const rows = rowsOf("field");
    expect(rows).toHaveLength(Object.values(CLIPS).reduce((n, d) => n + Object.keys(d).length, 0));
    for (const row of rows) {
      const def = clipDef(row.clip as keyof typeof CLIPS, row.dir as "down");
      expect([def.row, def.col, def.frames, def.cellW]).toEqual([row.atlas[0], row.atlas[1], row.frames, row.cellW]);
    }
    expect(manifest.field.atlas).toEqual({ w: ATLAS_SIZE, h: ATLAS_SIZE });
    expect(manifest.cell).toBe(CELL_SIZE);
  });

  it("keeper clips match the manifest and fit the 960×768 atlas", () => {
    const rows = rowsOf("keeper");
    expect(rows).toHaveLength(Object.keys(KEEPER_CLIPS).length);
    for (const row of rows) {
      const def = KEEPER_CLIPS[row.clip as keyof typeof KEEPER_CLIPS];
      expect([def.row, def.col, def.frames, def.cellW]).toEqual([row.atlas[0], row.atlas[1], row.frames, row.cellW]);
      expect((def.col + def.frames) * def.cellW).toBeLessThanOrEqual(KEEPER_ATLAS.w);
      expect((def.row + 1) * CELL_SIZE).toBeLessThanOrEqual(KEEPER_ATLAS.h);
    }
  });

  it("resolves missing directions and loops/holds playback", () => {
    expect(resolveDirection("skill_stepover", "down")).toBe("side");
    expect(resolveDirection("celebrate_a", "up")).toBe("down");
    expect(resolveDirection("run", "up")).toBe("up");
    const run = clipDef("run", "side");
    expect(frameAt(run, 0)).toBe(0);
    expect(frameAt(run, 6 / run.fps)).toBe(0);
    const shoot = clipDef("shoot", "up");
    expect(frameAt(shoot, 99)).toBe(shoot.frames - 1);
  });

  it("character id list equals the manifest", () => {
    expect([...PITCH_CHARACTER_IDS]).toEqual(manifest.characters.field);
  });
});

describe("converted assets", () => {
  it("the pilot character and keeper atlases have the specified sizes", () => {
    expect(PITCH_ASSET_META["characters/woowakgood-atlas"]).toMatchObject({ w: 960, h: 960 });
    expect(PITCH_ASSET_META["characters/keeper-ai-atlas"]).toMatchObject({ w: KEEPER_ATLAS.w, h: KEEPER_ATLAS.h });
    for (const name of ["neutral", "confident", "celebrate", "disappointed"]) {
      expect(PITCH_ASSET_META[`portraits/woowakgood-${name}`]).toMatchObject({ w: 192, h: 192 });
    }
    expect(PITCH_ASSET_META["characters/woowakgood-hero"].h).toBeLessThanOrEqual(384);
  });

  it("boot group is complete and small; every core key with a file has a byte size", () => {
    for (const spec of ASSET_GROUPS.boot) expect(PITCH_ASSET_META[spec.key]?.bytes, spec.key).toBeGreaterThan(0);
    const boot = ASSET_GROUPS.boot.reduce((n, s) => n + (s.bytes ?? 0), 0);
    expect(boot).toBeLessThan(1_500_000);
  });
});
