import { BadgeCheck, CirclePile, List, Minus, Plus, RefreshCw, Rows3, Shield, TrendingUp } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { hexToRgba } from "./cardVisuals";
import { DivisionHistogram } from "./DivisionHistogram";
import { CARD_ZOOM_MAX, CARD_ZOOM_MIN } from "./storage";

export function ViewToolbar({
  divisionStats,
  streamersForHistogram,
  excludedNames,
  viewMode,
  onViewModeChange,
  cardViewDiscovered,
  growthGraphDiscovered,
  cardZoom,
  onZoomIn,
  onZoomOut,
  sortMode,
  onSortModeChange,
  onSquadBuilderOpen,
  onPassAnnouncementOpen,
  onGrowthGraphOpen,
  onRefresh,
  refreshing,
}: {
  divisionStats: {
    fourOrHigher: number;
    fiveOrHigher: number;
    sixOrHigher: number;
    sevenOrHigher: number;
  };
  streamersForHistogram: StreamerRecord[];
  excludedNames: string[];
  viewMode: "list" | "table" | "card";
  onViewModeChange: (mode: "list" | "table" | "card") => void;
  cardViewDiscovered: boolean;
  growthGraphDiscovered: boolean;
  cardZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  sortMode: "division" | "winRate";
  onSortModeChange: (mode: "division" | "winRate") => void;
  onSquadBuilderOpen: () => void;
  onPassAnnouncementOpen: () => void;
  onGrowthGraphOpen: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <section className="view-toolbar" aria-label="보기 설정">
      <div className="division-summary" aria-label="신청 현황 요약">
        {excludedNames.length > 0 && (
          <small className="division-summary__note">
            * 모든 통계에서 {excludedNames.map(name => name + '님').join(", ")}은 제외됩니다.
          </small>
        )}
        <div
          className="division-summary__stats division-summary__stats--pass"
          aria-label="1차 합격 기준 요약"
        >
          <div className="division-summary__item division-summary__item--pass4">
            <div>
              <strong>{divisionStats.fourOrHigher}</strong>
              <span>4부 이상</span>
            </div>
          </div>
          <div className="division-summary__item division-summary__item--pass5">
            <div>
              <strong>{divisionStats.fiveOrHigher}</strong>
              <span>5부 이상</span>
            </div>
          </div>
          <div className="division-summary__item division-summary__item--pass6">
            <div>
              <strong>{divisionStats.sixOrHigher}</strong>
              <span>6부 이상</span>
            </div>
          </div>
          <div className="division-summary__item division-summary__item--pass7">
            <div>
              <strong>{divisionStats.sevenOrHigher}</strong>
              <span>7부 이상</span>
            </div>
          </div>
        </div>
        <div className="division-summary__chart-group">
          <DivisionHistogram
            streamers={streamersForHistogram}
            excludedNames={excludedNames}
          />
          <button
            type="button"
            className={`growth-graph-toggle ${
              growthGraphDiscovered
                ? ""
                : "fancy-border view-toggle-card--attention"
            }`}
            onClick={onGrowthGraphOpen}
            aria-label="디비전 성장 그래프 보기"
            style={
              growthGraphDiscovered
                ? undefined
                : ({
                    "--fancy-color": "#ffb454",
                    "--fancy-glow-soft": hexToRgba("#ffb454", 0.4),
                    "--fancy-glow-strong": hexToRgba("#ffb454", 0.85),
                  } as React.CSSProperties)
            }
          >
            <TrendingUp aria-hidden="true" /> <span>성장 그래프</span>
            {!growthGraphDiscovered && (
              <span className="view-toggle-card__sparks" aria-hidden="true">
                <i className="view-toggle-card__spark view-toggle-card__spark--1">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--2">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--3">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--4">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--5">
                  ✦
                </i>
              </span>
            )}
          </button>
        </div>
      </div>
      <div className="view-toolbar__controls">
        {viewMode === "card" && (
          <div className="segmented segmented--zoom">
            <button
              onClick={onZoomOut}
              disabled={cardZoom <= CARD_ZOOM_MIN}
              aria-label="카드 축소"
            >
              <Minus aria-hidden="true" />
            </button>
            <button
              onClick={onZoomIn}
              disabled={cardZoom >= CARD_ZOOM_MAX}
              aria-label="카드 확대"
            >
              <Plus aria-hidden="true" />
            </button>
          </div>
        )}
        {viewMode === "card" && (
          <div className="segmented">
            <button
              className={sortMode === "division" ? "active" : ""}
              onClick={() => onSortModeChange("division")}
              aria-pressed={sortMode === "division"}
            >
              디비전순
            </button>
            <button
              className={sortMode === "winRate" ? "active" : ""}
              onClick={() => onSortModeChange("winRate")}
              aria-pressed={sortMode === "winRate"}
            >
              승률순
            </button>
          </div>
        )}
        <button
          type="button"
          className="squad-builder-toggle"
          onClick={onSquadBuilderOpen}
        >
          <CirclePile aria-hidden="true" />
          <span>나만의 스쿼드 빌더</span>
        </button>
        <button
          type="button"
          className="pass-announcement-toggle"
          onClick={onPassAnnouncementOpen}
        >
          <BadgeCheck aria-hidden="true" />
          <span>합격자 발표</span>
        </button>
        <div className="segmented segmented--view-mode">
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="목록 보기"
          >
            <List aria-hidden="true" />
          </button>
          <button
            className={viewMode === "table" ? "active" : ""}
            onClick={() => onViewModeChange("table")}
            aria-pressed={viewMode === "table"}
            aria-label="표로 보기"
          >
            <Rows3 aria-hidden="true" />
          </button>
          <button
            className={`segmented__card-view-toggle ${
              viewMode === "card" ? "active" : ""
            } ${cardViewDiscovered ? "" : "fancy-border view-toggle-card--attention"}`}
            onClick={() => onViewModeChange("card")}
            aria-pressed={viewMode === "card"}
            style={
              cardViewDiscovered
                ? undefined
                : ({
                    "--fancy-color": "#00e9ae",
                    "--fancy-glow-soft": hexToRgba("#00e9ae", 0.4),
                    "--fancy-glow-strong": hexToRgba("#00e9ae", 0.85),
                  } as React.CSSProperties)
            }
          >
            <Shield aria-hidden="true" />
            <span>카드뷰로 보기</span>
            {!cardViewDiscovered && (
              <span className="view-toggle-card__sparks" aria-hidden="true">
                <i className="view-toggle-card__spark view-toggle-card__spark--1">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--2">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--3">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--4">
                  ✦
                </i>
                <i className="view-toggle-card__spark view-toggle-card__spark--5">
                  ✦
                </i>
              </span>
            )}
          </button>
        </div>
        <button
          type="button"
          className="view-toolbar__refresh"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="새로고침"
          title="새로고침"
        >
          <RefreshCw
            aria-hidden="true"
            className={refreshing ? "view-toolbar__refresh-icon--spinning" : ""}
          />
        </button>
      </div>
    </section>
  );
}
