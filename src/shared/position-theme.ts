export type PositionGroup = "FW" | "MF" | "DF" | "GK";

export const POSITION_GROUP_LABELS: Record<PositionGroup, string> = {
  FW: "공격수",
  MF: "미드필더",
  DF: "수비수",
  GK: "골키퍼",
};

export const POSITION_GROUP_COLORS: Record<PositionGroup, string> = {
  FW: "#ff5c7a",
  MF: "#4ade80",
  DF: "#4f8cff",
  GK: "#ffd76a",
};

/** Fallback color for a position code that doesn't match any known group. */
export const POSITION_GROUP_FALLBACK_COLOR = "#9aa5b1";

/** Source of truth for which individual position codes belong to which group — also drives the position filter dropdown's grouping. */
export const POSITION_GROUP_CODES: Record<PositionGroup, string[]> = {
  FW: ["ST", "CF", "WF", "RW", "LW"],
  MF: ["CM", "CDM", "CAM", "RM", "LM"],
  DF: ["CB", "FB", "RB", "LB", "RWB", "LWB", "SW"],
  GK: ["GK"],
};

/** Every known position code, in group order (FW, MF, DF, GK). */
export const ALL_POSITION_CODES: string[] = Object.values(POSITION_GROUP_CODES).flat();

const POSITION_CODE_GROUP: Record<string, PositionGroup> = Object.fromEntries(
  (Object.entries(POSITION_GROUP_CODES) as [PositionGroup, string[]][]).flatMap(
    ([group, codes]) => codes.map((code) => [code, group]),
  ),
);

export function positionGroupOf(code?: string): PositionGroup | undefined {
  return code ? POSITION_CODE_GROUP[code.toUpperCase()] : undefined;
}

export function positionColor(code?: string): string {
  const group = positionGroupOf(code);
  return group ? POSITION_GROUP_COLORS[group] : POSITION_GROUP_FALLBACK_COLOR;
}
