#!/usr/bin/env tsx
/**
 * 單獨產出書脊條 PDF／Word（菊16開 A5 1:1）。
 *
 * 用法：npm run ebook:spine
 *
 * 輸出：
 *   - public/downloads/zhuangzi-atlas-spine.pdf
 *   - public/downloads/莊子全解-書脊.pdf
 *   - public/downloads/zhuangzi-atlas-spine.docx
 *   - public/downloads/莊子全解-書脊.docx
 */
import fs from "fs";
import path from "path";
import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { PDFDocument } from "pdf-lib";
import { SITE } from "../src/lib/catalog";
import {
  BOOK_TRIM_MM,
  FLAP_MM,
  DEFAULT_PAGE_COUNT,
  SPINE_DESIGN,
  SPINE_DESIGN_90G,
  SPINE_DESIGN_80G_DAOLIN,
  SPINE_DESIGN_100G_DAOLIN,
  SPINE_IMAGE,
  coverWrapWidthMm,
} from "../src/lib/printSpine";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const BOOK_SPINE = `${SITE.title}．人生玩家`;

const PDF_NAME = "zhuangzi-atlas-spine.pdf";
const PDF_ALIAS = "莊子全解-書脊.pdf";
const DOCX_NAME = "zhuangzi-atlas-spine.docx";
const DOCX_ALIAS = "莊子全解-書脊.docx";

const SPINE_W = SPINE_DESIGN.designMm; // 80g 輕質預設設計寬
const SPINE_H = BOOK_TRIM_MM.height;

function resolveSpineImage(): string {
  const p = path.join(PUBLIC_DIR, SPINE_IMAGE);
  if (!fs.existsSync(p)) {
    throw new Error(`找不到書脊圖：${SPINE_IMAGE}`);
  }
  return p;
}

function assetDataUri(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function findBrowser(): string | null {
  const env = process.env.CHROME_PATH || process.env.EDGE_PATH;
  if (env && fs.existsSync(env)) return env;
  const candidates = [
    path.join(process.env["ProgramFiles"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/local/bin/google-chrome",
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

/** 第 1 頁：實際書脊條 1:1（自訂頁面尺寸） */
function spineStripHtml(imgDataUri: string): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${SITE.title} — 書脊條 1:1</title>
  <style>
    @page { size: ${SPINE_W}mm ${SPINE_H}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${SPINE_W}mm;
      height: ${SPINE_H}mm;
      background: #fff;
    }
    .strip {
      width: ${SPINE_W}mm;
      height: ${SPINE_H}mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8mm 1.2mm 10mm;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .strip img {
      display: block;
      width: 86%;
      height: 100%;
      object-fit: contain;
      object-position: center 12%;
    }
  </style>
</head>
<body>
  <div class="strip" aria-label="書脊條 1:1">
    <img src="${imgDataUri}" alt="${BOOK_SPINE}　李孟霖 編集" />
  </div>
</body>
</html>`;
}

/** 第 2 頁：A4 說明＋同比例示意（方便核對） */
function spineSpecHtml(imgDataUri: string): string {
  const wrap80 = coverWrapWidthMm(SPINE_DESIGN.designMm);
  const wrap90 = coverWrapWidthMm(SPINE_DESIGN_90G.designMm);
  const wrap80Dao = coverWrapWidthMm(SPINE_DESIGN_80G_DAOLIN.designMm);
  const wrap100Dao = coverWrapWidthMm(SPINE_DESIGN_100G_DAOLIN.designMm);
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${SITE.title} — 書脊規格</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Noto Serif TC", "Source Han Serif TC", "Songti TC", serif;
      color: #1a1a1a;
      font-size: 10.5pt;
      line-height: 1.55;
    }
    h1 { font-size: 15pt; margin: 0 0 0.45em; }
    h2 { font-size: 11pt; margin: 0.65em 0 0.3em; }
    .row { display: flex; gap: 14mm; align-items: flex-start; }
    .preview-wrap {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4mm;
    }
    .preview-label { font-size: 9pt; color: #666; text-align: center; }
    .strip {
      width: ${SPINE_W}mm;
      height: ${SPINE_H}mm;
      border: 0.3mm solid #999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8mm 1.2mm 10mm;
      background: #fff;
      box-shadow: 0 0 0 0.2mm #ccc;
    }
    .strip img {
      display: block;
      width: 86%;
      height: 100%;
      object-fit: contain;
      object-position: center 12%;
    }
    table { border-collapse: collapse; width: 100%; margin: 0.35em 0; font-size: 9.8pt; }
    th, td { border: 1px solid #ccc; padding: 0.28em 0.5em; text-align: left; vertical-align: top; }
    th { background: #f3f3f3; width: 34%; }
    .note { margin-top: 0.7em; font-size: 9pt; color: #444; }
    code { font-family: ui-monospace, monospace; font-size: 0.95em; }
    strong.warn { color: #6b3a0f; }
  </style>
</head>
<body>
  <h1>書脊規格說明｜${SITE.title}（單本數位）</h1>
  <div class="row">
    <div class="preview-wrap">
      <div class="strip">
        <img src="${imgDataUri}" alt="${BOOK_SPINE}" />
      </div>
      <p class="preview-label">左圖＝第 1 頁書脊條實際大小<br />${SPINE_W} × ${SPINE_H} mm（1:1）</p>
    </div>
    <div>
      <table>
        <tr><th>成品尺寸</th><td>菊16開（A5）${BOOK_TRIM_MM.width} × ${BOOK_TRIM_MM.height} mm</td></tr>
        <tr><th>頁數</th><td>約 ${DEFAULT_PAGE_COUNT} 頁（約 ${SPINE_DESIGN.sheets} 張）；下單前以最新 PDF 頁腳為準</td></tr>
        <tr><th>裝訂路線</th><td><strong>平裝膠裝＋雙折口書衣</strong>；勒口各 ${FLAP_MM} mm（厚書建議 80–100 mm）</td></tr>
        <tr><th>本檔書脊條</th><td><strong>${SPINE_W} × ${SPINE_H} mm</strong>（依 ${DEFAULT_PAGE_COUNT} 頁／80g 米色輕質估 ${SPINE_DESIGN.spineMm.toFixed(1)} mm 後進位）</td></tr>
        <tr><th>與展開稿</th><td>本條對應展開稿中縫；上機請用<strong>封面展開 PDF 第 1 頁</strong>整幅輸出。</td></tr>
      </table>
      <h2>內文書脊／展開對照（請紙樣複核）</h2>
      <table>
        <tr><th>80g 米色輕質（本檔）</th><td>書脊 ${SPINE_DESIGN.designMm} mm；展開約 ${wrap80} mm</td></tr>
        <tr><th>90g 米色輕質</th><td>書脊約 ${SPINE_DESIGN_90G.designMm} mm；展開約 ${wrap90} mm（需另出檔）</td></tr>
        <tr><th>80g 米色道林（0.10）</th><td>書脊約 ${SPINE_DESIGN_80G_DAOLIN.designMm} mm；展開約 ${wrap80Dao} mm（需另出檔）</td></tr>
        <tr><th>100g 米色道林（0.13）</th><td>書脊約 ${SPINE_DESIGN_100G_DAOLIN.designMm} mm；展開約 ${wrap100Dao} mm（需另出檔）</td></tr>
      </table>
      <h2>書衣與霧沙金（單本數位）</h2>
      <table>
        <tr><th>外書衣紙</th><td>米色新浪潮（或同級微粗糙米色紙）。<strong class="warn">不要上亮膜／霧膜</strong>。</td></tr>
        <tr><th>內書皮</th><td>可另用 250g 象牙卡等厚卡膠裝保護內頁；外書衣再包覆並摺成勒口。</td></tr>
        <tr><th>書名霧沙金</th><td>首選數位燙消光金／霧金；備案為數位直印模擬沙金（勿開傳統鋅版燙金）。</td></tr>
      </table>
      <p class="note">
        估算式：書脊 ≈ (頁數÷2) × 單張厚度 + 膠水 1mm，再進位預留。<br />
        輕質／道林／新浪潮蓬鬆度因廠牌而異，<strong>下單前請印廠以紙樣複核書脊</strong>；若改紙重，請改書脊寬後重出展開稿與本檔。<br />
        PDF 第 1 頁為 1:1 書脊條；列印請選「實際大小／100%」，勿縮放。檔名：<code>${PDF_NAME}</code>／<code>${PDF_ALIAS}</code>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function htmlToPdfBuffer(
  html: string,
  opts: { width?: string; height?: string; format?: "A4" },
): Promise<Buffer> {
  const browserPath = findBrowser();
  if (!browserPath) throw new Error("找不到 Chrome／Edge，無法產出書脊 PDF");
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const htmlPath = path.join(OUT_DIR, `_spine-tmp-${Date.now()}.html`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(htmlPath, html, "utf8");
    await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
      waitUntil: "networkidle0",
    });
    const pdf = await page.pdf({
      ...(opts.format ? { format: opts.format } : { width: opts.width, height: opts.height }),
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });
    fs.unlinkSync(htmlPath);
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function writePdf(imgDataUri: string): Promise<void> {
  const stripBuf = await htmlToPdfBuffer(spineStripHtml(imgDataUri), {
    width: `${SPINE_W}mm`,
    height: `${SPINE_H}mm`,
  });
  const specBuf = await htmlToPdfBuffer(spineSpecHtml(imgDataUri), { format: "A4" });

  const out = await PDFDocument.create();
  const stripDoc = await PDFDocument.load(stripBuf);
  const specDoc = await PDFDocument.load(specBuf);
  const [p1] = await out.copyPages(stripDoc, [0]);
  const [p2] = await out.copyPages(specDoc, [0]);
  out.addPage(p1);
  out.addPage(p2);
  const bytes = await out.save();

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dist = path.join(OUT_DIR, PDF_NAME);
  const pub = path.join(PUBLIC_DIR, PDF_NAME);
  const alias = path.join(PUBLIC_DIR, PDF_ALIAS);
  fs.writeFileSync(dist, bytes);
  fs.copyFileSync(dist, pub);
  fs.copyFileSync(dist, alias);
  console.log("wrote", pub, `(page1 = ${SPINE_W}×${SPINE_H} mm 1:1)`);
  console.log("wrote", alias);
}

async function writeDocx(spineImg: string): Promise<void> {
  const data = fs.readFileSync(spineImg);
  // Word 內以近似比例顯示（px）；註明實際 mm
  const doc = new Document({
    title: `${SITE.title} — 書脊`,
    description: `書脊條 1:1 設計寬 ${SPINE_W}mm × 高 ${SPINE_H}mm（菊16開）`,
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `書脊條（設計 ${SPINE_W}×${SPINE_H} mm，菊16開／${DEFAULT_PAGE_COUNT}頁／80g輕質估）`,
                bold: true,
                size: 24,
                font: "Microsoft JhengHei",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                type: "png",
                data,
                transformation: { width: 68, height: 840 },
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${BOOK_SPINE}　｜　李孟霖 編集`,
                size: 18,
                color: "555555",
                font: "Microsoft JhengHei",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: `單本數位：書衣＋霧沙金見 PDF 說明頁。90g 約 ${SPINE_DESIGN_90G.designMm}mm、80g 道林約 ${SPINE_DESIGN_80G_DAOLIN.designMm}mm；請紙樣複核。上機用 PDF 第 1 頁。`,
                size: 16,
                color: "666666",
                font: "Microsoft JhengHei",
              }),
            ],
          }),
        ],
      },
    ],
  });
  const buf = await Packer.toBuffer(doc);
  const dist = path.join(OUT_DIR, DOCX_NAME);
  const pub = path.join(PUBLIC_DIR, DOCX_NAME);
  const alias = path.join(PUBLIC_DIR, DOCX_ALIAS);
  fs.writeFileSync(dist, buf);
  fs.copyFileSync(dist, pub);
  fs.copyFileSync(dist, alias);
  console.log("wrote", pub);
  console.log("wrote", alias);
}

async function main() {
  const spineImg = resolveSpineImage();
  const uri = assetDataUri(spineImg);
  const htmlPath = path.join(OUT_DIR, "zhuangzi-atlas-spine.html");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(htmlPath, spineSpecHtml(uri), "utf8");
  fs.copyFileSync(htmlPath, path.join(PUBLIC_DIR, "zhuangzi-atlas-spine.html"));

  await writePdf(uri);
  await writeDocx(spineImg);
  console.log("\n書脊下載檔已就緒（第 1 頁為 1:1 實寸書脊條）。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
