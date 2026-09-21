import { createRoot } from "react-dom/client";
import "./web/world/world.css";
import "./web/world/world-ui.css";
import "./web/world/world-mission.css";
import { GrassRushModal } from "./web/world/arcade/GrassRushModal";

const params = new URLSearchParams(location.search);
createRoot(document.getElementById("stage-wrap")!).render(
  <div className="world-stage" style={{ position: "relative", width: 640, height: 360, transform: "scale(2)", transformOrigin: "0 0" }}>
    <GrassRushModal player={(params.get("p") as never) ?? "janine95kim"} best={950} onClose={() => {}} />
  </div>,
);
