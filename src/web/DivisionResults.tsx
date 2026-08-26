import { useState } from "react";
import { ChevronDown, CirclePile } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { divisionColor } from "../shared/division-theme.js";
import type { TrophyAwards } from "../shared/trophy.js";
import { divisions } from "./appHelpers";
import { CardBoard, StreamerCard } from "./StreamerCards";
import { StreamerTable } from "./StreamerTable";
import {
  CardResultsSkeleton,
  ListResultsSkeleton,
  TableResultsSkeleton,
} from "./ResultsSkeleton";
import {
  isUpdatedToday,
  loadDivision10Collapsed,
  saveDivision10Collapsed,
  seenKeyFor,
} from "./storage";

export function DivisionResults({
  viewMode,
  loading,
  streamers,
  cardStreamers,
  trophyAwards,
  seenKeys,
  onOpenStreamer,
  cardZoom,
  onZoomIn,
  onZoomOut,
  zoomMin,
  zoomMax,
  onSquadBuilderOpen,
  onOpenTrophy,
  hideEmptyDivisions,
  liveStreamerIds,
}: {
  viewMode: "list" | "table" | "card";
  loading?: boolean;
  streamers: StreamerRecord[];
  cardStreamers: StreamerRecord[];
  trophyAwards: TrophyAwards;
  seenKeys: Set<string>;
  onOpenStreamer: (streamer: StreamerRecord) => void;
  cardZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoomMin: number;
  zoomMax: number;
  onSquadBuilderOpen: () => void;
  onOpenTrophy: () => void;
  hideEmptyDivisions?: boolean;
  liveStreamerIds: Set<string>;
}) {
  const [division10Collapsed, setDivision10Collapsed] = useState(
    loadDivision10Collapsed,
  );
  const toggleDivision10 = () => {
    setDivision10Collapsed((current) => {
      const next = !current;
      saveDivision10Collapsed(next);
      return next;
    });
  };
  // hideEmptyDivisions is only ever set while a search query is active, so it
  // doubles as the "search in progress" signal here.
  const isSearching = Boolean(hideEmptyDivisions);

  if (loading) {
    return (
      <div className="results-wrap">
        {viewMode === "list" ? (
          <ListResultsSkeleton />
        ) : viewMode === "table" ? (
          <TableResultsSkeleton />
        ) : (
          <CardResultsSkeleton zoom={cardZoom} />
        )}
      </div>
    );
  }

  return (
    <div className="results-wrap">
      {viewMode === "list" ? (
        <section className="board" aria-label="FC26 디비전 보드">
          {isSearching && streamers.length === 0 && (
            <p className="empty-list">검색 결과가 없습니다.</p>
          )}
          {divisions.map((division) => {
            const entries = streamers.filter(
              (streamer) => streamer.currentDivision === division,
            );
            if (hideEmptyDivisions && entries.length === 0) return null;
            const isDivision10 = division === 10;
            const showEntries =
              !isDivision10 || isSearching || !division10Collapsed;
            return (
              <section
                className={`division division-${division}`}
                style={
                  {
                    "--division-color": divisionColor(division),
                  } as React.CSSProperties
                }
                key={division}
              >
                <div className="division__label">
                  <span>{division === 10 ? "SEASON" : "DIVISION"}</span>
                  <strong>{division}</strong>
                  {division === 10 && <small>미참여</small>}
                  {division <= 6 && (
                    <small className="division__label-tag division__label-tag--pass">
                      1차 합격 조건 충족
                    </small>
                  )}
                  {division === 7 && (
                    <small className="division__label-tag division__label-tag--conditional">
                      1차 조건부 합격
                    </small>
                  )}
                </div>
                <div
                  className={
                    showEntries &&
                    entries.length === 0 &&
                    !(isDivision10 && !isSearching)
                      ? "division__players division__players--empty"
                      : "division__players"
                  }
                >
                  {isDivision10 && !isSearching && (
                    <button
                      type="button"
                      className="division__players-toggle"
                      onClick={toggleDivision10}
                      aria-expanded={showEntries}
                    >
                      <ChevronDown aria-hidden="true" />
                      <span>
                        {showEntries
                          ? "접기"
                          : `${entries.length}명 접힘 · 펼쳐서 보기`}
                      </span>
                    </button>
                  )}
                  {showEntries &&
                    entries.map((streamer) => (
                      <StreamerCard
                        key={streamer.id}
                        streamer={streamer}
                        awards={trophyAwards}
                        isNew={
                          isUpdatedToday(streamer) &&
                          !seenKeys.has(seenKeyFor(streamer))
                        }
                        isLive={liveStreamerIds.has(streamer.id)}
                        onOpen={() => onOpenStreamer(streamer)}
                        onOpenTrophy={onOpenTrophy}
                      />
                    ))}
                  {showEntries && entries.length === 0 && (
                    <p className="vacant">
                      {division === 10
                        ? "시즌 미참여 후보 없음"
                        : "후보 대기 중"}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </section>
      ) : viewMode === "table" ? (
        <StreamerTable
          streamers={streamers}
          awards={trophyAwards}
          seenKeys={seenKeys}
          liveStreamerIds={liveStreamerIds}
          onOpen={onOpenStreamer}
          onOpenTrophy={onOpenTrophy}
        />
      ) : (
        <CardBoard
          streamers={cardStreamers}
          awards={trophyAwards}
          zoom={cardZoom}
          onOpen={onOpenStreamer}
          onOpenTrophy={onOpenTrophy}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          zoomMin={zoomMin}
          zoomMax={zoomMax}
          railExtra={
            <button
              type="button"
              className="squad-builder-rail__button"
              onClick={onSquadBuilderOpen}
              aria-label="나만의 스쿼드 빌더"
            >
              <CirclePile aria-hidden="true" />
              <span>나만의 스쿼드 빌더</span>
            </button>
          }
        />
      )}
      {(viewMode === "list" || viewMode === "table") && (
        <div className="squad-builder-rail">
          <button
            type="button"
            className="squad-builder-rail__button"
            onClick={onSquadBuilderOpen}
            aria-label="나만의 스쿼드 빌더"
          >
            <CirclePile aria-hidden="true" />
            <span>나만의 스쿼드 빌더</span>
          </button>
        </div>
      )}
    </div>
  );
}
