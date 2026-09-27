import { STAGES } from "./cleatDropStages";

const targetAssetKeys = STAGES.map((stage) => stage.assetKey);

export const cleatDropAssetUrls = {
  cleatIdle: "/cleat-drop-cleat-idle.webp",
  cleatSwingLeft: "/cleat-drop-cleat-swing-left.webp",
  cleatSwingRight: "/cleat-drop-cleat-swing-right.webp",
  cleatFalling: "/cleat-drop-cleat-falling.webp",
  cleatLanded: "/cleat-drop-cleat-landed.webp",
  legIdle: "/cleat-drop-leg-idle.webp",
  legSwingA: "/cleat-drop-leg-swing-a.webp",
  legSwingB: "/cleat-drop-leg-swing-b.webp",
  background: "/cleat-drop-bg.webp",
  hook: "/cleat-drop-hook.webp",
  icon: "/cleat-drop-icon.webp",
  timerRing: "/cleat-drop-timer-ring.webp",
  stageDotEmpty: "/cleat-drop-stage-dot-empty.webp",
  stageDotFilled: "/cleat-drop-stage-dot-filled.webp",
} as const;

export function loadCleatDropImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth ? image : undefined);
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

export async function loadCleatDropAssets() {
  const urls = cleatDropAssetUrls;
  const [
    cleatIdle, cleatSwingLeft, cleatSwingRight, cleatFalling, cleatLanded,
    legIdle, legSwingA, legSwingB,
    background, hook, icon, timerRing, stageDotEmpty, stageDotFilled,
    ...targets
  ] = await Promise.all([
    loadCleatDropImage(urls.cleatIdle), loadCleatDropImage(urls.cleatSwingLeft), loadCleatDropImage(urls.cleatSwingRight), loadCleatDropImage(urls.cleatFalling), loadCleatDropImage(urls.cleatLanded),
    loadCleatDropImage(urls.legIdle), loadCleatDropImage(urls.legSwingA), loadCleatDropImage(urls.legSwingB),
    loadCleatDropImage(urls.background), loadCleatDropImage(urls.hook), loadCleatDropImage(urls.icon), loadCleatDropImage(urls.timerRing), loadCleatDropImage(urls.stageDotEmpty), loadCleatDropImage(urls.stageDotFilled),
    ...targetAssetKeys.map((key) => loadCleatDropImage(`/cleat-drop-${key}.webp`)),
  ]);
  const targetsByKey: Record<string, HTMLImageElement | undefined> = {};
  targetAssetKeys.forEach((key, index) => { targetsByKey[key] = targets[index]; });
  return {
    cleatIdle, cleatSwingLeft, cleatSwingRight, cleatFalling, cleatLanded,
    legIdle, legSwingA, legSwingB,
    background, hook, icon, timerRing, stageDotEmpty, stageDotFilled,
    targetsByKey,
  };
}

export type CleatDropAssets = Awaited<ReturnType<typeof loadCleatDropAssets>>;
