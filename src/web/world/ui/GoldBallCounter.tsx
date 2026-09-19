import type { CSSProperties } from "react";
import { getWorldAssetUrl } from "../worldAssets";

interface GoldBallCounterProps {
  /** Golden balls collected so far; the counter stays hidden at 0. */
  count: number;
}

/**
 * Top-right HUD chip: the golden ball icon and how many the player has found. The count pops when it grows
 * (the number is re-mounted per value, so the CSS animation restarts).
 */
export function GoldBallCounter({ count }: GoldBallCounterProps) {
  if (count <= 0) return null;
  const icon = getWorldAssetUrl("props/goldball-1");
  const frame = getWorldAssetUrl("ui/tooltip-frame");
  const style = frame ? ({ "--balls-frame": `url(${frame})` } as CSSProperties) : undefined;
  return (
    <div className={`world-balls${frame ? " world-balls--art" : ""}`} style={style} role="img" aria-label={`황금 축구공 ${count}개`}>
      {icon ? <img className="world-balls__icon" src={icon} alt="" draggable={false} /> : <span className="world-balls__icon world-balls__icon--fallback" aria-hidden="true">⚽</span>}
      <span key={count} className="world-balls__count" aria-hidden="true">{count}</span>
    </div>
  );
}
