export type PictureScene = {
  id: string;
  title: string;
  caption: string;
  narration: string;
  image: string;
};

/** 逍遙遊繪本場景（lo-fi 時光靜好風） */
const XIAOYAOYOU_SCENES: PictureScene[] = [
  {
    id: "cover",
    title: "開卷・逍遙",
    caption: "時間如逆旅，我亦是旅人。先放下急切，再翻這一頁。",
    narration:
      "歡迎來到〈逍遙遊〉。這一趟，不急著懂全部，只輕輕聽風、看山、跟著文字慢慢走。",
    image: "/immersive/pict/pict-cover-lofi.png",
  },
  {
    id: "kunpeng",
    title: "鯤化為鵬",
    caption: "北冥有魚，其名為鯤；化而為鳥，其名為鵬。",
    narration:
      "北冥有魚，它的名字叫鯤。鯤很大，大到無法用尋常尺度去量。後來，它化成鳥，名字叫鵬。鵬之背，不知其幾千里也——這不是要你羨慕巨大，而是先讓想像飛起來。",
    image: "/immersive/pict/pict-kunpeng-lofi.png",
  },
  {
    id: "birds",
    title: "小大之辯",
    caption: "蜩與學鳩笑之曰：「我決起而飛……奚以之九萬里而南為？」",
    narration:
      "小小的蜩與學鳩笑著說：我們一下子飛起來，碰到榆枋就下來了，何必要飛到九萬里那麼遠的南方呢？莊子讓我們看見：視界不同，判斷就不同。小大之辯，往往先困在自己的尺度裡。",
    image: "/immersive/pict/pict-birds-lofi.png",
  },
  {
    id: "wind",
    title: "有待與無待",
    caption: "風之積也不厚，則其負大翼也無力。列子御風而行，猶有所待。",
    narration:
      "風積得不夠厚，就托不起大翅膀。列子御風而行，看起來很瀟灑，其實還有所待——還要等那陣風。真正的逍遙，不是更用力飛，而是少一點對外在條件的依賴。",
    image: "/immersive/pict/pict-wind-lofi.png",
  },
  {
    id: "tree",
    title: "無用之用",
    caption: "今子有大樹，患其無用，何不樹之於無何有之鄉……",
    narration:
      "惠子抱怨大樹無用，莊子卻說：何不把它種在空曠無人的地方，逍遙地睡在樹下？被叫做「無用」的東西，有時正好保住了生命，也保住了自由。這叫無用之用。",
    image: "/immersive/pict/pict-tree-reader-lofi.png",
  },
];

const GENERIC_FALLBACK: PictureScene[] = [
  {
    id: "listen",
    title: "靜靜聽一頁",
    caption: "陽光灑落，文字像微風一樣經過。",
    narration:
      "這一章也可以用繪本心情來讀：不趕進度，讓聲音慢慢說，讓畫面陪著你停一下。",
    image: "/immersive/mood/ref-listening.png",
  },
  {
    id: "travel",
    title: "人生海海",
    caption: "時間如逆旅，我亦是旅人。",
    narration:
      "把這一節當成旅途中的一小站。懂多少算多少；舒服最重要。讀完，若還想深入，再回到純文字慢慢看。",
    image: "/immersive/mood/ref-traveler.png",
  },
  {
    id: "tree-generic",
    title: "樹下暫歇",
    caption: "有所待時，先在樹蔭裡休息。",
    narration:
      "若這篇的概念還遠，沒關係。先讓身體鬆一點，像坐在大樹下聽風。稍後再翻回文字版，會更從容。",
    image: "/immersive/pict/pict-tree-reader-lofi.png",
  },
];

export function getPictureScenes(slug: string, title: string): PictureScene[] {
  if (slug === "逍遙遊") return XIAOYAOYOU_SCENES;

  return [
    {
      id: "open",
      title: `開卷・〈${title}〉`,
      caption: "以繪本節奏進入，稍後可切回純文字細讀。",
      narration: `我們來到〈${title}〉。先用輕鬆的心情聽一段導讀，不必一次記住全部。`,
      image: "/immersive/pict/pict-cover-lofi.png",
    },
    ...GENERIC_FALLBACK,
  ];
}

/** Strip markdown-ish noise for speech */
export function plainForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>#|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split into leisurely speakable chunks with pause hints */
export function splitNarrationChunks(text: string): string[] {
  const cleaned = plainForSpeech(text);
  if (!cleaned) return [];
  const raw = cleaned
    .split(/(?<=[。！？；…])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const part of raw) {
    if (part.length <= 42) {
      chunks.push(part);
      continue;
    }
    const clauses = part.split(/(?<=[，、：])\s*/).filter(Boolean);
    let buf = "";
    for (const c of clauses) {
      if ((buf + c).length > 36 && buf) {
        chunks.push(buf.trim());
        buf = c;
      } else {
        buf += c;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks.length ? chunks : [cleaned];
}
