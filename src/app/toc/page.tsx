import Link from "next/link";
import { CHAPTERS, PART_ORDER, type ChapterPart } from "@/lib/catalog";

export const metadata = {
  title: "全書目錄",
};

export default function TocPage() {
  const parts = PART_ORDER.filter((p) => p !== "附錄") as ChapterPart[];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">全書目錄</h1>
        <p className="text-muted">依原典內／外／雜篇順序排列。點選進入各篇出版級章節頁。</p>
      </header>

      {parts.map((part) => {
        const list = CHAPTERS.filter((c) => c.part === part);
        return (
          <section key={part} className="space-y-3">
            <h2 className="font-serif text-2xl border-b border-line pb-2">{part}</h2>
            <ul className="divide-y divide-line/70 border border-line rounded-xl overflow-hidden bg-paper/40">
              {list.map((ch) => (
                <li key={ch.id}>
                  <Link
                    href={`/chapters/${ch.slug}/`}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3 hover:bg-paper-2/60 transition"
                  >
                    <span className="w-10 shrink-0 text-sm text-muted tabular-nums">
                      {ch.id}
                    </span>
                    <span className="font-serif text-lg flex-1">〈{ch.title}〉</span>
                    <span className="text-xs uppercase tracking-wide text-muted">
                      {ch.status}
                    </span>
                    <span className="text-sm text-muted sm:max-w-md sm:text-right line-clamp-1">
                      {ch.summary}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
