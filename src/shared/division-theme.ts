export const DIVISION_COLORS: Record<number, string> = {
  1: "#ffd76a", // gold
  2: "#d9d9e0", // silver
  3: "#cd8a4f", // bronze
  4: "#7ee787",
  5: "#41f7c6",
  6: "#37dbff",
  7: "#4f8cff",
  8: "#a374ff",
  9: "#ff6fd8",
  10: "#a9bbb0", // unranked/season
};

export function divisionColor(division: number): string {
  return DIVISION_COLORS[division] ?? "#f5fbf8";
}
