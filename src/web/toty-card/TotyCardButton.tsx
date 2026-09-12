import { Box } from "lucide-react";

/** Opens the 3D card popup — used in card/list/table view (icon-only) and the
 * detail modal (icon + label). Always stops propagation since every place
 * it's used sits inside a larger clickable row/card. `onPrefetch` (wired to
 * preloadTotyCardAssets by callers) fires on hover/focus so the card art is
 * already warming up in the browser cache before the click even happens. */
export function TotyCardButton({
  className,
  displayName,
  onOpen,
  onPrefetch,
  showLabel,
}: {
  className: string;
  displayName: string;
  onOpen: () => void;
  onPrefetch?: () => void;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      aria-label={`${displayName} 3D 카드 보기`}
    >
      <Box aria-hidden="true" />
      {showLabel && <span>3D 카드 보기</span>}
    </button>
  );
}
