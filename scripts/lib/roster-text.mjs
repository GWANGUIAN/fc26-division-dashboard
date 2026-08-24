/**
 * Raw-text helpers for editing roster.yaml without a YAML-library
 * round-trip, so existing comments/formatting/quoting style survive.
 */

export function rosterValues(rosterText, field) {
  const pattern = new RegExp("^\\s*" + field + ":\\s*(?:\"(?<double>[^\"]*)\"|'(?<single>[^']*)'|(?<plain>[^\\s#]+))", "gm");
  return [...rosterText.matchAll(pattern)]
    .map((match) => match.groups?.double ?? match.groups?.single ?? match.groups?.plain ?? "")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function uniqueSlug(soopId, usedSlugs) {
  const base = soopId.trim();
  let slug = base;
  let suffix = 2;
  while (usedSlugs.has(slug.toLowerCase())) slug = base + "-" + suffix++;
  usedSlugs.add(slug.toLowerCase());
  return slug;
}

export function detectEol(rosterText) {
  return rosterText.includes("\r\n") ? "\r\n" : "\n";
}

export function buildRosterBlock({ slug, displayName, soopId, cafeAliases }) {
  return [
    "  - slug: " + slug,
    "    displayName: " + JSON.stringify(displayName),
    "    cafeAliases: " + JSON.stringify(cafeAliases),
    "    soopId: " + JSON.stringify(soopId),
    "    autoUpdate: true",
    "    override:",
    "      division: null",
    "      policy: auto",
  ].join("\n");
}

/** Locate every `  - ...` entry block in roster.yaml as [start, end) offsets into rosterText. */
export function findEntryBlocks(rosterText) {
  const starts = [...rosterText.matchAll(/^ {2}-\s/gm)].map((match) => match.index);
  return starts.map((start, index) => ({ start, end: starts[index + 1] ?? rosterText.length }));
}

function soopIdPattern(soopId) {
  const escaped = soopId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(String.raw`^\s*soopId:\s*(?:"${escaped}"|'${escaped}'|${escaped})\s*(#.*)?$`, "m");
}

/**
 * Remove every entry block whose soopId (exact string, case-sensitive as
 * stored) matches one of soopIdsToRemove. Blocks are matched against the
 * original text first, then spliced from the highest offset down, so an
 * earlier removal never invalidates a later block's offsets. A soopId with
 * zero or more than one matching block is left untouched and reported back
 * as skipped rather than guessed at.
 */
export function removeEntriesBySoopIds(rosterText, soopIdsToRemove) {
  const blocks = findEntryBlocks(rosterText);
  const removedSoopIds = [];
  const skippedSoopIds = [];
  const blocksToRemove = [];

  for (const soopId of soopIdsToRemove) {
    const pattern = soopIdPattern(soopId);
    const matches = blocks.filter((block) => pattern.test(rosterText.slice(block.start, block.end)));
    if (matches.length !== 1) {
      skippedSoopIds.push(soopId);
      continue;
    }
    removedSoopIds.push(soopId);
    blocksToRemove.push(matches[0]);
  }

  blocksToRemove.sort((a, b) => b.start - a.start);
  let result = rosterText;
  for (const block of blocksToRemove) result = result.slice(0, block.start) + result.slice(block.end);

  return { rosterText: result, removedSoopIds, skippedSoopIds };
}

/**
 * Soft-delete every entry block whose soopId matches one of soopIdsToMark, by
 * appending a `deleted: true` line to it, instead of removing the block. A
 * soopId with zero or more than one matching block is left untouched and
 * reported back as skipped rather than guessed at, matching
 * removeEntriesBySoopIds's behaviour.
 */
export function markEntriesDeletedBySoopIds(rosterText, soopIdsToMark) {
  const blocks = findEntryBlocks(rosterText);
  const markedSoopIds = [];
  const skippedSoopIds = [];
  const blocksToMark = [];
  const eol = detectEol(rosterText);

  for (const soopId of soopIdsToMark) {
    const pattern = soopIdPattern(soopId);
    const matches = blocks.filter((block) => pattern.test(rosterText.slice(block.start, block.end)));
    if (matches.length !== 1) {
      skippedSoopIds.push(soopId);
      continue;
    }
    markedSoopIds.push(soopId);
    blocksToMark.push(matches[0]);
  }

  blocksToMark.sort((a, b) => b.start - a.start);
  let result = rosterText;
  for (const block of blocksToMark) {
    result = result.slice(0, block.end) + "    deleted: true" + eol + result.slice(block.end);
  }

  return { rosterText: result, markedSoopIds, skippedSoopIds };
}
