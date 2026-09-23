// Auto-scans src/web/assets/position-test/ for the "나의 축구 포지션은?" art,
// same import.meta.glob convention as fortuneCardAssets.ts/totyCardAssets.ts
// — drop a correctly-named file in and it's picked up, no manifest to
// maintain. Every getter returns undefined when the file hasn't been
// generated yet — callers fall back to a CSS/icon placeholder so the
// feature works end-to-end before any art exists. See
// docs/position-test-prompts.md for the file naming rules and the matching
// generation prompts.

const modules = import.meta.glob<string>("../assets/position-test/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

function findByFilename(filename: string): string | undefined {
  return Object.entries(modules).find(([path]) => path.endsWith(`/${filename}`))?.[1];
}

/** Shared result-card back — identical for every result, so the card can't
 * be identified before it's flipped. */
export function getPositionTestCardBackUrl(): string | undefined {
  return findByFilename("position-test-card-back.webp");
}

export function getPositionTestButtonIconUrl(): string | undefined {
  return findByFilename("position-test-button-icon.webp");
}

export function getPositionTestPopupBackdropUrl(): string | undefined {
  return findByFilename("position-test-popup-backdrop.webp");
}

export function getPositionTestRevealBurstUrl(): string | undefined {
  return findByFilename("position-test-reveal-burst.webp");
}

/** That member's finished result-card illustration for the given theme
 * ("A" | "B"), if generated yet — see docs/position-test-prompts.md's
 * `<memberId>-position-a.webp` / `-b.webp` naming rule. */
export function getPositionTestResultCardUrl(memberId: string, style: "A" | "B"): string | undefined {
  return findByFilename(`${memberId}-position-${style.toLowerCase()}.webp`);
}
