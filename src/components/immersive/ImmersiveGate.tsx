"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { AmbientWind } from "./AmbientWind";
import { GlowCursor } from "./GlowCursor";
import { WindField } from "./WindField";

type ChapterOption = { slug: string; title: string; part: string };

export function ImmersiveGate({ chapters }: { chapters: ChapterOption[] }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 30, filter: "blur(10px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power2.out" },
      );
    }
    if (cardRef.current) {
      tl.fromTo(
        cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power2.out" },
        "-=0.5",
      );
    }
  }, []);

  const featured = chapters.filter((c) =>
    ["逍遙遊", "齊物論", "養生主", "秋水", "大宗師"].includes(c.slug),
  );

  return (
    <div className="immersive-root relative min-h-screen overflow-hidden">
      <MountainBackdrop />
      <WindField />
      <GlowCursor />

      <div className="relative z-[2] mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-16 sm:px-8">
        <div className="mb-6 flex justify-end">
          <AmbientWind />
        </div>

        <h1
          ref={titleRef}
          className="text-center font-serif text-4xl leading-tight tracking-wide text-[#24302b] sm:text-6xl"
        >
          莊子全解
          <span className="mt-3 block text-lg font-sans font-normal tracking-[0.2em] text-[#4a5c55] sm:text-xl">
            山上・樹下・微風讀書
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-[#3d4f48]/90 sm:text-lg">
          像透明清水一樣翻開文字。光點隨風而動，書頁如霧面玻璃，讓閱讀變成一場輕盈的停留。
        </p>

        <div ref={cardRef} className="immersive-glass mt-10 rounded-3xl p-5 sm:p-8">
          <p className="text-sm tracking-wide text-[#4a5c55]">由此入卷</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featured.map((c) => (
              <Link
                key={c.slug}
                href={`/immersive/${c.slug}/`}
                className="group rounded-2xl border border-white/25 bg-white/20 px-4 py-4 backdrop-blur-md transition hover:bg-white/40 hover:shadow-[0_0_30px_rgba(190,220,210,0.35)]"
              >
                <span className="text-xs text-[#5a6e66]">{c.part}</span>
                <span className="mt-1 block font-serif text-xl text-[#24302b] group-hover:tracking-wider transition-all">
                  〈{c.title}〉
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/immersive/逍遙遊/"
              className="rounded-full bg-[#3d5c4f] px-5 py-2.5 text-sm text-[#f3faf7] hover:opacity-90 transition"
            >
              從〈逍遙遊〉開始
            </Link>
            <Link
              href="/toc/"
              className="rounded-full border border-white/35 bg-white/15 px-5 py-2.5 text-sm text-[#2a332e] backdrop-blur-md hover:bg-white/30 transition"
            >
              全書目錄
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/35 bg-white/15 px-5 py-2.5 text-sm text-[#2a332e] backdrop-blur-md hover:bg-white/30 transition"
            >
              回到知識庫首頁
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MountainBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 50% 110%, rgba(70, 100, 90, 0.35), transparent 55%),
            radial-gradient(ellipse 70% 50% at 20% 80%, rgba(120, 150, 140, 0.28), transparent 50%),
            radial-gradient(ellipse 60% 40% at 85% 70%, rgba(150, 175, 170, 0.22), transparent 45%),
            linear-gradient(180deg, #eef5f2 0%, #d5e4df 38%, #b7cfc6 72%, #8fa89c 100%)
          `,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42vh]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(55, 80, 70, 0.18)), radial-gradient(ellipse 80% 60% at 50% 100%, rgba(40, 65, 55, 0.45), transparent 70%)",
        }}
      />
      {/* soft tree silhouette suggestion */}
      <div
        className="absolute bottom-[8%] left-1/2 h-[55vh] w-[min(520px,80vw)] -translate-x-1/2 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 20%, rgba(40,70,55,0.55), transparent 70%), radial-gradient(ellipse 20% 55% at 50% 75%, rgba(35,60,48,0.5), transparent 70%)",
          filter: "blur(1px)",
        }}
      />
      <div
        className="absolute inset-0 opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
