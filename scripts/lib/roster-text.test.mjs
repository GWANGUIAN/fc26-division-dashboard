import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { buildRosterBlock, detectEol, findEntryBlocks, markEntriesDeletedBySoopIds, removeEntriesBySoopIds, rosterValues, uniqueSlug, unmarkEntriesDeletedBySoopIds } from "./roster-text.mjs";

const sampleLf = [
  "streamers:",
  "  - slug: villlo",
  "    displayName: 왜냐니",
  "    cafeAliases: [\"왜냐니\"]",
  "    soopId: \"villlo\"",
  "    autoUpdate: true",
  "    override:",
  "      division: null",
  "      policy: auto",
  "    sfx: \"/sfxes/why.mp3\"",
  "  - slug: nogood",
  "    displayName: 노굿",
  "    cafeAliases: []",
  "    soopId: nogood",
  "    autoUpdate: true",
  "    override:",
  "      division: null",
  "      policy: auto",
  "  - slug: \"015234\"",
  "    displayName: 아눙",
  "    cafeAliases: [\"아눙\"]",
  "    soopId: \"015234\"",
  "    autoUpdate: true",
  "    override:",
  "      division: null",
  "      policy: auto",
].join("\n") + "\n";

describe("rosterValues", () => {
  it("extracts quoted, single-quoted, and plain field values", () => {
    expect(rosterValues(sampleLf, "soopId")).toEqual(["villlo", "nogood", "015234"]);
    expect(rosterValues(sampleLf, "displayName")).toEqual(["왜냐니", "노굿", "아눙"]);
  });

  it("does not match a field on the same line as the `- ` list marker", () => {
    // `^\s*field:` requires only whitespace before the field name, so
    // `  - slug: x` (marker + field on one line) never matches — a known,
    // pre-existing limitation carried over unchanged from the original script.
    expect(rosterValues(sampleLf, "slug")).toEqual([]);
  });
});

describe("uniqueSlug", () => {
  it("returns the base id when unused", () => {
    expect(uniqueSlug("fresh", new Set())).toBe("fresh");
  });
  it("appends a numeric suffix on collision", () => {
    const used = new Set(["dup"]);
    expect(uniqueSlug("dup", used)).toBe("dup-2");
    expect(used.has("dup-2")).toBe(true);
  });
});

describe("detectEol", () => {
  it("detects CRLF when present", () => {
    expect(detectEol("a\r\nb\r\n")).toBe("\r\n");
  });
  it("defaults to LF", () => {
    expect(detectEol("a\nb\n")).toBe("\n");
  });
});

describe("buildRosterBlock", () => {
  it("produces a block that round-trips through the YAML parser", () => {
    const block = buildRosterBlock({ slug: "newbie", displayName: "새싹", soopId: "newbie", cafeAliases: ["새싹"] });
    const parsed = parseYaml("streamers:\n" + block + "\n");
    expect(parsed.streamers).toEqual([{
      slug: "newbie",
      displayName: "새싹",
      cafeAliases: ["새싹"],
      soopId: "newbie",
      autoUpdate: true,
      override: { division: null, policy: "auto" },
    }]);
  });
});

describe("findEntryBlocks", () => {
  it("finds one block per entry with no gaps", () => {
    const blocks = findEntryBlocks(sampleLf);
    expect(blocks).toHaveLength(3);
    expect(blocks[2].end).toBe(sampleLf.length);
  });
});

describe("removeEntriesBySoopIds", () => {
  it("removes a middle entry, leaving the others intact", () => {
    const { rosterText, removedSoopIds, skippedSoopIds } = removeEntriesBySoopIds(sampleLf, ["nogood"]);
    expect(removedSoopIds).toEqual(["nogood"]);
    expect(skippedSoopIds).toEqual([]);
    expect(rosterText).not.toContain("nogood");
    expect(rosterText).toContain("villlo");
    expect(rosterText).toContain("015234");
    expect(parseYaml(rosterText).streamers).toHaveLength(2);
  });

  it("removes the last entry in the file", () => {
    const { rosterText, removedSoopIds } = removeEntriesBySoopIds(sampleLf, ["015234"]);
    expect(removedSoopIds).toEqual(["015234"]);
    expect(rosterText).not.toContain("아눙");
    expect(parseYaml(rosterText).streamers).toHaveLength(2);
  });

  it("matches both quoted and unquoted soopId values", () => {
    const quoted = removeEntriesBySoopIds(sampleLf, ["villlo"]);
    const unquoted = removeEntriesBySoopIds(sampleLf, ["nogood"]);
    expect(quoted.removedSoopIds).toEqual(["villlo"]);
    expect(unquoted.removedSoopIds).toEqual(["nogood"]);
  });

  it("removes multiple entries in one call without corrupting offsets", () => {
    const { rosterText, removedSoopIds } = removeEntriesBySoopIds(sampleLf, ["villlo", "015234"]);
    expect(removedSoopIds.sort()).toEqual(["015234", "villlo"]);
    const parsed = parseYaml(rosterText);
    expect(parsed.streamers).toHaveLength(1);
    expect(parsed.streamers[0].soopId).toBe("nogood");
  });

  it("skips a soopId with zero matches instead of guessing", () => {
    const { rosterText, removedSoopIds, skippedSoopIds } = removeEntriesBySoopIds(sampleLf, ["doesnotexist"]);
    expect(removedSoopIds).toEqual([]);
    expect(skippedSoopIds).toEqual(["doesnotexist"]);
    expect(rosterText).toBe(sampleLf);
  });

  it("skips a soopId that matches more than one block", () => {
    const duplicated = sampleLf + sampleLf.split("\n").slice(1, 10).join("\n") + "\n";
    const { removedSoopIds, skippedSoopIds } = removeEntriesBySoopIds(duplicated, ["villlo"]);
    expect(removedSoopIds).toEqual([]);
    expect(skippedSoopIds).toEqual(["villlo"]);
  });

  it("preserves CRLF line endings", () => {
    const crlf = sampleLf.replace(/\n/g, "\r\n");
    const { rosterText } = removeEntriesBySoopIds(crlf, ["nogood"]);
    expect(rosterText).not.toContain("nogood");
    expect(rosterText).toContain("\r\n");
    expect(parseYaml(rosterText).streamers).toHaveLength(2);
  });
});

describe("markEntriesDeletedBySoopIds", () => {
  it("appends deleted: true to a middle entry, leaving the others untouched", () => {
    const { rosterText, markedSoopIds, skippedSoopIds } = markEntriesDeletedBySoopIds(sampleLf, ["nogood"]);
    expect(markedSoopIds).toEqual(["nogood"]);
    expect(skippedSoopIds).toEqual([]);
    const parsed = parseYaml(rosterText);
    expect(parsed.streamers).toHaveLength(3);
    expect(parsed.streamers.find((s) => s.soopId === "nogood").deleted).toBe(true);
    expect(parsed.streamers.find((s) => s.soopId === "villlo").deleted).toBeUndefined();
    expect(parsed.streamers.find((s) => s.soopId === "015234").deleted).toBeUndefined();
  });

  it("appends deleted: true to the last entry in the file", () => {
    const { rosterText } = markEntriesDeletedBySoopIds(sampleLf, ["015234"]);
    const parsed = parseYaml(rosterText);
    expect(parsed.streamers).toHaveLength(3);
    expect(parsed.streamers.find((s) => s.soopId === "015234").deleted).toBe(true);
  });

  it("marks multiple entries in one call without corrupting offsets", () => {
    const { rosterText, markedSoopIds } = markEntriesDeletedBySoopIds(sampleLf, ["villlo", "015234"]);
    expect(markedSoopIds.sort()).toEqual(["015234", "villlo"]);
    const parsed = parseYaml(rosterText);
    expect(parsed.streamers).toHaveLength(3);
    expect(parsed.streamers.find((s) => s.soopId === "villlo").deleted).toBe(true);
    expect(parsed.streamers.find((s) => s.soopId === "015234").deleted).toBe(true);
    expect(parsed.streamers.find((s) => s.soopId === "nogood").deleted).toBeUndefined();
  });

  it("skips a soopId with zero matches instead of guessing", () => {
    const { rosterText, markedSoopIds, skippedSoopIds } = markEntriesDeletedBySoopIds(sampleLf, ["doesnotexist"]);
    expect(markedSoopIds).toEqual([]);
    expect(skippedSoopIds).toEqual(["doesnotexist"]);
    expect(rosterText).toBe(sampleLf);
  });

  it("preserves CRLF line endings", () => {
    const crlf = sampleLf.replace(/\n/g, "\r\n");
    const { rosterText } = markEntriesDeletedBySoopIds(crlf, ["nogood"]);
    expect(rosterText).toContain("\r\n");
    const parsed = parseYaml(rosterText);
    expect(parsed.streamers.find((s) => s.soopId === "nogood").deleted).toBe(true);
  });
});

describe("unmarkEntriesDeletedBySoopIds", () => {
  it("reverses markEntriesDeletedBySoopIds for a middle entry", () => {
    const { rosterText: marked } = markEntriesDeletedBySoopIds(sampleLf, ["nogood"]);
    const { rosterText, unmarkedSoopIds, skippedSoopIds } = unmarkEntriesDeletedBySoopIds(marked, ["nogood"]);
    expect(unmarkedSoopIds).toEqual(["nogood"]);
    expect(skippedSoopIds).toEqual([]);
    expect(rosterText).toBe(sampleLf);
    expect(parseYaml(rosterText).streamers.find((s) => s.soopId === "nogood").deleted).toBeUndefined();
  });

  it("reverses markEntriesDeletedBySoopIds for the last entry in the file", () => {
    const { rosterText: marked } = markEntriesDeletedBySoopIds(sampleLf, ["015234"]);
    const { rosterText } = unmarkEntriesDeletedBySoopIds(marked, ["015234"]);
    expect(rosterText).toBe(sampleLf);
  });

  it("unmarks multiple entries in one call without corrupting offsets", () => {
    const { rosterText: marked } = markEntriesDeletedBySoopIds(sampleLf, ["villlo", "015234"]);
    const { rosterText, unmarkedSoopIds } = unmarkEntriesDeletedBySoopIds(marked, ["villlo", "015234"]);
    expect(unmarkedSoopIds.sort()).toEqual(["015234", "villlo"]);
    expect(rosterText).toBe(sampleLf);
  });

  it("leaves other fields on the entry untouched", () => {
    const { rosterText: marked } = markEntriesDeletedBySoopIds(sampleLf, ["nogood"]);
    const { rosterText } = unmarkEntriesDeletedBySoopIds(marked, ["nogood"]);
    const parsed = parseYaml(rosterText);
    expect(parsed.streamers.find((s) => s.soopId === "villlo").deleted).toBeUndefined();
    expect(parsed.streamers.find((s) => s.soopId === "015234").deleted).toBeUndefined();
  });

  it("skips a soopId with zero matches instead of guessing", () => {
    const { rosterText, unmarkedSoopIds, skippedSoopIds } = unmarkEntriesDeletedBySoopIds(sampleLf, ["doesnotexist"]);
    expect(unmarkedSoopIds).toEqual([]);
    expect(skippedSoopIds).toEqual(["doesnotexist"]);
    expect(rosterText).toBe(sampleLf);
  });

  it("preserves CRLF line endings", () => {
    const crlf = sampleLf.replace(/\n/g, "\r\n");
    const { rosterText: marked } = markEntriesDeletedBySoopIds(crlf, ["nogood"]);
    const { rosterText } = unmarkEntriesDeletedBySoopIds(marked, ["nogood"]);
    expect(rosterText).toBe(crlf);
    expect(rosterText).toContain("\r\n");
  });
});
