import JSZip from "jszip";
import type { CareerRecord, StreamerRecord } from "../shared/model.js";
import { winRatePercent } from "../shared/record-extraction.js";

const HEADERS = ["이름", "숲 아이디", "카페 닉네임", "디비전", "승률"];
const COLUMN_LETTERS = ["A", "B", "C", "D", "E"];

type Cell = { value: string; type: "str" | "num" };

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function cellXml(ref: string, cell: Cell): string {
  if (cell.type === "num") return `<c r="${ref}"><v>${cell.value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
}

function rowXml(rowIndex: number, cells: Cell[]): string {
  const rowCells = cells.map((cell, columnIndex) => cellXml(`${COLUMN_LETTERS[columnIndex]}${rowIndex}`, cell)).join("");
  return `<row r="${rowIndex}">${rowCells}</row>`;
}

function winRateLabel(record?: CareerRecord): string {
  if (!record) return "-";
  const rate = winRatePercent(record);
  return rate === undefined ? "-" : `${rate.toFixed(1)}%`;
}

function streamerRow(streamer: StreamerRecord): Cell[] {
  return [
    { value: streamer.displayName, type: "str" },
    { value: streamer.soopId ?? "-", type: "str" },
    { value: streamer.cafeAliases.join(", ") || "-", type: "str" },
    { value: String(streamer.currentDivision), type: "num" },
    { value: winRateLabel(streamer.record), type: "str" },
  ];
}

export async function buildStreamersXlsx(streamers: StreamerRecord[]): Promise<Blob> {
  const headerRow = rowXml(1, HEADERS.map((value) => ({ value, type: "str" as const })));
  const dataRows = streamers.map((streamer, index) => rowXml(index + 2, streamerRow(streamer)));
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${[headerRow, ...dataRows].join("")}</sheetData></worksheet>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="디비전 현황" sheetId="1" r:id="rId1"/></sheets></workbook>`);
  zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`);
  zip.file("xl/worksheets/sheet1.xml", sheetXml);

  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function downloadStreamersXlsx(streamers: StreamerRecord[], filename: string): Promise<void> {
  const blob = await buildStreamersXlsx(streamers);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
