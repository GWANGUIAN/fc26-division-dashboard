import type { CSSProperties } from "react";
import type { StreamerRecord } from "../../shared/model.js";
import { divisionColor } from "../../shared/division-theme.js";
import { FancyAvatar, FancyName, PositionTags } from "../cardVisuals.js";

/**
 * Compact name+photo row for the reveal rail — a full card per passer
 * doesn't scale once there are many of them, so this keeps each entry down
 * to a single slim rectangular chip instead, tinted by division color.
 */
export function RevealedListCard({ streamer }: { streamer: StreamerRecord }) {
  const color = divisionColor(streamer.currentDivision);
  return (
    <div
      className="pass-reveal-rail__item"
      style={{ "--item-color": color } as CSSProperties}
    >
      <span className="pass-reveal-rail__avatar">
        <FancyAvatar streamer={streamer} color={color} ring={false} />
      </span>
      <span className="pass-reveal-rail__name">
        <FancyName streamer={streamer} color={color}>
          {streamer.displayName}
        </FancyName>
      </span>
      {streamer.hopedPosition1 && (
        <span className="pass-reveal-rail__position">
          <PositionTags streamer={streamer} />
        </span>
      )}
      {streamer.currentDivision > 0 && (
        <span className="pass-reveal-rail__division">
          D{streamer.currentDivision}
        </span>
      )}
    </div>
  );
}
