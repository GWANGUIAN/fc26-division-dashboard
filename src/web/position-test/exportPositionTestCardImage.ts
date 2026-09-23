import type { PositionTestResultEntry } from "./positionTestResults";

/**
 * Downloads the revealed result card's art file as-is (no canvas
 * compositing, no title text burned in) — same approach as
 * fortune/exportFortuneCardImage.ts. Fetches it as a blob first (rather than
 * a plain `<a href download>`) so the saved filename is reliable across
 * browsers even though frontUrl is a hashed Vite asset URL.
 */
export async function exportPositionTestCardPng(
  name: string,
  entry: PositionTestResultEntry,
  frontUrl: string,
): Promise<void> {
  const response = await fetch(frontUrl);
  const blob = await response.blob();
  const extension = frontUrl.split(".").pop()?.split("?")[0] || "webp";

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-나의축구포지션-${entry.title}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}
