// Text (position/division/name) color per player, matched by eye to each
// card art's palette — see docs/toty-card-prompts.md for the motif each id
// corresponds to. `glow` is the soft highlight color used behind the name
// when the card is hovered/active; both always pair with a black outline
// (--text-outline in toty-card.css) so they stay legible over any part of
// the busy card art.
const TOTY_CARD_TEXT_THEME: Record<string, { color: string; glow: string }> = {
  hachi97: { color: "#ffdd7a", glow: "#fff6d2" }, // gold + sapphire crystal
  tdnlamuron: { color: "#ffb454", glow: "#ffe3ad" }, // apricot-orange lava/ember
  ju010228: { color: "#d9f27a", glow: "#f3ffe0" }, // lime-green spring vine
  doormomo: { color: "#c9a6ff", glow: "#f0e6ff" }, // violet rune/arcane energy
  bboringirl: { color: "#ff5c5c", glow: "#ffd6d6" }, // gunmetal + red circuit
  kaksjak0730: { color: "#7ec8ff", glow: "#e0f4ff" }, // black obsidian + starlit glass
  sjh4018: { color: "#ffe9b0", glow: "#eaf6ff" }, // gold + sky-blue cloud/feather
};

const DEFAULT_TEXT_THEME = TOTY_CARD_TEXT_THEME.hachi97;

export function getTotyCardTextTheme(streamerId: string): { color: string; glow: string } {
  return TOTY_CARD_TEXT_THEME[streamerId] ?? DEFAULT_TEXT_THEME;
}
