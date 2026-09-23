import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { coverLoopTracks as builtinCoverLoopTracks, type CoverLoopTrack } from "./coverLoopLabData";
import type {
  CoverLoopCustomLibrary,
  CoverLoopTrackFormInput,
  CustomCoverLoopTrack,
} from "./customCoverLoopTypes";
import { loadCoverLoopCustomLibrary, saveCoverLoopCustomLibrary } from "./customCoverLoopStorage";
import { deleteCoverLoopMedia, getCoverLoopMedia, saveCoverLoopMedia } from "./customCoverLoopMediaDB";

const BUILTIN_IDS = builtinCoverLoopTracks.map((track) => track.id);
// 업로드 미디어가 아직 IndexedDB에서 로딩 중이거나 지워진 경우의 안전한 기본값 — 새 에셋을
// 추가하지 않고 기존 곡 포스터를 그대로 재사용한다.
const FALLBACK_POSTER = builtinCoverLoopTracks[0]?.poster ?? "";

function toCoverLoopTrack(
  custom: CustomCoverLoopTrack,
  mediaUrls: Map<string, string>,
): CoverLoopTrack {
  let poster = FALLBACK_POSTER;
  let loopVideo: string | undefined;
  const background = custom.background;
  if (background.kind === "reuse") {
    const reused = builtinCoverLoopTracks.find((track) => track.id === background.streamerId);
    poster = reused?.poster ?? FALLBACK_POSTER;
    loopVideo = reused?.loopVideo;
  } else {
    poster = mediaUrls.get(background.imageKey) ?? FALLBACK_POSTER;
    loopVideo = background.videoKey ? mediaUrls.get(background.videoKey) : undefined;
  }
  return {
    id: custom.id,
    code: "CUSTOM",
    displayName: custom.performer.displayName,
    position: "",
    title: custom.title,
    artist: custom.artist,
    media: custom.media,
    poster,
    loopVideo,
    objectPosition: custom.objectPosition,
    lyricStartSeconds: custom.lyrics?.lyricStartSeconds ?? 0,
    lyrics: custom.lyrics?.cues ?? [],
  };
}

async function resolveBackground(
  trackId: string,
  input: CoverLoopTrackFormInput["background"],
  previous?: CustomCoverLoopTrack["background"],
): Promise<CustomCoverLoopTrack["background"]> {
  if (input.kind === "reuse") {
    if (previous?.kind === "upload") {
      void deleteCoverLoopMedia(previous.imageKey);
      if (previous.videoKey) void deleteCoverLoopMedia(previous.videoKey);
    }
    return { kind: "reuse", streamerId: input.streamerId };
  }

  const imageKey = `${trackId}:image`;
  if (input.imageFile) {
    await saveCoverLoopMedia(imageKey, input.imageFile);
  }

  const videoKey = `${trackId}:video`;
  let hasVideo = false;
  if (input.videoFile) {
    await saveCoverLoopMedia(videoKey, input.videoFile);
    hasVideo = true;
  } else if (input.keepExistingVideo) {
    hasVideo = true;
  } else if (previous?.kind === "upload" && previous.videoKey) {
    await deleteCoverLoopMedia(previous.videoKey);
  }

  return { kind: "upload", imageKey, videoKey: hasVideo ? videoKey : undefined };
}

/**
 * 빌트인 12곡(coverLoopLabData.ts) + 유저가 추가한 커스텀 곡을 하나의 CoverLoopTrack[]로
 * 병합해 CoverLoopStage에 공급한다. 커스텀 곡의 업로드 이미지/영상은 IndexedDB에서 비동기로
 * 불러와 object URL로 변환하고, 더 이상 필요 없어지면 즉시 해제한다.
 */
export function useMergedCoverLoopTracks() {
  const [library, setLibrary] = useState<CoverLoopCustomLibrary>(() =>
    loadCoverLoopCustomLibrary(BUILTIN_IDS),
  );
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());
  const mediaUrlsRef = useRef(mediaUrls);
  mediaUrlsRef.current = mediaUrls;

  useEffect(() => {
    let cancelled = false;
    const neededKeys = library.tracks.flatMap((track) =>
      track.background.kind === "upload"
        ? [track.background.imageKey, track.background.videoKey].filter(
            (key): key is string => !!key,
          )
        : [],
    );
    (async () => {
      const next = new Map<string, string>();
      for (const key of neededKeys) {
        const existing = mediaUrlsRef.current.get(key);
        if (existing) {
          next.set(key, existing);
          continue;
        }
        const blob = await getCoverLoopMedia(key);
        if (blob) next.set(key, URL.createObjectURL(blob));
      }
      if (cancelled) {
        for (const url of next.values()) URL.revokeObjectURL(url);
        return;
      }
      setMediaUrls((prev) => {
        for (const [key, url] of prev) if (!next.has(key)) URL.revokeObjectURL(url);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [library.tracks]);

  // 언마운트(재생목록 팝업을 닫을 때) 시 지금까지 만든 object URL을 전부 정리한다.
  useEffect(
    () => () => {
      for (const url of mediaUrlsRef.current.values()) URL.revokeObjectURL(url);
    },
    [],
  );

  const tracks = useMemo<CoverLoopTrack[]>(() => {
    const builtinById = new Map(builtinCoverLoopTracks.map((track) => [track.id, track]));
    const customById = new Map(library.tracks.map((track) => [track.id, track]));
    return library.order
      .map((id) => builtinById.get(id) ?? (customById.has(id) ? toCoverLoopTrack(customById.get(id)!, mediaUrls) : undefined))
      .filter((track): track is CoverLoopTrack => !!track);
  }, [library, mediaUrls]);

  const addCustomTrack = useCallback(async (input: CoverLoopTrackFormInput) => {
    const id = `custom-${crypto.randomUUID()}`;
    const background = await resolveBackground(id, input.background);
    const track: CustomCoverLoopTrack = {
      id,
      performer: input.performer,
      title: input.title,
      artist: input.artist,
      media: input.media,
      background,
      objectPosition: input.objectPosition,
      lyrics: input.lyrics,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setLibrary((prev) => {
      const next: CoverLoopCustomLibrary = {
        ...prev,
        tracks: [...prev.tracks, track],
        order: [...prev.order, id],
      };
      saveCoverLoopCustomLibrary(next);
      return next;
    });
  }, []);

  const updateCustomTrack = useCallback(
    async (id: string, input: CoverLoopTrackFormInput) => {
      const existing = library.tracks.find((track) => track.id === id);
      const background = await resolveBackground(id, input.background, existing?.background);
      setLibrary((prev) => {
        const next: CoverLoopCustomLibrary = {
          ...prev,
          tracks: prev.tracks.map((track) =>
            track.id === id
              ? {
                  ...track,
                  performer: input.performer,
                  title: input.title,
                  artist: input.artist,
                  media: input.media,
                  background,
                  objectPosition: input.objectPosition,
                  lyrics: input.lyrics,
                  updatedAt: Date.now(),
                }
              : track,
          ),
        };
        saveCoverLoopCustomLibrary(next);
        return next;
      });
    },
    [library.tracks],
  );

  const deleteCustomTrack = useCallback(
    (id: string) => {
      const target = library.tracks.find((track) => track.id === id);
      if (target?.background.kind === "upload") {
        void deleteCoverLoopMedia(target.background.imageKey);
        if (target.background.videoKey) void deleteCoverLoopMedia(target.background.videoKey);
      }
      setLibrary((prev) => {
        const next: CoverLoopCustomLibrary = {
          ...prev,
          tracks: prev.tracks.filter((track) => track.id !== id),
          order: prev.order.filter((orderId) => orderId !== id),
        };
        saveCoverLoopCustomLibrary(next);
        return next;
      });
    },
    [library.tracks],
  );

  const reorder = useCallback((nextOrder: string[]) => {
    setLibrary((prev) => {
      const next: CoverLoopCustomLibrary = { ...prev, order: nextOrder };
      saveCoverLoopCustomLibrary(next);
      return next;
    });
  }, []);

  return { tracks, library, addCustomTrack, updateCustomTrack, deleteCustomTrack, reorder };
}
