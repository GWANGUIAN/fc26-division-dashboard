import { describe, expect, it } from "vitest";
import {
  WORLD_ONAIR_SOOP_IDS,
  collectWorldOnAir,
  parsePlayerLive,
  soopLiveUrl,
  soopStationUrl,
  type FetchLike,
} from "./world-onair.js";

const player = (result: number, broadNo?: string) => ({ CHANNEL: { RESULT: result, ...(broadNo ? { BNO: broadNo } : {}) } });
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status });

describe("parsePlayerLive", () => {
  it("reads a live channel with its broadcast number", () => {
    expect(parsePlayerLive(player(1, "297258019"))).toEqual({ live: true, broadNo: 297258019 });
  });

  it("stays live when the broadcast number is missing", () => {
    expect(parsePlayerLive(player(1))).toEqual({ live: true });
  });

  it("reads RESULT 0 as offline", () => {
    expect(parsePlayerLive(player(0))).toEqual({ live: false });
  });

  it("treats anything that is not the player answer as unknown, not offline", () => {
    expect(parsePlayerLive(null)).toBeNull();
    expect(parsePlayerLive({})).toBeNull();
    expect(parsePlayerLive({ CHANNEL: null })).toBeNull();
    expect(parsePlayerLive({ CHANNEL: {} })).toBeNull();
    expect(parsePlayerLive({ CHANNEL: { RESULT: "" } })).toBeNull();
    expect(parsePlayerLive({ CHANNEL: { RESULT: "nope" } })).toBeNull();
  });
});

describe("urls", () => {
  it("builds the live page and the station page", () => {
    expect(soopLiveUrl("hachi97")).toBe("https://play.sooplive.com/hachi97");
    expect(soopStationUrl("hachi97")).toBe("https://www.sooplive.com/station/hachi97");
  });

  it("escapes ids so a stray character cannot change the path", () => {
    expect(soopLiveUrl("a/../b")).toBe("https://play.sooplive.com/a%2F..%2Fb");
    expect(soopStationUrl("a b")).toBe("https://www.sooplive.com/station/a%20b");
  });
});

describe("collectWorldOnAir", () => {
  const now = new Date("2026-09-20T04:05:06.000Z");

  it("asks the player API once per member and collects the answers", async () => {
    const calls: { url: string; body: string; referer: string | undefined }[] = [];
    const fetchImpl: FetchLike = async (url, init) => {
      const body = String(init.body);
      calls.push({ url, body, referer: (init.headers as Record<string, string>).Referer });
      const id = new URLSearchParams(body).get("bid");
      return json(id === "hachi97" || id === "lina0108" ? player(1, "100") : player(0));
    };

    const snapshot = await collectWorldOnAir(fetchImpl, now);

    expect(calls).toHaveLength(WORLD_ONAIR_SOOP_IDS.length);
    expect(calls[0].url).toBe("https://live.sooplive.com/afreeca/player_live_api.php?bjid=janine95kim");
    expect(calls[0].referer).toBe("https://play.sooplive.com/janine95kim");
    expect(snapshot?.generatedAt).toBe(now.toISOString());
    expect(snapshot?.streamers).toHaveLength(WORLD_ONAIR_SOOP_IDS.length);
    const live = snapshot?.streamers.filter((entry) => entry.live).map((entry) => entry.soopId).sort();
    expect(live).toEqual(["hachi97", "lina0108"]);
    expect(snapshot?.streamers.find((entry) => entry.soopId === "hachi97")?.broadNo).toBe(100);
  });

  it("leaves out a member whose lookup failed instead of calling them offline", async () => {
    const fetchImpl: FetchLike = async (_url, init) => {
      const id = new URLSearchParams(String(init.body)).get("bid");
      if (id === "doormomo") throw new Error("network");
      if (id === "sjh4018") return json({}, 503);
      if (id === "haepalin") return new Response("<html>blocked</html>");
      return json(player(0));
    };

    const snapshot = await collectWorldOnAir(fetchImpl, now);
    const ids = snapshot?.streamers.map((entry) => entry.soopId) ?? [];
    expect(ids).not.toContain("doormomo");
    expect(ids).not.toContain("sjh4018");
    expect(ids).not.toContain("haepalin");
    expect(ids).toHaveLength(WORLD_ONAIR_SOOP_IDS.length - 3);
  });

  it("returns null when nothing could be read", async () => {
    const fetchImpl: FetchLike = async () => {
      throw new Error("down");
    };
    expect(await collectWorldOnAir(fetchImpl, now)).toBeNull();
  });
});
