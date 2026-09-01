import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import {
  POSITION_GROUP_LABELS,
  positionColor,
  positionGroupOf,
} from "../shared/position-theme.js";
import { Avatar } from "./cardVisuals";
import { Modal, useEscape } from "./Modal";
import {
  nearestScheduleDateIndex,
  TEST_SCHEDULE,
  type TestScheduleSlot,
} from "./testScheduleData";

function AssignedPositionTag({ code }: { code: string }) {
  const group = positionGroupOf(code);
  return (
    <span
      className="position-tag"
      style={{ "--position-color": positionColor(code) } as React.CSSProperties}
      title={group ? POSITION_GROUP_LABELS[group] : undefined}
    >
      {code}
    </span>
  );
}

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
      {streamer ? (
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
  const streamerById = new Map(
    streamers.map((streamer) => [streamer.id, streamer]),
  );
  const selected = TEST_SCHEDULE[dateIndex];

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
        </div>
      }
    >
      <div className="test-schedule__teams">
        {selected.teams.map((team) => (
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
    </Modal>
  );
}
