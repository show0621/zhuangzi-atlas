"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import gsap from "gsap";
import { AmbientWind } from "./AmbientWind";
import { NarrationPlayer } from "./NarrationPlayer";
import { PictureBookMode } from "./PictureBookMode";

type ChapterOption = { slug: string; title: string; part: string };
type ViewMode = "text" | "pict";

export function ImmersiveBook({
  slug,
  title,
  part,
  content,
  chapters,
}: {
  slug: string;
  title: string;
  part: string;
  content: string;
  chapters: ChapterOption[];
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [mode, setMode] = useState<ViewMode>("pict");

  const sections = useMemo(() => {
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
  }, [content]);

  const idx = Math.min(sectionIndex, Math.max(0, sections.length - 1));
  const current = sections[idx] ?? { title: title, body: content };
  const chapterIdx = chapters.findIndex((c) => c.slug === slug);
  const prev = chapterIdx > 0 ? chapters[chapterIdx - 1] : null;
  const next = chapterIdx < chapters.length - 1 ? chapters[chapterIdx + 1] : null;

  useEffect(() => {
    setSectionIndex(0);
    setMode("pict");
  }, [slug]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || mode !== "text") return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 18, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.85, ease: "power2.out" },
    );
  }, [slug, idx, mode]);

  function goSection(nextIdx: number) {
    const el = panelRef.current;
    if (!el) {
      setSectionIndex(nextIdx);
      return;
    }
    gsap.to(el, {
      opacity: 0,
      y: -10,
      filter: "blur(6px)",
      duration: 0.28,
      ease: "power1.in",
      onComplete: () => setSectionIndex(nextIdx),
    });
  }

  const narrationSeed = useMemo(() => {
    const body = current.body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#>*_`|\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const snippet = body.slice(0, 280);
    return `〈${title}〉・${current.title}。${snippet}${body.length > 280 ? "……這一節就先聽到這裡，其餘可慢慢看。" : ""}`;
  }, [current.body, current.title, title]);

  return (
    <div className="relative z-[2] mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/immersive/"
          className="text-sm text-[#2a332e]/75 hover:text-[#2a332e] transition"
        >
          ← 回山上
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-white/30 bg-white/20 p-0.5 text-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`rounded-full px-3 py-1.5 transition ${
                mode === "text" ? "bg-[#3d5c4f] text-[#f3faf7]" : "text-[#2a332e]/80"
              }`}
            >
              純文字
            </button>
            <button
              type="button"
              onClick={() => setMode("pict")}
              className={`rounded-full px-3 py-1.5 transition ${
                mode === "pict" ? "bg-[#3d5c4f] text-[#f3faf7]" : "text-[#2a332e]/80"
              }`}
            >
              繪本
            </button>
          </div>
          <AmbientWind />
          <Link
            href={`/chapters/${slug}/`}
            className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs text-[#2a332e]/80 backdrop-blur-md hover:bg-white/30 transition"
          >
            知識庫版
          </Link>
        </div>
      </div>

      <header className="mb-6 text-center">
        <p className="text-xs tracking-[0.25em] text-[#4a5c55]/80">{part}</p>
        <h1 className="mt-2 font-serif text-3xl tracking-wide text-[#24302b] sm:text-4xl">
          〈{title}〉
        </h1>
        <p className="mt-2 text-sm text-[#4a5c55]/85">
          {mode === "pict" ? "時光靜好・繪本導讀" : "大樹下・微風・清水卷"}
        </p>
      </header>

      {mode === "pict" ? (
        <PictureBookMode slug={slug} title={title} />
      ) : (
        <>
          <div className="mb-4">
            <NarrationPlayer text={narrationSeed} label="文字節導讀" />
          </div>
          <article
            ref={panelRef}
            className="immersive-glass immersive-prose flex-1 rounded-3xl px-5 py-7 sm:px-9 sm:py-10"
          >
            <h2 className="font-serif text-xl text-[#24302b] sm:text-2xl">{current.title}</h2>
            <div className="mt-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{current.body}</ReactMarkdown>
            </div>
          </article>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={idx <= 0}
              onClick={() => goSection(idx - 1)}
              className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm backdrop-blur-md disabled:opacity-35 hover:bg-white/35 transition"
            >
              上一節
            </button>
            <p className="text-center text-xs text-[#4a5c55]">
              {idx + 1} / {sections.length}
            </p>
            <button
              type="button"
              disabled={idx >= sections.length - 1}
              onClick={() => goSection(idx + 1)}
              className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm backdrop-blur-md disabled:opacity-35 hover:bg-white/35 transition"
            >
              下一節
            </button>
          </div>
        </>
      )}

      <nav className="mt-8 flex flex-col gap-2 text-sm sm:flex-row sm:justify-between">
        {prev ? (
          <Link href={`/immersive/${prev.slug}/`} className="text-[#2f5d50] hover:underline">
            ← 〈{prev.title}〉
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/immersive/${next.slug}/`} className="text-[#2f5d50] hover:underline sm:text-right">
            〈{next.title}〉 →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
