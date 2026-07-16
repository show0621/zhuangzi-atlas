import { CHAPTERS } from "@/lib/catalog";
import { readChapter } from "@/lib/content";
import { SearchClient } from "@/components/SearchClient";

export const metadata = {
  title: "搜尋",
};

export default function SearchPage() {
  const items = CHAPTERS.map((meta) => {
    const doc = readChapter(meta);
    return {
      slug: meta.slug,
      title: meta.title,
      part: meta.part,
      summary: meta.summary,
      text: doc?.content ?? meta.summary,
    };
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl">搜尋</h1>
        <p className="text-muted text-sm">
          V0.1 為全文關鍵字搜尋。之後可升級為主題聚合與「莊子 AI」引用回答。
        </p>
      </header>
      <SearchClient items={items} />
    </div>
  );
}
