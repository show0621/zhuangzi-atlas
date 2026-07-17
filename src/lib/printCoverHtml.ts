/**
 * 全本封面與獨立封面共用的 HTML／CSS。
 * 獨立封面應與此一致；產 PDF 時優先直接抽取全本第 1 頁。
 */
import { SITE } from "./catalog";
import { PRINT_COLORS, PRINT_YEAR } from "./printFrontMatter";

export const COVER_TITLE_IMAGE = "assets/print-cover-title-cursive.png";
export const COVER_AUTHOR_IMAGE = "assets/cover-author-wenkai.png";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 與 generate-print-book.ts `.cover-*` 規則對齊 */
export function printCoverCss(vars: {
  paper: string;
  ink: string;
  sage: string;
  stone: string;
  gold: string;
  muted: string;
  english: string;
  meta: string;
}): string {
  return `
    .cover-page {
      position: relative;
      width: 210mm;
      height: 297mm;
      margin: 0;
      background: #${vars.paper};
      color: #${vars.ink};
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
      background: #${vars.sage};
      opacity: 0.88;
    }
    .cover-geo-bar {
      position: absolute;
      left: 0;
      bottom: 18%;
      width: 58%;
      height: 11mm;
      background: #${vars.stone};
    }
    .cover-geo-gold {
      position: absolute;
      top: 8%;
      right: 8%;
      width: 14mm;
      height: 14mm;
      background: #${vars.gold};
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
      -webkit-mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        #000 8%,
        #000 92%,
        transparent 100%
      );
      mask-image: linear-gradient(
        to bottom,
        transparent 0%,
        #000 8%,
        #000 92%,
        transparent 100%
      );
    }
    .cover-subtitle {
      margin: 1.1rem 0 0;
      font-size: 0.98rem;
      letter-spacing: 0.14em;
      color: #${vars.muted};
      font-weight: 400;
    }
    .cover-english {
      margin: 0.85rem 0 0;
      font-family: Georgia, "Times New Roman", serif;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      font-size: 0.72rem;
      color: #${vars.english};
    }
    .cover-tagline {
      margin: 1.35rem 0 0;
      font-family: "Kaiti TC", "STKaiti", "KaiTi", "DFKai-SB", serif;
      font-size: 1.25rem;
      letter-spacing: 0.42em;
      color: #${vars.stone};
      font-weight: 500;
    }
    .cover-author {
      position: absolute;
      left: 0;
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
      color: #${vars.meta};
    }
  `;
}

export function printCoverCssFromTheme(): string {
  return printCoverCss({
    paper: PRINT_COLORS.coverPaper,
    ink: PRINT_COLORS.coverInk,
    sage: PRINT_COLORS.coverSage,
    stone: PRINT_COLORS.coverStone,
    gold: PRINT_COLORS.coverGold,
    muted: PRINT_COLORS.coverMuted,
    english: PRINT_COLORS.coverEnglish,
    meta: PRINT_COLORS.coverMeta,
  });
}

/** 封面內層 markup（titleSrc／authorSrc 可為相對路徑或 data URI） */
export function printCoverBodyHtml(titleSrc: string, authorSrc: string): string {
  return `<section class="cover-page" id="cover">
  <div class="cover-geo" aria-hidden="true">
    <span class="cover-geo-panel"></span>
    <span class="cover-geo-bar"></span>
    <span class="cover-geo-gold"></span>
  </div>
  <div class="cover-titles">
    <p class="cover-title">
      <img class="cover-title-img" src="${titleSrc}" alt="${escapeHtml(SITE.title)}" />
    </p>
    <p class="cover-subtitle">${escapeHtml(SITE.subtitle)}</p>
    <p class="cover-english">${escapeHtml(SITE.englishTitle)}</p>
    <p class="cover-tagline">人生玩家</p>
  </div>
  <p class="cover-author">
    <img class="cover-author-img" src="${authorSrc}" alt="${escapeHtml(SITE.author)}" />
  </p>
  <p class="cover-meta">版本 ${escapeHtml(SITE.version)}・${PRINT_YEAR}</p>
</section>`;
}
