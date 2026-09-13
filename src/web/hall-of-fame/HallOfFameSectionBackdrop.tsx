import type { TrophyBadge } from "../../shared/trophy.js";
import { getHallOfFameBackdropGlowUrl, getHallOfFameBackdropUrl } from "./hallOfFameArt.js";

/**
 * Full-bleed atmospheric backdrop sitting behind one trophy category's
 * heading + card grid in TrophyModal.tsx — the "stage" each category's
 * medallions sit on, distinct per category (golden light rays for
 * division-one, ember forge glow for hard-worker, etc. — see
 * docs/hall-of-fame-card-prompts.md). Renders nothing until that category's
 * backdrop art exists, so a section without one yet just keeps its current
 * plain gradient background.
 */
export function HallOfFameSectionBackdrop({ categoryKey }: { categoryKey: TrophyBadge["key"] }) {
  const backdropUrl = getHallOfFameBackdropUrl(categoryKey);
  if (!backdropUrl) return null;
  const glowUrl = getHallOfFameBackdropGlowUrl(categoryKey);
  return (
    <div className="hof-section-backdrop" aria-hidden="true">
      <div className="hof-section-backdrop__image" style={{ backgroundImage: `url(${backdropUrl})` }} />
      {glowUrl && (
        <div className="hof-section-backdrop__glow" style={{ backgroundImage: `url(${glowUrl})` }} />
      )}
      <div className="hof-section-backdrop__scrim" />
    </div>
  );
}
