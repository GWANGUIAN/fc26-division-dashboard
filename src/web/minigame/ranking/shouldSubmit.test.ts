import { describe, expect, it } from "vitest";
import { shouldSubmit } from "./shouldSubmit.js";

describe("shouldSubmit", () => {
  it("submits the first result ever", () => {
    expect(shouldSubmit("desc", 5, null)).toBe(true);
    expect(shouldSubmit("asc", 30, null)).toBe(true);
  });

  it("submits only strict improvements for bigger-is-better games", () => {
    expect(shouldSubmit("desc", 11, 10)).toBe(true);
    expect(shouldSubmit("desc", 10, 10)).toBe(false);
    expect(shouldSubmit("desc", 9, 10)).toBe(false);
  });

  it("submits only strict improvements for smaller-is-better games", () => {
    expect(shouldSubmit("asc", 19, 20)).toBe(true);
    expect(shouldSubmit("asc", 20, 20)).toBe(false);
    expect(shouldSubmit("asc", 21, 20)).toBe(false);
  });

  it("ignores non-finite scores", () => {
    expect(shouldSubmit("desc", Number.NaN, null)).toBe(false);
    expect(shouldSubmit("desc", Number.POSITIVE_INFINITY, 3)).toBe(false);
  });
});
