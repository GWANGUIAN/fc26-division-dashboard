// Shared "?" card back for the card-match minigame — deliberately separate from
// totyCardAssets.ts's per-streamer <id>-card-back.webp scanning (this back has to look identical
// for every card in the deck, or the player could tell cards apart without flipping them). Scanned
// the same way (import.meta.glob) rather than a static import so the game still builds and works
// with a plain CSS "?" placeholder before the art in docs/toty-card-prompts.md is generated —
// dropping card-match-back.webp into src/web/assets/minigame/ is enough to pick it up.
const modules = import.meta.glob<string>("../assets/minigame/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

const CARD_BACK_FILENAME = "card-match-back.webp";
const cardBackEntry = Object.entries(modules).find(([path]) => path.endsWith(`/${CARD_BACK_FILENAME}`));

export function getCardMatchBackUrl(): string | undefined {
  return cardBackEntry?.[1];
}
