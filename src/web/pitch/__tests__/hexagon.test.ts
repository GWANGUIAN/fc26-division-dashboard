import { describe, expect, it } from "vitest";
import { STAT_AXIS_COUNT } from "../data/stats";
import { AXIS_PLATE, HEX, PLACEHOLDER_FILL, cycleAxis, fillPolygon, hexVertex, hexVertices, hitAxis, hitNode, labelPlateRect, ringRadius } from "../ui/hexagon";

const near = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe("hexagon geometry", () => {
  it("has six corners starting at 12 o'clock and going clockwise", () => {
    const v = hexVertices();
    expect(v).toHaveLength(6);
    near(v[0]!.x, HEX.cx);
    near(v[0]!.y, HEX.cy - HEX.radius);
    // clockwise on screen: the second corner is up-right, the fourth straight down, the last up-left
    const dx = Math.cos(Math.PI / 6) * HEX.radius;
    const dy = Math.sin(Math.PI / 6) * HEX.radius;
    near(v[1]!.x, HEX.cx + dx);
    near(v[1]!.y, HEX.cy - dy);
    near(v[2]!.x, HEX.cx + dx);
    near(v[2]!.y, HEX.cy + dy);
    near(v[3]!.x, HEX.cx);
    near(v[3]!.y, HEX.cy + HEX.radius);
    near(v[4]!.x, HEX.cx - dx);
    near(v[4]!.y, HEX.cy + dy);
    near(v[5]!.x, HEX.cx - dx);
    near(v[5]!.y, HEX.cy - dy);
  });

  it("keeps every corner at the circumradius from the centre", () => {
    for (const p of hexVertices()) near(Math.hypot(p.x - HEX.cx, p.y - HEX.cy), HEX.radius);
  });

  it("spaces the six rings evenly up to the outer edge", () => {
    expect(ringRadius(6)).toBe(HEX.radius);
    expect(ringRadius(1)).toBeCloseTo(HEX.radius / 6, 6);
    expect(ringRadius(3)).toBeCloseTo(HEX.radius / 2, 6);
  });

  it("draws the placeholder polygon at a uniform 60% of the radius", () => {
    const poly = fillPolygon([null, null, null, null, null, null]);
    for (const p of poly) near(Math.hypot(p.x - HEX.cx, p.y - HEX.cy), HEX.radius * PLACEHOLDER_FILL);
    // real values move only their own corner
    const mixed = fillPolygon([100, null, 50, null, null, 0]);
    near(Math.hypot(mixed[0]!.x - HEX.cx, mixed[0]!.y - HEX.cy), HEX.radius);
    near(Math.hypot(mixed[2]!.x - HEX.cx, mixed[2]!.y - HEX.cy), HEX.radius / 2);
    near(Math.hypot(mixed[5]!.x - HEX.cx, mixed[5]!.y - HEX.cy), 0);
    near(Math.hypot(mixed[1]!.x - HEX.cx, mixed[1]!.y - HEX.cy), HEX.radius * PLACEHOLDER_FILL);
  });
});

describe("hexagon hit test", () => {
  it("finds the node under each corner", () => {
    for (let i = 0; i < STAT_AXIS_COUNT; i++) {
      const p = hexVertex(i);
      expect(hitNode(p.x, p.y)).toBe(i);
      expect(hitNode(p.x + 5, p.y - 5)).toBe(i);
    }
  });

  it("misses away from the corners, including the centre", () => {
    expect(hitNode(HEX.cx, HEX.cy)).toBe(-1);
    const top = hexVertex(0);
    expect(hitNode(top.x, top.y + 40)).toBe(-1);
    expect(hitNode(top.x + 30, top.y)).toBe(-1);
  });

  it("also hits an axis through its label plate, without overlapping another axis", () => {
    for (let i = 0; i < STAT_AXIS_COUNT; i++) {
      const r = labelPlateRect(i);
      expect(r.w).toBe(AXIS_PLATE.w);
      expect(r.h).toBe(AXIS_PLATE.h);
      expect(hitAxis(r.x + r.w / 2, r.y + r.h / 2)).toBe(i);
      // the plate stays inside the left half (hexagon area) or right half is left to the detail panel
      expect(r.x).toBeGreaterThanOrEqual(56);
      expect(r.x + r.w).toBeLessThanOrEqual(512);
      expect(r.y).toBeGreaterThanOrEqual(104);
      expect(r.y + r.h).toBeLessThanOrEqual(496);
    }
    expect(hitAxis(700, 300)).toBe(-1);
  });
});

describe("axis selection", () => {
  it("cycles clockwise, counter-clockwise and with Tab, wrapping around", () => {
    expect(cycleAxis(0, "cw")).toBe(1);
    expect(cycleAxis(5, "cw")).toBe(0);
    expect(cycleAxis(0, "ccw")).toBe(5);
    expect(cycleAxis(3, "ccw")).toBe(2);
    expect(cycleAxis(0, "next")).toBe(1);
    expect(cycleAxis(5, "next")).toBe(0);
  });

  it("returns to the start after six steps either way", () => {
    let cw = 0;
    let ccw = 0;
    for (let i = 0; i < STAT_AXIS_COUNT; i++) {
      cw = cycleAxis(cw, "cw");
      ccw = cycleAxis(ccw, "ccw");
    }
    expect(cw).toBe(0);
    expect(ccw).toBe(0);
  });
});
