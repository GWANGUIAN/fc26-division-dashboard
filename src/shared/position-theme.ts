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

const POSITION_CODE_GROUP: Record<string, PositionGroup> = {
  ST: "FW",
  CF: "FW",
  WF: "FW",
  RW: "FW",
  LW: "FW",
  CM: "MF",
  CDM: "MF",
  CAM: "MF",
  RM: "MF",
  LM: "MF",
  CB: "DF",
  FB: "DF",
  RB: "DF",
  LB: "DF",
  RWB: "DF",
  LWB: "DF",
  SW: "DF",
  GK: "GK",
};

export function positionGroupOf(code?: string): PositionGroup | undefined {
  return code ? POSITION_CODE_GROUP[code.toUpperCase()] : undefined;
}

export function positionColor(code?: string): string {
  const group = positionGroupOf(code);
  return group ? POSITION_GROUP_COLORS[group] : POSITION_GROUP_FALLBACK_COLOR;
}
