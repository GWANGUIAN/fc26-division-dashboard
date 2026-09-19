import { isCastId } from "../data/worldCast";
import type { CastId, MinigameRoundResult } from "../types";

// What an interactable can do besides showing text (`examine[].action` in the map JSON, docs/world/03 §7).
// Kept as a plain string in the data so a map edit needs no code; this is the one place that reads it.

export type WorldAction =
  | { type: "minigame"; game: MinigameRoundResult["game"] }
  | { type: "cards" }
  | { type: "daily" | "collection" | "rush-factory" }
  | { type: "mailbox"; id: string }
  /** The framed group photo of the trophy room: opens the photo overlay. */
  | { type: "group-photo" }
  /** The statue on the rune hill that offers the backwards-walking "blessing". */
  | { type: "backwalk-statue" }
  /** A member in the stands during the showdown shouts their line. */
  | { type: "cheer"; cast: CastId };

const GAMES: readonly MinigameRoundResult["game"][] = ["soccer-sum10", "kickups", "freekick", "cardmatch", "rush"];

/** `minigame:<game>` / `cards` / `mailbox:<id>` / `group-photo` / `backwalk-statue` / `cheer:<cast>`; anything else (including a game that does not exist yet) is null. */
export function parseAction(action: string | undefined): WorldAction | null {
  if (!action) return null;
  if (action === "backwalk-statue") return { type: "backwalk-statue" };
  if (action === "daily" || action === "collection" || action === "rush-factory") return { type: action };
  if (action === "cards") return { type: "cards" };
  if (action === "group-photo") return { type: "group-photo" };
  const colon = action.indexOf(":");
  if (colon < 0) return null;
  const head = action.slice(0, colon);
  const arg = action.slice(colon + 1);
  if (head === "minigame") {
    const game = GAMES.find((entry) => entry === arg);
    return game ? { type: "minigame", game } : null;
  }
  if (head === "mailbox" && arg) return { type: "mailbox", id: arg };
  if (head === "cheer" && isCastId(arg)) return { type: "cheer", cast: arg };
  return null;
}
