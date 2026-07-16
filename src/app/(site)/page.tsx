import Link from "next/link";
import { CHAPTERS, SITE, chaptersByPart, PART_ORDER } from "@/lib/catalog";
import { assetPath } from "@/lib/assetPath";
import {
  immersiveChapterHref,
  VIEW_MODE_LABELS,
  VIEW_MODES,
  type ViewMode,
} from "@/lib/immersiveMode";

const MODE_HINTS: Record<ViewMode, string> = {
  text: "清水玻璃書頁",
  immersive: "山上・樹下・微風",
  pict: "lo-fi 繪本翻頁",
  podcast: "一男一女導讀對談",
};

export default function HomePage() {
  const inner = chaptersByPart("內篇");
  const drafted = CHAPTERS.filter((c) => c.status !== "skeleton").length;

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-line/70 bg-gradient-to-br from-[#f8fbf9] via-[#eef5f1] to-[#e4ebe4] px-6 py-12 sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 15%, rgba(255,244,220,0.7), transparent 42%), radial-gradient(circle at 88% 10%, rgba(61,92,79,0.1), transparent 40%)",
          }}
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-xs tracking-[0.28em] text-muted">時光靜好・沉浸閱讀</p>
            <p className="font-serif text-4xl sm:text-5xl tracking-wide text-ink">
              {SITE.title}
            </p>
            <p className="text-lg text-muted">{SITE.subtitle}</p>
            <p className="text-base leading-relaxed text-ink/85 max-w-xl">
              山上讀書一鍵四版：純文字、沉浸、繪圖、播客。頁內即可切換，重整後仍記住你的選擇。
            </p>
            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              {VIEW_MODES.map((mode) => (
                <Link
                  key={mode}
                  href={immersiveChapterHref("逍遙遊", mode)}
                  className={`rounded-2xl px-4 py-3 text-sm transition ${
                    mode === "immersive"
                      ? "bg-accent text-white shadow-[0_10px_28px_rgba(61,92,79,0.22)] hover:opacity-90"
                      : "border border-line bg-white/55 hover:border-accent/50"
                  }`}
                >
                  <span className="font-medium">{VIEW_MODE_LABELS[mode]}</span>
                  <span
                    className={`mt-0.5 block text-xs ${
                      mode === "immersive" ? "text-white/80" : "text-muted"
                    }`}
                  >
                    {MODE_HINTS[mode]}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/immersive/"
                className="rounded-full border border-line/80 bg-white/35 px-5 py-3 text-sm text-muted hover:text-ink transition"
              >
                山上總覽
              </Link>
              <Link
                href="/toc/"
                className="rounded-full border border-line/80 bg-white/35 px-5 py-3 text-sm text-muted hover:text-ink transition"
              >
                全書目錄
              </Link>
              <Link
                href="/download/"
                className="rounded-full border border-line/80 bg-white/35 px-5 py-3 text-sm text-muted hover:text-ink transition"
              >
                下載印刷版
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/immersive/pict/mood-traveler-lofi.png")}
              alt=""
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/immersive/pict/pict-kunpeng-lofi.png")}
              alt=""
              className="mt-6 aspect-[4/3] w-full rounded-2xl object-cover shadow-md"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "篇章", value: `${CHAPTERS.length}` },
          { label: "版本", value: `v${SITE.version}` },
          { label: "正文狀態", value: `${drafted} 篇 draft` },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-line/70 bg-white/40 px-5 py-4 backdrop-blur-sm"
          >
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 font-serif text-3xl text-ink/90">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl text-ink/90">內篇速覽</h2>
          <Link href="/immersive/" className="text-sm text-accent hover:underline">
            山上讀 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {inner.map((ch) => (
            <Link
              key={ch.id}
              href={immersiveChapterHref(ch.slug, "immersive")}
              className="group rounded-2xl border border-line/70 bg-white/35 px-5 py-4 hover:border-accent/40 transition"
            >
              <p className="text-xs text-muted">
                {ch.part} · {ch.id}
              </p>
              <p className="mt-1 font-serif text-xl group-hover:text-accent transition">
                〈{ch.title}〉
              </p>
              <p className="mt-2 text-sm text-muted line-clamp-2">{ch.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl text-ink/90">知識庫板塊</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["/maps/", "思想地圖", "概念節點互相連結"],
            ["/figures/", "人物百科", "惠子、列子、庖丁…"],
            ["/terms/", "名詞百科", "無待、心齋、坐忘…"],
            ["/themes/", "主題閱讀", "焦慮、死亡、工作…"],
            ["/ai/", "莊子 AI", "檢索本庫內容並附上來源"],
            ["/search/", "搜尋", "全文檢索"],
            ["/download/", "下載印刷版", "HTML／Markdown 成冊稿，影印裝訂"],
          ].map(([href, title, desc]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-line/70 px-4 py-4 bg-white/30 hover:border-accent/40 transition"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-line px-5 py-4 text-sm text-muted">
        <p>
          內容現況：全書 {CHAPTERS.length} 篇皆為{" "}
          <strong className="text-ink">draft</strong>
          （架構正文已齊，尚未達出版級 review／published）。版本路線仍依{" "}
          {PART_ORDER.filter((p) => p !== "附錄").join(" → ")}。
        </p>
      </section>
    </div>
  );
}
