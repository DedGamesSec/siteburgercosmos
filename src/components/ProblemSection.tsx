import React from "react";
import { motion } from "motion/react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";
import ScanCard from "./ScanCard";

const base = typeof import.meta !== "undefined" ? import.meta.env.BASE_URL : "/";

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

  const problemShots: [string, string][] = [
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
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <motion.div
            initial={ecoMode ? false : { opacity: 0, y: 20 }}
            whileInView={ecoMode ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
          <SectionBadge variant="slash" label={t.problem.badge} className="mb-6" />
          
          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.problem.titleLine1} <br className="hidden sm:inline" />
            <span className="text-[#3B82F6]">{t.problem.titleHighlight}</span>
          </h2>
          
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.problem.subtitle}
          </p>
          </motion.div>
        </div>

        {/* Vertical zigzag: alternating text / real screenshots per problem */}
        <div className="flex flex-col">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.id}
              id={problem.id}
              initial={ecoMode ? false : { opacity: 0, y: 24 }}
              whileInView={ecoMode ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center mb-16 sm:mb-24 last:mb-0"
            >
              {/* Text block */}
              <motion.div
                initial={ecoMode ? false : { opacity: 0, x: i % 2 === 1 ? 24 : -24 }}
                whileInView={ecoMode ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                className={i % 2 === 1 ? "md:order-2" : "md:order-1"}
              >
                <ScanCard className="h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-6xl sm:text-7xl font-black text-[#3C404A] leading-none select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className={`h-[2px] flex-1 ${i === 1 ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-[#3B82F6]/40 to-transparent`} />
                  </div>
                  <h3 className="font-display font-medium text-3xl sm:text-4xl text-[#F5F5F0] mb-4">
                    {problem.title}
                  </h3>
                  <p className="font-sans text-sm sm:text-base text-gray-400 leading-relaxed">
                    {problem.desc}
                  </p>

                  {/* Real statistic */}
                  <div className="mt-6 border border-white/[0.06] rounded-lg bg-white/[0.02] p-4">
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-2xl sm:text-3xl font-bold text-[#3B82F6] leading-none pt-1 shrink-0">
                        {problem.stat}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm text-gray-300 leading-snug">
                          {problem.statLabel}
                        </p>
                        <p className="font-sans text-[11px] text-gray-500 mt-1.5">
                          {problem.statSource}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScanCard>
              </motion.div>

              {/* Real screenshots of the app */}
              <motion.div
                initial={ecoMode ? false : { opacity: 0, x: i % 2 === 1 ? -24 : 24 }}
                whileInView={ecoMode ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                className={i % 2 === 1 ? "md:order-1" : "md:order-2"}
              >
                <div className="flex justify-center gap-4 sm:gap-6">
                  {problemShots[i].map((file, j) => (
                    <motion.figure
                      key={file}
                      initial={ecoMode ? false : { opacity: 0, y: 20, scale: 0.96 }}
                      whileInView={ecoMode ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.3, delay: i * 0.05 + j * 0.1, ease: "easeOut" }}
                      className="w-1/2 max-w-[220px]"
                    >
                      <div className="rounded-[28px] border border-white/[0.08] bg-[#12141A] p-2 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                        <img
                          src={`${base}app-shots/${file}`}
                          alt={problem.shotLabels[j]}
                          loading="lazy"
                          className="w-full rounded-[20px] aspect-[9/19] object-cover object-top"
                        />
                      </div>
                      <figcaption className="text-center text-[11px] text-gray-500 mt-3 font-mono">
                        {problem.shotLabels[j]}
                      </figcaption>
                    </motion.figure>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
});

export default ProblemSection;
