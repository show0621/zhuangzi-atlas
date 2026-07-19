/**
 * 菊16開（A5）膠裝書脊／封面尺寸估算。
 * 最終書脊請以印廠紙樣複核；此處給設計用預設值。
 */

/** 成品裁切尺寸：菊16開 */
export const BOOK_TRIM_MM = { width: 148, height: 210 } as const;

/** 雙邊折口（勒口）各 9 cm（厚書建議 8–10 cm） */
export const FLAP_MM = 90;

/** 目前印刷成冊頁數（書內頁碼；實體 PDF 約多 5 頁未編頁前置，書脊厚差可忽略） */
export const DEFAULT_PAGE_COUNT = 450;

export type SpinePaper =
  | "80g-light"
  | "90g-light"
  | "80g-daolin"
  | "100g-daolin";

const PAPER_CALIPER_MM: Record<SpinePaper, number> = {
  /** 米色輕質／新浪潮類蓬鬆紙：估偏高 */
  "80g-light": 0.13,
  "90g-light": 0.15,
  /** 一般米色道林（印廠常用估法） */
  "80g-daolin": 0.1,
  "100g-daolin": 0.13,
};

/**
 * 無線膠裝書脊（mm）≈ (頁數÷2) × 單張厚度 + 膠水約 1mm
 * 米色輕質紙蓬鬆度高於一般道林，厚度取偏高估計後進位。
 */
export function estimateSpineWidthMm(
  pageCount: number,
  paper: SpinePaper = "80g-light",
): { sheets: number; caliperMm: number; spineMm: number; designMm: number } {
  const sheets = Math.ceil(pageCount / 2);
  const caliperMm = PAPER_CALIPER_MM[paper];
  const glueMm = 1;
  const spineMm = sheets * caliperMm + glueMm;
  // 設計用進位整數，並預留 1mm 容差
  const designMm = Math.ceil(spineMm + 1);
  return { sheets, caliperMm, spineMm, designMm };
}

/** 預設依 80g 米色輕質紙設計書脊條（約 450 頁 → 設計 32mm） */
export const SPINE_DESIGN = estimateSpineWidthMm(DEFAULT_PAGE_COUNT, "80g-light");

/** 90g 輕質對照 */
export const SPINE_DESIGN_90G = estimateSpineWidthMm(DEFAULT_PAGE_COUNT, "90g-light");

/** 80g 米色道林對照（印廠常估較薄） */
export const SPINE_DESIGN_80G_DAOLIN = estimateSpineWidthMm(
  DEFAULT_PAGE_COUNT,
  "80g-daolin",
);

/** 100g 米色道林對照 */
export const SPINE_DESIGN_100G_DAOLIN = estimateSpineWidthMm(
  DEFAULT_PAGE_COUNT,
  "100g-daolin",
);

/** 封面展開寬（前勒口＋封面＋書脊＋封底＋後勒口），不含出血 */
export function coverWrapWidthMm(spineMm: number): number {
  return FLAP_MM + BOOK_TRIM_MM.width + spineMm + BOOK_TRIM_MM.width + FLAP_MM;
}

export const SPINE_IMAGE = "assets/spine-calligraphy.png";
