import type { CoverLoopMedia, LyricCue } from "./coverLoopMedia";

/** 커스텀 곡의 배경 소스 — 기존 캐릭터 루프 애니메이션 재사용, 또는 유저가 직접 올린 이미지/영상. */
export type CoverLoopBackgroundSource =
  | { kind: "reuse"; streamerId: string }
  | { kind: "upload"; imageKey: string; videoKey?: string };

/** "누구의 영상인가요?" — 잔디동 멤버 11명 + 우왁굳(coverLoopBuiltinPerformers) 중 하나만 선택. */
export type CoverLoopPerformerSelection = { streamerId: string; displayName: string };

export type CustomCoverLoopTrack = {
  id: string;
  performer: CoverLoopPerformerSelection;
  title: string;
  artist: string;
  media: CoverLoopMedia;
  background: CoverLoopBackgroundSource;
  objectPosition: string;
  /** 유튜브 클립에서만 채워진다 — SOOP 클립이면 항상 undefined. */
  lyrics?: { lyricStartSeconds: number; cues: LyricCue[] };
  createdAt: number;
  updatedAt: number;
};

/** 폼에서 조립해 훅으로 넘기는 입력 타입 — id/createdAt/updatedAt은 훅이 채운다. 업로드 배경은
 * 아직 IndexedDB에 저장되지 않은 File 그대로를 들고 있다가, 훅의 addCustomTrack/updateCustomTrack이
 * 실제 저장을 담당한다. */
export type CoverLoopTrackFormInput = {
  performer: CoverLoopPerformerSelection;
  title: string;
  artist: string;
  media: CoverLoopMedia;
  background:
    | { kind: "reuse"; streamerId: string }
    | { kind: "upload"; imageFile: File | null; videoFile: File | null; keepExistingVideo?: boolean };
  objectPosition: string;
  lyrics?: { lyricStartSeconds: number; cues: LyricCue[] };
};

export type CoverLoopCustomLibrary = {
  version: 1;
  tracks: CustomCoverLoopTrack[];
  /** 빌트인 id + 커스텀 id를 모두 포함하는 전체 재생목록 순서. */
  order: string[];
};

export const CUSTOM_COVER_LOOP_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const CUSTOM_COVER_LOOP_MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export function isCustomCoverLoopTrackId(id: string): boolean {
  return id.startsWith("custom-");
}
