export type RagSourceType = "chapter" | "figure" | "term" | "theme" | "map";

export type RagChunk = {
  id: string;
  sourceType: RagSourceType;
  slug: string;
  title: string;
  heading: string;
  text: string;
  tags: string[];
};

export type RetrievedChunk = RagChunk & { score: number };

export type RagAnswer = {
  answer: string;
  citations: Array<Pick<RagChunk, "id" | "sourceType" | "slug" | "title" | "heading">>;
  weakMatch: boolean;
};

const THEME_ALIASES: Record<string, string[]> = {
  焦慮: ["焦躁", "不安", "比較", "壓力", "有待", "逍遙遊"],
  比較: ["競爭", "輸贏", "高低", "有待", "逍遙遊"],
  升遷: ["工作", "職場", "成功", "功名", "有待", "無名", "無用之用"],
  成功: ["成就", "功名", "表現", "有待", "無名", "無用之用"],
  死亡: ["死亡", "死", "喪親", "失去", "死生", "大宗師", "至樂"],
  財富: ["金錢", "賺錢", "富有", "資產", "無用之用", "惠子", "惠施"],
  無用: ["沒用", "價值", "實用", "無用之用", "惠子", "逍遙遊"],
};

function queryTerms(query: string): string[] {
  const compact = query.replace(/\s+/g, "").trim();
  const aliases = Object.entries(THEME_ALIASES)
    .filter(([theme, words]) => compact.includes(theme) || words.some((word) => compact.includes(word)))
    .flatMap(([theme, words]) => [theme, ...words]);
  const chineseBigrams = [...compact].flatMap((_, index, chars) =>
    index < chars.length - 1 ? [chars.slice(index, index + 2).join("")] : [],
  );
  const words = query.split(/[\s，。！？、：；「」『』（）()]+/).filter((word) => word.length > 1);
  return [...new Set([compact, ...words, ...aliases, ...chineseBigrams])].filter((term) => term.length > 1);
}

function occurrences(text: string, term: string): number {
  return text.split(term).length - 1;
}

/** 中文關鍵詞與主題別名的輕量檢索，不連線至外部服務。 */
export function retrieve(query: string, chunks: RagChunk[], limit = 5): RetrievedChunk[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];

  return chunks
    .map((chunk) => {
      const title = `${chunk.title} ${chunk.heading}`;
      const tags = chunk.tags.join(" ");
      let score = 0;
      for (const term of terms) {
        score += occurrences(chunk.text, term);
        if (title.includes(term)) score += 5;
        if (tags.includes(term)) score += 4;
      }
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-Hant"))
    .slice(0, limit);
}

function excerpt(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 220).replace(/[，、；：\s]+$/, "") + "。";
}

/**
 * 僅拼接已檢索文字，不自行補充《莊子》外的知識。
 * TODO: 未來可接 LLM，但提示詞必須強制只以 retrieved chunks 為上下文並保留引用。
 */
export function answerFromChunks(query: string, chunks: RagChunk[]): RagAnswer {
  const results = retrieve(query, chunks, 4);
  const weakMatch = results.length === 0 || results[0].score < 3;

  if (results.length === 0) {
    return {
      answer:
        "這是本庫內容的檢索結果，不是把下列話偽託為莊子原話。目前找不到足以直接回答此問題的材料；可改以「逍遙遊」、「有待」、「無待」、「無用之用」或「大宗師」查詢，隨內容擴充後再回來檢索。",
      citations: [],
      weakMatch: true,
    };
  }

  const summaries = results.map(
    (chunk) => `〈${chunk.title}〉「${chunk.heading}」指出：${excerpt(chunk.text)}`,
  );
  const caveat = weakMatch
    ? "目前命中內容較少，以下僅提供相關線索，並非完整定論。"
    : "以下整理只根據本庫已命中的段落，供閱讀與延伸思考。";

  return {
    answer: `這是本庫內容的檢索整理，不是宣稱「莊子直接對你說」。${caveat}\n\n${summaries.join("\n\n")}`,
    citations: results.map(({ id, sourceType, slug, title, heading }) => ({
      id,
      sourceType,
      slug,
      title,
      heading,
    })),
    weakMatch,
  };
}
