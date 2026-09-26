import { describe, expect, it } from "vitest";
import { PITCH_ASSET_META } from "../data/assetMeta.generated";
import { PITCH_CHARACTER_IDS } from "../data/characterIds";
import { ASSET_GROUPS, groupSpecs, type AssetGroupName } from "../engine/assets";

// Loading budget (docs/pitch/01 §7): boot ≤ 300KB, boot + core (+ the selected character) ≤ 3MB. The byte counts come from
// the converter's generated table, which is the size of the .webp files that end up in dist/web/assets.
const KB = 1024;
const MB = 1024 * KB;

const bytesOf = (group: AssetGroupName) => groupSpecs(group).reduce((sum, spec) => sum + (spec.bytes ?? 0), 0);
/** RGBA decoded size, what the browser keeps once an image is a bitmap. */
const decodedOf = (group: AssetGroupName) =>
  groupSpecs(group).reduce((sum, spec) => {
    const meta = PITCH_ASSET_META[spec.key];
    return sum + (meta ? meta.w * meta.h * 4 : 0);
  }, 0);

describe("pitch loading budget", () => {
  it("every listed file exists in the generated table (nothing counted as 0 bytes by accident)", () => {
    for (const group of Object.keys(ASSET_GROUPS) as Array<keyof typeof ASSET_GROUPS>) {
      const unknown = ASSET_GROUPS[group].filter((spec) => !PITCH_ASSET_META[spec.key]).map((spec) => spec.key);
      expect(unknown, `${group} lists files that are not converted`).toEqual([]);
    }
  });

  it("boot ≤ 300KB", () => {
    expect(bytesOf("boot")).toBeLessThanOrEqual(300 * KB);
  });

  it("boot + core + the default character ≤ 3MB, whichever character is picked", () => {
    const base = bytesOf("boot") + bytesOf("core");
    const worst = Math.max(...PITCH_CHARACTER_IDS.map((id) => bytesOf(`char:${id}`)));
    expect(base + worst).toBeLessThanOrEqual(3 * MB);
  });

  it("forever group (measured 2026-09-27 with the portals and the letter: 1.10MB / 6.5MB decoded) stays within 1.25MB and 7MB decoded, under the locker group's decoded size", () => {
    expect(bytesOf("forever")).toBeLessThanOrEqual(1.25 * MB);
    expect(decodedOf("forever")).toBeLessThanOrEqual(7 * MB);
  });

  it("forever-field (the monster meadow: background + 7 props, measured 2026-09-27) has its own budget and shares no file with forever", () => {
    expect(ASSET_GROUPS["forever-field"]).toHaveLength(8);
    expect(bytesOf("forever-field")).toBeLessThanOrEqual(400 * KB);
    expect(decodedOf("forever-field")).toBeLessThanOrEqual(3 * MB);
    const first = new Set(ASSET_GROUPS.forever.map((spec) => spec.key));
    for (const spec of ASSET_GROUPS["forever-field"]) expect(first.has(spec.key)).toBe(false);
  });

  it("forever2 (the second map: background + 6 NPCs) has its own budget and shares no file with forever", () => {
    expect(ASSET_GROUPS.forever2).toHaveLength(7);
    expect(bytesOf("forever2")).toBeLessThanOrEqual(600 * KB);
    expect(decodedOf("forever2")).toBeLessThanOrEqual(3 * MB);
    const first = new Set(ASSET_GROUPS.forever.map((spec) => spec.key));
    for (const spec of ASSET_GROUPS.forever2) expect(first.has(spec.key)).toBe(false);
  });

  it("the pitch gate's forever art sits in core (always on screen), the rest in the forever group", () => {
    const core = ASSET_GROUPS.core.map((spec) => spec.key);
    const forever = ASSET_GROUPS.forever.map((spec) => spec.key);
    for (const name of ["closed", "open", "glow", "arrow", "plate"]) {
      expect(core).toContain(`env/forever-gate-${name}`);
      expect(forever).not.toContain(`env/forever-gate-${name}`);
    }
    expect(forever).toContain("ui/forever-logo");
    expect(ASSET_GROUPS.boot.map((spec) => spec.key)).not.toContain("ui/forever-logo");
  });

  it("prints the report used in docs/pitch/README (P7)", () => {
    const rows = (["boot", "core", "select", "locker", "forever", "forever2", "forever-field"] as const).map((group) => `${group.padEnd(7)} ${String(ASSET_GROUPS[group].length).padStart(3)} files  ${(bytesOf(group) / KB).toFixed(0).padStart(6)} KB  decoded ${(decodedOf(group) / MB).toFixed(1).padStart(5)} MB`);
    const chars = PITCH_CHARACTER_IDS.map((id) => ({ id, bytes: bytesOf(`char:${id}`), atlas: PITCH_ASSET_META[`characters/${id}-atlas`]?.bytes ?? 0 }));
    const biggest = chars.reduce((a, b) => (b.bytes > a.bytes ? b : a));
    console.info(["[pitch] asset budget", ...rows, `char:<id> max ${(biggest.bytes / KB).toFixed(0)} KB (${biggest.id}), atlas max ${(Math.max(...chars.map((c) => c.atlas)) / KB).toFixed(0)} KB`, `boot+core+worst char ${((bytesOf("boot") + bytesOf("core") + biggest.bytes) / MB).toFixed(2)} MB`].join("\n"));
    expect(rows).toHaveLength(7);
  });
});
