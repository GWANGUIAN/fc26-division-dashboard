import type { CoverLoopCustomLibrary, CustomCoverLoopTrack } from "./customCoverLoopTypes";

// customPlayerStorage.ts / coverLoopLabStorage.ts와 같은 try/catch read/write 패턴.
const CUSTOM_LIBRARY_KEY = "fc26-cover-loop-custom-library-v1";

function isLyricCue(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const cue = value as Record<string, unknown>;
  return (
    typeof cue.startSeconds === "number" &&
    typeof cue.endSeconds === "number" &&
    typeof cue.text === "string"
  );
}

function isPerformer(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const performer = value as Record<string, unknown>;
  return typeof performer.streamerId === "string" && typeof performer.displayName === "string";
}

function isMedia(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const media = value as Record<string, unknown>;
  if (media.type === "youtube") return typeof media.videoId === "string";
  if (media.type === "soop-clip") return typeof media.titleNo === "number";
  return false;
}

function isBackground(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const background = value as Record<string, unknown>;
  if (background.kind === "reuse") return typeof background.streamerId === "string";
  if (background.kind === "upload") return typeof background.imageKey === "string";
  return false;
}

function isCustomCoverLoopTrack(value: unknown): value is CustomCoverLoopTrack {
  if (!value || typeof value !== "object") return false;
  const track = value as Record<string, unknown>;
  if (
    typeof track.id !== "string" ||
    typeof track.title !== "string" ||
    typeof track.artist !== "string" ||
    typeof track.objectPosition !== "string" ||
    typeof track.createdAt !== "number" ||
    typeof track.updatedAt !== "number" ||
    !isPerformer(track.performer) ||
    !isMedia(track.media) ||
    !isBackground(track.background)
  )
    return false;
  if (track.lyrics !== undefined) {
    const lyrics = track.lyrics as Record<string, unknown>;
    if (
      typeof lyrics.lyricStartSeconds !== "number" ||
      !Array.isArray(lyrics.cues) ||
      !lyrics.cues.every(isLyricCue)
    )
      return false;
  }
  return true;
}

function emptyLibrary(builtinIds: string[]): CoverLoopCustomLibrary {
  return { version: 1, tracks: [], order: [...builtinIds] };
}

/** localStorage에서 라이브러리를 읽고, 빌트인 목록이 바뀐 경우(새 곡 추가/커스텀 곡 삭제 잔재)
 * order를 일관된 상태로 보정한다. */
export function loadCoverLoopCustomLibrary(builtinIds: string[]): CoverLoopCustomLibrary {
  try {
    const raw = localStorage.getItem(CUSTOM_LIBRARY_KEY);
    if (!raw) return emptyLibrary(builtinIds);
    const parsed = JSON.parse(raw) as Partial<CoverLoopCustomLibrary>;
    if (!Array.isArray(parsed.tracks) || !Array.isArray(parsed.order))
      return emptyLibrary(builtinIds);
    const tracks = parsed.tracks.filter(isCustomCoverLoopTrack);
    const validIds = new Set([...builtinIds, ...tracks.map((track) => track.id)]);
    const order = parsed.order.filter(
      (id): id is string => typeof id === "string" && validIds.has(id),
    );
    // 새로 생긴 빌트인 id나 순서 목록에서 빠진 커스텀 곡을 끝에 보정.
    for (const id of validIds) if (!order.includes(id)) order.push(id);
    return { version: 1, tracks, order };
  } catch {
    return emptyLibrary(builtinIds);
  }
}

export function saveCoverLoopCustomLibrary(library: CoverLoopCustomLibrary): void {
  try {
    localStorage.setItem(CUSTOM_LIBRARY_KEY, JSON.stringify(library));
  } catch {
    /* ignore quota/private-browsing errors */
  }
}
