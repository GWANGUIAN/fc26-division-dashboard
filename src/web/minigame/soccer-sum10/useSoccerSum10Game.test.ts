import { describe, expect, it } from "vitest";
import { createSoccerSum10EndLatch } from "./useSoccerSum10Game.js";

describe("soccer sum10 round-end latch", () => {
  it("allows exactly one end notification until the next round starts", () => {
    const latch = createSoccerSum10EndLatch();

    expect(latch.claim()).toBe(true);
    // A parent world save update may re-render the modal before the phase update commits.
    expect(latch.claim()).toBe(false);
    latch.reset();
    expect(latch.claim()).toBe(true);
  });
});
