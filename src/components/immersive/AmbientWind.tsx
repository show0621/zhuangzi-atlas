"use client";

import { useEffect, useRef, useState } from "react";

/** 以 Web Audio 合成輕柔風聲（無需外部音檔） */
export function AmbientWind() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);

  useEffect(() => {
    return () => {
      nodesRef.current?.source.stop();
      void ctxRef.current?.close();
    };
  }, []);

  async function toggle() {
    if (on) {
      nodesRef.current?.source.stop();
      nodesRef.current = null;
      await ctxRef.current?.close();
      ctxRef.current = null;
      setOn(false);
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    nodesRef.current = { source, gain };
    setOn(true);
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      className="rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs text-[#2a332e]/90 backdrop-blur-md hover:bg-white/35 transition"
    >
      {on ? "風聲 · 開" : "風聲 · 關"}
    </button>
  );
}
