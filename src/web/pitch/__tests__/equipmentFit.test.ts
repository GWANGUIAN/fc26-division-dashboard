import { describe, expect, it } from "vitest";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";
import { EQUIP_ITEMS } from "../data/equipment";
import { EQUIP_FIT, fitFor } from "../data/equipmentFit";

describe("per-character item fit", () => {
  it("only names known characters and items, in sane ranges", () => {
    for (const [characterId, items] of Object.entries(EQUIP_FIT)) {
      expect(PITCH_CHARACTER_IDS as readonly string[], characterId).toContain(characterId);
      for (const [itemId, views] of Object.entries(items)) {
        expect(EQUIP_ITEMS.some((item) => item.id === itemId), `${characterId}/${itemId}`).toBe(true);
        for (const [view, fit] of Object.entries(views)) {
          expect(["all", "down", "side", "up"], `${characterId}/${itemId}`).toContain(view);
          expect(Math.abs(fit?.dx ?? 0), `${characterId}/${itemId}/${view} dx`).toBeLessThanOrEqual(8);
          expect(Math.abs(fit?.dy ?? 0), `${characterId}/${itemId}/${view} dy`).toBeLessThanOrEqual(8);
          expect(fit?.scale ?? 1).toBeGreaterThan(0.5);
          expect(fit?.scale ?? 1).toBeLessThan(1.6);
        }
      }
    }
  });

  it("is a no-op for anything without an entry and adds the direction on top of `all`", () => {
    expect(fitFor("nobody", "nothing", "side")).toEqual({ dx: 0, dy: 0, scale: 1 });
    expect(fitFor("woowakgood", "no-such-item", "down")).toEqual({ dx: 0, dy: 0, scale: 1 });
    // the table is tuned by hand and changes often: check the rule against whatever it currently holds
    for (const [characterId, items] of Object.entries(EQUIP_FIT)) {
      for (const [itemId, views] of Object.entries(items)) {
        for (const dir of ["down", "side", "up"] as const) {
          const fit = fitFor(characterId, itemId, dir);
          expect(fit.dx).toBe((views.all?.dx ?? 0) + (views[dir]?.dx ?? 0));
          expect(fit.dy).toBe((views.all?.dy ?? 0) + (views[dir]?.dy ?? 0));
          expect(fit.scale).toBeCloseTo((views.all?.scale ?? 1) * (views[dir]?.scale ?? 1));
        }
      }
    }
  });
});
