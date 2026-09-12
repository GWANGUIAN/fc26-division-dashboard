import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { TotyCardCapturePage } from "./toty-card/TotyCardCapturePage.js";
import { WOOWAKGOOD_ASCII_ART } from "./asciiArt.generated.js";
import "./styles.css";

console.log(WOOWAKGOOD_ASCII_ART);
console.log("형 사랑해");

// Dev-only capture route for scripts/generate-toty-preview.mjs — never
// reached by a real visitor, no link in the UI points at it.
const isTotyCapture = new URLSearchParams(window.location.search).has("totyCapture");

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isTotyCapture ? <TotyCardCapturePage /> : <App />}</StrictMode>,
);
