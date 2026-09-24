export const CURSOR_PLAYER_IDS = [
  "tdnlamuron",
  "ju010228",
  "doormomo",
  "bboringirl",
  "kaksjak0730",
  "sjh4018",
  "haepalin",
  "lina0108",
  "tleod1818",
  "janine95kim",
  "hachi97",
  "woowakgood",
] as const;

export type CursorPlayerId = (typeof CURSOR_PLAYER_IDS)[number];
export const NATIVE_CURSOR_SELECTION_ID = "default";
export type CursorSelectionId = CursorPlayerId | typeof NATIVE_CURSOR_SELECTION_ID;

export type CursorGlyphRole =
  | "default"
  | "pointer"
  | "text"
  | "crosshair"
  | "move"
  | "grabbing"
  | "resize-ew"
  | "resize-ns"
  | "resize-diagonal"
  | "wait"
  | "not-allowed"
  | "help";

export type CursorPlayer = {
  id: CursorPlayerId;
  name: string;
  accent: string;
  action: string;
};

// One accent only per player. These are the locked primary values used by the cursor runbook;
// the separate TOTY glow/secondary colours and visual motifs intentionally do not participate.
export const CURSOR_PLAYERS: readonly CursorPlayer[] = [
  { id: "tdnlamuron", name: "다시바", accent: "#ffb454", action: "백힐 패스" },
  { id: "ju010228", name: "쥬멩이", accent: "#d9f27a", action: "솔 컨트롤 드리블" },
  { id: "doormomo", name: "문모모", accent: "#c9a6ff", action: "허벅지 트래핑" },
  { id: "bboringirl", name: "뽀린걸", accent: "#ff5c5c", action: "파워 슈팅" },
  { id: "kaksjak0730", name: "한결", accent: "#7ec8ff", action: "아웃사이드 드리블" },
  { id: "sjh4018", name: "핑구", accent: "#a6dcff", action: "다이빙 헤더" },
  { id: "haepalin", name: "해파린", accent: "#e0a6ff", action: "슬라이딩 태클" },
  { id: "lina0108", name: "리냐", accent: "#ff8fc0", action: "레인보우 플릭" },
  { id: "tleod1818", name: "빙밍", accent: "#5cffb8", action: "체스트 컨트롤" },
  { id: "janine95kim", name: "재닌", accent: "#a6dcff", action: "GK 다이빙 세이브" },
  { id: "hachi97", name: "하치", accent: "#ffe29e", action: "발리 슛" },
  { id: "woowakgood", name: "우왁굳", accent: "#7fdca4", action: "터치라인 전술 지시" },
] as const;

export const DEFAULT_CURSOR_PLAYER_ID: CursorPlayerId = "woowakgood";

const glyphAssets = import.meta.glob<string>("./assets/cursors/*/glyph-*.webp", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});
const motionAssets = import.meta.glob<string>("./assets/cursors/*/motion-strip.webp", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});
const previewAssets = import.meta.glob<string>("./assets/cursors/*/preview.webp", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});
const windowsCursorPackAssets = import.meta.glob<string>("./assets/cursors/*/windows-cursor-pack.zip", {
  eager: true,
  query: "?url&no-inline",
  import: "default",
});

export function isCursorPlayerId(value: unknown): value is CursorPlayerId {
  return typeof value === "string" && (CURSOR_PLAYER_IDS as readonly string[]).includes(value);
}

export function isCursorSelectionId(value: unknown): value is CursorSelectionId {
  return value === NATIVE_CURSOR_SELECTION_ID || isCursorPlayerId(value);
}

export function getCursorPlayer(id: CursorPlayerId): CursorPlayer {
  return CURSOR_PLAYERS.find((player) => player.id === id) ?? CURSOR_PLAYERS[CURSOR_PLAYERS.length - 1]!;
}

export function cursorAssetUrls(id: CursorPlayerId): {
  glyph: Partial<Record<CursorGlyphRole, string>>;
  motion?: string;
  preview?: string;
  windowsPack?: string;
} {
  const glyph = Object.fromEntries(
    ([
      "default", "pointer", "text", "crosshair", "move", "grabbing", "resize-ew", "resize-ns",
      "resize-diagonal", "wait", "not-allowed", "help",
    ] as const).flatMap((role) => {
      const url = glyphAssets[`./assets/cursors/${id}/glyph-${role}.webp`];
      return url ? [[role, url]] : [];
    }),
  ) as Partial<Record<CursorGlyphRole, string>>;

  return {
    glyph,
    motion: motionAssets[`./assets/cursors/${id}/motion-strip.webp`],
    preview: previewAssets[`./assets/cursors/${id}/preview.webp`],
    windowsPack: windowsCursorPackAssets[`./assets/cursors/${id}/windows-cursor-pack.zip`],
  };
}

export function cursorRoleFromCss(cursor: string | undefined): CursorGlyphRole {
  const value = (cursor ?? "").toLowerCase();
  if (value.includes("grabbing")) return "grabbing";
  if (value.includes("grab")) return "move";
  if (value.includes("not-allowed") || value.includes("no-drop")) return "not-allowed";
  if (value.includes("progress") || value.includes("wait")) return "wait";
  if (value.includes("col-resize") || value.includes("ew-resize")) return "resize-ew";
  if (value.includes("row-resize") || value.includes("ns-resize")) return "resize-ns";
  if (value.includes("nesw-resize") || value.includes("nwse-resize") || value.includes("nw-resize") || value.includes("ne-resize")) return "resize-diagonal";
  if (value.includes("text")) return "text";
  if (value.includes("crosshair")) return "crosshair";
  if (value.includes("help")) return "help";
  if (value.includes("move") || value.includes("all-scroll")) return "move";
  if (value.includes("pointer")) return "pointer";
  return "default";
}
