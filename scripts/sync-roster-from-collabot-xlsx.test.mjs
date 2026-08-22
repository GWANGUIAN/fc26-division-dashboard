import { describe, expect, it } from "vitest";
import { decideSync } from "./sync-roster-from-collabot-xlsx.mjs";

function entries(soopIds) {
  return soopIds.map((soopId) => ({ slug: soopId, displayName: soopId, soopId }));
}

function applicants(soopIds) {
  return soopIds.map((soopId) => ({ soopId, displayName: soopId }));
}

describe("decideSync", () => {
  it("aborts when the live list is empty and the roster is non-empty", () => {
    const result = decideSync(entries(["a", "b"]), [], 0.5);
    expect(result.aborted).toBe(true);
  });

  it("always aborts on zero live applicants, even against an empty roster", () => {
    // Zero applicants on a page that always has real, ongoing applicants is
    // treated as a fetch failure signal, not a legitimately empty roster.
    const result = decideSync([], [], 0.5);
    expect(result.aborted).toBe(true);
  });

  it("aborts when the live count is strictly below the ratio threshold", () => {
    // 10 existing, ratio 0.5 -> threshold 5; 4 live is below it.
    const result = decideSync(entries(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]), applicants(["a", "b", "c", "d"]), 0.5);
    expect(result.aborted).toBe(true);
    expect(result.liveCount).toBe(4);
    expect(result.existingCount).toBe(10);
  });

  it("does not abort at exactly the ratio threshold", () => {
    // 10 existing, ratio 0.5 -> threshold 5; 5 live is not below it.
    const result = decideSync(entries(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]), applicants(["a", "b", "c", "d", "e"]), 0.5);
    expect(result.aborted).toBe(false);
  });

  it("computes additions and removals by soopId, case-insensitively", () => {
    const result = decideSync(entries(["Villlo", "gone"]), applicants(["villlo", "newperson"]), 0.5);
    expect(result.aborted).toBe(false);
    expect(result.additions).toEqual([{ soopId: "newperson", displayName: "newperson" }]);
    expect(result.removals).toEqual([{ slug: "gone", displayName: "gone", soopId: "gone" }]);
  });

  it("ignores existing entries without a soopId when computing the threshold and removals", () => {
    const withoutSoopId = [{ slug: "manual", displayName: "수동 항목" }];
    const result = decideSync([...entries(["a", "b"]), ...withoutSoopId], applicants(["a", "b"]), 0.5);
    expect(result.aborted).toBe(false);
    expect(result.removals).toEqual([]);
  });

  it("never removes an isExcluded entry, even when absent from the live list", () => {
    const excluded = [{ slug: "chunyang", displayName: "천양", soopId: "chunyang", isExcluded: true }];
    const result = decideSync([...entries(["a", "b"]), ...excluded], applicants(["a", "b"]), 0.5);
    expect(result.aborted).toBe(false);
    expect(result.removals).toEqual([]);
  });
});
