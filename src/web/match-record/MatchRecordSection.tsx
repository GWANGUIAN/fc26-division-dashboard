import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Trophy, X } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ko } from "react-day-picker/locale";
import "react-day-picker/style.css";
import "./match-record.css";
import type { StreamerRecord } from "../../shared/model.js";
import { CUSTOM_TEST_SCHEDULE_STREAMERS } from "../testScheduleData";
import { MatchDetailModal } from "./MatchDetailModal";
import { MatchRankingModal } from "./MatchRankingModal";
import { JECHO_PLAYERS, MATCH_RECORDS } from "./matchRecordData";
import type { LineupPlayer, MatchDay } from "./types";

const VISIBLE_ROWS = 5;

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function computeRecord(days: MatchDay[]): { wins: number; draws: number; losses: number } {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (const day of days) {
    for (const game of day.games) {
      if (game.jandyScore > game.opponentScore) wins++;
      else if (game.jandyScore === game.opponentScore) draws++;
      else losses++;
    }
  }
  return { wins, draws, losses };
}

function MatchScoreChip({
  day,
  gameId,
  onOpen,
}: {
  day: MatchDay;
  gameId: string;
  onOpen: (day: MatchDay, gameId: string) => void;
}) {
  const game = day.games.find((entry) => entry.id === gameId);
  if (!game) return null;
  return (
    <button
      type="button"
      className="match-record__chip"
      onClick={() => onOpen(day, gameId)}
    >
      {day.games.length > 1 && (
        <span className="match-record__chip-label">{game.label}</span>
      )}
      <img src={game.jandyLineup.teamLogoUrl} alt="" />
      <span className="match-record__chip-score">
        {game.jandyScore} : {game.opponentScore}
      </span>
      <img src={game.opponentLineup.teamLogoUrl} alt="" />
    </button>
  );
}

function DateRangeFilter({
  range,
  onChange,
}: {
  range?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    addEventListener("mousedown", closeOnOutsideClick);
    addEventListener("keydown", closeOnEscape);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick);
      removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const label = range?.from
    ? range.to && range.to.getTime() !== range.from.getTime()
      ? `${formatShortDate(range.from)} ~ ${formatShortDate(range.to)}`
      : formatShortDate(range.from)
    : "전체 기간";

  return (
    <div className="match-record__date-filter" ref={wrapRef}>
      <button
        type="button"
        className="match-record__date-filter-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <CalendarDays aria-hidden="true" size={14} />
        {label}
      </button>
      {range?.from && (
        <button
          type="button"
          className="match-record__date-filter-clear"
          onClick={() => onChange(undefined)}
          aria-label="날짜 필터 초기화"
        >
          <X aria-hidden="true" size={13} />
        </button>
      )}
      {open && (
        <div className="match-record__calendar-popover">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            defaultMonth={range?.to ?? range?.from}
            weekStartsOn={0}
            locale={ko}
          />
        </div>
      )}
    </div>
  );
}

export function MatchRecordSection({ streamers }: { streamers: StreamerRecord[] }) {
  const [expanded, setExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [openMatch, setOpenMatch] = useState<{ day: MatchDay; gameId: string }>();
  const [rankingOpen, setRankingOpen] = useState(false);

  const playerById = useMemo(() => {
    const map = new Map<string, LineupPlayer>();
    for (const streamer of streamers) {
      map.set(streamer.id, {
        id: streamer.id,
        displayName: streamer.displayName,
        soopId: streamer.soopId,
        profileImageUrl: streamer.profileImageUrl,
      });
    }
    for (const guest of CUSTOM_TEST_SCHEDULE_STREAMERS) {
      map.set(guest.id, {
        id: guest.id,
        displayName: guest.displayName,
        soopId: guest.soopId,
        profileImageUrl: guest.profileImageUrl,
      });
    }
    for (const player of JECHO_PLAYERS) map.set(player.id, player);
    return map;
  }, [streamers]);

  const sortedDays = useMemo(
    () =>
      [...MATCH_RECORDS].sort((a, b) => (a.isoDate < b.isoDate ? 1 : -1)),
    [],
  );

  const filteredDays = useMemo(() => {
    if (!dateRange?.from) return sortedDays;
    const from = dateRange.from.getTime();
    const to = (dateRange.to ?? dateRange.from).getTime();
    return sortedDays.filter((day) => {
      const time = parseIsoDate(day.isoDate).getTime();
      return time >= from && time <= to;
    });
  }, [sortedDays, dateRange]);

  const record = useMemo(() => computeRecord(filteredDays), [filteredDays]);
  const visibleDays = expanded ? filteredDays : filteredDays.slice(0, VISIBLE_ROWS);
  const hasMore = filteredDays.length > VISIBLE_ROWS;

  return (
    <section className="jandy-videos match-record" aria-labelledby="match-record-title">
      <div className="jandy-videos__heading">
        <div>
          <p className="eyebrow">MATCH CENTER</p>
          <h2 id="match-record-title" className="jandy-videos__title">
            잔디동 경기 기록
          </h2>
        </div>
        <div className="jandy-videos__actions">
          <span>{MATCH_RECORDS.length}경기일</span>
        </div>
      </div>

      <div className="match-record__filter-row">
        <span className="match-record__record">
          총 전적 <strong>{record.wins}승 {record.draws}무 {record.losses}패</strong>
        </span>
        <div className="match-record__filter-actions">
          <button
            type="button"
            className="match-record__ranking-trigger"
            onClick={() => setRankingOpen(true)}
          >
            <Trophy aria-hidden="true" size={14} />
            골/어시 순위
          </button>
          <DateRangeFilter range={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {visibleDays.length === 0 ? (
        <p className="match-record__empty">해당 기간에 경기 기록이 없습니다</p>
      ) : (
        <ul className="match-record__rows">
          {visibleDays.map((day) => (
            <li className="match-record__row" key={day.isoDate}>
              <div className="match-record__row-head">
                <span className="match-record__date">{day.dateLabel}</span>
                <span className="match-record__opponent">vs {day.opponentName}</span>
              </div>
              <div className="match-record__games">
                {day.games.map((game) => (
                  <MatchScoreChip
                    key={game.id}
                    day={day}
                    gameId={game.id}
                    onOpen={(selectedDay, gameId) => setOpenMatch({ day: selectedDay, gameId })}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          className="match-record__more"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? (
            <>
              <ChevronUp aria-hidden="true" size={14} /> 접기
            </>
          ) : (
            <>
              <ChevronDown aria-hidden="true" size={14} />
              더보기 ({filteredDays.length - VISIBLE_ROWS})
            </>
          )}
        </button>
      )}

      {openMatch && (
        <MatchDetailModal
          day={openMatch.day}
          initialGameId={openMatch.gameId}
          playerById={playerById}
          onClose={() => setOpenMatch(undefined)}
        />
      )}

      {rankingOpen && (
        <MatchRankingModal
          playerById={playerById}
          onClose={() => setRankingOpen(false)}
        />
      )}
    </section>
  );
}
