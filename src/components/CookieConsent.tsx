import React, { useState, useEffect } from "react";
import { ShieldCheck, ArrowRight, X } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { announce } from "../i18n/Announcer";
import { useCookieBanner } from "../context/CookieBannerContext";
import ScanCard from "./ScanCard";

export default function CookieConsent() {
  const { t } = useTranslation();
  const { navigateTo } = useNavigation();
  const { setCookieBannerVisible } = useCookieBanner();
  const [isVisible, setIsVisible] = useState(false);

  const openPrivacy = () => navigateTo("privacy");

  useEffect(() => {
    // Only technical/functional storage is used on this site (language,
    // eco-mode, and this consent flag itself) вЂ” there is no analytics or
    // marketing storage, so a single "necessary" category with a plain
    // accept/reject choice is all that's needed here.
    const accepted = localStorage.getItem("trustnode_cookies_accepted");
    const rejected = localStorage.getItem("trustnode_cookies_rejected");
    if (!accepted && !rejected) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setCookieBannerVisible(true);
        announce(t.cookie.badgeLabel);
      }, 1500); // show after 1.5s delay to be non-obtrusive
      return () => clearTimeout(timer);
    }
  }, []);

  const hideBanner = () => {
    setIsVisible(false);
    setCookieBannerVisible(false);
  };

  const handleAccept = () => {
    localStorage.setItem("trustnode_cookies_accepted", "true");
    localStorage.removeItem("trustnode_cookies_rejected");
    hideBanner();
  };

  const handleReject = () => {
    // Rejecting only hides the banner and records the choice вЂ” it never
    // blocks core site functionality, since the only storage in use
    // (language, eco-mode) is necessary/functional, not optional tracking.
    localStorage.setItem("trustnode_cookies_rejected", "true");
    localStorage.removeItem("trustnode_cookies_accepted");
    hideBanner();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[40] animate-slide-up"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
      id="cookie-consent-banner"
    >
      <ScanCard accent="62,207,142" borderColor="border-[#3ecf8e]/30" cardClassName="bg-[#121212]/95 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.8)]" padding="p-4 sm:p-5" className="gap-4">
        
        {/* Banner Body */}
        <div className="flex gap-3 items-start text-left">
          <div className="w-9 h-9 rounded-xl bg-[#3ecf8e]/10 border border-[#3ecf8e]/20 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-[#3ecf8e]" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-[9px] tracking-wider text-[#3ecf8e] uppercase font-bold block whitespace-normal break-words max-w-full">
              {t.cookie.badgeLabel}
            </span>
            <p className="font-sans text-xs text-gray-300 leading-relaxed">
              {t.cookie.text}{" "}
              <button 
                onClick={openPrivacy}
                className="text-[#3ecf8e] hover:underline cursor-pointer inline-flex items-center font-semibold"
              >
                {t.cookie.privacyLinkText}
              </button>{" "}
              {t.cookie.suffix}
            </p>
          </div>
        </div>

        {/* Banner Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#2e2e2e]/30">
          <button
            onClick={openPrivacy}
            className="font-mono text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            {t.cookie.audit}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-transparent border border-[#2e2e2e] hover:border-gray-500 text-xs font-sans font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t.cookie.reject}</span>
            </button>

            <button
              onClick={handleAccept}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#3ecf8e] hover:bg-[#3ecf8e]/85 text-xs font-sans font-semibold text-white transition-all hover:shadow-glow-md cursor-pointer"
            >
              <span>{t.cookie.accept}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </ScanCard>
    </div>
  );
}
