import { retrieve, type RagChunk, type RagSourceType, type RetrievedChunk } from "./rag";

export const DEFAULT_OLLAMA_BASE = "http://127.0.0.1:11434";
export const DEFAULT_LOCAL_AI_BASE = "http://127.0.0.1:8787";
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:3b";

export type LocalAskResult = {
  answer: string;
  citations: Array<{
    id: string;
    sourceType: RagSourceType;
    slug: string;
    title: string;
    heading: string;
  }>;
  weakMatch: boolean;
  model: string;
  backend: "ollama" | "retrieval";
};

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[#${index + 1}] 來源類型=${chunk.sourceType}｜標題=〈${chunk.title}〉｜小節=${chunk.heading}｜slug=${chunk.slug}\n${chunk.text.trim()}`,
    )
    .join("\n\n---\n\n");
}

export function buildLocalSystemPrompt(): string {
  return [
    "你是《莊子全解（Zhuangzi Atlas）》的本機助手。",
    "你只能根據使用者提供的「知識庫檢索片段」回答，不可編造原典句子，也不可把現代詮釋說成莊子原話。",
    "若片段不足，要明白說「本庫目前材料不足」，並建議可讀篇章。",
    "回答使用繁體中文。結構建議：1) 簡答 2) 依片段說明 3) 引用編號（如 #1 #2）4) 提醒這是知識庫輔助，不是莊子本人發聲。",
    "若片段中有「現代詮釋」「注家」等標記，請分開表述。",
  ].join("");
}

export function buildLocalUserPrompt(query: string, chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return `使用者問題：${query}\n\n（沒有檢索到可用片段。請誠實說明材料不足，並建議從〈逍遙遊〉、無待、無用之用等方向查閱。）`;
  }
  return `使用者問題：${query}\n\n知識庫檢索片段：\n${buildContextBlock(chunks)}\n\n請只依上述片段回答。`;
}

export function prepareLocalAsk(query: string, chunks: RagChunk[], limit = 5) {
  const retrieved = retrieve(query, chunks, limit);
  return {
    retrieved,
    weakMatch: retrieved.length === 0 || retrieved[0].score < 3,
    system: buildLocalSystemPrompt(),
    user: buildLocalUserPrompt(query, retrieved),
    citations: retrieved.map(({ id, sourceType, slug, title, heading }) => ({
      id,
      sourceType,
      slug,
      title,
      heading,
    })),
  };
}

export type OllamaChatOptions = {
  baseUrl?: string;
  model?: string;
  system: string;
  user: string;
  signal?: AbortSignal;
};

export async function ollamaChat(options: OllamaChatOptions): Promise<string> {
  const baseUrl = (options.baseUrl ?? DEFAULT_OLLAMA_BASE).replace(/\/$/, "");
  const model = options.model ?? DEFAULT_OLLAMA_MODEL;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: options.signal,
    body: JSON.stringify({
      model,
      stream: false,
      options: {
        temperature: 0.3,
      },
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.user },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Ollama 回應失敗（${response.status}）：${detail || response.statusText}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content?.trim();
  if (!content) throw new Error("Ollama 回傳空白內容。");
  return content;
}

export async function ollamaListModels(baseUrl = DEFAULT_OLLAMA_BASE): Promise<string[]> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`);
  if (!response.ok) throw new Error(`無法連線 Ollama（${response.status}）`);
  const data = (await response.json()) as { models?: Array<{ name: string }> };
  return (data.models ?? []).map((model) => model.name);
}
