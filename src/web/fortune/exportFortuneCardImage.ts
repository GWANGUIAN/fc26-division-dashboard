import type { FortuneCardEntry } from "./fortuneCardData";

/**
 * Downloads the revealed tarot card's art file as-is (no canvas
 * compositing, no card-name text burned in) — just the generated image,
 * renamed to something readable. Fetches it as a blob first (rather than a
 * plain `<a href={frontUrl} download>`) so the saved filename is reliable
 * across browsers even though frontUrl is a hashed Vite asset URL.
 */
export async function exportFortuneCardPng(
  displayName: string | undefined,
  entry: FortuneCardEntry,
  frontUrl: string,
): Promise<void> {
  const response = await fetch(frontUrl);
  const blob = await response.blob();
  const extension = frontUrl.split(".").pop()?.split("?")[0] || "webp";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${displayName ?? entry.id}-오늘의운세-${entry.cardName}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}
