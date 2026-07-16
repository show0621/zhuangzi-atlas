"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import gsap from "gsap";
import { getPodcastShow } from "@/lib/podcastScript";
import { AmbientWind } from "./AmbientWind";
import { NarrationPlayer } from "./NarrationPlayer";
import { PictureBookMode } from "./PictureBookMode";

type ChapterOption = { slug: string; title: string; part: string };
/** 純文字 | 沉浸（山風玻璃）| 繪圖（lo-fi 繪本） */
export type ViewMode = "text" | "immersive" | "pict";

export function ImmersiveBook({
  slug,
  title,
  part,
  content,
  chapters,
  mode,
  onModeChange,
}: {
  slug: string;
  title: string;
  part: string;
  content: string;
  chapters: ChapterOption[];
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [podcastUnit, setPodcastUnit] = useState(0);

  const show = useMemo(() => getPodcastShow(slug, title, content), [slug, title, content]);

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
    setPodcastUnit(0);
  }, [slug]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || mode === "pict") return;
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

  const modeLabel =
    mode === "pict"
      ? "時光靜好・繪圖版"
      : mode === "immersive"
        ? "山上微風・沉浸版"
        : "清水卷・純文字版";

  const modes: { id: ViewMode; label: string }[] = [
    { id: "text", label: "純文字" },
    { id: "immersive", label: "沉浸" },
    { id: "pict", label: "繪圖" },
  ];

  return (
    <div className="relative z-[2] mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/immersive/"
          className="text-sm text-[#2a332e]/75 transition hover:text-[#2a332e]"
        >
          ← 回山上
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-0.5 rounded-full border border-white/30 bg-white/20 p-0.5 text-xs backdrop-blur-md"
            role="tablist"
            aria-label="閱讀版本"
          >
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => onModeChange(m.id)}
                className={`rounded-full px-3 py-1.5 transition ${
                  mode === m.id ? "bg-[#3d5c4f] text-[#f3faf7]" : "text-[#2a332e]/80"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {(mode === "immersive" || mode === "text") && <AmbientWind />}
          <Link
            href={`/chapters/${slug}/`}
            className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs text-[#2a332e]/80 backdrop-blur-md transition hover:bg-white/30"
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
        <p className="mt-2 text-sm text-[#4a5c55]/85">{modeLabel}</p>
      </header>

      <div className="mb-4">
        <NarrationPlayer
          show={show}
          unitIndex={podcastUnit}
          onUnitChange={setPodcastUnit}
          label={
            mode === "pict"
              ? "繪本雙人導讀"
              : mode === "immersive"
                ? "山風雙人導讀"
                : "文字雙人導讀"
          }
        />
      </div>

      {mode === "pict" ? (
        <PictureBookMode
          slug={slug}
          title={title}
          unitIndex={podcastUnit}
          onUnitChange={setPodcastUnit}
        />
      ) : (
        <>
          <article
            ref={panelRef}
            className={`immersive-prose flex-1 rounded-3xl px-5 py-7 sm:px-9 sm:py-10 ${
              mode === "immersive"
                ? "immersive-glass immersive-glass--deep"
                : "immersive-glass"
            }`}
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
              className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm backdrop-blur-md transition hover:bg-white/35 disabled:opacity-35"
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
              className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm backdrop-blur-md transition hover:bg-white/35 disabled:opacity-35"
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
          <Link
            href={`/immersive/${next.slug}/`}
            className="text-[#2f5d50] hover:underline sm:text-right"
          >
            〈{next.title}〉 →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
