import { Component, lazy, Suspense, type ReactNode } from "react";
import { App } from "./App.js";
import { CursorOverlay } from "./CursorOverlay";
import { useEntryMode } from "./entryMode";
import { PITCH_FALLBACK_NOTICE, setEntryNotice } from "./entryNotice";
import { loadCursorPlayerId } from "./storage";

// The pitch (2D canvas) and everything it needs stay out of the dashboard path: the chunk is only
// requested when the entry mode is "pitch", and the dashboard (snapshot fetch, overlays) is not mounted then.
const PitchEntry = lazy(() => import("./pitch/PitchEntry"));

const BACKDROP = { position: "fixed", inset: 0, zIndex: 80, background: "#05060f" } as const;

/** A failed chunk load / render error inside the pitch sends the visitor to the dashboard instead of a blank page. */
class PitchBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[pitch] failed to load, opening the dashboard:", error);
    setEntryNotice(PITCH_FALLBACK_NOTICE);
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Root() {
  const { mode, goDashboard, goPitch, pitchAvailable } = useEntryMode();
  if (mode === "dashboard") return <App onGoPitch={pitchAvailable ? goPitch : undefined} />;
  // Same saved pointer the dashboard uses (chosen there via CursorPicker); re-read on every switch into the pitch.
  const cursorPlayerId = loadCursorPlayerId();
  return (
    <>
      <PitchBoundary onFail={goDashboard}>
        <Suspense fallback={<div style={BACKDROP} />}>
          <PitchEntry onGoDashboard={goDashboard} customCursor={cursorPlayerId !== "default"} />
        </Suspense>
      </PitchBoundary>
      {cursorPlayerId !== "default" && <CursorOverlay playerId={cursorPlayerId} />}
    </>
  );
}
