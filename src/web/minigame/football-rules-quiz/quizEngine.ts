import { FOOTBALL_RULES_QUIZ_QUESTIONS } from "./quizData.js";

export type FootballRulesQuizPhase = "intro" | "question" | "result";

export type FootballRulesQuizState = {
  phase: FootballRulesQuizPhase;
  questionIndex: number;
  score: number;
  selectedIndex: number | null;
};

export type FootballRulesQuizGrade = {
  minScore: number;
  maxScore: number;
  title: string;
  subtitle: string;
  illustration: string;
};

export const FOOTBALL_RULES_QUIZ_GRADES: readonly FootballRulesQuizGrade[] = [
  { minScore: 0, maxScore: 2, title: "규정 새싹", subtitle: "한 걸음씩 익히면 다음 킥오프는 더 자신 있어요!", illustration: "/football-rules-quiz-grade-01.webp" },
  { minScore: 3, maxScore: 5, title: "전술 루키", subtitle: "기본 규정을 잡았어요. 이제 판정 흐름도 읽어 보세요!", illustration: "/football-rules-quiz-grade-02.webp" },
  { minScore: 6, maxScore: 8, title: "그라운드 분석관", subtitle: "경기 속 디테일을 보는 눈이 예리합니다!", illustration: "/football-rules-quiz-grade-03.webp" },
  { minScore: 9, maxScore: 10, title: "판정 마스터", subtitle: "웬만한 상황은 휘슬보다 먼저 읽겠는데요?", illustration: "/football-rules-quiz-grade-04.webp" },
  { minScore: 11, maxScore: 11, title: "IFAB 퍼펙트", subtitle: "11문항 올킬! 오늘의 규정 심판은 바로 당신입니다.", illustration: "/football-rules-quiz-grade-05.webp" },
];

export function createFootballRulesQuizState(): FootballRulesQuizState {
  return { phase: "intro", questionIndex: 0, score: 0, selectedIndex: null };
}

export function startFootballRulesQuiz(): FootballRulesQuizState {
  return { phase: "question", questionIndex: 0, score: 0, selectedIndex: null };
}

export function chooseFootballRulesQuizAnswer(state: FootballRulesQuizState, optionIndex: number): FootballRulesQuizState {
  const question = FOOTBALL_RULES_QUIZ_QUESTIONS[state.questionIndex];
  if (state.phase !== "question" || state.selectedIndex !== null || !question || optionIndex < 0 || optionIndex >= question.options.length) return state;
  return { ...state, selectedIndex: optionIndex, score: state.score + (optionIndex === question.answerIndex ? 1 : 0) };
}

export function advanceFootballRulesQuiz(state: FootballRulesQuizState): FootballRulesQuizState {
  if (state.phase !== "question" || state.selectedIndex === null) return state;
  if (state.questionIndex === FOOTBALL_RULES_QUIZ_QUESTIONS.length - 1) return { ...state, phase: "result", selectedIndex: null };
  return { ...state, questionIndex: state.questionIndex + 1, selectedIndex: null };
}

export function gradeFootballRulesQuiz(score: number): FootballRulesQuizGrade {
  return FOOTBALL_RULES_QUIZ_GRADES.find((grade) => score >= grade.minScore && score <= grade.maxScore) ?? FOOTBALL_RULES_QUIZ_GRADES[0];
}

