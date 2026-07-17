#!/usr/bin/env tsx
/**
 * 單獨產出裝幀單頁 PDF：封面、封底、書脊、作者折頁。
 *
 * 用法：npm run ebook:binding
 *
 * 輸出（各含英文檔名＋中文別名）：
 *   - zhuangzi-atlas-cover.pdf / 莊子全解-封面.pdf
 *   - zhuangzi-atlas-back.pdf / 莊子全解-封底.pdf
 *   - zhuangzi-atlas-spine.pdf / 莊子全解-書脊.pdf
 *   - zhuangzi-atlas-flap.pdf / 莊子全解-作者折頁.pdf
 */
import fs from "fs";
import path from "path";
import { SITE } from "../src/lib/catalog";
import {
  AUTHOR_FLAP,
  PRINT_COLORS as C,
  PRINT_YEAR,
} from "../src/lib/printFrontMatter";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const SPINE_IMAGE = "assets/spine-calligraphy.png";
const BOOK_SPINE = `${SITE.title}．人生玩家`;
const SITE_URL = "https://show0621.github.io/zhuangzi-atlas/";

type Part = {
  id: string;
  en: string;
  zh: string;
  html: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function assetDataUri(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

function shellHtml(title: string, body: string, extraCss = ""): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 210mm;
      min-height: 297mm;
      background: #${C.coverPaper};
      color: #${C.coverInk};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: "Noto Serif TC", "Source Han Serif TC", "Songti TC", serif;
    }
    ${extraCss}
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function coverHtml(): string {
  const titlePath = path.join(PUBLIC_DIR, "assets/print-cover-title-cursive.png");
  const authorPath = path.join(PUBLIC_DIR, "assets/cover-author-wenkai.png");
  if (!fs.existsSync(titlePath)) {
    throw new Error("找不到封面書名圖：assets/print-cover-title-cursive.png");
  }
  if (!fs.existsSync(authorPath)) {
    throw new Error("找不到署名圖：assets/cover-author-wenkai.png");
  }
  const titleSrc = assetDataUri(titlePath);
  const authorSrc = assetDataUri(authorPath);
  const css = `
    .page { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #${C.coverPaper}; }
    .geo-panel { position: absolute; top: 12%; right: 0; width: 34%; height: 62%; background: #${C.coverSage}; opacity: 0.88; }
    .geo-bar { position: absolute; left: 0; bottom: 18%; width: 58%; height: 11mm; background: #${C.coverStone}; }
    .geo-gold { position: absolute; top: 8%; right: 8%; width: 14mm; height: 14mm; background: #${C.coverGold}; }
    .titles { position: relative; z-index: 2; max-width: 62%; padding: 24mm 12mm 24mm 16mm; text-align: left; }
    .title { margin: 0; line-height: 1; }
    .title-img {
      display: block; width: 108%; max-width: 118mm; height: auto; margin: 0 0 0 -2mm;
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, #000 8%, #000 92%, transparent 100%);
    }
    .subtitle { margin: 1.1rem 0 0; font-size: 12pt; letter-spacing: 0.14em; color: #${C.coverMuted}; }
    .english { margin: 0.85rem 0 0; font-family: Georgia, serif; letter-spacing: 0.2em; text-transform: uppercase; font-size: 9pt; color: #${C.coverEnglish}; }
    .tagline { margin: 1.35rem 0 0; font-family: "Kaiti TC", "KaiTi", serif; font-size: 18pt; letter-spacing: 0.42em; color: #${C.coverStone}; }
    .author {
      position: absolute; left: 0; bottom: 18%; z-index: 3; box-sizing: border-box;
      width: 58%; height: 11mm; margin: 0; padding: 0 0 0 16mm;
      display: flex; align-items: center;
    }
    .author-img { display: block; height: 6.2mm; width: auto; max-width: 52mm; }
    .meta { position: absolute; left: 16mm; bottom: calc(18% - 9mm); z-index: 3; margin: 0; font-size: 10pt; letter-spacing: 0.08em; color: #${C.coverMeta}; }
    .hint { position: absolute; left: 18mm; bottom: 10mm; font-size: 9pt; color: #${C.coverMeta}; font-family: system-ui, sans-serif; }
  `;
  const body = `
  <div class="page">
    <div class="geo-panel"></div>
    <div class="geo-bar"></div>
    <div class="geo-gold"></div>
    <div class="titles">
      <p class="title"><img class="title-img" src="${titleSrc}" alt="${escapeHtml(SITE.title)}" /></p>
      <p class="subtitle">${escapeHtml(SITE.subtitle)}</p>
      <p class="english">${escapeHtml(SITE.englishTitle)}</p>
      <p class="tagline">人生玩家</p>
    </div>
    <p class="author"><img class="author-img" src="${authorSrc}" alt="${escapeHtml(SITE.author)}" /></p>
    <p class="meta">版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}</p>
    <p class="hint">封面｜單獨下載頁</p>
  </div>`;
  return shellHtml(`${SITE.title} — 封面`, body, css);
}

function backCoverHtml(): string {
  const css = `
    .page { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #${C.coverPaper}; padding: 28mm 22mm 24mm; }
    .geo-panel { position: absolute; top: 18%; left: 0; width: 28%; height: 55%; background: #${C.coverSage}; opacity: 0.78; }
    .geo-bar { position: absolute; right: 0; bottom: 22%; width: 52%; height: 5mm; background: #${C.coverStone}; }
    .geo-gold { position: absolute; top: 10%; left: 8%; width: 10mm; height: 10mm; background: #${C.coverGold}; }
    .inner { position: relative; z-index: 2; max-width: 120mm; margin-left: auto; }
    .label { margin: 0 0 1.2rem; font-size: 10pt; letter-spacing: 0.28em; color: #${C.coverMeta}; font-family: system-ui, sans-serif; }
    .title { margin: 0; font-family: "Kaiti TC", "KaiTi", serif; font-size: 28pt; letter-spacing: 0.28em; color: #${C.coverGold}; }
    .blurb { margin: 1.6rem 0 0; font-size: 11.5pt; line-height: 1.95; text-align: justify; color: #${C.coverInk}; }
    .quote { margin: 2rem 0 0; font-family: "Kaiti TC", "KaiTi", serif; font-size: 13pt; letter-spacing: 0.08em; line-height: 1.8; color: #${C.coverStone}; }
    .author { margin: 2.4rem 0 0; font-size: 12pt; letter-spacing: 0.18em; color: #${C.coverGold}; font-weight: 600; }
    .meta { margin: 0.5rem 0 0; font-size: 9.5pt; line-height: 1.7; color: #${C.coverMeta}; font-family: system-ui, sans-serif; }
    .isbn { margin: 2.2rem 0 0; font-size: 10pt; letter-spacing: 0.12em; color: #${C.coverStone}; font-family: Georgia, serif; }
    .hint { position: absolute; right: 22mm; bottom: 12mm; font-size: 9pt; color: #${C.coverMeta}; font-family: system-ui, sans-serif; }
  `;
  const body = `
  <div class="page">
    <div class="geo-panel"></div>
    <div class="geo-bar"></div>
    <div class="geo-gold"></div>
    <div class="inner">
      <p class="label">封底</p>
      <p class="title">${escapeHtml(SITE.title)}</p>
      <p class="blurb">
        原典・白話・哲學・人生智慧。本書依《莊子》篇章脈絡展開，清楚區分原典、歷代注家與現代詮釋，
        並連回無待、心齋、無用之用等核心概念，供通讀、劃線與交叉思考。
      </p>
      <p class="quote">人生如逆旅，我亦是行人。</p>
      <p class="author">${escapeHtml(SITE.author)}</p>
      <p class="meta">
        ${escapeHtml(SITE.englishTitle)}　｜　版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}<br />
        ${escapeHtml(SITE_URL)}
      </p>
      <p class="isbn">ISBN　—　—　—　—　—</p>
    </div>
    <p class="hint">封底｜單獨下載頁（ISBN 出版時再填）</p>
  </div>`;
  return shellHtml(`${SITE.title} — 封底`, body, css);
}

function flapHtml(): string {
  const paras = AUTHOR_FLAP.paragraphs
    .map((p) => `<p class="body">${escapeHtml(p)}</p>`)
    .join("\n");
  const css = `
    .page {
      width: 210mm;
      height: 297mm;
      background: #fff;
      position: relative;
      padding: 18mm 16mm;
    }
    .flap {
      box-sizing: border-box;
      width: 105mm;
      max-width: 48%;
      margin: 8mm 0 8mm auto;
      padding: 16mm 12mm 18mm 14mm;
      border-left: 1px solid #${C.flapBorder};
      background: #${C.flapBg};
      min-height: 240mm;
    }
    .label { margin: 0 0 1.6rem; font-size: 10pt; letter-spacing: 0.22em; color: #${C.flapLabel}; font-family: system-ui, sans-serif; }
    .name { margin: 0 0 0.35rem; font-size: 26pt; letter-spacing: 0.2em; color: #${C.flapName}; font-weight: 700; }
    .role { margin: 0 0 1.6rem; color: #${C.flapRole}; letter-spacing: 0.08em; font-size: 12pt; }
    .body { margin: 0 0 1.1rem; font-size: 12pt; line-height: 1.95; color: #${C.flapBody}; text-align: justify; }
    .body:last-child { margin-bottom: 0; }
    .hint { position: absolute; left: 16mm; bottom: 12mm; font-size: 9pt; color: #${C.coverMeta}; font-family: system-ui, sans-serif; }
  `;
  const body = `
  <div class="page">
    <section class="flap">
      <p class="label">書面折頁｜作者介紹</p>
      <p class="name">${escapeHtml(AUTHOR_FLAP.name)}</p>
      <p class="role">${escapeHtml(AUTHOR_FLAP.role)}・《${escapeHtml(SITE.title)}》</p>
      ${paras}
    </section>
    <p class="hint">作者折頁｜單獨下載頁</p>
  </div>`;
  return shellHtml(`${SITE.title} — 作者折頁`, body, css);
}

function spineHtml(imgDataUri: string): string {
  const css = `
    body { background: #fff; }
    .page {
      width: 210mm;
      min-height: 297mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14mm;
      padding: 18mm;
      background: #fff;
    }
    .spine-strip {
      width: 32mm;
      min-height: 230mm;
      padding: 8mm 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 1px solid #ddd;
    }
    .spine-strip img {
      display: block;
      width: 62%;
      height: auto;
      max-height: 210mm;
      object-fit: contain;
    }
    .hint {
      margin: 0;
      font-size: 11pt;
      color: #666;
      text-align: center;
      line-height: 1.6;
      font-family: system-ui, sans-serif;
    }
  `;
  const body = `
  <div class="page">
    <div class="spine-strip" aria-label="書脊橫條">
      <img src="${imgDataUri}" alt="${escapeHtml(BOOK_SPINE)}　李孟霖 編集" />
    </div>
    <p class="hint">書脊橫條｜裁切後可貼於膠裝書脊<br />${escapeHtml(BOOK_SPINE)}　｜　李孟霖 編集<br />（狂放草書圖）</p>
  </div>`;
  return shellHtml(`${SITE.title} — 書脊`, body, css);
}

async function htmlToPdf(html: string, outBase: string, zhAlias: string): Promise<void> {
  const browserPath = findBrowser();
  if (!browserPath) {
    throw new Error("找不到 Chrome／Edge，無法產出裝幀 PDF");
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const htmlPath = path.join(OUT_DIR, `${outBase}.html`);
  fs.writeFileSync(htmlPath, html, "utf8");
  fs.copyFileSync(htmlPath, path.join(PUBLIC_DIR, `${outBase}.html`));

  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, {
      waitUntil: "networkidle0",
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    const distPdf = path.join(OUT_DIR, `${outBase}.pdf`);
    const publicPdf = path.join(PUBLIC_DIR, `${outBase}.pdf`);
    const publicAlias = path.join(PUBLIC_DIR, zhAlias);
    fs.writeFileSync(distPdf, pdf);
    fs.copyFileSync(distPdf, publicPdf);
    fs.copyFileSync(distPdf, publicAlias);
    console.log("wrote", publicPdf);
    console.log("wrote", publicAlias);
  } finally {
    await browser.close();
  }
}

async function main() {
  const spinePath = path.join(PUBLIC_DIR, SPINE_IMAGE);
  if (!fs.existsSync(spinePath)) {
    throw new Error(`找不到書脊圖：${SPINE_IMAGE}`);
  }

  const parts: Part[] = [
    {
      id: "cover",
      en: "zhuangzi-atlas-cover",
      zh: "莊子全解-封面.pdf",
      html: coverHtml(),
    },
    {
      id: "back",
      en: "zhuangzi-atlas-back",
      zh: "莊子全解-封底.pdf",
      html: backCoverHtml(),
    },
    {
      id: "flap",
      en: "zhuangzi-atlas-flap",
      zh: "莊子全解-作者折頁.pdf",
      html: flapHtml(),
    },
    {
      id: "spine",
      en: "zhuangzi-atlas-spine",
      zh: "莊子全解-書脊.pdf",
      html: spineHtml(assetDataUri(spinePath)),
    },
  ];

  for (const p of parts) {
    await htmlToPdf(p.html, p.en, p.zh);
  }

  // 保留書脊 Word（既有流程）：若舊腳本產物存在則不覆蓋 docx；此腳本只保證四份 PDF
  console.log("\n裝幀單頁 PDF 已就緒：封面、封底、作者折頁、書脊。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
