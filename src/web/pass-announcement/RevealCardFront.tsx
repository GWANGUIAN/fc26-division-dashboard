import type { StreamerRecord } from "../../shared/model.js";
import { winRatePercent } from "../../shared/record-extraction.js";
import { FancyAvatar, FancyName, FifaShield, hexToRgba, RecordBadge } from "../cardVisuals.js";

export function RevealCardFront({
  streamer,
  color,
}: {
  streamer: StreamerRecord;
  color: string;
}) {
  const rate = streamer.record ? winRatePercent(streamer.record) : undefined;
  return (
    <div className="reveal-card-front">
      <FifaShield color={color} />
      <span className="reveal-card-front__division">
        {streamer.currentDivision > 0 ? `D${streamer.currentDivision}` : ""}
      </span>
      <span className="reveal-card-front__body">
        <span
          className="reveal-card-front__avatar"
          style={{ "--avatar-border": color } as React.CSSProperties}
        >
          <FancyAvatar streamer={streamer} color={color} ring={false} />
        </span>
        <span
          className="reveal-card-front__name"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(color, 0.12)}, ${hexToRgba(color, 0.05)})`,
          }}
        >
          <FancyName streamer={streamer} color={color} tag="strong">
            {streamer.displayName}
          </FancyName>
        </span>
        <span className="reveal-card-front__stats">
          <span className="reveal-card-front__record">
            <RecordBadge streamer={streamer} />
          </span>
          {rate !== undefined && (
            <span className="reveal-card-front__winrate">
              <span className="reveal-card-front__winrate-label">승률</span>
              <b className="reveal-card-front__winrate-value">{rate.toFixed(1)}%</b>
            </span>
          )}
        </span>
      </span>
    </div>
  );
}
