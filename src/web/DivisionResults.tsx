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
  loadFirstRoundHiddenCollapsed,
  saveFirstRoundHiddenCollapsed,
  seenKeyFor,
} from "./storage";

const visibleDivisions = divisions.filter((division) => division <= 7);

export function DivisionResults({
  viewMode,
  loading,
  streamers,
  cardStreamers,
  nonPassedStreamers,
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
  nonPassedStreamers: StreamerRecord[];
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
  const [firstRoundHiddenCollapsed, setFirstRoundHiddenCollapsed] = useState(
    loadFirstRoundHiddenCollapsed,
  );
  const toggleFirstRoundHidden = () => {
    setFirstRoundHiddenCollapsed((current) => {
      const next = !current;
      saveFirstRoundHiddenCollapsed(next);
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
          {visibleDivisions.map((division) => {
            const entries = streamers.filter(
              (streamer) => streamer.currentDivision === division,
            );
            if (hideEmptyDivisions && entries.length === 0) return null;
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
                  <span>DIVISION</span>
                  <strong>{division}</strong>
                </div>
                <div
                  className={
                    entries.length === 0
                      ? "division__players division__players--empty"
                      : "division__players"
                  }
                >
                  {entries.map((streamer) => (
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
                  {entries.length === 0 && (
                    <p className="vacant">후보 대기 중</p>
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
      {nonPassedStreamers.length > 0 && (
        <section
          className="division first-round-hidden"
          style={{ gridTemplateColumns: "1fr" }}
          aria-label="1차 탈락자"
        >
          <div className="division__players">
            <button
              type="button"
              className="division__players-toggle"
              onClick={toggleFirstRoundHidden}
              aria-expanded={!firstRoundHiddenCollapsed}
            >
              <ChevronDown aria-hidden="true" />
              <span>
                {firstRoundHiddenCollapsed
                  ? `1차 탈락자 보기 (${nonPassedStreamers.length}명)`
                  : "접기"}
              </span>
            </button>
            {!firstRoundHiddenCollapsed && (
              <p className="first-round-hidden__note">
                짧다면 짧고 길다면 길었던 시간 동안 FC 플레이 하시느라 고생
                많으셨습니다. 그 시간 동안 얼마나 열심히 하셨는지, 지켜본
                시청자분들이 누구보다 잘 알고 계실 겁니다. 함께해주신
                모든 분들, 정말 수고하셨습니다.
              </p>
            )}
            {!firstRoundHiddenCollapsed &&
              nonPassedStreamers.map((streamer) => (
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
          </div>
        </section>
      )}
    </div>
  );
}
