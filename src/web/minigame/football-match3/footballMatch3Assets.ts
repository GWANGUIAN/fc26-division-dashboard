const tileNames = ["ball", "jersey", "boots", "whistle", "glove", "redcard"] as const;
export const footballMatch3AssetUrls = {
  icon: "/football-match3-icon.webp", background: "/football-match3-background.webp", board: "/football-match3-board.webp", sparkle: "/football-match3-sparkle.webp",
  line: "/football-match3-special-line.webp", golden: "/football-match3-special-golden.webp",
  tiles: tileNames.map((name) => `/football-match3-tile-${name}.webp`),
} as const;
export function loadFootballMatch3Image(url: string): Promise<HTMLImageElement | undefined> { return new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image.naturalWidth ? image : undefined); image.onerror = () => resolve(undefined); image.src = url; }); }
export async function loadFootballMatch3Assets() {
  const [icon, background, board, sparkle, line, golden, ...tiles] = await Promise.all([loadFootballMatch3Image(footballMatch3AssetUrls.icon), loadFootballMatch3Image(footballMatch3AssetUrls.background), loadFootballMatch3Image(footballMatch3AssetUrls.board), loadFootballMatch3Image(footballMatch3AssetUrls.sparkle), loadFootballMatch3Image(footballMatch3AssetUrls.line), loadFootballMatch3Image(footballMatch3AssetUrls.golden), ...footballMatch3AssetUrls.tiles.map(loadFootballMatch3Image)]);
  return { icon, background, board, sparkle, line, golden, tiles };
}
export type FootballMatch3Assets = Awaited<ReturnType<typeof loadFootballMatch3Assets>>;
