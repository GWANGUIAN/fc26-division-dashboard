import { useEffect, useState } from "react";
import { CalendarDays, LayoutList, Shirt } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { Avatar } from "./cardVisuals";
import { Modal, useEscape } from "./Modal";
import { AssignedPositionTag } from "./PositionTag";
import { TestSchedulePitch } from "./TestSchedulePitch";
import {
  CUSTOM_TEST_SCHEDULE_STREAMERS,
  gamesForDate,
  nearestScheduleDateIndex,
  TEST_SCHEDULE,
  type TestScheduleSlot,
} from "./testScheduleData";

function TestScheduleSlotRow({
  slot,
  streamer,
}: {
  slot: TestScheduleSlot;
  streamer?: StreamerRecord;
}) {
  return (
    <li
      className={`test-schedule__slot ${streamer ? "" : "test-schedule__slot--vacant"}`}
    >
      {streamer && (streamer.profileImageUrl || streamer.soopId) ? (
        <Avatar {...streamer} />
      ) : (
        <span
          className="avatar avatar-fallback test-schedule__vacant-avatar"
          aria-hidden="true"
        >
          ?
        </span>
      )}
      <span className="test-schedule__slot-name">
        {streamer?.displayName ?? "대기인원"}
      </span>
      <AssignedPositionTag code={slot.position} />
    </li>
  );
}

export function TestScheduleModal({
  streamers,
  onClose,
}: {
  streamers: StreamerRecord[];
  onClose: () => void;
}) {
  useEscape(onClose);
  const [dateIndex, setDateIndex] = useState(() =>
    nearestScheduleDateIndex(TEST_SCHEDULE),
  );
  const [gameIndex, setGameIndex] = useState(0);
  const [view, setView] = useState<"list" | "pitch">("list");
  const streamerById = new Map(
    [...streamers, ...CUSTOM_TEST_SCHEDULE_STREAMERS].map((streamer) => [
      streamer.id,
      streamer,
    ]),
  );
  const selected = TEST_SCHEDULE[dateIndex];
  const games = gamesForDate(selected);
  useEffect(() => setGameIndex(0), [dateIndex]);
  const selectedGame = games[gameIndex] ?? games[0];
  // 같은 날짜에 경기가 여러 개면 포메이션 편성 저장 키가 경기끼리 겹치지 않도록 라벨을 덧붙인다.
  const pitchDateIso =
    games.length > 1
      ? `${selected.isoDate}::${selectedGame.label}`
      : selected.isoDate;

  return (
    <Modal
      onClose={onClose}
      label="2차 테스트 일정"
      wide
      header={
        <div>
          <p className="eyebrow">SECOND ROUND</p>
          <h2 className="test-schedule__title">
            <CalendarDays aria-hidden="true" /> 2차 테스트 일정
          </h2>
          <div className="test-schedule__tabs-row">
            <div className="test-schedule__tabs-group">
              <div className="segmented test-schedule__date-tabs">
                {TEST_SCHEDULE.map((entry, index) => (
                  <button
                    key={entry.date}
                    className={index === dateIndex ? "active" : ""}
                    onClick={() => setDateIndex(index)}
                  >
                    {entry.date}
                  </button>
                ))}
              </div>
              {games.length > 1 && (
                <div className="segmented test-schedule__game-tabs">
                  {games.map((game, index) => (
                    <button
                      key={game.label}
                      className={index === gameIndex ? "active" : ""}
                      onClick={() => setGameIndex(index)}
                    >
                      {game.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="segmented test-schedule__view-tabs">
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
              >
                <LayoutList aria-hidden="true" /> 리스트
              </button>
              <button
                className={view === "pitch" ? "active" : ""}
                onClick={() => setView("pitch")}
              >
                <Shirt aria-hidden="true" /> 포메이션
              </button>
            </div>
          </div>
        </div>
      }
    >
      {view === "pitch" ? (
        <TestSchedulePitch
          teams={selectedGame.teams}
          dateIso={pitchDateIso}
          streamers={streamers}
          streamerById={streamerById}
          locked={selected.locked}
        />
      ) : (
        <div className="test-schedule__teams">
          {selectedGame.teams.map((team) => (
            <section className="test-schedule__team" key={team.label}>
              <h3 className="test-schedule__team-label">{team.label}</h3>
              <ul className="test-schedule__slots">
                {team.slots.map((slot, index) => (
                  <TestScheduleSlotRow
                    key={index}
                    slot={slot}
                    streamer={
                      slot.streamerId
                        ? streamerById.get(slot.streamerId)
                        : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}
