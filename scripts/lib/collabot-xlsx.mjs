/**
 * Parsing helpers for a CollaBot comment-export XLSX file
 * (https://colla.bot "Excel로 내보내기"). Column A holds a
 * HYPERLINK("https://www.sooplive.com/station/<soopId>","<displayName>")
 * formula per applicant row; this module extracts those pairs.
 */
import { readFile } from "node:fs/promises";
import JSZip from "jszip";

export const hyperlinkPattern = /^HYPERLINK\("(?<url>[^"]+)",\s*"(?<displayName>(?:[^"]|"")*)"\)$/;

export function normaliseSoopId(value) {
  return value.trim().toLowerCase();
}

export function decodeXml(value) {
  return value
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

export function extractApplicants(worksheetXml) {
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

export async function readApplicantsFromXlsx(xlsxPath) {
  const workbook = await JSZip.loadAsync(await readFile(xlsxPath));
  const worksheet = workbook.file("xl/worksheets/sheet1.xml");
  if (!worksheet) throw new Error("첫 번째 워크시트를 찾을 수 없습니다.");
  return extractApplicants(await worksheet.async("string"));
}
