import type { StreamerRecord } from "../../shared/model.js";

/**
 * Local, render-only copy of a streamer used everywhere in pass-announcement
 * (candidate pool, pass list, drag overlay, reveal card, rail, exported
 * image): strips the fancy/fancyLite card-board sparkle decoration
 * (distracting on these compact drag cards) and ignores any custom
 * profileImageUrl override, always falling back to the SOOP-id-based
 * default photo instead — Avatar already does that fallback whenever
 * profileImageUrl is undefined, so clearing it here is enough.
 */
export function toPassAnnouncementStreamer(streamer: StreamerRecord): StreamerRecord {
  return {
    ...streamer,
    isFancy: false,
    isFancyLite: false,
    profileImageUrl: undefined,
  };
}
