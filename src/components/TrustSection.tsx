import React, { useRef } from "react";
import { Award, FileText, Compass, Percent } from "lucide-react";
import { useInView } from "motion/react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import ScanCard from "./ScanCard";

const STAT_ICONS = [FileText, Award, Compass, Percent];

// Count-up from 0 to the target on mount (triggered when the card enters view).
// Only clean single-number values (e.g. "~82.4%", "92%") are animated; technical
// codes and multi-value strings ("IPC G06F 21/55", "92% / 88%") render as-is.
const AnimatedStatNumber = ({ value, start }: { value: string; start: boolean }) => {
  const [displayValue, setDisplayValue] = React.useState("");
  const tokens = value.match(/\d+(?:\.\d+)?/g) || [];
  const hasLetters = /[A-Za-zА-Яа-яЁё]/.test(value);
  const isCountable = tokens.length === 1 && !hasLetters;
  const targetNum = isCountable ? parseFloat(tokens[0]) : null;
  const isPercent = value.includes("%");
  const isApprox = value.includes("~");

  React.useEffect(() => {
    if (!start || targetNum === null) {
      setDisplayValue(start ? value : "");
      return;
    }
    const duration = 1400; // ms
    const stepTime = 30; // ms
    const totalSteps = duration / stepTime;
    const increment = targetNum / totalSteps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, targetNum);
      if (step >= totalSteps) {
        clearInterval(timer);
        setDisplayValue(value);
      } else if (isPercent) {
        setDisplayValue(`${isApprox ? "~" : ""}${current.toFixed(1)}%`);
      } else {
        setDisplayValue(value.replace(/\d+(\.\d+)?/, Math.round(current).toString()));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, targetNum, start]);

  return <span>{displayValue}</span>;
};

interface StatCardProps {
  stat: { id: string; Icon: React.ComponentType<any>; val: string; label: string; desc: string };
}

const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });
  const { ecoMode } = useEcoMode();

return (
    <ScanCard
      ref={ref}
      id={stat.id}
      cardClassName="hover:shadow-[0_8px_35px_rgba(59,130,246,0.12)]"
    >
      <div className="min-h-[170px] flex flex-col">

        {/* Micro-badge styled icon wrapper */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#12141A] border border-[#3B82F6]/10 shadow-glow-sm group-hover:border-[#3B82F6]/30 transition-all duration-300 group-hover:scale-[1.05]">
            <stat.Icon className="w-5 h-5 text-[#3B82F6]" />
          </div>
        </div>

        {/* Big typography for values */}
        <div className="font-display font-medium text-2xl sm:text-3xl lg:text-[24px] xl:text-[28px] leading-tight text-[#F5F5F0] tracking-tighter mb-2 group-hover:text-[#3B82F6] transition-colors duration-300">
          {ecoMode ? stat.val : <AnimatedStatNumber value={stat.val} start={inView} />}
        </div>

        {/* Small title */}
        <div className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#3B82F6] mb-4">
          {stat.label}
        </div>
      </div>

      <p className="font-sans text-xs text-gray-400 leading-relaxed border-t border-[#3C404A]/30 pt-4 mt-2 relative z-10">
        {stat.desc}
      </p>
    </ScanCard>
  );
};

const TrustSection = React.memo(function TrustSection() {
  const { t } = useTranslation();
  const stats = t.trust.stats.map((stat, i) => ({
    id: `stat-${i + 1}`,
    Icon: STAT_ICONS[i],
    val: stat.val,
    label: stat.label,
    desc: stat.desc,
  }));

  return (
    <section 
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B]" 
      id="trust-section"
    >
      {/* Absolute radial light strictly behind the center of cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-[#3B82F6] uppercase mb-6">
            {t.trust.badge}
          </div>

          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.trust.title} <span className="text-[#3B82F6]">{t.trust.titleHighlight}</span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.trust.subtitle}
          </p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 sm:gap-9">
          {stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>

      </div>
    </section>
  );
});

export default TrustSection;
