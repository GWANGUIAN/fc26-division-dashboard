/**
 * Trigger CollaBot's own "Excel로 내보내기" export button for a comment
 * aggregation post and save the resulting workbook to disk. The page's
 * applicant grid has no accessible/stable DOM (no <table>, no data
 * attributes), so the export button is the only reliable way to pull
 * structured applicant data out of it.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const defaultUrl = "https://colla.bot/station/ecvhao/post/204050719";
const gridReadyTimeoutMs = 30_000;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function waitForGridReady(page, timeoutMs) {
  // The applicant grid is AG Grid (`.ag-row` cells, role="grid"). The
  // "선택한 스트리머..." picker button next to the export button stays
  // disabled regardless of load state (verified against the live site — it
  // is unrelated to data readiness), so the first rendered data row is the
  // only reliable "grid finished loading" signal.
  await page.locator(".ag-row").first().waitFor({ state: "visible", timeout: timeoutMs });
}

async function saveDebugArtifacts(page, debugPrefix) {
  if (!page || !debugPrefix) return;
  await mkdir(dirname(debugPrefix), { recursive: true }).catch(() => {});
  await page.screenshot({ path: debugPrefix + ".png", fullPage: true }).catch(() => {});
  const html = await page.content().catch(() => null);
  if (html) await writeFile(debugPrefix + ".html", html, "utf8").catch(() => {});
}

async function main() {
  const url = option("--url", defaultUrl);
  const outPath = resolve(option("--out", "collabot-export.xlsx"));
  const debugPrefix = option("--debug-prefix", null);
  await mkdir(dirname(outPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  let page;
  try {
    const context = await browser.newContext({ locale: "ko-KR", timezoneId: "Asia/Seoul" });
    page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    await waitForGridReady(page, gridReadyTimeoutMs);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15_000 }),
      page.getByRole("button", { name: "Excel로 내보내기" }).click(),
    ]);
    await download.saveAs(outPath);
    console.log("Excel 내보내기 완료: " + outPath);
  } catch (error) {
    await saveDebugArtifacts(page, debugPrefix);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
