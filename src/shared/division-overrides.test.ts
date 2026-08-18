import { describe, expect, it } from "vitest";
import { parseDivisionOverrides } from "./division-overrides.js";

describe("division overrides parsing", () => {
  it("returns an empty map for a template file with no entries", () => {
    expect(parseDivisionOverrides("overrides:\n  # \"123456789\": 3\n")).toEqual({});
  });
  it("parses article ID to division mappings", () => {
    expect(parseDivisionOverrides('overrides:\n  "123456789": 3\n  "987654321": 7\n')).toEqual({
      "123456789": 3,
      "987654321": 7,
    });
  });
  it("rejects a non-numeric article ID", () => {
    expect(() => parseDivisionOverrides('overrides:\n  abc: 3\n')).toThrow(/Invalid article ID/u);
  });
  it("rejects a division outside 1-10", () => {
    expect(() => parseDivisionOverrides('overrides:\n  "123456789": 11\n')).toThrow(/Invalid division/u);
    expect(() => parseDivisionOverrides('overrides:\n  "123456789": 0\n')).toThrow(/Invalid division/u);
  });
});
