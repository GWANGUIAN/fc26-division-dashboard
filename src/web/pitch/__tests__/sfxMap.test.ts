import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BGM_FILES, SFX_CANDIDATES, SFX_GAIN, allSfxFiles, kickSfx, resolveSfx, resolveSfxAsync, type PitchSfxId } from "../audio/sfxMap";

const doc06 = readFileSync(new URL("../../../../docs/pitch/06-audio.md", import.meta.url), "utf8");

const doc06Forever = readFileSync(new URL("../../../../docs/forever/06-audio.md", import.meta.url), "utf8");
const FOREVER_SFX = Object.keys(SFX_CANDIDATES).filter((id) => id.startsWith("forever-")) as PitchSfxId[];

/** Table rows of 06 (`| S12 | <file in backticks> | ... | P0 |`) → file name and priority. */
function docRows(prefix: "S" | "B") {
  const rows: Array<{ file: string; priority: string }> = [];
  for (const line of doc06.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (!new RegExp(`^${prefix}\\d+$`).test(cells[1] ?? "")) continue;
    const file = /`(pitch-[a-z0-9-]+\.mp3)`/.exec(cells[2] ?? "")?.[1];
    const priority = cells.find((c) => /^P[012]$/.test(c));
    if (file && priority) rows.push({ file, priority });
  }
  return rows;
}

describe("sfxMap: reserved file", () => {
  it("never plays victory.mp3", () => {
    for (const url of [...allSfxFiles(), ...Object.values(BGM_FILES)]) expect(url).not.toMatch(/victory/i);
  });

  it("only points at public/sfxes and public/pitch-bgm files", () => {
    for (const url of allSfxFiles()) expect(url).toMatch(/^\/sfxes\/[a-z0-9-]+\.mp3$/);
    for (const url of Object.values(BGM_FILES)) expect(url).toMatch(/^\/pitch-bgm-[a-z-]+\.mp3$/);
  });
});

describe("sfxMap: 06 file names match the code", () => {
  it("lists all 50 sound effects of 06 §2 (P0 and P1) as events whose first candidate is that file", () => {
    const rows = docRows("S");
    expect(rows).toHaveLength(50);
    for (const { file } of rows) {
      const id = file.replace(/^pitch-/, "").replace(/\.mp3$/, "") as PitchSfxId;
      expect(SFX_CANDIDATES[id], file).toBeDefined();
      expect(SFX_CANDIDATES[id][0]).toBe(`/sfxes/${file}`);
    }
    expect(Object.keys(SFX_CANDIDATES)).toHaveLength(50 + FOREVER_SFX.length);
  });

  it("lists all 22 Jandi Forever effects of docs/forever/06 with their own file first", () => {
    const rows = [...doc06Forever.matchAll(/`(pitch-forever-[a-z0-9-]+\.mp3)`/g)].map((m) => m[1]!);
    const files = [...new Set(rows.filter((file) => file !== "pitch-forever-*.mp3"))];
    expect(files).toHaveLength(22);
    for (const file of files) {
      const id = file.replace(/^pitch-/, "").replace(/\.mp3$/, "") as PitchSfxId;
      expect(FOREVER_SFX).toContain(id);
      expect(SFX_CANDIDATES[id][0]).toBe(`/sfxes/${file}`);
    }
  });

  it("falls back to the 06 reuse candidates for the Forever events and never to victory", () => {
    const only = (name: string) => (url: string) => url === `/sfxes/${name}.mp3`;
    expect(resolveSfx("forever-portal-enter", only("pitch-gate-open"))).toBe("/sfxes/pitch-gate-open.mp3");
    expect(resolveSfx("forever-ding", only("pitch-style-tier"))).toBe("/sfxes/pitch-style-tier.mp3");
    expect(resolveSfx("forever-cast-loop", only("pitch-power-charge"))).toBe("/sfxes/pitch-power-charge.mp3");
    expect(resolveSfx("forever-cast-cancel", only("pitch-ui-back"))).toBe("/sfxes/pitch-ui-back.mp3");
    expect(resolveSfx("forever-rabbit-hit", only("pitch-ball-touch"))).toBe("/sfxes/pitch-ball-touch.mp3");
    expect(resolveSfx("forever-ding", () => true)).toBe("/sfxes/pitch-forever-ding.mp3");
    for (const id of ["forever-chat", "forever-leroy-charge", "forever-murloc", "forever-portal-hum"] as const) expect(resolveSfx(id, only("pitch-ui-click"))).toBeNull();
    for (const id of FOREVER_SFX) for (const url of SFX_CANDIDATES[id]) expect(url).not.toMatch(/victory/i);
  });

  it("keeps the looping and repeating Forever sounds quieter", () => {
    expect(SFX_GAIN["forever-chat"]).toBe(0.4);
    expect(SFX_GAIN["forever-portal-hum"]).toBe(0.3);
    expect(SFX_GAIN["forever-cast-loop"]).toBe(0.6);
  });

  it("names the two Forever BGM tracks after 06 §1", () => {
    expect(BGM_FILES.forever).toBe("/pitch-bgm-forever.mp3");
    expect(BGM_FILES["forever-loading"]).toBe("/pitch-bgm-forever-loading.mp3");
    expect(doc06Forever).toContain("pitch-bgm-forever.mp3");
    expect(doc06Forever).toContain("pitch-bgm-forever-loading.mp3");
  });

  it("uses the 06 names for the three BGM tracks", () => {
    const rows = docRows("B");
    expect(rows.map((r) => `/${r.file}`).sort()).toEqual(Object.values(BGM_FILES).filter((url) => !url.includes("forever")).sort());
  });

  it("knows the on-disk spelling of the miss whoosh", () => {
    expect(SFX_CANDIDATES["miss-whoosh"]).toContain("/sfxes/pitch-miss-whoos.mp3");
  });
});

describe("sfxMap: missing files are silence", () => {
  it("resolves to null when no candidate exists", () => {
    expect(resolveSfx("net-hit", () => false)).toBeNull();
  });

  it("falls back to the 06 §3 reuse candidates in order", () => {
    const only = (name: string) => (url: string) => url === `/sfxes/${name}.mp3`;
    expect(resolveSfx("kick-mid", only("world-ball-kick"))).toBe("/sfxes/world-ball-kick.mp3");
    expect(resolveSfx("net-hit", only("world-ball-net"))).toBe("/sfxes/world-ball-net.mp3");
    expect(resolveSfx("post-hit", only("world-ball-post"))).toBe("/sfxes/world-ball-post.mp3");
    expect(resolveSfx("bar-hit", only("world-ball-post"))).toBe("/sfxes/world-ball-post.mp3");
    expect(resolveSfx("ui-click", only("button-click"))).toBe("/sfxes/button-click.mp3");
    expect(resolveSfx("ui-hover", only("button-hover"))).toBe("/sfxes/button-hover.mp3");
    expect(resolveSfx("ball-touch", only("ball-bounce"))).toBe("/sfxes/ball-bounce.mp3");
    expect(resolveSfx("whistle-short", only("world-whistle-short"))).toBe("/sfxes/world-whistle-short.mp3");
    expect(resolveSfx("goal-cheer", only("cheer"))).toBe("/sfxes/cheer.mp3");
    expect(resolveSfx("goal-cheer", only("world-crowd-roar"))).toBe("/sfxes/world-crowd-roar.mp3");
  });

  it("prefers the pitch- file over a reuse candidate", () => {
    expect(resolveSfx("net-hit", () => true)).toBe("/sfxes/pitch-net-hit.mp3");
  });

  it("events with no reuse candidate are silent until their file exists", () => {
    const withoutOwn = (url: string) => !url.includes("pitch-aim-tick");
    expect(resolveSfx("aim-tick", withoutOwn)).toBeNull();
    expect(resolveSfx("aim-tick", () => true)).toBe("/sfxes/pitch-aim-tick.mp3");
  });

  it("resolves asynchronously too", async () => {
    expect(await resolveSfxAsync("net-hit", async (url) => url.endsWith("world-ball-net.mp3"))).toBe("/sfxes/world-ball-net.mp3");
    expect(await resolveSfxAsync("net-hit", async () => false)).toBeNull();
  });
});

describe("sfxMap: helpers", () => {
  it("picks the kick sound by power band", () => {
    expect([0, 39, 40, 77, 78, 100].map(kickSfx)).toEqual(["kick-soft", "kick-soft", "kick-mid", "kick-mid", "kick-hard", "kick-hard"]);
  });

  it("keeps the repeating sounds below full volume", () => {
    for (const id of ["step-grass-a", "step-grass-b", "ball-touch", "aim-tick"] as const) expect(SFX_GAIN[id]).toBeLessThan(0.6);
  });
});
