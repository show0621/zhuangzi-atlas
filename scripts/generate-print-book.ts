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
const COVER_IMAGE = "assets/print-cover-minecraft.png";
const BOOK_SPINE_TITLE = `${SITE.title} -人生玩家`;

const EPIGRAPH_TEXT =
  "人生不過短短三萬天，要放膽體驗，要勇敢冒險與嘗試，不要把自己困在方寸之間。";
const AFTERWORD_CALLIGRAPHY = "人生如逆旅，我亦是行人。";

const AUTHOR_FLAP = {
  name: "李孟霖",
  role: "編集",
  paragraphs: [
    "出生於台灣。年少時不學無術，母親說以後應該是放牛吃草長大、撿牛屎賺錢。這幾年在人世中載浮載沉，見證過人性純粹的惡，也感受過美好。是個迷途的小書僮。",
    "未來打算寫一本結合 OECD 指引與各國判決的移轉訂價與預先訂價實務指南。（有時間的話。）",
  ],
} as const;

const PAGE_BREAK_MD = "\n\n<div class=\"pagebreak\"></div>\n\n";
const PAGE_BREAK_HTML = '<div class="pagebreak"></div>\n';

function coverMarkdown(): string {
  return `# ${SITE.title}

**${SITE.subtitle}**

${BOOK_SPINE_TITLE}

${SITE.englishTitle}

${SITE.author}

版本 ${SITE.version}（draft）・${YEAR}
`;
}

function authorFlapMarkdown(): string {
  const paras = AUTHOR_FLAP.paragraphs
    .map((p) => `  <p class="author-flap-body">${escapeHtml(p)}</p>`)
    .join("\n");
  return `%%RAW%%
<section class="author-flap-page" id="作者介紹">
  <p class="author-flap-label">書面折頁｜作者介紹</p>
  <h1 class="author-flap-name">${escapeHtml(AUTHOR_FLAP.name)}</h1>
  <p class="author-flap-role">${escapeHtml(AUTHOR_FLAP.role)}・《${escapeHtml(SITE.title)}》</p>
${paras}
</section>
%%/RAW%%
`;
}

function epigraphMarkdown(): string {
  return `%%RAW%%
<section class="epigraph-page">
  <p class="calligraphy epigraph-text">${escapeHtml(EPIGRAPH_TEXT)}</p>
</section>
%%/RAW%%
`;
}

function spineMarkdown(): string {
  return `%%RAW%%
<section class="spine-page">
  <div class="spine-strip" aria-label="書脊橫條">
    <span class="spine-title">${escapeHtml(BOOK_SPINE_TITLE)}</span>
    <span class="spine-author">${escapeHtml(SITE.author)}</span>
  </div>
  <p class="spine-hint">書脊橫條面｜裝訂成冊時可貼於書脊</p>
</section>
%%/RAW%%
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
  return `# 《莊子全解》自序

台灣人的平均壽命約為 80 歲，這意味著 40 歲的我，已經站在了人生折返點。

回首這幾年，迎接女兒的新生，目睹父母的逐漸老化，經歷了自己的一場大病，再到送走阿公——生、老、病、死，彷彿在短時間內將人生「全餐」吃了一遍。記得那年躺在病床上，我曾發誓絕不再為了工作透支生命，可康復後，卻又下意識地加班到深夜才離去。也記得大伯與阿公臨終時，那瘦骨嶙峋、與往昔判若兩人的模樣，那種視覺上的衝擊，曾讓我陷入巨大的虛無：我們窮盡一生，到底在追求什麼？

當女兒出生，看著那個小生命努力睜開眼，第一次探索這個世界，我對她說：「嗨，歡迎來到這個世界。」那一刻，生命顯得無比神奇；但當阿公離世，站在棺木前，看著他因脫水而變得陌生，甚至難以辨識的容顏，我才驚覺，原來死亡並非電影裡的平靜安詳，而是如此赤裸且殘酷。

生命之於此，似乎就是這樣。走的時候，煙消雲散；走過一遭，連曾經穿過的衣物、蓋過的棉被，最終都將被捨棄。彷彿來過，卻沒帶走什麼，也沒留下什麼。在那一剎那，我隱約觸摸到了人生的底色。喔，原來這就是人生！

在職場浮沉多年，歷經挫折，我也見識了人性中純粹的惡，但也慶幸遇到了許多良善之人。面對情感與工作的磨難，我心中有過許多執著。為了尋找答案，我讀過《被討厭的勇氣》、《蛤蟆先生去看心理師》，也讀過《金剛經》。我不知道怎麼「課題分離」，也不確定如何「應無所住，而生其心」。直到遇見了《莊子》，我才在那些艱澀或平實的字句中，感受到靈魂的些許釋放與解惑。

然而，外人的詮釋終究隔了一層。與其一味汲取他人的觀點，不如由我親自記錄——記錄莊子的精神，如何真實地應用於現實的生活與工作。

這本《${SITE.title}》想做的事很單純：讓讀者在這一本書裡，依原典順序讀完三十三篇，而不是只撿幾句「人生金句」。

《莊子》難讀，往往不是因為文字古奧，而是因為它用寓言、重言、卮言說話，又被後世注家與現代勵志語層層覆蓋。因此，本書堅持三層分讀：

1. 先看**原典**寫了什麼；
2. 再看**注家**怎麼解；
3. 最後才讀本書的**現代詮釋**——後者是編者的哲學整理與人生應用，不是「莊子親口說」。

若你是第一次讀莊子，建議先讀緒論與內篇七篇，再依興趣進入外篇、雜篇。願這冊書能陪你把《莊子》，慢慢讀。這不僅是前人的智慧，更是指引我在人生折返點後，走得更從容的引路燈。

—— 莊子全解．李孟霖．${YEAR} 仲夏
`;
}

function tocMarkdown(): string {
  const lines: string[] = ["# 目錄", ""];
  lines.push("- [封面](#莊子全解)");
  lines.push("- [作者介紹](#作者介紹)");
  lines.push("- [出版資訊](#出版資訊)");
  lines.push("- [自序](#莊子全解自序)");
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
  lines.push("- [書脊橫條](#書脊橫條)");
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

%%RAW%%
<div class="afterword-calligraphy-wrap">
  <p class="calligraphy afterword-calligraphy">${escapeHtml(AFTERWORD_CALLIGRAPHY)}</p>
</div>
%%/RAW%%
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
  parts.push(authorFlapMarkdown());
  parts.push(PAGE_BREAK_MD);
  parts.push(epigraphMarkdown());
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
  parts.push(PAGE_BREAK_MD);
  parts.push(spineMarkdown());

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

  // Protect raw HTML blocks
  const rawBlocks: string[] = [];
  src = src.replace(/%%RAW%%\r?\n?([\s\S]*?)%%\/RAW%%/g, (_m, html: string) => {
    const i = rawBlocks.length;
    rawBlocks.push(html.trim());
    return `\n%%RAWBLOCK${i}%%\n`;
  });

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

    const rawMatch = line.trim().match(/^%%RAWBLOCK(\d+)%%$/);
    if (rawMatch) {
      flushPara();
      closeLists();
      closeBq();
      out.push(rawBlocks[Number(rawMatch[1])]);
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

function illustratedCoverHtml(): string {
  return `<section class="cover-page">
  <div class="cover-spine-band">
    <span>${escapeHtml(BOOK_SPINE_TITLE)}</span>
    <span>${escapeHtml(SITE.author)}</span>
  </div>
  <div class="cover-art-wrap">
    <img class="cover-art" src="${COVER_IMAGE}" alt="Minecraft 風格勇者立於山巔面向太陽與浩瀚宇宙" />
  </div>
  <div class="cover-titles">
    <p class="cover-english">${escapeHtml(SITE.englishTitle)}</p>
    <h1 class="cover-title">${escapeHtml(SITE.title)}</h1>
    <p class="cover-tagline">人生玩家</p>
    <p class="cover-subtitle">${escapeHtml(SITE.subtitle)}</p>
    <p class="cover-author">${escapeHtml(SITE.author)}</p>
    <p class="cover-meta">版本 ${escapeHtml(SITE.version)}・${YEAR}</p>
  </div>
</section>`;
}

/** Replace the plain markdown-converted cover block with the illustrated cover. */
function injectIllustratedCover(bodyHtml: string): string {
  const firstBreak = bodyHtml.indexOf(PAGE_BREAK_HTML);
  if (firstBreak === -1) {
    return `${illustratedCoverHtml()}\n${PAGE_BREAK_HTML}${bodyHtml}`;
  }
  return `${illustratedCoverHtml()}\n${PAGE_BREAK_HTML}${bodyHtml.slice(firstBreak + PAGE_BREAK_HTML.length)}`;
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
  <title>${escapeHtml(SITE.title)} — ${escapeHtml(SITE.author)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Liu+Jian+Mao+Cao&family=Zhi+Mang+Xing&display=swap" rel="stylesheet" />
  <style>
    :root {
      --ink: #1a1a1a;
      --muted: #555;
      --rule: #ccc;
      --paper: #fff;
      --bind: 28mm;
      --outer: 16mm;
      --vert: 18mm;
      --cover-deep: #0b1220;
      --cover-gold: #f0c36a;
      --cover-ember: #ff7a3d;
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

    /* —— 封面 —— */
    .cover-page {
      margin: calc(var(--vert) * -1) calc(var(--outer) * -1) 0 calc(var(--bind) * -1);
      min-height: calc(297mm - 2 * var(--vert));
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(ellipse at 70% 18%, rgba(255, 180, 60, 0.35), transparent 45%),
        radial-gradient(ellipse at 20% 80%, rgba(80, 40, 160, 0.4), transparent 50%),
        linear-gradient(165deg, #070b16 0%, #1a1030 42%, #0d1a28 100%);
      color: #f7f1e6;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .cover-spine-band {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.7rem 1.1rem;
      background: linear-gradient(90deg, #1a0f08, #3a2412 40%, #6b3a14 70%, #1a0f08);
      border-bottom: 2px solid var(--cover-gold);
      font-family: "Noto Serif TC", "Source Han Serif TC", serif;
      font-size: 0.95rem;
      letter-spacing: 0.12em;
      color: var(--cover-gold);
    }
    .cover-art-wrap {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1rem 0;
    }
    .cover-art {
      width: 100%;
      max-height: 155mm;
      object-fit: cover;
      object-position: center 35%;
      border: 1px solid rgba(240, 195, 106, 0.35);
      box-shadow: 0 12px 40px rgba(0,0,0,0.45);
    }
    .cover-titles {
      padding: 1.1rem 1.4rem 1.6rem;
      text-align: center;
    }
    .cover-english {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.78rem;
      color: rgba(247, 241, 230, 0.7);
    }
    .cover-title {
      margin: 0.35rem 0 0.15rem;
      font-size: 2.6rem;
      letter-spacing: 0.28em;
      color: #fff8ea;
      text-shadow: 0 2px 18px rgba(255, 122, 61, 0.35);
      break-before: avoid !important;
      page-break-before: avoid !important;
    }
    .cover-tagline {
      margin: 0.2rem 0 0.55rem;
      font-size: 1.35rem;
      letter-spacing: 0.35em;
      color: var(--cover-ember);
      font-weight: 600;
    }
    .cover-subtitle {
      margin: 0.2rem 0;
      color: rgba(247, 241, 230, 0.82);
      letter-spacing: 0.08em;
    }
    .cover-author {
      margin: 0.85rem 0 0.2rem;
      font-size: 1.15rem;
      letter-spacing: 0.16em;
      color: var(--cover-gold);
      font-weight: 600;
    }
    .cover-meta {
      margin: 0;
      font-size: 0.85rem;
      color: rgba(247, 241, 230, 0.55);
    }

    /* —— 書面折頁｜作者介紹 —— */
    .author-flap-page {
      min-height: calc(297mm - 2 * var(--vert) - 10mm);
      max-width: 118mm;
      margin-left: auto;
      padding: 14mm 8mm 16mm 10mm;
      border-left: 1px solid #d8c9a8;
      background:
        linear-gradient(90deg, rgba(248, 244, 236, 0.2), rgba(248, 244, 236, 0.95) 18%, #faf6ef);
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .author-flap-label {
      margin: 0 0 1.6rem;
      font-size: 0.78rem;
      letter-spacing: 0.22em;
      color: #8a7350;
      font-family: system-ui, sans-serif;
    }
    .author-flap-name {
      margin: 0 0 0.35rem;
      font-size: 1.85rem;
      letter-spacing: 0.2em;
      color: #2a2118;
      break-before: avoid !important;
      page-break-before: avoid !important;
    }
    .author-flap-role {
      margin: 0 0 1.6rem;
      color: #7a6248;
      letter-spacing: 0.08em;
      font-size: 0.95rem;
    }
    .author-flap-body {
      margin: 0 0 1.1rem;
      font-size: 1.02rem;
      line-height: 1.9;
      color: #2f281f;
      text-align: justify;
    }
    .author-flap-body:last-child { margin-bottom: 0; }

    /* —— 草寫狂放書法 —— */
    .calligraphy {
      font-family: "Liu Jian Mao Cao", "Zhi Mang Xing", "Segoe Print", "KaiTi", cursive;
      font-weight: 400;
      line-height: 1.55;
      letter-spacing: 0.06em;
      color: #1c1410;
    }
    .epigraph-page {
      min-height: calc(297mm - 2 * var(--vert) - 10mm);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18mm 12mm;
      page-break-inside: avoid;
    }
    .epigraph-text {
      margin: 0;
      max-width: 18em;
      font-size: 2.05rem;
      text-align: center;
      transform: rotate(-1.5deg);
      text-shadow: 1px 1px 0 rgba(0,0,0,0.04);
    }
    .afterword-calligraphy-wrap {
      margin-top: 4.5rem;
      min-height: 42mm;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 0.5rem;
    }
    .afterword-calligraphy {
      margin: 0;
      font-size: 1.85rem;
      text-align: center;
      transform: rotate(-1.2deg);
    }

    /* —— 書脊橫條面 —— */
    .spine-page {
      min-height: calc(297mm - 2 * var(--vert) - 10mm);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      page-break-inside: avoid;
    }
    .spine-strip {
      width: 14mm;
      min-height: 210mm;
      padding: 10mm 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(180deg, #1a0f08, #4a2a12 45%, #1a0f08);
      border: 1px solid #c9a24a;
      color: #f0c36a;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      letter-spacing: 0.22em;
      box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    }
    .spine-title {
      font-size: 1.05rem;
      font-weight: 600;
    }
    .spine-author {
      font-size: 0.95rem;
    }
    .spine-hint {
      margin: 0;
      font-size: 0.85rem;
      color: var(--muted);
      font-family: system-ui, sans-serif;
    }

    @page {
      size: A4;
      /* 左側稍寬：單面影印後左側裝訂成冊 */
      margin: 18mm 16mm 20mm 26mm;
    }

    @page cover {
      margin: 0;
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
      .sheet > h1:first-child,
      .cover-page .cover-title { break-before: avoid; page-break-before: avoid; }
      .cover-page {
        margin: 0;
        min-height: 100vh;
        page: cover;
        break-after: page;
        page-break-after: always;
      }
      .epigraph-page,
      .spine-page,
      .author-flap-page {
        min-height: 100vh;
      }
      .author-flap-page {
        max-width: none;
        width: 42%;
        margin-left: auto;
        margin-right: 0;
      }
      blockquote, pre.code, li { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <strong>${escapeHtml(SITE.title)}｜${escapeHtml(SITE.author)}</strong>
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
| \`zhuangzi-atlas-print.docx\` | Word 成冊版（可編輯後再列印） |
| \`莊子全解-印刷版.docx\` | Word 中文檔名別名 |
| \`${HTML_NAME}\` | 用瀏覽器開啟 →「列印」→「另存為 PDF」 |
| \`${MD_NAME}\` | 完整 Markdown 原稿（可用 Typora／VS Code／pandoc 再開） |

## 影印店成冊建議

1. 下載 \`${PDF_NAME}\`（或網站「下載完整書 PDF」）；若需改字可下 Word。
2. 紙張 **A4**；版面直向；左側已預留裝訂邊。
3. 帶到影印店：單面或雙面列印後膠裝／騎馬釘；若單面膠裝，請要求**左側裝訂**。

## 重新產生

在專案根目錄執行：

\`\`\`bash
npm run ebook:print      # HTML + Markdown
npm run ebook:pdf        # 從 HTML 產 A4 PDF（需 Chrome／Edge）
npm run ebook:docx       # 從 HTML 產 Word（.docx）
npm run ebook:print:all  # HTML + PDF + Word
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

function ensureCoverAsset() {
  const publicAsset = path.join(PUBLIC_DIR, COVER_IMAGE);
  const distAsset = path.join(OUT_DIR, COVER_IMAGE);
  fs.mkdirSync(path.dirname(publicAsset), { recursive: true });
  fs.mkdirSync(path.dirname(distAsset), { recursive: true });
  if (!fs.existsSync(publicAsset)) {
    throw new Error(`找不到封面圖：${publicAsset}`);
  }
  fs.copyFileSync(publicAsset, distAsset);
  console.log("cover asset", distAsset);
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  ensureCoverAsset();

  const { md, chapterCount, missing } = buildPrintMarkdown();
  const mdPath = path.join(OUT_DIR, MD_NAME);
  fs.writeFileSync(mdPath, md, "utf8");
  console.log("wrote", mdPath, `(${chapterCount} chapters, ${Buffer.byteLength(md, "utf8")} bytes)`);

  for (const m of missing) console.warn("missing", m);

  const bodyHtml = injectIllustratedCover(mdToHtml(md));
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
  console.log(`  封面圖   : public/downloads/${COVER_IMAGE}`);
  console.log("  PDF      : 請執行 npm run ebook:pdf");
}

main();
