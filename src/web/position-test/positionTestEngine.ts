// Pure state machine for "나의 축구 포지션은?" — mirrors
// minigame/football-rules-quiz/quizEngine.ts's phase-based, no-React-inside
// shape, but tallies votes across all 9 questions instead of summing a
// graded score (this quiz has no right/wrong answers).

import { POSITION_TEST_QUESTIONS, type PositionCode, type PositionTestStyle } from "./positionTestData";

export type PositionTestPhase = "name" | "question" | "reveal";

export interface PositionTestSelection {
  position: PositionCode;
  style: PositionTestStyle;
}

export interface PositionTestState {
  phase: PositionTestPhase;
  name: string;
  questionIndex: number;
  selections: readonly PositionTestSelection[];
}

/** Tie-break order when two positions end up with the same vote count. */
export const POSITION_ORDER: readonly PositionCode[] = ["ST", "WF", "CM", "CDM", "CB", "FB", "GK"];

export function createPositionTestState(): PositionTestState {
  return { phase: "name", name: "", questionIndex: 0, selections: [] };
}

export function submitPositionTestName(state: PositionTestState, name: string): PositionTestState {
  const trimmed = name.trim();
  if (state.phase !== "name" || !trimmed) return state;
  return { ...state, phase: "question", name: trimmed };
}

export function choosePositionTestAnswer(state: PositionTestState, optionIndex: number): PositionTestState {
  const question = POSITION_TEST_QUESTIONS[state.questionIndex];
  if (state.phase !== "question" || !question || optionIndex < 0 || optionIndex >= question.options.length) return state;
  const option = question.options[optionIndex];
  const selections = [...state.selections, { position: option.position, style: option.style }];
  const isLastQuestion = state.questionIndex === POSITION_TEST_QUESTIONS.length - 1;
  return {
    ...state,
    phase: isLastQuestion ? "reveal" : "question",
    questionIndex: isLastQuestion ? state.questionIndex : state.questionIndex + 1,
    selections,
  };
}

export function restartPositionTest(): PositionTestState {
  return createPositionTestState();
}

export interface PositionTestOutcome {
  position: PositionCode;
  style: PositionTestStyle;
}

/**
 * Tallies every selection's `position` votes and picks the winner (ties
 * broken by POSITION_ORDER), then tallies `style` A/B only among the
 * selections that voted for that winning position (ties broken to "A") —
 * so the theme reflects *why* that position won rather than the whole
 * quiz's overall style lean.
 */
export function computePositionTestOutcome(state: PositionTestState): PositionTestOutcome {
  const positionVotes = new Map<PositionCode, number>();
  for (const selection of state.selections) {
    positionVotes.set(selection.position, (positionVotes.get(selection.position) ?? 0) + 1);
  }

  let winningPosition: PositionCode = POSITION_ORDER[0];
  let winningVotes = -1;
  for (const position of POSITION_ORDER) {
    const votes = positionVotes.get(position) ?? 0;
    if (votes > winningVotes) {
      winningVotes = votes;
      winningPosition = position;
    }
  }

  let styleAVotes = 0;
  let styleBVotes = 0;
  for (const selection of state.selections) {
    if (selection.position !== winningPosition) continue;
    if (selection.style === "A") styleAVotes += 1;
    else styleBVotes += 1;
  }

  return { position: winningPosition, style: styleBVotes > styleAVotes ? "B" : "A" };
}
