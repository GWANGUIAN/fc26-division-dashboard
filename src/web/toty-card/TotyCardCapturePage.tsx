import { useEffect } from "react";
import { TotyCardVisual } from "./TotyCardVisual.js";
import { getTotyCardAssets } from "./totyCardAssets.js";
import "./toty-card.css";

/**
 * Bare, transparent, chrome-free rendering of one player's card — reached
 * via ?totyCapture=<id>[&name=...&pos=...&div=...] (see main.tsx). Exists
 * only for scripts/generate-toty-preview.mjs: it opens this URL in headless
 * Chromium, drives the card with synthetic mouse moves, and screenshots
 * each frame with a transparent background to build the downloadable
 * animated WebP preview. Not linked from anywhere in the real UI.
 */
export function TotyCardCapturePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("totyCapture") ?? "";
  const assets = getTotyCardAssets(id);

  // Overrides the app's normal opaque body background (var(--bg-base)) so
  // Playwright's omitBackground screenshot captures real alpha, not a solid
  // color. Scoped to this route only — never reached in the real app.
  useEffect(() => {
    const { style } = document.body;
    const previous = style.background;
    style.background = "transparent";
    return () => {
      style.background = previous;
    };
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
      <TotyCardVisual streamer={streamer} assets={assets} />
    </div>
  );
}
