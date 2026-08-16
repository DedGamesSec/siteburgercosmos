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
  scanDisabled?: boolean;
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
      scanDisabled = false,
    },
    ref
  ) => {
    const { ecoMode } = useEcoMode();
    const [scan, setScan] = React.useState<ScanState>("idle");
    const scanning = !ecoMode && !scanDisabled && scan !== "idle";

    return (
      <div
        ref={ref}
        id={id}
        onClick={onClick}
        className={`relative ${padding} rounded-2xl bg-[#0A0A0B]/95 border ${borderColor} hover:border-[#3B82F6]/40 transition-all duration-300 group flex flex-col overflow-hidden ${cardClassName}`}
        onPointerEnter={(e) => { if (e.pointerType === "mouse" && !ecoMode && !scanDisabled) setScan("active"); }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !ecoMode && !scanDisabled) setScan((s) => (s === "active" ? "exiting" : s));
        }}
      >
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
                  ? { duration: 2, ease: "linear", repeat: Infinity }
                  : { duration: 0.8, ease: "easeOut" }
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