import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";
import ScanCard from "./ScanCard";

const base = typeof import.meta !== "undefined" ? import.meta.env.BASE_URL : "/";

// Scroll segments: one problem per third of the section's scroll range.
const T1 = 1 / 3;
const T2 = 2 / 3;

interface ShotPair {
  primary: string;
  secondary: string;
}

const problemShots: ShotPair[] = [
  { primary: "threat-screen.jpg", secondary: "threat-history.jpg" },
  { primary: "statistics.jpg", secondary: "main-screen.jpg" },
  { primary: "settings.jpg", secondary: "assistant.jpg" },
];

function PhoneFrame({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  return (
    <figure className={`w-[150px] sm:w-[190px] ${className}`}>
      <div className="rounded-[28px] border border-white/10 bg-[#12141A] p-2 shadow-[0_20px_60px_rgba(59,130,246,0.15)]">
        <img
          src={`${base}app-shots/${src}`}
          alt={label}
          loading="lazy"
          className="w-full rounded-[20px] aspect-[9/19] object-cover object-top"
        />
      </div>
      <figcaption className="text-center text-[11px] text-gray-500 mt-3 font-mono">
        {label}
      </figcaption>
    </figure>
  );
}

// Two phone frames layered with opposite 3D tilts; secondary peeks out behind.
function PhoneGroup({ pair, labels, side }: { pair: ShotPair; labels: [string, string]; side: "left" | "right" }) {
  const tilt = side === "left" ? 16 : -16;
  const backTilt = side === "left" ? -10 : 10;
  return (
    <div className="relative" style={{ perspective: "1200px" }}>
      <div
        className="absolute -top-6 -right-8 opacity-70"
        style={{ transform: `rotateY(${backTilt}deg) rotateZ(${side === "left" ? 5 : -5}deg)` }}
      >
        <PhoneFrame src={pair.secondary} label={labels[1]} />
      </div>
      <div style={{ transform: `rotateY(${tilt}deg)` }}>
        <PhoneFrame src={pair.primary} label={labels[0]} />
      </div>
    </div>
  );
}

const ProblemSection = React.memo(function ProblemSection() {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();

  const problems = t.problem.items.map((item, i) => ({
    id: `prob-${i + 1}`,
    title: item.title,
    desc: item.desc,
    stat: item.stat,
    statLabel: item.statLabel,
    statSource: item.statSource,
    shotLabels: item.shotLabels,
  }));

  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Phone 1 (right): stays put, then exits right when scrolling to problem 2.
  const phone1X = useTransform(scrollYProgress, [0, T1 - 0.05, T1], ["0vw", "0vw", "60vw"]);
  const phone1O = useTransform(scrollYProgress, [T1 - 0.04, T1], [1, 0]);

  // Phone 2 (left): enters from the left, holds, exits left for problem 3.
  const phone2X = useTransform(scrollYProgress, [T1, T1 + 0.05, T2 - 0.05, T2], ["-60vw", "0vw", "0vw", "-60vw"]);
  const phone2O = useTransform(scrollYProgress, [T1, T1 + 0.04, T2 - 0.04, T2], [0, 1, 1, 0]);

  // Phone 3 (right): enters from the right, holds to the end.
  const phone3X = useTransform(scrollYProgress, [T2, T2 + 0.05, 1], ["60vw", "0vw", "0vw"]);
  const phone3O = useTransform(scrollYProgress, [T2, T2 + 0.04, 1], [0, 1, 1]);

  // Text blocks slide/slide-out opposite to their phones.
  const text1X = useTransform(scrollYProgress, [0, T1 - 0.05, T1], ["0vw", "0vw", "-8vw"]);
  const text1O = useTransform(scrollYProgress, [T1 - 0.04, T1], [1, 0]);
  const text2X = useTransform(scrollYProgress, [T1, T1 + 0.05, T2 - 0.05, T2], ["8vw", "0vw", "0vw", "8vw"]);
  const text2O = useTransform(scrollYProgress, [T1, T1 + 0.04, T2 - 0.04, T2], [0, 1, 1, 0]);
  const text3X = useTransform(scrollYProgress, [T2, T2 + 0.05, 1], ["-8vw", "0vw", "0vw"]);
  const text3O = useTransform(scrollYProgress, [T2, T2 + 0.04, 1], [0, 1, 1]);

  const renderTextBlock = (problem: (typeof problems)[number], n: string) => (
    <div className="relative max-w-md md:max-w-lg">
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-5xl sm:text-6xl font-black text-[#3C404A] leading-none select-none">
          {n}
        </span>
        <div className="h-[2px] flex-1 bg-gradient-to-r from-[#3B82F6]/40 to-transparent" />
      </div>
      <h3 className="font-display font-medium text-2xl sm:text-4xl text-[#F5F5F0] mb-4">
        {problem.title}
      </h3>
      <p className="font-sans text-sm sm:text-base text-gray-400 leading-relaxed">
        {problem.desc}
      </p>
      <div className="mt-6 border border-white/[0.06] rounded-lg bg-white/[0.02] p-4">
        <div className="flex items-start gap-3">
          <span className="font-mono text-2xl sm:text-3xl font-bold text-[#3B82F6] leading-none pt-1 shrink-0">
            {problem.stat}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm text-gray-300 leading-snug">{problem.statLabel}</p>
            <p className="font-sans text-[11px] text-gray-500 mt-1.5">{problem.statSource}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Eco mode: no sticky/motion, just the static alternating grid.
  if (ecoMode) {
    return (
      <section className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden" id="problem">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <SectionBadge variant="slash" label={t.problem.badge} className="mb-6" />
            <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
              {t.problem.titleLine1} <br className="hidden sm:inline" />
              <span className="text-[#3B82F6]">{t.problem.titleHighlight}</span>
            </h2>
            <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
              {t.problem.subtitle}
            </p>
          </div>

          <div className="flex flex-col">
            {problems.map((problem, i) => (
              <div
                key={problem.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center mb-16 sm:mb-24 last:mb-0"
              >
                <div className={i % 2 === 1 ? "md:order-2" : "md:order-1"}>
                  <ScanCard className="h-full">
                    {renderTextBlock(problem, String(i + 1).padStart(2, "0"))}
                  </ScanCard>
                </div>
                <div className={i % 2 === 1 ? "md:order-1" : "md:order-2"}>
                  <div className="flex justify-center gap-4 sm:gap-6">
                    {problemShots[i] && (
                      <>
                        <figure className="w-1/2 max-w-[220px]">
                          <div className="rounded-[28px] border border-white/[0.08] bg-[#12141A] p-2 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                            <img
                              src={`${base}app-shots/${problemShots[i].primary}`}
                              alt={problem.shotLabels[0]}
                              loading="lazy"
                              className="w-full rounded-[20px] aspect-[9/19] object-cover object-top"
                            />
                          </div>
                          <figcaption className="text-center text-[11px] text-gray-500 mt-3 font-mono">
                            {problem.shotLabels[0]}
                          </figcaption>
                        </figure>
                        <figure className="w-1/2 max-w-[220px]">
                          <div className="rounded-[28px] border border-white/[0.08] bg-[#12141A] p-2 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                            <img
                              src={`${base}app-shots/${problemShots[i].secondary}`}
                              alt={problem.shotLabels[1]}
                              loading="lazy"
                              className="w-full rounded-[20px] aspect-[9/19] object-cover object-top"
                            />
                          </div>
                          <figcaption className="text-center text-[11px] text-gray-500 mt-3 font-mono">
                            {problem.shotLabels[1]}
                          </figcaption>
                        </figure>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-[#0A0A0B] overflow-hidden" id="problem">
      {/* Section Header (scrolls away normally) */}
      <div className="relative z-10 px-4 pt-16 sm:pt-20 pb-8 sm:pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <SectionBadge variant="slash" label={t.problem.badge} className="mb-6" />
          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.problem.titleLine1} <br className="hidden sm:inline" />
            <span className="text-[#3B82F6]">{t.problem.titleHighlight}</span>
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.problem.subtitle}
          </p>
        </div>
      </div>

      {/* Sticky scroll-driven stage */}
      <div ref={sectionRef} className="relative" style={{ height: "400vh" }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* Background glow accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

          {/* Problem 1: text left, phone right */}
          <motion.div
            style={{ opacity: text1O, x: text1X }}
            className="absolute left-0 right-0 top-0 bottom-1/2 md:bottom-0 md:w-1/2 md:right-auto flex items-start justify-center pt-14 md:items-center md:pt-0 px-6 z-10"
          >
            {renderTextBlock(problems[0], "01")}
          </motion.div>
          <motion.div
            style={{ opacity: phone1O, x: phone1X }}
            className="absolute left-0 right-0 top-1/2 md:top-0 md:left-auto md:right-0 md:w-1/2 md:h-full flex items-center justify-center pt-8 md:pt-0 pointer-events-none z-20"
          >
            <PhoneGroup pair={problemShots[0]} labels={problems[0].shotLabels} side="right" />
          </motion.div>

          {/* Problem 2: phone left, text right */}
          <motion.div
            style={{ opacity: text2O, x: text2X }}
            className="absolute left-0 right-0 top-0 bottom-1/2 md:bottom-0 md:left-1/2 md:right-0 flex items-start justify-center pt-14 md:items-center md:pt-0 px-6 z-10"
          >
            {renderTextBlock(problems[1], "02")}
          </motion.div>
          <motion.div
            style={{ opacity: phone2O, x: phone2X }}
            className="absolute left-0 right-0 top-1/2 md:top-0 md:right-auto md:left-0 md:w-1/2 md:h-full flex items-center justify-center pt-8 md:pt-0 pointer-events-none z-20"
          >
            <PhoneGroup pair={problemShots[1]} labels={problems[1].shotLabels} side="left" />
          </motion.div>

          {/* Problem 3: text left, phone right */}
          <motion.div
            style={{ opacity: text3O, x: text3X }}
            className="absolute left-0 right-0 top-0 bottom-1/2 md:bottom-0 md:w-1/2 md:right-auto flex items-start justify-center pt-14 md:items-center md:pt-0 px-6 z-10"
          >
            {renderTextBlock(problems[2], "03")}
          </motion.div>
          <motion.div
            style={{ opacity: phone3O, x: phone3X }}
            className="absolute left-0 right-0 top-1/2 md:top-0 md:left-auto md:right-0 md:w-1/2 md:h-full flex items-center justify-center pt-8 md:pt-0 pointer-events-none z-20"
          >
            <PhoneGroup pair={problemShots[2]} labels={problems[2].shotLabels} side="right" />
          </motion.div>
        </div>
      </div>
    </section>
  );
});

export default ProblemSection;
