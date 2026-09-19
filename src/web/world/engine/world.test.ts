import { describe, expect, it } from "vitest";
import { facingFor, RUN_SPEED, WALK_SPEED } from "./world";

describe("facingFor", () => {
  it("faces the axis being moved along", () => {
    expect(facingFor(-1, 0, "down")).toBe("left");
    expect(facingFor(1, 0, "down")).toBe("right");
    expect(facingFor(0, -1, "left")).toBe("up");
    expect(facingFor(0, 1, "left")).toBe("down");
  });

  it("keeps the facing when standing still", () => {
    expect(facingFor(0, 0, "up")).toBe("up");
  });

  it("keeps the current facing on a diagonal that still includes it, otherwise turns horizontal", () => {
    expect(facingFor(1, 1, "down")).toBe("down");
    expect(facingFor(1, 1, "right")).toBe("right");
    expect(facingFor(-1, -1, "up")).toBe("up");
    expect(facingFor(1, -1, "left")).toBe("right");
    expect(facingFor(-1, 1, "up")).toBe("left");
  });
});

describe("movement speeds", () => {
  it("uses S7 walk and run speeds without changing the run multiplier", () => {
    expect(WALK_SPEED).toBe(150);
    expect(RUN_SPEED).toBe(225);
    expect(RUN_SPEED / WALK_SPEED).toBe(1.5);
  });
});
