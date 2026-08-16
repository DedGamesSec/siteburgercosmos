import { useEffect, useRef } from "react";

interface UseSectionSnapOptions {
  enabled: boolean;
  reducedMotion: boolean;
  /** Snap only activates once the page has scrolled past this vertical offset (e.g. cinematic corridor). */
  gateOffset: () => number;
  /** Return the live list of snap targets. Refreshed on every wheel event. */
  getTargets: () => HTMLElement[];
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const WHEEL_THRESHOLD = 12;
const TWEN_DURATION = 650;
const MAX_SNAP_ABOVE_VIEWPORT = 120; // px of a section's top allowed to already be above the fold

/**
 * Smooth snap scroll between full-height sections on wheel, tweened with a rAF
 * cubic ease (no external deps). Works only on desktop wheel input; touch and
 * trackpad inertia below the threshold pass through untouched.
 */
export function useSectionSnap({ enabled, reducedMotion, gateOffset, getTargets }: UseSectionSnapOptions) {
  const rafRef = useRef(0);
  const lockRef = useRef(false);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    let lastWheelAt = 0;
    // Gate the CSS fade-in behind this flag so snap-able sections are never
    // hidden when the snap behaviour itself is disabled (e.g. cinematic mode).
    document.documentElement.classList.add("snap-scroll-active");

    // Fade sections in as they enter the viewport (progressive enhancement;
    // CSS transition defined in index.css). Sections that animate internally
    // via motion/whileInView are unaffected since this only touches the wrapper.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("snap-section-visible");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    // Reveal anything already in the viewport immediately (so a mid-page reload
    // or a late mount can never leave content stuck invisible).
    const revealInView = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("snap-section-visible");
      }
    };

    let observed = new Set<Element>();
    const syncObserver = () => {
      for (const el of getTargets()) {
        revealInView(el);
        if (!observed.has(el)) {
          observed.add(el);
          revealObserver.observe(el);
        }
      }
    };
    syncObserver();

    // If sections mount lazily after the initial sync (Suspense, lazy routes),
    // re-sync whenever new [data-snap-section] nodes appear in the DOM.
    const domObserver = new MutationObserver(() => {
      const newTargets = getTargets().filter((el) => !observed.has(el));
      if (newTargets.length) syncObserver();
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

    const cancel = () => {
      lockRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const scrollTo = (toY: number, fromY: number) => {
      cancel();
      lockRef.current = true;
      const start = performance.now();

      const step = (now: number) => {
        const p = Math.min(1, (now - start) / TWEN_DURATION);
        window.scrollTo(0, fromY + (toY - fromY) * easeInOutCubic(p));
        if (p < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          lockRef.current = false;
          rafRef.current = 0;
        }
      };
      rafRef.current = requestAnimationFrame(step);
    };

    const findTarget = (deltaY: number, y: number, vh: number): number | null => {
      const targets = getTargets();
      if (!targets.length) return null;

      let best: { el: HTMLElement; dist: number } | null = null;
      for (const el of targets) {
        const top = el.getBoundingClientRect().top + y;
        // Only consider targets near the fold or below it (avoid skipping huge sections).
        const dist = deltaY > 0 ? top - y - 8 : y - (top + vh) - 8;
        if (deltaY > 0 && dist < -MAX_SNAP_ABOVE_VIEWPORT) continue;
        if (best === null || Math.abs(dist) < Math.abs(best.dist)) {
          best = { el, dist: Math.abs(dist) };
        }
      }
      if (!best) return null;

      const top = best.el.getBoundingClientRect().top + y;
      // Snap the section's top to the top of the viewport.
      return top;
    };

    const onWheel = (e: WheelEvent) => {
      // Skip if the wheel originated inside a nested scrollable element.
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-no-snap]")) return;

      // While a tween is in flight, swallow wheel input so the browser's native
      // scrolling can't fight the eased animation.
      if (lockRef.current) {
        e.preventDefault();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.shiftKey) return; // zoom / horizontal scroll gestures
      if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return; // trackpad inertia / micro-scroll

      // Don't snap while the fullscreen nav or a modal locks the scroll.
      if (document.documentElement.style.overflow === "hidden") return;

      const now = Date.now();
      if (now - lastWheelAt < 90) return; // debounce trackpad bursts into one decision
      lastWheelAt = now;

      const gate = gateOffset();
      const y = window.scrollY;
      if (y < gate) return; // still in the cinematic corridor / hero

      const toY = findTarget(e.deltaY, y, window.innerHeight);
      if (toY === null || Math.abs(toY - y) < 4) return;

      e.preventDefault();
      scrollTo(toY, y);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      revealObserver.disconnect();
      domObserver.disconnect();
      observed = new Set();
      document.documentElement.classList.remove("snap-scroll-active");
      cancel();
    };
  }, [enabled, reducedMotion, gateOffset, getTargets]);
}
