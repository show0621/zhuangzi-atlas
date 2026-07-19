#!/usr/bin/env tsx
/**
 * 裝幀示意 Word：封面／封底／作者折頁／封面展開。
 * 內嵌 PDF 第 1 頁預覽圖＋規格說明；正式上機請用對應 1:1 PDF。
 *
 * 用法：npm run ebook:binding-docx
 * （需已有對應 PDF：先 npm run ebook:binding && npm run ebook:wrap）
 *
 * 輸出（各含英文檔名＋中文別名）：
 *   - zhuangzi-atlas-cover.docx / 莊子全解-封面.docx
 *   - zhuangzi-atlas-back.docx / 莊子全解-封底.docx
 *   - zhuangzi-atlas-flap.docx / 莊子全解-作者折頁.docx
 *   - zhuangzi-atlas-cover-wrap.docx / 莊子全解-封面展開.docx
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from "docx";
import { SITE } from "../src/lib/catalog";
import { AUTHOR_FLAP } from "../src/lib/printFrontMatter";
import {
  BOOK_TRIM_MM,
  DEFAULT_PAGE_COUNT,
  FLAP_MM,
  SPINE_DESIGN,
  SPINE_DESIGN_90G,
  SPINE_DESIGN_80G_DAOLIN,
  coverWrapWidthMm,
} from "../src/lib/printSpine";

const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const TMP_DIR = path.join(OUT_DIR, "_binding-docx-preview");

const TRIM = `${BOOK_TRIM_MM.width}×${BOOK_TRIM_MM.height} mm`;
const SPINE_W = SPINE_DESIGN.designMm;
const WRAP_W = coverWrapWidthMm(SPINE_W);
const BLEED = 3;

type BindingDoc = {
  id: string;
  en: string;
  zh: string;
  pdfEn: string;
  title: string;
  /** 預覽圖在 Word 內顯示寬（px） */
  previewWidthPx: number;
  specs: string[];
  /** 可編輯正文（折頁用） */
  editableParas?: readonly string[];
};

const PARTS: BindingDoc[] = [
  {
    id: "cover",
    en: "zhuangzi-atlas-cover.docx",
    zh: "莊子全解-封面.docx",
    pdfEn: "zhuangzi-atlas-cover.pdf",
    title: "封面（單頁示意 Word）",
    previewWidthPx: 420,
    specs: [
      `成品裁切：菊16開 ${TRIM}`,
      "本檔為示意／校對用，版式近似 PDF，非上機出血稿。",
      "正式印刷請用「封面展開 PDF」（含勒口＋書脊＋3mm 出血）。單本數位建議印在外書衣上。",
      `對應 PDF：${"zhuangzi-atlas-cover.pdf"}／莊子全解-封面.pdf`,
    ],
  },
  {
    id: "back",
    en: "zhuangzi-atlas-back.docx",
    zh: "莊子全解-封底.docx",
    pdfEn: "zhuangzi-atlas-back.pdf",
    title: "封底（單頁示意 Word）",
    previewWidthPx: 420,
    specs: [
      `成品裁切：菊16開 ${TRIM}`,
      "本檔為示意／校對用；ISBN／定價出版時再填。",
      "正式印刷請用「封面展開 PDF」。",
      `對應 PDF：${"zhuangzi-atlas-back.pdf"}／莊子全解-封底.pdf`,
    ],
  },
  {
    id: "flap",
    en: "zhuangzi-atlas-flap.docx",
    zh: "莊子全解-作者折頁.docx",
    pdfEn: "zhuangzi-atlas-flap.pdf",
    title: "作者折頁（示意 Word）",
    previewWidthPx: 420,
    specs: [
      `成品裁切：菊16開 ${TRIM}；書衣勒口欄寬約 ${FLAP_MM} mm（厚書建議 80–100 mm）`,
      "下方正文可編輯（示意）；版式／書法署名請以 PDF 為準。上機勒口見封面展開 PDF。",
      `對應 PDF：${"zhuangzi-atlas-flap.pdf"}／莊子全解-作者折頁.pdf`,
    ],
    editableParas: AUTHOR_FLAP.paragraphs,
  },
  {
    id: "wrap",
    en: "zhuangzi-atlas-cover-wrap.docx",
    zh: "莊子全解-封面展開.docx",
    pdfEn: "zhuangzi-atlas-cover-wrap.pdf",
    title: "封面展開（示意 Word）",
    previewWidthPx: 640,
    specs: [
      `展開裁切寬約 ${WRAP_W} mm × 高 ${BOOK_TRIM_MM.height} mm（後勒口＋封底＋書脊 ${SPINE_W} mm＋封面＋前勒口；勒口各 ${FLAP_MM} mm）`,
      `含出血約 ${WRAP_W + BLEED * 2}×${BOOK_TRIM_MM.height + BLEED * 2} mm（單邊出血 ${BLEED} mm）`,
      `約 ${DEFAULT_PAGE_COUNT} 頁：80g 輕質書脊 ${SPINE_W} mm（本檔）；90g 約 ${SPINE_DESIGN_90G.designMm} mm；80g 道林約 ${SPINE_DESIGN_80G_DAOLIN.designMm} mm（改紙需另出檔）`,
      "單本數位建議：平裝膠裝＋雙折口書衣；外書衣米色新浪潮；書名數位燙霧金／消光金；不要上膜。",
      "本檔為示意縮圖，方便校對文案與分區；上機請用 PDF 第 1 頁並選「實際大小」。",
      `對應 PDF：${"zhuangzi-atlas-cover-wrap.pdf"}／莊子全解-封面展開.pdf`,
    ],
  },
];

function rasterizePdfPage(pdfPath: string, pngPath: string): { width: number; height: number } {
  fs.mkdirSync(path.dirname(pngPath), { recursive: true });
  const py = `
import fitz, json, sys
doc = fitz.open(${JSON.stringify(pdfPath)})
page = doc[0]
# 展開稿很寬：限制長邊，避免 Word 嵌入過大
max_side = 2200
zoom = min(2.2, max_side / max(page.rect.width, page.rect.height))
pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
pix.save(${JSON.stringify(pngPath)})
print(json.dumps({"width": pix.width, "height": pix.height}))
`;
  const r = spawnSync("python3", ["-c", py], { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`無法將 PDF 轉預覽圖：${pdfPath}\n${r.stderr || r.stdout}`);
  }
  const line = (r.stdout || "").trim().split("\n").filter(Boolean).pop() || "{}";
  return JSON.parse(line) as { width: number; height: number };
}

function p(
  text: string,
  opts: { bold?: boolean; size?: number; color?: string; center?: boolean; before?: number; after?: number } = {},
): Paragraph {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 120 },
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        size: opts.size ?? 20,
        color: opts.color ?? "222222",
        font: "Microsoft JhengHei",
      }),
    ],
  });
}

async function writeOne(part: BindingDoc): Promise<void> {
  const pdfPath = path.join(PUBLIC_DIR, part.pdfEn);
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`找不到 ${part.pdfEn}。請先執行：npm run ebook:binding && npm run ebook:wrap`);
  }
  const pngPath = path.join(TMP_DIR, `${part.id}.png`);
  const dim = rasterizePdfPage(pdfPath, pngPath);
  const png = fs.readFileSync(pngPath);
  const displayW = part.previewWidthPx;
  const displayH = Math.round((dim.height / dim.width) * displayW);

  const children: Paragraph[] = [
    p(part.title, { bold: true, size: 28, center: true, after: 80 }),
    p(`《${SITE.title}》｜示意 Word（非正式裁切稿）`, {
      size: 18,
      color: "666666",
      center: true,
      after: 60,
    }),
    p("⚠ 上機／裁切／出血請一律以對應 PDF 為準；本檔僅供校對與文案調整。", {
      size: 18,
      color: "8B4513",
      center: true,
      after: 200,
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 },
        left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 },
        right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 },
      },
      children: [
        new ImageRun({
          type: "png",
          data: png,
          transformation: { width: displayW, height: displayH },
        }),
      ],
    }),
  ];

  children.push(p("規格說明", { bold: true, size: 22, before: 120, after: 80 }));
  for (const line of part.specs) {
    children.push(p(`• ${line}`, { size: 18, after: 60 }));
  }

  if (part.editableParas?.length) {
    children.push(
      p("可編輯正文（作者介紹）", { bold: true, size: 22, before: 200, after: 80 }),
    );
    children.push(
      p(`${AUTHOR_FLAP.name}　${AUTHOR_FLAP.role}`, {
        bold: true,
        size: 22,
        after: 120,
      }),
    );
    for (const para of part.editableParas) {
      children.push(p(para, { size: 20, after: 160 }));
    }
  }

  children.push(
    p(`產生時間依本機檔案；套件頁數提示約 ${DEFAULT_PAGE_COUNT} 頁。`, {
      size: 16,
      color: "888888",
      before: 200,
      after: 0,
    }),
  );

  const doc = new Document({
    title: `${SITE.title} — ${part.title}`,
    description: part.specs.join(" "),
    sections: [
      {
        properties: {
          page: {
            size: {
              // A4
              width: 11906,
              height: 16838,
            },
          },
        },
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const dist = path.join(OUT_DIR, part.en);
  const pub = path.join(PUBLIC_DIR, part.en);
  const alias = path.join(PUBLIC_DIR, part.zh);
  fs.writeFileSync(dist, buf);
  fs.copyFileSync(dist, pub);
  fs.copyFileSync(dist, alias);
  console.log("wrote", pub);
  console.log("wrote", alias);
}

async function main() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  for (const part of PARTS) {
    await writeOne(part);
  }
  console.log("\n裝幀示意 Word 已就緒（封面／封底／折頁／展開）；上機請用 PDF。");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
