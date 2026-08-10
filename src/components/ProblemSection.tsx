import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { ShieldAlert, EyeOff, WifiOff, Cpu, BellRing, ShieldCheck, ChevronsLeftRight } from "lucide-react";
import SectionBadge from "./SectionBadge";

const base = typeof import.meta !== "undefined" ? import.meta.env.BASE_URL : "/";

const ProblemSection = React.memo(function ProblemSection() {
  const { t } = useTranslation();

  const oldItems = t.problem.items;
  const newItems = t.how.usp;

  // Before/After slider position: 0..100 (%).
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFromClientX(e.clientX);
  };
  const endDrag = () => {
    draggingRef.current = false;
  };

  const oldIcons = [ShieldAlert, EyeOff, WifiOff];
  const newIcons = [Cpu, BellRing, ShieldCheck];

  const newShots = [
    ["threat-screen.jpg", "threat-history.jpg"],
    ["statistics.jpg", "main-screen.jpg"],
    ["settings.jpg", "assistant.jpg"],
  ];

  return (
    <section 
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden" 
      id="problem"
    >
      {/* Background glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <SectionBadge variant="slash" label={t.problem.badge} className="mb-6" />
          
          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.problem.titleLine1} <br className="hidden sm:inline" />
            <span className="text-[#3B82F6]">{t.problem.titleHighlight}</span>
          </h2>
          
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.problem.subtitle}
          </p>
        </div>

        {/* BEFORE / AFTER interactive comparison slider */}
        <div
          ref={containerRef}
          className="relative w-full select-none touch-none rounded-2xl border border-white/[0.06] bg-[#0E0F12] overflow-hidden shadow-[0_0_80px_rgba(59,130,246,0.06)]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
        >
          <div className="relative min-h-[520px] sm:min-h-[600px]">

            {/* OLD LAYER (left, always visible) */}
            <div className="absolute inset-0 bg-[#0E0F12]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.04)_0%,transparent_60%)] pointer-events-none" />
              <div className="relative h-full flex flex-col p-6 sm:p-10">
                {/* Old header */}
                <div className="flex items-center justify-between mb-8 sm:mb-10">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500/50" />
                    <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-gray-500 uppercase font-bold">
                      {t.problem.oldLabel}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-xs tracking-widest text-gray-600 uppercase">
                    ×
                  </span>
                </div>

                {/* Old items: dim, crossed-out, with real stats */}
                <div className="flex flex-col gap-6 sm:gap-7">
                  {oldItems.map((item, i) => {
                    const Icon = oldIcons[i] || ShieldAlert;
                    return (
                      <div key={i} className="flex items-start gap-4 opacity-50">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl border border-red-500/20 bg-red-950/10 flex items-center justify-center text-red-400/50">
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="absolute -left-1 -right-1 top-1/2 h-px bg-red-500/40 -rotate-45" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-medium text-base sm:text-lg text-gray-500 mb-1">
                            {item.title}
                          </h4>
                          <p className="font-sans text-xs sm:text-sm text-gray-600 leading-relaxed">
                            {item.desc}
                          </p>
                          <p className="font-mono text-[11px] sm:text-xs text-gray-600 mt-1.5">
                            {item.stat} — {item.statSource}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* NEW LAYER (right, clipped by the slider position) */}
            <div
              className="absolute inset-0 bg-[#0E0F12]"
              style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08)_0%,transparent_60%)] pointer-events-none" />
              <div className="relative h-full flex flex-col p-6 sm:p-10">
                {/* New header */}
                <div className="flex items-center justify-between mb-8 sm:mb-10">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                    <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-[#3B82F6] uppercase font-bold">
                      {t.problem.newLabel}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[#3B82F6]/60 uppercase">
                    PHANTOM
                  </span>
                </div>

                {/* New items: bright, modern */}
                <div className="flex flex-col gap-6 sm:gap-7">
                  {newItems.map((item, i) => {
                    const Icon = newIcons[i] || ShieldCheck;
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] shadow-glow-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display font-medium text-base sm:text-lg text-[#F5F5F0] mb-1">
                            {item.title}
                          </h4>
                          <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Real screenshots of the app */}
                <div className="hidden md:flex items-end justify-center gap-4 mt-auto pt-8">
                  {newShots.map((pair, i) => (
                    <figure key={i} className="w-20">
                      <div className="rounded-[14px] border border-white/[0.08] bg-[#12141A] p-1.5 shadow-[0_0_24px_rgba(59,130,246,0.1)]">
                        <img
                          src={`${base}app-shots/${pair[0]}`}
                          alt={oldItems[i].shotLabels[0]}
                          loading="lazy"
                          className="w-full rounded-[10px] aspect-[9/19] object-cover object-top"
                        />
                      </div>
                      <figcaption className="text-center text-[9px] text-gray-500 mt-2 font-mono truncate">
                        {oldItems[i].shotLabels[0]}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            {/* DIVIDER HANDLE */}
            <div
              className="absolute inset-y-0 z-20 flex items-center justify-center pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute inset-y-0 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-[#3B82F6]/60 to-transparent" />
              <div
                className="relative -translate-x-1/2 w-10 h-10 rounded-full border border-[#3B82F6]/50 bg-[#12141A]/90 flex items-center justify-center text-[#3B82F6] shadow-glow-md cursor-ew-resize pointer-events-auto"
                style={{ touchAction: "none" }}
                role="slider"
                aria-label={`${t.problem.oldLabel} / ${t.problem.newLabel}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pos)}
              >
                <ChevronsLeftRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Caption under the slider */}
        <p className="text-center font-mono text-[10px] sm:text-[11px] tracking-[0.2em] text-gray-600 uppercase mt-6">
          ◄ {"//"} {t.problem.oldLabel} — {t.problem.newLabel} {"//"} ►
        </p>
      </div>
    </section>
  );
});

export default ProblemSection;
