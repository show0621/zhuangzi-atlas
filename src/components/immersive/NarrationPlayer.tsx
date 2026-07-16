"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { splitNarrationChunks } from "@/lib/pictureBook";

export type VoiceGender = "male" | "female";

type Props = {
  text: string;
  label?: string;
};

function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const zh = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith("zh") ||
      v.lang.toLowerCase().includes("chinese") ||
      /中文|國語|普通话|粵/.test(v.name),
  );
  const pool = zh.length ? zh : voices;
  if (!pool.length) return null;

  const maleHints = /male|男|男声|男聲|daniel|yunyang|yunjian|kangkang|eric|david|george|matthew/i;
  const femaleHints =
    /female|女|女声|女聲|xiaoxiao|xiaoyi|xiaomo|huihui|yaoyao|jenny|zira|susan|tingting|meijia|hanhan/i;

  if (gender === "male") {
    return (
      pool.find((v) => maleHints.test(v.name) && !femaleHints.test(v.name)) ||
      pool.find((v) => /yunyang|yunjian|kangkang/i.test(v.name)) ||
      pool[Math.min(1, pool.length - 1)] ||
      pool[0]
    );
  }
  return (
    pool.find((v) => femaleHints.test(v.name)) ||
    pool.find((v) => /xiaoxiao|xiaoyi|meijia|hanhan/i.test(v.name)) ||
    pool[0]
  );
}

export function NarrationPlayer({ text, label = "導讀" }: Props) {
  const [gender, setGender] = useState<VoiceGender>("female");
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(true);
  const [voicesReady, setVoicesReady] = useState(false);
  const cancelRef = useRef(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);

  const chunks = useMemo(() => splitNarrationChunks(text), [text]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const ready = () => setVoicesReady(true);
    ready();
    window.speechSynthesis.addEventListener("voiceschanged", ready);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", ready);
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utterRef.current = null;
    setPlaying(false);
    setProgress(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    // scene/text changed — stop current speech
    stop();
  }, [text, stop]);

  const speak = useCallback(async () => {
    if (!supported || !chunks.length) return;
    stop();
    cancelRef.current = false;
    setPlaying(true);

    const voice = pickVoice(gender);
    const rate = gender === "male" ? 0.88 : 0.86;
    const pitch = gender === "male" ? 0.92 : 1.08;

    for (let i = 0; i < chunks.length; i += 1) {
      if (cancelRef.current) break;
      setProgress((i + 0.15) / chunks.length);

      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(chunks[i]);
        utterRef.current = u;
        u.lang = voice?.lang || "zh-TW";
        if (voice) u.voice = voice;
        u.rate = rate;
        u.pitch = pitch;
        u.volume = 1;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });

      if (cancelRef.current) break;
      setProgress((i + 1) / chunks.length);
      // leisurely pause between sentences
      const last = chunks[i];
      const longPause = /[。！？…]$/.test(last);
      await new Promise((r) => setTimeout(r, longPause ? 520 : 280));
    }

    if (!cancelRef.current) {
      setProgress(1);
      setPlaying(false);
    }
  }, [chunks, gender, stop, supported]);

  function toggle() {
    if (playing) stop();
    else void speak();
  }

  return (
    <div className="immersive-glass rounded-2xl px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-[0.18em] text-[#5a6e66]">{label}</p>
        <div className="flex items-center gap-1 rounded-full border border-white/30 bg-white/20 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              stop();
              setGender("male");
            }}
            className={`rounded-full px-2.5 py-1 transition ${
              gender === "male" ? "bg-[#3d5c4f] text-[#f3faf7]" : "text-[#2a332e]/80"
            }`}
          >
            磁性男聲
          </button>
          <button
            type="button"
            onClick={() => {
              stop();
              setGender("female");
            }}
            className={`rounded-full px-2.5 py-1 transition ${
              gender === "female" ? "bg-[#3d5c4f] text-[#f3faf7]" : "text-[#2a332e]/80"
            }`}
          >
            溫柔女聲
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3d5c4f] text-[#f3faf7] shadow-[0_6px_20px_rgba(61,92,79,0.28)] transition hover:opacity-90 disabled:opacity-40"
          aria-label={playing ? "暫停導讀" : "播放導讀"}
        >
          {playing ? (
            <span className="flex gap-1">
              <span className="h-3.5 w-1 rounded-sm bg-current" />
              <span className="h-3.5 w-1 rounded-sm bg-current" />
            </span>
          ) : (
            <span className="ml-0.5 border-y-[7px] border-l-[11px] border-y-transparent border-l-current" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div
            className="flex h-8 items-end justify-between gap-[2px]"
            aria-hidden
          >
            {bars.map((i) => {
              const mid = Math.abs(i - bars.length / 2) / (bars.length / 2);
              const base = 0.25 + (1 - mid) * 0.55;
              const active = playing && progress > i / bars.length;
              return (
                <span
                  key={i}
                  className="w-full rounded-full bg-[#3d5c4f]/35 origin-bottom"
                  style={{
                    height: `${Math.round(base * 100)}%`,
                    opacity: active ? 0.95 : 0.35,
                    transform: playing && active ? `scaleY(${0.75 + (i % 5) * 0.12})` : "scaleY(1)",
                    animation: playing && active ? `immWave 0.9s ease-in-out ${i * 0.04}s infinite alternate` : undefined,
                  }}
                />
              );
            })}
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/35">
            <div
              className="h-full rounded-full bg-[#3d5c4f]/75 transition-[width] duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>

        <div
          className={`h-9 w-9 shrink-0 rounded-full border border-white/40 bg-gradient-to-br from-[#f6efe2] to-[#c9d9cf] shadow-inner ${
            playing ? "animate-[immSpin_8s_linear_infinite]" : ""
          }`}
          aria-hidden
          title="悠閒轉盤"
        />
      </div>

      {!supported && (
        <p className="mt-2 text-xs text-[#7a6a55]">此瀏覽器不支援語音導讀，請改用 Chrome／Edge。</p>
      )}
      {supported && voicesReady && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#5a6e66]/90">
          節奏偏慢、句末會稍停；聲線依本機中文語音引擎，聽感會因裝置略有不同。
        </p>
      )}
    </div>
  );
}
