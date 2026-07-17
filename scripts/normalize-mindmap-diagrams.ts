#!/usr/bin/env tsx
/**
 * 心智圖印刷優化：
 * 1. 16 節若已有 mermaid，移除易跑版的 ```text 樹狀圖
 * 2. 其餘 ```text 框線字元改為垂直箭頭格式
 */
import fs from "fs";
import path from "path";

const ROOTS = [
  "content/chapters/00-導論",
  "content/chapters/01-內篇",
  "content/chapters/02-外篇",
  "content/chapters/03-雜篇",
];

function normalizeTextDiagram(body: string): string {
  return body
    .split("\n")
    .map((line) => {
      let s = line;
      // 樹狀前綴 → 箭頭
      s = s.replace(/^(\s*)[├└│]─?\s?/u, "$1→ ");
      s = s.replace(/^(\s*)[├└│]\s/u, "$1→ ");
      // 移除純框線／斜線裝飾行
      if (/^\s*[\\\/│┌┐┘┴┬┼─]+\s*$/.test(s)) return "";
      if (/^\s*\\+\s*$/.test(s)) return "";
      // 框線字元改箭頭或空白
      s = s.replace(/[┌┐┘┴┬┼]/g, "");
      s = s.replace(/─{2,}/g, "→");
      s = s.replace(/\s+←——.+——┘\s*$/, "");
      return s.trimEnd();
    })
    .filter((line, i, arr) => {
      // 去掉連續空行（保留單空行）
      if (line !== "") return true;
      return i > 0 && arr[i - 1] !== "";
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function processFile(abs: string): boolean {
  let src = fs.readFileSync(abs, "utf8");
  const marker = "## 16. 心智圖";
  const endMarker = "## 17.";
  const start = src.indexOf(marker);
  if (start < 0) return false;
  const end = src.indexOf(endMarker, start);
  if (end < 0) return false;

  const before = src.slice(0, start);
  let section = src.slice(start, end);
  const after = src.slice(end);

  const hadMermaid = section.includes("```mermaid");
  if (hadMermaid) {
    section = section.replace(/```text\r?\n[\s\S]*?```\r?\n?/g, "");
  }

  section = section.replace(/```text\r?\n([\s\S]*?)```/g, (_m, body: string) => {
    const normalized = normalizeTextDiagram(body.replace(/\n$/, ""));
    return "```text\n" + normalized + "\n```";
  });

  const next = before + section + after;
  if (next === src) return false;
  fs.writeFileSync(abs, next);
  return true;
}

let changed = 0;
for (const root of ROOTS) {
  for (const name of fs.readdirSync(root).filter((f) => f.endsWith(".md"))) {
    const abs = path.join(root, name);
    if (processFile(abs)) {
      changed += 1;
      console.log("updated", abs);
    }
  }
}
console.log(`Done — ${changed} file(s) updated.`);
