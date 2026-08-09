import { useLayoutEffect, useRef, useState } from "react";
import { ShieldCheck, PhoneOff, Cpu, BellRing } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";

export default function ProtectionMarquee() {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();

  const items: string[] = [
    ...t.trust.stats.map((s) => s.label),
    ...t.security.features.map((f) => f.title),
    ...t.how.layers.map((l) => l.name),
  ].filter(Boolean);

  // Repeat the base list until a single pass is at least as wide as the viewport.
  // With the track animating -50% over two identical passes this guarantees the
  // stream never shows the same item twice on screen at once (no visible seam
  // duplication, even on ultra-wide displays).
  const [passes, setPasses] = useState(1);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el || items.length === 0) return;
    const update = () => {
      const onePass = el.scrollWidth;
      if (onePass <= 0) return;
      const needed = Math.max(1, Math.ceil(window.innerWidth / onePass) + 1);
      setPasses((cur) => (cur === needed ? cur : needed));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [items]);

  if (items.length === 0) return null;

  const Icons = [ShieldCheck, PhoneOff, Cpu, BellRing];

  const renderItems = (passIndex: number, repeatCount: number) => (
    <div
      key={passIndex}
      className="flex items-center gap-10 pr-10"
      aria-hidden="true"
    >
      {Array.from({ length: repeatCount }).map((_, repeatIdx) =>
        items.map((item, idx) => {
          const Icon = Icons[idx % Icons.length];
          return (
            <span
              key={`${repeatIdx}-${idx}`}
              className="flex items-center gap-2 font-mono text-xs sm:text-sm uppercase tracking-wider text-gray-400"
            >
              <Icon className="w-3.5 h-3.5 text-[#3B82F6]" />
              {item}
              <span className="ml-6 w-1.5 h-1.5 rounded-full bg-[#3B82F6]/40" />
            </span>
          );
        }),
      )}
    </div>
  );

  // Eco mode has no motion, so render a single static pass (no animation class,
  // no second copy => no visible duplication).
  const passesCount = ecoMode ? 1 : 2;

  return (
    <div
      className="marquee relative w-full overflow-hidden border-y border-[#3C404A]/40 bg-[#0A0A0B] py-3.5 select-none"
      aria-hidden="true"
    >
      {/* Hidden single-pass measurer: one copy of the base list, used to compute
          how many repeats are needed to fill the viewport. */}
      <div
        ref={measureRef}
        className="flex items-center gap-10 pr-10 absolute left-0 top-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        {items.map((item, idx) => {
          const Icon = Icons[idx % Icons.length];
          return (
            <span
              key={`m-${idx}`}
              className="flex items-center gap-2 font-mono text-xs sm:text-sm uppercase tracking-wider text-gray-400"
            >
              <Icon className="w-3.5 h-3.5 text-[#3B82F6]" />
              {item}
              <span className="ml-6 w-1.5 h-1.5 rounded-full bg-[#3B82F6]/40" />
            </span>
          );
        })}
      </div>

      <div
        className={`flex w-max items-center whitespace-nowrap ${ecoMode ? "" : "marquee-track"}`}
      >
        {Array.from({ length: passesCount }).map((_, i) => renderItems(i, passes))}
      </div>
    </div>
  );
}
