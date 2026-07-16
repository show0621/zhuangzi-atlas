import { AiClient } from "@/components/AiClient";
import type { RagChunk } from "@/lib/rag";
import ragIndex from "../../../content/indexes/rag-chunks.json";
import themeMap from "../../../content/indexes/theme-map.json";

export const metadata = {
  title: "莊子 AI",
  description: "從莊子全解知識庫檢索內容並附上引用來源。",
};

type RagIndex = { chunks: RagChunk[] };
type ThemeMap = Record<string, { concepts: string[]; aliases: string[] }>;

export default function AiPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">莊子 AI</h1>
        <p className="leading-relaxed text-muted">
          這個頁面只檢索本站已寫入的內容，再將命中的段落整理並標示來源；目前不呼叫外部 LLM，也不把內容偽託為莊子原話。
        </p>
      </header>
      <AiClient chunks={(ragIndex as RagIndex).chunks} themeMap={themeMap as ThemeMap} />
    </div>
  );
}
