import { useMemo, useState } from "react";
import { Calculator, ShieldCheck } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";
import ScanCard from "./ScanCard";

const CURRENCY_BY_LANG: Record<string, string> = {
  ru: "RUB",
  en: "USD",
  es: "EUR",
  zh: "CNY",
  tr: "TRY",
  hi: "INR",
  ar: "EGP",
  pt: "BRL",
  fr: "EUR",
  de: "EUR",
  ja: "JPY",
};

const BLOCK_RATE = 0.92;

export default function DamageCalculator() {
  const { t, language } = useTranslation();
  const { ecoMode } = useEcoMode();
  const currency = CURRENCY_BY_LANG[language] || "USD";

  const [calls, setCalls] = useState(8);
  const [loss, setLoss] = useState(40000);

  const prevented = useMemo(() => Math.round(calls * loss * BLOCK_RATE * 12), [calls, loss]);

  const formatter = useMemo(
    () => new Intl.NumberFormat(language, { style: "currency", currency, maximumFractionDigits: 0 }),
    [language, currency],
  );

  const steps = [1, 5, 10, 15, 20, 25, 30];

  return (
    <section
      id="damage-calculator"
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <SectionBadge variant="slash" icon={<Calculator className="w-3.5 h-3.5 text-[#3B82F6]" />} label={t.damageCalc.badge} className="mb-6" />
          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.damageCalc.title}
          </h2>
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.damageCalc.subtitle}
          </p>
        </div>

        <ScanCard accent="59,130,246" borderColor="border-white/[0.06]" cardClassName="bg-[#12141A]" padding="p-6 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
            <div>
              <label htmlFor="calc-calls" className="block font-sans text-sm text-gray-300 mb-3">
                {t.damageCalc.callsLabel}
              </label>
              <input
                id="calc-calls"
                type="range"
                min={1}
                max={30}
                step={1}
                value={calls}
                onChange={(e) => setCalls(Number(e.target.value))}
                aria-valuetext={`${calls} ${t.damageCalc.callsLabel}`}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
              <div className="flex items-center justify-between mt-2">
                {steps.map((s) => (
                  <span
                    key={s}
                    className={`font-mono text-[10px] ${s === calls ? "text-[#3B82F6] font-bold" : "text-gray-600"}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-3 font-mono text-sm text-[#F5F5F0]">{calls}</div>
            </div>

            <div>
              <label htmlFor="calc-loss" className="block font-sans text-sm text-gray-300 mb-3">
                {t.damageCalc.amountLabel}
              </label>
              <input
                id="calc-loss"
                type="range"
                min={1000}
                max={1000000}
                step={1000}
                value={loss}
                onChange={(e) => setLoss(Number(e.target.value))}
                aria-valuetext={`${formatter.format(loss)} (${t.damageCalc.amountLabel})`}
                className="w-full accent-[#3B82F6] cursor-pointer"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-[10px] text-gray-600">{formatter.format(1000)}</span>
                <span className="font-mono text-[10px] text-gray-600">{formatter.format(1000000)}</span>
              </div>
              <div className="mt-3 font-mono text-sm text-[#F5F5F0]">{formatter.format(loss)}</div>
            </div>
          </div>

          <ScanCard accent="59,130,246" borderColor="border-[#3B82F6]/20" cardClassName="bg-[#12141A]" padding="p-6 sm:p-8" className="items-center text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mb-2">
              {t.damageCalc.resultTitle}
            </div>
            <div
              className={`font-display font-medium text-4xl sm:text-6xl text-[#3B82F6] tracking-tighter mb-3 ${ecoMode ? "" : "transition-colors duration-300"}`}
            >
              {formatter.format(prevented)}
            </div>
            <div className="flex items-center justify-center gap-2 font-sans text-sm text-gray-300">
              <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
              {t.damageCalc.savedLabel}
            </div>
          </ScanCard>

          <p className="mt-6 font-sans text-xs text-gray-600 text-center leading-relaxed">
            {t.damageCalc.disclaimer}
          </p>
        </ScanCard>
      </div>
    </section>
  );
}
