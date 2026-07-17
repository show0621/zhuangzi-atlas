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
const COVER_IMAGE = "assets/print-cover-minimal.png";
const COVER_IMAGE_FALLBACK = "assets/print-cover-minecraft.png";
const EPIGRAPH_IMAGE = "assets/epigraph-calligraphy.png";
const AFTERWORD_IMAGE = "assets/afterword-calligraphy.png";
const SPINE_IMAGE = "assets/spine-calligraphy.png";
const BOOK_SPINE_TITLE = `${SITE.title}．人生玩家`;

const EPIGRAPH_TEXT =
  "人生不過短短三萬天，要放膽體驗，要勇敢冒險與嘗試，不要把自己困在方寸之間。";
const AFTERWORD_CALLIGRAPHY = "人生如逆旅，我亦是行人。";

const AUTHOR_FLAP = {
  name: "李孟霖",
  role: "編集",
  paragraphs: [
    "出生於台灣。年少時不學無術，母親說以後長大應該是放牛吃草、撿牛屎賺錢。這幾年在人世中載浮載沉，見證過人性純粹的惡，也感受過美好。是個迷途的小書僮。",
    "未來打算寫一本結合 OECD 指引與各國判決的移轉訂價與預先訂價實務指南。（有時間的話）",
  ],
} as const;

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
  return `%%RAW%%
<section class="author-flap-page" id="作者介紹">
  <p class="author-flap-label">書面折頁｜作者介紹</p>
  <p class="author-flap-name">${escapeHtml(AUTHOR_FLAP.name)}</p>
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
  const items: TocItem[] = [
    { label: "封面", target: "cover" },
    { label: "作者介紹", target: "作者介紹" },
    { label: "出版資訊", target: "出版資訊" },
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

願你我心中，皆能養就那一點浩然之氣，乘千里快哉之風，自在前行。

%%RAW%%
<div class="afterword-calligraphy-wrap">
  <img class="calligraphy-img afterword-img" src="${resolvePublicAsset(AFTERWORD_IMAGE)}" alt="${escapeHtml(AFTERWORD_CALLIGRAPHY)}" />
  <p class="calligraphy-fallback sr-only">${escapeHtml(AFTERWORD_CALLIGRAPHY)}</p>
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
  return `<section class="cover-page" id="cover">
  <div class="cover-geo" aria-hidden="true">
    <span class="cover-geo-panel"></span>
    <span class="cover-geo-bar"></span>
    <span class="cover-geo-gold"></span>
    <span class="cover-geo-rule"></span>
  </div>
  <div class="cover-titles">
    <p class="cover-title">${escapeHtml(SITE.title)}</p>
    <p class="cover-subtitle">${escapeHtml(SITE.subtitle)}</p>
    <p class="cover-english">${escapeHtml(SITE.englishTitle)}</p>
    <p class="cover-tagline">人生玩家</p>
    <p class="cover-author">${escapeHtml(SITE.author)}</p>
    <p class="cover-meta">版本 ${escapeHtml(SITE.version)}・${YEAR}</p>
  </div>
</section>`;
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
  <style>
    :root {
      --ink: #1a1a1a;
      --muted: #555;
      --rule: #ccc;
      --paper: #fff;
      --bind: 28mm;
      --outer: 16mm;
      --vert: 18mm;
      --cover-paper: #f7f5f0;
      --cover-ink: #1c1c1c;
      --cover-sage: #6d7f6e;
      --cover-stone: #2f3430;
      --cover-gold: #b8923a;
      --cover-gold-soft: #d4bc7a;
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
      min-height: calc(297mm - 2 * var(--vert));
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
      height: 7mm;
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
    .cover-geo-rule {
      position: absolute;
      top: 42%;
      left: 8%;
      width: 28mm;
      height: 1px;
      background: var(--cover-gold-soft);
    }
    .cover-titles {
      position: relative;
      z-index: 2;
      max-width: 58%;
      padding: 22mm 12mm 24mm 14mm;
      text-align: left;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover-title {
      margin: 0;
      font-family: "Kaiti TC", "STKaiti", "KaiTi", "DFKai-SB", "Noto Serif TC", serif;
      font-size: 2.85rem;
      letter-spacing: 0.32em;
      font-weight: 500;
      color: var(--cover-gold);
      line-height: 1.25;
      break-before: avoid !important;
      page-break-before: avoid !important;
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
    .cover-author {
      margin: 2.4rem 0 0;
      font-size: 1.05rem;
      letter-spacing: 0.22em;
      color: var(--cover-gold);
      font-weight: 600;
    }
    .cover-meta {
      margin: 0.55rem 0 0;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      color: #8a867c;
    }

    /* —— 書面折頁｜作者介紹 —— */
    .author-flap-page {
      box-sizing: border-box;
      width: 105mm;
      max-width: 48%;
      margin: 8mm 0 8mm auto;
      padding: 14mm 10mm 16mm 12mm;
      border-left: 1px solid #d8c9a8;
      background: #faf6ef;
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
      color: #8a7350;
      font-family: system-ui, sans-serif;
    }
    .author-flap-name {
      margin: 0 0 0.35rem;
      font-size: 1.85rem;
      letter-spacing: 0.2em;
      color: #2a2118;
      font-weight: 700;
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

    /* —— 書法圖（避免網頁字型缺字回落標楷） —— */
    .calligraphy-img {
      display: block;
      width: 100%;
      max-width: 170mm;
      height: auto;
      margin: 0 auto;
    }
    .epigraph-img { max-width: 175mm; }
    .afterword-img { max-width: 150mm; }
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
    .afterword-calligraphy-wrap {
      margin-top: 3.5rem;
      min-height: 42mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding-bottom: 0.5rem;
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
      size: A4;
      /* 左側稍寬：單面影印後左側裝訂成冊；下方留給 Puppeteer 頁腳頁碼 */
      margin: 18mm 16mm 22mm 26mm;
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
        width: 105mm;
        max-width: 48%;
        margin-left: auto;
        margin-right: 0;
        min-height: 0 !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: auto;
        page-break-after: auto;
      }
      blockquote, pre.code, li, table.md-table { break-inside: avoid; page-break-inside: avoid; }
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
  const assets = [
    COVER_IMAGE,
    COVER_IMAGE_FALLBACK,
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
