import { describe, expect, it } from "vitest";
import { actionForCode, moveVector, type Action } from "./input";

const held = (...actions: Action[]) => new Set<Action>(actions);

describe("actionForCode", () => {
  it("maps arrows, WASD and the documented keys by physical code", () => {
    expect(actionForCode("ArrowLeft")).toBe("left");
    expect(actionForCode("KeyA")).toBe("left");
    expect(actionForCode("KeyW")).toBe("up");
    expect(actionForCode("ShiftRight")).toBe("run");
    expect(actionForCode("KeyE")).toBe("interact");
    expect(actionForCode("Space")).toBe("interact");
    expect(actionForCode("Enter")).toBe("interact");
    expect(actionForCode("Escape")).toBe("menu");
    expect(actionForCode("KeyJ")).toBe("log");
    expect(actionForCode("KeyM")).toBe("map");
  });

  it("ignores unmapped keys so browser shortcuts keep working", () => {
    expect(actionForCode("KeyR")).toBeUndefined();
    expect(actionForCode("F5")).toBeUndefined();
    expect(actionForCode("Tab")).toBeUndefined();
  });
});

describe("moveVector", () => {
  it("is zero with no keys or with opposite keys held", () => {
    expect(moveVector(held())).toEqual({ x: 0, y: 0 });
    expect(moveVector(held("left", "right"))).toEqual({ x: 0, y: 0 });
    expect(moveVector(held("up", "down", "left", "right"))).toEqual({ x: 0, y: 0 });
  });

  it("points along a single axis", () => {
    expect(moveVector(held("right"))).toEqual({ x: 1, y: 0 });
    expect(moveVector(held("up"))).toEqual({ x: 0, y: -1 });
  });

  it("normalises diagonals so they are not faster", () => {
    const v = moveVector(held("down", "right"));
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
    expect(v.x).toBeCloseTo(Math.SQRT1_2);
    expect(v.y).toBeCloseTo(Math.SQRT1_2);
  });

  it("lets the remaining key win when one of an opposite pair is released", () => {
    expect(moveVector(held("left", "right", "up"))).toEqual({ x: 0, y: -1 });
  });

  it("ignores non-movement actions", () => {
    expect(moveVector(held("run", "interact"))).toEqual({ x: 0, y: 0 });
  });
});
