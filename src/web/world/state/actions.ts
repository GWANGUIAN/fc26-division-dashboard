import type { MinigameRoundResult } from "../types";

// What an interactable can do besides showing text (`examine[].action` in the map JSON, docs/world/03 §7).
// Kept as a plain string in the data so a map edit needs no code; this is the one place that reads it.

export type WorldAction =
  | { type: "minigame"; game: MinigameRoundResult["game"] }
  | { type: "cards" }
  | { type: "mailbox"; id: string };

const GAMES: readonly MinigameRoundResult["game"][] = ["soccer-sum10", "kickups", "freekick", "cardmatch"];

/** `minigame:<game>` / `cards` / `mailbox:<id>`; anything else (including a game that does not exist yet) is null. */
export function parseAction(action: string | undefined): WorldAction | null {
  if (!action) return null;
  if (action === "cards") return { type: "cards" };
  const colon = action.indexOf(":");
  if (colon < 0) return null;
  const head = action.slice(0, colon);
  const arg = action.slice(colon + 1);
  if (head === "minigame") {
    const game = GAMES.find((entry) => entry === arg);
    return game ? { type: "minigame", game } : null;
  }
  if (head === "mailbox" && arg) return { type: "mailbox", id: arg };
  return null;
}
