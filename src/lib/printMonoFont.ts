/**
 * 印刷／心智圖 ASCII 圖：等寬繁中字型（框線對齊）。
 */
import fs from "fs";
import path from "path";

export const PRINT_MONO_FONT_REL = "assets/fonts/NotoSansMonoCJKtc-Regular.otf";
export const PRINT_MONO_FONT_FAMILY = "Noto Sans Mono CJK TC";

export function printMonoFontSrcAbs(): string {
  return path.join(process.cwd(), "assets", "fonts", "NotoSansMonoCJKtc-Regular.otf");
}

/** 複製等寬字型到 dist／public downloads */
export function ensurePrintMonoFontCopied(
  roots: string[],
  rel = PRINT_MONO_FONT_REL,
): void {
  const src = printMonoFontSrcAbs();
  if (!fs.existsSync(src)) {
    console.warn(`missing print mono font: ${src}`);
    return;
  }
  for (const root of roots) {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log("font", dest);
  }
}

export function printMonoFontFaceCss(relUrl = PRINT_MONO_FONT_REL): string {
  return `@font-face {
      font-family: "${PRINT_MONO_FONT_FAMILY}";
      src: url("${relUrl}") format("opentype");
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }`;
}
