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
import JSZip from "jszip";

const defaultXlsxPath = resolve(homedir(), "Downloads", "댓글_ecvhao_204050719.xlsx");
const defaultRosterPath = resolve("roster.yaml");
const hyperlinkPattern = /^HYPERLINK\("(?<url>[^"]+)",\s*"(?<displayName>(?:[^"]|"")*)"\)$/;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function normaliseSoopId(value) {
  return value.trim().toLowerCase();
}

function decodeXml(value) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function extractApplicants(worksheetXml) {
  const applicants = new Map();
  const rows = worksheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);
  for (const row of rows) {
    const nicknameCell = /<c\b(?=[^>]*\br="A\d+")[^>]*>([\s\S]*?)<\/c>/.exec(row[1] ?? "");
    const formula = nicknameCell && /<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/.exec(nicknameCell[1]);
    if (!formula) continue;
    const match = hyperlinkPattern.exec(decodeXml(formula[1]).trim());
    if (!match?.groups) continue;

    const url = new URL(match.groups.url);
    const path = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (url.hostname !== "www.sooplive.com" || path.length !== 2 || path[0] !== "station") continue;

    const soopId = path[1]?.trim();
    const displayName = match.groups.displayName.replaceAll("\"\"", "\"").trim();
    if (soopId && displayName) applicants.set(normaliseSoopId(soopId), { displayName, soopId });
  }
  return [...applicants.values()];
}

function rosterValues(rosterText, field) {
  const pattern = new RegExp("^\\s*" + field + ":\\s*(?:\"(?<double>[^\"]*)\"|'(?<single>[^']*)'|(?<plain>[^\\s#]+))", "gm");
  return [...rosterText.matchAll(pattern)]
    .map((match) => match.groups?.double ?? match.groups?.single ?? match.groups?.plain ?? "")
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueSlug(soopId, usedSlugs) {
  const base = soopId.trim();
  let slug = base;
  let suffix = 2;
  while (usedSlugs.has(slug.toLowerCase())) slug = base + "-" + suffix++;
  usedSlugs.add(slug.toLowerCase());
  return slug;
}

async function main() {
  const xlsxPath = resolve(option("--xlsx", defaultXlsxPath));
  const rosterPath = resolve(option("--roster", defaultRosterPath));
  const dryRun = process.argv.includes("--dry-run");
  if (!existsSync(xlsxPath)) throw new Error("Excel 파일을 찾을 수 없습니다: " + xlsxPath);
  if (!existsSync(rosterPath)) throw new Error("roster.yaml을 찾을 수 없습니다: " + rosterPath);

  const workbook = await JSZip.loadAsync(await readFile(xlsxPath));
  const worksheet = workbook.file("xl/worksheets/sheet1.xml");
  if (!worksheet) throw new Error("첫 번째 워크시트를 찾을 수 없습니다.");
  const applicants = extractApplicants(await worksheet.async("string"));
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

  const appended = additions.map(({ displayName, soopId }) => [
    "  - slug: " + uniqueSlug(soopId, usedSlugs),
    "    displayName: " + JSON.stringify(displayName),
    "    cafeAliases: [\"\"]",
    "    soopId: " + JSON.stringify(soopId),
    "    autoUpdate: true",
    "    override:",
    "      division: null",
    "      policy: auto",
  ].join("\n")).join("\n");
  await writeFile(rosterPath, rosterText.trimEnd() + "\n" + appended + "\n", "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
