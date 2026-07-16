#!/usr/bin/env tsx
/**
 * 產生印刷成冊用檔案（影印店／自行列印 PDF）：
 *   - dist/ebook/zhuangzi-atlas-print.md
 *   - dist/ebook/zhuangzi-atlas-print.html
 * 並複製到 public/downloads/ 供靜態站下載。
 *
 * PDF 請另執行：npm run ebook:pdf（puppeteer／Chrome headless）
 *
 * 用法：
 *   npm run ebook:print
 *   npm run ebook:print:all   # print + pdf
 */
import fs from "fs";
import path from "path";
import { CHAPTERS, SITE, PART_ORDER, type ChapterPart } from "../src/lib/catalog";
import { getChapterPath, readChapter } from "../src/lib/content";

const YEAR = 2026;
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const MD_NAME = "zhuangzi-atlas-print.md";
const HTML_NAME = "zhuangzi-atlas-print.html";
const PDF_NAME = "zhuangzi-atlas-print.pdf";
const README_NAME = "README-列印說明.md";

const PAGE_BREAK_MD = "\n\n<div class=\"pagebreak\"></div>\n\n";
const PAGE_BREAK_HTML = '<div class="pagebreak"></div>\n';

function coverMarkdown(): string {
  return `# ${SITE.title}

**${SITE.subtitle}**

${SITE.englishTitle}

${SITE.author}

版本 ${SITE.version}（draft）・${YEAR}

---

印刷成冊稿｜供影印裝訂使用
`;
}

function publicationInfoMarkdown(): string {
  return `# 出版資訊

## 書名與版本

- **中文書名**：${SITE.title}
- **英文書名**：${SITE.englishTitle}
- **副標題**：${SITE.subtitle}
- **編著者**：${SITE.author}
- **版本**：${SITE.version}（draft，尚未達出版級 review／published）
- **年份**：${YEAR}

## 編輯說明

本書依《莊子》內篇、外篇、雜篇順序編排，並於正文前附緒論（改編自專案〈導論〉）。各篇採固定結構：原典、白話、字詞、段落解析、歷代注家、哲學分析、比較閱讀、現代應用等，方便影印後依篇翻查。

內容分三層聲音，閱讀時請分開看待：

1. **原典**：標明篇名與版本依據之《莊子》引文。
2. **歷代注解**：郭象、成玄英等注家說法（標注家名）。
3. **本書現代詮釋**：哲學分析與人生應用（明標為詮釋，不可視為原文）。

## 引用版本

正文引文以郭慶藩《莊子集釋》所收通行本系統為準；異文與篇章真偽僅在影響解讀時提示。

## 免責聲明

- 本書之現代詮釋與人生應用，僅供閱讀與思考參考，**不構成法律、醫療、宗教或人生決策之指導**。
- 目前為 draft 成冊稿，文字仍可能修訂；若用於正式出版或課堂指定讀本，請以日後 review／published 版本為準。
- 請尊重原典與注家文獻；轉載本書現代詮釋文字時，請註明出處「${SITE.title}」。
`;
}

function prefaceMarkdown(): string {
  return `# 前文

這本《${SITE.title}》想做的事很單純：讓讀者在一本可翻、可影印、可裝訂的書裡，依原典順序讀完三十三篇，而不是只撿幾句「人生金句」。

《莊子》難讀，往往不是因為文字古奧，而是因為它用寓言、重言、卮言說話，又被後世注家與現代勵志語層層覆蓋。因此本書堅持三層分讀：

- 先看**原典**寫了什麼；
- 再看**注家**怎麼解；
- 最後才讀本書的**現代詮釋**——後者是編者的哲學整理與人生應用，不是「莊子親口說」。

若你是第一次讀莊子，建議先讀緒論與內篇七篇，再依興趣進入外篇、雜篇。若你要拿去影印店成冊，建議用本專案產出的 HTML「另存為 PDF」（A4），或直接列印 Markdown／PDF；裝訂時左側留較寬裝訂邊即可。

願這冊書能陪你把《莊子》從螢幕帶回紙上，慢慢讀。

—— ${SITE.author}，${YEAR}
`;
}

function tocMarkdown(): string {
  const lines: string[] = ["# 目錄", ""];
  lines.push("- [封面](#莊子全解)");
  lines.push("- [出版資訊](#出版資訊)");
  lines.push("- [前文](#前文)");
  lines.push("- [緒論](#緒論如何閱讀莊子)");

  const parts = PART_ORDER.filter((p) => p !== "附錄" && p !== "導論") as ChapterPart[];
  for (const part of parts) {
    lines.push("");
    lines.push(`## ${part}`);
    lines.push("");
    for (const ch of CHAPTERS.filter((c) => c.part === part)) {
      const anchor = slugifyHeading(ch.title);
      lines.push(`- ${ch.id}　[〈${ch.title}〉](#${anchor})`);
    }
  }

  lines.push("");
  lines.push("- [後記](#後記)");
  lines.push("- [版權頁](#版權頁)");
  lines.push("");
  return lines.join("\n");
}

/** Rough GitHub-/pandoc-like heading slug for TOC links in Markdown viewers. */
function slugifyHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[：:].*$/, "")
    .replace(/[〈〉《》「」『』]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]/g, "");
}

function afterwordMarkdown(): string {
  return `# 後記

這份印刷稿由「${SITE.title}」網站內容自動匯出，方便讀者帶到影印店列印、裝訂成冊。內容狀態隨專案推進會更新；目前版本為 **${SITE.version}（draft）**。

若你在線上閱讀，歡迎回到網站使用「山上讀書」沉浸模式、思想地圖與名詞／人物百科。成冊與數位版互補：紙本利於通讀與劃線，網站利於交叉引用與檢索。

感謝每一位願意把莊子帶回紙上的讀者。
`;
}

function copyrightMarkdown(): string {
  return `# 版權頁

**${SITE.title}**（${SITE.englishTitle}）  
${SITE.subtitle}

編著：${SITE.author}  
版本：${SITE.version}（draft）  
年份：${YEAR}

原典引文依據通行本系統（郭慶藩《莊子集釋》為主）。  
歷代注解屬各注家文獻；現代詮釋屬本專案編寫。

本成冊稿僅供個人學習、教學參考與非商業影印裝訂。  
商業出版或大規模重製前，請另行確認權利與最新版本。

© ${YEAR} ${SITE.author}
`;
}

function buildPrintMarkdown(): { md: string; chapterCount: number; missing: string[] } {
  const missing: string[] = [];
  const parts: string[] = [];

  parts.push(`---
title: "${SITE.title}"
subtitle: "${SITE.subtitle}"
author: "${SITE.author}"
lang: zh-Hant
---
`);

  parts.push(coverMarkdown());
  parts.push(PAGE_BREAK_MD);
  parts.push(publicationInfoMarkdown());
  parts.push(PAGE_BREAK_MD);
  parts.push(prefaceMarkdown());
  parts.push(PAGE_BREAK_MD);

  // 緒論 = 導論正文（改標題，避免與後文章節重複）
  const introMeta = CHAPTERS.find((c) => c.part === "導論");
  if (introMeta) {
    const intro = readChapter(introMeta);
    if (intro) {
      let body = intro.content.trim();
      body = body.replace(/^#\s+.+$/m, "# 緒論：如何閱讀《莊子》");
      parts.push(body);
      parts.push("\n");
    } else {
      missing.push(getChapterPath(introMeta));
    }
  }

  parts.push(PAGE_BREAK_MD);
  parts.push(tocMarkdown());

  let chapterCount = 0;
  for (const meta of CHAPTERS) {
    if (meta.part === "導論") continue;
    const doc = readChapter(meta);
    if (!doc) {
      missing.push(getChapterPath(meta));
      continue;
    }
    parts.push(PAGE_BREAK_MD);
    parts.push(`<!-- part: ${meta.part} id: ${meta.id} -->\n\n`);
    parts.push(doc.content.trim());
    parts.push("\n");
    chapterCount += 1;
  }

  parts.push(PAGE_BREAK_MD);
  parts.push(afterwordMarkdown());
  parts.push(PAGE_BREAK_MD);
  parts.push(copyrightMarkdown());

  return { md: parts.join(""), chapterCount, missing };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal Markdown → HTML for print (headings, lists, quotes, code, emphasis). */
function mdToHtml(md: string): string {
  // Strip YAML front matter
  let src = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");

  // Protect fenced code blocks
  const fences: string[] = [];
  src = src.replace(/```[\w]*\r?\n([\s\S]*?)```/g, (_m, code: string) => {
    const i = fences.length;
    fences.push(`<pre class="code"><code>${escapeHtml(code.replace(/\n$/, ""))}</code></pre>`);
    return `\n%%FENCE${i}%%\n`;
  });

  // Page breaks
  src = src.replace(/<div class="pagebreak"><\/div>/g, "\n%%PAGEBREAK%%\n");
  src = src.replace(/\\newpage/g, "\n%%PAGEBREAK%%\n");

  // HTML comments
  src = src.replace(/<!--[\s\S]*?-->/g, "");

  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBq = false;
  let para: string[] = [];

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join("\n").trim();
    if (text) out.push(`<p>${inlineFormat(text)}</p>`);
    para = [];
  };

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  const closeBq = () => {
    if (inBq) {
      out.push("</blockquote>");
      inBq = false;
    }
  };

  for (const raw of lines) {
    const line = raw;

    if (line.trim() === "%%PAGEBREAK%%") {
      flushPara();
      closeLists();
      closeBq();
      out.push(PAGE_BREAK_HTML);
      continue;
    }

    const fenceMatch = line.trim().match(/^%%FENCE(\d+)%%$/);
    if (fenceMatch) {
      flushPara();
      closeLists();
      closeBq();
      out.push(fences[Number(fenceMatch[1])]);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushPara();
      closeLists();
      closeBq();
      out.push("<hr />");
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushPara();
      closeLists();
      closeBq();
      const level = h[1].length;
      const text = h[2].replace(/\s+#*$/, "");
      const id = slugifyHeading(text.replace(/[*_`]/g, ""));
      out.push(`<h${level} id="${id}">${inlineFormat(text)}</h${level}>`);
      continue;
    }

    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    if (ul) {
      flushPara();
      closeBq();
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ol) {
      flushPara();
      closeBq();
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }

    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      flushPara();
      closeLists();
      if (!inBq) {
        out.push("<blockquote>");
        inBq = true;
      }
      if (bq[1].trim()) out.push(`<p>${inlineFormat(bq[1])}</p>`);
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      closeLists();
      closeBq();
      continue;
    }

    closeLists();
    closeBq();
    para.push(line);
  }

  flushPara();
  closeLists();
  closeBq();

  return out.join("\n");
}

function inlineFormat(text: string): string {
  let s = escapeHtml(text);
  // links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // bold ** ** or __ __
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // italic * * (simple)
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  // inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // soft line breaks inside paragraph: keep as space / <br> for single newlines already joined
  s = s.replace(/\n/g, "<br />\n");
  return s;
}

function buildPrintHtml(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(SITE.title)} — 印刷成冊稿</title>
  <style>
    :root {
      --ink: #1a1a1a;
      --muted: #555;
      --rule: #ccc;
      --paper: #fff;
      --bind: 28mm;
      --outer: 16mm;
      --vert: 18mm;
    }
    * { box-sizing: border-box; }
    html { font-size: 11pt; }
    body {
      margin: 0;
      color: var(--ink);
      background: #e8e8e8;
      font-family: "Noto Serif TC", "Source Han Serif TC", "Source Han Serif",
        "Songti TC", "宋体", "SimSun", "Georgia", serif;
      line-height: 1.75;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem 1.25rem;
      background: #1f2e28;
      color: #f5f7f6;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    }
    .toolbar strong { font-weight: 600; }
    .toolbar button, .toolbar a.btn {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.35);
      background: #3d5c4f;
      color: #fff;
      border-radius: 999px;
      padding: 0.4rem 1rem;
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;
    }
    .toolbar button:hover, .toolbar a.btn:hover { opacity: 0.92; }
    .toolbar .hint { color: rgba(245,247,246,0.75); font-size: 12px; }
    .sheet {
      max-width: 210mm;
      margin: 1.5rem auto 3rem;
      padding: var(--vert) var(--outer) var(--vert) var(--bind);
      background: var(--paper);
      box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.35;
      margin: 1.6em 0 0.6em;
      page-break-after: avoid;
    }
    h1 { font-size: 1.85rem; margin-top: 0; }
    h2 { font-size: 1.35rem; border-bottom: 1px solid var(--rule); padding-bottom: 0.25em; }
    h3 { font-size: 1.15rem; }
    p { margin: 0.65em 0; orphans: 3; widows: 3; }
    blockquote {
      margin: 0.9em 0;
      padding: 0.35em 0 0.35em 1em;
      border-left: 3px solid #3d5c4f;
      color: #222;
      background: #f7faf8;
    }
    blockquote p { margin: 0.35em 0; }
    ul, ol { margin: 0.6em 0; padding-left: 1.4em; }
    li { margin: 0.25em 0; }
    hr {
      border: none;
      border-top: 1px solid var(--rule);
      margin: 2em 0;
    }
    a { color: #2a4a3c; text-decoration: underline; text-underline-offset: 2px; }
    code {
      font-family: ui-monospace, "Noto Sans Mono CJK TC", Consolas, monospace;
      font-size: 0.92em;
      background: #f3f3f3;
      padding: 0.05em 0.3em;
      border-radius: 3px;
    }
    pre.code {
      background: #f5f5f5;
      border: 1px solid var(--rule);
      padding: 0.75em 1em;
      overflow-x: auto;
      font-size: 0.88rem;
      line-height: 1.45;
      page-break-inside: avoid;
    }
    pre.code code { background: none; padding: 0; }
    .pagebreak {
      display: block;
      height: 0;
      margin: 2.5rem 0;
      border: none;
      border-top: 1px dashed #bbb;
    }
    .pagebreak::after {
      content: "頁分隔";
      display: block;
      text-align: center;
      font-size: 11px;
      color: #999;
      font-family: system-ui, sans-serif;
      transform: translateY(-0.7em);
      background: var(--paper);
      width: 4em;
      margin: 0 auto;
    }

    @page {
      size: A4;
      /* 左側稍寬：單面影印後左側裝訂成冊 */
      margin: 18mm 16mm 20mm 26mm;
    }

    @media print {
      body { background: white; }
      .toolbar { display: none !important; }
      .sheet {
        max-width: none;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
      .pagebreak {
        break-before: page;
        page-break-before: always;
        height: 0;
        margin: 0;
        border: none;
      }
      .pagebreak::after { display: none; }
      a { color: inherit; text-decoration: none; }
      h1 { break-before: page; page-break-before: always; }
      .sheet > h1:first-child { break-before: avoid; page-break-before: avoid; }
      blockquote, pre.code, li { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <strong>${escapeHtml(SITE.title)}｜印刷成冊</strong>
    <button type="button" onclick="window.print()">列印／另存 PDF</button>
    <a class="btn" href="./${MD_NAME}">下載 Markdown</a>
    <span class="hint">建議：瀏覽器 → 列印 → 另存為 PDF → A4 → 邊界「預設」即可（頁面已含裝訂邊）</span>
  </div>
  <article class="sheet">
${bodyHtml}
  </article>
</body>
</html>
`;
}

function printReadme(): string {
  return `# ${SITE.title} — 印刷成冊說明

## 檔案

| 檔案 | 用途 |
|------|------|
| \`${PDF_NAME}\` | **推薦**：A4 完整書 PDF，可直接下載帶到影印店 |
| \`莊子全解-印刷版.pdf\` | 同上（中文檔名別名） |
| \`${HTML_NAME}\` | 用瀏覽器開啟 →「列印」→「另存為 PDF」 |
| \`${MD_NAME}\` | 完整 Markdown 原稿（可用 Typora／VS Code／pandoc 再開） |

## 影印店成冊建議

1. 下載 \`${PDF_NAME}\`（或網站「下載完整書 PDF」）。
2. 紙張 **A4**；版面直向；左側已預留裝訂邊。
3. 帶到影印店：單面或雙面列印後膠裝／騎馬釘；若單面膠裝，請要求**左側裝訂**。

## 重新產生

在專案根目錄執行：

\`\`\`bash
npm run ebook:print      # HTML + Markdown
npm run ebook:pdf        # 從 HTML 產 A4 PDF（需 Chrome／Edge）
npm run ebook:print:all  # 兩者一次做完
\`\`\`
`;
}

function copyToPublic(files: string[]) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  for (const name of files) {
    const src = path.join(OUT_DIR, name);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(PUBLIC_DIR, name);
    fs.copyFileSync(src, dest);
    console.log("copied", dest);
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const { md, chapterCount, missing } = buildPrintMarkdown();
  const mdPath = path.join(OUT_DIR, MD_NAME);
  fs.writeFileSync(mdPath, md, "utf8");
  console.log("wrote", mdPath, `(${chapterCount} chapters, ${Buffer.byteLength(md, "utf8")} bytes)`);

  for (const m of missing) console.warn("missing", m);

  const bodyHtml = mdToHtml(md);
  const html = buildPrintHtml(bodyHtml);
  const htmlPath = path.join(OUT_DIR, HTML_NAME);
  fs.writeFileSync(htmlPath, html, "utf8");
  console.log("wrote", htmlPath);

  const readmePath = path.join(OUT_DIR, README_NAME);
  fs.writeFileSync(readmePath, printReadme(), "utf8");

  const toCopy = [MD_NAME, HTML_NAME, README_NAME];
  copyToPublic(toCopy);

  console.log("\n印刷成冊檔已就緒：");
  console.log(`  Markdown : public/downloads/${MD_NAME}`);
  console.log(`  HTML     : public/downloads/${HTML_NAME}`);
  console.log(`  說明     : public/downloads/${README_NAME}`);
  console.log("  PDF      : 請執行 npm run ebook:pdf");
}

main();
