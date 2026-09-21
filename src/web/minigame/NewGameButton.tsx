import { RotateCcw } from "lucide-react";
import "./new-game-button.css";

/**
 * "새 게임": gives up the run in progress and starts a fresh one. The caller only shows it while a run
 * is being played; the game-over panels keep their own "다시 시작" button.
 * `hidden` is `visibility: hidden`: the button leaves the tab order and the accessibility tree but keeps its room
 * in the layout, so the HUD does not jump when a run starts or ends.
 */
export function NewGameButton({ onNewGame, hidden = false, className = "" }: { onNewGame: () => void; hidden?: boolean; className?: string }) {
  return (
    <button
      type="button"
      className={`new-game-button ${hidden ? "new-game-button--hidden" : ""} ${className}`}
      onClick={(event) => {
        const button = event.currentTarget;
        const dialog = button.closest('[role="dialog"]');
        onNewGame();
        // The game re-creates its play field, so hand the keyboard back to it: focus left on this button would turn
        // the games' Space/Enter keys into one restart after another.
        window.setTimeout(() => {
          dialog?.querySelector<HTMLElement>("canvas")?.focus({ preventScroll: true });
          if (document.activeElement === button) button.blur();
        }, 0);
      }}
    >
      <RotateCcw aria-hidden="true" />
      새 게임
    </button>
  );
}
