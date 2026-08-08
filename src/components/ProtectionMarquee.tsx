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

  if (items.length === 0) return null;

  const Icons = [ShieldCheck, PhoneOff, Cpu, BellRing];

  return (
    <div
      className="marquee relative w-full overflow-hidden border-y border-[#3C404A]/40 bg-[#0A0A0B] py-3.5 select-none"
      aria-hidden="true"
    >
      <div
        className={`flex w-max items-center whitespace-nowrap ${ecoMode ? "" : "marquee-track"}`}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-10 pr-10" aria-hidden="true">
            {items.map((item, idx) => {
              const Icon = Icons[idx % Icons.length];
              return (
                <span
                  key={`${copy}-${idx}`}
                  className="flex items-center gap-2 font-mono text-xs sm:text-sm uppercase tracking-wider text-gray-400"
                >
                  <Icon className="w-3.5 h-3.5 text-[#3B82F6]" />
                  {item}
                  <span className="ml-6 w-1.5 h-1.5 rounded-full bg-[#3B82F6]/40" />
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
