#!/usr/bin/env tsx
/**
 * 從印刷 Markdown 產出可開啟的 Word（.docx）。
 * 使用 docx 套件直接組 OOXML，避免 html-to-docx 損壞檔案。
 *
 * 用法：npm run ebook:docx（請先 npm run ebook:print）
 */
import fs from "fs";
import path from "path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  HeightRule,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
  type IBorderOptions,
} from "docx";
import { SITE, CHAPTERS, PART_ORDER, type ChapterPart } from "../src/lib/catalog";
import {
  AUTHOR_FLAP,
  PRINT_COLORS,
  PRINT_YEAR,
} from "../src/lib/printFrontMatter";

const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const PUBLIC_DIR = path.join(process.cwd(), "public", "downloads");
const MD_NAME = "zhuangzi-atlas-print.md";
const DOCX_NAME = "zhuangzi-atlas-print.docx";
const DOCX_ALIAS = "莊子全解-印刷版.docx";

const EPIGRAPH_IMAGE = "assets/epigraph-calligraphy.png";
const AFTERWORD_IMAGE = "assets/afterword-calligraphy.png";
const BOOK_SPINE = `${SITE.title}．人生玩家`;
const SPINE_IMAGE = "assets/spine-calligraphy.png";

/** 內容區寬度（A4 − 左右邊距） */
const CONTENT_WIDTH = 9525;
const NO_BORDER: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
};

const PAGE_BREAK_MD = '<div class="pagebreak"></div>';

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "para"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "pagebreak" }
  | { type: "raw-skip" };

function resolveAsset(...cands: string[]): string | null {
  for (const rel of cands) {
    const abs = path.join(PUBLIC_DIR, rel);
    if (fs.existsSync(abs)) return abs;
  }
  return null;
}

function stripInlineMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function isTableRow(s: string) {
  return /^\s*\|.*\|\s*$/.test(s);
}
function isTableSep(s: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(s);
}
function splitCells(s: string): string[] {
  return s
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseMarkdown(md: string): Block[] {
  let src = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  // drop raw HTML blocks used for print-only sections; front matter handled separately
  src = src.replace(/%%RAW%%[\s\S]*?%%\/RAW%%/g, "\n%%RAWSKIP%%\n");
  src = src.replace(/<!--[\s\S]*?-->/g, "");
  src = src.replace(/```[\w]*\r?\n([\s\S]*?)```/g, (_m, code: string) => {
    return `\n${code.trim()}\n`;
  });

  const lines = src.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }
    if (trimmed === "%%RAWSKIP%%") {
      blocks.push({ type: "raw-skip" });
      i += 1;
      continue;
    }
    if (trimmed === PAGE_BREAK_MD || trimmed.includes('class="pagebreak"')) {
      blocks.push({ type: "pagebreak" });
      i += 1;
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitCells(line).map(stripInlineMd);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i]) && !isTableSep(lines[i])) {
        rows.push(splitCells(lines[i]).map(stripInlineMd));
        i += 1;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      blocks.push({
        type: "heading",
        level: h[1].length,
        text: stripInlineMd(h[2].replace(/\s+#*$/, "")),
      });
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(stripInlineMd(lines[i].replace(/^\s*[-*]\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(stripInlineMd(lines[i].replace(/^\s*\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const q: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        const t = stripInlineMd(lines[i].replace(/^>\s?/, ""));
        if (t) q.push(t);
        i += 1;
      }
      blocks.push({ type: "quote", lines: q });
      continue;
    }

    // skip leftover HTML tags
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
      i += 1;
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].match(/^#{1,6}\s/) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !isTableRow(lines[i]) &&
      lines[i].trim() !== PAGE_BREAK_MD &&
      !lines[i].includes('class="pagebreak"') &&
      lines[i].trim() !== "%%RAWSKIP%%" &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push({ type: "para", text: stripInlineMd(para.join(" ")) });
  }

  return blocks;
}

function headingLevel(level: number) {
  if (level <= 1) return HeadingLevel.HEADING_1;
  if (level === 2) return HeadingLevel.HEADING_2;
  if (level === 3) return HeadingLevel.HEADING_3;
  return HeadingLevel.HEADING_4;
}

function thinBorder() {
  return {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "999999",
  };
}

function cell(text: string, bold = false) {
  return new TableCell({
    borders: {
      top: thinBorder(),
      bottom: thinBorder(),
      left: thinBorder(),
      right: thinBorder(),
    },
    width: { size: 3000, type: WidthType.DXA },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, font: "Microsoft JhengHei", size: 20 })],
      }),
    ],
  });
}

function imageParagraph(filePath: string, widthPx: number, heightPx: number): Paragraph {
  const data = fs.readFileSync(filePath);
  const isJpg = filePath.toLowerCase().endsWith(".jpg") || filePath.toLowerCase().endsWith(".jpeg");
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type: isJpg ? "jpg" : "png",
        data,
        transformation: { width: widthPx, height: heightPx },
      }),
    ],
  });
}

function coverTextParagraphs(): Paragraph[] {
  const out: Paragraph[] = [];
  const titlePath = resolveAsset("assets/print-cover-title-cursive.png");
  if (titlePath) {
    out.push(imageParagraph(titlePath, 420, 168));
  } else {
    out.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({
            text: SITE.title,
            bold: true,
            size: 56,
            color: PRINT_COLORS.coverGold,
            font: "KaiTi",
          }),
        ],
      }),
    );
  }

  const lines: Array<{
    text: string;
    size: number;
    bold?: boolean;
    color: string;
    before?: number;
    font?: string;
  }> = [
    { text: SITE.subtitle, size: 20, color: PRINT_COLORS.coverMuted, before: 160 },
    {
      text: SITE.englishTitle,
      size: 16,
      color: PRINT_COLORS.coverEnglish,
      before: 120,
      font: "Georgia",
    },
    {
      text: "人生玩家",
      size: 28,
      bold: true,
      color: PRINT_COLORS.coverStone,
      before: 240,
      font: "KaiTi",
    },
    {
      text: SITE.author,
      size: 24,
      bold: true,
      color: PRINT_COLORS.coverGold,
      before: 400,
    },
    {
      text: `版本 ${SITE.version}・${PRINT_YEAR}`,
      size: 16,
      color: PRINT_COLORS.coverMeta,
      before: 80,
    },
  ];
  for (const L of lines) {
    out.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: L.before ?? 80, after: 60 },
        children: [
          new TextRun({
            text: L.text,
            bold: L.bold,
            size: L.size,
            color: L.color,
            font: L.font ?? "Microsoft JhengHei",
          }),
        ],
      }),
    );
  }
  return out;
}

/** 極簡封面：左上文字＋右側鼠尾草綠／金方塊＋底部墨色橫條（對齊 PDF） */
function coverChildren(): FileChild[] {
  const leftW = 5500;
  const rightW = CONTENT_WIDTH - leftW;
  const goldSize = 700;

  const main = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows: [
      new TableRow({
        height: { value: 9000, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: leftW, type: WidthType.DXA },
            borders: NO_BORDERS,
            shading: { type: ShadingType.CLEAR, fill: PRINT_COLORS.coverPaper },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 200, bottom: 200, left: 120, right: 200 },
            children: coverTextParagraphs(),
          }),
          new TableCell({
            width: { size: rightW, type: WidthType.DXA },
            borders: NO_BORDERS,
            shading: { type: ShadingType.CLEAR, fill: PRINT_COLORS.coverSage },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [],
              }),
              // 右上金方塊：嵌套表格靠右
              new Table({
                width: { size: rightW - 400, type: WidthType.DXA },
                columnWidths: [rightW - 400 - goldSize, goldSize],
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: rightW - 400 - goldSize, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        children: [new Paragraph({ children: [] })],
                      }),
                      new TableCell({
                        width: { size: goldSize, type: WidthType.DXA },
                        borders: NO_BORDERS,
                        shading: {
                          type: ShadingType.CLEAR,
                          fill: PRINT_COLORS.coverGold,
                        },
                        children: [
                          new Paragraph({
                            spacing: { before: goldSize - 40 },
                            children: [],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 底部墨色橫條（約左側 58% 寬，對齊 PDF .cover-geo-bar）
  const barW = Math.round(CONTENT_WIDTH * 0.58);
  const bar = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [barW, CONTENT_WIDTH - barW],
    rows: [
      new TableRow({
        height: { value: 280, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: barW, type: WidthType.DXA },
            borders: NO_BORDERS,
            shading: { type: ShadingType.CLEAR, fill: PRINT_COLORS.coverStone },
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: CONTENT_WIDTH - barW, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ children: [] })],
          }),
        ],
      }),
    ],
  });

  return [
    main,
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    bar,
  ];
}

/** 作者折頁：右半奶油色欄＋左邊線（對齊 PDF .author-flap-page） */
function authorFlapChildren(): FileChild[] {
  const leftW = Math.round(CONTENT_WIDTH * 0.5);
  const rightW = CONTENT_WIDTH - leftW;
  const flapLeftBorder: IBorderOptions = {
    style: BorderStyle.SINGLE,
    size: 12,
    color: PRINT_COLORS.flapBorder,
  };

  const bodyParas = AUTHOR_FLAP.paragraphs.map(
    (text) =>
      new Paragraph({
        alignment: AlignmentType.BOTH,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text,
            size: 22,
            color: PRINT_COLORS.flapBody,
            font: "Microsoft JhengHei",
          }),
        ],
      }),
  );

  const flap = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows: [
      new TableRow({
        height: { value: 11000, rule: HeightRule.ATLEAST },
        children: [
          new TableCell({
            width: { size: leftW, type: WidthType.DXA },
            borders: NO_BORDERS,
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: rightW, type: WidthType.DXA },
            borders: {
              top: NO_BORDER,
              bottom: NO_BORDER,
              right: NO_BORDER,
              left: flapLeftBorder,
            },
            shading: { type: ShadingType.CLEAR, fill: PRINT_COLORS.flapBg },
            verticalAlign: VerticalAlign.TOP,
            margins: { top: 400, bottom: 400, left: 280, right: 240 },
            children: [
              new Paragraph({
                spacing: { after: 280 },
                children: [
                  new TextRun({
                    text: "書面折頁｜作者介紹",
                    size: 18,
                    color: PRINT_COLORS.flapLabel,
                    font: "Microsoft JhengHei",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 80, after: 80 },
                children: [
                  new TextRun({
                    text: AUTHOR_FLAP.name,
                    bold: true,
                    size: 36,
                    color: PRINT_COLORS.flapName,
                    font: "Microsoft JhengHei",
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 280 },
                children: [
                  new TextRun({
                    text: `${AUTHOR_FLAP.role}・《${SITE.title}》`,
                    size: 20,
                    color: PRINT_COLORS.flapRole,
                    font: "Microsoft JhengHei",
                  }),
                ],
              }),
              ...bodyParas,
            ],
          }),
        ],
      }),
    ],
  });

  return [flap];
}

function wordTocChildren(): FileChild[] {
  const out: FileChild[] = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: "目錄", bold: true, font: "Microsoft JhengHei", size: 32 }),
      ],
    }),
  ];

  const pushItem = (label: string) => {
    out.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: label, font: "Microsoft JhengHei", size: 22 }),
        ],
      }),
    );
  };

  pushItem("封面");
  pushItem("作者介紹");
  pushItem("出版資訊");
  pushItem("自序");
  pushItem("緒論：如何閱讀《莊子》");

  const parts = PART_ORDER.filter((p) => p !== "附錄" && p !== "導論") as ChapterPart[];
  for (const part of parts) {
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({ text: part, bold: true, font: "Microsoft JhengHei", size: 26 }),
        ],
      }),
    );
    for (const ch of CHAPTERS.filter((c) => c.part === part)) {
      pushItem(`${ch.id}　〈${ch.title}〉`);
    }
  }
  pushItem("後記");
  pushItem("版權頁");
  // 書脊不進目錄
  return out;
}

function blocksToChildren(blocks: Block[], afterImg: string | null): FileChild[] {
  const out: FileChild[] = [];
  let skipNextPlainCover = true;
  let afterInserted = false;
  let seenIntro = false;
  let tocInserted = false;

  for (const b of blocks) {
    if (b.type === "pagebreak") {
      out.push(new Paragraph({ children: [new PageBreak()] }));
      continue;
    }
    if (b.type === "raw-skip") {
      if (seenIntro && !tocInserted) {
        out.push(...wordTocChildren());
        tocInserted = true;
      }
      continue;
    }
    if (b.type === "hr") continue;

    // Skip the plain markdown cover block (title/subtitle/author) — replaced by illustrated cover
    if (
      skipNextPlainCover &&
      b.type === "heading" &&
      b.level === 1 &&
      b.text.includes(SITE.title) &&
      !b.text.includes("自序")
    ) {
      skipNextPlainCover = false;
      continue;
    }
    if (
      !skipNextPlainCover &&
      out.length < 3 &&
      b.type === "para" &&
      (b.text === SITE.subtitle ||
        b.text === SITE.englishTitle ||
        b.text === SITE.author ||
        b.text === BOOK_SPINE ||
        b.text.startsWith("版本 "))
    ) {
      continue;
    }

    if (b.type === "heading") {
      if (b.text.includes("緒論")) seenIntro = true;
      if (b.text.includes("版權") && afterImg && !afterInserted) {
        out.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 200 },
            children: [
              new ImageRun({
                type: "png",
                data: fs.readFileSync(afterImg),
                transformation: { width: 420, height: 236 },
              }),
            ],
          }),
        );
        afterInserted = true;
      }
      out.push(
        new Paragraph({
          heading: headingLevel(b.level),
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: b.text,
              bold: true,
              font: "Microsoft JhengHei",
              size: b.level === 1 ? 32 : b.level === 2 ? 26 : 22,
            }),
          ],
        }),
      );
      continue;
    }

    if (b.type === "para") {
      out.push(
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 140 },
          children: [
            new TextRun({ text: b.text, font: "Microsoft JhengHei", size: 22 }),
          ],
        }),
      );
      continue;
    }

    if (b.type === "ul" || b.type === "ol") {
      b.items.forEach((item, idx) => {
        out.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: `${b.type === "ol" ? `${idx + 1}. ` : "• "}${item}`,
                font: "Microsoft JhengHei",
                size: 22,
              }),
            ],
          }),
        );
      });
      continue;
    }

    if (b.type === "quote") {
      for (const line of b.lines) {
        // 避免「本來面目」等四字成語被拆行
        const text = line.replace(/本來面目/g, "本\u2060來\u2060面\u2060目");
        out.push(
          new Paragraph({
            alignment: AlignmentType.BOTH,
            spacing: { after: 80 },
            indent: { left: 360 },
            children: [
              new TextRun({
                text,
                italics: true,
                font: "Microsoft JhengHei",
                size: 22,
                color: "333333",
              }),
            ],
          }),
        );
      }
      continue;
    }

    if (b.type === "table") {
      const rows = [
        new TableRow({
          children: b.header.map((h) => cell(h, true)),
        }),
        ...b.rows.map(
          (r) =>
            new TableRow({
              children: b.header.map((_, i) => cell(r[i] ?? "")),
            }),
        ),
      ];
      out.push(
        new Table({
          width: { size: 9000, type: WidthType.DXA },
          rows,
        }),
      );
      out.push(new Paragraph({ children: [] }));
    }
  }

  return out;
}

async function main() {
  const mdPath = path.join(PUBLIC_DIR, MD_NAME);
  const altMd = path.join(OUT_DIR, MD_NAME);
  const src = fs.existsSync(mdPath) ? mdPath : altMd;
  if (!fs.existsSync(src)) {
    throw new Error(`找不到 ${MD_NAME}。請先執行：npm run ebook:print`);
  }

  console.log("來源 Markdown：", src);
  const md = fs.readFileSync(src, "utf8");
  const blocks = parseMarkdown(md);

  const children: FileChild[] = [];
  children.push(...coverChildren());
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(...authorFlapChildren());
  children.push(new Paragraph({ children: [new PageBreak()] }));

  const epi = resolveAsset(EPIGRAPH_IMAGE);
  if (epi) {
    children.push(imageParagraph(epi, 520, 292));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  children.push(...blocksToChildren(blocks, resolveAsset(AFTERWORD_IMAGE)));

  const spineImg = resolveAsset(SPINE_IMAGE);
  if (spineImg) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: "書脊",
            size: 18,
            color: "666666",
            font: "Microsoft JhengHei",
          }),
        ],
      }),
    );
    children.push(imageParagraph(spineImg, 130, 580));
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 },
        children: [
          new TextRun({
            text: `${BOOK_SPINE}　｜　李孟霖 編集`,
            size: 18,
            color: "666666",
            font: "Microsoft JhengHei",
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    creator: SITE.author,
    title: SITE.title,
    description: `${SITE.title} 印刷成冊稿 Word 版`,
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4
              height: 16838,
            },
            margin: {
              top: 1134,
              right: 907,
              bottom: 1134,
              left: 1474,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: "Microsoft JhengHei",
                    size: 18,
                    color: "555555",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const distPath = path.join(OUT_DIR, DOCX_NAME);
  const publicPath = path.join(PUBLIC_DIR, DOCX_NAME);
  const aliasPath = path.join(PUBLIC_DIR, DOCX_ALIAS);
  fs.writeFileSync(distPath, buffer);
  fs.writeFileSync(publicPath, buffer);
  fs.writeFileSync(aliasPath, buffer);

  console.log(`wrote ${publicPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`wrote ${aliasPath}`);
  console.log(`wrote ${distPath}`);
  console.log("\nWord 已就緒。");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
