import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = { title: "思想地圖" };

export default function MapsPage() {
  const file = path.join(process.cwd(), "content", "maps", "思想地圖.md");
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# 思想地圖\n\n（尚未建立）";
  const content = raw.replace(/^---[\s\S]*?---\n/, "");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-3xl">思想地圖</h1>
        <p className="text-muted mt-2 text-sm">概念節點將逐步連結到名詞百科與篇章。</p>
      </header>
      <div className="prose-zhuangzi">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
