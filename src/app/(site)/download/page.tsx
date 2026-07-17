import Link from "next/link";
import { SITE } from "@/lib/catalog";
import { assetPath, assetPathWithVersion } from "@/lib/assetPath";

export const metadata = {
  title: "下載印刷版",
  description: `下載《${SITE.title}》完整印刷 PDF、Word 與成冊稿，方便影印店列印裝訂。`,
};

const PDF_PRIMARY = {
  name: "zhuangzi-atlas-print.pdf",
  label: "下載完整書 PDF",
  desc: "A4 印刷版全書（封面、折頁作者介紹、題辭、出版資訊、自序、緒論、目錄含頁碼、篇章、後記）。編集：李孟霖。可直接下載帶到影印店。",
} as const;

const WORD_PRIMARY = {
  name: "zhuangzi-atlas-print.docx",
  label: "下載完整書 Word",
  desc: "前頁版式對齊印刷 PDF（極簡封面色塊、作者自敘折頁、題辭書法），正文可編輯；另含書脊頁。目錄頁碼以 PDF 為準。可用 Microsoft Word／WPS／Google Docs 開啟後再列印。",
  alias: "莊子全解-印刷版.docx",
} as const;

const COVER_WRAP = {
  name: "zhuangzi-atlas-cover-wrap.pdf",
  label: "封面展開 PDF（上機用）",
  desc: "菊16開 1:1：後勒口＋封底＋書脊＋封面＋前勒口（含 3mm 出血）。241頁／80g米色輕質估書脊 18mm。列印請選實際大小。",
  alias: "莊子全解-封面展開.pdf",
} as const;

const BINDING_PARTS = [
  COVER_WRAP,
  {
    name: "zhuangzi-atlas-cover.pdf",
    label: "封面 PDF（單頁示意）",
    desc: "與全書封面一致的單頁示意（非展開稿）。上機請用「封面展開 PDF」。",
    alias: "莊子全解-封面.pdf",
  },
  {
    name: "zhuangzi-atlas-back.pdf",
    label: "封底 PDF（單頁示意）",
    desc: "封底單頁示意；上機請用「封面展開 PDF」。",
    alias: "莊子全解-封底.pdf",
  },
  {
    name: "zhuangzi-atlas-spine.pdf",
    label: "書脊 PDF",
    desc: "菊16開 1:1 書脊條（預設約 18×210 mm）＋規格說明頁。",
    alias: "莊子全解-書脊.pdf",
  },
  {
    name: "zhuangzi-atlas-flap.pdf",
    label: "作者折頁 PDF",
    desc: "書面折頁｜作者介紹（李孟霖編集自敘）。",
    alias: "莊子全解-作者折頁.pdf",
  },
] as const;

const SPINE_WORD = {
  name: "zhuangzi-atlas-spine.docx",
  label: "下載書脊 Word",
  desc: "書脊 Word 示意版；正式裁切請用書脊 PDF 第 1 頁（1:1）。",
  alias: "莊子全解-書脊.docx",
} as const;

const FILES = [
  {
    name: "莊子全解-印刷版.pdf",
    label: "完整書 PDF（中文檔名）",
    desc: "與上方 PDF 內容相同，檔名為中文。",
  },
  {
    name: WORD_PRIMARY.alias,
    label: "完整書 Word（中文檔名）",
    desc: "與上方 Word 內容相同，檔名為中文。",
  },
  ...BINDING_PARTS.map((p) => ({
    name: p.alias,
    label: `${p.label.replace(" PDF", "")}（中文檔名）`,
    desc: p.desc,
  })),
  {
    name: SPINE_WORD.alias,
    label: "書脊 Word（中文檔名）",
    desc: "單獨書脊 Word，檔名為中文。",
  },
  {
    name: "zhuangzi-atlas-print.html",
    label: "印刷 HTML",
    desc: "可用瀏覽器開啟後自行「列印 → 另存為 PDF」。已設 A4 與較寬裝訂邊。",
  },
  {
    name: "zhuangzi-atlas-print.md",
    label: "印刷 Markdown",
    desc: "完整成冊原稿，可用編輯器或 pandoc 再開。",
  },
  {
    name: "README-列印說明.md",
    label: "列印／裝訂說明",
    desc: "影印店成冊步驟與重新產生指令。",
  },
] as const;

const PAGES_DOWNLOAD =
  "https://show0621.github.io/zhuangzi-atlas/download/";
const STREAMLIT_HINT =
  "若你目前在 Streamlit 手機版閱讀，PDF 下載請改到本頁（Next 網站）。";

export default function DownloadPage() {
  const pdfHref = assetPathWithVersion(`/downloads/${PDF_PRIMARY.name}`);
  const pdfAliasHref = assetPathWithVersion(`/downloads/${FILES[0].name}`);
  const wordHref = assetPathWithVersion(`/downloads/${WORD_PRIMARY.name}`);
  const wordAliasHref = assetPathWithVersion(`/downloads/${WORD_PRIMARY.alias}`);
  const spineWordHref = assetPathWithVersion(`/downloads/${SPINE_WORD.name}`);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs tracking-[0.2em] text-muted">PRINT · BIND · WORD</p>
        <h1 className="font-serif text-3xl text-ink">下載印刷版</h1>
        <p className="max-w-2xl text-muted leading-relaxed">
          將《{SITE.title}》匯出為可影印、可膠裝的成冊稿：含封面、題辭、出版資訊、自序、緒論、目錄與全書篇章。編集：{SITE.author}。另提供封面／封底／書脊／作者折頁單獨 PDF。
        </p>
      </header>

      <section className="rounded-2xl border-2 border-accent bg-accent/8 px-6 py-8 space-y-5 shadow-[0_12px_36px_rgba(61,92,79,0.12)]">
        <p className="text-xs tracking-[0.18em] text-accent font-medium">
          主要下載
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink">
          PDF 與 Word
        </h2>
        <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
          {PDF_PRIMARY.desc}
        </p>
        <p className="text-sm text-muted leading-relaxed max-w-xl">
          {WORD_PRIMARY.desc}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href={pdfHref}
            download={PDF_PRIMARY.name}
            className="inline-flex items-center justify-center rounded-full bg-accent px-10 py-4 text-lg font-medium text-white shadow-md transition hover:opacity-92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            下載完整書 PDF
          </a>
          <a
            href={wordHref}
            download={WORD_PRIMARY.name}
            className="inline-flex items-center justify-center rounded-full bg-ink px-10 py-4 text-lg font-medium text-white shadow-md transition hover:opacity-92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            下載完整書 Word
          </a>
          <a
            href={pdfAliasHref}
            download={FILES[0].name}
            className="inline-flex items-center justify-center rounded-full border border-accent/40 bg-white/60 px-6 py-3 text-sm font-medium text-accent transition hover:bg-white"
          >
            PDF 中文檔名
          </a>
          <a
            href={wordAliasHref}
            download={WORD_PRIMARY.alias}
            className="inline-flex items-center justify-center rounded-full border border-ink/30 bg-white/60 px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
          >
            Word 中文檔名
          </a>
        </div>
        <p className="text-xs text-muted font-mono break-all">{pdfHref}</p>
        <p className="text-xs text-muted font-mono break-all">{wordHref}</p>
      </section>

      <section className="rounded-2xl border border-line/70 bg-white/45 px-6 py-7 space-y-5">
        <p className="text-xs tracking-[0.18em] text-muted font-medium">BINDING</p>
        <h2 className="font-serif text-2xl text-ink">裝幀單頁單獨下載</h2>
        <p className="text-sm text-muted leading-relaxed max-w-xl">
          上機請下載「封面展開 PDF」（勒口＋封底＋書脊＋封面＋勒口，菊16開 1:1）。其餘為單頁示意／書脊條，方便分檔校對。
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BINDING_PARTS.map((p) => {
            const href = assetPathWithVersion(`/downloads/${p.name}`);
            return (
              <li key={p.name} className="rounded-xl border border-line/60 bg-white/50 px-4 py-4 space-y-2">
                <p className="font-medium text-ink">{p.label}</p>
                <p className="text-sm text-muted leading-relaxed">{p.desc}</p>
                <a
                  href={href}
                  download={p.name}
                  className="inline-flex items-center justify-center rounded-full border border-accent bg-accent/10 px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent/15"
                >
                  下載 {p.label}
                </a>
                <p className="text-xs text-muted font-mono break-all">{href}</p>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center pt-1">
          <a
            href={spineWordHref}
            download={SPINE_WORD.name}
            className="inline-flex items-center justify-center rounded-full border border-ink/25 bg-white px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-paper"
          >
            另：書脊 Word
          </a>
          <p className="text-xs text-muted">本機重產：<code className="font-mono">npm run ebook:wrap</code>（展開）／<code className="font-mono">npm run ebook:binding</code></p>
        </div>
      </section>

      <section className="rounded-2xl border border-line/70 bg-white/35 px-5 py-5 space-y-2 text-sm leading-relaxed">
        <h2 className="font-serif text-xl text-ink/90">如何使用這本書</h2>
        <p className="text-ink/85">
          見書中<strong className="text-ink">緒論／導論</strong>
          〈導論：如何閱讀《莊子》〉——已說明三層聲音（原典／注家／現代詮釋）、寓言讀法與內外雜篇路線。印刷 PDF
          將導論編為緒論，置於目錄之前；網站亦可讀
          <Link href="/chapters/導論/" className="text-accent hover:underline mx-1">
            〈導論〉全文
          </Link>
          。此處不重複長文。
        </p>
        <p className="text-muted text-xs">{STREAMLIT_HINT}</p>
        <p className="text-muted text-xs">
          線上固定網址：
          <a
            href={PAGES_DOWNLOAD}
            className="text-accent hover:underline ml-1 break-all"
          >
            {PAGES_DOWNLOAD}
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-ink/90">成冊內容順序</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-ink/85">
          <li>封面（李孟霖編集）</li>
          <li>書面折頁｜作者介紹</li>
          <li>題辭頁</li>
          <li>出版資訊（編輯說明、版本、免責）</li>
          <li>《莊子全解》自序</li>
          <li>緒論（改編自〈導論〉）</li>
          <li>目錄</li>
          <li>內篇 → 外篇 → 雜篇正文</li>
          <li>後記／版權頁</li>
          <li>裝幀單頁：封面／封底／書脊／作者折頁請另下載（完整書 PDF 不含書脊；完整書 Word 末頁仍附書脊）</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-ink/90">其他格式</h2>
        <ul className="divide-y divide-line/70 border border-line rounded-xl overflow-hidden bg-paper/40">
          {FILES.map((f) => (
            <li key={f.name}>
              <a
                href={assetPathWithVersion(`/downloads/${f.name}`)}
                className="flex flex-col gap-1 px-4 py-4 hover:bg-paper-2/60 transition sm:flex-row sm:items-center sm:gap-4"
                download={f.name}
              >
                <span className="font-medium text-accent min-w-[10rem]">{f.label}</span>
                <span className="text-sm text-muted flex-1">{f.desc}</span>
                <span className="text-xs text-muted font-mono">{f.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line/70 bg-white/35 px-5 py-5 space-y-3 text-sm leading-relaxed">
        <h2 className="font-serif text-xl text-ink/90">如何列印成冊</h2>
        <ol className="list-decimal list-inside space-y-2 text-ink/85">
          <li>
            下載 <strong className="text-ink">完整書 PDF</strong> 或{" "}
            <strong className="text-ink">Word</strong>（上方按鈕），或開啟 HTML 自行另存。
          </li>
          <li>紙張選 <strong className="text-ink">A4</strong>；版面直向；左側已預留裝訂邊。</li>
          <li>帶到影印店：單面或雙面列印後，請店員<strong className="text-ink">左側膠裝</strong>。</li>
        </ol>
        <p className="text-muted">
          目前版本 v{SITE.version}（draft）。內容仍可能修訂；正式出版級請待 review／published。
        </p>
        <p className="text-muted text-xs">
          本機重新產生：<code className="font-mono">npm run ebook:print:all</code>
          （HTML／Markdown → PDF → Word → 裝幀單頁 → 書脊 Word）。
        </p>
      </section>

      <p className="text-sm text-muted">
        <Link href="/toc/" className="text-accent hover:underline">
          回全書目錄
        </Link>
        {" · "}
        <Link href="/immersive/" className="text-accent hover:underline">
          山上讀書
        </Link>
      </p>
    </div>
  );
}
