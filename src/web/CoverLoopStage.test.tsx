import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CoverLoopStage } from "./CoverLoopStage";
import type { CoverLoopTrack } from "./coverLoopLabData";

const soopTrack: CoverLoopTrack = {
  id: "soop-test-clip",
  code: "SOOP",
  displayName: "테스트 멤버",
  position: "MF",
  title: "테스트 SOOP 클립",
  artist: "테스트 아티스트",
  media: { type: "soop-clip", titleNo: 145540969 },
  poster: "/cover.webp",
  objectPosition: "center",
  lyricStartSeconds: 0,
  lyrics: [],
};

describe("CoverLoopStage SOOP clips", () => {
  it("renders the regular iframe and exposes unavailable media controls", () => {
    const html = renderToStaticMarkup(
      <CoverLoopStage track={soopTrack} index={9} />,
    );

    expect(html).toContain(
      "https://vod.sooplive.com/player/145540969/embed?autoPlay=false&amp;showChat=false&amp;mutePlay=false",
    );
    expect(html).not.toContain("fromApi");
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("cover-loop-lab__soop-logo");
    expect(html).toContain("cover-loop-lab__soop-embed-toggle");
    expect(html).not.toContain("cover-loop-lab__soop-embed-actions");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain(">접기<");
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("SOOP 클립은 이 기능을 사용할 수 없습니다.");
    expect(html).not.toContain("cover-loop-lab__visualizer");
    expect(html).not.toContain("cover-loop-lab__lyric");
  });
});
