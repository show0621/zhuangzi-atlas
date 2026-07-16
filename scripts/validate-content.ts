#!/usr/bin/env tsx
import fs from "fs";
import path from "path";
import { CHAPTERS } from "../src/lib/catalog";
import { getChapterPath, readChapter } from "../src/lib/content";

const REQUIRED_HEADINGS = [
  "## 01. 篇名與背景",
  "## 03. 結構分析",
  "## 04. 原典",
  "## 05. 白話翻譯",
  "## 08. 歷代注家怎麼看",
  "## 09. 哲學分析",
  "## 13. 現代人生應用",
  "## 17. 延伸閱讀",
];

let errors = 0;

for (const meta of CHAPTERS) {
  const p = getChapterPath(meta);
  if (!fs.existsSync(p)) {
    console.error(`[missing] ${p}`);
    errors += 1;
    continue;
  }
  const doc = readChapter(meta);
  if (!doc) continue;

  if (doc.frontmatter.slug !== meta.slug) {
    console.error(`[frontmatter] ${meta.slug}: slug mismatch`);
    errors += 1;
  }

  for (const h of REQUIRED_HEADINGS) {
    if (!doc.content.includes(h)) {
      console.error(`[structure] ${meta.slug}: missing ${h}`);
      errors += 1;
    }
  }
}

const indexPath = path.join(process.cwd(), "content", "indexes", "search-index.json");
fs.mkdirSync(path.dirname(indexPath), { recursive: true });

const index = CHAPTERS.map((meta) => {
  const doc = readChapter(meta);
  return {
    id: meta.id,
    slug: meta.slug,
    title: meta.title,
    part: meta.part,
    status: doc?.frontmatter.status ?? meta.status,
    summary: meta.summary,
    path: getChapterPath(meta).replace(process.cwd() + path.sep, "").replace(/\\/g, "/"),
  };
});

fs.writeFileSync(indexPath, JSON.stringify({ generatedAt: new Date().toISOString(), chapters: index }, null, 2));
console.log("wrote", indexPath);

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`OK — ${CHAPTERS.length} chapters validated.`);
