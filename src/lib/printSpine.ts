/**
 * 菊16開（A5）膠裝書脊／封面尺寸估算。
 * 最終書脊請以印廠紙樣複核；此處給設計用預設值。
 */

/** 成品裁切尺寸：菊16開 */
export const BOOK_TRIM_MM = { width: 148, height: 210 } as const;

/** 雙邊折口（勒口）各 9 cm */
export const FLAP_MM = 90;

/** 目前印刷成冊頁數（書內頁碼；實體 PDF 約多 5 頁未編頁前置，書脊厚差可忽略） */
export const DEFAULT_PAGE_COUNT = 448;

/**
 * 無線膠裝書脊（mm）≈ (頁數÷2) × 單張厚度 + 膠水約 1mm
 * 米色輕質紙蓬鬆度高於一般道林，厚度取偏高估計後進位。
 */
export function estimateSpineWidthMm(
  pageCount: number,
  paper: "80g-light" | "90g-light",
): { sheets: number; caliperMm: number; spineMm: number; designMm: number } {
  const sheets = Math.ceil(pageCount / 2);
  const caliperMm = paper === "80g-light" ? 0.13 : 0.15;
  const glueMm = 1;
  const spineMm = sheets * caliperMm + glueMm;
  // 設計用進位整數，並預留 1mm 容差
  const designMm = Math.ceil(spineMm + 1);
  return { sheets, caliperMm, spineMm, designMm };
}

/** 預設依 80g 米色輕質紙設計書脊條（約 16–17mm） */
export const SPINE_DESIGN = estimateSpineWidthMm(DEFAULT_PAGE_COUNT, "80g-light");

/** 90g 對照 */
export const SPINE_DESIGN_90G = estimateSpineWidthMm(DEFAULT_PAGE_COUNT, "90g-light");

/** 封面展開寬（前勒口＋封面＋書脊＋封底＋後勒口），不含出血 */
export function coverWrapWidthMm(spineMm: number): number {
  return FLAP_MM + BOOK_TRIM_MM.width + spineMm + BOOK_TRIM_MM.width + FLAP_MM;
}

export const SPINE_IMAGE = "assets/spine-calligraphy.png";
