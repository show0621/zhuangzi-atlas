/**
 * 莊子全解 — 全書篇章目錄（單一真相來源）
 * 新增／調整篇章順序時，請只改這裡。
 */

export type ChapterPart = "導論" | "內篇" | "外篇" | "雜篇" | "附錄";

export type ChapterMeta = {
  id: string;
  slug: string;
  title: string;
  part: ChapterPart;
  order: number;
  status: "skeleton" | "draft" | "review" | "published";
  summary: string;
};

export const SITE = {
  title: "莊子全解",
  subtitle: "原典・白話・哲學・人生智慧",
  englishTitle: "Zhuangzi Atlas",
  description:
    "中文世界最完整的《莊子》數位知識庫：原典、白話、歷代注家、哲學分析、現代應用與思想地圖。",
  version: "0.3.0",
  author: "李孟霖編集",
} as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    id: "00",
    slug: "導論",
    title: "導論：如何閱讀《莊子》",
    part: "導論",
    order: 0,
    status: "draft",
    summary: "成書、版本、讀法、全書地圖與本專案體例說明。",
  },
  // 內篇
  {
    id: "01",
    slug: "逍遙遊",
    title: "逍遙遊",
    part: "內篇",
    order: 1,
    status: "draft",
    summary: "由鯤鵬至無待：小大之辯、有待／無待、至人無己，以及惠子「無用之用」。",
  },
  {
    id: "02",
    slug: "齊物論",
    title: "齊物論",
    part: "內篇",
    order: 2,
    status: "draft",
    summary: "是非相對、物我一體，以及「莊周夢蝶」的認識論與存在論。",
  },
  {
    id: "03",
    slug: "養生主",
    title: "養生主",
    part: "內篇",
    order: 3,
    status: "draft",
    summary: "庖丁解牛與養生之道：緣督以為經，安時而處順。",
  },
  {
    id: "04",
    slug: "人間世",
    title: "人間世",
    part: "內篇",
    order: 4,
    status: "draft",
    summary: "亂世處世、心齋、無用之用，與在人際政治中的保全之道。",
  },
  {
    id: "05",
    slug: "德充符",
    title: "德充符",
    part: "內篇",
    order: 5,
    status: "draft",
    summary: "形殘德全：外形與內德的辯證，以及「才全而德不形」。",
  },
  {
    id: "06",
    slug: "大宗師",
    title: "大宗師",
    part: "內篇",
    order: 6,
    status: "draft",
    summary: "真人、坐忘、死生一體，與以道為宗師的生命態度。",
  },
  {
    id: "07",
    slug: "應帝王",
    title: "應帝王",
    part: "內篇",
    order: 7,
    status: "draft",
    summary: "無為而治與渾沌之死：政治哲學中的「應」而不強為。",
  },
  // 外篇
  {
    id: "08",
    slug: "駢拇",
    title: "駢拇",
    part: "外篇",
    order: 8,
    status: "draft",
    summary: "以駢拇枝指、附贅縣疣為喻，辨仁義外加與性命之情；伯夷、盜跖名號異而傷性同。",
  },
  {
    id: "09",
    slug: "馬蹄",
    title: "馬蹄",
    part: "外篇",
    order: 9,
    status: "draft",
    summary: "馬之真性對照伯樂治馬、陶匠治埴木；治天下之過在於以規矩鉤繩強物就範，並以赫胥氏之民寫素樸。",
  },
  {
    id: "10",
    slug: "胠篋",
    title: "胠篋",
    part: "外篇",
    order: 10,
    status: "draft",
    summary: "由守篋反為大盜積，寫田成子盜齊並盜聖知之法；盜亦有道，聖人不死則大盜不止。",
  },
  {
    id: "11",
    slug: "在宥",
    title: "在宥",
    part: "外篇",
    order: 11,
    status: "draft",
    summary: "聞在宥天下，不聞治天下；崔瞿問老聃、廣成子教黃帝、雲將遇鴻蒙，層層收束於無為而安性命之情。",
  },
  {
    id: "12",
    slug: "天地",
    title: "天地",
    part: "外篇",
    order: 12,
    status: "draft",
    summary: "天地之德、帝王之道與「無為」的宇宙論基礎。",
  },
  {
    id: "13",
    slug: "天道",
    title: "天道",
    part: "外篇",
    order: 13,
    status: "draft",
    summary: "天道運轉與人事相應：虛靜恬淡與治國修身。",
  },
  {
    id: "14",
    slug: "天運",
    title: "天運",
    part: "外篇",
    order: 14,
    status: "draft",
    summary: "天運無常與禮樂興廢：時變中的適應與超脫。",
  },
  {
    id: "15",
    slug: "刻意",
    title: "刻意",
    part: "外篇",
    order: 15,
    status: "draft",
    summary: "刻意尚行諸流品之批評，與養神之道。",
  },
  {
    id: "16",
    slug: "繕性",
    title: "繕性",
    part: "外篇",
    order: 16,
    status: "draft",
    summary: "繕性於俗學之失：復初與自得。",
  },
  {
    id: "17",
    slug: "秋水",
    title: "秋水",
    part: "外篇",
    order: 17,
    status: "draft",
    summary: "河伯與海若：大小相對、貴賤相對，與「無以人滅天」。",
  },
  {
    id: "18",
    slug: "至樂",
    title: "至樂",
    part: "外篇",
    order: 18,
    status: "draft",
    summary: "何為至樂？死生觀與「鼓盆而歌」。",
  },
  {
    id: "19",
    slug: "達生",
    title: "達生",
    part: "外篇",
    order: 19,
    status: "draft",
    summary: "達生之情：忘形、養神與技進乎道。",
  },
  {
    id: "20",
    slug: "山木",
    title: "山木",
    part: "外篇",
    order: 20,
    status: "draft",
    summary: "山木以不材得終其天年：處乎材與不材之間。",
  },
  {
    id: "21",
    slug: "田子方",
    title: "田子方",
    part: "外篇",
    order: 21,
    status: "draft",
    summary: "真畫者、溫伯雪子等寓言：真與偽、貌與神。",
  },
  {
    id: "22",
    slug: "知北遊",
    title: "知北遊",
    part: "外篇",
    order: 22,
    status: "draft",
    summary: "道不可言、知不知：關於「道」的否定進路。",
  },
  // 雜篇
  {
    id: "23",
    slug: "庚桑楚",
    title: "庚桑楚",
    part: "雜篇",
    order: 23,
    status: "draft",
    summary: "衛生之經與南榮趎問道：小成與大成。",
  },
  {
    id: "24",
    slug: "徐無鬼",
    title: "徐無鬼",
    part: "雜篇",
    order: 24,
    status: "draft",
    summary: "徐無鬼見魏武侯：真知、真賞與政治批判。",
  },
  {
    id: "25",
    slug: "則陽",
    title: "則陽",
    part: "雜篇",
    order: 25,
    status: "draft",
    summary: "則陽遊楚與蝸角之爭：大小、名實再論。",
  },
  {
    id: "26",
    slug: "外物",
    title: "外物",
    part: "雜篇",
    order: 26,
    status: "draft",
    summary: "外物不可必：任公子釣魚與得魚忘筌。",
  },
  {
    id: "27",
    slug: "寓言",
    title: "寓言",
    part: "雜篇",
    order: 27,
    status: "draft",
    summary: "寓言十九：莊子自我揭示敘事策略與「卮言」。",
  },
  {
    id: "28",
    slug: "讓王",
    title: "讓王",
    part: "雜篇",
    order: 28,
    status: "draft",
    summary: "讓王諸故事：貴生輕位與隱逸倫理（真偽莊問題另辨）。",
  },
  {
    id: "29",
    slug: "盜跖",
    title: "盜跖",
    part: "雜篇",
    order: 29,
    status: "draft",
    summary: "盜跖斥孔子：對禮教價值的激烈反詰。",
  },
  {
    id: "30",
    slug: "說劍",
    title: "說劍",
    part: "雜篇",
    order: 30,
    status: "draft",
    summary: "天子之劍與庶人之劍：以道論劍的政治寓言。",
  },
  {
    id: "31",
    slug: "漁父",
    title: "漁父",
    part: "雜篇",
    order: 31,
    status: "draft",
    summary: "漁父訓孔子：真者精誠之至，法天貴真。",
  },
  {
    id: "32",
    slug: "列御寇",
    title: "列御寇",
    part: "雜篇",
    order: 32,
    status: "draft",
    summary: "虛而遨遊、曹商使秦與莊子將死拒厚葬。",
  },
  {
    id: "33",
    slug: "天下",
    title: "天下",
    part: "雜篇",
    order: 33,
    status: "draft",
    summary: "道術將為天下裂：墨／宋尹／彭田慎／關老／莊譜系。",
  },
];

export const PART_ORDER: ChapterPart[] = ["導論", "內篇", "外篇", "雜篇", "附錄"];

export function getChapterBySlug(slug: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chaptersByPart(part: ChapterPart): ChapterMeta[] {
  return CHAPTERS.filter((c) => c.part === part).sort((a, b) => a.order - b.order);
}
