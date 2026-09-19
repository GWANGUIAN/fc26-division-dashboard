import type { CastId, WorldSave } from "../types";
import type { MarkerKind } from "./missions";
import { WEED_RESTORED_FLAG } from "./progress";

// The story beats that are not missions (docs/world/02 §8–§9): the director's progress talks after 3/6/9
// shards, the finale offer that opens the stadium, and the ending that follows the showdown. Everything here
// is a pure function of the save, so the overlay, the engine (markers) and the tests read the same rules.

export const STADIUM_OPEN_FLAG = "stadium-open";
/** Set by the showdown's completion: the ending cut is due (or being replayed after the world was closed midway). */
export const FINALE_WON_FLAG = "finale-won";
export const ENDING_SEEN_FLAG = "ending-seen";
export const WEED_OPEN_FLAG = "area-weed-open";

/** Set when the ending cut is over: the ending is seen, the Weeder district is opened and turns green. */
export const ENDING_FLAGS: readonly string[] = [ENDING_SEEN_FLAG, WEED_OPEN_FLAG, WEED_RESTORED_FLAG];

/** Shard counts at which the director has something to say (02 §8). */
export const BEAT_SHARDS: readonly number[] = [3, 6, 9];
export const beatFlag = (shards: number) => `beat-${shards}`;

export const STORY_HOST: CastId = "woowakgood";

export type StoryBeat = { kind: "beat"; shards: number; /** Flags set when the talk is over: this beat and every earlier one. */ flags: string[] };

const flagSet = (save: Pick<WorldSave, "flags">, flag: string) => save.flags[flag] === true;

/**
 * What the director has to tell the player next, or null. A progress talk is the highest beat reached that has
 * not been heard — earlier ones are marked as heard with it, so someone who collected two shards between visits
 * is not lectured twice. The all-shards report is an actual mission (`m-89-director-report`), not a story beat.
 */
export function pendingStoryBeat(save: Pick<WorldSave, "player" | "shards" | "flags">): StoryBeat | null {
  // The epilogue replaces every unfinished progress reminder.  A player may have skipped a director visit at
  // three, six, or nine shards, but those old beats must never leak into the town's post-ending dialogue.
  if (flagSet(save, ENDING_SEEN_FLAG)) return null;
  for (const shards of [...BEAT_SHARDS].reverse()) {
    if (save.shards >= shards && !flagSet(save, beatFlag(shards))) {
      return { kind: "beat", shards, flags: BEAT_SHARDS.filter((n) => n <= shards).map(beatFlag) };
    }
  }
  return null;
}

/** The director wears the blue `?` while he has a talk waiting (the same "new" marker a fresh mission gets). */
export function storyMarker(save: Pick<WorldSave, "player" | "shards" | "flags">, cast: CastId): MarkerKind | null {
  return cast === STORY_HOST && pendingStoryBeat(save) !== null ? "new" : null;
}

/** The showdown is won but the ending cut has not finished yet (also true after the world was closed halfway through it). */
export function endingPending(save: Pick<WorldSave, "flags">): boolean {
  return flagSet(save, FINALE_WON_FLAG) && !flagSet(save, ENDING_SEEN_FLAG);
}

/** Adds the flags that close the story (ending seen, Weeder district open and restored). */
export function withEndingFlags<T extends Pick<WorldSave, "flags">>(save: T): T {
  return { ...save, flags: { ...save.flags, ...Object.fromEntries(ENDING_FLAGS.map((flag) => [flag, true as const])) } };
}
