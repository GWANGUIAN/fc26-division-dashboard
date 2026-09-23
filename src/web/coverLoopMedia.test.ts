import { describe, expect, it } from "vitest";
import {
  coverLoopMediaLink,
  getCoverLoopMediaCapabilities,
  soopClipEmbedUrl,
} from "./coverLoopMedia";
import { coverLoopTracks } from "./coverLoopLabData";

describe("cover loop media capabilities", () => {
  it("keeps every synchronized player feature for YouTube", () => {
    expect(
      getCoverLoopMediaCapabilities({ type: "youtube", videoId: "abc" }),
    ).toEqual({
      canControlPlayback: true,
      canControlVolume: true,
      canSeek: true,
      canReadTimeline: true,
      canRepeat: true,
      canShowLyrics: true,
      canVisualize: true,
      canSyncScene: true,
    });
  });

  it("limits SOOP clips to their own iframe controls", () => {
    expect(
      getCoverLoopMediaCapabilities({ type: "soop-clip", titleNo: 145540969 }),
    ).toEqual({
      canControlPlayback: false,
      canControlVolume: false,
      canSeek: false,
      canReadTimeline: false,
      canRepeat: false,
      canShowLyrics: false,
      canVisualize: false,
      canSyncScene: false,
    });
  });

  it("builds the regular, non-autoplay SOOP embed URL", () => {
    const media = { type: "soop-clip" as const, titleNo: 145540969 };
    expect(soopClipEmbedUrl(media.titleNo)).toBe(
      "https://vod.sooplive.com/player/145540969/embed?autoPlay=false&showChat=false&mutePlay=false",
    );
    expect(coverLoopMediaLink(media)).toBe(
      "https://vod.sooplive.com/player/145540969",
    );
  });

  it("registers Haepalin's supplied clip as a SOOP-only playlist item", () => {
    expect(coverLoopTracks.find((track) => track.id === "haepalin")?.media).toEqual({
      type: "soop-clip",
      titleNo: 145540969,
      clipTitle: "ଳ୍ଠ [MMD] 너의 색으로 물들어 (Cover by 해파린)",
    });
  });
});
