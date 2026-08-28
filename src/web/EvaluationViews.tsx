import type { OneVsOneApplicationView } from "../shared/model.js";
import { soopChannelUrl } from "../shared/model.js";
import { ADDITIONAL_VERDICT_CRITERIA } from "../shared/one-vs-one.js";
import { DEFAULT_ONE_VS_ONE_CONFIG } from "../shared/one-vs-one-results.js";
import { formatCafePostDate } from "../shared/dates.js";
import { Avatar } from "./cardVisuals";
import { formatDateTime } from "./formatters";
import { CafeLink, Modal, SoopLink, useEscape } from "./Modal";

type ResultStampTone = "pass" | "warn" | "fail" | "ignored";

const RESULT_STAMP_LABELS: Record<ResultStampTone, string> = {
  pass: "합격 충족",
  warn: "조건 필요",
  fail: "불투명",
  ignored: "무시",
};

function resultStampTone(result: {
  ignored?: boolean;
  candidateScore?: number;
  woowakgoodScore?: number;
}): ResultStampTone {
  if (result.ignored) return "ignored";
  const gap = (result.woowakgoodScore ?? 0) - (result.candidateScore ?? 0);
  if (gap <= 5) return "pass";
  if (gap <= 9) return "warn";
  return "fail";
}

function ResultStamp({
  result,
  className = "",
}: {
  result: { ignored?: boolean; candidateScore?: number; woowakgoodScore?: number };
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
    <article
      className="evaluation-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      aria-label={`${application.displayName} 1대1 평가 상세 보기`}
    >
      <div
        className={`evaluation-card__body ${result ? "evaluation-card--completed" : ""}`}
      >
        <div className="evaluation-card__main">
          <Avatar {...application} />
          <span>
            <strong>{application.displayName}</strong>
            <small>
              {application.cafeAuthor} · 신청{" "}
              {formatCafePostDate(application.publishedAt)}
            </small>
          </span>
          <b
            className={`evaluation-status ${result ? (result.ignored ? "ignored" : "done") : "waiting"}`}
          >
            {result ? (result.ignored ? "무시" : "대결 완료") : "대결 전"}
          </b>
        </div>
        {result && !result.ignored && (
          <div className="evaluation-result">
            <span>
              {result.candidateScore} : {result.woowakgoodScore}
            </span>
            <strong>{result.verdict}</strong>
            <small>{formatDateTime(result.playedAt)}</small>
          </div>
        )}
        <div
          className="evaluation-card__actions"
          onClick={(event) => event.stopPropagation()}
        >
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
      {result && !result.ignored ? (
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
            {result.detail.includes("나머지 4개 기준") && (
              <ul className="verdict__criteria">
                {ADDITIONAL_VERDICT_CRITERIA.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            )}
            {result.note && <small>{result.note}</small>}
          </div>
        </section>
      ) : result?.ignored ? (
        <p className="empty-detail">
          이 신청은 대결하지 않고 무시 처리되었습니다.
          {result.note && ` (${result.note})`}
        </p>
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
