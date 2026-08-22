import type { OneVsOneApplicationView } from "../shared/model.js";
import { soopChannelUrl } from "../shared/model.js";
import { DEFAULT_ONE_VS_ONE_CONFIG } from "../shared/one-vs-one-results.js";
import { formatCafePostDate } from "../shared/dates.js";
import { Avatar } from "./cardVisuals";
import { formatDateTime } from "./formatters";
import { CafeLink, Modal, SoopLink, useEscape } from "./Modal";

type ResultStampTone = "pass" | "warn" | "fail";

const RESULT_STAMP_LABELS: Record<ResultStampTone, string> = {
  pass: "합격 충족",
  warn: "조건 필요",
  fail: "불투명",
};

function resultStampTone(result: {
  candidateScore: number;
  woowakgoodScore: number;
}): ResultStampTone {
  const gap = result.woowakgoodScore - result.candidateScore;
  if (gap <= 5) return "pass";
  if (gap <= 9) return "warn";
  return "fail";
}

function ResultStamp({
  result,
  className = "",
}: {
  result: { candidateScore: number; woowakgoodScore: number };
  className?: string;
}) {
  const tone = resultStampTone(result);
  return (
    <span
      className={`result-stamp result-stamp--${tone} ${className}`}
      aria-hidden="true"
    >
      {RESULT_STAMP_LABELS[tone]}
    </span>
  );
}

export function EvaluationCard({
  application,
  onOpen,
}: {
  application: OneVsOneApplicationView;
  onOpen: () => void;
}) {
  const result = application.result;
  return (
    <article className="evaluation-card">
      <div
        className={`evaluation-card__body ${result ? "evaluation-card--completed" : ""}`}
      >
        <button
          className="evaluation-card__main"
          onClick={onOpen}
          aria-label={`${application.displayName} 1대1 평가 상세 보기`}
        >
          <Avatar {...application} />
          <span>
            <strong>{application.displayName}</strong>
            <small>
              {application.cafeAuthor} · 신청{" "}
              {formatCafePostDate(application.publishedAt)}
            </small>
          </span>
          <b className={`evaluation-status ${result ? "done" : "waiting"}`}>
            {result ? "대결 완료" : "대결 전"}
          </b>
        </button>
        {result && (
          <button className="evaluation-result" onClick={onOpen}>
            <span>
              {result.candidateScore} : {result.woowakgoodScore}
            </span>
            <strong>{result.verdict}</strong>
            <small>{formatDateTime(result.playedAt)}</small>
          </button>
        )}
        <div className="evaluation-card__actions">
          <CafeLink href={application.articleUrl} label="신청글" />
        </div>
      </div>
      {result && <ResultStamp result={result} className="result-stamp--card" />}
    </article>
  );
}

export function EvaluationModal({
  application,
  onClose,
}: {
  application: OneVsOneApplicationView;
  onClose: () => void;
}) {
  const opponent = DEFAULT_ONE_VS_ONE_CONFIG.opponent;
  const result = application.result;
  useEscape(onClose);
  return (
    <Modal
      onClose={onClose}
      label="1대1 평가 상세"
      header={
        <div className="modal__identity">
          <span className="avatar-frame">
            <Avatar {...application} />
            {result && (
              <ResultStamp result={result} className="result-stamp--modal" />
            )}
          </span>
          <div>
            <span className="eyebrow">ONE VS ONE APPLICATION</span>
            <h2>{application.displayName}</h2>
            <p>
              {application.cafeAuthor} · 신청{" "}
              {formatCafePostDate(application.publishedAt)}
            </p>
          </div>
        </div>
      }
    >
      <div className="report">
        <span>{application.category}</span>
        <h3>{application.title}</h3>
      </div>
      {result ? (
        <section className="scoreboard">
          <p className="eyebrow">MATCH RESULT</p>
          <div className="scoreboard__players">
            <span>{application.displayName}</span>
            <span>{opponent.displayName}</span>
          </div>
          <strong>
            {result.candidateScore}
            <i>:</i>
            {result.woowakgoodScore}
          </strong>
          <time>대결 일시 · {formatDateTime(result.playedAt)}</time>
          <div className="verdict">
            <b>{result.verdict}</b>
            <p>{result.detail}</p>
            {result.note && <small>{result.note}</small>}
          </div>
        </section>
      ) : (
        <p className="empty-detail">
          대결 결과가 아직 등록되지 않았습니다. 결과가 확정되면 이 카드에 공지
          기준 판정이 표시됩니다.
        </p>
      )}
      <div className="actions">
        <CafeLink href={application.articleUrl} label="신청글" />
        {application.soopId && (
          <SoopLink href={soopChannelUrl(application.soopId)!}>방송국</SoopLink>
        )}
      </div>
    </Modal>
  );
}
