/**
 * 印刷／封面產出共用：繁中襯線字型（標點置中）。
 */
import fs from "fs";
import path from "path";

export const PRINT_SERIF_FONT_REL = "assets/fonts/NotoSerifTC-VF.otf";
export const PRINT_SERIF_FONT_FAMILY = "Noto Serif TC";

export function printSerifFontSrcAbs(): string {
  return path.join(process.cwd(), "assets", "fonts", "NotoSerifTC-VF.otf");
}

/** 複製字型到 dist／public downloads，供相對路徑 @font-face 載入 */
export function ensurePrintSerifFontCopied(
  roots: string[],
  rel = PRINT_SERIF_FONT_REL,
): void {
  const src = printSerifFontSrcAbs();
  if (!fs.existsSync(src)) {
    console.warn(`missing print serif font: ${src}`);
    return;
  }
  for (const root of roots) {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log("font", dest);
  }
}

/** HTML 內嵌 @font-face（相對 downloads 根目錄） */
export function printSerifFontFaceCss(relUrl = PRINT_SERIF_FONT_REL): string {
  return `@font-face {
      font-family: "${PRINT_SERIF_FONT_FAMILY}";
      src: url("${relUrl}") format("opentype");
      font-weight: 200 900;
      font-style: normal;
      font-display: block;
    }`;
}
