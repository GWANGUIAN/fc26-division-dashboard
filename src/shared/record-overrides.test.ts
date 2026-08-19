import { describe, expect, it } from "vitest";
import { parseRecordOverrides } from "./record-overrides.js";

describe("record overrides parsing", () => {
  it("returns an empty array for a template file with no entries", () => {
    expect(parseRecordOverrides("overrides: []\n")).toEqual([]);
  });

  it("parses soopId, division, and record entries", () => {
    expect(parseRecordOverrides(`
overrides:
  - soopId: villlo
    division: 5
    record: { wins: 10, draws: 2, losses: 3 }
`)).toEqual([{ soopId: "villlo", division: 5, record: { wins: 10, draws: 2, losses: 3 } }]);
  });

  it("rejects a missing soopId", () => {
    expect(() => parseRecordOverrides("overrides:\n  - division: 5\n    record: { wins: 1, draws: 0, losses: 0 }\n"))
      .toThrow(/soopId is required/u);
  });

  it("rejects a division outside 1-10", () => {
    expect(() => parseRecordOverrides("overrides:\n  - soopId: a\n    division: 11\n    record: { wins: 1, draws: 0, losses: 0 }\n"))
      .toThrow(/division must be/u);
  });

  it("rejects non-integer or negative record counts", () => {
    expect(() => parseRecordOverrides("overrides:\n  - soopId: a\n    division: 5\n    record: { wins: 1.5, draws: 0, losses: 0 }\n"))
      .toThrow(/non-negative integers/u);
    expect(() => parseRecordOverrides("overrides:\n  - soopId: a\n    division: 5\n    record: { wins: -1, draws: 0, losses: 0 }\n"))
      .toThrow(/non-negative integers/u);
  });

  it("rejects a duplicate soopId+division pair", () => {
    expect(() => parseRecordOverrides(`
overrides:
  - soopId: a
    division: 5
    record: { wins: 1, draws: 0, losses: 0 }
  - soopId: a
    division: 5
    record: { wins: 2, draws: 0, losses: 0 }
`)).toThrow(/duplicate/u);
  });

  it("allows the same soopId across different divisions", () => {
    expect(parseRecordOverrides(`
overrides:
  - soopId: a
    division: 5
    record: { wins: 1, draws: 0, losses: 0 }
  - soopId: a
    division: 4
    record: { wins: 2, draws: 0, losses: 0 }
`)).toHaveLength(2);
  });
});
