import JSZip from "jszip";
import type { CareerRecord, StreamerRecord } from "../shared/model.js";
import { soopChannelUrl } from "../shared/model.js";
import { koreaDateKey } from "../shared/dates.js";
import { winRatePercent } from "../shared/record-extraction.js";
import {
  flattenWakgoodNotes,
  flattenWakgoodVodUrls,
  getWakgoodNote,
  isSkippedWakgoodNote,
  visibleWakgoodNoteGroups,
  type WakgoodNoteGroup,
} from "./wakgoodNotes.js";
import { matchAppearancesForStreamer } from "./testScheduleData.js";

const HEADERS = [
  "이름",
  "숲 아이디",
  "카페 닉네임",
  "디비전",
  "승",
  "무",
  "패",
  "경기수",
  "승률",
  "최근 보고일",
  "SOOP 채널",
];

type Cell = { value: string; type: "str" | "num" };

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function columnLetter(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function cellXml(ref: string, cell: Cell): string {
  if (cell.type === "num") return `<c r="${ref}"><v>${cell.value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
}

function rowXml(rowIndex: number, cells: Cell[]): string {
  const rowCells = cells.map((cell, columnIndex) => cellXml(`${columnLetter(columnIndex)}${rowIndex}`, cell)).join("");
  return `<row r="${rowIndex}">${rowCells}</row>`;
}

function winRateLabel(record?: CareerRecord): string {
  if (!record) return "-";
  const rate = winRatePercent(record);
  return rate === undefined ? "-" : `${rate.toFixed(1)}%`;
}

function totalGames(record?: CareerRecord): number | undefined {
  if (!record) return undefined;
  return record.wins + record.draws + record.losses;
}

function lastReportDateLabel(streamer: StreamerRecord): string {
  return streamer.lastPost ? koreaDateKey(new Date(streamer.lastPost.publishedAt)) : "-";
}

function streamerRow(streamer: StreamerRecord): Cell[] {
  const record = streamer.record;
  const games = totalGames(record);
  return [
    { value: streamer.displayName, type: "str" },
    { value: streamer.soopId ?? "-", type: "str" },
    { value: streamer.cafeAliases.join(", ") || "-", type: "str" },
    { value: String(streamer.currentDivision), type: "num" },
    { value: record ? String(record.wins) : "-", type: record ? "num" : "str" },
    { value: record ? String(record.draws) : "-", type: record ? "num" : "str" },
    { value: record ? String(record.losses) : "-", type: record ? "num" : "str" },
    { value: games !== undefined ? String(games) : "-", type: games !== undefined ? "num" : "str" },
    { value: winRateLabel(record), type: "str" },
    { value: lastReportDateLabel(streamer), type: "str" },
    { value: soopChannelUrl(streamer.soopId) ?? "-", type: "str" },
  ];
}

async function buildXlsxBlob(sheetName: string, headers: string[], rows: Cell[][]): Promise<Blob> {
  const headerRow = rowXml(1, headers.map((value) => ({ value, type: "str" as const })));
  const dataRows = rows.map((row, index) => rowXml(index + 2, row));
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${[headerRow, ...dataRows].join("")}</sheetData></worksheet>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.file("xl/worksheets/sheet1.xml", sheetXml);

  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function buildStreamersXlsx(streamers: StreamerRecord[]): Promise<Blob> {
  return buildXlsxBlob("디비전 현황", HEADERS, streamers.map(streamerRow));
}

export async function downloadStreamersXlsx(streamers: StreamerRecord[], filename: string): Promise<void> {
  downloadBlob(await buildStreamersXlsx(streamers), filename);
}

const WAKGOOD_NOTEBOOK_HEADERS = [
  "이름",
  "카페 닉네임",
  "희망 포지션1",
  "희망 포지션2",
  "경기일",
  "상태",
  "메모",
  "VOD 링크",
];

function wakgoodNotebookStatusLabel(
  noteGroups: WakgoodNoteGroup[] | undefined,
): "완료" | "넘어감" | "미완료" {
  if (isSkippedWakgoodNote(noteGroups)) return "넘어감";
  if (flattenWakgoodNotes(noteGroups).length > 0) return "완료";
  return "미완료";
}

function wakgoodNotebookRow(streamer: StreamerRecord): Cell[] {
  const entry = getWakgoodNote(streamer.id);
  const noteGroups = entry?.noteGroups;
  const status = wakgoodNotebookStatusLabel(noteGroups);
  const appearances = matchAppearancesForStreamer(streamer.id);
  const matchDaysLabel =
    appearances
      .map((appearance) => (appearance.gameLabel ? `${appearance.date} ${appearance.gameLabel}` : appearance.date))
      .join(", ") || "-";
  const visibleGroups = visibleWakgoodNoteGroups(noteGroups);
  const noteText =
    status === "미완료"
      ? "-"
      : visibleGroups
          .map((group) =>
            visibleGroups.length > 1 && group.label
              ? `[${group.label}] ${group.notes.join(" / ")}`
              : group.notes.join(" / "),
          )
          .join(" | ");
  return [
    { value: streamer.displayName, type: "str" },
    { value: streamer.cafeAliases.join(", ") || "-", type: "str" },
    { value: streamer.hopedPosition1 ?? "-", type: "str" },
    { value: streamer.hopedPosition2 ?? "-", type: "str" },
    { value: matchDaysLabel, type: "str" },
    { value: status, type: "str" },
    { value: noteText, type: "str" },
    { value: flattenWakgoodVodUrls(noteGroups).join(", ") || "-", type: "str" },
  ];
}

export async function buildWakgoodNotebookXlsx(streamers: StreamerRecord[]): Promise<Blob> {
  return buildXlsxBlob("우왁굳의 메모장", WAKGOOD_NOTEBOOK_HEADERS, streamers.map(wakgoodNotebookRow));
}

export async function downloadWakgoodNotebookXlsx(streamers: StreamerRecord[], filename: string): Promise<void> {
  downloadBlob(await buildWakgoodNotebookXlsx(streamers), filename);
}
