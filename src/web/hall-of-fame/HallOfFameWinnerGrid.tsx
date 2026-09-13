import type { StreamerRecord } from "../../shared/model.js";
import type { TrophyBadge } from "../../shared/trophy.js";
import { playSfx } from "../sfxAudio.js";
import { HallOfFameCardVisual, type HallOfFameStatLine } from "./HallOfFameCardVisual.js";

export type HallOfFameWinner = {
  streamer: Pick<StreamerRecord, "id" | "displayName" | "profileImageUrl" | "soopId" | "sfx">;
  /** division-one only. */
  tier?: 1 | 2 | 3;
  medal?: string;
  statLines: HallOfFameStatLine[];
  /** One-off flavor caption shown instead of/alongside stat lines (e.g. 노력왕's fixed pick). */
  quote?: string;
};

const MAX_STAGGER_INDEX = 5;
const SECTION_STAGGER_MS = 90;
const CARD_STAGGER_MS = 45;

/**
 * Ties-aware grid of trophy medallion cards for one category, with a
 * two-level entrance stagger (this category's position among the trophy
 * sections, then this card's position among its co-winners) so the whole
 * Hall of Fame gallery "settles into place" when the modal opens rather
 * than everything popping in at once.
 */
export function HallOfFameWinnerGrid({
  categoryKey,
  winners,
  sectionIndex,
  sfxEnabled,
  sfxVolume,
}: {
  categoryKey: TrophyBadge["key"];
  winners: HallOfFameWinner[];
  sectionIndex: number;
  sfxEnabled: boolean;
  sfxVolume: number;
}) {
  if (!winners.length) return null;
  return (
    <div className="hof-winner-grid">
      {winners.map((winner, cardIndex) => {
        return (
          <HallOfFameCardVisual
            key={`${winner.streamer.id}-${cardIndex}`}
            streamer={winner.streamer}
            categoryKey={categoryKey}
            tier={winner.tier}
            medal={winner.medal}
            statLines={winner.statLines}
            quote={winner.quote}
            entranceDelayMs={
              sectionIndex * SECTION_STAGGER_MS +
              Math.min(cardIndex, MAX_STAGGER_INDEX) * CARD_STAGGER_MS
            }
            onCardClick={() => {
              if (sfxEnabled && winner.streamer.sfx) playSfx(winner.streamer.sfx, sfxVolume / 100);
            }}
          />
        );
      })}
    </div>
  );
}
