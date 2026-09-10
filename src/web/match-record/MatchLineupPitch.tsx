import { useMemo } from "react";
import { Avatar } from "../cardVisuals";
import { AssignedPositionTag } from "../PositionTag";
import { computeTeamPitchLayout, type PitchSlotView } from "../testSchedulePitchLayout";
import type { LineupPlayer, MatchLineup } from "./types";

/** Mirrors TestSchedulePitch's PitchMarkings (../TestSchedulePitch.tsx) — not exported there, so reproduced here for this read-only variant. */
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

const PORTRAIT_PITCH_ASPECT_RATIO = 68 / 105;

function MatchPitchCard({ view, player }: { view: PitchSlotView; player?: LineupPlayer }) {
  return (
    <div
      className="test-pitch-card"
      style={{ left: `${view.xPct}%`, top: `${view.yPct}%` }}
    >
      <div className="test-pitch-card__button test-pitch-card__button--locked">
        {player && (player.profileImageUrl || player.soopId) ? (
          <Avatar
            profileImageUrl={player.profileImageUrl}
            soopId={player.soopId}
            displayName={player.displayName}
          />
        ) : (
          <span className="avatar avatar-fallback test-pitch-card__vacant-avatar" aria-hidden="true">
            {player?.displayName.slice(0, 1) ?? "?"}
          </span>
        )}
        <span className="test-pitch-card__name">{player?.displayName ?? "미배정"}</span>
        <AssignedPositionTag code={view.position} />
      </div>
    </div>
  );
}

function MatchPitchHalf({
  lineup,
  playerById,
  layoutKey,
  mirrorX,
}: {
  lineup: MatchLineup;
  playerById: Map<string, LineupPlayer>;
  layoutKey: string;
  mirrorX?: boolean;
}) {
  const slots = useMemo(
    () =>
      computeTeamPitchLayout(
        { label: lineup.teamLabel, slots: lineup.slots.map((slot) => ({ streamerId: slot.playerId, position: slot.position })) },
        layoutKey,
        "standalone",
        { mirrorX },
      ),
    [lineup, layoutKey, mirrorX],
  );
  return (
    <div className="test-pitch test-pitch--portrait">
      <PitchMarkings aspectRatio={PORTRAIT_PITCH_ASPECT_RATIO} />
      <span className="test-pitch__team-tag test-pitch__team-tag--bottom match-lineup__team-tag">
        <img src={lineup.teamLogoUrl} alt="" aria-hidden="true" />
        {lineup.teamLabel}
      </span>
      {slots.map((view) => (
        <MatchPitchCard
          key={view.key}
          view={view}
          player={view.baseStreamerId ? playerById.get(view.baseStreamerId) : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Read-only two-team split pitch for a confirmed match's lineups — visually
 * identical to TestSchedulePitch's "나눠서 보기" (layout="split") mode, but
 * without its click-to-assign/swap/vacate editing (not appropriate for a
 * settled historical result) or its localStorage persistence.
 */
export function MatchLineupPitch({
  gameId,
  jandyLineup,
  opponentLineup,
  playerById,
}: {
  gameId: string;
  jandyLineup: MatchLineup;
  opponentLineup: MatchLineup;
  playerById: Map<string, LineupPlayer>;
}) {
  return (
    <div className="test-pitch-split">
      <MatchPitchHalf lineup={jandyLineup} playerById={playerById} layoutKey={gameId} mirrorX />
      <MatchPitchHalf lineup={opponentLineup} playerById={playerById} layoutKey={gameId} />
    </div>
  );
}
