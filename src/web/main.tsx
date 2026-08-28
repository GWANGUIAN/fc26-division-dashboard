import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { WOOWAKGOOD_ASCII_ART } from "./asciiArt.generated.js";
import "./styles.css";

console.log(WOOWAKGOOD_ASCII_ART);
console.log("형 사랑해");

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
