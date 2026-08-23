import type { StreamerRecord } from "./model.js";

export interface SoopLiveStreamer {
  broadNo: number;
  userId: string;
  nickname: string;
  title: string;
  viewerCount: number;
  thumbnailUrl: string;
  profileImageUrl: string;
}

export interface SoopLiveSnapshot {
  generatedAt: string;
  streamers: SoopLiveStreamer[];
}

export interface LiveRosterEntry {
  streamerId: string;
  displayName: string;
  profileImageUrl?: string;
  soopId: string;
  title: string;
  viewerCount: number;
  thumbnailUrl: string;
  sfx?: string;
}

/**
 * Cross-references the sooplive FC26 category feed against our tracked
 * roster (matched by soopId) so the "now streaming" rail only ever shows
 * 잔디동 신청 스트리머, never unrelated FC26 broadcasters in the category.
 */
export function matchLiveStreamers(
  roster: Pick<StreamerRecord, "id" | "displayName" | "profileImageUrl" | "soopId" | "sfx">[],
  live: SoopLiveStreamer[],
): LiveRosterEntry[] {
  const bySoopId = new Map(
    roster
      .filter((streamer): streamer is typeof streamer & { soopId: string } => Boolean(streamer.soopId))
      .map((streamer) => [streamer.soopId.toLowerCase(), streamer]),
  );
  return live.flatMap((entry) => {
    const streamer = bySoopId.get(entry.userId.toLowerCase());
    if (!streamer) return [];
    return [{
      streamerId: streamer.id,
      displayName: streamer.displayName,
      profileImageUrl: streamer.profileImageUrl,
      soopId: entry.userId,
      title: entry.title,
      viewerCount: entry.viewerCount,
      thumbnailUrl: entry.thumbnailUrl,
      sfx: streamer.sfx,
    }];
  });
}
