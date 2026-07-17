#!/usr/bin/env tsx
/**
 * 菊16開膠裝封面展開稿：後勒口＋封底＋書脊＋封面＋前勒口（1:1）。
 *
 * 用法：npm run ebook:wrap
 *
 * 輸出：
 *   - public/downloads/zhuangzi-atlas-cover-wrap.pdf
 *   - public/downloads/莊子全解-封面展開.pdf
 */
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { SITE } from "../src/lib/catalog";
import {
  AFTERWORD_CALLIGRAPHY,
  AUTHOR_FLAP,
  PRINT_COLORS as C,
  PRINT_YEAR,
} from "../src/lib/printFrontMatter";
import {
  COVER_AUTHOR_IMAGE,
  COVER_TITLE_IMAGE,
  FLAP_AUTHOR_NAME_IMAGE,
} from "../src/lib/printCoverHtml";
import {
  BOOK_TRIM_MM,
  DEFAULT_PAGE_COUNT,
  FLAP_MM,
  SPINE_DESIGN,
  SPINE_DESIGN_90G,
  SPINE_IMAGE,
  coverWrapWidthMm,
} from "../src/lib/printSpine";
import {
  PRINT_SERIF_FONT_REL,
  ensurePrintSerifFontCopied,
  printSerifFontFaceCss,
} from "../src/lib/printFont";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PDF_EN = "zhuangzi-atlas-cover-wrap.pdf";
const PDF_ZH = "莊子全解-封面展開.pdf";
const SITE_URL = "https://show0621.github.io/zhuangzi-atlas/";

const SPINE_W = SPINE_DESIGN.designMm;
const TRIM_W = BOOK_TRIM_MM.width;
const TRIM_H = BOOK_TRIM_MM.height;
const WRAP_W = coverWrapWidthMm(SPINE_W);
const BLEED = 3;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assetDataUri(rel: string): string {
  const abs = path.join(PUBLIC_DIR, rel);
  if (!fs.existsSync(abs)) throw new Error(`找不到素材：${rel}`);
  const buf = fs.readFileSync(abs);
  const ext = path.extname(abs).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function findBrowser(): string | null {
  const env = process.env.CHROME_PATH || process.env.EDGE_PATH;
  if (env && fs.existsSync(env)) return env;
  for (const p of [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * 印刷面由左至右：後勒口｜封底｜書脊｜封面｜前勒口
 * 頁面含 3mm 出血。
 */
function wrapHtml(titleSrc: string, authorSrc: string, spineSrc: string, flapNameSrc: string): string {
  const pageW = WRAP_W + BLEED * 2;
  const pageH = TRIM_H + BLEED * 2;
  const authorParas = AUTHOR_FLAP.paragraphs
    .map((p) => `<p class="flap-body">${escapeHtml(p)}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(SITE.title)} — 封面展開</title>
  <style>
    ${printSerifFontFaceCss(PRINT_SERIF_FONT_REL)}
    @page { size: ${pageW}mm ${pageH}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; padding: 0;
      width: ${pageW}mm; height: ${pageH}mm;
      background: #${C.coverPaper};
      color: #${C.coverInk};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: "Noto Serif TC", "Source Han Serif TC", "Songti TC", serif;
    }
    .sheet {
      position: relative;
      width: ${pageW}mm; height: ${pageH}mm;
      padding: ${BLEED}mm;
    }
    .wrap {
      width: ${WRAP_W}mm; height: ${TRIM_H}mm;
      display: flex;
      flex-direction: row;
      background: #${C.coverPaper};
      overflow: hidden;
    }
    .panel { position: relative; height: ${TRIM_H}mm; flex: 0 0 auto; overflow: hidden; }
    .flap-back { width: ${FLAP_MM}mm; background: #${C.flapBg}; }
    .back { width: ${TRIM_W}mm; }
    .spine { width: ${SPINE_W}mm; background: #fff; }
    .front { width: ${TRIM_W}mm; }
    .flap-front { width: ${FLAP_MM}mm; background: #${C.flapBg}; }

    /* 折線指示（僅上下出血區小刻度，不進入成品圖） */
    .tick {
      position: absolute; top: 0; width: 0; height: ${BLEED}mm;
      border-left: 0.2mm solid #888;
    }
    .tick-b { top: auto; bottom: 0; }
    .t1 { left: ${BLEED + FLAP_MM}mm; }
    .t2 { left: ${BLEED + FLAP_MM + TRIM_W}mm; }
    .t3 { left: ${BLEED + FLAP_MM + TRIM_W + SPINE_W}mm; }
    .t4 { left: ${BLEED + FLAP_MM + TRIM_W + SPINE_W + TRIM_W}mm; }

    /* —— 後勒口：內容簡介 —— */
    .flap-inner { padding: 12mm 8mm 12mm 9mm; height: 100%; }
    .flap-label {
      margin: 0 0 1.1rem;
      font-size: 8pt; letter-spacing: 0.28em; color: #${C.flapLabel};
      font-family: system-ui, sans-serif;
    }
    .flap-quote {
      margin: 0 0 1.2rem;
      font-family: "Kaiti TC", "KaiTi", serif;
      font-size: 11pt; letter-spacing: 0.06em; line-height: 1.75;
      color: #${C.coverStone};
    }
    .flap-body {
      margin: 0 0 0.85rem;
      font-size: 8.5pt; line-height: 1.85;
      color: #${C.flapBody}; text-align: justify;
    }
    .flap-meta {
      margin-top: 1.4rem;
      font-size: 7.5pt; line-height: 1.6; color: #${C.coverMeta};
      font-family: system-ui, sans-serif;
    }

    /* —— 封底 —— */
    .back-geo-panel {
      position: absolute; top: 22%; left: 0; width: 15%; height: 40%;
      background: #${C.coverSage}; opacity: 0.5;
    }
    .back-geo-bar {
      position: absolute; right: 0; bottom: 16%; width: 44%; height: 4mm;
      background: #${C.coverStone};
    }
    .back-geo-gold {
      position: absolute; top: 10mm; left: 6mm; width: 6.5mm; height: 6.5mm;
      background: #${C.coverGold};
    }
    .back-inner {
      position: relative; z-index: 2;
      box-sizing: border-box;
      padding: 13mm 9mm 11mm 26mm; height: 100%;
      background: transparent;
    }
    .back-title {
      margin: 0.15rem 0 0;
      font-family: "Kaiti TC", "KaiTi", serif;
      font-size: 16pt; letter-spacing: 0.2em; color: #${C.coverGold};
    }
    .back-blurb {
      margin: 1rem 0 0;
      font-size: 8.5pt; line-height: 1.9; text-align: justify;
      color: #${C.coverInk};
    }
    .back-quote {
      margin: 1.1rem 0 0;
      font-family: "Kaiti TC", "KaiTi", serif;
      font-size: 10pt; letter-spacing: 0.06em; line-height: 1.7;
      color: #${C.coverStone};
    }
    .back-footer {
      margin-top: 1.15rem;
      padding: 0.7rem 0.75rem 0.65rem;
      background: #${C.coverPaper};
      border: 1px solid rgba(47, 52, 48, 0.1);
      box-shadow: 0 0 0 2.5mm #${C.coverPaper};
    }
    .back-author {
      margin: 0;
      font-size: 9.5pt; letter-spacing: 0.14em; color: #${C.coverInk};
      font-weight: 600;
    }
    .back-meta {
      margin: 0.35rem 0 0;
      font-size: 7.2pt; line-height: 1.55; color: #${C.coverMuted};
      font-family: system-ui, sans-serif;
    }
    .back-isbn {
      margin: 0.75rem 0 0;
      font-size: 8pt; letter-spacing: 0.12em; color: #${C.coverStone};
      font-family: Georgia, serif;
    }

    /* —— 書脊 —— */
    .spine-inner {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      padding: 8mm 1.1mm 10mm;
      background: #fff;
    }
    .spine-inner img {
      display: block; width: 86%; height: 100%;
      object-fit: contain; object-position: center 12%;
    }

    /* —— 封面（A5 比例） —— */
    .front-geo-panel {
      position: absolute; top: 12%; right: 0; width: 34%; height: 62%;
      background: #${C.coverSage}; opacity: 0.88;
    }
    .front-geo-bar {
      position: absolute; left: 0; bottom: 18%; width: 58%; height: 9mm;
      background: #${C.coverStone};
    }
    .front-geo-gold {
      position: absolute; top: 8%; right: 8%; width: 10mm; height: 10mm;
      background: #${C.coverGold};
    }
    .front-titles {
      position: relative; z-index: 2;
      max-width: 68%;
      padding: 14mm 8mm 16mm 10mm;
    }
    .front-title { margin: 0; line-height: 1; }
    .front-title-img {
      display: block; width: 100%; max-width: 92mm; height: auto; margin: 0;
      /* 不用 CSS mask：Chromium 會打成 PDF soft-mask，部分預覽會整塊燙金消失 */
    }
    .front-subtitle {
      margin: 0.85rem 0 0; font-size: 8.5pt; letter-spacing: 0.12em; color: #${C.coverMuted};
    }
    .front-english {
      margin: 0.65rem 0 0; font-family: Georgia, serif;
      letter-spacing: 0.18em; text-transform: uppercase;
      font-size: 6.5pt; color: #${C.coverEnglish};
    }
    .front-tagline {
      margin: 1rem 0 0;
      font-family: "Kaiti TC", "KaiTi", serif;
      font-size: 12pt; letter-spacing: 0.36em; color: #${C.coverStone};
    }
    .front-author {
      position: absolute; left: 0; bottom: calc(18% + 1.8mm); z-index: 3;
      width: 58%; margin: 0; padding: 0 0 0 9mm; line-height: 0;
    }
    .front-author-img { display: block; height: 4.6mm; width: auto; max-width: 42mm; }
    .front-meta {
      position: absolute; left: 9mm; bottom: calc(18% - 7.5mm); z-index: 3;
      margin: 0; font-size: 6.8pt; letter-spacing: 0.08em; color: #${C.coverMeta};
    }

    /* —— 前勒口：作者 —— */
    .author-name { margin: 0 0 0.35rem; line-height: 0; }
    .author-name-img { display: block; height: 9mm; width: auto; max-width: 48mm; }
    .author-role {
      margin: 0 0 1.1rem;
      font-size: 8.5pt; letter-spacing: 0.12em; color: #${C.flapRole};
    }
  </style>
</head>
<body>
  <div class="sheet">
    <span class="tick t1"></span><span class="tick tick-b t1"></span>
    <span class="tick t2"></span><span class="tick tick-b t2"></span>
    <span class="tick t3"></span><span class="tick tick-b t3"></span>
    <span class="tick t4"></span><span class="tick tick-b t4"></span>

    <div class="wrap" aria-label="封面展開 1:1">
      <!-- 後勒口 -->
      <section class="panel flap-back">
        <div class="flap-inner">
          <p class="flap-label">後勒口｜內容簡介</p>
          <p class="flap-quote">${escapeHtml(AFTERWORD_CALLIGRAPHY)}</p>
          <p class="flap-body">
            原典・白話・哲學・人生智慧。本書依《莊子》篇章脈絡展開，清楚區分原典、歷代注家與現代詮釋，
            並連回無待、心齋、無用之用等核心概念，供通讀、劃線與交叉思考。
          </p>
          <p class="flap-meta">
            ${escapeHtml(SITE.englishTitle)}<br />
            菊16開　｜　${DEFAULT_PAGE_COUNT} 頁　｜　版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}
          </p>
        </div>
      </section>

      <!-- 封底 -->
      <section class="panel back">
        <div class="back-geo-panel"></div>
        <div class="back-geo-bar"></div>
        <div class="back-geo-gold"></div>
        <div class="back-inner">
          <p class="flap-label">封底</p>
          <p class="back-title">${escapeHtml(SITE.title)}</p>
          <p class="back-blurb">
            原典・白話・哲學・人生智慧。本書依《莊子》篇章脈絡展開，清楚區分原典、歷代注家與現代詮釋，
            並連回無待、心齋、無用之用等核心概念。
          </p>
          <p class="back-quote">${escapeHtml(AFTERWORD_CALLIGRAPHY)}</p>
          <div class="back-footer">
            <p class="back-author">${escapeHtml(SITE.author)}</p>
            <p class="back-meta">
              ${escapeHtml(SITE.englishTitle)}　｜　版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}<br />
              ${escapeHtml(SITE_URL)}
            </p>
            <p class="back-isbn">ISBN　—　—　—　—　—</p>
          </div>
        </div>
      </section>

      <!-- 書脊 -->
      <section class="panel spine">
        <div class="spine-inner">
          <img src="${spineSrc}" alt="${escapeHtml(SITE.title)}．人生玩家　李孟霖 編集" />
        </div>
      </section>

      <!-- 封面 -->
      <section class="panel front">
        <div class="front-geo-panel"></div>
        <div class="front-geo-bar"></div>
        <div class="front-geo-gold"></div>
        <div class="front-titles">
          <p class="front-title">
            <img class="front-title-img" src="${titleSrc}" alt="${escapeHtml(SITE.title)}" />
          </p>
          <p class="front-subtitle">${escapeHtml(SITE.subtitle)}</p>
          <p class="front-english">${escapeHtml(SITE.englishTitle)}</p>
          <p class="front-tagline">人生玩家</p>
        </div>
        <p class="front-author">
          <img class="front-author-img" src="${authorSrc}" alt="${escapeHtml(SITE.author)}" />
        </p>
        <p class="front-meta">版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}</p>
      </section>

      <!-- 前勒口 -->
      <section class="panel flap-front">
        <div class="flap-inner">
          <p class="flap-label">前勒口｜作者介紹</p>
          <p class="author-name">
            <img class="author-name-img" src="${flapNameSrc}" alt="${escapeHtml(AUTHOR_FLAP.name)}" />
          </p>
          <p class="author-role">${escapeHtml(AUTHOR_FLAP.role)}・《${escapeHtml(SITE.title)}》</p>
          ${authorParas}
        </div>
      </section>
    </div>
  </div>
</body>
</html>`;
}

function specHtml(): string {
  const wrap90 = coverWrapWidthMm(SPINE_DESIGN_90G.designMm);
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(SITE.title)} — 封面展開規格</title>
  <style>
    @page { size: A4 landscape; margin: 14mm; }
    body { font-family: "Noto Serif TC", "Songti TC", serif; font-size: 11pt; line-height: 1.65; color: #1a1a1a; }
    h1 { font-size: 16pt; margin: 0 0 0.6em; }
    table { border-collapse: collapse; width: 100%; margin: 0.6em 0; font-size: 10.5pt; }
    th, td { border: 1px solid #ccc; padding: 0.35em 0.55em; text-align: left; vertical-align: top; }
    th { background: #f3f3f3; width: 28%; }
    .note { font-size: 9.5pt; color: #444; margin-top: 0.8em; }
    code { font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>封面展開規格｜${escapeHtml(SITE.title)}</h1>
  <table>
    <tr><th>展開順序（印刷面左→右）</th><td>後勒口 → 封底 → 書脊 → 封面 → 前勒口</td></tr>
    <tr><th>成品</th><td>菊16開（A5）${TRIM_W} × ${TRIM_H} mm</td></tr>
    <tr><th>勒口</th><td>各 ${FLAP_MM} mm</td></tr>
    <tr><th>書脊（本檔）</th><td>${SPINE_W} mm（241 頁／80g 米色輕質估算 ${SPINE_DESIGN.spineMm.toFixed(1)} mm 後進位）</td></tr>
    <tr><th>90g 對照</th><td>書脊約 ${SPINE_DESIGN_90G.designMm} mm；展開寬約 ${wrap90} mm（需另出檔）</td></tr>
    <tr><th>本檔裁切尺寸</th><td>${WRAP_W} × ${TRIM_H} mm</td></tr>
    <tr><th>含出血頁面</th><td>${WRAP_W + BLEED * 2} × ${TRIM_H + BLEED * 2} mm（四周各 ${BLEED} mm）</td></tr>
    <tr><th>書皮</th><td>250g／300g 銅西卡，單面彩色</td></tr>
    <tr><th>裝訂</th><td>無線膠裝；內文米色輕質紙 80g／90g，順絲向</td></tr>
  </table>
  <p class="note">
    第 1 頁為 1:1 展開稿（含出血與折線刻度）。列印／輸出請選實際大小 100%，勿縮放。<br />
    輕質紙蓬鬆度因廠牌而異，<strong>下單前請印廠以紙樣複核書脊</strong>；若改 90g，請改書脊寬重出本檔。<br />
    檔名：<code>${PDF_EN}</code>／<code>${PDF_ZH}</code>
  </p>
</body>
</html>`;
}

async function htmlToPdf(
  html: string,
  opts: { width?: string; height?: string; format?: "A4"; landscape?: boolean },
): Promise<Buffer> {
  const browserPath = findBrowser();
  if (!browserPath) throw new Error("找不到 Chrome／Edge");
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = path.join(OUT_DIR, `_wrap-tmp-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, "utf8");
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file:///${tmp.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      ...(opts.format
        ? { format: opts.format, landscape: opts.landscape ?? false }
        : { width: opts.width, height: opts.height }),
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  ensurePrintSerifFontCopied([OUT_DIR, PUBLIC_DIR]);

  const titleSrc = assetDataUri(COVER_TITLE_IMAGE);
  const authorSrc = assetDataUri(COVER_AUTHOR_IMAGE);
  const spineSrc = assetDataUri(SPINE_IMAGE);
  const flapNameSrc = assetDataUri(FLAP_AUTHOR_NAME_IMAGE);

  const wrapPage = wrapHtml(titleSrc, authorSrc, spineSrc, flapNameSrc);
  const htmlPath = path.join(OUT_DIR, "zhuangzi-atlas-cover-wrap.html");
  fs.writeFileSync(htmlPath, wrapPage, "utf8");
  fs.copyFileSync(htmlPath, path.join(PUBLIC_DIR, "zhuangzi-atlas-cover-wrap.html"));

  const pageW = WRAP_W + BLEED * 2;
  const pageH = TRIM_H + BLEED * 2;
  const wrapBuf = await htmlToPdf(wrapPage, {
    width: `${pageW}mm`,
    height: `${pageH}mm`,
  });
  const specBuf = await htmlToPdf(specHtml(), { format: "A4", landscape: true });

  const out = await PDFDocument.create();
  const wDoc = await PDFDocument.load(wrapBuf);
  const sDoc = await PDFDocument.load(specBuf);
  const [p1] = await out.copyPages(wDoc, [0]);
  const [p2] = await out.copyPages(sDoc, [0]);
  out.addPage(p1);
  out.addPage(p2);
  const bytes = await out.save();

  const dist = path.join(OUT_DIR, PDF_EN);
  const pub = path.join(PUBLIC_DIR, PDF_EN);
  const alias = path.join(PUBLIC_DIR, PDF_ZH);
  fs.writeFileSync(dist, bytes);
  fs.copyFileSync(dist, pub);
  fs.copyFileSync(dist, alias);

  console.log(
    `wrote ${pub} (page1 = ${pageW.toFixed(0)}×${pageH} mm，含出血；裁切 ${WRAP_W}×${TRIM_H} mm)`,
  );
  console.log("wrote", alias);
  console.log("\n封面展開稿已就緒。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
