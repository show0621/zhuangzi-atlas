import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CHAPTERS, type ChapterMeta } from "./catalog";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export type ChapterFrontmatter = {
  id: string;
  slug: string;
  title: string;
  part: string;
  order: number;
  status: string;
  summary: string;
  updated?: string;
};

export type ChapterDocument = {
  meta: ChapterMeta;
  frontmatter: ChapterFrontmatter;
  content: string;
  filePath: string;
};

function chapterFileName(meta: ChapterMeta): string {
  const partFolder =
    meta.part === "導論"
      ? "00-導論"
      : meta.part === "內篇"
        ? "01-內篇"
        : meta.part === "外篇"
          ? "02-外篇"
          : meta.part === "雜篇"
            ? "03-雜篇"
            : "04-附錄";
  return path.join(CONTENT_ROOT, "chapters", partFolder, `${meta.id}-${meta.slug}.md`);
}

export function getChapterPath(meta: ChapterMeta): string {
  return chapterFileName(meta);
}

export function readChapter(meta: ChapterMeta): ChapterDocument | null {
  const filePath = chapterFileName(meta);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return {
    meta,
    frontmatter: data as ChapterFrontmatter,
    content,
    filePath,
  };
}

export function getAllChapterDocuments(): ChapterDocument[] {
  return CHAPTERS.map((meta) => readChapter(meta)).filter(
    (doc): doc is ChapterDocument => doc !== null,
  );
}

export function searchContent(query: string): Array<{
  slug: string;
  title: string;
  part: string;
  excerpt: string;
  score: number;
}> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: Array<{
    slug: string;
    title: string;
    part: string;
    excerpt: string;
    score: number;
  }> = [];

  for (const doc of getAllChapterDocuments()) {
    const hay = `${doc.frontmatter.title}\n${doc.frontmatter.summary}\n${doc.content}`.toLowerCase();
    if (!hay.includes(q)) continue;

    const idx = doc.content.toLowerCase().indexOf(q);
    const excerpt =
      idx >= 0
        ? doc.content.slice(Math.max(0, idx - 40), idx + q.length + 80)
        : doc.frontmatter.summary;

    let score = 0;
    if (doc.frontmatter.title.toLowerCase().includes(q)) score += 10;
    if (doc.frontmatter.summary.toLowerCase().includes(q)) score += 5;
    score += (hay.split(q).length - 1);

    results.push({
      slug: doc.meta.slug,
      title: doc.frontmatter.title,
      part: doc.meta.part,
      excerpt: excerpt.replace(/\n+/g, " ").trim() || doc.frontmatter.summary,
      score,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export { CONTENT_ROOT };
