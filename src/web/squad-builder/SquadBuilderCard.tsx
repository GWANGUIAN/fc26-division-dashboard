import { Pencil, Trash2 } from "lucide-react";
import { divisionColor } from "../../shared/division-theme.js";
import {
  FancyAvatar,
  FancyName,
  FifaShield,
  hexToRgba,
  PositionTags,
  RecordBadge,
} from "../cardVisuals.js";
import { effectiveWinRatePercent, type SquadPlayer } from "./customPlayerTypes.js";

/**
 * Presentational-only card for the squad builder: reuses the FIFA card's
 * shield/gradient/avatar/name/record visuals but has no click-to-open
 * modal, no sfx badge, no achievement badges, and no mouse-tilt/holo effect
 * (dnd-kit owns `transform` on this element while dragging, so a
 * competing tilt handler would fight it for the same CSS property).
 * Drag/drop wiring belongs to the caller (Pitch/CandidateDrawer), not here.
 *
 * `variant="candidate"` mirrors the smallest card-view zoom step (division +
 * avatar + name only). `variant="placed"` mirrors the next zoom step up,
 * adding the record/win-rate footer.
 */
export function SquadBuilderCard({
  streamer,
  variant,
  showGamesPlayed,
  onEdit,
  onDelete,
}: {
  streamer: SquadPlayer;
  variant: "candidate" | "placed";
  /** Only meaningful for variant="placed" — adds a third "경기" (games
   * played) stat alongside the record/win-rate footer, and a modifier class
   * a caller can use to re-tune spacing for the extra row without affecting
   * every other "placed" card (see pass-announcement.css). */
  showGamesPlayed?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const color = divisionColor(streamer.currentDivision);
  const rate = effectiveWinRatePercent(streamer);
  const gamesPlayed = streamer.record
    ? streamer.record.wins + streamer.record.draws + streamer.record.losses
    : undefined;

  return (
    <div
      className={`squad-card squad-card--${variant} ${showGamesPlayed ? "squad-card--stats-extended" : ""}`}
    >
      {(onEdit || onDelete) && (
        <span className="squad-card__actions">
          {onEdit && (
            <button
              type="button"
              className="squad-card__action-button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              aria-label={`${streamer.displayName} 수정`}
            >
              <Pencil aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="squad-card__action-button squad-card__action-button--danger"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label={`${streamer.displayName} 삭제`}
            >
              <Trash2 aria-hidden="true" />
            </button>
          )}
        </span>
      )}
      <FifaShield color={color} />
      <span className="squad-card__division">
        {streamer.currentDivision > 0 ? `D${streamer.currentDivision}` : ""}
      </span>
      {streamer.hopedPosition1 && (
        <span className="squad-card__position">
          <PositionTags streamer={streamer} />
        </span>
      )}
      <span className="squad-card__body">
        <span
          className="squad-card__avatar"
          style={{ "--avatar-border": color } as React.CSSProperties}
        >
          <FancyAvatar streamer={streamer} color={color} ring={false} />
        </span>
        <span
          className="squad-card__name"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(color, 0.12)}, ${hexToRgba(color, 0.05)})`,
          }}
        >
          <FancyName streamer={streamer} color={color} tag="strong">
            {streamer.displayName}
          </FancyName>
        </span>
        {variant === "placed" && (
          <span className="squad-card__stats">
            {showGamesPlayed && (
              <span className="squad-card__stat">
                <b className="squad-card__stat-value">
                  {gamesPlayed !== undefined ? `${gamesPlayed}경기` : "-"}
                </b>
              </span>
            )}
            <span className="squad-card__stat">
              <RecordBadge streamer={streamer} />
            </span>
            <span className="squad-card__stat">
              <span className="squad-card__stat-label">승률</span>
              <b className="squad-card__stat-value">
                {rate !== undefined ? `${rate.toFixed(1)}%` : "-"}
              </b>
            </span>
          </span>
        )}
      </span>
    </div>
  );
}
