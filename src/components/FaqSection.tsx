import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";

export default function FaqSection() {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="relative w-full py-16 sm:py-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B] overflow-hidden"
    >
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3C404A] border border-[#3B82F6]/20 mb-6">
            <HelpCircle className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-[#3B82F6] uppercase">
              {t.faq.badge}
            </span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {t.faq.title}
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.faq.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {t.faq.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-md border transition-colors duration-300 ${
                  isOpen ? "border-[#3B82F6]/30 bg-[#12141A]" : "border-white/[0.06] bg-[#12141A]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer"
                >
                  <span
                    className={`font-display font-bold text-sm sm:text-base ${isOpen ? "text-[#F5F5F0]" : "text-gray-300"}`}
                  >
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 text-[#3B82F6] ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${index}`}
                      key="content"
                      initial={ecoMode ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={ecoMode ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 sm:px-6 pb-5 sm:pb-6 font-sans text-sm text-gray-400 leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
