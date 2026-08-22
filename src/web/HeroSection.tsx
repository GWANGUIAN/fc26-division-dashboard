import type { DashboardSnapshot } from "../shared/model.js";
import { formatDateTime } from "./formatters";

export function HeroSection({
  isDivision,
  snapshot,
}: {
  isDivision: boolean;
  snapshot?: DashboardSnapshot;
}) {
  return (
    <section className="hero" id="top">
      <div>
        <p className="eyebrow">
          FC26 ·{" "}
          {isDivision ? "SEASON DIVISION BOARD" : "ONE VS ONE EVALUATION"}
        </p>
        <h1>
          {isDivision ? (
            <>
              <span className="hero-title__line hero-title__line--1">
                잰디 <mark>동아리 후보</mark>
              </span>
              <br />
              <span className="hero-title__line hero-title__line--2">
                대시보드
                <img
                  className="hero-ball"
                  src="/soccer_ball.webp"
                  alt=""
                  aria-hidden="true"
                />
                <span className="hero-ball-impact" aria-hidden="true" />
              </span>
            </>
          ) : (
            <>
              <span className="hero-title__line hero-title__line--1">
                1:1 <mark>평가 신청</mark>
              </span>
              <br />
              <span className="hero-title__line hero-title__line--2">
                현황
              </span>
            </>
          )}
        </h1>
        <p className="intro">
          {isDivision
            ? "왁물원에 보고된 FC26 디비전 승격 현황을 추적합니다."
            : "1대1 평가 신청 게시글과 대결 결과를 표시합니다."}
        </p>
      </div>
      <div className="sync">
        <span className="sync-dot" /> <b>3 MINUTE REFRESH</b>
        <small>
          <span className="refresh-icon" aria-hidden="true">
            ↻
          </span>{" "}
          3분마다 갱신 ·{" "}
          {snapshot
            ? `${formatDateTime(snapshot.generatedAt)} 기준`
            : "데이터 연결 중"}
        </small>
      </div>
    </section>
  );
}
