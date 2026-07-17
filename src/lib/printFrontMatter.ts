/**
 * 印刷成冊前頁共用資料（封面色碼、作者折頁文案）。
 * PDF（HTML/CSS）與 Word（docx）皆由此讀取，避免兩套文案漂移。
 */
export const PRINT_YEAR = 2026;

export const AUTHOR_FLAP = {
  name: "李孟霖",
  role: "編集",
  paragraphs: [
    "出生於台灣。年少時不學無術，母親說以後長大應該是放牛吃草、撿牛屎賺錢。這幾年在人世中載浮載沉，見證過人性純粹的惡，也感受過美好。是個迷途的小書僮。",
    "未來打算寫一本結合 OECD 指引與各國判決的移轉訂價與預先訂價實務指南。（有時間的話）",
  ],
} as const;

/** 極簡封面／折頁色碼（與 generate-print-book.css 變數對齊） */
export const PRINT_COLORS = {
  coverPaper: "F7F5F0",
  coverInk: "1C1C1C",
  coverSage: "6D7F6E",
  coverStone: "2F3430",
  coverGold: "B8923A",
  coverGoldSoft: "D4BC7A",
  coverMuted: "4A4A46",
  coverEnglish: "7A776E",
  coverMeta: "8A867C",
  flapBg: "FAF6EF",
  flapBorder: "D8C9A8",
  flapLabel: "8A7350",
  flapName: "2A2118",
  flapRole: "7A6248",
  flapBody: "2F281F",
} as const;

export const EPIGRAPH_TEXT =
  "人生不過短短三萬天，要放膽體驗，要勇敢冒險與嘗試，不要把自己困在方寸之間。";

export const AFTERWORD_CALLIGRAPHY = "人生如逆旅，我亦是行人。";
