import { useEffect, useState } from "react";
import type { StreamerRecord } from "../shared/model.js";
import geminiLogo from "./assets/gemini-logo.svg";

function AnimatedReviewText({ text }: { text: string }) {
  const [typedLength, setTypedLength] = useState(0);
  useEffect(() => {
    setTypedLength(0);
    const interval = setInterval(() => {
      setTypedLength((current) => {
        if (current >= text.length) {
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 10);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="gemini-review__text">
      {text.slice(0, typedLength)}
      {typedLength < text.length && (
        <span className="gemini-review__cursor" aria-hidden="true" />
      )}
    </p>
  );
}

export function GeminiReviewSection({
  review: rawReview,
  hasPost,
}: {
  review?: StreamerRecord["latestReview"];
  hasPost?: boolean;
}) {
  // The live API can briefly still return the pre-mild/spicy shape (just
  // `text`) while a deploy is in flight. Treat that the same as "not yet
  // reviewed" instead of crashing on a missing mild/spicy string.
  const review =
    rawReview &&
    typeof rawReview.mild === "string" &&
    typeof rawReview.spicy === "string"
      ? rawReview
      : undefined;
  return (
    <section className="gemini-review">
      <div className="gemini-review__header">
        <img className="gemini-review__logo" src={geminiLogo} alt="" />
        <h3>Gemini 한줄평</h3>
        {review && !review.isCurrent && (
          <span className="gemini-review__badge">이전 평가</span>
        )}
      </div>
      <p className="gemini-review__note">
        {review && !review.isCurrent
          ? "현재 게시글이 분석 조건을 달성하지 않았거나 분석이 생성 중이라 이전 한줄평이 대신 표시됩니다."
          : "왁물원에 승격 보고 게시글이 올라오고 전체 전적 분석이 성공하면 한줄평이 자동 생성됩니다."}
      </p>
      <p className="gemini-review__note">
        일부 스트리머는 미리 작성된 추가 정보도 같이 Gemini에게 전달됩니다.
      </p>
      {!review && hasPost && (
        <p className="gemini-review__note">
          인증샷에 전체 전적이 포함되어 있어야 AI가 이미지를 분석해서 전적을
          추출하고 한줄평을 생성합니다.
          <br />
          잘못된 인증샷을 올린 경우, 관리자가 수동 업데이트 할때까지 기다려주세요.
        </p>
      )}
      {review && (
        <>
          <div className="gemini-review__flavor">
            <span className="gemini-review__flavor-tag gemini-review__flavor-tag--mild">
              순한맛
            </span>
            <AnimatedReviewText text={review.mild} />
          </div>
          <div className="gemini-review__flavor">
            <span className="gemini-review__flavor-tag gemini-review__flavor-tag--spicy">
              매운맛
            </span>
            <AnimatedReviewText text={review.spicy} />
          </div>
        </>
      )}
    </section>
  );
}
