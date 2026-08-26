import type { StreamerRecord } from "../../shared/model.js";
import { fancyTierOf } from "../cardVisuals";
import { FavoriteCelebrationRow } from "../FavoriteCelebration";
import { celebrationMessageFor } from "../useLatestActivity";

export function PhotoBoothBanner({ streamer }: { streamer: StreamerRecord }) {
  const fancyTier = fancyTierOf(streamer);
  const isFullFancy = fancyTier === "full";
  // On this stage a "lite" streamer renders as a fully plain banner (no
  // crown icon, no gradient shimmer) — unlike the dashboard's top banner,
  // where FavoriteCelebrationRow's own toned-down lite look still applies.
  const rowFancyTier = isFullFancy ? "full" : "none";
  return (
    <div className={`photo-booth-banner ${isFullFancy ? "photo-booth-banner--fancy" : ""}`}>
      <span className="photo-booth-banner__shine" aria-hidden="true" />
      <span className="photo-booth-banner__sparkles" aria-hidden="true">
        <i className="photo-booth-banner__spark photo-booth-banner__spark--1">✦</i>
        <i className="photo-booth-banner__spark photo-booth-banner__spark--2 photo-booth-banner__spark--teal">✦</i>
        <i className="photo-booth-banner__spark photo-booth-banner__spark--3">✦</i>
        <i className="photo-booth-banner__spark photo-booth-banner__spark--4 photo-booth-banner__spark--teal">✦</i>
        <i className="photo-booth-banner__spark photo-booth-banner__spark--5">✦</i>
        <i className="photo-booth-banner__spark photo-booth-banner__spark--6 photo-booth-banner__spark--teal">✦</i>
        {isFullFancy && (
          <>
            <i className="photo-booth-banner__spark photo-booth-banner__spark--7">✦</i>
            <i className="photo-booth-banner__spark photo-booth-banner__spark--8 photo-booth-banner__spark--teal">✦</i>
            <i className="photo-booth-banner__spark photo-booth-banner__spark--9">✦</i>
            <i className="photo-booth-banner__spark photo-booth-banner__spark--10 photo-booth-banner__spark--teal">✦</i>
          </>
        )}
      </span>
      <FavoriteCelebrationRow
        message={celebrationMessageFor(streamer.nickname?.trim() || streamer.displayName)}
        fancyTier={rowFancyTier}
        size="large"
      />
    </div>
  );
}
