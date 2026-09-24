import { describe, expect, it } from "vitest";
import {
  canCancelSkill,
  cancelSkill,
  consumeStyle,
  createSkills,
  skillForKey,
  skillHop,
  skillPose,
  startSkill,
  stepSkills,
  styleTierOf,
  tierOf,
  type SkillId,
  type SkillState,
} from "../game/skills";
import { MOVE, SKILLS, STYLE } from "../game/tuning";

const DT = 1 / 60;

function run(s: SkillState, seconds: number, hold = false) {
  let x = 0;
  let y = 0;
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    stepSkills(s, DT, hold);
    x += s.stepX;
    y += s.stepY;
  }
  return { x, y };
}

/** Starts a successful move facing right and lets it play out. */
function play(s: SkillState, id: SkillId) {
  const start = startSkill(s, id, true, 1, 0);
  run(s, SKILLS[id].duration + DT);
  return start;
}

describe("skills: keys and travel", () => {
  it("maps Z X C V to the four moves", () => {
    expect(["KeyZ", "KeyX", "KeyC", "KeyV"].map(skillForKey)).toEqual(["stepover", "roulette", "rainbow", "elastico"]);
    expect(skillForKey("KeyA")).toBeNull();
  });

  it("slides the full distance forward over the duration and then ends", () => {
    for (const id of ["stepover", "roulette", "rainbow", "elastico"] as const) {
      const s = createSkills();
      startSkill(s, id, true, 1, 0);
      const moved = run(s, SKILLS[id].duration + 0.05);
      expect(moved.x).toBeCloseTo(SKILLS[id].move, 1);
      expect(moved.y).toBeCloseTo(0, 5);
      expect(s.active).toBeNull();
    }
  });

  it("scales the vertical travel by the y factor", () => {
    const s = createSkills();
    startSkill(s, "stepover", true, 0, -1);
    const moved = run(s, 1);
    expect(moved.y).toBeCloseTo(-SKILLS.stepover.move * MOVE.yFactor, 1);
  });

  it("starts and ends with no speed (eased travel)", () => {
    const s = createSkills();
    startSkill(s, "roulette", true, 1, 0);
    stepSkills(s, DT);
    const first = s.stepX;
    run(s, 0.25);
    stepSkills(s, DT);
    const mid = s.stepX;
    expect(first).toBeLessThan(mid * 0.2);
  });

  it("picks the clip direction: up for an upward facing, side (mirrored to the left) otherwise", () => {
    const s = createSkills();
    startSkill(s, "stepover", true, 0, -1);
    expect(skillPose(s)).toMatchObject({ clip: "skill_stepover", dir: "up", mirror: false });
    cancelSkill(s);
    s.cooldown = 0;
    startSkill(s, "stepover", true, -1, 0.2);
    expect(skillPose(s)).toMatchObject({ dir: "side", mirror: true });
    cancelSkill(s);
    s.cooldown = 0;
    // facing down has no clip of its own: it plays the side clip
    startSkill(s, "stepover", true, 0.3, 1);
    expect(skillPose(s)).toMatchObject({ dir: "side", mirror: false });
  });

  it("spreads the four frames over the duration and hops only for the rainbow", () => {
    const s = createSkills();
    startSkill(s, "rainbow", true, 1, 0);
    expect(skillPose(s)!.frame).toBe(0);
    run(s, SKILLS.rainbow.duration * 0.5);
    expect(skillPose(s)!.frame).toBe(2);
    expect(skillHop(s)).toBeGreaterThan(SKILLS.rainbow.hop * 0.9);
    const t = createSkills();
    startSkill(t, "stepover", true, 1, 0);
    run(t, 0.2);
    expect(skillHop(t)).toBe(0);
  });
});

describe("skills: whiff, cooldown, cancel", () => {
  it("a move without the ball is a whiff: animation only, no travel, no style", () => {
    const s = createSkills();
    const start = startSkill(s, "elastico", false, 1, 0)!;
    expect(start.whiff).toBe(true);
    expect(start.gain).toBe(0);
    const moved = run(s, 1);
    expect(moved).toEqual({ x: 0, y: 0 });
    expect(s.style).toBe(0);
    expect(s.combo).toBe(0);
  });

  it("a whiff does not extend the chain window", () => {
    const s = createSkills();
    play(s, "stepover");
    run(s, STYLE.chainWindow - 0.3);
    startSkill(s, "roulette", false, 1, 0); // whiff
    run(s, 1.2);
    // the 2.0s window since the first move has passed even though the whiff restarted the animation
    const start = startSkill(s, "roulette", true, 1, 0)!;
    expect(start.chained).toBe(false);
  });

  it("refuses a second move while one runs and for 0.5s after it ends", () => {
    const s = createSkills();
    expect(startSkill(s, "stepover", true, 1, 0)).not.toBeNull();
    expect(startSkill(s, "roulette", true, 1, 0)).toBeNull();
    run(s, SKILLS.stepover.duration + DT);
    expect(s.active).toBeNull();
    expect(startSkill(s, "roulette", true, 1, 0)).toBeNull();
    run(s, STYLE.cooldown - 0.05);
    expect(startSkill(s, "roulette", true, 1, 0)).toBeNull();
    run(s, 0.1);
    expect(startSkill(s, "roulette", true, 1, 0)).not.toBeNull();
  });

  it("opens the shot-cancel window for the last 0.15s only", () => {
    const s = createSkills();
    startSkill(s, "roulette", true, 1, 0);
    run(s, SKILLS.roulette.duration - STYLE.cancelWindow - 0.05);
    expect(canCancelSkill(s)).toBe(false);
    run(s, 0.1);
    expect(canCancelSkill(s)).toBe(true);
    cancelSkill(s);
    expect(s.active).toBeNull();
    expect(canCancelSkill(s)).toBe(false);
  });
});

describe("skills: style gauge", () => {
  it("adds each move's style value", () => {
    const s = createSkills();
    expect(play(s, "stepover")!.gain).toBe(25);
    expect(s.style).toBe(25);
  });

  it("chains a different move within 2.0s at ×1.5 and lights the combo pips", () => {
    const s = createSkills();
    play(s, "stepover"); // +25
    run(s, 0.6); // cooldown
    const second = play(s, "roulette")!; // 35 × 1.5
    expect(second.chained).toBe(true);
    expect(second.gain).toBeCloseTo(52.5);
    expect(s.combo).toBe(2);
    expect(s.style).toBeCloseTo(77.5);
  });

  it("the same move again inside the window counts ×0.5 and adds no pip", () => {
    const s = createSkills();
    play(s, "stepover");
    run(s, 0.6);
    const again = play(s, "stepover")!;
    expect(again.repeated).toBe(true);
    expect(again.gain).toBeCloseTo(12.5);
    expect(s.combo).toBe(1);
  });

  it("a move after the window is a fresh start with no bonus", () => {
    const s = createSkills();
    play(s, "stepover");
    run(s, STYLE.chainWindow + 0.1);
    expect(s.combo).toBe(0);
    const later = play(s, "roulette")!;
    expect(later.chained).toBe(false);
    expect(later.gain).toBe(35);
    expect(s.combo).toBe(1);
  });

  it("caps at 100 and at five pips", () => {
    const s = createSkills();
    const order: SkillId[] = ["stepover", "roulette", "rainbow", "elastico", "stepover", "roulette"];
    for (const id of order) {
      play(s, id);
      run(s, 0.6);
    }
    expect(s.style).toBe(STYLE.max);
    expect(s.combo).toBe(STYLE.pips);
  });

  it("holds for 2.0s after the last gain, then drains 15 per second", () => {
    const s = createSkills();
    play(s, "elastico"); // 50
    s.sinceGain = 0;
    run(s, STYLE.decayDelay - 0.1);
    expect(s.style).toBe(50);
    run(s, 0.1 + 1);
    expect(s.style).toBeCloseTo(50 - STYLE.decayPerSecond, 0);
    run(s, 10);
    expect(s.style).toBe(0);
  });

  it("does not drain while held (aiming a shot)", () => {
    const s = createSkills();
    play(s, "elastico");
    run(s, 5, true);
    expect(s.style).toBe(50);
  });

  it("maps the gauge to the keeper Tier at 50 and 80", () => {
    expect([0, 49.9, 50, 79.9, 80, 100].map(tierOf)).toEqual([0, 0, 1, 1, 2, 2]);
    const s = createSkills();
    s.style = 55;
    expect(styleTierOf(s)).toBe(1);
  });

  it("reports the Tier crossing of the move that caused it", () => {
    const s = createSkills();
    const first = play(s, "roulette")!; // 35
    expect([first.tierBefore, first.tierAfter]).toEqual([0, 0]);
    run(s, 0.6);
    const second = play(s, "elastico")!; // + 75 → 100
    expect([second.tierBefore, second.tierAfter]).toEqual([0, 2]);
  });

  it("consumeStyle returns the standing Tier and empties the gauge and chain", () => {
    const s = createSkills();
    play(s, "elastico");
    run(s, 0.6);
    play(s, "roulette");
    expect(styleTierOf(s)).toBe(2);
    expect(consumeStyle(s)).toBe(2);
    expect(s.style).toBe(0);
    expect(s.combo).toBe(0);
    expect(styleTierOf(s)).toBe(0);
  });
});
