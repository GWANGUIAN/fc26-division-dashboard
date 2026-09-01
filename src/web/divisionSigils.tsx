import { useId } from "react";

/**
 * Per-division "holo watermark" for the card-view trading card
 * (`StreamerFifaCard`). Real foil-card textures (see reference screenshot)
 * aren't a checkerboard of separately-spaced icons — they're a dense,
 * edge-to-edge geometric mesh where each cell's shape actually touches its
 * neighbors. Regular pentagons/stars can't tile a plane without gaps (that's
 * a hard math fact, not a rendering choice), so every division shares the
 * same tiling silhouette — an elongated hexagon inscribed in its tile's
 * bounding box, touching all four edges at fixed fractions so adjacent
 * copies always meet exactly, no offset-row math required — and gets its
 * own identity from a small accent mark stamped at each cell's center.
 */

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function polygonPoints(
  sides: number,
  cx: number,
  cy: number,
  r: number,
  rotate = 0,
): string {
  return Array.from({ length: sides }, (_, i) =>
    polar(cx, cy, r, rotate + (360 / sides) * i),
  )
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

function starPoints(
  spikes: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  rotate = 0,
): string {
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rotate + (360 / (spikes * 2)) * i;
    return polar(cx, cy, r, angle);
  })
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

/** An elongated hexagon (flat top/bottom, pointed left/right) whose vertices
 * sit exactly on the w×h box's boundary — top/bottom edges run from `pinch`
 * to `1-pinch` of the width, left/right points touch the vertical center of
 * each side. Because every tile in a `<pattern>` is an identical copy, and
 * these vertices land on the same fractional boundary position every time,
 * neighboring copies always meet exactly: no gaps, no per-tile offset math. */
function hexTilePoints(w: number, h: number, pinch: number): string {
  const l = w * pinch;
  const r = w * (1 - pinch);
  return `${l},0 ${r},0 ${w},${h / 2} ${r},${h} ${l},${h} 0,${h / 2}`;
}

/** How "pointed" vs "boxy" each division's shared hex silhouette is — purely
 * cosmetic variety; tiling correctness never depends on this value. */
const PINCH: Record<number, number> = {
  1: 0.38,
  2: 0.3,
  3: 0.34,
  4: 0.26,
  5: 0.3,
  6: 0.22,
  7: 0.3,
  8: 0.32,
  9: 0.28,
  10: 0.3,
};

/** A small per-division glyph stamped at the center of every cell — this is
 * where division identity actually lives, since the outer silhouette is
 * shared (see hexTilePoints doc comment above). */
function accentMark(division: number, cx: number, cy: number, a: number): React.ReactNode {
  switch (division) {
    case 1: // dot + four short rays
      return (
        <>
          <circle cx={cx} cy={cy} r={a * 0.3} fill="currentColor" stroke="none" />
          <line x1={cx} y1={cy - a} x2={cx} y2={cy - a * 0.55} />
          <line x1={cx} y1={cy + a * 0.55} x2={cx} y2={cy + a} />
          <line x1={cx - a} y1={cy} x2={cx - a * 0.55} y2={cy} />
          <line x1={cx + a * 0.55} y1={cy} x2={cx + a} y2={cy} />
        </>
      );
    case 2: // X mark
      return (
        <>
          <line x1={cx - a * 0.7} y1={cy - a * 0.7} x2={cx + a * 0.7} y2={cy + a * 0.7} />
          <line x1={cx - a * 0.7} y1={cy + a * 0.7} x2={cx + a * 0.7} y2={cy - a * 0.7} />
        </>
      );
    case 3: // tiny hexagon
      return <polygon points={polygonPoints(6, cx, cy, a * 0.85, 0)} />;
    case 4: // tiny five-point star
      return <polygon points={starPoints(5, cx, cy, a * 0.9, a * 0.4, 0)} />;
    case 5: // eight-tick burst
      return (
        <>
          {Array.from({ length: 8 }, (_, i) => {
            const angle = (360 / 8) * i;
            const [x1, y1] = polar(cx, cy, a * 0.4, angle);
            const [x2, y2] = polar(cx, cy, a, angle);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </>
      );
    case 6: // tiny diamond
      return <polygon points={polygonPoints(4, cx, cy, a * 0.85, 45)} />;
    case 7: // three-dot triangular cluster
      return (
        <>
          {[0, 120, 240].map((angle) => {
            const [x, y] = polar(cx, cy, a * 0.55, angle);
            return <circle key={angle} cx={x} cy={y} r={a * 0.18} fill="currentColor" stroke="none" />;
          })}
        </>
      );
    case 8: // tiny ring
      return <circle cx={cx} cy={cy} r={a * 0.68} />;
    case 9: { // short curved swoosh
      const [x1, y1] = polar(cx, cy, a * 0.65, -35);
      const [x2, y2] = polar(cx, cy, a * 0.65, 145);
      return <path d={`M ${x1.toFixed(2)},${y1.toFixed(2)} Q ${cx},${cy} ${x2.toFixed(2)},${y2.toFixed(2)}`} />;
    }
    default: // neutral plus/cross (also used for the card back, division-agnostic)
      return (
        <>
          <line x1={cx - a * 0.75} y1={cy} x2={cx + a * 0.75} y2={cy} />
          <line x1={cx} y1={cy - a * 0.75} x2={cx} y2={cy + a * 0.75} />
        </>
      );
  }
}

function sigilTile(division: number, w: number, h: number): React.ReactNode {
  const pinch = PINCH[division] ?? 0.3;
  const cx = w / 2;
  const cy = h / 2;
  const accent = Math.min(w, h) * 0.24;
  return (
    <>
      <polygon points={hexTilePoints(w, h, pinch)} />
      {accentMark(division, cx, cy, accent)}
    </>
  );
}

const TILE = 30;

export function DivisionSigil({
  division,
  className = "",
}: {
  division: number;
  className?: string;
}) {
  const uid = useId();
  const patternId = `${uid}-tile`;
  return (
    <svg
      className={`division-sigil ${className}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width={TILE} height={TILE}>
          <g fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round">
            {sigilTile(division, TILE, TILE)}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
