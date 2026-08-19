import { describe, expect, it } from "vitest";
import { chooseRecord, parseRecordScreenResult, recordExtractionStatus } from "./record-extraction.js";

describe("parseRecordScreenResult", () => {
  it("accepts a valid record screen result", () => {
    expect(parseRecordScreenResult({ isRecordScreen: true, wins: 53, draws: 10, losses: 20 }))
      .toEqual({ wins: 53, draws: 10, losses: 20 });
  });

  it("rejects a non-record screen", () => {
    expect(parseRecordScreenResult({ isRecordScreen: false, wins: null, draws: null, losses: null })).toBeUndefined();
  });

  it("rejects missing or non-integer counts", () => {
    expect(parseRecordScreenResult({ isRecordScreen: true, wins: 1, draws: 2 })).toBeUndefined();
    expect(parseRecordScreenResult({ isRecordScreen: true, wins: 1.5, draws: 2, losses: 3 })).toBeUndefined();
    expect(parseRecordScreenResult({ isRecordScreen: true, wins: -1, draws: 2, losses: 3 })).toBeUndefined();
  });

  it("rejects malformed responses", () => {
    expect(parseRecordScreenResult(null)).toBeUndefined();
    expect(parseRecordScreenResult("not json")).toBeUndefined();
  });
});

describe("chooseRecord", () => {
  it("returns nothing when no image matched a record screen", () => {
    expect(chooseRecord([undefined, undefined])).toEqual({});
  });

  it("takes the first valid record and skips undefineds", () => {
    expect(chooseRecord([undefined, { wins: 5, draws: 3, losses: 12 }, undefined]))
      .toEqual({ record: { wins: 5, draws: 3, losses: 12 } });
  });

  it("flags for review when a later image disagrees with the first match", () => {
    expect(chooseRecord([{ wins: 53, draws: 10, losses: 20 }, { wins: 54, draws: 10, losses: 20 }]))
      .toEqual({ record: { wins: 53, draws: 10, losses: 20 }, needsReview: true });
  });

  it("does not flag for review when later images agree", () => {
    expect(chooseRecord([{ wins: 53, draws: 10, losses: 20 }, { wins: 53, draws: 10, losses: 20 }]))
      .toEqual({ record: { wins: 53, draws: 10, losses: 20 } });
  });
});

describe("recordExtractionStatus", () => {
  it("is success once a record is present", () => {
    expect(recordExtractionStatus({ imageUrls: ["a"], record: { wins: 1, draws: 0, losses: 0 }, recordExtractionAttempts: 5 }))
      .toBe("success");
  });

  it("is pending when there are no images to extract from", () => {
    expect(recordExtractionStatus({ imageUrls: [], recordExtractionAttempts: 5 })).toBe("pending");
  });

  it("is pending while retries remain", () => {
    expect(recordExtractionStatus({ imageUrls: ["a"], recordExtractionAttempts: 2 }, 3)).toBe("pending");
    expect(recordExtractionStatus({ imageUrls: ["a"] })).toBe("pending");
  });

  it("is failed once attempts are exhausted with no record", () => {
    expect(recordExtractionStatus({ imageUrls: ["a"], recordExtractionAttempts: 3 }, 3)).toBe("failed");
  });
});
