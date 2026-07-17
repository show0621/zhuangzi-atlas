#!/usr/bin/env tsx
/**
 * 單獨產出裝幀單頁 PDF：封面、封底、書脊、作者折頁。
 *
 * 用法：npm run ebook:binding
 *
 * 封面與展開稿共用 markup／燙金素材（不透明 JPEG，避免 PDF soft-mask 閃沒）。
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
  COVER_AUTHOR_IMAGE,
  COVER_TITLE_IMAGE,
  printCoverBodyHtml,
  printCoverCssFromTheme,
} from "../src/lib/printCoverHtml";
import {
  AFTERWORD_CALLIGRAPHY,
  AUTHOR_FLAP,
  PRINT_COLORS as C,
  PRINT_YEAR,
} from "../src/lib/printFrontMatter";
import { BOOK_TRIM_MM, SPINE_DESIGN } from "../src/lib/printSpine";
import {
  PRINT_SERIF_FONT_REL,
  ensurePrintSerifFontCopied,
  printSerifFontFaceCss,
} from "../src/lib/printFont";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const TRIM_W = BOOK_TRIM_MM.width;
const TRIM_H = BOOK_TRIM_MM.height;
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
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    ${printSerifFontFaceCss(PRINT_SERIF_FONT_REL)}
    @page { size: ${TRIM_W}mm ${TRIM_H}mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: ${TRIM_W}mm;
      min-height: ${TRIM_H}mm;
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

/** 備援：與全本共用同一套 cover markup／CSS（無「單獨下載頁」提示） */
function coverHtmlFallback(): string {
  const titlePath = path.join(PUBLIC_DIR, COVER_TITLE_IMAGE);
  const authorPath = path.join(PUBLIC_DIR, COVER_AUTHOR_IMAGE);
  if (!fs.existsSync(titlePath)) {
    throw new Error(`找不到封面書名圖：${COVER_TITLE_IMAGE}`);
  }
  if (!fs.existsSync(authorPath)) {
    throw new Error(`找不到署名圖：${COVER_AUTHOR_IMAGE}`);
  }
  const body = printCoverBodyHtml(assetDataUri(titlePath), assetDataUri(authorPath));
  const css = `
    @page { size: ${TRIM_W}mm ${TRIM_H}mm; margin: 0; }
    html, body { margin: 0; padding: 0; width: ${TRIM_W}mm; height: ${TRIM_H}mm; overflow: hidden; }
    ${printCoverCssFromTheme()}
  `;
  return shellHtml(`${SITE.title} — 封面`, body, css);
}

function backCoverHtml(): string {
  // 與封面展開封底對齊：金塊與書名錯開；正文落在米色區，不壓在sage上（避免金／灰字發髒）
  const css = `
    .page {
      position: relative;
      width: ${TRIM_W}mm; height: ${TRIM_H}mm;
      overflow: hidden;
      background: #${C.coverPaper};
    }
    .geo-panel {
      /* 左側色帶止於正文欄之前，且不延伸到署名區 */
      position: absolute; top: 22%; left: 0; width: 16%; height: 42%;
      background: #${C.coverSage}; opacity: 0.5;
    }
    .geo-bar {
      position: absolute; right: 0; bottom: 16%; width: 46%; height: 4.5mm;
      background: #${C.coverStone};
    }
    .geo-gold {
      position: absolute; top: 12mm; left: 8mm; width: 7mm; height: 7mm;
      background: #${C.coverGold};
    }
    .inner {
      position: relative; z-index: 2;
      box-sizing: border-box;
      height: 100%;
      /* 正文整欄讓過左側色帶與金塊 */
      padding: 16mm 14mm 18mm 34mm;
      background: transparent;
    }
    .label {
      margin: 0 0 1rem;
      font-size: 9.5pt; letter-spacing: 0.28em;
      color: #${C.coverMeta}; font-family: system-ui, sans-serif;
    }
    .title {
      margin: 0;
      font-family: "Kaiti TC", "KaiTi", serif;
      font-size: 24pt; letter-spacing: 0.24em;
      color: #${C.coverGold};
    }
    .blurb {
      margin: 1.35rem 0 0;
      font-size: 10.5pt; line-height: 1.95; text-align: justify;
      color: #${C.coverInk};
    }
    .quote {
      margin: 1.5rem 0 0;
      font-family: "Kaiti TC", "KaiTi", serif;
      font-size: 12pt; letter-spacing: 0.08em; line-height: 1.8;
      color: #${C.coverStone};
    }
    .footer-block {
      margin-top: 2rem;
      padding: 1rem 1.1rem 1.05rem;
      background: #${C.coverPaper};
      border: 1px solid rgba(47, 52, 48, 0.1);
      box-shadow: 0 0 0 3mm #${C.coverPaper}; /* 隔開左側色帶，印色不混 */
    }
    .author {
      margin: 0;
      font-size: 12pt; letter-spacing: 0.18em;
      color: #${C.coverInk}; font-weight: 600;
    }
    .meta {
      margin: 0.55rem 0 0;
      font-size: 9pt; line-height: 1.7;
      color: #${C.coverMuted}; font-family: system-ui, sans-serif;
    }
    .isbn {
      margin: 1.1rem 0 0;
      font-size: 10pt; letter-spacing: 0.12em;
      color: #${C.coverStone}; font-family: Georgia, serif;
    }
    .hint {
      position: absolute; right: 12mm; bottom: 8mm; z-index: 3;
      font-size: 8.5pt; color: #${C.coverMeta}; font-family: system-ui, sans-serif;
    }
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
      <p class="quote">${escapeHtml(AFTERWORD_CALLIGRAPHY)}</p>
      <div class="footer-block">
        <p class="author">${escapeHtml(SITE.author)}</p>
        <p class="meta">
          ${escapeHtml(SITE.englishTitle)}　｜　版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}<br />
          ${escapeHtml(SITE_URL)}
        </p>
        <p class="isbn">ISBN　—　—　—　—　—</p>
      </div>
    </div>
    <p class="hint">封底｜單獨下載頁（ISBN 出版時再填）</p>
  </div>`;
  return shellHtml(`${SITE.title} — 封底`, body, css);
}

function flapHtml(): string {
  const paras = AUTHOR_FLAP.paragraphs
    .map((p) => `<p class="body">${escapeHtml(p)}</p>`)
    .join("\n");
  const namePath = path.join(PUBLIC_DIR, "assets/flap-author-name.png");
  if (!fs.existsSync(namePath)) {
    throw new Error("找不到折頁署名圖：assets/flap-author-name.png");
  }
  const nameSrc = assetDataUri(namePath);
  const css = `
    .page {
      width: ${TRIM_W}mm;
      height: ${TRIM_H}mm;
      background: #fff;
      position: relative;
      padding: 12mm 10mm;
    }
    .flap {
      box-sizing: border-box;
      width: 90mm;
      max-width: 72%;
      margin: 4mm 0 4mm auto;
      padding: 12mm 10mm 14mm 12mm;
      border-left: 1px solid #${C.flapBorder};
      background: #${C.flapBg};
      min-height: 160mm;
    }
    .label { margin: 0 0 1.6rem; font-size: 10pt; letter-spacing: 0.22em; color: #${C.flapLabel}; font-family: system-ui, sans-serif; }
    .name { margin: 0 0 0.35rem; line-height: 0; }
    .name-img { display: block; height: 11mm; width: auto; max-width: 58mm; }
    .role { margin: 0 0 1.6rem; color: #${C.flapRole}; letter-spacing: 0.08em; font-size: 12pt; }
    .body { margin: 0 0 1.1rem; font-size: 12pt; line-height: 1.95; color: #${C.flapBody}; text-align: justify; }
    .body:last-child { margin-bottom: 0; }
    .hint { position: absolute; left: 16mm; bottom: 12mm; font-size: 9pt; color: #${C.coverMeta}; font-family: system-ui, sans-serif; }
  `;
  const body = `
  <div class="page">
    <section class="flap">
      <p class="label">書面折頁｜作者介紹</p>
      <p class="name"><img class="name-img" src="${nameSrc}" alt="${escapeHtml(AUTHOR_FLAP.name)}" /></p>
      <p class="role">${escapeHtml(AUTHOR_FLAP.role)}・《${escapeHtml(SITE.title)}》</p>
      ${paras}
    </section>
    <p class="hint">作者折頁｜單獨下載頁</p>
  </div>`;
  return shellHtml(`${SITE.title} — 作者折頁`, body, css);
}

/** 簡備援書脊（正式請跑 npm run ebook:spine，含 1:1 頁＋規格頁） */
function spineHtml(imgDataUri: string): string {
  const w = SPINE_DESIGN.designMm;
  const h = BOOK_TRIM_MM.height;
  const css = `
    @page { size: ${w}mm ${h}mm; margin: 0; }
    html, body { margin: 0; width: ${w}mm; height: ${h}mm; background: #fff; }
    .strip {
      width: ${w}mm; height: ${h}mm;
      display: flex; align-items: center; justify-content: center;
      padding: 8mm 1.2mm 10mm; background: #fff;
    }
    .strip img { display: block; width: 86%; height: 100%; object-fit: contain; object-position: center 12%; }
  `;
  const body = `
  <div class="strip">
    <img src="${imgDataUri}" alt="${escapeHtml(BOOK_SPINE)}　李孟霖 編集" />
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
      printBackground: true,
      preferCSSPageSize: true,
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
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  ensurePrintSerifFontCopied([OUT_DIR, PUBLIC_DIR]);

  const spinePath = path.join(PUBLIC_DIR, SPINE_IMAGE);
  if (!fs.existsSync(spinePath)) {
    throw new Error(`找不到書脊圖：${SPINE_IMAGE}`);
  }

  // 封面：與展開稿同一套 markup／燙金素材（不抽全本第 1 頁，避免舊 soft-mask 圖殘留）
  await htmlToPdf(coverHtmlFallback(), "zhuangzi-atlas-cover", "莊子全解-封面.pdf");

  const parts: Part[] = [
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

  // 另存共用封面 HTML，方便核對（非下載主檔）
  fs.writeFileSync(
    path.join(PUBLIC_DIR, "zhuangzi-atlas-cover.html"),
    coverHtmlFallback(),
    "utf8",
  );

  console.log("\n裝幀單頁 PDF 已就緒：封面、封底、作者折頁、書脊。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
