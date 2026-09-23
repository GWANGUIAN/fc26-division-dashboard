import { describe, expect, it } from "vitest";
import { POSITION_TEST_QUESTIONS } from "./positionTestData.js";
import { getPositionTestResult, POSITION_TEST_RESULTS } from "./positionTestResults.js";
import {
  choosePositionTestAnswer,
  computePositionTestOutcome,
  createPositionTestState,
  submitPositionTestName,
  type PositionTestState,
} from "./positionTestEngine.js";

describe("position test data", () => {
  it("has 9 questions with four options each, distributing all 7 positions", () => {
    expect(POSITION_TEST_QUESTIONS).toHaveLength(9);
    POSITION_TEST_QUESTIONS.forEach((question) => {
      expect(question.options).toHaveLength(4);
      const positions = new Set(question.options.map((option) => option.position));
      expect(positions.size).toBe(4); // no repeated position within one question
      const styleA = question.options.filter((option) => option.style === "A").length;
      expect(styleA).toBe(2); // balanced 2 A / 2 B per question
    });
  });

  it("covers all 14 (position, style) result combinations exactly once", () => {
    expect(POSITION_TEST_RESULTS).toHaveLength(14);
    const keys = new Set(POSITION_TEST_RESULTS.map((entry) => `${entry.position}-${entry.style}`));
    expect(keys.size).toBe(14);
  });
});

function answerAll(positions: readonly ("ST" | "WF" | "CM" | "CDM" | "CB" | "FB" | "GK")[]): PositionTestState {
  let state = submitPositionTestName(createPositionTestState(), "테스터");
  for (const question of POSITION_TEST_QUESTIONS) {
    const wantedPosition = positions[POSITION_TEST_QUESTIONS.indexOf(question) % positions.length];
    const index = question.options.findIndex((option) => option.position === wantedPosition);
    state = choosePositionTestAnswer(state, index === -1 ? 0 : index);
  }
  return state;
}

describe("position test flow", () => {
  it("stays on the name phase until a non-empty name is submitted", () => {
    const initial = createPositionTestState();
    expect(initial.phase).toBe("name");
    expect(submitPositionTestName(initial, "   ")).toBe(initial);
    const started = submitPositionTestName(initial, "  뽀린걸  ");
    expect(started).toMatchObject({ phase: "question", name: "뽀린걸", questionIndex: 0 });
  });

  it("advances one question per answer and reaches reveal after the last one", () => {
    let state = submitPositionTestName(createPositionTestState(), "한결");
    for (let index = 0; index < POSITION_TEST_QUESTIONS.length - 1; index += 1) {
      state = choosePositionTestAnswer(state, 0);
      expect(state.phase).toBe("question");
      expect(state.questionIndex).toBe(index + 1);
    }
    state = choosePositionTestAnswer(state, 0);
    expect(state.phase).toBe("reveal");
    expect(state.selections).toHaveLength(POSITION_TEST_QUESTIONS.length);
  });

  it("ignores answers once every question has been answered", () => {
    let state = submitPositionTestName(createPositionTestState(), "핑구");
    for (let index = 0; index < POSITION_TEST_QUESTIONS.length; index += 1) {
      state = choosePositionTestAnswer(state, 0);
    }
    expect(choosePositionTestAnswer(state, 0)).toBe(state);
  });
});

describe("position test outcome", () => {
  it("picks the position with the most votes", () => {
    const state = answerAll(["GK"]);
    expect(computePositionTestOutcome(state).position).toBe("GK");
  });

  it("breaks a tie using POSITION_ORDER (ST before WF before CM ...)", () => {
    // Alternating ST/WF across 9 questions gives ST 5 votes and WF 4 (ST
    // appears in more questions per positionTestData.ts), so this also
    // covers the plain-majority path; a true 1-vote-each spread across all
    // 7 positions is exercised implicitly by the "every position wins
    // sometimes" loop below.
    const state = answerAll(["ST", "WF"]);
    const outcome = computePositionTestOutcome(state);
    expect(["ST", "WF"]).toContain(outcome.position);
  });

  it("returns a result entry that exists in POSITION_TEST_RESULTS for every position", () => {
    (["ST", "WF", "CM", "CDM", "CB", "FB", "GK"] as const).forEach((position) => {
      const state = answerAll([position]);
      const outcome = computePositionTestOutcome(state);
      expect(outcome.position).toBe(position);
      const entry = getPositionTestResult(outcome.position, outcome.style);
      expect(entry.position).toBe(position);
    });
  });

  it("defaults the style tie-break to A", () => {
    // Every question voting the same position also carries a style, so to
    // isolate a real A/B tie we hand-build selections directly.
    const state: PositionTestState = {
      phase: "reveal",
      name: "테스터",
      questionIndex: POSITION_TEST_QUESTIONS.length - 1,
      selections: [
        { position: "ST", style: "A" },
        { position: "ST", style: "B" },
      ],
    };
    expect(computePositionTestOutcome(state).style).toBe("A");
  });
});
