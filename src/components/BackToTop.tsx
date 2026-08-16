import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useEcoMode } from "../context/EcoModeContext";
import { useCookieBanner } from "../context/CookieBannerContext";
import { useTranslation } from "../i18n/LanguageContext";

export default function BackToTop() {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();
  const { isCookieBannerVisible } = useCookieBanner();
  const [visible, setVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setVisible(window.scrollY > 500);
        setScrolled(window.scrollY > 20);
      });
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const goTop = () => {
    window.scrollTo({ top: 0, behavior: ecoMode ? "auto" : "smooth" });
  };

  return (
    <button
      onClick={goTop}
      aria-label={t.backToTop}
      title={t.backToTop}
      className={`fixed bottom-20 right-4 md:right-6 z-[40] flex items-center justify-center w-11 h-11 rounded-full border border-[#3B82F6]/40 bg-[#0A0A0B]/85 text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20 backdrop-blur-md transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${
        visible && !isCookieBannerVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3 pointer-events-none"
      } ${scrolled ? "" : ""}`}
      tabIndex={visible && !isCookieBannerVisible ? 0 : -1}
      aria-hidden={!visible || isCookieBannerVisible}
      id="back-to-top-btn"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}