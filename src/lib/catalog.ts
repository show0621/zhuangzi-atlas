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
    status: "review",
    summary: "成書、版本、讀法、全書地圖與本專案體例說明。",
  },
  // 內篇
  {
    id: "01",
    slug: "逍遙遊",
    title: "逍遙遊",
    part: "內篇",
    order: 1,
    status: "review",
    summary: "由鯤鵬至無待：小大之辯、有待／無待、至人無己，以及惠子「無用之用」。本篇為全書自由觀的總綱。",
  },
  {
    id: "02",
    slug: "齊物論",
    title: "齊物論",
    part: "內篇",
    order: 2,
    status: "published",
    summary: "由天籟、成心、是非之辯至莊周夢蝶，考察如何鬆開自以為是的尺度。",
  },
  {
    id: "03",
    slug: "養生主",
    title: "養生主",
    part: "內篇",
    order: 3,
    status: "published",
    summary: "以緣督、庖丁解牛與秦失弔老聃，討論保全生命、順其自然與死生之變。",
  },
  {
    id: "04",
    slug: "人間世",
    title: "人間世",
    part: "內篇",
    order: 4,
    status: "published",
    summary: "由顏回使衛、心齋與支離疏諸寓言，討論亂世中不以正直自傷的處世工夫。",
  },
  {
    id: "05",
    slug: "德充符",
    title: "德充符",
    part: "內篇",
    order: 5,
    status: "published",
    summary: "以王駘、申徒嘉與哀駘它等形殘者，反省以形貌、才能與名位衡量人的偏見。",
  },
  {
    id: "06",
    slug: "大宗師",
    title: "大宗師",
    part: "內篇",
    order: 6,
    status: "published",
    summary: "由真人、相忘於江湖與子桑戶之死，探問以道為宗師的死生工夫。",
  },
  {
    id: "07",
    slug: "應帝王",
    title: "應帝王",
    part: "內篇",
    order: 7,
    status: "published",
    summary: "以巫咸、神巫、蒲衣子與渾沌之死，探問不以控制傷害萬物的政治。",
  },
  // 外篇
  {
    id: "08",
    slug: "駢拇",
    title: "駢拇",
    part: "外篇",
    order: 8,
    status: "review",
    summary: "以駢拇枝指、附贅縣疣為喻，辨仁義外加與性命之情；伯夷、盜跖名號異而傷性同。",
  },
  {
    id: "09",
    slug: "馬蹄",
    title: "馬蹄",
    part: "外篇",
    order: 9,
    status: "review",
    summary: "馬之真性對照伯樂治馬、陶匠治埴木；治天下之過在於以規矩鉤繩強物就範，並以赫胥氏之民寫素樸。",
  },
  {
    id: "10",
    slug: "胠篋",
    title: "胠篋",
    part: "外篇",
    order: 10,
    status: "review",
    summary: "由守篋反為大盜積，寫田成子盜齊並盜聖知之法；盜亦有道，聖人不死則大盜不止。",
  },
  {
    id: "11",
    slug: "在宥",
    title: "在宥",
    part: "外篇",
    order: 11,
    status: "review",
    summary: "聞在宥天下，不聞治天下；崔瞿問老聃、廣成子教黃帝、雲將遇鴻蒙，層層收束於無為而安性命之情。",
  },
  {
    id: "12",
    slug: "天地",
    title: "天地",
    part: "外篇",
    order: 12,
    status: "review",
    summary: "天地化均與帝王之德；漢陰丈人拒桔槔而護純白，由機心轉入忘乎物、入於天。",
  },
  {
    id: "13",
    slug: "天道",
    title: "天道",
    part: "外篇",
    order: 13,
    status: "published",
    summary: "天道運而無所積；虛靜恬淡為帝王之休；君臣父子有序；輪扁斫輪示不可盡傳之知。",
  },
  {
    id: "14",
    slug: "天運",
    title: "天運",
    part: "外篇",
    order: 14,
    status: "review",
    summary: "天其運乎與禮樂興廢；芻狗、推舟於陸；孔子見老聃論六經陳跡與烏鵲孺之化。",
  },
  {
    id: "15",
    slug: "刻意",
    title: "刻意",
    part: "外篇",
    order: 15,
    status: "published",
    summary: "刻意尚行諸士之偏尚；導引養形對出養神；純粹不雜、淡然無極為天地之道。",
  },
  {
    id: "16",
    slug: "繕性",
    title: "繕性",
    part: "外篇",
    order: 16,
    status: "review",
    summary: "由俗學、仁義與成心對性命的增飾，回到不失其初的自得。",
  },
  {
    id: "17",
    slug: "秋水",
    title: "秋水",
    part: "外篇",
    order: 17,
    status: "published",
    summary: "河伯見海若而知小大無定；由尺度之相對，進到不以人滅天的生命分際。",
  },
  {
    id: "18",
    slug: "至樂",
    title: "至樂",
    part: "外篇",
    order: 18,
    status: "review",
    summary: "由至樂之問、髑髏之辯與鼓盆而歌，辨快樂、生命變化與哀傷的分際。",
  },
  {
    id: "19",
    slug: "達生",
    title: "達生",
    part: "外篇",
    order: 19,
    status: "published",
    summary: "由養生、忘形到工巧，說明通達生命在於不以外物傷神。",
  },
  {
    id: "20",
    slug: "山木",
    title: "山木",
    part: "外篇",
    order: 20,
    status: "published",
    summary: "山木不材得全、雁不材被殺；在材與不材間，尋求不為物役的處世分際。",
  },
  {
    id: "21",
    slug: "田子方",
    title: "田子方",
    part: "外篇",
    order: 21,
    status: "review",
    summary: "以溫伯雪子、真畫者與魯哀公等故事，辨真偽、形神與不為名役。",
  },
  {
    id: "22",
    slug: "知北遊",
    title: "知北遊",
    part: "外篇",
    order: 22,
    status: "review",
    summary: "知向北方求道而不得，以道不可言、不可知的問答，轉入體道與不知之知。",
  },
  // 雜篇
  {
    id: "23",
    slug: "庚桑楚",
    title: "庚桑楚",
    part: "雜篇",
    order: 23,
    status: "review",
    summary: "庚桑楚居畏壘、南榮趎問道；以衛生之經與「全汝形、抱汝生」論保全生命，並釐清道、德、形、名的層次。",
  },
  {
    id: "24",
    slug: "徐無鬼",
    title: "徐無鬼",
    part: "雜篇",
    order: 24,
    status: "published",
    summary: "徐無鬼見魏武侯，以相狗相馬諷用人；匠石運斤見「質」之可貴；並以真人之過反省政治與真賞。",
  },
  {
    id: "25",
    slug: "則陽",
    title: "則陽",
    part: "雜篇",
    order: 25,
    status: "published",
    summary: "則陽遊楚、少知問太公調；戴晉人以蝸角蠻觸之爭，逼問名實與政治尺度。",
  },
  {
    id: "26",
    slug: "外物",
    title: "外物",
    part: "雜篇",
    order: 26,
    status: "review",
    summary: "外物不可必；任公子大鉤釣魚；得魚忘筌、得意忘言——論外在條件與言意工具的關係。",
  },
  {
    id: "27",
    slug: "寓言",
    title: "寓言",
    part: "雜篇",
    order: 27,
    status: "review",
    summary: "「寓言十九、重言十七、卮言日出，和以天倪」：本篇自我揭示莊子式說話方法，並以陽子居、曾子等故事示範語言如何鬆動成見。",
  },
  {
    id: "28",
    slug: "讓王",
    title: "讓王",
    part: "雜篇",
    order: 28,
    status: "review",
    summary: "堯舜讓天下、大王去邠、原憲曾子安貧等故事串成的尊生輕位敘事；宜作後出道家隱逸材料讀，勿逕稱為莊周親筆政論。",
  },
  {
    id: "29",
    slug: "盜跖",
    title: "盜跖",
    part: "雜篇",
    order: 29,
    status: "review",
    summary: "孔子見盜跖的誇飾辯難：以盜賊之口反詰仁義、名譽與聖王敘事的偽善；屬雜篇戲劇體，須先辨文類再談義理。",
  },
  {
    id: "30",
    slug: "說劍",
    title: "說劍",
    part: "雜篇",
    order: 30,
    status: "review",
    summary: "趙文王好劍，莊子以庶人劍、諸侯劍、天子劍三層譬喻，把嗜殺之慾轉譯為治國尺度的政治諷喻。",
  },
  {
    id: "31",
    slug: "漁父",
    title: "漁父",
    part: "雜篇",
    order: 31,
    status: "review",
    summary: "漁父於緇帷之林訓孔子：真者精誠之至，法天貴真；禮樂儀文若失誠，則徒成飾偽。",
  },
  {
    id: "32",
    slug: "列御寇",
    title: "列御寇",
    part: "雜篇",
    order: 32,
    status: "review",
    summary: "列子食於十漿、伯昏無人警「虛而遨遊」；曹商使秦諷刺啖名；莊子將死拒厚葬，以天地為棺槨。",
  },
  {
    id: "33",
    slug: "天下",
    title: "天下",
    part: "雜篇",
    order: 33,
    status: "review",
    summary: "全書學術史收束：道術將為天下裂；依序衡定墨、宋尹、彭田慎、關老與莊周，並以寓言／重言／卮言自述莊學。",
  },
];

export const PART_ORDER: ChapterPart[] = ["導論", "內篇", "外篇", "雜篇", "附錄"];

export function getChapterBySlug(slug: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chaptersByPart(part: ChapterPart): ChapterMeta[] {
  return CHAPTERS.filter((c) => c.part === part).sort((a, b) => a.order - b.order);
}
