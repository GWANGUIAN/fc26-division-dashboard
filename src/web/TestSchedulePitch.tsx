import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, Search, UserX } from "lucide-react";
import type { StreamerRecord } from "../shared/model.js";
import { searchable } from "../shared/search.js";
import { Avatar } from "./cardVisuals";
import { AssignedPositionTag } from "./PositionTag";
import {
  loadTestSchedulePitchAssignments,
  saveTestSchedulePitchAssignments,
  type TestSchedulePitchAssignments,
} from "./storage";
import {
  computeTeamPitchLayout,
  type PitchSlotView,
} from "./testSchedulePitchLayout";
import type { TestScheduleTeam } from "./testScheduleData";

function effectiveStreamerId(
  assignments: TestSchedulePitchAssignments,
  view: PitchSlotView,
): string | undefined {
  if (view.key in assignments) {
    const value = assignments[view.key];
    return value === null ? undefined : value;
  }
  return view.baseStreamerId;
}

/**
 * The pitch outline is stretched to fill a non-square box (`preserveAspectRatio="none"`
 * on a 100x100 viewBox), so a circle drawn with equal rx/ry would come out
 * oval on anything but a square container. `aspectRatio` (the container's
 * width/height) lets us pre-compensate so the halfway circle still renders
 * round — same box-width/box-height math for both the together (landscape)
 * and split (portrait) pitches.
 */
function PitchMarkings({ aspectRatio }: { aspectRatio: number }) {
  const circleRy = 9;
  const circleRx = circleRy / aspectRatio;
  const dotRy = 0.6;
  const dotRx = dotRy / aspectRatio;
  return (
    <svg
      className="test-pitch__markings"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="98" height="98" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <line x1="1" y1="50" x2="99" y2="50" stroke="currentColor" strokeWidth="0.35" />
      <ellipse cx="50" cy="50" rx={circleRx} ry={circleRy} fill="none" stroke="currentColor" strokeWidth="0.35" />
      <ellipse cx="50" cy="50" rx={dotRx} ry={dotRy} fill="currentColor" />
      <rect x="24" y="1" width="52" height="14" fill="none" stroke="currentColor" strokeWidth="0.35" />
      <rect x="24" y="85" width="52" height="14" fill="none" stroke="currentColor" strokeWidth="0.35" />
    </svg>
  );
}

const TOGETHER_PITCH_ASPECT_RATIO = 105 / 82;
const PORTRAIT_PITCH_ASPECT_RATIO = 68 / 105;

function TestPitchCard({
  view,
  streamer,
  mirrorStreamer,
  streamers,
  onAssign,
  onVacate,
  onSwap,
  locked,
}: {
  view: PitchSlotView;
  streamer?: StreamerRecord;
  mirrorStreamer?: StreamerRecord;
  streamers: StreamerRecord[];
  onAssign: (id: string) => void;
  onVacate: () => void;
  onSwap: () => void;
  locked?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<{ top: number; left: number }>();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function updateAnchor() {
    const rect = toggleRef.current?.getBoundingClientRect();
    if (rect) setAnchor({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
  }

  useEffect(() => {
    if (!isOpen) return;
    updateAnchor();
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (toggleRef.current?.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    addEventListener("mousedown", closeOnOutsideClick, true);
    addEventListener("keydown", closeOnEscape);
    addEventListener("resize", updateAnchor);
    return () => {
      removeEventListener("mousedown", closeOnOutsideClick, true);
      removeEventListener("keydown", closeOnEscape);
      removeEventListener("resize", updateAnchor);
    };
  }, [isOpen]);

  const sorted = useMemo(
    () => [...streamers].sort((a, b) => a.displayName.localeCompare(b.displayName, "ko")),
    [streamers],
  );
  const filtered = useMemo(
    () => sorted.filter((item) => searchable(item.displayName, item.cafeAliases ?? [], query)),
    [sorted, query],
  );

  function handleOpen() {
    setQuery("");
    setIsOpen(true);
  }

  function handleAssign(id: string) {
    onAssign(id);
    setIsOpen(false);
  }

  const cardContent = (
    <>
      {streamer && (streamer.profileImageUrl || streamer.soopId) ? (
        <Avatar
          profileImageUrl={streamer.profileImageUrl}
          soopId={streamer.soopId}
          displayName={streamer.displayName}
        />
      ) : (
        <span className="avatar avatar-fallback test-pitch-card__vacant-avatar" aria-hidden="true">
          ?
        </span>
      )}
      <span className="test-pitch-card__name">{streamer?.displayName ?? "대기인원"}</span>
      <AssignedPositionTag code={view.position} />
    </>
  );

  return (
    <div
      className={`test-pitch-card ${streamer ? "" : "test-pitch-card--vacant"}`}
      style={{ left: `${view.xPct}%`, top: `${view.yPct}%` }}
    >
      {locked ? (
        <div className="test-pitch-card__button test-pitch-card__button--locked">
          {cardContent}
        </div>
      ) : (
        <button
          type="button"
          ref={toggleRef}
          className="test-pitch-card__button"
          onClick={handleOpen}
          aria-expanded={isOpen}
          aria-label={`${view.position} 자리 편성`}
        >
          {cardContent}
        </button>
      )}
      {!locked &&
        isOpen &&
        anchor &&
        createPortal(
          <section
            ref={panelRef}
            className="test-pitch-menu__panel"
            role="region"
            aria-label={`${view.position} 자리 편성`}
            style={{ position: "fixed", top: anchor.top, left: anchor.left, transform: "translateX(-50%)" }}
          >
            {(streamer || view.mirrorKey) && (
              <div className="test-pitch-menu__actions">
                {view.mirrorKey && (
                  <button type="button" className="test-pitch-menu__action" onClick={() => { onSwap(); setIsOpen(false); }}>
                    <ArrowLeftRight aria-hidden="true" />
                    좌우 위치 교체{mirrorStreamer ? ` (${mirrorStreamer.displayName})` : ""}
                  </button>
                )}
                {streamer && (
                  <button type="button" className="test-pitch-menu__action test-pitch-menu__action--danger" onClick={() => { onVacate(); setIsOpen(false); }}>
                    <UserX aria-hidden="true" />
                    자리 비우기
                  </button>
                )}
              </div>
            )}
            <div className="test-pitch-menu__search">
              <Search aria-hidden="true" />
              <input
                type="text"
                placeholder="선수 검색"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>
            <div className="test-pitch-menu__list">
              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`test-pitch-menu__row ${item.id === streamer?.id ? "test-pitch-menu__row--selected" : ""}`}
                  onClick={() => handleAssign(item.id)}
                >
                  <Avatar
                    profileImageUrl={item.profileImageUrl}
                    soopId={item.soopId}
                    displayName={item.displayName}
                  />
                  <span className="test-pitch-menu__name">{item.displayName}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="test-pitch-menu__empty">검색 결과가 없습니다</p>
              )}
            </div>
          </section>,
          document.body,
        )}
    </div>
  );
}

export function TestSchedulePitch({
  teams,
  dateIso,
  streamers,
  streamerById,
  locked,
  layout = "together",
}: {
  teams: TestScheduleTeam[];
  dateIso: string;
  streamers: StreamerRecord[];
  streamerById: Map<string, StreamerRecord>;
  locked?: boolean;
  /** "together": one shared pitch, both teams facing off. "split": each team on its own portrait pitch, 1팀 left / 2팀 right. */
  layout?: "together" | "split";
}) {
  const [assignments, setAssignments] = useState<TestSchedulePitchAssignments>(
    loadTestSchedulePitchAssignments,
  );
  useEffect(() => saveTestSchedulePitchAssignments(assignments), [assignments]);

  // 배열 순서상 teams[0]="2팀"(bottom)/teams[1]="1팀"(top)이 관례지만, 나눠서
  // 보기에서는 순서 대신 라벨로 찾아 왼쪽에 1팀을 고정한다.
  const team1 = teams.find((team) => team.label === "1팀") ?? teams[1];
  const team2 = teams.find((team) => team.label === "2팀") ?? teams[0];

  const togetherSlots = useMemo(
    () => [
      ...(teams[0] ? computeTeamPitchLayout(teams[0], dateIso, "bottom") : []),
      ...(teams[1] ? computeTeamPitchLayout(teams[1], dateIso, "top") : []),
    ],
    [teams, dateIso],
  );
  // 1팀은 "한번에 보기"에서 위쪽 절반에 거꾸로(골키퍼가 위) 놓이므로, 골키퍼가
  // 아래로 오게 하려면 통째로 180도 돌린 것처럼 좌우까지 뒤집어야 한다.
  const splitTeam1Slots = useMemo(
    () =>
      team1
        ? computeTeamPitchLayout(team1, dateIso, "standalone", { mirrorX: true })
        : [],
    [team1, dateIso],
  );
  const splitTeam2Slots = useMemo(
    () => (team2 ? computeTeamPitchLayout(team2, dateIso, "standalone") : []),
    [team2, dateIso],
  );

  const allSlots =
    layout === "split" ? [...splitTeam1Slots, ...splitTeam2Slots] : togetherSlots;
  const slotByKey = useMemo(
    () => new Map(allSlots.map((view) => [view.key, view])),
    [allSlots],
  );

  function assign(key: string, streamerId: string | null) {
    setAssignments((current) => ({ ...current, [key]: streamerId }));
  }

  function swapMirror(view: PitchSlotView) {
    if (!view.mirrorKey) return;
    const mirror = slotByKey.get(view.mirrorKey);
    if (!mirror) return;
    const a = effectiveStreamerId(assignments, view);
    const b = effectiveStreamerId(assignments, mirror);
    setAssignments((current) => ({
      ...current,
      [view.key]: b ?? null,
      [mirror.key]: a ?? null,
    }));
  }

  function renderSlot(view: PitchSlotView) {
    const cardLocked = locked || view.locked;
    const streamerId = cardLocked
      ? view.baseStreamerId
      : effectiveStreamerId(assignments, view);
    const mirror = view.mirrorKey ? slotByKey.get(view.mirrorKey) : undefined;
    const mirrorLocked = locked || mirror?.locked;
    const mirrorStreamerId = mirror
      ? mirrorLocked
        ? mirror.baseStreamerId
        : effectiveStreamerId(assignments, mirror)
      : undefined;
    return (
      <TestPitchCard
        key={view.key}
        view={view}
        streamer={streamerId ? streamerById.get(streamerId) : undefined}
        mirrorStreamer={mirrorStreamerId ? streamerById.get(mirrorStreamerId) : undefined}
        streamers={streamers}
        onAssign={(id) => assign(view.key, id)}
        onVacate={() => assign(view.key, null)}
        onSwap={() => swapMirror(view)}
        locked={cardLocked}
      />
    );
  }

  if (layout === "split") {
    return (
      <div className="test-pitch-split">
        <div className="test-pitch test-pitch--portrait">
          <PitchMarkings aspectRatio={PORTRAIT_PITCH_ASPECT_RATIO} />
          {team1 && <span className="test-pitch__team-tag test-pitch__team-tag--bottom">{team1.label}</span>}
          {splitTeam1Slots.map(renderSlot)}
        </div>
        <div className="test-pitch test-pitch--portrait">
          <PitchMarkings aspectRatio={PORTRAIT_PITCH_ASPECT_RATIO} />
          {team2 && <span className="test-pitch__team-tag test-pitch__team-tag--bottom">{team2.label}</span>}
          {splitTeam2Slots.map(renderSlot)}
        </div>
      </div>
    );
  }

  return (
    <div className="test-pitch">
      <PitchMarkings aspectRatio={TOGETHER_PITCH_ASPECT_RATIO} />
      {teams[0] && <span className="test-pitch__team-tag test-pitch__team-tag--bottom">{teams[0].label}</span>}
      {teams[1] && <span className="test-pitch__team-tag test-pitch__team-tag--top">{teams[1].label}</span>}
      {togetherSlots.map(renderSlot)}
    </div>
  );
}
