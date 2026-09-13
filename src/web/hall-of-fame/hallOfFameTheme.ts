import type { TrophyBadge } from "../../shared/trophy.js";

// Text/foil color per trophy category, matched to that category's emblem
// enamel color (see docs/hall-of-fame-card-prompts.md) — same idea as
// toty-card/totyCardTheme.ts, but keyed by category instead of streamer id.
const HALL_OF_FAME_THEME: Record<TrophyBadge["key"], { color: string; glow: string }> = {
  "division-one": { color: "#ffd76a", glow: "#fff3c9" }, // gold laurel/star
  "most-matches": { color: "#ff6f6f", glow: "#ffd9d9" }, // gunmetal + red enamel
  "best-win-rate": { color: "#d9b3ff", glow: "#f6ecff" }, // royal purple + gold crown
  "daily-promotion": { color: "#5cdbff", glow: "#eaffff" }, // cyan comet trail
  "self-promotion": { color: "#ff6fd8", glow: "#ffe9fb" }, // magenta starburst
  "hard-worker": { color: "#ffa63a", glow: "#ffe0b0" }, // ember flame
};

const DEFAULT_THEME = HALL_OF_FAME_THEME["division-one"];

export function getHallOfFameTheme(categoryKey: TrophyBadge["key"]): { color: string; glow: string } {
  return HALL_OF_FAME_THEME[categoryKey] ?? DEFAULT_THEME;
}

// division-one is the only category with a rank (🥇🥈🥉) — rather than
// generate three separate emblem images, the one shared emblem art gets
// tinted gold/silver/bronze via CSS custom properties (see
// hall-of-fame-card.css's --hof-tier-color usage). See
// docs/hall-of-fame-card-prompts.md for why this is the default plan.
const TIER_TINTS: Record<1 | 2 | 3, { color: string; glow: string }> = {
  1: { color: "#ffd76a", glow: "#fff3c9" }, // gold
  2: { color: "#d8dce6", glow: "#f4f6fb" }, // silver
  3: { color: "#cd8a4c", glow: "#f0c99a" }, // bronze
};

export function tierTint(tier: 1 | 2 | 3): { color: string; glow: string } {
  return TIER_TINTS[tier];
}
