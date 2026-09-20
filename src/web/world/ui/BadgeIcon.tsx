import type { BadgeDef } from "../data/missionDefs";
import { getWorldAssetUrl } from "../worldAssets";
import "./board-codex.css";

/**
 * A badge's medal art. Badges whose `bd-*` file is not in the repo yet (docs/world/17) get a plain round plate
 * with a star instead; `earned` only changes the look (colour or a dark silhouette), never the size.
 */
export function BadgeIcon({ badge, earned }: { badge: BadgeDef; earned: boolean }) {
  const url = badge.icon ? getWorldAssetUrl(badge.icon) : undefined;
  const state = earned ? "is-earned" : "is-locked";
  if (url) return <img className={`world-badge-icon ${state}`} src={url} alt="" draggable={false} />;
  return <span className={`world-badge-icon world-badge-icon--plate ${state}`} aria-hidden="true">★</span>;
}
