#!/usr/bin/env tsx
/**
 * 從印刷 HTML 產出 Word（.docx），供下載編輯／列印。
 *
 * 用法：
 *   npm run ebook:docx
 *   （請先 npm run ebook:print）
 *
 * 輸出：
 *   - public/downloads/zhuangzi-atlas-print.docx
 *   - public/downloads/莊子全解-印刷版.docx（同內容別名）
 *   - dist/ebook/ 同步一份
 */
import fs from "fs";
import path from "path";
import { SITE } from "../src/lib/catalog";

const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const HTML_NAME = "zhuangzi-atlas-print.html";
const DOCX_NAME = "zhuangzi-atlas-print.docx";
const DOCX_ALIAS = "莊子全解-印刷版.docx";
const COVER_IMAGE = path.join(PUBLIC_DIR, "assets", "print-cover-minecraft.png");

// A4 in twips (1 inch = 1440 twip)
const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;

function resolveHtmlPath(): string {
  const candidates = [
    path.join(PUBLIC_DIR, HTML_NAME),
    path.join(OUT_DIR, HTML_NAME),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`找不到 ${HTML_NAME}。請先執行：npm run ebook:print`);
}

function extractArticleBody(html: string): string {
  const m = html.match(/<article class="sheet">([\s\S]*?)<\/article>/i);
  if (!m) throw new Error("印刷 HTML 找不到 <article class=\"sheet\">");
  return m[1];
}

function toWordHtml(body: string): string {
  let s = body;

  // 封面圖改為 data URI，Word 才能內嵌
  if (fs.existsSync(COVER_IMAGE)) {
    const b64 = fs.readFileSync(COVER_IMAGE).toString("base64");
    s = s.replace(
      /src="assets\/print-cover-minecraft\.png"/g,
      `src="data:image/png;base64,${b64}"`,
    );
  }

  // html-to-docx 的分頁標記
  s = s.replace(
    /<div class="pagebreak"><\/div>/g,
    '<div class="page-break" style="page-break-after: always;"><span>&nbsp;</span></div>',
  );

  // 封面橫條／標題：補 inline 樣式（Word 不吃完整 CSS）
  const spineBand = s.match(/<div class="cover-spine-band">([\s\S]*?)<\/div>/);
  if (spineBand) {
    const bandText = spineBand[1]
      .replace(/<\/?span[^>]*>/g, " · ")
      .replace(/\s+/g, " ")
      .replace(/·\s*·/g, "·")
      .trim();
    s = s.replace(
      spineBand[0],
      `<div style="background:#3a2412;color:#f0c36a;padding:10pt 12pt;margin-bottom:12pt;">
  <p style="margin:0;font-size:12pt;letter-spacing:2pt;"><strong>${bandText}</strong></p>
</div>`,
    );
  }

  s = s.replace(
    /<img class="cover-art"([^>]*)>/g,
    '<img$1 width="520" style="width:100%;max-width:520pt;height:auto;" />',
  );

  s = s.replace(
    /class="cover-title"/g,
    'style="font-size:28pt;text-align:center;letter-spacing:6pt;margin:8pt 0;"',
  );
  s = s.replace(
    /class="cover-tagline"/g,
    'style="font-size:16pt;text-align:center;color:#c45c26;letter-spacing:4pt;"',
  );
  s = s.replace(
    /class="cover-subtitle"|class="cover-english"|class="cover-meta"/g,
    'style="text-align:center;color:#555;font-size:11pt;"',
  );
  s = s.replace(
    /class="cover-author"/g,
    'style="text-align:center;font-size:14pt;color:#8a6a2a;font-weight:bold;margin-top:12pt;"',
  );

  // 書面折頁｜作者介紹
  s = s.replace(
    /class="author-flap-page"[^>]*>/g,
    'style="padding:36pt 28pt;border-left:1px solid #d8c9a8;background:#faf6ef;">',
  );
  s = s.replace(
    /class="author-flap-label"/g,
    'style="font-size:10pt;letter-spacing:3pt;color:#8a7350;margin-bottom:18pt;"',
  );
  s = s.replace(
    /class="author-flap-name"/g,
    'style="font-size:22pt;letter-spacing:4pt;margin:0 0 6pt;"',
  );
  s = s.replace(
    /class="author-flap-role"/g,
    'style="font-size:11pt;color:#7a6248;margin:0 0 18pt;"',
  );
  s = s.replace(
    /class="author-flap-body"/g,
    'style="font-size:12pt;line-height:1.9;text-align:justify;margin:0 0 12pt;"',
  );

  // 草寫題辭／後記：以楷體近似狂放書法（Word 端常見字型）
  s = s.replace(
    /class="calligraphy epigraph-text"/g,
    'style="font-family:KaiTi,DFKai-SB,標楷體,serif;font-size:22pt;text-align:center;line-height:1.6;"',
  );
  s = s.replace(
    /class="calligraphy afterword-calligraphy"/g,
    'style="font-family:KaiTi,DFKai-SB,標楷體,serif;font-size:20pt;text-align:center;margin-top:48pt;"',
  );
  s = s.replace(
    /class="epigraph-page"/g,
    'style="padding:48pt 24pt;text-align:center;"',
  );
  s = s.replace(
    /class="afterword-calligraphy-wrap"/g,
    'style="margin-top:36pt;text-align:center;"',
  );

  // 書脊
  s = s.replace(
    /class="spine-title"/g,
    'style="font-size:14pt;font-weight:bold;"',
  );
  s = s.replace(/class="spine-author"/g, 'style="font-size:12pt;"');
  s = s.replace(
    /class="spine-hint"/g,
    'style="color:#666;font-size:10pt;margin-top:12pt;"',
  );
  s = s.replace(
    /<div class="spine-strip"([^>]*)>/,
    '<div$1 style="border:1px solid #c9a24a;background:#2a180c;color:#f0c36a;padding:18pt;text-align:center;">',
  );

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${SITE.title}</title>
</head>
<body>
${s}
</body>
</html>`;
}

async function main() {
  const htmlPath = resolveHtmlPath();
  console.log("來源 HTML：", htmlPath);

  const raw = fs.readFileSync(htmlPath, "utf8");
  const wordHtml = toWordHtml(extractArticleBody(raw));

  // html-to-docx 為 CJS；動態 import 取其 default
  const mod = (await import("html-to-docx")) as unknown as {
    default?: typeof import("html-to-docx").default;
  };
  const HTMLtoDOCX = mod.default ?? (mod as unknown as typeof import("html-to-docx").default);

  const bufferOrBlob = await HTMLtoDOCX(wordHtml, null, {
    orientation: "portrait",
    pageSize: { width: A4_WIDTH, height: A4_HEIGHT },
    margins: {
      top: 1134, // ~20mm
      right: 907, // ~16mm
      bottom: 1134,
      left: 1474, // ~26mm 裝訂邊
    },
    title: SITE.title,
    subject: `${SITE.subtitle}｜${SITE.title} -人生玩家`,
    creator: SITE.author,
    lastModifiedBy: SITE.author,
    description: `${SITE.title}（${SITE.englishTitle}）印刷成冊稿 Word 版`,
    keywords: [SITE.title, "莊子", "人生玩家", SITE.author],
    font: "Microsoft JhengHei",
    fontSize: 22, // 11pt
    lang: "zh-TW",
    decodeUnicode: true,
  });

  const buffer = Buffer.isBuffer(bufferOrBlob)
    ? bufferOrBlob
    : Buffer.from(await (bufferOrBlob as Blob).arrayBuffer());

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const distPath = path.join(OUT_DIR, DOCX_NAME);
  const publicPath = path.join(PUBLIC_DIR, DOCX_NAME);
  const aliasPath = path.join(PUBLIC_DIR, DOCX_ALIAS);

  fs.writeFileSync(distPath, buffer);
  fs.writeFileSync(publicPath, buffer);
  fs.writeFileSync(aliasPath, buffer);

  const mb = (buffer.length / 1024 / 1024).toFixed(2);
  console.log(`wrote ${publicPath} (${mb} MB)`);
  console.log(`wrote ${aliasPath}`);
  console.log(`wrote ${distPath}`);
  console.log("\nWord 已就緒。");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
