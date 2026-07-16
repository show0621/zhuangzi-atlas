import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = { title: "人物百科" };

export default function FiguresPage() {
  const file = path.join(process.cwd(), "content", "figures", "_index.md");
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# 人物百科";
  const content = raw.replace(/^---[\s\S]*?---\n/, "");

  return (
    <div className="space-y-6">
      <div className="prose-zhuangzi">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
