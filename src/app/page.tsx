import Link from "next/link";
import { CHAPTERS, SITE, chaptersByPart, PART_ORDER } from "@/lib/catalog";

export default function HomePage() {
  const inner = chaptersByPart("內篇");
  const publishedish = CHAPTERS.filter((c) => c.status !== "skeleton").length;

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#fbf8f1] via-[#f3ebe0] to-[#e4efe9] px-6 py-14 sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(47,93,80,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(139,69,19,0.1), transparent 35%)",
          }}
        />
        <div className="relative max-w-2xl space-y-5">
          <p className="font-serif text-4xl sm:text-5xl tracking-wide text-ink">
            {SITE.title}
          </p>
          <p className="text-lg text-muted">{SITE.subtitle}</p>
          <p className="text-base leading-relaxed text-ink/90">
            一本書 × 一個網站 × 一套 AI 知識庫。目標不是再出一本導讀，而是建立可檢索、可交叉引用、可出版的《莊子》數位知識庫。
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/chapters/逍遙遊/"
              className="rounded-md bg-accent px-5 py-2.5 text-sm text-white hover:opacity-90 transition"
            >
              開始閱讀〈逍遙遊〉
            </Link>
            <Link
              href="/toc/"
              className="rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm hover:border-accent transition"
            >
              全書目錄
            </Link>
            <Link
              href="/search/"
              className="rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm hover:border-accent transition"
            >
              搜尋
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          { label: "篇章骨架", value: `${CHAPTERS.length}` },
          { label: "目前版本", value: `v${SITE.version}` },
          { label: "已脫離骨架", value: `${publishedish}` },
        ].map((stat) => (
          <div key={stat.label} className="border border-line rounded-xl px-5 py-4 bg-paper/50">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 font-serif text-3xl">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">版本路線</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm">
          {[
            ["V0.1", "骨架：網站、電子書、33 篇範本"],
            ["V0.2", "導論 + 內篇 7 篇"],
            ["V0.3", "外篇 15 篇"],
            ["V0.4", "雜篇 11 篇"],
            ["V1.0", "出版版：索引、地圖、百科齊備"],
          ].map(([ver, desc]) => (
            <li key={ver} className="rounded-xl border border-line bg-paper/40 px-4 py-3">
              <p className="font-medium text-accent">{ver}</p>
              <p className="mt-1 text-muted">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl">內篇速覽</h2>
          <Link href="/toc/" className="text-sm text-accent hover:underline">
            看全部 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {inner.map((ch) => (
            <Link
              key={ch.id}
              href={`/chapters/${ch.slug}/`}
              className="group rounded-xl border border-line bg-paper/50 px-5 py-4 hover:border-accent transition"
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
        <h2 className="font-serif text-2xl">知識庫板塊</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["/maps/", "思想地圖", "概念節點互相連結"],
            ["/figures/", "人物百科", "惠子、列子、庖丁…"],
            ["/terms/", "名詞百科", "無待、心齋、坐忘…"],
            ["/themes/", "主題閱讀", "焦慮、死亡、工作…"],
          ].map(([href, title, desc]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-line px-4 py-4 bg-paper/40 hover:border-accent transition"
            >
              <p className="font-medium">{title}</p>
              <p className="mt-1 text-sm text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-line px-5 py-4 text-sm text-muted">
        <p>
          目前為 <strong className="text-ink">V0.1 骨架</strong>。內容撰寫請依{" "}
          <code className="text-ink">AGENTS.md</code> 與{" "}
          <code className="text-ink">prompts/chapter-template.md</code>
          ；完成一篇後將 frontmatter 的 <code className="text-ink">status</code>{" "}
          更新為 draft／review／published。
        </p>
        <p className="mt-2">全書結構板塊：{PART_ORDER.filter((p) => p !== "附錄").join(" → ")}</p>
      </section>
    </div>
  );
}
