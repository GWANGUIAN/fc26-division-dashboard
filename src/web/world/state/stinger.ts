import { STINGER_CUTS, STINGER_END_CARD, type StingerCaption, type StingerCut } from "../data/stingerData";

// The stinger is stepped by the player (docs/world/14 §1): each still plays its entrance, holds, and only Enter brings in
// the next one. These are the pure rules; the overlay keeps `index` (which still, -1 = the black lead-in,
// `cuts.length` = fading out after the last press) and how many seconds into that still it is.

export interface StingerCutFrame {
  /** The caption on screen: the latest one whose time has come (it stays until the next one replaces it). */
  caption: StingerCaption | null;
  endCard: boolean;
  /** The entrance is over: the still holds now and Enter moves on. */
  ready: boolean;
}

/** What is on screen `elapsed` seconds after still `index` came in. */
export function stingerCutFrame(index: number, elapsed: number, cuts: readonly StingerCut[] = STINGER_CUTS): StingerCutFrame {
  const cut = cuts[index];
  let caption: StingerCaption | null = null;
  for (const entry of cut.captions) if (elapsed >= entry.at) caption = entry;
  return {
    caption,
    endCard: index === cuts.length - 1 && elapsed >= STINGER_END_CARD.at,
    ready: elapsed >= cut.settleSeconds,
  };
}

/** The moments (seconds after still `index` came in) at which its frame changes: each caption, the end card, the end of the entrance. */
export function stingerCutBoundaries(index: number, cuts: readonly StingerCut[] = STINGER_CUTS): number[] {
  const cut = cuts[index];
  const times = new Set<number>([cut.settleSeconds, ...cut.captions.map((caption) => caption.at)]);
  if (index === cuts.length - 1) times.add(STINGER_END_CARD.at);
  return [...times].filter((time) => time > 0).sort((a, b) => a - b);
}

/**
 * Where an Enter press leads. Nothing happens on the black lead-in, while a still is still coming in, or while the
 * screen fades out; a settled still hands over to the next one, and the last one hands over to the fade (`cuts.length`).
 */
export function advanceStinger(index: number, ready: boolean, cuts: readonly StingerCut[] = STINGER_CUTS): number {
  if (index < 0 || index >= cuts.length) return index;
  return ready ? index + 1 : index;
}
