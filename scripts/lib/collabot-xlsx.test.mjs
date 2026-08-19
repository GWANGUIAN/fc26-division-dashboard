import { describe, expect, it } from "vitest";
import { decodeXml, extractApplicants, normaliseSoopId } from "./collabot-xlsx.mjs";

function worksheetRow(rowIndex, formula) {
  return '<row r="' + rowIndex + '"><c r="A' + rowIndex + '" t="str"><f>' + formula + "</f></c></row>";
}

describe("normaliseSoopId", () => {
  it("trims and lowercases", () => {
    expect(normaliseSoopId(" AbC ")).toBe("abc");
  });
});

describe("decodeXml", () => {
  it("decodes the standard XML entities", () => {
    expect(decodeXml("&quot;a&quot; &amp; &lt;b&gt; &apos;c&apos;")).toBe("\"a\" & <b> 'c'");
  });
});

describe("extractApplicants", () => {
  it("extracts soopId/displayName pairs from HYPERLINK formulas", () => {
    const xml = "<sheetData>"
      + worksheetRow(1, 'HYPERLINK(&quot;https://www.sooplive.com/station/villlo&quot;, &quot;왜냐니&quot;)')
      + worksheetRow(2, 'HYPERLINK(&quot;https://www.sooplive.com/station/ddalgishoux&quot;, &quot;딸기슈몽이♡&quot;)')
      + "</sheetData>";
    expect(extractApplicants(xml)).toEqual([
      { soopId: "villlo", displayName: "왜냐니" },
      { soopId: "ddalgishoux", displayName: "딸기슈몽이♡" },
    ]);
  });

  it("ignores hyperlinks that are not sooplive station links", () => {
    const xml = "<sheetData>" + worksheetRow(1, 'HYPERLINK(&quot;https://example.com/other&quot;, &quot;누군가&quot;)') + "</sheetData>";
    expect(extractApplicants(xml)).toEqual([]);
  });

  it("ignores rows without a HYPERLINK formula", () => {
    const xml = '<sheetData><row r="1"><c r="A1" t="str"><v>plain text</v></c></row></sheetData>';
    expect(extractApplicants(xml)).toEqual([]);
  });

  it("de-duplicates by normalised soopId, keeping the last occurrence", () => {
    const xml = "<sheetData>"
      + worksheetRow(1, 'HYPERLINK(&quot;https://www.sooplive.com/station/Villlo&quot;, &quot;첫번째&quot;)')
      + worksheetRow(2, 'HYPERLINK(&quot;https://www.sooplive.com/station/villlo&quot;, &quot;두번째&quot;)')
      + "</sheetData>";
    expect(extractApplicants(xml)).toEqual([{ soopId: "villlo", displayName: "두번째" }]);
  });

  it("unescapes doubled quotes inside the display name", () => {
    const xml = "<sheetData>" + worksheetRow(1, 'HYPERLINK(&quot;https://www.sooplive.com/station/quoter&quot;, &quot;이름&quot;&quot;별명&quot;)') + "</sheetData>";
    expect(extractApplicants(xml)).toEqual([{ soopId: "quoter", displayName: '이름"별명' }]);
  });
});
