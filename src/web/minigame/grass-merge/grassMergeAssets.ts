const tierUrl = (tier: number) => `/grass-merge-tier-${String(tier).padStart(2, "0")}.webp`;

export const grassMergeAssetUrls = {
  icon: "/grass-merge-icon.webp",
  board: "/grass-merge-board.webp",
  background: "/grass-merge-background.webp",
  burst: "/grass-merge-burst.webp",
  tiers: Array.from({ length: 11 }, (_, index) => tierUrl(index + 1)),
} as const;

export function loadGrassMergeImage(url: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth > 0 ? image : undefined);
    image.onerror = () => resolve(undefined);
    image.src = url;
  });
}

export async function loadGrassMergeAssets() {
  const [icon, board, burst, ...tiers] = await Promise.all([
    loadGrassMergeImage(grassMergeAssetUrls.icon),
    loadGrassMergeImage(grassMergeAssetUrls.board),
    loadGrassMergeImage(grassMergeAssetUrls.burst),
    ...grassMergeAssetUrls.tiers.map(loadGrassMergeImage),
  ]);
  return { icon, board, burst, tiers };
}

export type GrassMergeAssets = Awaited<ReturnType<typeof loadGrassMergeAssets>>;
