import type { CSSProperties } from "react";
import { getWorldAssetUrl } from "../worldAssets";

/**
 * Button art is optional: with the images, `--btn-*` custom properties feed a 9-slice border-image
 * (class `world-btn--art`); without them plain CSS draws the plate.
 */
export function buttonProps(kind: "primary" | "secondary"): { className: string; style?: CSSProperties } {
  const base = `world-btn world-btn--${kind}`;
  const normal = getWorldAssetUrl(`ui/btn-${kind}-normal`);
  if (!normal) return { className: base };
  const hover = getWorldAssetUrl(`ui/btn-${kind}-hover`) ?? normal;
  const pressed = getWorldAssetUrl(`ui/btn-${kind}-pressed`) ?? normal;
  return {
    className: `${base} world-btn--art`,
    style: { "--btn-normal": `url(${normal})`, "--btn-hover": `url(${hover})`, "--btn-pressed": `url(${pressed})` } as CSSProperties,
  };
}
