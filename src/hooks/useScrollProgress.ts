import { useEffect, useState, type RefObject } from "react";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Scroll-driven progress (0..1) for a section: 0 when the element's top is just
 * entering the viewport from below, 1 once it has fully passed the viewport.
 * rAF-throttled like the main cinematic in App.tsx.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let current = 0;

    const compute = () => {
      const el = ref.current;
      if (!el) return;
      const vh = window.innerHeight || 800;
      const rect = el.getBoundingClientRect();
      // 0 while the section waits below the viewport, 1 once it has left the top.
      const p = clamp01((vh - rect.top) / (vh + rect.height));
      if (Math.abs(p - current) > 0.0005) {
        current = p;
        setProgress(p);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);

  return progress;
}
