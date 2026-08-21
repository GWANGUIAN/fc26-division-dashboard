import type { CareerRecord, StreamerRecord } from "../../shared/model.js";
import { winRatePercent } from "../../shared/record-extraction.js";

export interface CustomPlayer {
  id: string;
  name: string;
  /** 1-10; absent means unset. */
  division?: number;
  record?: CareerRecord;
  /** Only meaningful when `record` is absent. */
  winRatePercent?: number;
  /**
   * Fallback photo URL for seeded/default players (a static asset path
   * rather than an IndexedDB-backed upload). Overridden by an actual
   * uploaded photo whenever one exists — see customPlayerToSquadPlayer.
   */
  staticPhotoUrl?: string;
  /** Hidden field (not exposed in the add/edit form) — set on seeded/default players only. */
  isFancy?: boolean;
}

export interface CustomPlayerInput {
  name: string;
  division?: number;
  record?: CareerRecord;
  winRatePercent?: number;
}

/**
 * Structural superset of StreamerRecord so real streamers and custom
 * players can share one `Map<string, SquadPlayer>` throughout the squad
 * builder without touching StreamerRecord (used broadly elsewhere in the
 * app) or the components that already type their props as StreamerRecord.
 */
export type SquadPlayer = StreamerRecord & {
  /** Only meaningful when `record` is absent — see effectiveWinRatePercent. */
  customWinRatePercent?: number;
  isCustomPlayer?: boolean;
};

/** Single source of truth for win rate display/sort across the squad builder. */
export function effectiveWinRatePercent(player: SquadPlayer): number | undefined {
  return player.record ? winRatePercent(player.record) : player.customWinRatePercent;
}

export function customPlayerToSquadPlayer(
  player: CustomPlayer,
  photoUrl?: string,
): SquadPlayer {
  return {
    id: player.id,
    displayName: player.name,
    cafeAliases: [],
    profileImageUrl: photoUrl ?? player.staticPhotoUrl,
    autoUpdate: false,
    overridePolicy: "auto",
    currentDivision: player.division ?? 0,
    record: player.record,
    customWinRatePercent: player.record ? undefined : player.winRatePercent,
    isMapped: true,
    isFancy: !!player.isFancy,
    isCustomPlayer: true,
  };
}
