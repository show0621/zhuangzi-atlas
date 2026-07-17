#!/usr/bin/env tsx
/**
 * 產生／補齊全部章節 Markdown 骨架（不覆蓋已有實質內容）
 */
import fs from "fs";
import path from "path";
import { CHAPTERS, type ChapterMeta } from "../src/lib/catalog";

const ROOT = path.join(process.cwd(), "content", "chapters");

function partDir(part: ChapterMeta["part"]): string {
  switch (part) {
    case "導論":
      return "00-導論";
    case "內篇":
      return "01-內篇";
    case "外篇":
      return "02-外篇";
    case "雜篇":
      return "03-雜篇";
    default:
      return "04-附錄";
  }
}

function template(meta: ChapterMeta): string {
  const today = new Date().toISOString().slice(0, 10);
  return `---
id: "${meta.id}"
slug: "${meta.slug}"
title: "${meta.title}"
part: "${meta.part}"
order: ${meta.order}
status: skeleton
summary: "${meta.summary}"
updated: "${today}"
---

# ${meta.title}

> 狀態：骨架（skeleton）。撰寫時請依 \`prompts/chapter-template.md\` 與 \`AGENTS.md\` 逐節完成，並將 status 改為 draft → review → published。

## 01. 篇名與背景

（待寫：本篇在《莊子》中的位置、篇名含義、與全書主題的關聯。）

## 02. 成書背景

（待寫：時代、學派、文本流傳與真偽問題的簡要說明。）

## 03. 結構分析

（待寫：本篇段落結構、敘事節奏、寓言序列。）

### 結構圖

\`\`\`text
（以 ASCII／Mermaid 呈現本篇主線，例如：鯤鵬 → 小鳥 → 列子 → 至人 → 逍遙）
\`\`\`

## 04. 原典

（待寫：必要且合理引用原文；標明版本依據，如郭慶藩《莊子集釋》。）

> **原典位置**：${meta.part}${meta.part === "導論" ? "" : `・第 ${meta.order} 篇`}・〈${meta.slug}〉

## 05. 白話翻譯

（待寫：忠於文意、可讀、可出版的白話。）

## 06. 字詞註解

| 字詞 | 讀音／釋義 | 說明 |
|------|------------|------|
| （例） |  |  |

## 07. 段落解析

### 第一段

（待寫：原文脈絡、為何寫在這裡、與上下文關係。）

## 08. 歷代注家怎麼看

### 郭象

（待寫）

### 成玄英

（待寫）

### 林希逸

（待寫）

### 其他重要注家

（待寫：如王先謙、郭慶藩、錢穆、陳鼓應等，按本篇相關性選錄。）

## 09. 哲學分析

（待寫：概念梳理、論證結構、與本專案「思想地圖」的連結。**清楚標示為現代詮釋**。）

## 10. 與老子比較

（待寫）

## 11. 與儒家比較

（待寫）

## 12. 與佛學比較

（待寫：宜謹慎，避免過度比附；有文獻依據再寫。）

## 13. 現代人生應用

（待寫：升遷、焦慮、關係、死亡、財富等，須回扣原文，禁止空泛心靈雞湯。）

## 14. 常見誤解

（待寫：列出 2–5 個常見誤讀並澄清。）

## 15. 本篇總結

（待寫）

## 16. 心智圖

\`\`\`text
（本篇思想流程，例如：有所待 → 依靠 → 比較 → 執著 → 痛苦｜無所待 → 自在 → 逍遙）
\`\`\`

## 17. 延伸閱讀

- 陳鼓應《莊子今註今譯》相關章節
- 王邦雄《莊子七講》相關章節
- 傅佩榮《傅佩榮解讀莊子》相關章節
- （再補專書／論文）

---

### 交叉引用（撰寫時填寫）

- 相關篇章：
- 相關人物：
- 相關名詞：
- 相關主題：
`;
}

function main() {
  let created = 0;
  let skipped = 0;

  for (const meta of CHAPTERS) {
    const dir = path.join(ROOT, partDir(meta.part));
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${meta.id}-${meta.slug}.md`);

    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, "utf8");
      // 僅當仍是純骨架標記時才允許覆寫；有實質內容則跳過
      if (!existing.includes("狀態：骨架（skeleton）") && existing.length > 800) {
        skipped += 1;
        continue;
      }
      // 已存在的骨架：跳過，避免覆蓋使用者局部修改
      skipped += 1;
      continue;
    }

    fs.writeFileSync(filePath, template(meta), "utf8");
    created += 1;
    console.log("created", filePath);
  }

  // 百科／主題／地圖占位
  const extras = [
    ["content/figures/_index.md", figuresIndex()],
    ["content/terms/_index.md", termsIndex()],
    ["content/themes/_index.md", themesIndex()],
    ["content/maps/思想地圖.md", mapStub()],
    ["content/references/bibliography.md", bibliography()],
  ] as const;

  for (const [rel, body] of extras) {
    const p = path.join(process.cwd(), rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (!fs.existsSync(p)) {
      fs.writeFileSync(p, body, "utf8");
      created += 1;
      console.log("created", p);
    } else {
      skipped += 1;
    }
  }

  console.log(`\nDone. created=${created}, skipped=${skipped}`);
}

function figuresIndex(): string {
  return `---
title: 人物百科
status: skeleton
---

# 人物百科

本目錄收錄《莊子》重要人物條目。每一人物獨立成檔，例如 \`惠施.md\`、\`接輿.md\`。

## 建議優先條目

- 莊周
- 惠施（惠子）
- 老子／老聃
- 孔子（莊子書中之形象）
- 顏回
- 列禦寇
- 接輿
- 伯昏無人
- 庖丁
- 東郭子
- 盜跖

## 條目格式

見 \`prompts/figure-template.md\`。
`;
}

function termsIndex(): string {
  return `---
title: 名詞百科
status: skeleton
---

# 名詞百科

本目錄收錄核心概念條目。每一名詞獨立成檔，例如 \`無待.md\`、\`心齋.md\`。

## 建議優先條目

- 道
- 無待／有待
- 逍遙
- 齊物
- 心齋
- 坐忘
- 無用之用
- 真人
- 緣督以為經
- 物化
- 卮言／重言／寓言

## 條目格式

見 \`prompts/term-template.md\`。
`;
}

function themesIndex(): string {
  return `---
title: 主題閱讀
status: skeleton
---

# 主題閱讀

依人生問題橫向串聯全書，例如：焦慮、死亡、工作、財富、自由、政治。

## 建議優先主題

- 自由與無待
- 焦慮與比較
- 死亡與喪親
- 工作與技進乎道
- 無用與有用
- 政治與無為
- 是非與相對
`;
}

function mapStub(): string {
  return `---
title: 莊子思想地圖
status: skeleton
---

# 莊子思想地圖

\`\`\`text
道
│
├── 無待
│   ├── 逍遙
│   ├── 心齋
│   └── 坐忘
│
├── 齊物
│   ├── 是非相對
│   └── 物化（夢蝶）
│
├── 養生
│   ├── 緣督以為經
│   └── 安時處順
│
├── 真人／至人／神人／聖人
│
└── 無用之用
\`\`\`

各節點應連結到名詞百科與相關篇章（V0.2 起逐步補齊）。
`;
}

function bibliography(): string {
  return `---
title: 參考文獻
status: draft
---

# 參考文獻（基礎書目）

> 撰寫時請優先核對以下版本；引用務必區分「原典／注家／今人研究／本書詮釋」。

## 原典與集釋

- 郭慶藩《莊子集釋》
- 王先謙《莊子集解》
- 陳鼓應《莊子今註今譯》
- 曹礎基《莊子淺注》

## 通論與導讀

- 王邦雄《莊子七講》
- 傅佩榮相關莊子著作
- 徐復觀《中國人性論史・先秦篇》（相關章節）
- 牟宗三相關道家論述（選用時需標明立場）

## 史籍與思想史

- 《史記・老子韓非列傳》
- 馮友蘭《中國哲學史》相關章節
- 勞思光《新編中國哲學史》相關章節

## 使用原則

1. 原典引文標明篇名與可靠版本。
2. 注家觀點標明注家姓名，不可與作者詮釋混寫。
3. 現代應用章節不得偽托為莊子原文意思；應標「現代詮釋」。
`;
}

main();
