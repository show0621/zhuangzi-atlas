#!/usr/bin/env tsx
/**
 * 本機莊子 AI 橋接服務（不需雲端 API Key）
 *
 * 1. 安裝 Ollama：https://ollama.com/download
 * 2. ollama pull qwen2.5:3b
 * 3. npm run ai:serve
 * 4. 開啟網站「莊子 AI」→ 選「本機 LLM」
 */
import http from "http";
import fs from "fs";
import path from "path";
import {
  DEFAULT_OLLAMA_BASE,
  DEFAULT_OLLAMA_MODEL,
  ollamaChat,
  ollamaListModels,
  prepareLocalAsk,
  type LocalAskResult,
} from "../src/lib/local-llm";
import type { RagChunk } from "../src/lib/rag";
import { answerFromChunks } from "../src/lib/rag";

const PORT = Number(process.env.ZHUANGZI_AI_PORT ?? 8787);
const OLLAMA_BASE = process.env.OLLAMA_HOST
  ? `http://${process.env.OLLAMA_HOST.replace(/^https?:\/\//, "")}`
  : DEFAULT_OLLAMA_BASE;
const MODEL = process.env.ZHUANGZI_OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;

function loadChunks(): RagChunk[] {
  const file = path.join(process.cwd(), "content", "indexes", "rag-chunks.json");
  if (!fs.existsSync(file)) {
    throw new Error("找不到 content/indexes/rag-chunks.json，請先執行 npm run rag:build");
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { chunks: RagChunk[] };
  return raw.chunks ?? [];
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleAsk(query: string, preferRetrieval = false): Promise<LocalAskResult> {
  const chunks = loadChunks();
  const prepared = prepareLocalAsk(query, chunks, 5);

  if (preferRetrieval) {
    const retrieval = answerFromChunks(query, chunks);
    return {
      ...retrieval,
      model: "retrieval-only",
      backend: "retrieval",
    };
  }

  try {
    const answer = await ollamaChat({
      baseUrl: OLLAMA_BASE,
      model: MODEL,
      system: prepared.system,
      user: prepared.user,
    });
    return {
      answer,
      citations: prepared.citations,
      weakMatch: prepared.weakMatch,
      model: MODEL,
      backend: "ollama",
    };
  } catch (error) {
    const retrieval = answerFromChunks(query, chunks);
    const reason = error instanceof Error ? error.message : String(error);
    return {
      answer: `本機 LLM 暫時無法使用（${reason}）。已改回純檢索整理：\n\n${retrieval.answer}`,
      citations: retrieval.citations,
      weakMatch: true,
      model: "retrieval-fallback",
      backend: "retrieval",
    };
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    try {
      const models = await ollamaListModels(OLLAMA_BASE);
      const hasModel = models.some((name) => name === MODEL || name.startsWith(`${MODEL}:`) || name.startsWith(`${MODEL.split(":")[0]}:`));
      sendJson(res, 200, {
        ok: true,
        ollama: true,
        model: MODEL,
        modelReady: hasModel || models.length > 0,
        models,
        chunkFile: "content/indexes/rag-chunks.json",
      });
    } catch (error) {
      sendJson(res, 200, {
        ok: false,
        ollama: false,
        model: MODEL,
        modelReady: false,
        error: error instanceof Error ? error.message : String(error),
        hint: "請安裝並啟動 Ollama，然後執行：ollama pull qwen2.5:3b",
      });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/ask") {
    try {
      const body = JSON.parse((await readBody(req)) || "{}") as {
        query?: string;
        retrievalOnly?: boolean;
      };
      const query = body.query?.trim();
      if (!query) {
        sendJson(res, 400, { error: "缺少 query" });
        return;
      }
      const result = await handleAsk(query, Boolean(body.retrievalOnly));
      sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  sendJson(res, 404, {
    error: "not found",
    endpoints: ["GET /health", "POST /ask"],
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`莊子本機 AI 服務：http://127.0.0.1:${PORT}`);
  console.log(`健康檢查：http://127.0.0.1:${PORT}/health`);
  console.log(`Ollama：${OLLAMA_BASE}`);
  console.log(`模型：${MODEL}`);
  console.log(`網站請開「莊子 AI」並選擇「本機 LLM」。`);
  console.log(`（此服務只聽本機，不對外網開放。）`);
});
