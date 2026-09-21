import { describe, expect, it } from "vitest";
import { FOOTBALL_RULES_QUIZ_QUESTIONS } from "./quizData.js";
import { advanceFootballRulesQuiz, chooseFootballRulesQuizAnswer, createFootballRulesQuizState, FOOTBALL_RULES_QUIZ_GRADES, gradeFootballRulesQuiz, startFootballRulesQuiz } from "./quizEngine.js";

describe("football rules quiz data", () => {
  it("has the fixed 11 questions with four valid answers", () => {
    expect(FOOTBALL_RULES_QUIZ_QUESTIONS).toHaveLength(11);
    FOOTBALL_RULES_QUIZ_QUESTIONS.forEach((question) => {
      expect(question.options).toHaveLength(4);
      expect(question.answerIndex).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex).toBeLessThan(question.options.length);
      expect(question.explanation).not.toHaveLength(0);
    });
  });
});

describe("football rules quiz flow", () => {
  it("locks a selected answer and only scores it once", () => {
    const started = startFootballRulesQuiz();
    const chosen = chooseFootballRulesQuizAnswer(started, FOOTBALL_RULES_QUIZ_QUESTIONS[0].answerIndex);
    expect(chosen.score).toBe(1);
    expect(chooseFootballRulesQuizAnswer(chosen, 0)).toBe(chosen);
  });

  it("moves on after a wrong answer and always exposes a selected result", () => {
    const started = startFootballRulesQuiz();
    const wrong = chooseFootballRulesQuizAnswer(started, 0);
    expect(wrong.selectedIndex).toBe(0);
    expect(advanceFootballRulesQuiz(wrong)).toMatchObject({ phase: "question", questionIndex: 1, score: 0, selectedIndex: null });
  });

  it("ends after question 11 and restart clears the attempt", () => {
    let state = startFootballRulesQuiz();
    for (let index = 0; index < FOOTBALL_RULES_QUIZ_QUESTIONS.length; index += 1) {
      state = chooseFootballRulesQuizAnswer(state, FOOTBALL_RULES_QUIZ_QUESTIONS[index].answerIndex);
      state = advanceFootballRulesQuiz(state);
    }
    expect(state).toMatchObject({ phase: "result", score: 11 });
    expect(startFootballRulesQuiz()).toEqual({ phase: "question", questionIndex: 0, score: 0, selectedIndex: null });
    expect(createFootballRulesQuizState().phase).toBe("intro");
  });
});

describe("football rules quiz grades", () => {
  it("covers every score without a gap or overlap", () => {
    for (let score = 0; score <= 11; score += 1) {
      expect(FOOTBALL_RULES_QUIZ_GRADES.filter((grade) => score >= grade.minScore && score <= grade.maxScore)).toHaveLength(1);
    }
  });

  it.each([[0, "규정 새싹"], [2, "규정 새싹"], [3, "전술 루키"], [5, "전술 루키"], [6, "그라운드 분석관"], [8, "그라운드 분석관"], [9, "판정 마스터"], [10, "판정 마스터"], [11, "IFAB 퍼펙트"]])("assigns %s points to %s", (score, title) => {
    expect(gradeFootballRulesQuiz(score).title).toBe(title);
  });
});
