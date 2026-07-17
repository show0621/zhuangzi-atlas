/**
 * 印刷排版用的中文斷行保護。
 *
 * 瀏覽器／PDF 引擎預設可在任意漢字之間斷行，容易出現
 * 「何｜乃」「努力向｜前」「死活不｜得處」這類難看切口。
 *
 * 策略：
 * 1. 以標點切句；短句整段黏住（Word Joiner U+2060）
 * 2. 長句再套成語／詞組白名單
 */

const WJ = "\u2060";

const CJK =
  /[\u3400-\u9fff\uf900-\ufaff\u{20000}-\u{2ceaf}]/u;

/** 長句內優先整組不斷的詞（長的在前） */
export const CJK_PROTECTED_PHRASES: readonly string[] = [
  "尋取自家本來面目",
  "自家本來面目",
  "本來面目",
  "白駒之過隙",
  "一筆勾斷",
  "功名富貴",
  "富貴功名",
  "轉盼成空",
  "萬劫常住",
  "永無墮落",
  "驂駕鸞鶴",
  "翱翔三島",
  "膠柱守株",
  "行住坐臥處",
  "行住坐臥",
  "著衣吃飯處",
  "著衣吃飯",
  "屙屎剌撒處",
  "屙屎刺撒處",
  "沒理沒會處",
  "沒理沒會",
  "死活不得處",
  "死活不得",
  "性命所在",
  "三世諸佛",
  "腳下承當",
  "努力向前",
  "寂寞之濱",
  "一二十年",
  "二三十年",
  "賤如泥土",
  "有血性",
  "如來地",
  "不死人",
  "萬卷書",
  "一點塵",
  "何乃",
  "惡趣",
] as const;

function isCjkChar(ch: string): boolean {
  return CJK.test(ch);
}

/** 在相鄰漢字之間插入 Word Joiner，迫使整段同進退 */
export function glueCjkChars(text: string): string {
  const chars = [...text.replaceAll(WJ, "")];
  let out = "";
  for (let i = 0; i < chars.length; i += 1) {
    out += chars[i];
    const a = chars[i];
    const b = chars[i + 1];
    if (b && isCjkChar(a) && isCjkChar(b)) out += WJ;
  }
  return out;
}

/** 依白名單黏住詞組（較長優先，避免短詞搶先） */
export function protectCjkPhrases(
  text: string,
  phrases: readonly string[] = CJK_PROTECTED_PHRASES,
): string {
  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  let out = text;
  for (const phrase of sorted) {
    if (!phrase || !out.includes(phrase)) continue;
    const glued = glueCjkChars(phrase);
    out = out.split(phrase).join(glued);
  }
  return out;
}

const CLAUSE_SPLIT = /([，。？！；、：…—「」『』（）《》〈〉\(\)\[\]【】])/;

/**
 * 印刷正文斷行保護：短句整黏；長句套詞組白名單。
 * maxGlueChars：短於等於此長度的句段整段不斷行。
 */
export function protectPrintBreaks(text: string, maxGlueChars = 10): string {
  if (!text) return text;
  return text
    .split(CLAUSE_SPLIT)
    .map((part) => {
      if (!part || CLAUSE_SPLIT.test(part)) return part;
      if (!CJK.test(part)) return part;
      const plain = part.replaceAll(WJ, "");
      const len = [...plain].length;
      if (len <= maxGlueChars) return glueCjkChars(plain);
      return protectCjkPhrases(plain);
    })
    .join("");
}
