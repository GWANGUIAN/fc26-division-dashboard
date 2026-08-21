import { divisionColor } from "../../shared/division-theme.js";
import type { StreamerRecord } from "../../shared/model.js";
import { winRatePercent } from "../../shared/record-extraction.js";
import {
  FancyAvatar,
  FancyName,
  FifaShield,
  hexToRgba,
  RecordBadge,
} from "../cardVisuals.js";

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
}: {
  streamer: StreamerRecord;
  variant: "candidate" | "placed";
}) {
  const color = divisionColor(streamer.currentDivision);
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;

  return (
    <div className={`squad-card squad-card--${variant}`}>
      <FifaShield color={color} />
      <span className="squad-card__division">D{streamer.currentDivision}</span>
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
