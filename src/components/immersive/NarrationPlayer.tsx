"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PodcastEpisode, PodcastLine, PodcastShow, Speaker } from "@/lib/podcastScript";
import { plainForSpeech } from "@/lib/pictureBook";

type Props = {
  show: PodcastShow;
  /** Sync external unit index (e.g. picture-book page). */
  unitIndex?: number;
  onUnitChange?: (index: number) => void;
  label?: string;
  /** Featured layout when user picks 播客 mode. */
  featured?: boolean;
};

type VoiceChoice = {
  maleURI: string;
  femaleURI: string;
};

function listZhVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  const zh = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith("zh") ||
      v.lang.toLowerCase().includes("chinese") ||
      /中文|國語|普通话|粵|Taiwan|Hong Kong/i.test(`${v.name} ${v.lang}`),
  );
  return zh.length ? zh : voices;
}

function scoreVoice(v: SpeechSynthesisVoice, gender: Speaker): number {
  const name = v.name;
  const maleHints =
    /male|男|男声|男聲|daniel|yunyang|yunjian|kangkang|eric|david|george|matthew|yunxi|yunxia|cloud|hanhan男/i;
  const femaleHints =
    /female|女|女声|女聲|xiaoxiao|xiaoyi|xiaomo|huihui|yaoyao|jenny|zira|susan|tingting|meijia|hanhan|xiaorou|xiaochen/i;
  let score = 0;
  if (v.lang.toLowerCase().includes("zh-tw") || /taiwan|國語|台/i.test(name)) score += 4;
  if (v.lang.toLowerCase().includes("zh-cn") || /普通话|大陆/i.test(name)) score += 2;
  if (gender === "male") {
    if (maleHints.test(name) && !femaleHints.test(name)) score += 8;
    if (/yunyang|yunjian|kangkang|yunxi/i.test(name)) score += 6;
  } else {
    if (femaleHints.test(name)) score += 8;
    if (/xiaoxiao|xiaoyi|meijia|tingting|hanhan/i.test(name)) score += 6;
  }
  if (v.localService) score += 1;
  return score;
}

function pickBestVoice(gender: Speaker, preferredURI?: string): SpeechSynthesisVoice | null {
  const pool = listZhVoices();
  if (!pool.length) return null;
  if (preferredURI) {
    const found = pool.find((v) => v.voiceURI === preferredURI);
    if (found) return found;
  }
  return [...pool].sort((a, b) => scoreVoice(b, gender) - scoreVoice(a, gender))[0] ?? null;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function NarrationPlayer({
  show,
  unitIndex,
  onUnitChange,
  label = "雙人導讀・分單元",
  featured = false,
}: Props) {
  const [episodeIdx, setEpisodeIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lineIdx, setLineIdx] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceChoice, setVoiceChoice] = useState<VoiceChoice>({ maleURI: "", femaleURI: "" });
  const [showVoicePick, setShowVoicePick] = useState(false);

  const cancelRef = useRef(false);
  const pauseGateRef = useRef<Promise<void> | null>(null);
  const resumePauseRef = useRef<(() => void) | null>(null);
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => i), []);

  const episodes = show.episodes;
  const safeIdx = Math.min(Math.max(0, unitIndex ?? episodeIdx), Math.max(0, episodes.length - 1));
  const episode: PodcastEpisode | undefined = episodes[safeIdx];

  useEffect(() => {
    if (typeof unitIndex === "number") setEpisodeIdx(unitIndex);
  }, [unitIndex]);

  useEffect(() => {
    setEpisodeIdx(0);
    setLineIdx(-1);
    setProgress(0);
  }, [show.slug]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
      return;
    }
    const refresh = () => {
      const list = listZhVoices();
      setVoices(list);
      setVoiceChoice((prev) => {
        const male = pickBestVoice("male", prev.maleURI);
        const female = pickBestVoice("female", prev.femaleURI);
        return {
          maleURI: male?.voiceURI ?? prev.maleURI,
          femaleURI: female?.voiceURI ?? prev.femaleURI,
        };
      });
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  const hardStop = useCallback(() => {
    cancelRef.current = true;
    resumePauseRef.current?.();
    resumePauseRef.current = null;
    pauseGateRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setPaused(false);
    setLineIdx(-1);
    setProgress(0);
  }, []);

  useEffect(() => () => hardStop(), [hardStop]);

  useEffect(() => {
    hardStop();
  }, [show.slug, safeIdx, hardStop]);

  const changeUnit = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(0, next), episodes.length - 1);
      setEpisodeIdx(clamped);
      onUnitChange?.(clamped);
    },
    [episodes.length, onUnitChange],
  );

  const waitIfPaused = useCallback(async () => {
    while (pauseGateRef.current) {
      await pauseGateRef.current;
    }
  }, []);

  /**
   * Speak one host turn as a single continuous utterance.
   * Avoid micro-chunking — that causes 頓來頓去 choppiness on Web Speech API.
   */
  const speakLine = useCallback(
    async (line: PodcastLine) => {
      const voice = pickBestVoice(
        line.speaker,
        line.speaker === "male" ? voiceChoice.maleURI : voiceChoice.femaleURI,
      );
      const text = plainForSpeech(line.text);
      if (!text) return;

      const rate = line.rate ?? (line.speaker === "male" ? 0.94 : 0.92);
      const pitch = line.pitch ?? (line.speaker === "male" ? 0.92 : 1.1);

      await waitIfPaused();
      if (cancelRef.current) return;

      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = voice?.lang || "zh-TW";
        if (voice) u.voice = voice;
        u.rate = rate;
        u.pitch = pitch;
        u.volume = 1;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });
    },
    [voiceChoice.femaleURI, voiceChoice.maleURI, waitIfPaused],
  );

  const speakEpisode = useCallback(async () => {
    if (!supported || !episode?.lines.length) return;
    hardStop();
    cancelRef.current = false;
    setPlaying(true);
    setPaused(false);

    const lines = episode.lines;
    let i = 0;
    while (i < lines.length) {
      if (cancelRef.current) break;

      // Merge consecutive same-speaker lines into one continuous utterance
      // (avoids restarting synthesis mid-thought)
      let j = i;
      const speaker = lines[i]!.speaker;
      const parts: string[] = [lines[i]!.text];
      while (j + 1 < lines.length && lines[j + 1]!.speaker === speaker) {
        j += 1;
        parts.push(lines[j]!.text);
      }

      setLineIdx(i);
      setProgress((i + 0.15) / lines.length);

      const merged: PodcastLine = {
        speaker,
        text: parts.join(""),
        rate: lines[i]!.rate,
        pitch: lines[i]!.pitch,
      };
      await speakLine(merged);
      if (cancelRef.current) break;

      // Keep last line of the group highlighted briefly
      setLineIdx(j);
      setProgress((j + 1) / lines.length);

      i = j + 1;
      if (i >= lines.length) break;

      // Only meaningful pause: speaker just changed (or about to)
      const gap = Math.min(Math.max(lines[j]!.pauseMs ?? 440, 300), 520);
      await sleep(gap);
      await waitIfPaused();
    }

    if (!cancelRef.current) {
      setProgress(1);
      setPlaying(false);
      setPaused(false);
      setLineIdx(-1);
    }
  }, [episode, hardStop, speakLine, supported, waitIfPaused]);

  function togglePlay() {
    if (!playing) {
      void speakEpisode();
      return;
    }
    if (paused) {
      // resume
      resumePauseRef.current?.();
      resumePauseRef.current = null;
      pauseGateRef.current = null;
      setPaused(false);
      if (typeof window !== "undefined" && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      return;
    }
    // soft pause
    setPaused(true);
    pauseGateRef.current = new Promise<void>((resolve) => {
      resumePauseRef.current = resolve;
    });
    if (typeof window !== "undefined") {
      window.speechSynthesis.pause();
    }
  }

  const maleVoices = voices.filter((v) => scoreVoice(v, "male") >= scoreVoice(v, "female"));
  const femaleVoices = voices.filter((v) => scoreVoice(v, "female") > scoreVoice(v, "male"));
  const malePool = maleVoices.length ? maleVoices : voices;
  const femalePool = femaleVoices.length ? femaleVoices : voices;

  if (!episode) return null;

  const playSize = featured ? "h-14 w-14" : "h-11 w-11";
  const scriptMax = featured ? "max-h-[min(28rem,55vh)]" : "max-h-44";

  return (
    <div
      className={`immersive-glass ${
        featured
          ? "rounded-3xl px-5 py-5 sm:px-8 sm:py-7 shadow-[0_16px_40px_rgba(60,90,80,0.12)]"
          : "rounded-2xl px-4 py-3 sm:px-5 sm:py-4"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`tracking-[0.18em] text-[#5a6e66] ${
            featured ? "text-sm" : "text-xs"
          }`}
        >
          {label}
        </p>
        <button
          type="button"
          onClick={() => setShowVoicePick((v) => !v)}
          className="rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[11px] text-[#2a332e]/85 backdrop-blur-md hover:bg-white/35 transition"
        >
          {showVoicePick ? "收合聲線" : "選擇聲線"}
        </button>
      </div>

      {featured && (
        <p className="mt-2 text-sm leading-relaxed text-[#3d4f48]/90">
          一男一女分單元對談：先說故事，再講意思。點播放即可聽。
        </p>
      )}

      <div className={`flex flex-wrap items-center gap-2 ${featured ? "mt-4" : "mt-2"}`}>
        <select
          aria-label="選擇單元"
          value={safeIdx}
          onChange={(e) => changeUnit(Number(e.target.value))}
          className={`max-w-full rounded-full border border-white/35 bg-white/25 px-3 py-1.5 text-[#24302b] backdrop-blur-md outline-none ${
            featured ? "text-sm" : "text-xs"
          }`}
        >
          {episodes.map((ep, i) => (
            <option key={ep.id} value={i}>
              {ep.title}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-[#5a6e66]">
          {safeIdx + 1} / {episodes.length} 單元
        </span>
      </div>

      {showVoicePick && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] text-[#5a6e66]">
            男聲
            <select
              className="mt-1 w-full rounded-xl border border-white/35 bg-white/30 px-2 py-1.5 text-xs text-[#24302b]"
              value={voiceChoice.maleURI}
              onChange={(e) => setVoiceChoice((c) => ({ ...c, maleURI: e.target.value }))}
            >
              {malePool.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-[#5a6e66]">
            女聲
            <select
              className="mt-1 w-full rounded-xl border border-white/35 bg-white/30 px-2 py-1.5 text-xs text-[#24302b]"
              value={voiceChoice.femaleURI}
              onChange={(e) => setVoiceChoice((c) => ({ ...c, femaleURI: e.target.value }))}
            >
              {femalePool.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={`flex items-center gap-3 ${featured ? "mt-5" : "mt-3"}`}>
        <button
          type="button"
          onClick={togglePlay}
          disabled={!supported}
          className={`flex ${playSize} shrink-0 items-center justify-center rounded-full bg-[#3d5c4f] text-[#f3faf7] shadow-[0_6px_20px_rgba(61,92,79,0.28)] transition hover:opacity-90 disabled:opacity-40`}
          aria-label={playing && !paused ? "暫停" : "播放"}
        >
          {playing && !paused ? (
            <span className="flex gap-1">
              <span className={`${featured ? "h-4 w-1.5" : "h-3.5 w-1"} rounded-sm bg-current`} />
              <span className={`${featured ? "h-4 w-1.5" : "h-3.5 w-1"} rounded-sm bg-current`} />
            </span>
          ) : (
            <span
              className={`ml-0.5 border-y-transparent border-l-current ${
                featured
                  ? "border-y-[9px] border-l-[14px]"
                  : "border-y-[7px] border-l-[11px]"
              }`}
            />
          )}
        </button>

        <button
          type="button"
          disabled={safeIdx >= episodes.length - 1}
          onClick={() => changeUnit(safeIdx + 1)}
          className="shrink-0 rounded-full border border-white/35 bg-white/20 px-2.5 py-2 text-[11px] text-[#2a332e] backdrop-blur-md transition hover:bg-white/35 disabled:opacity-35"
          aria-label="下一單元"
          title="下一單元"
        >
          下單元
        </button>

        <div className="min-w-0 flex-1">
          <div
            className={`flex items-end justify-between gap-[2px] ${featured ? "h-10" : "h-8"}`}
            aria-hidden
          >
            {bars.map((i) => {
              const mid = Math.abs(i - bars.length / 2) / (bars.length / 2);
              const base = 0.25 + (1 - mid) * 0.55;
              const active = playing && !paused && progress > i / bars.length;
              return (
                <span
                  key={i}
                  className="w-full origin-bottom rounded-full bg-[#3d5c4f]/35"
                  style={{
                    height: `${Math.round(base * 100)}%`,
                    opacity: active ? 0.95 : 0.35,
                    transform:
                      playing && active ? `scaleY(${0.75 + (i % 5) * 0.12})` : "scaleY(1)",
                    animation:
                      playing && active
                        ? `immWave 0.9s ease-in-out ${i * 0.04}s infinite alternate`
                        : undefined,
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
          className={`shrink-0 rounded-full border border-white/40 bg-gradient-to-br from-[#f6efe2] to-[#c9d9cf] shadow-inner ${
            featured ? "h-11 w-11" : "h-9 w-9"
          } ${playing && !paused ? "animate-[immSpin_8s_linear_infinite]" : ""}`}
          aria-hidden
          title="悠閒轉盤"
        />
      </div>

      {/* Script lines with highlight */}
      <ul
        className={`mt-3 space-y-2 overflow-y-auto pr-1 leading-relaxed ${scriptMax} ${
          featured ? "text-base" : "text-sm"
        }`}
      >
        {episode.lines.map((line, i) => {
          const active = i === lineIdx;
          const isMale = line.speaker === "male";
          return (
            <li
              key={`${episode.id}-${i}`}
              className={`rounded-xl px-3 py-2 transition ${
                active
                  ? "bg-[#3d5c4f]/18 ring-1 ring-[#3d5c4f]/25"
                  : "bg-white/10"
              }`}
            >
              <span
                className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] tracking-wide ${
                  isMale
                    ? "bg-[#3d5c4f]/85 text-[#f3faf7]"
                    : "bg-[#c4a574]/85 text-[#2a2418]"
                }`}
              >
                {isMale ? "男聲" : "女聲"}
              </span>
              <span className={active ? "text-[#1a2822]" : "text-[#3d4f48]/90"}>{line.text}</span>
            </li>
          );
        })}
      </ul>

      {!supported && (
        <p className="mt-2 text-xs text-[#7a6a55]">此瀏覽器不支援語音導讀，請改用 Chrome／Edge。</p>
      )}
      {supported && (
        <p className="mt-2 text-[11px] leading-relaxed text-[#5a6e66]/90">
          一男一女對答・說故事再講意思。每句整段連續播放，只在換人時稍停。聲線來自本機 Web Speech（Chrome／Edge 較穩），無法像錄音室級 TTS
          那樣細調抑揚；請選本機較自然的中文男女聲，聽感會好很多。
        </p>
      )}
    </div>
  );
}
