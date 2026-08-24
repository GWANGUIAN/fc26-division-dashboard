/**
 * Bidirectionally sync roster.yaml against a CollaBot comment-export XLSX:
 * add applicants missing from the roster, and remove roster entries whose
 * SOOP ID is no longer among the applicants. Unlike
 * sync-roster-from-comments-xlsx.mjs (add-only, for manual local use), this
 * script is meant to run unattended in CI, so it aborts making any change
 * at all if the export looks anomalously small compared to the current
 * roster — a broken/partial page load must never be read as "everyone left".
 */
import { appendFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";
import { normaliseSoopId, readApplicantsFromXlsx } from "./lib/collabot-xlsx.mjs";
import { buildRosterBlock, detectEol, markEntriesDeletedBySoopIds, uniqueSlug } from "./lib/roster-text.mjs";

const defaultRosterPath = resolve("roster.yaml");
const defaultMinRatio = 0.5;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function readExistingEntries(rosterText) {
  const parsed = parseYaml(rosterText);
  const streamers = parsed?.streamers;
  if (!Array.isArray(streamers)) throw new Error("roster.yaml must contain a streamers array");
  return streamers.filter((entry) => entry.slug || entry.displayName || entry.soopId || entry.cafeAliases?.some(Boolean));
}

export function decideSync(existingEntries, liveApplicants, minRatio) {
  // Already-deleted entries are excluded from the live-applicant comparison
  // entirely: they can never be re-marked for removal, and they don't count
  // toward the ratio-abort threshold. Their soopId still counts as "known"
  // below so a lingering cafe post/comment never causes them to be re-added
  // as a fresh applicant.
  const withSoopId = existingEntries.filter((entry) => entry.soopId && !entry.deleted);
  const existingIds = new Set(withSoopId.map((entry) => normaliseSoopId(entry.soopId)));
  if (liveApplicants.length === 0 || liveApplicants.length < existingIds.size * minRatio) {
    return { aborted: true, liveCount: liveApplicants.length, existingCount: existingIds.size };
  }
  const liveIds = new Set(liveApplicants.map((applicant) => normaliseSoopId(applicant.soopId)));
  const knownIds = new Set(existingEntries.filter((entry) => entry.soopId).map((entry) => normaliseSoopId(entry.soopId)));
  const additions = liveApplicants.filter((applicant) => !knownIds.has(normaliseSoopId(applicant.soopId)));
  // isExcluded entries (e.g. non-applicants who still post division reports)
  // are protected from this comment-based removal even if they drop off the
  // live applicant list.
  const removals = withSoopId.filter((entry) => !liveIds.has(normaliseSoopId(entry.soopId)) && !entry.isExcluded);
  return { aborted: false, additions, removals };
}

function validateRosterText(rosterText) {
  const parsed = parseYaml(rosterText);
  const streamers = parsed?.streamers;
  if (!Array.isArray(streamers)) throw new Error("검증 실패: streamers 배열이 없습니다.");
  const slugs = new Set();
  for (const entry of streamers) {
    const hasContent = entry.slug || entry.displayName || entry.soopId || entry.cafeAliases?.some(Boolean);
    if (!hasContent) continue;
    const slug = (entry.slug || entry.soopId || "").trim();
    if (!slug || !entry.displayName) throw new Error("검증 실패: slug 또는 displayName이 없는 항목이 있습니다 (" + (slug || "unknown") + ")");
    if (slugs.has(slug)) throw new Error("검증 실패: slug가 중복되었습니다 (" + slug + ")");
    slugs.add(slug);
  }
}

async function writeGithubOutput(fields) {
  const path = process.env.GITHUB_OUTPUT;
  const lines = Object.entries(fields).map(([key, value]) => key + "=" + value).join("\n") + "\n";
  if (path) await appendFile(path, lines, "utf8");
  else console.log("[GITHUB_OUTPUT]\n" + lines);
}

async function main() {
  const xlsxPath = resolve(option("--xlsx"));
  const rosterPath = resolve(option("--roster", defaultRosterPath));
  const summaryPath = resolve(option("--summary-output", "collabot-sync-summary.txt"));
  const minRatio = Number(option("--min-ratio", process.env.MIN_LIVE_APPLICANT_RATIO ?? defaultMinRatio));
  const dryRun = process.argv.includes("--dry-run");
  if (!xlsxPath) throw new Error("--xlsx <path>가 필요합니다.");

  const applicants = await readApplicantsFromXlsx(xlsxPath);
  const rosterText = await readFile(rosterPath, "utf8");
  const existingEntries = readExistingEntries(rosterText);
  const decision = decideSync(existingEntries, applicants, minRatio);
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  // roster.length alone (active + soft-deleted) reads as a mismatch against
  // applicants.length once any entry carries deleted: true, since those never
  // count toward the live-applicant comparison — spell out the split so a
  // "변경사항이 없습니다" summary with mismatched counts doesn't look like a bug.
  // "삭제됨"/"제외" here describe the roster's existing state (as of before this
  // run); they're named differently from the "이번 실행 삭제 처리" section below
  // so the two don't read as the same number.
  const deletedCount = existingEntries.filter((entry) => entry.deleted).length;
  const excludedCount = existingEntries.filter((entry) => entry.isExcluded && !entry.deleted).length;
  const activeCount = existingEntries.length - deletedCount;
  const rosterLabelDetails = ["활성 " + activeCount + "명"];
  if (deletedCount) rosterLabelDetails.push("삭제됨 " + deletedCount + "명");
  if (excludedCount) rosterLabelDetails.push("제외 " + excludedCount + "명(신청자 목록에 없어도 유지)");
  const rosterLabel = "roster " + existingEntries.length + "명 (" + rosterLabelDetails.join(" · ") + ")";

  if (decision.aborted) {
    const reason = "신청자 수(" + decision.liveCount + "명)가 현재 roster(" + decision.existingCount + "명) 대비 너무 적어 동기화를 중단했습니다. "
      + "페이지 로딩 실패 가능성이 있습니다.";
    console.error(reason);
    await writeFile(summaryPath, "CollaBot 로스터 동기화 중단 (" + now + ")\n\n" + reason + "\n", "utf8");
    await writeGithubOutput({ changed: "false", aborted: "true", summary_file: summaryPath });
    return;
  }

  const { additions, removals } = decision;
  if (!additions.length && !removals.length) {
    await writeFile(summaryPath, "CollaBot 로스터 동기화 (" + now + ")\n\n변경사항이 없습니다. (신청자 " + applicants.length + "명, " + rosterLabel + ")\n", "utf8");
    await writeGithubOutput({ changed: "false", aborted: "false", summary_file: summaryPath });
    return;
  }

  // Removals are soft-deleted (a `deleted: true` line appended to the
  // existing block) rather than deleted from the file, so a soopId that
  // resurfaces later (comment un-deleted, or a fresh applicant re-using a
  // stale entry's soopId) is never silently re-added as a duplicate.
  const markResult = markEntriesDeletedBySoopIds(rosterText, removals.map((entry) => entry.soopId));
  const eol = detectEol(rosterText);
  // rosterValues() cannot reliably match `slug:` (its `- ` list-marker prefix
  // isn't whitespace), so slugs are taken from the already yaml-parsed
  // entries instead, matching the app's own slug-or-soopId rule. Every
  // existing slug stays in the file (soft-delete keeps the block), so all of
  // them count as used.
  const usedSlugs = new Set(
    existingEntries
      .map((entry) => (entry.slug || entry.soopId || "").toLowerCase())
      .filter(Boolean),
  );
  const appended = additions
    .map(({ displayName, soopId }) => buildRosterBlock({ slug: uniqueSlug(soopId, usedSlugs), displayName, soopId, cafeAliases: [displayName] }))
    .join(eol);
  const finalText = additions.length
    ? markResult.rosterText.trimEnd() + eol + appended + eol
    : markResult.rosterText.trimEnd() + eol;

  validateRosterText(finalText);

  const summaryLines = [
    "CollaBot 로스터 동기화 (" + now + ")",
    "",
    "신청자 " + applicants.length + "명 · 기존 " + rosterLabel,
    "",
    "이번 실행 신규 추가 (" + additions.length + "명):",
    ...additions.map((applicant) => "  + " + applicant.displayName + " (" + applicant.soopId + ")"),
    "",
    "이번 실행 신규 삭제 처리 (" + markResult.markedSoopIds.length + "명, deleted: true로 표시만 하고 파일에서 지우지는 않음):",
    ...removals
      .filter((entry) => markResult.markedSoopIds.includes(entry.soopId))
      .map((entry) => "  - " + entry.displayName + " (" + entry.soopId + ")"),
  ];
  if (markResult.skippedSoopIds.length) {
    summaryLines.push("", "경고: 아래 SOOP ID는 roster.yaml에서 정확히 1개 항목으로 특정되지 않아 건드리지 않았습니다:", ...markResult.skippedSoopIds.map((id) => "  ? " + id));
  }
  const summary = summaryLines.join("\n") + "\n";
  console.log(summary);

  if (dryRun) {
    console.log("--dry-run: roster.yaml을 변경하지 않았습니다.");
    await writeFile(summaryPath, summary, "utf8");
    await writeGithubOutput({ changed: "false", aborted: "false", summary_file: summaryPath });
    return;
  }

  await writeFile(rosterPath, finalText, "utf8");
  await writeFile(summaryPath, summary, "utf8");
  await writeGithubOutput({ changed: "true", aborted: "false", summary_file: summaryPath });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
