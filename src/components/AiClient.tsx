"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { answerFromChunks, type RagAnswer, type RagChunk } from "@/lib/rag";
import { DEFAULT_LOCAL_AI_BASE, type LocalAskResult } from "@/lib/local-llm";

const EXAMPLES = ["焦慮與比較", "升遷與成功", "如何面對死亡", "財富有何意義", "什麼是無用之用"];

type ThemeMap = Record<string, { concepts: string[]; aliases: string[] }>;
type Mode = "retrieval" | "local-llm";

type Health = {
  ok: boolean;
  ollama?: boolean;
  model?: string;
  modelReady?: boolean;
  error?: string;
  hint?: string;
  models?: string[];
};

export function AiClient({ chunks, themeMap }: { chunks: RagChunk[]; themeMap: ThemeMap }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("retrieval");
  const [result, setResult] = useState<(RagAnswer & { model?: string; backend?: string }) | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const response = await fetch(`${DEFAULT_LOCAL_AI_BASE}/health`, {
          signal: AbortSignal.timeout(1500),
        });
        const data = (await response.json()) as Health;
        if (!cancelled) setHealth(data);
      } catch {
        if (!cancelled) {
          setHealth({
            ok: false,
            ollama: false,
            error: "本機 AI 服務未啟動",
            hint: "在專案目錄執行：npm run ai:serve",
          });
        }
      }
    }
    void check();
    const timer = setInterval(() => void check(), 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function ask(nextQuery = query) {
    const normalized = nextQuery.trim();
    if (!normalized) return;
    setQuery(normalized);
    setError(null);
    setLoading(true);

    try {
      if (mode === "retrieval") {
        setResult(answerFromChunks(normalized, chunks));
        return;
      }

      const response = await fetch(`${DEFAULT_LOCAL_AI_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: normalized }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `本機服務錯誤（${response.status}）`);
      }
      const data = (await response.json()) as LocalAskResult;
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(
        `${message}\n\n請確認：1) 已安裝並啟動 Ollama  2) 已執行 ollama pull qwen2.5:3b  3) 已執行 npm run ai:serve`,
      );
      // 保底：仍給檢索結果
      setResult(answerFromChunks(normalized, chunks));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="回答模式">
        <button
          type="button"
          onClick={() => setMode("retrieval")}
          className={`rounded-md px-3 py-1.5 text-sm border ${
            mode === "retrieval"
              ? "border-accent bg-accent text-white"
              : "border-line text-muted hover:border-accent"
          }`}
        >
          純檢索（免模型）
        </button>
        <button
          type="button"
          onClick={() => setMode("local-llm")}
          className={`rounded-md px-3 py-1.5 text-sm border ${
            mode === "local-llm"
              ? "border-accent bg-accent text-white"
              : "border-line text-muted hover:border-accent"
          }`}
        >
          本機 LLM（Ollama）
        </button>
      </div>

      <div className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-3 text-sm text-muted space-y-1">
        {mode === "retrieval" ? (
          <p>只整理知識庫命中段落，不需要安裝任何模型。</p>
        ) : (
          <>
            <p>
              使用你電腦上的 Ollama 產生回答；資料不出本機，也不需要雲端 API
              Key。流程：知識庫檢索 → 本機模型改寫 → 附上引用。
            </p>
            <p>
              狀態：{" "}
              {health?.ok
                ? `本機服務已連線｜模型 ${health.model ?? "未知"}${health.modelReady ? "（可用）" : "（請先 pull）"}`
                : `未連線（${health?.error ?? "未知"}）${health?.hint ? `｜${health.hint}` : ""}`}
            </p>
          </>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask();
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
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "思考中…" : mode === "local-llm" ? "本機回答" : "檢索"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2" aria-label="範例問題">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => void ask(example)}
            className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-accent hover:text-accent"
          >
            {example}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">主題入口：{Object.keys(themeMap).join("、")}</p>

      {error && (
        <p className="whitespace-pre-line rounded-md border border-line bg-paper px-3 py-2 text-sm text-accent-2">
          {error}
        </p>
      )}

      {result && (
        <section className="space-y-5 rounded-xl border border-line bg-paper/50 p-5">
          <div className="space-y-2">
            <h2 className="font-serif text-xl">
              {result.backend === "ollama" ? "本機 LLM 回答" : "本庫檢索整理"}
            </h2>
            {result.model && <p className="text-xs text-muted">後端：{result.model}</p>}
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

      <details className="rounded-xl border border-line px-4 py-3 text-sm text-muted">
        <summary className="cursor-pointer text-ink">第一次使用本機 LLM？點這裡</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            安裝{" "}
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              Ollama（Windows）
            </a>
          </li>
          <li>
            終端機執行：<code className="text-ink">ollama pull qwen2.5:3b</code>
            （中文較穩；電腦較好可改 <code className="text-ink">qwen2.5:7b</code>）
          </li>
          <li>
            在本專案執行：<code className="text-ink">npm run ai:serve</code>
          </li>
          <li>
            另開視窗：<code className="text-ink">npm run dev</code>，到「莊子 AI」選「本機 LLM」
          </li>
          <li>
            也可命令列直接問：<code className="text-ink">npm run ai:ask -- 什麼是無待？</code>
          </li>
        </ol>
        <p className="mt-3">
          注意：GitHub Pages 線上版無法碰到你電腦的 Ollama；本機 LLM 請用本機網站（localhost）。
        </p>
      </details>
    </div>
  );
}
