import { useEffect, useRef, useState } from "react";
import type { DashboardSnapshot } from "../shared/model.js";
import { formatDateTime } from "./formatters";

const STALE_THRESHOLD_MS = 12 * 60_000;

export function HeroSection({
  isDivision,
  snapshot,
}: {
  isDivision: boolean;
  snapshot?: DashboardSnapshot;
}) {
  const [now] = useState(() => Date.now());
  const heroRef = useRef<HTMLElement>(null);
  const [animKey, setAnimKey] = useState(0);
  const wasVisible = useRef(true);

  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!wasVisible.current) {
            setAnimKey((key) => key + 1);
          }
          wasVisible.current = true;
        } else {
          wasVisible.current = false;
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isStale = Boolean(
    snapshot &&
      now - new Date(snapshot.generatedAt).getTime() >= STALE_THRESHOLD_MS,
  );

  return (
    <section className="hero" id="top" ref={heroRef}>
      <div>
        <p className="eyebrow">
          FC26 ·{" "}
          {isDivision ? "SEASON DIVISION BOARD" : "ONE VS ONE EVALUATION"}
        </p>
        <h1 key={animKey}>
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
                <img
                  className="hero-ball"
                  src="/soccer_ball.webp"
                  alt=""
                  aria-hidden="true"
                />
                <span className="hero-ball-impact" aria-hidden="true" />
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
      <div className={`sync${isStale ? " sync--stale" : ""}`}>
        <span className={`sync-dot${isStale ? " bad" : ""}`} />{" "}
        <b>5 MINUTE REFRESH</b>
        <small>
          <span
            className={`refresh-icon${isStale ? " refresh-icon--bad" : ""}`}
            aria-hidden="true"
          >
            {isStale ? "⊘" : "↻"}
          </span>{" "}
          5분마다 자동 갱신 ·{" "}
          {snapshot
            ? `${formatDateTime(snapshot.generatedAt)} 기준`
            : "데이터 연결 중"}
          {isStale ? " · 갱신 지연됨, 확인이 필요합니다" : ""}
        </small>
      </div>
    </section>
  );
}
