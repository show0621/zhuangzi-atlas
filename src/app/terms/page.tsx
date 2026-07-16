import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const metadata = { title: "名詞百科" };

export default function TermsPage() {
  const file = path.join(process.cwd(), "content", "terms", "_index.md");
  const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# 名詞百科";
  const content = raw.replace(/^---[\s\S]*?---\n/, "");

  return (
    <div className="space-y-6">
      <div className="prose-zhuangzi">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
