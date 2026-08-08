import React, { useEffect, useRef } from "react";

interface HeroSceneFallbackProps {
  language?: string;
}

const STAR_SHADOWS = (() => {
  let out = "";
  for (let i = 0; i < 90; i++) {
    const x = Math.round(Math.random() * 1000) / 10;
    const y = Math.round(Math.random() * 1000) / 10;
    const s = Math.random() < 0.2 ? 2 : 1;
    out += `${out ? ", " : ""}${x}vmax ${y}vh 0 ${s}px rgba(226,232,240,${(0.25 + Math.random() * 0.6).toFixed(2)})`;
  }
  return out;
})();

const FAR_SHADOWS = (() => {
  let out = "";
  for (let i = 0; i < 60; i++) {
    const x = Math.round(Math.random() * 1000) / 10;
    const y = Math.round(Math.random() * 1000) / 10;
    out += `${out ? ", " : ""}${x}vmax ${y}vh 0 1px rgba(139,143,156,${(0.12 + Math.random() * 0.3).toFixed(2)})`;
  }
  return out;
})();

/**
 * Лёгкая замена 3D-сцены для слабых устройств (нет WebGL, мало ядер,
 * prefers-reduced-motion): статичное звёздное поле на чистом CSS с мягким
 * параллаксом при скролле. Никаких canvas/WebGL/запросов.
 */
export default function HeroSceneFallback({ language }: HeroSceneFallbackProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      scrollRef.current = Math.min(1, window.scrollY / window.innerHeight);
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(apply);
      }
    };
    const apply = () => {
      const t = scrollRef.current;
      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(0, ${t * 90}px, 0)`;
      }
      if (farRef.current) {
        farRef.current.style.transform = `translate3d(0, ${t * 30}px, 0)`;
      }
      rafRef.current = 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0A0A0B] overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        ref={farRef}
        className="absolute left-0 top-0 w-full h-full will-change-transform"
        style={{ boxShadow: FAR_SHADOWS }}
      />
      <div
        ref={layerRef}
        className="absolute left-0 top-0 w-full h-full will-change-transform"
        style={{ boxShadow: STAR_SHADOWS }}
      />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[80vmax] h-[40vmax] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
    </div>
  );
}
