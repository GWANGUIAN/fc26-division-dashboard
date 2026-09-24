// Canvas text in Galmuri11 (docs/pitch/01 §3-4b, 03 §0). Text is never baked into images.
// The @font-face comes from the galmuri.css @import in styles.css (jsDelivr); it downloads lazily, so
// `ensurePixelFont` must run before the first frame that needs it.

export const PIXEL_FONT_FAMILY = '"Galmuri11", "Courier New", monospace';

/** Sample covering the Hangul + Latin glyphs the pitch draws, so the right font subset is fetched. */
const FONT_SAMPLE = "잔디동 PITCH 가나다라마바사 0123456789 %";

export const TEXT_COLORS = {
  base: "#f7f7ff",
  gold: "#ffd23f",
  coral: "#ff4d6d",
  amber: "#ffb400",
  shadow: "#0a0a1a",
} as const;

/** Resolves true when Galmuri11 is usable, false on timeout/failure (drawing then uses the monospace fallback). */
export async function ensurePixelFont(timeoutMs = 4000): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return false;
  try {
    const loaded = await Promise.race([
      document.fonts.load("12px Galmuri11", FONT_SAMPLE).then((faces) => faces.length > 0),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]);
    return loaded;
  } catch {
    return false;
  }
}

export interface TextStyle {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** Draw a 1px navy drop shadow. */
  shadow?: boolean;
}

/** Integer coordinates only — fractional positions blur pixel fonts. */
export function drawText(g: CanvasRenderingContext2D, text: string, x: number, y: number, style: TextStyle = {}) {
  const { size = 12, color = TEXT_COLORS.base, align = "left", baseline = "alphabetic", shadow = true } = style;
  g.font = `${size}px ${PIXEL_FONT_FAMILY}`;
  g.textAlign = align;
  g.textBaseline = baseline;
  const px = Math.round(x);
  const py = Math.round(y);
  if (shadow) {
    g.fillStyle = TEXT_COLORS.shadow;
    g.fillText(text, px, py + 1);
  }
  g.fillStyle = color;
  g.fillText(text, px, py);
}
