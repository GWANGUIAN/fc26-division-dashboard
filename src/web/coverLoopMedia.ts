export type YouTubeCoverLoopMedia = {
  type: "youtube";
  videoId: string;
  /** 유튜브 영상 인트로를 건너뛰고 항상 이 시각부터 재생을 시작하고 싶을 때만 지정. */
  startSeconds?: number;
};

/** A SOOP user clip. `titleNo` deliberately excludes arbitrary URLs and live/VOD sources. */
export type SoopClipCoverLoopMedia = {
  type: "soop-clip";
  titleNo: number;
  /** The provider's clip title, kept separate from the playlist display title. */
  clipTitle?: string;
};

export type CoverLoopMedia = YouTubeCoverLoopMedia | SoopClipCoverLoopMedia;

export type CoverLoopMediaCapabilities = {
  canControlPlayback: boolean;
  canControlVolume: boolean;
  canSeek: boolean;
  canReadTimeline: boolean;
  canRepeat: boolean;
  canShowLyrics: boolean;
  canVisualize: boolean;
  canSyncScene: boolean;
};

const YOUTUBE_CAPABILITIES: CoverLoopMediaCapabilities = {
  canControlPlayback: true,
  canControlVolume: true,
  canSeek: true,
  canReadTimeline: true,
  canRepeat: true,
  canShowLyrics: true,
  canVisualize: true,
  canSyncScene: true,
};

const SOOP_CLIP_CAPABILITIES: CoverLoopMediaCapabilities = {
  canControlPlayback: false,
  canControlVolume: false,
  canSeek: false,
  canReadTimeline: false,
  canRepeat: false,
  canShowLyrics: false,
  canVisualize: false,
  canSyncScene: false,
};

export function getCoverLoopMediaCapabilities(
  media: CoverLoopMedia,
): CoverLoopMediaCapabilities {
  return media.type === "youtube"
    ? YOUTUBE_CAPABILITIES
    : SOOP_CLIP_CAPABILITIES;
}

/**
 * SOOP's regular, supported embed URL. Do not add `fromApi=1`: that message
 * path is undocumented and was not reliable in local verification.
 */
export function soopClipEmbedUrl(titleNo: number): string {
  const safeTitleNo = Math.trunc(titleNo);
  if (!Number.isSafeInteger(safeTitleNo) || safeTitleNo <= 0)
    throw new Error("SOOP clip titleNo must be a positive integer");

  const params = new URLSearchParams({
    autoPlay: "false",
    showChat: "false",
    mutePlay: "false",
  });
  return `https://vod.sooplive.com/player/${safeTitleNo}/embed?${params}`;
}

export function coverLoopMediaLink(media: CoverLoopMedia): string {
  return media.type === "youtube"
    ? `https://www.youtube.com/watch?v=${media.videoId}`
    : `https://vod.sooplive.com/player/${media.titleNo}`;
}
