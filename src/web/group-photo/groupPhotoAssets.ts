// Auto-detects which 잔디동 단체사진 이미지가 생성됐는지 by scanning
// src/web/assets/group-photo/ at build time — dropping in `<id>.webp` (or
// `background.webp` for the shared backdrop) is enough, no manifest to
// hand-maintain. Same "no manifest" convention as
// src/web/toty-card/totyCardAssets.ts, but simpler since each person is a
// single file rather than a frame/background/character trio. See
// docs/group-photo-prompts.md for the generation workflow.

const modules = import.meta.glob<string>("../assets/group-photo/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});

const BACKGROUND_FILENAME = "background.webp";
const characterUrls: Record<string, string> = {};
let backgroundUrl: string | undefined;

for (const [path, url] of Object.entries(modules)) {
  const filename = path.split("/").pop() ?? "";
  if (filename === BACKGROUND_FILENAME) {
    backgroundUrl = url;
    continue;
  }
  const id = filename.replace(/\.webp$/, "");
  characterUrls[id] = url;
}

// 소품(골대/공/콘 등)은 하위 폴더 props/에 둔다 — 위의 `*.webp` glob은 비재귀
// 라서 캐릭터 목록과 섞이지 않는다. 캐릭터와 같은 "파일이 있으면 자동 반영"
// 규칙이고, 위치/크기는 groupPhotoProps.ts. 생성 워크플로는
// docs/group-photo-props.md 참고.
const propModules = import.meta.glob<string>("../assets/group-photo/props/*.webp", {
  eager: true,
  import: "default",
  query: "?url",
});
const propUrls: Record<string, string> = {};
for (const [path, url] of Object.entries(propModules)) {
  const filename = path.split("/").pop() ?? "";
  propUrls[filename.replace(/\.webp$/, "")] = url;
}

export function getGroupPhotoPropUrl(propId: string): string | undefined {
  return propUrls[propId];
}

export function getGroupPhotoCharacterUrl(streamerId: string): string | undefined {
  return characterUrls[streamerId];
}

export function getGroupPhotoBackgroundUrl(): string | undefined {
  return backgroundUrl;
}
