import type { StreamerRecord } from "../../shared/model.js";
import { getTotyCardAssets } from "../toty-card/totyCardAssets.js";
import { getTotyCardTextTheme } from "../toty-card/totyCardTheme.js";
import { getCardMatchBackUrl } from "./cardMatchAssets.js";
import type { CardMatchCard as CardMatchCardModel } from "./cardMatchEngine.js";

type CardMatchStreamer = Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision">;

export function CardMatchCard({
  card,
  streamer,
  disabled,
  shake,
  onFlip,
}: {
  card: CardMatchCardModel;
  streamer: CardMatchStreamer | undefined;
  /** Blocks flipping a still-hidden card (already-revealed/matched cards are always non-interactive
   * regardless of this, via the disabled attribute below). */
  disabled: boolean;
  /** True for the instant a wrong pair is about to flip back — see useCardMatchGame's mismatch timer. */
  shake: boolean;
  onFlip: () => void;
}) {
  const faceUp = card.status !== "hidden";
  const assets = streamer && getTotyCardAssets(streamer.id);
  const theme = streamer && getTotyCardTextTheme(streamer.id);
  const backUrl = getCardMatchBackUrl();

  return (
    <button
      type="button"
      className={`cardmatch-cell ${faceUp ? "cardmatch-cell--flipped" : ""} ${card.status === "matched" ? "cardmatch-cell--matched" : ""} ${shake ? "cardmatch-cell--shake" : ""}`}
      onClick={onFlip}
      disabled={faceUp || disabled}
      aria-label={faceUp && streamer ? streamer.displayName : "카드 뒤집기"}
      style={theme ? ({ "--toty-text-color": theme.color, "--toty-text-glow": theme.glow } as React.CSSProperties) : undefined}
    >
      <span className="cardmatch-cell__inner">
        <span className="cardmatch-cell__face cardmatch-cell__face--back" aria-hidden="true">
          {backUrl ? <img src={backUrl} alt="" /> : <span className="cardmatch-cell__back-fallback">?</span>}
        </span>
        <span className="cardmatch-cell__face cardmatch-cell__face--front">
          {assets && streamer && (
            <>
              {/* Same frame art as .cardmatch-cell__frame below, but sitting BELOW the window so
                  its colored drop-shadow (which follows the border art's own alpha silhouette,
                  unlike a box-shadow) only ever shows on the outward side — the opaque
                  background/character on top hides the inward half. Only lit up on a match. */}
              <img className="cardmatch-cell__frame-glow" src={assets.frame} alt="" aria-hidden="true" />
              <span className="cardmatch-cell__window">
                <img className="cardmatch-cell__bg" src={assets.background} alt="" />
                <img className="cardmatch-cell__char" src={assets.character} alt="" />
              </span>
              <img className="cardmatch-cell__frame" src={assets.frame} alt="" />
              <span className="cardmatch-cell__name">{streamer.displayName}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
}
