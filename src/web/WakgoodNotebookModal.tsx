import { useMemo, useState } from "react";
import { ExternalLink, NotebookPen } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { searchable } from "../shared/search.js";
import {
  POSITION_GROUP_COLORS,
  POSITION_GROUP_LABELS,
  positionGroupOf,
  type PositionGroup,
} from "../shared/position-theme.js";
import { Avatar, PositionTags } from "./cardVisuals";
import { Modal, useEscape } from "./Modal";
import {
  matchAppearancesForStreamer,
  matchDatesForStreamer,
  TEST_SCHEDULE,
} from "./testScheduleData";
import { getWakgoodNote, isSkippedWakgoodNote } from "./wakgoodNotes";

const POSITION_GROUP_ORDER: PositionGroup[] = ["FW", "MF", "DF", "GK"];

export function WakgoodNotebookModal({
  streamers,
  onClose,
}: {
  streamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  const [query, setQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<PositionGroup | "all">(
    "all",
  );
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredStreamers = useMemo(
    () =>
      streamers.filter(
        (streamer) =>
          searchable(streamer.displayName, streamer.cafeAliases, query) &&
          (positionFilter === "all" ||
            positionGroupOf(streamer.hopedPosition1) === positionFilter ||
            positionGroupOf(streamer.hopedPosition2) === positionFilter) &&
          (dateFilter === "all" ||
            matchDatesForStreamer(streamer.id).has(dateFilter)),
      ),
    [streamers, query, positionFilter, dateFilter],
  );
  const writtenCount = filteredStreamers.filter((streamer) => {
    const notes = getWakgoodNote(streamer.id)?.notes;
    return Boolean(notes && notes.length > 0) && !isSkippedWakgoodNote(notes);
  }).length;
  const skippedStreamers = filteredStreamers.filter((streamer) =>
    isSkippedWakgoodNote(getWakgoodNote(streamer.id)?.notes),
  );
  const incompleteCount =
    filteredStreamers.length - writtenCount - skippedStreamers.length;

  return (
    <Modal
      onClose={onClose}
      label="우왁굳의 메모장"
      wide
      header={
        <div>
          <div className="wakgood-notebook__heading-row">
            <div>
              <p className="eyebrow">PLAYER NOTES</p>
              <h2 className="wakgood-notebook__title">
                <NotebookPen aria-hidden="true" /> 우왁굳의 메모장
              </h2>
            </div>
            <div className="wakgood-notebook__progress">
              <span className="wakgood-notebook__progress-item wakgood-notebook__progress-item--written">
                완료 {writtenCount}
              </span>
              <span className="wakgood-notebook__progress-item wakgood-notebook__progress-item--skipped">
                넘어감 {skippedStreamers.length}
                {skippedStreamers.length > 0 &&
                  `(${skippedStreamers.map((streamer) => streamer.displayName).join(", ")})`}
              </span>
              <span className="wakgood-notebook__progress-item wakgood-notebook__progress-item--empty">
                미완료 {incompleteCount}
              </span>
            </div>
          </div>
          <div className="wakgood-notebook__filters">
            <label className="wakgood-notebook__search">
              <span className="sr-only">이름 검색</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름 또는 카페 닉네임 검색"
              />
            </label>
            <div className="segmented segmented--position">
              <button
                className={positionFilter === "all" ? "active" : ""}
                onClick={() => setPositionFilter("all")}
              >
                전체
              </button>
              {POSITION_GROUP_ORDER.map((group) => (
                <button
                  key={group}
                  className={positionFilter === group ? "active" : ""}
                  onClick={() => setPositionFilter(group)}
                  style={
                    {
                      "--position-color": POSITION_GROUP_COLORS[group],
                    } as React.CSSProperties
                  }
                >
                  {POSITION_GROUP_LABELS[group]}
                </button>
              ))}
            </div>
            <div className="segmented wakgood-notebook__date-tabs">
              <button
                className={dateFilter === "all" ? "active" : ""}
                onClick={() => setDateFilter("all")}
              >
                전체
              </button>
              {TEST_SCHEDULE.map((entry) => (
                <button
                  key={entry.date}
                  className={dateFilter === entry.date ? "active" : ""}
                  onClick={() => setDateFilter(entry.date)}
                >
                  {entry.date}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ul className="wakgood-notebook__list">
        {filteredStreamers.map((streamer) => {
          const entry = getWakgoodNote(streamer.id);
          const notes = entry?.notes;
          const skipped = isSkippedWakgoodNote(notes);
          const written = Boolean(notes && notes.length > 0) && !skipped;
          const stateClass = written
            ? "wakgood-notebook__entry--written"
            : skipped
              ? "wakgood-notebook__entry--skipped"
              : "wakgood-notebook__entry--empty";
          const appearances = matchAppearancesForStreamer(streamer.id);
          return (
            <li
              className={`wakgood-notebook__entry ${stateClass}`}
              key={streamer.id}
            >
              <div className="wakgood-notebook__entry-head">
                <Avatar {...streamer} />
                <strong>{streamer.displayName}</strong>
                {entry?.vodUrl && (
                  <a
                    className="wakgood-notebook__vod"
                    href={entry.vodUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    다시보기 <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </div>
              <div className="wakgood-notebook__entry-tags">
                <PositionTags streamer={streamer} />
                {appearances.length > 0 && (
                  <span className="wakgood-notebook__match-days">
                    {appearances.map((appearance, index) => (
                      <span
                        className="wakgood-notebook__match-day"
                        key={index}
                      >
                        {appearance.gameLabel
                          ? `${appearance.date} ${appearance.gameLabel}`
                          : appearance.date}
                      </span>
                    ))}
                  </span>
                )}
              </div>
              {written ? (
                <ul className="wakgood-notebook__notes">
                  {notes!.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              ) : skipped ? (
                <p className="wakgood-notebook__skipped">{notes![0]}</p>
              ) : (
                <p className="wakgood-notebook__empty">작성전</p>
              )}
            </li>
          );
        })}
        {filteredStreamers.length === 0 && (
          <p className="empty-list">표시할 스트리머가 없습니다.</p>
        )}
      </ul>
    </Modal>
  );
}
