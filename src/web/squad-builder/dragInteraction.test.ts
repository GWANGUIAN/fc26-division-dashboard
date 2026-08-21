import { describe, expect, it } from "vitest";
import { classifyDropIntent, resolveInsertIndex } from "./dragInteraction.js";

describe("classifyDropIntent", () => {
  const rect = { left: 100, width: 100 };

  it("classifies the center 50% of the target as a swap", () => {
    expect(classifyDropIntent(150, rect)).toBe("swap");
    expect(classifyDropIntent(125, rect)).toBe("swap");
    expect(classifyDropIntent(175, rect)).toBe("swap");
  });

  it("classifies the left edge as insert-before", () => {
    expect(classifyDropIntent(100, rect)).toBe("insert-before");
    expect(classifyDropIntent(120, rect)).toBe("insert-before");
  });

  it("classifies the right edge as insert-after", () => {
    expect(classifyDropIntent(200, rect)).toBe("insert-after");
    expect(classifyDropIntent(180, rect)).toBe("insert-after");
  });
});

describe("resolveInsertIndex", () => {
  it("resolves insert-before to the target's own index", () => {
    expect(resolveInsertIndex(["a", "b", "c"], "b", "insert-before")).toBe(1);
  });

  it("resolves insert-after to one past the target's index", () => {
    expect(resolveInsertIndex(["a", "b", "c"], "b", "insert-after")).toBe(2);
  });

  it("falls back to the end of the list if the target isn't present", () => {
    expect(resolveInsertIndex(["a", "b"], "missing", "insert-before")).toBe(2);
  });
});
