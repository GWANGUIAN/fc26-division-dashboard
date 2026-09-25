import { Component, lazy, Suspense, type ReactNode } from "react";
import { CursorOverlay } from "./CursorOverlay";
import { useEntryMode } from "./entryMode";
import { PITCH_FALLBACK_NOTICE, setEntryNotice } from "./entryNotice";
import { loadCursorPlayerId } from "./storage";

// Each mode is its own chunk and only the one for the resolved entry mode is requested: a pitch visitor
// never downloads the dashboard bundle (snapshot, overlays), and a dashboard visitor never gets the pitch.
const PitchEntry = lazy(() => import("./pitch/PitchEntry"));
const App = lazy(() => import("./App.js").then((m) => ({ default: m.App })));

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
  if (mode === "dashboard") {
    return (
      <Suspense fallback={null}>
        <App onGoPitch={pitchAvailable ? goPitch : undefined} />
      </Suspense>
    );
  }
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
