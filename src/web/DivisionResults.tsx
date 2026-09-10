import { useState } from "react";
import { ChevronDown, CirclePile } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import {
  POSITION_GROUP_CODES,
  POSITION_GROUP_COLORS,
  POSITION_GROUP_LABELS,
  positionGroupOf,
  type PositionGroup,
} from "../shared/position-theme.js";
import type { TrophyAwards } from "../shared/trophy.js";
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
  loadSecondRoundHiddenCollapsed,
  saveSecondRoundHiddenCollapsed,
  seenKeyFor,
} from "./storage";

const POSITION_GROUPS: PositionGroup[] = ["FW", "MF", "DF", "GK"];

// TEMP: 나중에 실제 2차 결과 발표 후 문구를 채워 넣을 자리 — 비어 있으면 "2차
// 탈락자 보기" 섹션에서 이 안내문이 아예 렌더링되지 않는다 (1차 탈락자 섹션의
// 고정 안내문과 동일한 패턴, 스트리머별이 아니라 섹션 전체에 한 번만 쓰인다).
const SECOND_ROUND_CHEER_MESSAGE =
  "2차까지 오면서 밤낮없이 연습하고 노력한 시간들, 팬분들은 다 지켜봐서 잘 알고 계실겁니다. 매일 조금씩 성장하는 모습 보면서 감동했습니다. 고생하셨습니다!! ";

export function DivisionResults({
  viewMode,
  loading,
  streamers,
  cardStreamers,
  nonPassedStreamers,
  secondRoundNonPassedStreamers,
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
  selectedPositions,
  isAllPositionsSelected,
}: {
  viewMode: "list" | "table" | "card";
  loading?: boolean;
  streamers: StreamerRecord[];
  cardStreamers: StreamerRecord[];
  nonPassedStreamers: StreamerRecord[];
  secondRoundNonPassedStreamers: StreamerRecord[];
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
  selectedPositions: string[];
  isAllPositionsSelected: boolean;
}) {
  const selectedPositionSet = new Set(selectedPositions);
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
  const [secondRoundHiddenCollapsed, setSecondRoundHiddenCollapsed] = useState(
    loadSecondRoundHiddenCollapsed,
  );
  const toggleSecondRoundHidden = () => {
    setSecondRoundHiddenCollapsed((current) => {
      const next = !current;
      saveSecondRoundHiddenCollapsed(next);
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
          {POSITION_GROUPS.map((group) => {
            // The selected position codes are already applied to `streamers`
            // upstream (useStreamerFilters), so a group none of whose codes
            // are selected would render empty anyway — but skip it outright
            // so only the relevant position areas show at all, not an empty
            // placeholder for the rest.
            if (
              !isAllPositionsSelected &&
              !POSITION_GROUP_CODES[group].some((code) =>
                selectedPositionSet.has(code),
              )
            )
              return null;
            const entries = streamers.filter(
              (streamer) => positionGroupOf(streamer.hopedPosition1) === group,
            );
            if (hideEmptyDivisions && entries.length === 0) return null;
            return (
              <section
                className={`division division-position-${group.toLowerCase()}`}
                style={
                  {
                    "--division-color": POSITION_GROUP_COLORS[group],
                  } as React.CSSProperties
                }
                key={group}
              >
                <div className="division__label division__label--position">
                  <span>POSITION</span>
                  <strong>{POSITION_GROUP_LABELS[group]}</strong>
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
                    <p className="vacant">해당 포지션 후보가 없습니다</p>
                  )}
                </div>
              </section>
            );
          })}
          {isAllPositionsSelected &&
            (() => {
              const unassigned = streamers.filter(
                (streamer) => !positionGroupOf(streamer.hopedPosition1),
              );
              if (unassigned.length === 0) return null;
              return (
                <section
                  className="division division-position-unassigned"
                  style={
                    { "--division-color": "#9aa5b1" } as React.CSSProperties
                  }
                >
                  <div className="division__label division__label--position">
                    <span>POSITION</span>
                    <strong>미정</strong>
                  </div>
                  <div className="division__players">
                    {unassigned.map((streamer) => (
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
              );
            })()}
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
      {(secondRoundNonPassedStreamers.length > 0 ||
        nonPassedStreamers.length > 0) && (
        <section
          className="division hidden-streamers"
          style={{ gridTemplateColumns: "1fr" }}
          aria-label="탈락자"
        >
          <div className="division__players">
            {secondRoundNonPassedStreamers.length > 0 && (
              <>
                <button
                  type="button"
                  className="division__players-toggle"
                  onClick={toggleSecondRoundHidden}
                  aria-expanded={!secondRoundHiddenCollapsed}
                >
                  <ChevronDown aria-hidden="true" />
                  <span>
                    {secondRoundHiddenCollapsed
                      ? `2차 탈락자 보기 (${secondRoundNonPassedStreamers.length}명)`
                      : "접기"}
                  </span>
                </button>
                {!secondRoundHiddenCollapsed &&
                  SECOND_ROUND_CHEER_MESSAGE.trim() && (
                    <p className="second-round-hidden__note">
                      {SECOND_ROUND_CHEER_MESSAGE}
                      <img
                        className="second-round-hidden__note-icon"
                        src="/cheer-up-1.webp"
                        alt=""
                        aria-hidden="true"
                      />
                      <img
                        className="second-round-hidden__note-icon"
                        src="/cheer-up-2.webp"
                        alt=""
                        aria-hidden="true"
                      />
                    </p>
                  )}
                {!secondRoundHiddenCollapsed &&
                  secondRoundNonPassedStreamers.map((streamer) => (
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
              </>
            )}
            {nonPassedStreamers.length > 0 && (
              <>
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
                    많으셨습니다. 열심히 노력하시는 모습 보면서 시청자분들과
                    진심으로 응원했습니다. 함께해주신 모든 분들, 정말
                    수고하셨습니다.💪
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
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
