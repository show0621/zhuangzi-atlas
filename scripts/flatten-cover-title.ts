/**
 * 將透明燙金書名 PNG 壓成封面紙色不透明 JPEG，避免 PDF soft-mask 預覽閃沒。
 *
 *   npx tsx scripts/flatten-cover-title.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PRINT_COLORS } from "../src/lib/printFrontMatter";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public/downloads/assets/print-cover-title-cursive.png");
const OUT = path.join(ROOT, "public/downloads/assets/print-cover-title-cursive-opaque.jpg");

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`找不到來源圖：${SRC}`);
  }
  const paper = hexToRgb(PRINT_COLORS.coverPaper);
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3];
      if (a > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX) throw new Error("書名圖沒有可見墨跡");

  const pad = 24;
  const left = Math.max(0, minX - pad);
  const top = Math.max(0, minY - pad);
  const width = Math.min(info.width - left, maxX - left + 1 + pad);
  const height = Math.min(info.height - top, maxY - top + 1 + pad);

  await sharp(SRC)
    .extract({ left, top, width, height })
    .flatten({ background: paper })
    .jpeg({ quality: 93, progressive: true, mozjpeg: true })
    .toFile(OUT);

  const st = fs.statSync(OUT);
  console.log(`wrote ${OUT} (${width}×${height}, ${st.size} bytes) on #${PRINT_COLORS.coverPaper}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
