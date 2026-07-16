#!/usr/bin/env tsx
/**
 * 建置本庫檢索用的 RAG chunks。此索引只收錄專案內的 Markdown，
 * 未來若接 LLM，仍必須先檢索並以這些 chunks 作為回答上下文。
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

type SourceType = "chapter" | "figure" | "term" | "theme" | "map";

type RagChunk = {
  id: string;
  sourceType: SourceType;
  slug: string;
  title: string;
  heading: string;
  text: string;
  tags: string[];
};

const CONTENT_ROOT = path.join(process.cwd(), "content");
const OUT_DIR = path.join(CONTENT_ROOT, "indexes");
const SOURCES: Array<{ directory: string; sourceType: SourceType }> = [
  { directory: "chapters", sourceType: "chapter" },
  { directory: "figures", sourceType: "figure" },
  { directory: "terms", sourceType: "term" },
  { directory: "themes", sourceType: "theme" },
  { directory: "maps", sourceType: "map" },
];

const KEYWORDS = [
  "逍遙", "有待", "無待", "無用之用", "無名", "無己", "無功", "心齋", "坐忘",
  "齊物", "養生", "死亡", "死生", "焦慮", "比較", "成功", "升遷", "財富",
  "惠子", "惠施", "大宗師", "至樂", "逍遙遊", "人間世", "德充符",
];

function walkMarkdown(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(filePath);
    return entry.isFile() && entry.name.endsWith(".md") ? [filePath] : [];
  });
}

function cleanText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[>*_`]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitAtSize(text: string, size = 800): string[] {
  if (text.length <= size) return text ? [text] : [];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > size) {
    const boundary = Math.max(
      remaining.lastIndexOf("\n", size),
      remaining.lastIndexOf("。", size),
      remaining.lastIndexOf("！", size),
      remaining.lastIndexOf("？", size),
    );
    const end = boundary > size * 0.55 ? boundary + 1 : size;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function inferTags(...values: string[]): string[] {
  const haystack = values.join("\n");
  const matched = KEYWORDS.filter((keyword) => haystack.includes(keyword));
  return [...new Set(matched)].slice(0, 12);
}

function headingSections(markdown: string, fallbackHeading: string) {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  if (matches.length === 0) return [{ heading: fallbackHeading, text: cleanText(markdown) }];

  return matches.map((match, index) => {
    const start = match.index! + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    return { heading: cleanText(match[1]), text: cleanText(markdown.slice(start, end)) };
  });
}

function makeChunks(filePath: string, sourceType: SourceType): RagChunk[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const baseName = path.basename(filePath, ".md");
  const title = String(data.title ?? baseName.replace(/^\d+-/, ""));
  const slug = String(data.slug ?? baseName.replace(/^\d+-/, ""));
  const relative = path.relative(CONTENT_ROOT, filePath).replace(/\\/g, "/").replace(/\.md$/, "");

  return headingSections(content, title).flatMap(({ heading, text }, sectionIndex) =>
    splitAtSize(text).map((chunkText, chunkIndex) => ({
      id: `${sourceType}:${relative}:${sectionIndex + 1}:${chunkIndex + 1}`,
      sourceType,
      slug,
      title,
      heading,
      text: chunkText,
      tags: inferTags(title, heading, chunkText),
    })),
  );
}

const themeMap = {
  焦慮: { concepts: ["有待", "逍遙遊"], aliases: ["焦躁", "不安", "比較", "壓力"] },
  比較: { concepts: ["有待", "逍遙遊"], aliases: ["競爭", "輸贏", "高低"] },
  升遷: { concepts: ["有待", "無名", "無用之用"], aliases: ["工作", "職場", "成功", "功名"] },
  成功: { concepts: ["有待", "無名", "無用之用"], aliases: ["成就", "功名", "表現"] },
  死亡: { concepts: ["死生", "大宗師", "至樂"], aliases: ["死亡", "死", "喪親", "失去"] },
  財富: { concepts: ["無用之用", "惠子"], aliases: ["金錢", "賺錢", "富有", "資產"] },
  無用: { concepts: ["無用之用", "惠子", "逍遙遊"], aliases: ["沒用", "價值", "實用"] },
};

const chunks = SOURCES.flatMap(({ directory, sourceType }) =>
  walkMarkdown(path.join(CONTENT_ROOT, directory)).flatMap((filePath) => makeChunks(filePath, sourceType)),
);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "rag-chunks.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), chunkCount: chunks.length, chunks }, null, 2),
  "utf8",
);
fs.writeFileSync(path.join(OUT_DIR, "theme-map.json"), JSON.stringify(themeMap, null, 2), "utf8");
console.log(`wrote content/indexes/rag-chunks.json (${chunks.length} chunks)`);
console.log("wrote content/indexes/theme-map.json");
