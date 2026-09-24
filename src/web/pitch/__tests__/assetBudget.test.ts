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

  it("prints the report used in docs/pitch/README (P7)", () => {
    const rows = (["boot", "core", "select", "locker"] as const).map((group) => `${group.padEnd(7)} ${String(ASSET_GROUPS[group].length).padStart(3)} files  ${(bytesOf(group) / KB).toFixed(0).padStart(6)} KB  decoded ${(decodedOf(group) / MB).toFixed(1).padStart(5)} MB`);
    const chars = PITCH_CHARACTER_IDS.map((id) => ({ id, bytes: bytesOf(`char:${id}`), atlas: PITCH_ASSET_META[`characters/${id}-atlas`]?.bytes ?? 0 }));
    const biggest = chars.reduce((a, b) => (b.bytes > a.bytes ? b : a));
    console.info(["[pitch] asset budget", ...rows, `char:<id> max ${(biggest.bytes / KB).toFixed(0)} KB (${biggest.id}), atlas max ${(Math.max(...chars.map((c) => c.atlas)) / KB).toFixed(0)} KB`, `boot+core+worst char ${((bytesOf("boot") + bytesOf("core") + biggest.bytes) / MB).toFixed(2)} MB`].join("\n"));
    expect(rows).toHaveLength(4);
  });
});
