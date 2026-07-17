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
import { protectPrintBreaks } from "../src/lib/cjkLineBreak";
import {
  COVER_AUTHOR_IMAGE,
  COVER_TITLE_IMAGE,
  FLAP_AUTHOR_NAME_IMAGE,
  printCoverBodyHtml,
} from "../src/lib/printCoverHtml";
import {
  AFTERWORD_CALLIGRAPHY,
  AUTHOR_FLAP,
  EPIGRAPH_TEXT,
  PRINT_COLORS,
  PRINT_YEAR as YEAR,
} from "../src/lib/printFrontMatter";
import { BOOK_TRIM_MM } from "../src/lib/printSpine";
import {
  PRINT_SERIF_FONT_REL,
  ensurePrintSerifFontCopied,
  printSerifFontFaceCss,
} from "../src/lib/printFont";

const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const MD_NAME = "zhuangzi-atlas-print.md";
const HTML_NAME = "zhuangzi-atlas-print.html";
const PDF_NAME = "zhuangzi-atlas-print.pdf";
const README_NAME = "README-列印說明.md";
const COVER_IMAGE = "assets/print-cover-minimal.png";
const COVER_IMAGE_FALLBACK = "assets/print-cover-minecraft.png";
const EPIGRAPH_IMAGE = "assets/epigraph-calligraphy.png";
const AFTERWORD_IMAGE = "assets/afterword-calligraphy.png";
const SPINE_IMAGE = "assets/spine-calligraphy.png";
const BOOK_SPINE_TITLE = `${SITE.title}．人生玩家`;
/** 與封面展開／書脊一致：菊16開 */
const TRIM_LABEL = `菊16開（${BOOK_TRIM_MM.width}×${BOOK_TRIM_MM.height} mm）`;

const PAGE_BREAK_MD = "\n\n<div class=\"pagebreak\"></div>\n\n";
const PAGE_BREAK_HTML = '<div class="pagebreak"></div>\n';

function resolvePublicAsset(...candidates: string[]): string {
  for (const rel of candidates) {
    const abs = path.join(PUBLIC_DIR, rel);
    if (fs.existsSync(abs)) return rel;
  }
  return candidates[0];
}

function assetDataUri(relPath: string): string {
  const abs = path.join(PUBLIC_DIR, relPath);
  if (!fs.existsSync(abs)) return relPath;
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

function coverMarkdown(): string {
  return `# ${SITE.title}

**${SITE.subtitle}**

${SITE.englishTitle}

人生玩家

${SITE.author}

版本 ${SITE.version}（draft）・${YEAR}
`;
}

function authorFlapMarkdown(): string {
  const paras = AUTHOR_FLAP.paragraphs
    .map((p) => `  <p class="author-flap-body">${escapeHtml(p)}</p>`)
    .join("\n");
  const nameImg = resolvePublicAsset(FLAP_AUTHOR_NAME_IMAGE);
  return `%%RAW%%
<section class="author-flap-page" id="作者介紹">
  <p class="author-flap-label">書面折頁｜作者介紹</p>
  <p class="author-flap-name">
    <img class="author-flap-name-img" src="${nameImg}" alt="${escapeHtml(AUTHOR_FLAP.name)}" />
  </p>
  <p class="author-flap-role">${escapeHtml(AUTHOR_FLAP.role)}・《${escapeHtml(SITE.title)}》</p>
${paras}
</section>
%%/RAW%%
`;
}

function epigraphMarkdown(): string {
  const img = resolvePublicAsset(EPIGRAPH_IMAGE);
  return `%%RAW%%
<section class="epigraph-page">
  <img class="calligraphy-img epigraph-img" src="${img}" alt="${escapeHtml(EPIGRAPH_TEXT)}" />
  <p class="calligraphy-fallback sr-only">${escapeHtml(EPIGRAPH_TEXT)}</p>
</section>
%%/RAW%%
`;
}

function spineMarkdown(): string {
  const img = resolvePublicAsset(SPINE_IMAGE);
  return `%%RAW%%
<section class="spine-page">
  <div class="spine-strip" aria-label="書脊橫條">
    <img class="spine-calligraphy" src="${img}" alt="${escapeHtml(BOOK_SPINE_TITLE)}　李孟霖 編集" />
  </div>
  <p class="spine-hint">書脊｜白底黑字｜${escapeHtml(BOOK_SPINE_TITLE)}｜李孟霖 編集</p>
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
  type TocItem = { label: string; target: string; indent?: boolean };
  // 頁碼自「自序」起算為 1；封面／作者／出版資訊／題辭不編頁，亦不列於目錄頁碼區
  const items: TocItem[] = [
    { label: "自序", target: "莊子全解自序" },
    { label: "緒論：如何閱讀《莊子》", target: "緒論" },
  ];

  const parts = PART_ORDER.filter((p) => p !== "附錄" && p !== "導論") as ChapterPart[];
  const partBlocks: string[] = [];
  for (const part of parts) {
    partBlocks.push(`<h2 class="toc-part">${escapeHtml(part)}</h2>`);
    partBlocks.push('<ul class="toc-list">');
    for (const ch of CHAPTERS.filter((c) => c.part === part)) {
      const anchor = slugifyHeading(ch.title);
      partBlocks.push(
        `<li class="toc-row" data-target="${escapeHtml(anchor)}"><a href="#${escapeHtml(anchor)}">${escapeHtml(ch.id)}　〈${escapeHtml(ch.title)}〉</a><span class="toc-dots" aria-hidden="true"></span><span class="toc-page"></span></li>`,
      );
    }
    partBlocks.push("</ul>");
  }

  const front = items
    .map(
      (it) =>
        `<li class="toc-row" data-target="${escapeHtml(it.target)}"><a href="#${escapeHtml(it.target)}">${escapeHtml(it.label)}</a><span class="toc-dots" aria-hidden="true"></span><span class="toc-page"></span></li>`,
    )
    .join("\n");

  const back = [
    { label: "後記", target: "後記" },
    { label: "版權頁", target: "版權頁" },
  ]
    .map(
      (it) =>
        `<li class="toc-row" data-target="${escapeHtml(it.target)}"><a href="#${escapeHtml(it.target)}">${escapeHtml(it.label)}</a><span class="toc-dots" aria-hidden="true"></span><span class="toc-page"></span></li>`,
    )
    .join("\n");

  return `%%RAW%%
<nav class="toc" id="目錄-wrap">
<h1 id="目錄">目錄</h1>
<ul class="toc-list toc-front">
${front}
</ul>
${partBlocks.join("\n")}
<ul class="toc-list toc-back">
${back}
</ul>
</nav>
%%/RAW%%
`;
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
  // 斷行保護在 markdown→HTML／Word 轉換時統一套用（見 protectPrintBreaks）
  return `# 後記

本書在此落筆，但屬於我們的人生才正要啟航。

在全書的尾聲，我想以蘇軾晚年被貶惠州時，《錢氏私志》所記載佛印禪師寄給他的一封信，作為與諸位讀者的共勉：

> 子瞻中大科，登金門，上玉堂，遠於寂寞之濱，權臣忌子瞻為宰相耳。
>
> 人生一世間，如白駒之過隙。二三十年功名富貴，轉盼成空，何不一筆勾斷，尋取自家本來面目，萬劫常住，永無墮落。縱未得到如來地，亦可以驂駕鸞鶴，翱翔三島，為不死人。何乃膠柱守株，待入惡趣？
>
> 昔有問師，佛法在甚麼處？師云在行住坐臥處，著衣吃飯處，屙屎剌撒處，沒理沒會處，死活不得處。子瞻胸中有萬卷書，筆下無一點塵，到這地位，不知性命所在，一生聰明，要作甚麼？
>
> 三世諸佛，則是一個有血性的漢子。子瞻若能腳下承當，把一二十年富貴功名賤如泥土，努力向前，珍重，珍重。

%%RAW%%
<div class="afterword-closing">
  <p>願你我心中，皆能養就那一點浩然之氣，乘千里快哉之風，自在前行。</p>
  <div class="afterword-calligraphy-wrap">
    <img class="calligraphy-img afterword-img" src="${resolvePublicAsset(AFTERWORD_IMAGE)}" alt="${escapeHtml(AFTERWORD_CALLIGRAPHY)}" />
    <p class="calligraphy-fallback sr-only">${escapeHtml(AFTERWORD_CALLIGRAPHY)}</p>
  </div>
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
  // 書脊僅出現在 Word，不進 HTML／PDF

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
  let i = 0;

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

  const isTableRow = (s: string) => /^\s*\|.*\|\s*$/.test(s);
  const isTableSep = (s: string) =>
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(s);
  const splitCells = (s: string): string[] => {
    const trimmed = s.trim().replace(/^\|/, "").replace(/\|$/, "");
    return trimmed.split("|").map((c) => c.trim());
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "%%PAGEBREAK%%") {
      flushPara();
      closeLists();
      closeBq();
      out.push(PAGE_BREAK_HTML);
      i += 1;
      continue;
    }

    const rawMatch = line.trim().match(/^%%RAWBLOCK(\d+)%%$/);
    if (rawMatch) {
      flushPara();
      closeLists();
      closeBq();
      out.push(rawBlocks[Number(rawMatch[1])]);
      i += 1;
      continue;
    }

    const fenceMatch = line.trim().match(/^%%FENCE(\d+)%%$/);
    if (fenceMatch) {
      flushPara();
      closeLists();
      closeBq();
      out.push(fences[Number(fenceMatch[1])]);
      i += 1;
      continue;
    }

    // GFM tables: header | sep | body rows
    if (
      isTableRow(line) &&
      i + 1 < lines.length &&
      isTableSep(lines[i + 1])
    ) {
      flushPara();
      closeLists();
      closeBq();
      const header = splitCells(line);
      i += 2;
      const bodyRows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i]) && !isTableSep(lines[i])) {
        bodyRows.push(splitCells(lines[i]));
        i += 1;
      }
      out.push('<table class="md-table">');
      out.push("<thead><tr>");
      for (const cell of header) {
        out.push(`<th>${inlineFormat(cell)}</th>`);
      }
      out.push("</tr></thead>");
      out.push("<tbody>");
      for (const row of bodyRows) {
        out.push("<tr>");
        for (let c = 0; c < header.length; c += 1) {
          out.push(`<td>${inlineFormat(row[c] ?? "")}</td>`);
        }
        out.push("</tr>");
      }
      out.push("</tbody></table>");
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushPara();
      closeLists();
      closeBq();
      out.push("<hr />");
      i += 1;
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
      i += 1;
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
      i += 1;
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
      i += 1;
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
      i += 1;
      continue;
    }

    if (line.trim() === "") {
      flushPara();
      closeLists();
      closeBq();
      i += 1;
      continue;
    }

    closeLists();
    closeBq();
    para.push(line);
    i += 1;
  }

  flushPara();
  closeLists();
  closeBq();

  return out.join("\n");
}

function illustratedCoverHtml(): string {
  return printCoverBodyHtml(
    resolvePublicAsset(COVER_TITLE_IMAGE),
    resolvePublicAsset(COVER_AUTHOR_IMAGE),
  );
}

/** Embed local asset images as data URIs so PDF print never loses cover/calligraphy. */
function embedAssetImages(html: string): string {
  return html.replace(
    /src="(assets\/[^"]+)"/g,
    (_m, rel: string) => `src="${assetDataUri(rel)}"`,
  );
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
  // 先做中文斷行保護，再 escape／套 inline markdown
  let s = escapeHtml(protectPrintBreaks(text));
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
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(SITE.title)} — ${escapeHtml(SITE.author)}</title>
  <style>
    /* 嵌入繁中 Noto Serif TC：全形標點置中（台／港慣用），避免落到日文偏下或西文基線 */
    ${printSerifFontFaceCss(PRINT_SERIF_FONT_REL)}
    :root {
      --ink: #1a1a1a;
      --muted: #555;
      --rule: #ccc;
      --paper: #fff;
      --bind: 20mm;
      --outer: 14mm;
      --vert: 15mm;
      --cover-paper: #${PRINT_COLORS.coverPaper};
      --cover-ink: #${PRINT_COLORS.coverInk};
      --cover-sage: #${PRINT_COLORS.coverSage};
      --cover-stone: #${PRINT_COLORS.coverStone};
      --cover-gold: #${PRINT_COLORS.coverGold};
      --cover-gold-soft: #${PRINT_COLORS.coverGoldSoft};
      --font-serif: "Noto Serif TC", "Source Han Serif TC", "Source Han Serif",
        "Songti TC", "PingFang TC", "Microsoft JhengHei", serif;
      --trim-w: ${BOOK_TRIM_MM.width}mm;
      --trim-h: ${BOOK_TRIM_MM.height}mm;
    }
    * { box-sizing: border-box; }
    html { font-size: 10pt; }
    body {
      margin: 0;
      color: var(--ink);
      background: #e8e8e8;
      font-family: var(--font-serif);
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
      max-width: var(--trim-w);
      margin: 1.5rem auto 3rem;
      padding: var(--vert) var(--outer) var(--vert) var(--bind);
      background: var(--paper);
      box-shadow: 0 8px 28px rgba(0,0,0,0.12);
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      line-height: 1.35;
      margin: 1.45em 0 0.55em;
      page-break-after: avoid;
    }
    h1 { font-size: 1.55rem; margin-top: 0; }
    h2 { font-size: 1.2rem; border-bottom: 1px solid var(--rule); padding-bottom: 0.25em; }
    h3 { font-size: 1.05rem; }
    p {
      margin: 0.65em 0;
      orphans: 3;
      widows: 3;
      text-align: justify;
      text-justify: inter-ideograph;
      line-break: strict;
      word-break: normal;
      overflow-wrap: break-word;
    }
    /* 引文左齊：避免短句雙齊把字距拉成「疏網」 */
    blockquote {
      margin: 0.9em 0;
      padding: 0.35em 0 0.35em 1em;
      border-left: 3px solid #3d5c4f;
      color: #222;
      background: #f7faf8;
      text-align: left;
      line-break: strict;
      word-break: normal;
      overflow-wrap: break-word;
    }
    blockquote p {
      margin: 0.35em 0;
      text-align: left;
      line-break: strict;
    }
    ul, ol { margin: 0.6em 0; padding-left: 1.4em; }
    li { margin: 0.25em 0; }
    hr {
      border: none;
      border-top: 1px solid var(--rule);
      margin: 2em 0;
    }
    table.md-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.9em 0 1.2em;
      font-size: 0.95rem;
      page-break-inside: auto;
    }
    table.md-table th,
    table.md-table td {
      border: 1px solid #cfcfcf;
      padding: 0.4em 0.55em;
      vertical-align: top;
      text-align: left;
    }
    table.md-table th {
      background: #f3f6f4;
      font-weight: 600;
      color: #1f2e28;
    }
    table.md-table tr { break-inside: avoid; page-break-inside: avoid; }
    table.md-table thead { display: table-header-group; }
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

    /* 目錄＋頁碼導線 */
    nav.toc { margin: 0 0 1rem; }
    .toc-list {
      list-style: none;
      margin: 0.4rem 0 1.1rem;
      padding: 0;
    }
    .toc-part {
      margin: 1.1rem 0 0.35rem;
      font-size: 1.15rem;
      border-bottom: none;
      padding-bottom: 0;
    }
    .toc-row {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin: 0.28rem 0;
      line-height: 1.55;
    }
    .toc-row a {
      color: inherit;
      text-decoration: none;
      flex: 0 1 auto;
    }
    .toc-dots {
      flex: 1 1 auto;
      border-bottom: 1px dotted #9a9a9a;
      min-width: 1.5rem;
      height: 0.85em;
      margin: 0 0.35rem;
      transform: translateY(-0.15em);
    }
    .toc-page {
      flex: 0 0 auto;
      min-width: 1.6em;
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: #333;
    }

    /* —— 封面｜極簡現代：留白＋幾何色塊＋燙金書法字 —— */
    .cover-page {
      position: relative;
      margin: calc(var(--vert) * -1) calc(var(--outer) * -1) 0 calc(var(--bind) * -1);
      min-height: calc(var(--trim-h) - 2 * var(--vert));
      background: var(--cover-paper);
      color: var(--cover-ink);
      overflow: hidden;
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-geo {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }
    .cover-geo-panel {
      position: absolute;
      top: 12%;
      right: 0;
      width: 34%;
      height: 62%;
      background: var(--cover-sage);
      opacity: 0.88;
    }
    .cover-geo-bar {
      position: absolute;
      left: 0;
      bottom: 18%;
      width: 58%;
      height: 11mm;
      background: var(--cover-stone);
    }
    .cover-geo-gold {
      position: absolute;
      top: 8%;
      right: 8%;
      width: 14mm;
      height: 14mm;
      background: var(--cover-gold);
    }
    .cover-titles {
      position: relative;
      z-index: 2;
      max-width: 62%;
      padding: 18mm 10mm 24mm 12mm;
      text-align: left;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-title {
      margin: 0;
      line-height: 1;
      break-before: avoid !important;
      page-break-before: avoid !important;
    }
    .cover-title-img {
      display: block;
      width: 108%;
      max-width: 118mm;
      height: auto;
      margin: 0 0 0 -2mm;
      /* 不用 CSS mask：避免 PDF soft-mask 讓燙金書名在預覽中消失 */
    }
    .cover-subtitle {
      margin: 1.1rem 0 0;
      font-size: 0.98rem;
      letter-spacing: 0.14em;
      color: #4a4a46;
      font-weight: 400;
    }
    .cover-english {
      margin: 0.85rem 0 0;
      font-family: Georgia, "Times New Roman", serif;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-size: 0.72rem;
      color: #7a776e;
    }
    .cover-tagline {
      margin: 1.35rem 0 0;
      font-family: "Kaiti TC", "STKaiti", "KaiTi", "DFKai-SB", serif;
      font-size: 1.25rem;
      letter-spacing: 0.42em;
      color: var(--cover-stone);
      font-weight: 500;
    }
    /* 署名落在墨色條內：霞鹜文楷圖，比「騎線跳出」更穩、更書卷 */
    .cover-author {
      position: absolute;
      left: 0;
      /* 與墨色條同底＋上移，讓文楷字視覺落在條內中央 */
      bottom: calc(18% + 2.6mm);
      z-index: 3;
      box-sizing: border-box;
      width: 58%;
      height: auto;
      margin: 0;
      padding: 0 0 0 12mm;
      line-height: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-author-img {
      display: block;
      height: 5.6mm;
      width: auto;
      max-width: 52mm;
    }
    .cover-meta {
      position: absolute;
      left: 12mm;
      bottom: calc(18% - 9mm);
      z-index: 3;
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      color: #8a867c;
    }

    /* —— 書面折頁｜作者介紹（內文示意；上機勒口見封面展開） —— */
    .author-flap-page {
      box-sizing: border-box;
      width: 90mm;
      max-width: 72%;
      margin: 6mm 0 6mm auto;
      padding: 14mm 10mm 16mm 12mm;
      border-left: 1px solid #${PRINT_COLORS.flapBorder};
      background: #${PRINT_COLORS.flapBg};
      /* 勿用 100vh：會把底色撐破到下一頁 */
      min-height: 0;
      max-height: none;
      page-break-inside: avoid;
      break-inside: avoid;
      display: block;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .author-flap-label {
      margin: 0 0 1.6rem;
      font-size: 0.78rem;
      letter-spacing: 0.22em;
      color: #${PRINT_COLORS.flapLabel};
      font-family: system-ui, sans-serif;
    }
    .author-flap-name {
      margin: 0 0 0.35rem;
      line-height: 0;
      break-before: avoid !important;
      page-break-before: avoid !important;
    }
    .author-flap-name-img {
      display: block;
      height: 11mm;
      width: auto;
      max-width: 58mm;
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

    /* —— 書法圖（避免網頁字型缺字回落標楷） —— */
    .calligraphy-img {
      display: block;
      width: 100%;
      max-width: 170mm;
      height: auto;
      margin: 0 auto;
    }
    .epigraph-img {
      max-width: 160mm;
      background: transparent;
      mix-blend-mode: multiply;
    }
    /* 後記書法：去底色＋緊裁後可維持較大字面；multiply 消殘白 */
    .afterword-img {
      max-width: 132mm;
      background: transparent;
      mix-blend-mode: multiply;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0,0,0,0);
      border: 0;
    }
    .epigraph-page {
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28mm 10mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    /* 收束段＋書法同頁；書法略下移，落在下半頁空白重心 */
    .afterword-closing {
      margin-top: 0.85rem;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .afterword-closing > p {
      margin: 0.65em 0 0.35rem;
    }
    .afterword-calligraphy-wrap {
      margin-top: 14mm;
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 6mm;
      break-before: avoid;
      page-break-before: avoid;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    /* 後記長信允許跨頁，否則會擠掉書法或留下大片空白 */
    #後記 ~ blockquote {
      break-inside: auto;
      page-break-inside: auto;
    }

    /* —— 書脊橫條面 —— */
    .spine-page {
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 16mm 0;
      page-break-inside: avoid;
      break-inside: avoid;
      background: #fff;
    }
    .spine-strip {
      width: 32mm;
      min-height: 240mm;
      padding: 8mm 3mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      border: 1px solid #ddd;
      color: #111;
      box-shadow: none;
    }
    .spine-calligraphy {
      display: block;
      width: 62%;
      height: auto;
      max-height: 220mm;
      object-fit: contain;
      margin: 0 auto;
    }
    .spine-hint {
      margin: 0;
      font-size: 0.85rem;
      color: var(--muted);
      font-family: system-ui, sans-serif;
    }

    @page {
      size: ${BOOK_TRIM_MM.width}mm ${BOOK_TRIM_MM.height}mm; /* 菊16開 */
      /* 左側稍寬：膠裝裝訂邊；下方留給 pdf-lib 頁碼 */
      margin: 15mm 14mm 18mm 20mm;
    }

    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
      /* 避免 pagebreak 後緊接 h1 再強制換頁 → 空白頁 */
      .pagebreak + h1 {
        break-before: avoid !important;
        page-break-before: avoid !important;
      }
      a { color: inherit; text-decoration: none; }
      /* 正文 h1 換頁；封面／折頁／目錄內標題除外 */
      h1 {
        break-before: page;
        page-break-before: always;
      }
      .cover-page h1,
      .cover-page .cover-title,
      .author-flap-page h1,
      .author-flap-name,
      nav.toc h1 {
        break-before: avoid !important;
        page-break-before: avoid !important;
      }
      .sheet > h1:first-of-type { break-before: avoid; page-break-before: avoid; }
      .cover-page {
        margin: 0;
        min-height: auto;
        max-height: none;
        break-inside: avoid;
        page-break-inside: avoid;
        /* 分頁只交給後面的 .pagebreak，避免雙重換頁產生空白頁 */
        break-after: auto;
        page-break-after: auto;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .cover-titles { padding-top: 18mm; }
      .epigraph-page,
      .spine-page {
        min-height: 0;
      }
      .author-flap-page {
        width: 90mm;
        max-width: 72%;
        margin-left: auto;
        margin-right: 0;
        min-height: 0 !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: auto;
        page-break-after: auto;
      }
      blockquote, pre.code, li, table.md-table { break-inside: avoid; page-break-inside: avoid; }
      #後記 ~ blockquote {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      .afterword-closing,
      .afterword-calligraphy-wrap {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .afterword-calligraphy-wrap {
        break-before: avoid !important;
        page-break-before: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <strong>${escapeHtml(SITE.title)}｜${escapeHtml(SITE.author)}</strong>
    <button type="button" onclick="window.print()">列印／另存 PDF</button>
    <a class="btn" href="./${MD_NAME}">下載 Markdown</a>
    <span class="hint">建議：瀏覽器 → 列印 → 另存為 PDF → ${TRIM_LABEL} → 邊界「預設」即可（頁面已含裝訂邊）。正式成冊請用已產出的 PDF（頁碼自自序起算）。</span>
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

> 內容狀態：${SITE.version} **draft**（尚未達 review／published）。上機前請先完成編輯審定與 ISBN。

## 檔案

| 檔案 | 用途 |
|------|------|
| \`${PDF_NAME}\` | **推薦**：${TRIM_LABEL} 完整書 PDF（頁碼自「自序」=1） |
| \`莊子全解-印刷版.pdf\` | 同上（中文檔名別名） |
| \`zhuangzi-atlas-cover-wrap.pdf\` | 封面展開上機稿（勒口＋封底＋書脊＋封面＋勒口） |
| \`zhuangzi-atlas-print.docx\` | Word 成冊版（可編輯；頁碼規則以 PDF 為準） |
| \`莊子全解-印刷版.docx\` | Word 中文檔名別名 |
| \`${HTML_NAME}\` | 瀏覽器預覽；正式頁碼請用已產出的 PDF |
| \`${MD_NAME}\` | 完整 Markdown 原稿 |

## 成冊建議（菊16開膠裝）

1. 內文：下載 \`${PDF_NAME}\`，紙張 **${BOOK_TRIM_MM.width}×${BOOK_TRIM_MM.height} mm（菊16開）**，左側裝訂。
2. 封面：下載 \`zhuangzi-atlas-cover-wrap.pdf\`，列印選「實際大小」，含 3mm 出血。
3. 書脊寬度請以實際頁數＋印廠紙樣複核（設計預設見書脊 PDF 說明頁）。

## 重新產生

\`\`\`bash
npm run ebook:print      # HTML + Markdown
npm run ebook:pdf        # 菊16開 PDF（需 Chrome／Edge）
npm run ebook:docx       # Word
npm run ebook:print:all  # HTML + PDF + Word + 裝訂／書脊／封面展開
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
  const assets = [
    COVER_IMAGE,
    COVER_IMAGE_FALLBACK,
    COVER_TITLE_IMAGE,
    COVER_AUTHOR_IMAGE,
    FLAP_AUTHOR_NAME_IMAGE,
    EPIGRAPH_IMAGE,
    AFTERWORD_IMAGE,
    SPINE_IMAGE,
  ];
  for (const rel of assets) {
    const publicAsset = path.join(PUBLIC_DIR, rel);
    if (!fs.existsSync(publicAsset)) continue;
    const distAsset = path.join(OUT_DIR, rel);
    fs.mkdirSync(path.dirname(distAsset), { recursive: true });
    fs.copyFileSync(publicAsset, distAsset);
    console.log("asset", distAsset);
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  ensureCoverAsset();
  ensurePrintSerifFontCopied([OUT_DIR, PUBLIC_DIR]);

  const { md, chapterCount, missing } = buildPrintMarkdown();
  const mdPath = path.join(OUT_DIR, MD_NAME);
  fs.writeFileSync(mdPath, md, "utf8");
  console.log("wrote", mdPath, `(${chapterCount} chapters, ${Buffer.byteLength(md, "utf8")} bytes)`);

  for (const m of missing) console.warn("missing", m);

  const bodyHtml = embedAssetImages(injectIllustratedCover(mdToHtml(md)));
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
