// Auto-detects which 응원 유니폼 등판 이미지가 생성됐는지 by scanning
// src/web/assets/uniform-customizer/ at build time — dropping in
// `<id>.webp` is enough, no manifest to hand-maintain. Same "no manifest"
// convention as src/web/group-photo/groupPhotoAssets.ts. A kit only shows
// up in the picker once its image exists, so the modal degrades gracefully
// while assets are still being generated. See docs/uniform-customizer-prompts.md
// for the generation workflow.

const modules = import.meta.glob<string>("../assets/uniform-customizer/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

export type UniformKitId = "home-outfield" | "home-gk" | "away-outfield" | "away-gk";

const KIT_LABELS: Record<UniformKitId, string> = {
  "home-outfield": "홈 · 일반",
  "home-gk": "홈 · 골키퍼",
  "away-outfield": "어웨이 · 일반",
  "away-gk": "어웨이 · 골키퍼",
};

const KIT_ORDER: UniformKitId[] = ["home-outfield", "home-gk", "away-outfield", "away-gk"];

const kitUrls: Partial<Record<UniformKitId, string>> = {};
for (const [path, url] of Object.entries(modules)) {
  const id = (path.split("/").pop() ?? "").replace(/\.webp$/, "") as UniformKitId;
  kitUrls[id] = url;
}

export interface UniformKit {
  id: UniformKitId;
  label: string;
  image: string;
}

export const UNIFORM_KITS: UniformKit[] = KIT_ORDER.filter((id) => kitUrls[id]).map((id) => ({
  id,
  label: KIT_LABELS[id],
  image: kitUrls[id]!,
}));

export interface UniformTextTheme {
  /** Number/name fill color. */
  fill: string;
  /** Number/name outline (-webkit-text-stroke / canvas strokeText) color. */
  outline: string;
}

// Light-base kits (white/orange) get the site's mint accent as the fill
// with a black outline for contrast; dark-base kits (black/navy) invert
// that to a white fill with a mint outline, so the printed number/name
// always reads clearly against that kit's own base color. away-gk is the
// one exception — white fill reads better against its orange/mustard base
// than mint does.
const TEXT_THEMES: Record<UniformKitId, UniformTextTheme> = {
  "home-outfield": { fill: "#00e9ae", outline: "#000000" },
  "home-gk": { fill: "#ffffff", outline: "#00e9ae" },
  "away-outfield": { fill: "#ffffff", outline: "#00e9ae" },
  "away-gk": { fill: "#ffffff", outline: "#000000" },
};

export function getUniformTextTheme(id: UniformKitId): UniformTextTheme {
  return TEXT_THEMES[id];
}
