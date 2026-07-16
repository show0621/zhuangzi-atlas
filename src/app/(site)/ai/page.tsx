import { AiClient } from "@/components/AiClient";
import type { RagChunk } from "@/lib/rag";
import ragIndex from "../../../../content/indexes/rag-chunks.json";
import themeMap from "../../../../content/indexes/theme-map.json";

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
          可選兩種模式：純檢索（免模型），或本機 Ollama LLM（知識庫 RAG + 離線回答，不需雲端 API
          Key）。回答會附引用，且不把內容偽託為莊子原話。
        </p>
      </header>
      <AiClient chunks={(ragIndex as RagIndex).chunks} themeMap={themeMap as ThemeMap} />
    </div>
  );
}
