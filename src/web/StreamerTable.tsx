import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Volume2 } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { formatBoardPostDate } from "../shared/dates.js";
import { winRatePercent } from "../shared/record-extraction.js";
import { divisionColor } from "../shared/division-theme.js";
import type { TrophyAwards } from "../shared/trophy.js";
import {
  AchievementBadges,
  FancyAvatar,
  FancyName,
  PositionTags,
  RecordBadge,
  SaviorAvatar,
  SaviorName,
} from "./cardVisuals";
import { isUpdatedToday, seenKeyFor } from "./storage";
import { useWakgoodNoteHover, WakgoodNoteBubble } from "./WakgoodNoteTooltip";

type SortKey = "division" | "name" | "games" | "winRate" | "lastPromotion";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const totalGamesOf = (streamer: StreamerRecord) =>
  streamer.record
    ? streamer.record.wins + streamer.record.draws + streamer.record.losses
    : 0;
const winRateOf = (streamer: StreamerRecord) =>
  streamer.record ? winRatePercent(streamer.record) : undefined;
const lastPromotionOf = (streamer: StreamerRecord) =>
  streamer.lastPost ? new Date(streamer.lastPost.publishedAt).getTime() : undefined;

const SORT_LABELS: Record<SortKey, string> = {
  division: "디비전",
  name: "이름",
  games: "경기수",
  winRate: "승률",
  lastPromotion: "최근 승급일",
};

function StreamerTableRow({
  streamer,
  index,
  awards,
  isNew,
  isLive,
  onOpen,
  onOpenTrophy,
}: {
  streamer: StreamerRecord;
  index: number;
  awards: TrophyAwards;
  isNew: boolean;
  isLive: boolean;
  onOpen: (streamer: StreamerRecord) => void;
  onOpenTrophy?: () => void;
}) {
  const games = totalGamesOf(streamer);
  const winRate = winRateOf(streamer);
  const { open: noteOpen, show: showNote, scheduleHide: hideNote, anchorRef } =
    useWakgoodNoteHover<HTMLTableCellElement>();
  const showNoteTooltip = streamer.passedFirstRound;
  return (
    <tr
      className="streamer-table__row"
      tabIndex={0}
      role="button"
      aria-label={`${streamer.displayName} 상세 보기`}
      onClick={() => onOpen(streamer)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(streamer);
        }
      }}
    >
      <td className="streamer-table__rank">{index + 1}</td>
      <td
        ref={anchorRef}
        className="streamer-table__identity"
        onMouseEnter={showNoteTooltip ? showNote : undefined}
        onMouseLeave={showNoteTooltip ? hideNote : undefined}
      >
        <span className="streamer-table__avatar">
          <SaviorAvatar streamer={streamer}>
            <FancyAvatar streamer={streamer} />
          </SaviorAvatar>
          {isLive && (
            <span
              className="live-ring"
              role="img"
              aria-label="방송중"
              title="현재 방송중"
            />
          )}
          {streamer.sfx && (
            <Volume2
              className="streamer-table__sfx-badge"
              aria-hidden="true"
            />
          )}
        </span>
        <span className="streamer-table__name">
          <SaviorName streamer={streamer}>
            <FancyName streamer={streamer} tag="strong">
              {streamer.displayName}
            </FancyName>
          </SaviorName>
          <AchievementBadges
            streamer={streamer}
            awards={awards}
            onClick={onOpenTrophy}
          />
          {!streamer.isMapped && (
            <span className="unmapped" title="SOOP 정보 미연결">
              카페
            </span>
          )}
          {isNew && (
            <span className="streamer-table__new-badge">NEW</span>
          )}
        </span>
        {showNoteTooltip && noteOpen && (
          <WakgoodNoteBubble
            streamer={streamer}
            anchorRef={anchorRef}
            onMouseEnter={showNote}
            onMouseLeave={hideNote}
          />
        )}
      </td>
      <td>
        <span
          className="streamer-table__division"
          style={
            {
              "--division-color": divisionColor(
                streamer.currentDivision,
              ),
            } as React.CSSProperties
          }
        >
          D{streamer.currentDivision}
        </span>
      </td>
      <td>
        <RecordBadge streamer={streamer} />
      </td>
      <td className="streamer-table__position">
        <PositionTags streamer={streamer} />
      </td>
      <td className="streamer-table__num">{games || "-"}</td>
      <td className="streamer-table__num">
        {winRate !== undefined ? `${winRate.toFixed(1)}%` : "-"}
      </td>
      <td className="streamer-table__date">
        {formatBoardPostDate(streamer.lastPost?.publishedAt)}
      </td>
    </tr>
  );
}

export function StreamerTable({
  streamers,
  awards,
  seenKeys,
  liveStreamerIds,
  onOpen,
  onOpenTrophy,
}: {
  streamers: StreamerRecord[];
  awards: TrophyAwards;
  seenKeys: Set<string>;
  liveStreamerIds: Set<string>;
  onOpen: (streamer: StreamerRecord) => void;
  onOpenTrophy?: () => void;
}) {
  const [sort, setSort] = useState<Sort | null>(null);

  function handleSort(key: SortKey) {
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "asc" };
      if (current.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  // Default order: division rank first, then win rate within a division —
  // the standing most people actually want to read their rank off of.
  const defaultSorted = useMemo(() => {
    return [...streamers].sort((a, b) => {
      if (a.currentDivision !== b.currentDivision)
        return a.currentDivision - b.currentDivision;
      return (winRateOf(b) ?? -1) - (winRateOf(a) ?? -1);
    });
  }, [streamers]);

  const sorted = useMemo(() => {
    if (!sort) return defaultSorted;
    const dirMul = sort.dir === "asc" ? 1 : -1;
    // Sorting the already division/win-rate-ordered array keeps ties in that
    // order too, since Array#sort is spec-guaranteed stable.
    return [...defaultSorted].sort((a, b) => {
      switch (sort.key) {
        case "division":
          return (a.currentDivision - b.currentDivision) * dirMul;
        case "name":
          return a.displayName.localeCompare(b.displayName, "ko-KR") * dirMul;
        case "games":
          return (totalGamesOf(a) - totalGamesOf(b)) * dirMul;
        case "winRate":
          return ((winRateOf(a) ?? -1) - (winRateOf(b) ?? -1)) * dirMul;
        case "lastPromotion":
          return ((lastPromotionOf(a) ?? -1) - (lastPromotionOf(b) ?? -1)) * dirMul;
      }
    });
  }, [defaultSorted, sort]);

  function SortableHeader({ sortKey }: { sortKey: SortKey }) {
    const active = sort?.key === sortKey;
    const numeric = sortKey === "games" || sortKey === "winRate";
    return (
      <th
        className={`streamer-table__th streamer-table__th--sortable streamer-table__th--${sortKey} ${numeric ? "streamer-table__th--num" : ""} ${active ? "streamer-table__th--active" : ""}`}
        aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <button type="button" onClick={() => handleSort(sortKey)}>
          <span>{SORT_LABELS[sortKey]}</span>
          <span className="streamer-table__sort-icon" aria-hidden="true">
            {active ? (
              sort!.dir === "asc" ? <ChevronUp /> : <ChevronDown />
            ) : (
              <ChevronsUpDown />
            )}
          </span>
        </button>
      </th>
    );
  }

  return (
    <div className="streamer-table-wrap">
      <table className="streamer-table" aria-label="FC26 디비전 순위표">
        <thead>
          <tr>
            <th className="streamer-table__th streamer-table__th--rank">#</th>
            <SortableHeader sortKey="name" />
            <SortableHeader sortKey="division" />
            <th className="streamer-table__th streamer-table__th--record">
              전적
            </th>
            <th className="streamer-table__th streamer-table__th--position">
              희망 포지션
            </th>
            <SortableHeader sortKey="games" />
            <SortableHeader sortKey="winRate" />
            <SortableHeader sortKey="lastPromotion" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((streamer, index) => {
            const isNew =
              isUpdatedToday(streamer) && !seenKeys.has(seenKeyFor(streamer));
            const isLive = liveStreamerIds.has(streamer.id);
            return (
              <StreamerTableRow
                key={streamer.id}
                streamer={streamer}
                index={index}
                awards={awards}
                isNew={isNew}
                isLive={isLive}
                onOpen={onOpen}
                onOpenTrophy={onOpenTrophy}
              />
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={8} className="streamer-table__empty">
                표시할 스트리머가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
