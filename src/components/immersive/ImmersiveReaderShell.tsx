"use client";

import { useState } from "react";
import { ImmersiveBook, type ViewMode } from "@/components/immersive/ImmersiveBook";
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
  const [mode, setMode] = useState<ViewMode>("immersive");

  return (
    <div className="immersive-root relative min-h-screen overflow-x-hidden">
      {mode === "immersive" ? <MountainBackdrop /> : <SoftBackdrop soft={mode === "text"} />}
      {(mode === "immersive" || mode === "text") && <WindField />}
      <GlowCursor />
      <ImmersiveBook
        slug={slug}
        title={title}
        part={part}
        content={content}
        chapters={chapters}
        mode={mode}
        onModeChange={setMode}
      />
    </div>
  );
}

function SoftBackdrop({ soft }: { soft?: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: soft
          ? `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,252,245,0.7), transparent 55%),
            linear-gradient(180deg, #f7faf8 0%, #e8f1ec 50%, #d5e4dc 100%)
          `
          : `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,248,230,0.55), transparent 55%),
            radial-gradient(ellipse 70% 55% at 15% 90%, rgba(110, 145, 130, 0.2), transparent 50%),
            radial-gradient(ellipse 50% 40% at 90% 80%, rgba(200, 170, 120, 0.12), transparent 45%),
            linear-gradient(180deg, #f3f8f5 0%, #ddece5 45%, #b7cfc4 100%)
          `,
      }}
    />
  );
}

function MountainBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 50% 110%, rgba(70, 100, 90, 0.28), transparent 55%),
            radial-gradient(ellipse 70% 50% at 20% 80%, rgba(120, 150, 140, 0.22), transparent 50%),
            radial-gradient(ellipse 60% 40% at 85% 70%, rgba(200, 180, 140, 0.18), transparent 45%),
            linear-gradient(180deg, #f3f8f5 0%, #e4efe9 38%, #c9ddd3 72%, #9fb5a8 100%)
          `,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42vh]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(55, 80, 70, 0.14)), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(40, 65, 55, 0.35), transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[8%] left-1/2 h-[55vh] w-[min(520px,80vw)] -translate-x-1/2 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 20%, rgba(40,70,55,0.55), transparent 70%), radial-gradient(ellipse 20% 55% at 50% 75%, rgba(35,60,48,0.5), transparent 70%)",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
