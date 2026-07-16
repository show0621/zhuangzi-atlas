"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SearchItem = {
  slug: string;
  title: string;
  part: string;
  summary: string;
  text: string;
};

export function SearchClient({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    return items
      .map((item) => {
        const hay = `${item.title}\n${item.summary}\n${item.text}`.toLowerCase();
        if (!hay.includes(query)) return null;
        const idx = item.text.toLowerCase().indexOf(query);
        const excerpt =
          idx >= 0
            ? item.text.slice(Math.max(0, idx - 40), idx + query.length + 80).replace(/\s+/g, " ")
            : item.summary;
        let score = 0;
        if (item.title.toLowerCase().includes(query)) score += 10;
        if (item.summary.toLowerCase().includes(query)) score += 5;
        score += hay.split(query).length - 1;
        return { ...item, excerpt, score };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score);
  }, [items, q]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex gap-2"
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="例如：無待、焦慮、惠子、夢蝶…"
          className="flex-1 rounded-md border border-line bg-paper px-3 py-2 outline-none focus:border-accent"
        />
      </form>

      {q && (
        <p className="text-sm text-muted">
          「{q}」共 {results.length} 筆
        </p>
      )}

      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.slug} className="rounded-xl border border-line bg-paper/50 px-4 py-3">
            <Link href={`/chapters/${r.slug}/`} className="font-serif text-lg hover:text-accent">
              〈{r.title}〉
            </Link>
            <p className="text-xs text-muted mt-0.5">{r.part}</p>
            <p className="text-sm text-muted mt-2 line-clamp-3">{r.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
