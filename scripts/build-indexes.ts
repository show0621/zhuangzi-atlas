#!/usr/bin/env tsx
/** 建置靜態索引（供網站／未來 AI RAG 使用） */
import fs from "fs";
import path from "path";
import { CHAPTERS } from "../src/lib/catalog";
import { readChapter } from "../src/lib/content";

const outDir = path.join(process.cwd(), "content", "indexes");
fs.mkdirSync(outDir, { recursive: true });

const chapters = CHAPTERS.map((meta) => {
  const doc = readChapter(meta);
  const text = doc?.content ?? "";
  return {
    id: meta.id,
    slug: meta.slug,
    title: meta.title,
    part: meta.part,
    summary: meta.summary,
    status: doc?.frontmatter.status ?? "skeleton",
    headings: [...text.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]),
    wordCountApprox: text.replace(/\s+/g, "").length,
  };
});

const payload = {
  version: "0.1.0",
  generatedAt: new Date().toISOString(),
  chapterCount: chapters.length,
  chapters,
};

fs.writeFileSync(path.join(outDir, "chapters.json"), JSON.stringify(payload, null, 2), "utf8");
console.log("wrote content/indexes/chapters.json");
