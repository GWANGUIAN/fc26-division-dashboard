import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as P from "./lib/pitch-art-math.mjs";

const manifest = JSON.parse(readFileSync(new URL("./pitch-art-manifest.json", import.meta.url), "utf8"));

describe("pitch-art-manifest", () => {
  for (const kind of ["field", "keeper"]) {
    it(`${kind}: every clip row fits the atlas and rows match the sheet grid`, () => {
      const { w, h } = manifest[kind].atlas;
      for (const [name, sheet] of Object.entries(manifest[kind].sheets)) {
        expect(sheet.rows.length, name).toBe(sheet.grid[1]);
        for (const row of sheet.rows) {
          expect(row.frames, `${name}/${row.clip}`).toBeLessThanOrEqual(sheet.grid[0]);
          expect((row.atlas[1] + row.frames) * row.cellW).toBeLessThanOrEqual(w);
          expect((row.atlas[0] + 1) * manifest.cell).toBeLessThanOrEqual(h);
        }
        expect(Boolean(sheet.ref) !== Boolean(sheet.scaleFrom), name).toBe(true);
      }
    });
  }

  it("field atlas is 960x960 (10x10 cells of 96) and holds 80 frames", () => {
    expect(manifest.field.atlas).toEqual({ w: 960, h: 960 });
    const frames = Object.values(manifest.field.sheets).flatMap((s) => s.rows).reduce((n, r) => n + r.frames, 0);
    expect(frames).toBe(80);
  });

  it("env/fx/ui items only use cells inside their grid and unique ids", () => {
    const ids = new Set();
    for (const [category, sheets] of Object.entries(manifest.sheets)) {
      for (const [sheetId, cfg] of Object.entries(sheets)) {
        if (cfg.scene) continue;
        const total = cfg.grid[0] * cfg.grid[1];
        const seen = new Set();
        for (const [id, cell] of cfg.items) {
          for (const c of Array.isArray(cell) ? cell : [cell]) {
            expect(c, `${sheetId}/${id}`).toBeLessThan(total);
            expect(seen.has(c), `${sheetId} cell ${c} reused`).toBe(false);
            seen.add(c);
          }
          const key = `${category}/${id}`;
          expect(ids.has(key), key).toBe(false);
          ids.add(key);
        }
      }
    }
  });
});

describe("pitch-art-math", () => {
  it("groundLine is the median of the lowest half (a jump does not move it)", () => {
    expect(P.groundLine([100, 100, 60, 100, 100, 62])).toBe(100);
    expect(P.groundLine([90, 88])).toBe(90);
  });

  it("planRow snaps small drift, keeps jumps and pins grounded rows", () => {
    const frames = [
      { w: 40, h: 80, bottom: 100, cx: 20 },
      { w: 40, h: 80, bottom: 98, cx: 20 },
      { w: 40, h: 80, bottom: 60, cx: 20 },
    ];
    const air = P.planRow(frames, 1, 100, { cellW: 96, airborne: true });
    expect(air.map((p) => p.delta)).toEqual([0, 0, -40]);
    expect(air[0].dy + air[0].dh).toBe(92);
    const ground = P.planRow(frames, 1, 100, { cellW: 96, airborne: false });
    expect(ground.every((p) => p.delta === 0)).toBe(true);
    expect(ground[2].raw).toBe(-40);
  });

  it("rowFitScale shrinks tall or wide frames into the cell", () => {
    const fit = P.rowFitScale([{ w: 200, h: 400, bottom: 400, cx: 100 }], 400, { cellW: 96, airborne: true });
    expect(fit).toBeCloseTo(91 / 400, 5);
    expect(400 * fit).toBeLessThanOrEqual(91);
  });

  it("scaleByCell scales inversely with the grid cell height", () => {
    expect(P.scaleByCell(0.26, 341, 256)).toBeCloseTo(0.26 * 341 / 256, 6);
  });
});
