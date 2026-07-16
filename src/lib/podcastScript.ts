/** Podcast-style dual-host narration scripts for immersive reading. */

export type Speaker = "male" | "female";

export type PodcastLine = {
  speaker: Speaker;
  text: string;
  /** Optional hint for breath after a speaker change (ms). Prefer omitting. */
  pauseMs?: number;
  rate?: number;
  pitch?: number;
};

export type PodcastEpisode = {
  id: string;
  title: string;
  summary?: string;
  lines: PodcastLine[];
};

export type PodcastShow = {
  slug: string;
  title: string;
  episodes: PodcastEpisode[];
};

const M = (text: string, extra?: Partial<PodcastLine>): PodcastLine => ({
  speaker: "male",
  text,
  ...extra,
});

const F = (text: string, extra?: Partial<PodcastLine>): PodcastLine => ({
  speaker: "female",
  text,
  ...extra,
});

/** 〈逍遙遊〉完整分單元對答：說故事 → 問答 → 講意思（整段連續，不碎切） */
const XIAOYAOYOU_SHOW: PodcastShow = {
  slug: "逍遙遊",
  title: "逍遙遊",
  episodes: [
    {
      id: "open",
      title: "單元〇・開場",
      summary: "時光靜好，輕輕入卷",
      lines: [
        M("你好。今天我們坐在樹下，慢慢讀〈逍遙遊〉。不趕進度，也不急著懂全部。"),
        F("聽起來很舒服。可是這篇名字好像很大……「逍遙遊」到底在說什麼？"),
        M("簡單說，它問的是：人怎麼在這個一直變化的世界裡，真正自在地「遊」。不是逃到遠方，而是心怎麼往來。"),
        F("那我們就別一次吞下去。一單元一單元來，好嗎？"),
        M("好。先聽故事，再問意思。像兩個人聊天一樣。"),
      ],
    },
    {
      id: "kunpeng",
      title: "單元一・鯤鵬",
      summary: "北冥有魚，化而為鵬",
      lines: [
        M("第一個故事，從北海開始。北冥有魚，它的名字叫鯤。鯤很大，大到不知道有幾千里。"),
        F("幾千里……想像力要先打開了。"),
        M("後來，它化成鳥，名字叫鵬。鵬的背，也不知道有幾千里。奮起而飛時，翅膀像掛在天邊的雲。"),
        F("好壯觀。可是莊子為什麼一開頭就要寫這麼大？"),
        M("因為他要先把我們的尺度拉開。很多時候，我們困在自己習慣的小範圍裡，以為那就是全世界。"),
        F("所以鯤鵬不是要我們羨慕「巨大」，而是先讓想像飛起來？"),
        M("對。先飛起來，後面才談得上什麼叫小、什麼叫大，什麼叫真正的自由。"),
      ],
    },
    {
      id: "xiaozhi",
      title: "單元二・小知",
      summary: "蜩與學鳩笑之曰",
      lines: [
        M("鵬要飛到九萬里外的南海。路邊有蟬，還有小鳩，笑著說——"),
        F("「我們一下子起飛，碰到榆樹就下來了。何必飛那麼遠？」"),
        M("聽起來很合理，對吧？飛近一點就好，為什麼那麼累？"),
        F("可是……它們是用自己的飛行距離，去笑別人的路程。"),
        M("這就是小知笑大知。不是小的不好，而是：若只用自己的尺度衡量世界，很容易把別人的遠，當成多餘。"),
        F("那意思是什麼？我們平常也這樣嗎？"),
        M("很常。覺得別人的志向太高、路太遠、夢想不切實際——有時只是我們還沒看見另一種尺度。"),
      ],
    },
    {
      id: "xiaonian",
      title: "單元三・小年大年",
      summary: "朝菌不知晦朔",
      lines: [
        M("莊子接著談時間。朝生暮死的菌，不知道一個月的終始；夏生秋死的寒蟬，不知道春天和秋天。"),
        F("這叫「小年」。"),
        M("對。而楚國南方有冥靈樹，五百年當春天，五百年當秋天；上古大椿，甚至八千年為春、八千年為秋。"),
        F("同樣是「活過」，壽命不同，看見的世界就不一樣。"),
        M("所以莊子說：眾人拿彭祖的長壽來比較，不也可悲嗎？比較本身，常常把生命縮成一條尺子。"),
        F("那這一單元的意思，是叫我們別比壽命？"),
        M("更深一點：別急著用自己經驗過的「短」，去否定別人經驗裡的「長」。見識的邊界，往往比壽命更窄。"),
      ],
    },
    {
      id: "youdai",
      title: "單元四・有待",
      summary: "列子御風，猶有所待",
      lines: [
        M("再說列子。他能駕風而行，輕妙可喜，十五天後才回來。看起來，很瀟灑。"),
        F("聽起來已經很自由了啊。"),
        M("可是莊子輕輕點一句：這雖然免於走路，卻「猶有所待」——還要等那陣風。"),
        F("啊……所以自由若還依賴條件，就還不是徹底的逍遙。"),
        M("風積得不夠厚，也托不起大翅膀。鵬飛得遠，需要厚積的風；列子御風，也需要風來。"),
        F("那真正的「無待」是什麼？"),
        M("順天地之正理，應六氣的變化，遊於無窮——少一點對外在條件的黏著。不是更用力飛，而是少一點依賴。"),
      ],
    },
    {
      id: "zhiren",
      title: "單元五・至人",
      summary: "至人無己，神人無功，聖人無名",
      lines: [
        M("莊子於是說出三句總綱：至人無己，神人無功，聖人無名。"),
        F("無己、無功、無名……聽起來像要我們放棄一切？"),
        M("不是叫你變空白。而是：少被「我一定要怎樣」綁住；少被功業證明綁住；少被名聲評價綁住。"),
        F("所以「無」不是否定生命，而是鬆開那些把心勒緊的繩子。"),
        M("對。前面的鯤鵬、小知、有待，都在為這三句鋪路：真正的遊，從鬆開開始。"),
      ],
    },
    {
      id: "wuyong",
      title: "單元六・無用之用",
      summary: "大樹樹於無何有之鄉",
      lines: [
        M("最後，惠子抱怨：我有一棵大樹，大是大，可是沒有用。木匠看了也不想要。"),
        F("很多人對「無用」都很焦慮呢。"),
        M("莊子卻說：何不把它種在空曠無人的地方？在樹旁徘徊，在樹下逍遙躺臥。因為沒什麼用，反而不會被斧頭盯上。"),
        F("這就是「無用之用」——被叫做無用的東西，有時正好保住了生命，也保住了自由。"),
        M("〈逍遙遊〉一路從大想像走到這裡：不是教你變得更有用，而是問——你是否被「有用」追得太緊，反而遊不動了？"),
        F("嗯。今天這幾單元，我最想帶走的是：先鬆開尺度，再談自由。"),
        M("很好。懂多少算多少。若還想細讀，就翻回文字；若想再聽，我們下一單元見。時光靜好。"),
      ],
    },
  ],
};

function plainFromMarkdown(text: string): string {
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

function splitSections(content: string): { title: string; body: string }[] {
  const parts: { title: string; body: string }[] = [];
  let current = { title: "開卷", body: "" };
  for (const line of content.split("\n")) {
    if (line.startsWith("## ")) {
      if (current.body.trim() || current.title !== "開卷") parts.push(current);
      current = { title: line.replace(/^##\s+/, ""), body: "" };
    } else {
      current.body += `${line}\n`;
    }
  }
  if (current.body.trim() || parts.length === 0) parts.push(current);
  return parts.filter((p) => p.body.trim().length > 0 || p.title !== "開卷");
}

const PREFERRED_SECTION = /(原典|白話|哲學|現代人生|篇名|總結|常見誤解)/;

/**
 * Build a conversational fallback show from chapter markdown sections.
 * Used when a handcrafted script is not yet available.
 */
export function buildFallbackPodcast(
  slug: string,
  title: string,
  content: string,
): PodcastShow {
  const sections = splitSections(content);
  const picked = sections.filter((s) => PREFERRED_SECTION.test(s.title)).slice(0, 6);
  const use = picked.length >= 2 ? picked : sections.slice(0, Math.min(5, sections.length));

  const episodes: PodcastEpisode[] = [
    {
      id: "open",
      title: "單元〇・開場",
      summary: `輕鬆進入〈${title}〉`,
      lines: [
        M(`你好。今天我們用聊天的方式，慢慢走進〈${title}〉。`),
        F("好啊。先說故事，再講意思，好不好？"),
        M("好。不必一次記住全部，舒服最重要。"),
      ],
    },
  ];

  use.forEach((sec, i) => {
    const plain = plainFromMarkdown(sec.body);
    const snippet = plain.slice(0, 160);
    const restHint = plain.length > 160 ? "……其餘我們慢慢看。" : "";
    const cleanTitle = sec.title.replace(/^\d+\.\s*/, "");

    episodes.push({
      id: `unit-${i + 1}`,
      title: `單元${["一", "二", "三", "四", "五", "六"][i] ?? i + 1}・${cleanTitle.slice(0, 12)}`,
      summary: cleanTitle,
      lines: [
        M(`這一節，標題是「${cleanTitle}」。我先說個大概。${snippet}${restHint}`),
        F("嗯……那這一段，想讓我們記住的意思是什麼？"),
        M(
          `不妨先這樣想：〈${title}〉在這裡放這一節，是要我們沿著原文脈絡往前走，而不是急著下結論。懂多少算多少。`,
        ),
        F("好，那我們先停在這裡，下一單元再繼續。"),
      ],
    });
  });

  if (episodes.length === 1) {
    episodes.push({
      id: "listen",
      title: "單元一・靜聽",
      summary: "樹下暫歇",
      lines: [
        M(`〈${title}〉的細節還在慢慢寫。今天我們先用輕鬆的心情陪著文字停一下。`),
        F("像坐在大樹下聽風一樣？"),
        M("對。讀完若還想深入，再回到純文字慢慢看。時光靜好。"),
      ],
    });
  }

  return { slug, title, episodes };
}

export function getPodcastShow(
  slug: string,
  title: string,
  content?: string,
): PodcastShow {
  if (slug === "逍遙遊") return XIAOYAOYOU_SHOW;
  return buildFallbackPodcast(slug, title, content ?? "");
}

/** Flatten episode lines to plain text (for simple players / previews). */
export function episodeToPlainText(episode: PodcastEpisode): string {
  return episode.lines.map((l) => l.text).join("");
}
