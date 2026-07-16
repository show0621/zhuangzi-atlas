"use client";

import { useEffect, useMemo, useState } from "react";
import { assetPath } from "@/lib/assetPath";
import { getPictureScenes } from "@/lib/pictureBook";
import { NarrationPlayer } from "./NarrationPlayer";

export function PictureBookMode({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const scenes = useMemo(() => getPictureScenes(slug, title), [slug, title]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [slug]);

  const scene = scenes[Math.min(idx, scenes.length - 1)]!;
  const imgSrc = assetPath(scene.image);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/35 shadow-[0_20px_50px_rgba(60,90,80,0.16)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={scene.title}
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a2822]/55 via-transparent to-[#fff8ea]/15" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <div className="immersive-glass rounded-2xl px-4 py-3 sm:px-5">
            <p className="font-serif text-xl text-[#24302b] sm:text-2xl">{scene.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#3d4f48]/95">{scene.caption}</p>
          </div>
        </div>
      </div>

      <NarrationPlayer text={scene.narration} label="繪本導讀" />

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          disabled={idx <= 0}
          onClick={() => setIdx((v) => Math.max(0, v - 1))}
          className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm backdrop-blur-md disabled:opacity-35 hover:bg-white/35 transition"
        >
          上一幅
        </button>
        <p className="text-xs text-[#4a5c55]">
          {idx + 1} / {scenes.length}
        </p>
        <button
          type="button"
          disabled={idx >= scenes.length - 1}
          onClick={() => setIdx((v) => Math.min(scenes.length - 1, v + 1))}
          className="rounded-full border border-white/35 bg-white/20 px-4 py-2 text-sm backdrop-blur-md disabled:opacity-35 hover:bg-white/35 transition"
        >
          下一幅
        </button>
      </div>

      {slug !== "逍遙遊" && (
        <p className="text-center text-xs leading-relaxed text-[#5a6e66]/90">
          〈{title}〉繪本場景尚在擴充；目前以時光靜好的通用畫面搭配導讀。完整繪本目前以〈逍遙遊〉最完整。
        </p>
      )}
    </div>
  );
}
