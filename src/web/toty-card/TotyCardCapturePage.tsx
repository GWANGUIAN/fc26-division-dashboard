import { useEffect } from "react";
import { TotyCardVisual } from "./TotyCardVisual.js";
import { getBackgroundGlowUrl, getTotyCardAssets } from "./totyCardAssets.js";
import "./toty-card.css";

/**
 * Bare, transparent, chrome-free rendering of one player's card — reached
 * via ?totyCapture=<id>[&name=...&pos=...&div=...] (see main.tsx). Exists
 * only for scripts/generate-toty-preview.mjs: it opens this URL in headless
 * Chromium, drives the card with synthetic mouse moves, and screenshots
 * each frame with a transparent background to build the downloadable
 * animated GIF preview. Not linked from anywhere in the real UI.
 */
export function TotyCardCapturePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("totyCapture") ?? "";
  const assets = getTotyCardAssets(id);

  // The app paints its ambient background via body::before/::after (fixed,
  // full-viewport gradients — see styles.css) rather than body's own
  // `background`, so setting that alone left the capture fully opaque.
  // .toty-capture-mode (toty-card.css) turns those pseudo-elements off so
  // Playwright's omitBackground screenshot gets real alpha. Scoped to this
  // route only — never reached in the real app.
  useEffect(() => {
    document.body.classList.add("toty-capture-mode");
    return () => document.body.classList.remove("toty-capture-mode");
  }, []);

  if (!assets) return null;

  const streamer = {
    id,
    displayName: params.get("name") ?? id,
    hopedPosition1: params.get("pos") || undefined,
    currentDivision: Number(params.get("div") ?? "1"),
  };

  return (
    <div className="toty-capture-stage">
      {/* Frame-glow (drop-shadow) stays off: it extends past the card's own
          silhouette into what would otherwise be transparent space, and
          GIF's 1-bit alpha can't do that soft falloff — it'd render as a
          hard-edged ring. backgroundGlowUrl doesn't have that problem: it's
          a mix-blend-mode:screen overlay contained entirely inside the
          already-opaque window (behind the frame border), so it never
          touches the alpha channel and is safe to include here. */}
      <TotyCardVisual
        streamer={streamer}
        assets={assets}
        backgroundGlowUrl={getBackgroundGlowUrl(id)}
        showGlow={false}
      />
    </div>
  );
}
