import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Root } from "./Root.js";
import "./styles.css";

// Dev-only capture route for scripts/generate-toty-preview.mjs — never
// reached by a real visitor, no link in the UI points at it. Lazy so it stays
// out of the entry chunk.
const TotyCardCapturePage = lazy(() =>
  import("./toty-card/TotyCardCapturePage.js").then((m) => ({ default: m.TotyCardCapturePage })),
);
const isTotyCapture = new URLSearchParams(window.location.search).has("totyCapture");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isTotyCapture ? (
      <Suspense fallback={null}>
        <TotyCardCapturePage />
      </Suspense>
    ) : (
      <Root />
    )}
  </StrictMode>,
);
