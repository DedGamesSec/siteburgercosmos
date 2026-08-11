import { useEffect, useRef, type RefObject } from "react";
import AssembledLogo from "./AssembledLogo";
import ScanCard from "./ScanCard";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import { INTRO_DICT } from "./IntroSection";
import { HelpCircle, Shield, Eye } from "lucide-react";

const INTRO_ICONS = [HelpCircle, Shield, Eye];
const INTRO_COLORS = [
  "border-[#3B82F6]/40 text-[#3B82F6] bg-[#3B82F6]/5",
  "border-[#2DD4BF]/40 text-[#2DD4BF] bg-[#2DD4BF]/5",
  "border-[#FB923C]/40 text-[#FB923C] bg-[#FB923C]/5"
];

// The 2D logo assembly SVG. It's driven imperatively from a rAF loop (direct DOM
// writes via AssembledLogo's progressRef mode), so it never causes a React
// re-render while the flight advances.
function LogoAssembly({ ecoMode, progressRef }: { ecoMode: boolean; progressRef: { current: number } }) {
  return (
    <AssembledLogo
      progressRef={progressRef}
      phaseStart={0.44}
      phaseSpan={0.06}
      ecoMode={ecoMode}
      className="scale-[0.55] sm:scale-[0.7] origin-center"
    />
  );
}

interface CinematicOverlaysProps {
  progressRef: { current: number };
  heroRef: RefObject<HTMLDivElement | null>;
  onEnterDome: () => void;
}

export default function CinematicOverlays({ progressRef, heroRef, onEnterDome }: CinematicOverlaysProps) {
  const { t, language } = useTranslation();
  const { ecoMode } = useEcoMode();
  const introContent = INTRO_DICT[language] || INTRO_DICT.en;

  const leftLabelRef = useRef<HTMLDivElement>(null);
  const rightLabelRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // A single rAF loop drives every overlay by writing opacity/transform straight to
  // the DOM. No React re-render, no CSS transitions fighting the per-frame updates —
  // the flight animates exactly as fast as the display refreshes.
  useEffect(() => {
    let raf = 0;
    let lastP = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const p = progressRef.current;
      if (p === lastP) return;
      lastP = p;

      if (heroRef.current) {
        const f = Math.min(1, p / 0.52);
        heroRef.current.style.opacity = String(Math.max(0, 1 - f));
        heroRef.current.style.transform = `scale(${1 + 0.14 * f})`;
      }

      // OFFLINE-FIRST / ZERO TELEMETRY labels fade in beside the assembled logo
      // with a small drift, then fade out — the original pre-3cc7f6aa behavior.
      const cLabelT = p > 0.48 ? Math.min(1, (p - 0.48) / 0.15) : 0;
      const cLabelOut = p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.08) : 1;
      const cLabelOp = cLabelT * cLabelOut;
      const cLogoOp = Math.max(
        0,
        Math.min(1, (p - 0.44) / 0.08) * (1 - Math.max(0, (p - 0.66) / 0.06))
      );
      const cArrowT = p > 0.85 ? Math.min(1, (p - 0.85) / 0.1) : 0;
      const cIntroOp = p > 0.9 ? Math.min(1, (p - 0.9) / 0.08) : 0;

      if (leftLabelRef.current) {
        const x = cLabelOp > 0 ? -40 * (1 - Math.min(1, cLabelOp)) : -40;
        leftLabelRef.current.style.opacity = String(cLabelOp);
        leftLabelRef.current.style.transform = `translateX(${x}px)`;
      }
      if (rightLabelRef.current) {
        const x = cLabelOp > 0 ? 40 * (1 - Math.min(1, cLabelOp)) : 40;
        rightLabelRef.current.style.opacity = String(cLabelOp);
        rightLabelRef.current.style.transform = `translateX(${x}px)`;
      }
      if (logoWrapRef.current) {
        logoWrapRef.current.style.opacity = String(cLogoOp);
        logoWrapRef.current.style.transform = `scale(${0.9 + cLogoOp * 0.1})`;
      }
      if (introRef.current) introRef.current.style.opacity = String(cIntroOp);
      if (arrowRef.current) arrowRef.current.style.opacity = String(cArrowT);

      cardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const cardStart = 0.9 + idx * 0.025;
        const cardIn = Math.max(0, Math.min(1, (p - cardStart) / 0.045));
        el.style.opacity = String(cardIn);
        el.style.transform = `translateY(${-70 * (1 - cardIn)}px) scale(${0.75 + cardIn * 0.25})`;
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [progressRef, heroRef]);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Status labels during assembly */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 w-full max-w-5xl mx-auto px-4">
          <div
            ref={leftLabelRef}
            className="flex flex-col items-center lg:items-end text-center lg:text-right w-full lg:w-64"
            style={{ opacity: 0 }}
          >
            <span className="font-display font-medium text-xl sm:text-2xl text-[#F5F5F0] tracking-tighter">
              {t.assembly?.leftPrimary || "OFFLINE-FIRST"}
            </span>
            <span className="font-mono text-[9px] sm:text-[10px] text-[#3B82F6] tracking-wider mt-1.5 uppercase">
              {t.assembly?.leftSub || "// ДАННЫЕ НЕ ПОКИДАЮТ УСТРОЙСТВО"}
            </span>
          </div>

          <div className="w-32 sm:w-44 shrink-0 hidden lg:block" />

          <div
            ref={logoWrapRef}
            className="shrink-0"
            id="cinematic-assembled-logo"
            style={{ opacity: 0, pointerEvents: "none" }}
          >
            <LogoAssembly ecoMode={ecoMode} progressRef={progressRef} />
          </div>

          <div className="w-32 sm:w-44 shrink-0 hidden lg:block" />

          <div
            ref={rightLabelRef}
            className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-64"
            style={{ opacity: 0 }}
          >
            <span className="font-display font-medium text-xl sm:text-2xl text-[#F5F5F0] tracking-tighter">
              {t.assembly?.rightPrimary || "ZERO TELEMETRY"}
            </span>
            <span className="font-mono text-[9px] sm:text-[10px] text-[#3B82F6] tracking-wider mt-1.5 uppercase">
              {t.assembly?.rightSub || "// НИКАКОЙ ТЕЛЕМЕТРИИ"}
            </span>
          </div>
        </div>
      </div>

      {/* "Всё просто о TrustNode" — full intro content over the Earth screen:
          badge, title, subtitle and three step cards */}
      <div
        ref={introRef}
        className="absolute inset-x-0 top-0 flex flex-col items-center gap-3 sm:gap-4 px-4 pt-[14vh] sm:pt-[16vh] pb-[22vh]"
        style={{ opacity: 0 }}
      >
        <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-[#3B82F6] uppercase font-bold">
          {introContent.badge}
        </span>
        <h2 className="font-display font-medium text-xl sm:text-3xl text-[#F5F5F0] tracking-tighter text-center max-w-3xl">
          {introContent.title}
        </h2>
        <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed text-center max-w-xl">
          {introContent.subtitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-4xl mt-1">
          {introContent.steps.map((step, idx) => {
            const IconComponent = INTRO_ICONS[idx];
            const colorClass = INTRO_COLORS[idx];
            return (
              <div
                key={idx}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className="h-full"
                style={{ opacity: 0, willChange: "transform, opacity" }}
              >
                <ScanCard padding="p-4 sm:p-5" cardClassName="h-full" className="h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                        {step.tag}
                      </span>
                      <div className={`p-1.5 sm:p-2 border ${colorClass}`}>
                        <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <h3 className="font-display font-medium text-sm sm:text-lg text-[#F5F5F0] mb-1.5 sm:mb-3">
                      {step.title}
                    </h3>
                    <p className="font-sans text-[10px] sm:text-xs text-gray-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </ScanCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enter-dome navigator at the end of the flight */}
      <div
        ref={arrowRef}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center"
        style={{ opacity: 0 }}
      >
        <button
          onClick={onEnterDome}
          className="flex flex-col items-center gap-3 cursor-pointer group z-30 transition-all duration-300 pointer-events-auto"
          id="enter-dome-arrow-btn"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-sm border border-[#3C404A] bg-[#12141A]/60 group-hover:border-[#2DD4BF] group-hover:shadow-glow-success transition-all duration-300">
            <svg
              className="w-5 h-5 text-[#8B8F9C] group-hover:text-[#2DD4BF] transition-colors translate-y-0 group-hover:translate-y-0.5 transition-transform animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
            </svg>
          </div>
          <span className="font-mono text-[9px] tracking-[0.3em] text-[#8B8F9C] group-hover:text-[#2DD4BF] transition-colors uppercase font-bold animate-pulse mt-2">
            {t.hero.enterDome}
          </span>
        </button>
      </div>
    </div>
  );
}
