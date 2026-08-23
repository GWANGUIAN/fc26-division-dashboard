import { describe, expect, it } from "vitest";
import { matchLiveStreamers, type SoopLiveStreamer } from "./soop-live.js";

const live = (overrides: Partial<SoopLiveStreamer> = {}): SoopLiveStreamer => ({
  broadNo: 1,
  userId: "tadka56",
  nickname: "양지랖",
  title: "FC26 9부 가기",
  viewerCount: 102,
  thumbnailUrl: "https://liveimg.sooplive.com/m/1",
  profileImageUrl: "https://stimg.sooplive.com/LOGO/ta/tadka56/tadka56.jpg",
  ...overrides,
});

describe("matchLiveStreamers", () => {
  it("keeps only roster streamers whose soopId matches a live entry", () => {
    const roster = [
      { id: "s1", displayName: "양지랖", soopId: "tadka56" },
      { id: "s2", displayName: "다른 스트리머", soopId: "someoneelse" },
    ];
    const matched = matchLiveStreamers(roster, [live()]);
    expect(matched).toEqual([{
      streamerId: "s1",
      displayName: "양지랖",
      profileImageUrl: undefined,
      soopId: "tadka56",
      title: "FC26 9부 가기",
      viewerCount: 102,
      thumbnailUrl: "https://liveimg.sooplive.com/m/1",
    }]);
  });

  it("matches soopId case-insensitively", () => {
    const roster = [{ id: "s1", displayName: "양지랖", soopId: "TadKa56" }];
    expect(matchLiveStreamers(roster, [live()])).toHaveLength(1);
  });

  it("drops live streamers that are not in the roster", () => {
    const roster = [{ id: "s1", displayName: "다른 사람", soopId: "unrelated" }];
    expect(matchLiveStreamers(roster, [live()])).toEqual([]);
  });

  it("ignores roster entries without a soopId", () => {
    const roster = [{ id: "s1", displayName: "미연동" }];
    expect(matchLiveStreamers(roster, [live()])).toEqual([]);
  });
});
