import React from "react";

export type SectionBadgeVariant = "pill" | "slash" | "brackets";

interface SectionBadgeProps {
  variant?: SectionBadgeVariant;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

const LABEL =
  "font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-[#3B82F6] uppercase";

const SectionBadge: React.FC<SectionBadgeProps> = ({
  variant = "pill",
  label,
  icon,
  className = "",
}) => {
  if (variant === "slash") {
    return (
      <div className={`flex items-center justify-center gap-2.5 ${className}`}>
        {icon}
        <span
          aria-hidden
          className="font-mono text-sm sm:text-base font-bold leading-none text-[#3B82F6]/40"
        >
          /
        </span>
        <span className={LABEL}>{label}</span>
      </div>
    );
  }

  if (variant === "brackets") {
    return (
      <div
        className={`inline-flex items-center justify-center gap-2 ${className}`}
      >
        <span aria-hidden className="font-mono font-semibold text-[#3B82F6]/45">
          [
        </span>
        <span className={LABEL}>{label}</span>
        <span aria-hidden className="font-mono font-semibold text-[#3B82F6]/45">
          ]
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
    >
      {icon}
      <span className={LABEL}>{label}</span>
    </div>
  );
};

export default SectionBadge;
