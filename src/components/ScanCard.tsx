import React from "react";
import { motion } from "motion/react";
import { useEcoMode } from "../context/EcoModeContext";

type ScanState = "idle" | "active" | "exiting";

interface ScanCardProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  accent?: string;
  className?: string;
  borderColor?: string;
  cardClassName?: string;
  children?: React.ReactNode;
  id?: string;
  onClick?: () => void;
  padding?: string;
}

/**
 * Единый дизайн-контейнер карточки по образцу "Безопасности купола" (/tech):
 * тёмная панель с тонкой рамкой, сканирующая полоса при наведении и бокс-иконка.
 * Используется для всех блочных карточек сайта.
 */
const ScanCard = React.forwardRef<HTMLDivElement, ScanCardProps>(
  (
    {
      icon,
      title,
      accent = "59,130,246",
      className = "",
      borderColor = "border-white/[0.04]",
      cardClassName = "",
      children,
      id,
      onClick,
      padding = "p-6 sm:p-8",
    },
    ref
  ) => {
    const { ecoMode } = useEcoMode();
    const [scan, setScan] = React.useState<ScanState>("idle");
    const scanning = !ecoMode && scan !== "idle";

    return (
      <div
        ref={ref}
        id={id}
        onClick={onClick}
        className={`relative ${padding} rounded-2xl bg-[#0A0A0B]/95 border ${borderColor} hover:border-[#3B82F6]/40 transition-all duration-300 group flex flex-col overflow-hidden ${cardClassName}`}
        style={{
          boxShadow: "var(--shadow-card, 0 1px 2px rgba(0,0,0,0.06))",
          ["--accent-color" as string]: `rgba(${accent}, 0.35)`,
        }}
        onMouseEnter={() => { if (!ecoMode) setScan("active"); }}
        onMouseLeave={() => {
          if (!ecoMode) setScan((s) => (s === "active" ? "exiting" : s));
        }}
      >
        {/* Dot-grid texture (Supabase-style) — subtle, fades in on hover */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            backgroundImage: "radial-gradient(rgba(59,130,246,0.12) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse at top, black 0%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at top, black 0%, transparent 75%)",
          }}
        />
        {/* Accent glow — soft bloom around the card on hover */}
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: "0 0 24px -8px var(--accent-color)",
          }}
        />
        {scanning && (
          <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden rounded-2xl">
            <motion.div
              className="absolute left-0 w-full h-[2px]"
              style={{
                background: `linear-gradient(to right, transparent, rgba(${accent},0.5), transparent)`,
                boxShadow: `0 0 10px rgba(${accent},0.35)`,
              }}
              animate={scan === "active" ? { top: ["-12%", "102%"] } : { top: "102%" }}
              transition={
                scan === "active"
                  ? { duration: 4.5, ease: "linear", repeat: Infinity }
                  : { duration: 0.2, ease: "easeIn" }
              }
              onAnimationComplete={() => {
                if (scan === "exiting") setScan("idle");
              }}
            />
          </div>
        )}

        <div className={`relative z-10 flex flex-col flex-1 ${className}`}>
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-[#12141A] flex items-center justify-center border border-[#3B82F6]/10 shrink-0 group-hover:border-[#3B82F6]/30 transition-all duration-300 mb-4">
              {icon}
            </div>
          )}
          {title !== undefined && (
            <h3 className="font-display font-medium text-base sm:text-lg text-[#F5F5F0] mb-2 group-hover:text-[#3B82F6] transition-all duration-300">
              {title}
            </h3>
          )}
          {children}
        </div>
      </div>
    );
  }
);

ScanCard.displayName = "ScanCard";

export default ScanCard;