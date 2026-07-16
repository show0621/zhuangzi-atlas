import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = { title: "主題閱讀" };

export default function ThemesPage() {
  const file = path.join(process.cwd(), "content", "themes", "_index.md");
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# 主題閱讀";
  const content = raw.replace(/^---[\s\S]*?---\n/, "");

  return (
    <div className="space-y-6">
      <div className="prose-zhuangzi">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
