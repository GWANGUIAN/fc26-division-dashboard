import { useSyncExternalStore } from "react";
import { Box } from "lucide-react";
import { isTotyCardRevealed, subscribeTotyCardRevealed } from "./totyCardRevealedStore.js";

/** Opens the 3D card popup — used in card/list/table view (icon-only) and the
 * detail modal (icon + label). Always stops propagation since every place
 * it's used sits inside a larger clickable row/card. `onPrefetch` (wired to
 * preloadTotyCardAssets by callers) fires on hover/focus so the card art is
 * already warming up in the browser cache before the click even happens. */
export function TotyCardButton({
  className,
  streamerId,
  displayName,
  onOpen,
  onPrefetch,
  showLabel,
}: {
  className: string;
  /** Used only to make the button periodically blink when this streamer's
   * card hasn't been opened yet — see totyCardRevealedStore.ts. */
  streamerId: string;
  displayName: string;
  onOpen: () => void;
  onPrefetch?: () => void;
  showLabel?: boolean;
}) {
  const unrevealed = !useSyncExternalStore(subscribeTotyCardRevealed, () =>
    isTotyCardRevealed(streamerId),
  );

  return (
    <button
      type="button"
      className={`${className}${unrevealed ? " toty-card-btn--unrevealed" : ""}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-label={
        unrevealed ? `${displayName} 3D 카드 보기 (아직 안 열어본 카드)` : `${displayName} 3D 카드 보기`
      }
    >
      <Box aria-hidden="true" />
      {showLabel && <span>3D 카드 보기</span>}
    </button>
  );
}
