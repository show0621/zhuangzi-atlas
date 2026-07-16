"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { assetPath } from "@/lib/assetPath";
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
            時光靜好・山上讀書
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-[#3d4f48]/90 sm:text-lg">
          四種版本一鍵切換：純文字、沉浸、繪圖、播客。頁內即可換版，重整後仍記住你的選擇。
        </p>

        <div className="mx-auto mt-6 flex w-full max-w-lg flex-wrap justify-center gap-2">
          {(
            [
              ["text", "純文字"],
              ["immersive", "沉浸"],
              ["pict", "繪圖"],
              ["podcast", "播客"],
            ] as const
          ).map(([mode, label]) => (
            <Link
              key={mode}
              href={`/immersive/逍遙遊/?mode=${mode}`}
              className={`rounded-full px-4 py-2 text-sm transition ${
                mode === "immersive"
                  ? "bg-[#3d5c4f] text-[#f3faf7] hover:opacity-90"
                  : "border border-white/35 bg-white/25 text-[#2a332e] backdrop-blur-md hover:bg-white/40"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-8 grid w-full max-w-lg grid-cols-2 gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/immersive/pict/mood-traveler-lofi.png")}
            alt=""
            className="aspect-[4/3] w-full rounded-2xl object-cover opacity-95 shadow-[0_12px_30px_rgba(60,90,80,0.18)]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/immersive/pict/mood-listening-lofi.png")}
            alt=""
            className="aspect-[4/3] w-full rounded-2xl object-cover opacity-95 shadow-[0_12px_30px_rgba(60,90,80,0.18)]"
          />
        </div>

        <div ref={cardRef} className="immersive-glass mt-8 rounded-3xl p-5 sm:p-8">
          <p className="text-sm tracking-wide text-[#4a5c55]">由此入卷</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featured.map((c) => (
              <Link
                key={c.slug}
                href={`/immersive/${c.slug}/?mode=immersive`}
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
              href="/immersive/逍遙遊/?mode=immersive"
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
              href="/download/"
              className="rounded-full border border-white/35 bg-white/15 px-5 py-2.5 text-sm text-[#2a332e] backdrop-blur-md hover:bg-white/30 transition"
            >
              下載印刷版
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/35 bg-white/15 px-5 py-2.5 text-sm text-[#2a332e] backdrop-blur-md hover:bg-white/30 transition"
            >
              知識庫首頁
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
