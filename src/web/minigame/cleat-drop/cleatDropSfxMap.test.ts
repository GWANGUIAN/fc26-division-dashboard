import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLEAT_DROP_SFX_CANDIDATES, CLEAT_DROP_SFX_GAIN, type CleatDropSfxId } from "./cleatDropSfxMap";

const doc = readFileSync(new URL("../../../../docs/minigame-cleat-drop.md", import.meta.url), "utf8");

/** Rows of §7-2 (`| S12 | <file in backticks> | ... |`) → the sfx file name. */
function docSfxRows(): string[] {
  const files: string[] = [];
  for (const line of doc.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (!/^S\d+$/.test(cells[1] ?? "")) continue;
    const file = /`(cleat-drop-[a-z0-9-]+\.mp3)`/.exec(cells[2] ?? "")?.[1];
    if (file) files.push(file);
  }
  return files;
}

describe("cleatDropSfxMap: reserved file", () => {
  it("never plays victory.mp3, own file or fallback", () => {
    for (const urls of Object.values(CLEAT_DROP_SFX_CANDIDATES)) for (const url of urls) expect(url).not.toMatch(/victory/i);
  });
});

describe("cleatDropSfxMap: §7-2 file names match the code", () => {
  it("lists all 12 effects of the doc's audio table with their own file first", () => {
    const files = docSfxRows();
    expect(files).toHaveLength(12);
    for (const file of files) {
      const id = file.replace(/^cleat-drop-/, "").replace(/\.mp3$/, "") as CleatDropSfxId;
      expect(CLEAT_DROP_SFX_CANDIDATES[id], file).toBeDefined();
      expect(CLEAT_DROP_SFX_CANDIDATES[id][0]).toBe(`/sfxes/${file}`);
    }
    expect(Object.keys(CLEAT_DROP_SFX_CANDIDATES)).toHaveLength(12);
  });

  it("only points at public/sfxes files", () => {
    for (const urls of Object.values(CLEAT_DROP_SFX_CANDIDATES)) for (const url of urls) expect(url).toMatch(/^\/sfxes\/[a-z0-9-]+\.mp3$/);
  });
});

describe("cleatDropSfxMap: helpers", () => {
  it("keeps the repeating timer tick below full volume", () => {
    expect(CLEAT_DROP_SFX_GAIN["timer-tick"]).toBeLessThan(0.6);
  });
});
