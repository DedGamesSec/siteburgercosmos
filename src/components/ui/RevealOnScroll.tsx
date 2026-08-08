import React from "react";
import { motion, useReducedMotion } from "motion/react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  id?: string;
}

/**
 * Scroll-driven reveal: fade + rise when the element enters the viewport.
 * Collapses to instant (duration 0) under prefers-reduced-motion.
 */
export default function RevealOnScroll({
  children,
  delay = 0,
  y = 24,
  className,
  id,
}: RevealOnScrollProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: reducedMotion ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reducedMotion ? 0 : 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
