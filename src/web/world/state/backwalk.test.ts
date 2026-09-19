import { describe, expect, it } from "vitest";
import { OVERWORLD_MAP } from "../data/maps";
import { parseAction } from "./actions";
import { BACKWALK_FLAG, BACKWALK_SEEN_FLAG, buildBackwalkDialogue, isBackwalk, oppositeFacing, withBackwalk } from "./backwalk";

describe("backwalk statue", () => {
  it("flips every facing to its opposite", () => {
    expect(oppositeFacing("up")).toBe("down");
    expect(oppositeFacing("down")).toBe("up");
    expect(oppositeFacing("left")).toBe("right");
    expect(oppositeFacing("right")).toBe("left");
  });

  it("switches the flag on and off, remembering that the blessing was taken", () => {
    const on = withBackwalk({ "prologue-done": true }, true);
    expect(isBackwalk({ flags: on })).toBe(true);
    expect(on[BACKWALK_SEEN_FLAG]).toBe(true);
    const off = withBackwalk(on, false);
    expect(isBackwalk({ flags: off })).toBe(false);
    expect(BACKWALK_FLAG in off).toBe(false);
    expect(off[BACKWALK_SEEN_FLAG]).toBe(true);
    expect(off["prologue-done"]).toBe(true);
  });

  it("offers the blessing first: taking it turns the walk around, declining changes nothing", () => {
    const node = buildBackwalkDialogue({ flags: {} });
    expect(node.choices?.map((choice) => choice.label)).toEqual(["축복을 받는다", "그만둔다"]);
    expect(node.choices?.[0].effect).toEqual({ type: "backwalk", on: true });
    expect(node.choices?.[1].effect).toBeUndefined();
    expect(node.choices?.[1].next?.lines.length).toBeGreaterThan(0);
  });

  it("greets a returning visitor differently while offering the same blessing", () => {
    const first = buildBackwalkDialogue({ flags: {} });
    const again = buildBackwalkDialogue({ flags: { [BACKWALK_SEEN_FLAG]: true } });
    expect(again.lines[0].text).not.toBe(first.lines[0].text);
    expect(again.choices?.[0].effect).toEqual({ type: "backwalk", on: true });
  });

  it("offers to take the blessing back while it is on", () => {
    const node = buildBackwalkDialogue({ flags: { [BACKWALK_FLAG]: true, [BACKWALK_SEEN_FLAG]: true } });
    expect(node.choices?.[0].effect).toEqual({ type: "backwalk", on: false });
    expect(node.choices?.[1].effect).toBeUndefined();
  });

  it("stands on the overworld with an examine point that runs the statue action", () => {
    const point = OVERWORLD_MAP.examine.find((entry) => parseAction(entry.action)?.type === "backwalk-statue");
    expect(point).toBeDefined();
    const statue = OVERWORLD_MAP.props.find((entry) => entry.prop === "mystery-statue");
    expect(statue).toBeDefined();
    // the examine point is centred on the statue's tile, so the probe in front of the pedestal reaches it
    expect(Math.floor(statue!.x / OVERWORLD_MAP.tile)).toBe(point!.tile[0]);
    expect(Math.floor((statue!.y - 1) / OVERWORLD_MAP.tile)).toBe(point!.tile[1]);
  });
});
