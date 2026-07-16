"use client";

import Link from "next/link";
import { useState } from "react";
import { answerFromChunks, type RagAnswer, type RagChunk } from "@/lib/rag";

const EXAMPLES = ["焦慮與比較", "升遷與成功", "如何面對死亡", "財富有何意義", "什麼是無用之用"];

type ThemeMap = Record<string, { concepts: string[]; aliases: string[] }>;

export function AiClient({ chunks, themeMap }: { chunks: RagChunk[]; themeMap: ThemeMap }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RagAnswer | null>(null);

  function ask(nextQuery = query) {
    const normalized = nextQuery.trim();
    if (!normalized) return;
    setQuery(normalized);
    setResult(answerFromChunks(normalized, chunks));
  }

  return (
    <div className="space-y-6">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        <label htmlFor="ai-question" className="sr-only">
          想問莊子什麼
        </label>
        <input
          id="ai-question"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="例如：我總是因比較而焦慮，怎麼辦？"
          className="min-w-0 flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90">
          檢索
        </button>
      </form>

      <div className="flex flex-wrap gap-2" aria-label="範例問題">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => ask(example)}
            className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-accent hover:text-accent"
          >
            {example}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">主題入口：{Object.keys(themeMap).join("、")}</p>

      {result && (
        <section className="space-y-5 rounded-xl border border-line bg-paper/50 p-5">
          <div className="space-y-2">
            <h2 className="font-serif text-xl">本庫檢索整理</h2>
            {result.weakMatch && <p className="text-sm text-muted">命中較弱：請將此結果視為閱讀線索。</p>}
            <p className="whitespace-pre-line leading-relaxed text-ink/90">{result.answer}</p>
          </div>

          {result.citations.length > 0 && (
            <div className="border-t border-line pt-4">
              <h3 className="font-medium">引用來源</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {result.citations.map((citation) => (
                  <li key={citation.id}>
                    {citation.sourceType === "chapter" ? (
                      <Link href={`/chapters/${citation.slug}/`} className="text-accent hover:underline">
                        〈{citation.title}〉
                      </Link>
                    ) : (
                      <span>《{citation.title}》</span>
                    )}
                    <span className="text-muted"> · {citation.heading}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
