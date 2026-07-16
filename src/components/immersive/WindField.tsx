"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  kind: "leaf" | "mote" | "ripple";
  rot: number;
  vr: number;
};

/** 微風粒子：葉影、光塵、淺水波紋點 */
export function WindField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let mx = 0.5;
    let my = 0.5;
    const particles: Particle[] = [];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (n: number) => {
      for (let i = 0; i < n; i += 1) {
        const kindRoll = Math.random();
        const kind: Particle["kind"] =
          kindRoll > 0.82 ? "leaf" : kindRoll > 0.45 ? "mote" : "ripple";
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: kind === "leaf" ? 3 + Math.random() * 5 : kind === "mote" ? 1 + Math.random() * 2 : 8 + Math.random() * 18,
          vx: -0.15 + Math.random() * 0.35,
          vy: 0.08 + Math.random() * 0.35,
          a: kind === "ripple" ? 0.04 + Math.random() * 0.06 : 0.12 + Math.random() * 0.35,
          kind,
          rot: Math.random() * Math.PI * 2,
          vr: -0.02 + Math.random() * 0.04,
        });
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX / w;
      my = e.clientY / h;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const wind = (mx - 0.5) * 0.8;

      for (const p of particles) {
        p.vx += wind * 0.002;
        p.x += p.vx + Math.sin(p.y * 0.01 + wind) * 0.15;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > h + 20) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        if (p.x < -30) p.x = w + 20;
        if (p.x > w + 30) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.a;

        if (p.kind === "leaf") {
          ctx.fillStyle = "rgba(90, 120, 100, 0.55)";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 1.6, p.r * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === "mote") {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 3);
          g.addColorStop(0, "rgba(255,255,255,0.9)");
          g.addColorStop(1, "rgba(200,220,215,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = "rgba(180, 210, 205, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
          p.r += 0.05;
          p.a *= 0.997;
          if (p.a < 0.02 || p.r > 40) {
            p.r = 8 + Math.random() * 10;
            p.a = 0.05 + Math.random() * 0.05;
            p.x = Math.random() * w;
            p.y = Math.random() * h;
          }
        }
        ctx.restore();
      }

      // soft parallax mist near cursor
      const mist = ctx.createRadialGradient(mx * w, my * h, 0, mx * w, my * h, 220);
      mist.addColorStop(0, "rgba(255,255,255,0.08)");
      mist.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };

    resize();
    spawn(70);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
