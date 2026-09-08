import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { searchable } from "../shared/search.js";
import notepadIcon from "./assets/icon-notepad.webp";
import { Avatar, PositionTags } from "./cardVisuals";
import { Modal, useEscape } from "./Modal";
import { PositionFilterPicker } from "./PositionFilterPicker";
import { usePositionCodeFilter } from "./usePositionCodeFilter";
import {
  matchAppearancesForStreamer,
  matchDatesForStreamer,
  TEST_SCHEDULE,
} from "./testScheduleData";
import { useToast } from "./useToast";
import {
  flattenWakgoodNotes,
  getWakgoodNote,
  isSkippedWakgoodNote,
  visibleWakgoodNoteGroups,
} from "./wakgoodNotes";
import { downloadWakgoodNotebookXlsx } from "./xlsx-export.js";
import { WakgoodVodLinks } from "./WakgoodVodLinks";

export function WakgoodNotebookModal({
  streamers,
  onClose,
}: {
  streamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  const { toast, showToast } = useToast();
  const [query, setQuery] = useState("");
  const {
    selectedPositions,
    setSelectedPositions,
    selectedPositionSet,
    availablePositionCodes,
    isAllPositionsSelected,
  } = usePositionCodeFilter(streamers);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "written" | "skipped" | "empty"
  >("all");

  function statusOf(streamer: StreamerRecord): "written" | "skipped" | "empty" {
    const noteGroups = getWakgoodNote(streamer.id)?.noteGroups;
    if (isSkippedWakgoodNote(noteGroups)) return "skipped";
    if (flattenWakgoodNotes(noteGroups).length > 0) return "written";
    return "empty";
  }

  const streamersBeforeStatus = useMemo(
    () =>
      streamers.filter(
        (streamer) =>
          searchable(streamer.displayName, streamer.cafeAliases, query) &&
          (isAllPositionsSelected ||
            selectedPositionSet.has((streamer.hopedPosition1 ?? "").toUpperCase()) ||
            selectedPositionSet.has((streamer.hopedPosition2 ?? "").toUpperCase())) &&
          (dateFilter === "all" ||
            matchDatesForStreamer(streamer.id).has(dateFilter)),
      ),
    [
      streamers,
      query,
      isAllPositionsSelected,
      selectedPositionSet,
      dateFilter,
    ],
  );
  const writtenStreamers = streamersBeforeStatus.filter(
    (streamer) => statusOf(streamer) === "written",
  );
  const skippedStreamers = streamersBeforeStatus.filter(
    (streamer) => statusOf(streamer) === "skipped",
  );
  const emptyStreamers = streamersBeforeStatus.filter(
    (streamer) => statusOf(streamer) === "empty",
  );
  const filteredStreamers = useMemo(
    () =>
      statusFilter === "all"
        ? streamersBeforeStatus
        : streamersBeforeStatus.filter(
            (streamer) => statusOf(streamer) === statusFilter,
          ),
    [streamersBeforeStatus, statusFilter],
  );

  function toggleStatusFilter(value: "written" | "skipped" | "empty") {
    setStatusFilter((current) => (current === value ? "all" : value));
  }

  async function handleDownload() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadWakgoodNotebookXlsx(
        filteredStreamers,
        `wakgood-notebook-${today}.xlsx`,
      );
    } catch {
      showToast("엑셀 다운로드에 실패했습니다");
    }
  }

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
                <img className="wakgood-note-icon" src={notepadIcon} alt="" /> 우왁굳의 메모장
              </h2>
            </div>
            <div className="segmented wakgood-notebook__progress">
              <button
                type="button"
                className={statusFilter === "all" ? "active" : ""}
                aria-pressed={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                전체 {streamersBeforeStatus.length}
              </button>
              <button
                type="button"
                className={statusFilter === "written" ? "active" : ""}
                aria-pressed={statusFilter === "written"}
                onClick={() => toggleStatusFilter("written")}
              >
                완료 {writtenStreamers.length}
              </button>
              <button
                type="button"
                className={statusFilter === "skipped" ? "active" : ""}
                aria-pressed={statusFilter === "skipped"}
                onClick={() => toggleStatusFilter("skipped")}
              >
                넘어감 {skippedStreamers.length}
                {skippedStreamers.length > 0 &&
                  `(${skippedStreamers.map((streamer) => streamer.displayName).join(", ")})`}
              </button>
              <button
                type="button"
                className={statusFilter === "empty" ? "active" : ""}
                aria-pressed={statusFilter === "empty"}
                onClick={() => toggleStatusFilter("empty")}
              >
                미완료 {emptyStreamers.length}
              </button>
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
            <PositionFilterPicker
              availableCodes={availablePositionCodes}
              selected={selectedPositions}
              onChange={setSelectedPositions}
            />
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
            <button
              type="button"
              className="copy-list-button wakgood-notebook__download"
              onClick={handleDownload}
              aria-label="엑셀 다운로드"
            >
              <Download aria-hidden="true" />
              <span className="control-btn__label">엑셀 다운로드</span>
            </button>
          </div>
        </div>
      }
    >
      <ul className="wakgood-notebook__list">
        {filteredStreamers.map((streamer) => {
          const entry = getWakgoodNote(streamer.id);
          const noteGroups = entry?.noteGroups;
          const visibleGroups = visibleWakgoodNoteGroups(noteGroups);
          const skipped = isSkippedWakgoodNote(noteGroups);
          const flatNotes = flattenWakgoodNotes(noteGroups);
          const written = flatNotes.length > 0 && !skipped;
          const stateClass = written
            ? "wakgood-notebook__entry--written"
            : skipped
              ? "wakgood-notebook__entry--skipped"
              : "wakgood-notebook__entry--empty";
          const fancy = Boolean(entry?.fancy);
          const singleGroupVodUrls =
            visibleGroups.length === 1 ? visibleGroups[0].vodUrls : undefined;
          const appearances = matchAppearancesForStreamer(streamer.id);
          return (
            <li
              className={`wakgood-notebook__entry ${stateClass} ${fancy ? "wakgood-notebook__entry--fancy" : ""}`}
              key={streamer.id}
            >
              <div className="wakgood-notebook__entry-head">
                <Avatar {...streamer} />
                <strong>{streamer.displayName}</strong>
                <span
                  className={`wakgood-notebook__status-badge wakgood-notebook__status-badge--${written ? "written" : skipped ? "skipped" : "empty"}`}
                >
                  {written ? "완료" : skipped ? "넘어감" : "미완료"}
                </span>
                <WakgoodVodLinks
                  urls={singleGroupVodUrls}
                  className="wakgood-notebook__vod"
                />
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
                <div className="wakgood-notebook__note-groups">
                  {visibleGroups.map((group, groupIndex) => (
                    <div className="wakgood-notebook__note-group" key={groupIndex}>
                      {visibleGroups.length > 1 && (group.label || group.vodUrls?.length) && (
                        <span className="wakgood-notebook__note-group-head">
                          {group.label && (
                            <span className="wakgood-notebook__note-group-label">
                              {group.label}
                            </span>
                          )}
                          {visibleGroups.length > 1 && (
                            <WakgoodVodLinks
                              urls={group.vodUrls}
                              className="wakgood-notebook__vod"
                            />
                          )}
                        </span>
                      )}
                      <ul
                        className={`wakgood-notebook__notes ${fancy ? "wakgood-notebook__notes--fancy" : ""}`}
                      >
                        {group.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : skipped ? (
                <p className="wakgood-notebook__skipped">{flatNotes[0]}</p>
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
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </Modal>
  );
}
