import React, { useEffect, useRef } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import { MousePointer2 } from "lucide-react";
import SectionBadge from "./SectionBadge";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: 0 | 1;
  r: number;
};

const ScienceValidationSection: React.FC = () => {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let inView = false;
    let disposed = false;

    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };

    const gauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    let parts: Particle[] = [];

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      resize();
      const count = 140;
      parts = [];
      for (let i = 0; i < count; i++) {
        const kind: 0 | 1 = i < count * 0.62 ? 0 : 1;
        const cx = kind === 0 ? w * 0.32 : w * 0.68;
        const cy = h * 0.5;
        const sx = kind === 0 ? w * 0.16 : w * 0.14;
        const sy = h * 0.22;
        parts.push({
          x: cx + gauss() * sx,
          y: cy + gauss() * sy,
          vx: 0,
          vy: 0,
          kind,
          r: 1.5 + Math.random() * 2.2,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Neural mesh among legitimate points
      ctx.strokeStyle = "rgba(59,130,246,0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        if (a.kind !== 0) continue;
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j];
          if (b.kind !== 0) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (dx * dx + dy * dy < 3600) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Decision boundary curve
      const bx = w * 0.5 + (mouse.active ? Math.max(-34, Math.min(34, (mouse.x - w * 0.5) * 0.12)) : 0);
      const bend = mouse.active ? (mouse.y - h * 0.5) * 0.05 : 0;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.bezierCurveTo(bx - 20, h * 0.33, bx + 20 + bend, h * 0.66, bx, h);
      ctx.strokeStyle = "rgba(59,130,246,0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Particles
      for (const p of parts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        if (p.kind === 0) {
          ctx.fillStyle = "rgba(59,130,246,0.9)";
          ctx.shadowColor = "rgba(59,130,246,0.8)";
        } else {
          ctx.fillStyle = "rgba(239,68,68,0.9)";
          ctx.shadowColor = "rgba(239,68,68,0.8)";
        }
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const step = () => {
      for (const p of parts) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        const R = 120;
        if (d2 < R * R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 0.9;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        const cx = p.kind === 0 ? w * 0.32 : w * 0.68;
        p.vx += (cx - p.x) * 0.0015;
        p.vy += (h * 0.5 - p.y) * 0.0015;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 4) p.x = 4;
        if (p.x > w - 4) p.x = w - 4;
        if (p.y < 4) p.y = 4;
        if (p.y > h - 4) p.y = h - 4;
      }
    };

    const frame = () => {
      if (disposed) return;
      if (inView && !ecoMode) {
        mouse.x += (mouse.tx - mouse.x) * 0.08;
        mouse.y += (mouse.ty - mouse.y) * 0.08;
        step();
        draw();
        raf = requestAnimationFrame(frame);
      } else {
        draw();
      }
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (ecoMode) {
        draw();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const onMouseMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.tx = -9999;
      mouse.ty = -9999;
      mouse.active = false;
    };

    init();
    draw();

    wrap.addEventListener("pointermove", onMouseMove);
    wrap.addEventListener("pointerleave", onMouseLeave);
    window.addEventListener("resize", init);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? false;
        start();
      },
      { threshold: 0.1 }
    );
    io.observe(wrap);
    inView = true;
    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      wrap.removeEventListener("pointermove", onMouseMove);
      wrap.removeEventListener("pointerleave", onMouseLeave);
      window.removeEventListener("resize", init);
    };
  }, [ecoMode]);

  return (
    <section
      id="verification"
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: TEXT & NUMBERS */}
          <div>
            <SectionBadge variant="slash" label={t.science.badge} className="mb-6" />

            <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-4">
              {t.science.title}
            </h2>

            <p className="font-mono text-xs sm:text-sm text-[#3B82F6] uppercase tracking-wider mb-6">
              {t.science.subtitle}
            </p>

            <p className="font-sans text-sm sm:text-base text-gray-400 leading-relaxed mb-10">
              {t.science.body}
            </p>

            {/* Accent block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#3B82F6]/20 bg-[#12141A] p-5">
                <div className="font-display font-medium text-4xl text-[#3B82F6] mb-2">100%</div>
                <div className="font-sans text-xs text-gray-400 leading-relaxed">
                  {t.science.accentA}
                </div>
              </div>
              <div className="rounded-2xl border border-[#3B82F6]/20 bg-[#12141A] p-5">
                <div className="font-display font-medium text-4xl text-[#3B82F6] mb-2">0%</div>
                <div className="font-sans text-xs text-gray-400 leading-relaxed">
                  {t.science.accentB}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE VISUAL */}
          <div ref={wrapRef} className="relative">
            <div className="relative rounded-2xl border border-white/[0.06] bg-[#0E0F12] overflow-hidden h-[420px] sm:h-[520px]">
              <canvas ref={canvasRef} className="block h-full w-full" />

              {/* Badge overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#12141A]/80 backdrop-blur-sm px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                <span className="font-mono text-[10px] text-[#6FB1FF] uppercase tracking-widest font-semibold">
                  {t.science.visualBadge}
                </span>
              </div>

              {/* Cursor hint */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                  {t.science.legitLabel}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#12141A]/80 backdrop-blur-sm px-3 py-1.5 text-gray-400">
                  <MousePointer2 className="w-3 h-3 text-[#3B82F6]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {t.science.visualHint}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                  {t.science.anomalyLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScienceValidationSection;
