#!/usr/bin/env tsx
/**
 * 將全書 Markdown 合併為 ebook 來源，並可呼叫 pandoc 產出 EPUB／PDF。
 *
 * 用法：
 *   npm run ebook:md
 *   npm run ebook:epub   # 需安裝 pandoc
 *   npm run ebook:pdf    # 需安裝 pandoc + PDF engine
 *
 * 印刷成冊（封面／前文／緒論／目錄／裝訂邊 HTML）請用：
 *   npm run ebook:print
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { CHAPTERS, SITE } from "../src/lib/catalog";
import { getChapterPath, readChapter } from "../src/lib/content";

const OUT_DIR = path.join(process.cwd(), "dist", "ebook");
const MERGED = path.join(OUT_DIR, "zhuangzi-atlas.md");

function main() {
  const formatArg = process.argv.find((a) => a.startsWith("--format"));
  const format = formatArg ? process.argv[process.argv.indexOf(formatArg) + 1] : "md";

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const parts: string[] = [];
  parts.push(`---\ntitle: "${SITE.title}"\nsubtitle: "${SITE.subtitle}"\nlang: zh-Hant\n---\n`);
  parts.push(`# ${SITE.title}\n\n${SITE.subtitle}\n\n版本 ${SITE.version}\n\n`);

  for (const meta of CHAPTERS) {
    const doc = readChapter(meta);
    if (!doc) {
      console.warn("missing", getChapterPath(meta));
      continue;
    }
    parts.push(`\n\n\\newpage\n\n`);
    parts.push(doc.content.trim());
    parts.push("\n");
  }

  fs.writeFileSync(MERGED, parts.join(""), "utf8");
  console.log("wrote", MERGED);

  if (format === "md") return;

  const outFile = path.join(OUT_DIR, `zhuangzi-atlas.${format}`);
  const pandoc = spawnSync(
    "pandoc",
    [MERGED, "-o", outFile, "--toc", "--toc-depth=2", `-f`, "markdown", `-t`, format === "pdf" ? "pdf" : "epub3"],
    { encoding: "utf8" },
  );

  if (pandoc.error) {
    console.error("Pandoc 未安裝或不在 PATH。已產生合併 Markdown：", MERGED);
    console.error(String(pandoc.error));
    process.exitCode = 1;
    return;
  }
  if (pandoc.status !== 0) {
    console.error(pandoc.stderr || pandoc.stdout);
    process.exitCode = pandoc.status ?? 1;
    return;
  }
  console.log("wrote", outFile);
}

main();
