#!/usr/bin/env tsx
/**
 * 命令列本機問答（不需瀏覽器、不需雲端 API）
 *
 *   npm run ai:ask -- 什麼是無待？
 */
import fs from "fs";
import path from "path";
import {
  DEFAULT_OLLAMA_BASE,
  DEFAULT_OLLAMA_MODEL,
  ollamaChat,
  prepareLocalAsk,
} from "../src/lib/local-llm";
import type { RagChunk } from "../src/lib/rag";
import { answerFromChunks } from "../src/lib/rag";

async function main() {
  const query = process.argv.slice(2).join(" ").trim();
  if (!query) {
    console.error("用法：npm run ai:ask -- 你的問題");
    process.exit(1);
  }

  const file = path.join(process.cwd(), "content", "indexes", "rag-chunks.json");
  const chunks = (JSON.parse(fs.readFileSync(file, "utf8")) as { chunks: RagChunk[] }).chunks;
  const prepared = prepareLocalAsk(query, chunks, 5);
  const model = process.env.ZHUANGZI_OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;

  try {
    const answer = await ollamaChat({
      baseUrl: DEFAULT_OLLAMA_BASE,
      model,
      system: prepared.system,
      user: prepared.user,
    });
    console.log(`\n【本機 LLM｜${model}】\n`);
    console.log(answer);
    console.log("\n【引用】");
    for (const citation of prepared.citations) {
      console.log(`- 〈${citation.title}〉 ${citation.heading}`);
    }
  } catch (error) {
    const fallback = answerFromChunks(query, chunks);
    console.log("\n【Ollama 不可用，改用純檢索】");
    console.log(error instanceof Error ? error.message : String(error));
    console.log("\n" + fallback.answer);
  }
}

main();
