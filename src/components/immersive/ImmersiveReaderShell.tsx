"use client";

import { ImmersiveBook } from "@/components/immersive/ImmersiveBook";
import { GlowCursor } from "@/components/immersive/GlowCursor";
import { WindField } from "@/components/immersive/WindField";

type ChapterOption = { slug: string; title: string; part: string };

export function ImmersiveReaderShell({
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
  return (
    <div className="immersive-root relative min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.45), transparent 55%),
            radial-gradient(ellipse 70% 55% at 15% 90%, rgba(110, 145, 130, 0.25), transparent 50%),
            linear-gradient(180deg, #eaf3ef 0%, #d2e3dc 45%, #a9c2b6 100%)
          `,
        }}
      />
      <WindField />
      <GlowCursor />
      <ImmersiveBook
        slug={slug}
        title={title}
        part={part}
        content={content}
        chapters={chapters}
      />
    </div>
  );
}
