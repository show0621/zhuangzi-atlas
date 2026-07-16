"use client";

import { useEffect, useState } from "react";

/** 發光光球游標：掠過文字時由 CSS 變數驅動高亮 */
export function GlowCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    document.documentElement.classList.add("immersive-cursor-on");

    const move = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
      document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
    };
    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("immersive-cursor-on");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[60] mix-blend-screen transition-opacity duration-300"
      style={{
        left: pos.x,
        top: pos.y,
        opacity: visible ? 1 : 0,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="h-10 w-10 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(230,245,240,0.95) 0%, rgba(160,200,190,0.35) 40%, transparent 70%)",
          boxShadow: "0 0 40px 12px rgba(190, 220, 210, 0.35)",
        }}
      />
    </div>
  );
}
