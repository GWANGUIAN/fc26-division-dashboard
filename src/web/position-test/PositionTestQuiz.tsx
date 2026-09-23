import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { POSITION_TEST_QUESTIONS } from "./positionTestData";
import "./position-test-quiz.css";

const ANSWER_LABELS = ["A", "B", "C", "D"] as const;

/**
 * No-graded-answer question stepper — unlike football-rules-quiz's
 * correct/wrong feedback panel, picking an option here just advances
 * straight to the next question (or to the reveal phase), since this is a
 * personality tally, not a quiz with right answers.
 */
export function PositionTestQuiz({
  questionIndex,
  onAnswer,
}: {
  questionIndex: number;
  onAnswer: (optionIndex: number) => void;
}) {
  const [assetFailed, setAssetFailed] = useState<Set<string>>(() => new Set());
  const question = POSITION_TEST_QUESTIONS[questionIndex];
  if (!question) return null;

  const showArt = !assetFailed.has(question.illustration);
  const markAssetFailed = () => setAssetFailed((current) => new Set(current).add(question.illustration));

  return (
    <section className="position-test-quiz" key={question.id} aria-labelledby="position-test-question">
      <div className="position-test-quiz__progress" aria-label={`전체 ${POSITION_TEST_QUESTIONS.length}문항 중 ${questionIndex + 1}번 문제`}>
        <span>
          Q {String(questionIndex + 1).padStart(2, "0")} / {POSITION_TEST_QUESTIONS.length}
        </span>
        <div className="position-test-quiz__pips" aria-hidden="true">
          {POSITION_TEST_QUESTIONS.map((_, index) => (
            <i key={index} className={index === questionIndex ? "is-current" : index < questionIndex ? "is-done" : ""} />
          ))}
        </div>
      </div>

      <figure className="position-test-quiz__art">
        {showArt ? (
          <img src={question.illustration} alt="" onError={markAssetFailed} />
        ) : (
          <div className="position-test-quiz__art-fallback" role="img" aria-label="문항 일러스트 준비 중">
            <BookOpenCheck aria-hidden="true" />
          </div>
        )}
      </figure>

      <h3 id="position-test-question">{question.question}</h3>

      <div className="position-test-quiz__choices" role="group" aria-label="답안 선택지">
        {question.options.map((option, index) => (
          <button key={option.text} type="button" className="position-test-quiz__choice" onClick={() => onAnswer(index)}>
            <b>{ANSWER_LABELS[index]}</b>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
