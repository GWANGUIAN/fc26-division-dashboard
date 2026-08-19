/**
 * Add unmapped SOOP applicants from a CollaBot comment-export XLSX file.
 *
 * The workbook is the only source read by this script. Existing roster rows
 * are never changed; an already registered SOOP ID is simply skipped.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { normaliseSoopId, readApplicantsFromXlsx } from "./lib/collabot-xlsx.mjs";
import { buildRosterBlock, rosterValues, uniqueSlug } from "./lib/roster-text.mjs";

const defaultXlsxPath = resolve(homedir(), "Downloads", "댓글_ecvhao_204050719.xlsx");
const defaultRosterPath = resolve("roster.yaml");

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function main() {
  const xlsxPath = resolve(option("--xlsx", defaultXlsxPath));
  const rosterPath = resolve(option("--roster", defaultRosterPath));
  const dryRun = process.argv.includes("--dry-run");
  if (!existsSync(xlsxPath)) throw new Error("Excel 파일을 찾을 수 없습니다: " + xlsxPath);
  if (!existsSync(rosterPath)) throw new Error("roster.yaml을 찾을 수 없습니다: " + rosterPath);

  const applicants = await readApplicantsFromXlsx(xlsxPath);
  if (!applicants.length) throw new Error("Excel 파일의 닉네임 하이퍼링크에서 SOOP ID를 찾지 못했습니다.");

  const rosterText = await readFile(rosterPath, "utf8");
  const existingSoopIds = new Set(rosterValues(rosterText, "soopId").map(normaliseSoopId));
  const usedSlugs = new Set(rosterValues(rosterText, "slug").map((slug) => slug.toLowerCase()));
  const additions = applicants.filter(({ soopId }) => !existingSoopIds.has(normaliseSoopId(soopId)));

  console.log("Excel 댓글 " + applicants.length + "명 확인 · 기존 " + (applicants.length - additions.length) + "명 건너뜀 · 신규 " + additions.length + "명");
  for (const applicant of additions) console.log("+ " + applicant.displayName + " (" + applicant.soopId + ")");
  if (dryRun || !additions.length) {
    if (dryRun) console.log("--dry-run: roster.yaml을 변경하지 않았습니다.");
    return;
  }

  const appended = additions
    .map(({ displayName, soopId }) => buildRosterBlock({ slug: uniqueSlug(soopId, usedSlugs), displayName, soopId, cafeAliases: [""] }))
    .join("\n");
  await writeFile(rosterPath, rosterText.trimEnd() + "\n" + appended + "\n", "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
