import Link from "next/link";
import { SITE } from "@/lib/catalog";
import { assetPath } from "@/lib/assetPath";

export const metadata = {
  title: "下載印刷版",
  description: `下載《${SITE.title}》印刷成冊稿（HTML／Markdown），方便影印店列印裝訂。`,
};

const FILES = [
  {
    name: "zhuangzi-atlas-print.html",
    label: "印刷 HTML（推薦）",
    desc: "用瀏覽器開啟後「列印 → 另存為 PDF」。已設 A4 與較寬裝訂邊。",
  },
  {
    name: "zhuangzi-atlas-print.md",
    label: "印刷 Markdown",
    desc: "完整成冊原稿，可用編輯器或 pandoc 再開。",
  },
  {
    name: "README-列印說明.md",
    label: "列印／裝訂說明",
    desc: "影印店成冊步驟與可選 pandoc 指令。",
  },
] as const;

export default function DownloadPage() {
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs tracking-[0.2em] text-muted">PRINT · BIND</p>
        <h1 className="font-serif text-3xl text-ink">下載印刷版</h1>
        <p className="max-w-2xl text-muted leading-relaxed">
          將《{SITE.title}》匯出為可影印、可膠裝的成冊稿：含封面、出版資訊、前文、緒論、目錄與全書篇章。適合帶到影印店列印裝訂。
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-ink/90">成冊內容順序</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-ink/85">
          <li>封面</li>
          <li>出版資訊（編輯說明、版本、免責）</li>
          <li>前文</li>
          <li>緒論（改編自〈導論〉）</li>
          <li>目錄</li>
          <li>內篇 → 外篇 → 雜篇正文</li>
          <li>後記／版權頁</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl text-ink/90">下載檔案</h2>
        <ul className="divide-y divide-line/70 border border-line rounded-xl overflow-hidden bg-paper/40">
          {FILES.map((f) => (
            <li key={f.name}>
              <a
                href={assetPath(`/downloads/${f.name}`)}
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
            下載並開啟 <strong className="text-ink">zhuangzi-atlas-print.html</strong>。
          </li>
          <li>
            按 <kbd className="rounded border border-line px-1.5 py-0.5 text-xs">Ctrl</kbd>+
            <kbd className="rounded border border-line px-1.5 py-0.5 text-xs">P</kbd>
            ，或點頁頂「列印／另存 PDF」。
          </li>
          <li>目的地選「另存為 PDF」；紙張選 A4；直向。</li>
          <li>帶到影印店：單面或雙面列印後，請店員<strong className="text-ink">左側膠裝</strong>。</li>
        </ol>
        <p className="text-muted">
          目前版本 v{SITE.version}（draft）。內容仍可能修訂；正式出版級請待 review／published。
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
