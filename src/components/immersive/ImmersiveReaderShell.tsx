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
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,248,230,0.55), transparent 55%),
            radial-gradient(ellipse 70% 55% at 15% 90%, rgba(110, 145, 130, 0.2), transparent 50%),
            radial-gradient(ellipse 50% 40% at 90% 80%, rgba(200, 170, 120, 0.12), transparent 45%),
            linear-gradient(180deg, #f3f8f5 0%, #ddece5 45%, #b7cfc4 100%)
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
