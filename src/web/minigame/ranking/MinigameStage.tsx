import type { ReactNode } from "react";
import "./ranking.css";

/**
 * Lays a minigame out next to its ranking panel: the game on the left, the
 * panel on the right (stacked underneath on narrow screens). Both must be
 * rendered inside the Modal's children — anything outside the dialog section
 * would close the modal on click.
 */
export function MinigameStage({ children, panel }: { children: ReactNode; panel: ReactNode }) {
  return (
    <div className="minigame-stage">
      <div className="minigame-stage__game">{children}</div>
      <aside className="minigame-stage__panel">{panel}</aside>
    </div>
  );
}
