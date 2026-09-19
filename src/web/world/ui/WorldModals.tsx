import { Suspense, lazy } from "react";
import type { StreamerRecord } from "../../../shared/model";
import { CardMatchModal } from "../../minigame/CardMatchModal";
import { KickupsModal } from "../../minigame/KickupsModal";
import { SoccerSum10Modal } from "../../minigame/soccer-sum10/SoccerSum10Modal";
import { TotyCardPopup } from "../../toty-card/TotyCardPopup";
import { getTotyCardAssets, type TotyCardVariant } from "../../toty-card/totyCardAssets";
import type { MinigameRoundResult } from "../types";

const FreekickModal = lazy(() => import("../../minigame/FreekickModal"));

/** What the world needs from the dashboard around it: the roster the card game and card popup read, and the site-wide sound setting. */
export interface DashboardBridge {
  streamers: StreamerRecord[] | undefined;
  /** Who stands in the group photo (the celebration roster the dashboard's own group photo uses). */
  groupPhotoStreamers: StreamerRecord[];
  woowakgoodUnlocked: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
  onToggleSfx: () => void;
  onSfxVolumeChange: (value: number) => void;
}

export type WorldModal =
  | { type: "minigame"; game: MinigameRoundResult["game"]; /** Opened from the stadium showdown: its result counts for the showdown, not for arcade missions. */ context?: "finale" }
  | { type: "cards"; streamerId: string };

type CardStreamer = Pick<StreamerRecord, "id" | "displayName" | "hopedPosition1" | "currentDivision" | "sfx">;

interface WorldModalsProps {
  modal: WorldModal | null;
  dashboard: DashboardBridge;
  onClose: () => void;
  /** A minigame round finished — the world judges its missions from this, never from a dashboard play. */
  onRoundEnd: (result: MinigameRoundResult) => void;
  /** The card popup revealed a card / switched its theme. */
  onCardView: (id: string, variant: TotyCardVariant) => void;
  /** The viewer picked another member inside the card popup. */
  onSelectCard: (streamerId: string) => void;
}

/**
 * Renders the existing minigame modals and the 3D card popup inside the world overlay (docs/world/01 §10).
 * They keep their own fixed-position layers (z-index 20 / 90), which sit inside the overlay's stacking
 * context and therefore above the HUD; the overlay routes Esc, so their own Esc listeners never fire.
 */
export function WorldModals({ modal, dashboard, onClose, onRoundEnd, onCardView, onSelectCard }: WorldModalsProps) {
  if (!modal) return null;

  if (modal.type === "cards") {
    const streamer = dashboard.streamers?.find((entry) => entry.id === modal.streamerId);
    const assets = streamer ? getTotyCardAssets(streamer.id) : undefined;
    if (!streamer || !assets) return null;
    return (
      <TotyCardPopup
        // A clean remount (fresh theme roll and reveal) when the viewer switches member inside the popup.
        key={streamer.id}
        streamer={streamer}
        assets={assets}
        allStreamers={dashboard.streamers ?? []}
        woowakgoodUnlocked={dashboard.woowakgoodUnlocked}
        sfxEnabled={dashboard.sfxEnabled}
        sfxVolume={dashboard.sfxVolume}
        onToggleSfx={dashboard.onToggleSfx}
        onSfxVolumeChange={dashboard.onSfxVolumeChange}
        onSelectStreamer={(next: CardStreamer) => onSelectCard(next.id)}
        onClose={onClose}
        onView={onCardView}
      />
    );
  }

  switch (modal.game) {
    case "soccer-sum10":
      return <SoccerSum10Modal onClose={onClose} onRoundEnd={onRoundEnd} />;
    case "kickups":
      return <KickupsModal onClose={onClose} sfxVolume={dashboard.sfxVolume} onSfxVolumeChange={dashboard.onSfxVolumeChange} onRoundEnd={onRoundEnd} />;
    case "freekick":
      return (
        <Suspense fallback={null}>
          <FreekickModal onClose={onClose} sfxVolume={dashboard.sfxVolume} onSfxVolumeChange={dashboard.onSfxVolumeChange} onRoundEnd={onRoundEnd} />
        </Suspense>
      );
    case "cardmatch":
      return <CardMatchModal onClose={onClose} streamers={dashboard.streamers} sfxVolume={dashboard.sfxVolume} onRoundEnd={onRoundEnd} />;
  }
}
