#!/usr/bin/env tsx
/**
 * 單獨產出書脊橫條 PDF／Word，供影印店膠裝時下載列印。
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
import { SITE } from "../src/lib/catalog";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const SPINE_IMAGE = "assets/spine-calligraphy.png";
const BOOK_SPINE = `${SITE.title}．人生玩家`;

const PDF_NAME = "zhuangzi-atlas-spine.pdf";
const PDF_ALIAS = "莊子全解-書脊.pdf";
const DOCX_NAME = "zhuangzi-atlas-spine.docx";
const DOCX_ALIAS = "莊子全解-書脊.docx";

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
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function spineHtml(imgDataUri: string): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${SITE.title} — 書脊</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: system-ui, "Noto Sans TC", sans-serif;
    }
    .page {
      min-height: 261mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14mm;
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
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="spine-strip" aria-label="書脊橫條">
      <img src="${imgDataUri}" alt="${BOOK_SPINE}　李孟霖 編集" />
    </div>
    <p class="hint">書脊橫條｜裁切後可貼於膠裝書脊<br />${BOOK_SPINE}　｜　李孟霖 編集</p>
  </div>
</body>
</html>`;
}

async function writePdf(htmlPath: string): Promise<void> {
  const browserPath = findBrowser();
  if (!browserPath) {
    throw new Error("找不到 Chrome／Edge，無法產出書脊 PDF");
  }
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
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
    });
    const distPdf = path.join(OUT_DIR, PDF_NAME);
    const publicPdf = path.join(PUBLIC_DIR, PDF_NAME);
    const publicAlias = path.join(PUBLIC_DIR, PDF_ALIAS);
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(distPdf, pdf);
    fs.copyFileSync(distPdf, publicPdf);
    fs.copyFileSync(distPdf, publicAlias);
    console.log("wrote", publicPdf);
    console.log("wrote", publicAlias);
  } finally {
    await browser.close();
  }
}

async function writeDocx(spineImg: string): Promise<void> {
  const data = fs.readFileSync(spineImg);
  const doc = new Document({
    creator: SITE.author,
    title: `${SITE.title} — 書脊`,
    description: "書脊橫條，供膠裝裁切使用",
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1008, right: 1008, bottom: 1008, left: 1008 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "書脊橫條",
                size: 22,
                color: "666666",
                font: "Microsoft JhengHei",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: "png",
                data,
                // 略縮顯示，讓書法字看起來更小、兩側留白
                transformation: { width: 130, height: 580 },
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [
              new TextRun({
                text: `${BOOK_SPINE}　｜　李孟霖 編集`,
                size: 18,
                color: "666666",
                font: "Microsoft JhengHei",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: "裁切後可貼於膠裝書脊",
                size: 16,
                color: "999999",
                font: "Microsoft JhengHei",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const distDocx = path.join(OUT_DIR, DOCX_NAME);
  const publicDocx = path.join(PUBLIC_DIR, DOCX_NAME);
  const publicAlias = path.join(PUBLIC_DIR, DOCX_ALIAS);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(distDocx, buf);
  fs.copyFileSync(distDocx, publicDocx);
  fs.copyFileSync(distDocx, publicAlias);
  console.log("wrote", publicDocx);
  console.log("wrote", publicAlias);
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const spineImg = resolveSpineImage();
  const html = spineHtml(assetDataUri(spineImg));
  const htmlPath = path.join(OUT_DIR, "zhuangzi-atlas-spine.html");
  fs.writeFileSync(htmlPath, html, "utf8");
  fs.copyFileSync(htmlPath, path.join(PUBLIC_DIR, "zhuangzi-atlas-spine.html"));

  await writePdf(htmlPath);
  await writeDocx(spineImg);
  console.log("\n書脊下載檔已就緒。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
