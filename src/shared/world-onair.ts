/**
 * ON AIR signs of 잔디동 월드 (docs/world/15-onair-sign.md): which of the 11 world members are live on SOOP.
 *
 * The category feed behind `/api/soop-live` only lists FC26/FC27 broadcasts, so a member streaming another
 * game would look offline. This asks SOOP's player API about each member's own channel instead.
 * The members' world ids are their SOOP ids (roster.yaml), which is why one list serves both.
 */
export const WORLD_ONAIR_SOOP_IDS = [
  "janine95kim",
  "bboringirl",
  "sjh4018",
  "doormomo",
  "hachi97",
  "kaksjak0730",
  "ju010228",
  "haepalin",
  "tleod1818",
  "tdnlamuron",
  "lina0108",
] as const;

export interface WorldOnAirEntry {
  soopId: string;
  live: boolean;
  /** Broadcast number, only while live. */
  broadNo?: number;
}

export interface WorldOnAirSnapshot {
  generatedAt: string;
  /** Members whose lookup succeeded; a member missing here is "unknown", not "offline". */
  streamers: WorldOnAirEntry[];
}

const PLAYER_LIVE_API = "https://live.sooplive.com/afreeca/player_live_api.php";
const LOOKUP_TIMEOUT_MS = 5_000;

/** The live broadcast page. */
export const soopLiveUrl = (soopId: string) => `https://play.sooplive.com/${encodeURIComponent(soopId)}`;

/** The channel's station (방송국) page, shown when nobody is on air. */
export const soopStationUrl = (soopId: string) => `https://www.sooplive.com/station/${encodeURIComponent(soopId)}`;

/**
 * `CHANNEL.RESULT` is 1 while the channel is broadcasting and 0 otherwise. Anything that does not look
 * like the player API's answer is `null` (an unknown state), never "offline".
 */
export function parsePlayerLive(payload: unknown): { live: boolean; broadNo?: number } | null {
  const channel = (payload as { CHANNEL?: { RESULT?: unknown; BNO?: unknown } } | null)?.CHANNEL;
  if (!channel || typeof channel !== "object") return null;
  const result = Number(channel.RESULT);
  if (channel.RESULT === undefined || channel.RESULT === null || channel.RESULT === "" || !Number.isFinite(result)) return null;
  if (result !== 1) return { live: false };
  const broadNo = Number(channel.BNO);
  return Number.isFinite(broadNo) && broadNo > 0 ? { live: true, broadNo } : { live: true };
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

async function lookupMember(fetchImpl: FetchLike, soopId: string): Promise<WorldOnAirEntry | null> {
  const response = await fetchImpl(`${PLAYER_LIVE_API}?bjid=${encodeURIComponent(soopId)}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: soopLiveUrl(soopId),
    },
    body: new URLSearchParams({
      bid: soopId,
      type: "live",
      pwd: "",
      player_type: "html5",
      stream_type: "common",
      quality: "HD",
      mode: "landing",
      from_api: "0",
      is_revive: "false",
    }),
    signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(LOOKUP_TIMEOUT_MS) : undefined,
  });
  if (!response.ok) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    return null;
  }
  const parsed = parsePlayerLive(payload);
  return parsed ? { soopId, ...parsed } : null;
}

/**
 * Asks SOOP about every member in parallel. A member whose lookup fails is left out of the answer;
 * `null` means every lookup failed (the caller should not cache that).
 */
export async function collectWorldOnAir(
  fetchImpl: FetchLike,
  now: Date = new Date(),
  soopIds: readonly string[] = WORLD_ONAIR_SOOP_IDS,
): Promise<WorldOnAirSnapshot | null> {
  const settled = await Promise.allSettled(soopIds.map((soopId) => lookupMember(fetchImpl, soopId)));
  const streamers = settled.flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));
  return streamers.length > 0 ? { generatedAt: now.toISOString(), streamers } : null;
}
