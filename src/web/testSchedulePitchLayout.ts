import type { TestScheduleSlot, TestScheduleTeam } from "./testScheduleData.js";

type PitchLine = "GK" | "DF" | "DM" | "MF" | "FW";
type PitchSide = "left" | "right" | "center" | "auto";

/**
 * Where a position code sits on the pitch: which line (depth) it plays on,
 * and which flank. "auto" codes (FB, WF) don't encode a side themselves —
 * whichever ones show up on a given line alternate left/right in the order
 * they appear in the roster data.
 */
const POSITION_INFO: Record<string, { line: PitchLine; side: PitchSide }> = {
  GK: { line: "GK", side: "center" },
  CB: { line: "DF", side: "center" },
  SW: { line: "DF", side: "center" },
  FB: { line: "DF", side: "auto" },
  LB: { line: "DF", side: "left" },
  RB: { line: "DF", side: "right" },
  LWB: { line: "DF", side: "left" },
  RWB: { line: "DF", side: "right" },
  CDM: { line: "DM", side: "center" },
  CM: { line: "MF", side: "center" },
  CAM: { line: "MF", side: "center" },
  LM: { line: "MF", side: "left" },
  RM: { line: "MF", side: "right" },
  ST: { line: "FW", side: "center" },
  CF: { line: "FW", side: "center" },
  WF: { line: "FW", side: "auto" },
  LW: { line: "FW", side: "left" },
  RW: { line: "FW", side: "right" },
};

function classify(code: string): { line: PitchLine; side: PitchSide } {
  return POSITION_INFO[code.toUpperCase()] ?? { line: "MF", side: "center" };
}

/** How deep (0 = own goal line, 1 = halfway line) each outfield line sits. */
const LINE_DEPTH: Record<Exclude<PitchLine, "GK">, number> = {
  DF: 0.28,
  DM: 0.46,
  MF: 0.62,
  FW: 0.82,
};
const GK_DEPTH = 0.09;

/** Maps a line's depth onto the bottom half (own goal at y=100) or top half (own goal at y=0), leaving a gap around the halfway line (y=50) for the two teams to face off. */
function yForLine(line: PitchLine, half: "bottom" | "top"): number {
  const depth = line === "GK" ? GK_DEPTH : LINE_DEPTH[line];
  return half === "bottom" ? 100 - depth * 48 : depth * 48;
}

function evenSpread(count: number, min: number, max: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(min + max) / 2];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + step * index);
}

export interface PitchSlotView {
  /** Stable id for this slot, independent of who's currently assigned — `${dateIso}__${teamLabel}__${originalIndex}`. */
  key: string;
  originalIndex: number;
  position: string;
  xPct: number;
  yPct: number;
  /** The base (pre-override) streamer id from the roster data, if any. */
  baseStreamerId?: string;
  /**
   * Key of this slot's left/right mirror on the same line, if one exists —
   * swapping the two players' assignments flips who's on which flank.
   */
  mirrorKey?: string;
}

/**
 * Lays a team's test-schedule slots out on a pitch by grouping same-depth
 * positions into a line (GK/DF/DM/MF/FW) and spreading each line's players
 * left-to-right. Codes with an explicit side (LB/RB/LM/RM/LW/RW) go straight
 * to that flank; ambiguous "auto" codes (FB, WF) alternate flanks in roster
 * order. Same-line entries that end up mirrored across the center (paired
 * flanks, or an even center group split down the middle) get a `mirrorKey`
 * so the UI can offer a left/right swap.
 */
export function computeTeamPitchLayout(
  team: TestScheduleTeam,
  dateIso: string,
  half: "bottom" | "top",
): PitchSlotView[] {
  const keyFor = (index: number) => `${dateIso}__${team.label}__${index}`;
  const lines: Record<PitchLine, { slot: TestScheduleSlot; index: number }[]> = {
    GK: [],
    DF: [],
    DM: [],
    MF: [],
    FW: [],
  };
  team.slots.forEach((slot, index) => {
    lines[classify(slot.position).line].push({ slot, index });
  });

  const result: PitchSlotView[] = [];
  const push = (
    entry: { slot: TestScheduleSlot; index: number },
    xPct: number,
    yPct: number,
  ) => {
    result.push({
      key: keyFor(entry.index),
      originalIndex: entry.index,
      position: entry.slot.position,
      xPct,
      yPct,
      baseStreamerId: entry.slot.streamerId,
    });
  };

  // Some dates' roster data omits a GK slot entirely for a team — always show
  // one anyway (as a vacant "대기인원" spot, index -1 since it has no source
  // row) so every lineup has a keeper to fill in.
  const gkEntries =
    lines.GK.length > 0 ? lines.GK : [{ slot: { position: "GK" }, index: -1 }];
  gkEntries.forEach((entry) => push(entry, 50, yForLine("GK", half)));

  (["DF", "DM", "MF", "FW"] as const).forEach((line) => {
    const entries = lines[line];
    if (entries.length === 0) return;
    const y = yForLine(line, half);

    const left: typeof entries = [];
    const right: typeof entries = [];
    const center: typeof entries = [];
    let autoToggle = 0;
    for (const entry of entries) {
      const { side } = classify(entry.slot.position);
      if (side === "left") left.push(entry);
      else if (side === "right") right.push(entry);
      else if (side === "center") center.push(entry);
      else {
        (autoToggle % 2 === 0 ? left : right).push(entry);
        autoToggle++;
      }
    }

    const hasFlanks = left.length > 0 || right.length > 0;
    const leftXs = evenSpread(left.length, 8, 28);
    const rightXs = evenSpread(right.length, 72, 92);
    const centerXs = evenSpread(
      center.length,
      hasFlanks ? 36 : 26,
      hasFlanks ? 64 : 74,
    );

    left.forEach((entry, index) => push(entry, leftXs[index], y));
    right.forEach((entry, index) => push(entry, rightXs[index], y));
    center.forEach((entry, index) => push(entry, centerXs[index], y));

    const byKey = new Map(result.map((view) => [view.key, view]));
    const mirror = (a: string, b: string) => {
      byKey.get(a)!.mirrorKey = b;
      byKey.get(b)!.mirrorKey = a;
    };
    if (left.length > 0 && left.length === right.length) {
      left.forEach((entry, index) => mirror(keyFor(entry.index), keyFor(right[index].index)));
    }
    const centerCount = center.length;
    for (let index = 0; index < Math.floor(centerCount / 2); index++) {
      mirror(keyFor(center[index].index), keyFor(center[centerCount - 1 - index].index));
    }
  });

  return result;
}
