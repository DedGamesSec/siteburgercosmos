import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Leaf, ALargeSmall } from "lucide-react";
import { SiTelegram, SiVk, SiTiktok, SiGithub } from "react-icons/si";
import NetworkBackground from "./NetworkBackground";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation, PageId } from "../navigation/NavigationContext";
import { useSeniorMode } from "../context/SeniorModeContext";
import { useEcoMode } from "../context/EcoModeContext";
import { HEADER_PAGES } from "../navigation/pages.config";
import { announce } from "../i18n/Announcer";

export const PRODUCT_RADAR_URL = "https://productradar.ru/product/trustnode/";
export const RUSTORE_URL = "https://www.rustore.ru/catalog/app/com.frauddetector.app";
export const GITHUB_APK_URL = "https://github.com/TrustNodeLab/trustnodelab.github.io/releases/download/1.2.0/app-arm64-v8a-release.apk";

// The four "main" sections (big items in the overlay) + four secondary pages
// (small items, including Download as the 8th), per the reference layout.
const LARGE_PAGE_IDS: PageId[] = ["home", "how-it-works", "tech", "roadmap"];
const SMALL_PAGE_IDS: PageId[] = ["about", "comparison", "news", "download"];

const SiTelegramIcon = SiTelegram as React.ComponentType<any>;
const SiVkIcon = SiVk as React.ComponentType<any>;
const SiTiktokIcon = SiTiktok as React.ComponentType<any>;
const SiGithubIcon = SiGithub as React.ComponentType<any>;

const SOCIAL_LINKS = [
  { href: "https://t.me/TrustNode_team", label: "Telegram", Icon: SiTelegramIcon },
  { href: "https://vk.com/trustnode", label: "VK", Icon: SiVkIcon },
  { href: "https://github.com/TrustNodeLab", label: "GitHub", Icon: SiGithubIcon },
  { href: "https://www.tiktok.com/@trusrnode?_r=1&_t=ZS-97fr5YVyPCs", label: "TikTok", Icon: SiTiktokIcon },
] as const;

export default function Header() {
  const { t, language } = useTranslation();
  const { activePage, navigateTo } = useNavigation();
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const { ecoMode, toggleEcoMode } = useEcoMode();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [isDarkening, setIsDarkening] = useState(false);

  // Live clock shown between the logo and the nav heading: МСК (Europe/Moscow)
  // for Russian, GMT (UTC) for every other language. Ticks once per second.
  const [clock, setClock] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const clockLabel = language === "ru" ? "МСК" : "GMT";
  const clockFormatter = new Intl.DateTimeFormat(
    language === "ru" ? "ru-RU" : "en-GB",
    {
      timeZone: language === "ru" ? "Europe/Moscow" : "UTC",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }
  );
  const clockTime = clockFormatter.format(clock);

  // Close the fullscreen nav with the slide-out animation (or instantly in
  // eco mode / reduced-motion, mirroring the entrance behavior).
  const closeMenu = () => {
    if (!isOpen) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || ecoMode) {
      setIsOpen(false);
      setIsClosing(false);
      return;
    }
    setIsClosing(true);
    window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 450);
  };

  const openMenu = () => {
    setIsOpen(true);
    setIsClosing(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 2600);
  };

  // Close the fullscreen menu on Escape and lock page scroll while it is open.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const getPageLabel = (page: PageId) => {
    const labels = t.pageNames;
    return labels[page as keyof typeof labels] || page;
  };

  const handlePageNavigation = (page: PageId, anchorId?: string) => {
    closeMenu();
    navigateTo(page, anchorId);
  };

  // Clicking the brand logo fades the screen to black, then navigates home and
  // fades back in — a "cinematic" way to get back to the landing page.
  const handleLogoHome = () => {
    if (isDarkening) return;
    setIsDarkening(true);
    window.setTimeout(() => {
      closeMenu();
      navigateTo("home");
    }, 450);
    window.setTimeout(() => setIsDarkening(false), 1050);
  };

  const iconButtonClass =
    "inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border transition-all duration-300 cursor-pointer";

  const renderEcoButton = () => (
    <button
      onClick={() => { toggleEcoMode(); showToast(ecoMode ? t.header.ecoOff : t.header.ecoOn); announce(ecoMode ? t.header.ecoOff : t.header.ecoOn); }}
      aria-label={ecoMode ? t.header.ecoOn : t.header.ecoOff}
      aria-pressed={ecoMode}
      title={ecoMode ? t.header.ecoOn : t.header.ecoOff}
      className={`${iconButtonClass} ${
        ecoMode
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-glow-success"
          : "bg-[#0A0A0B]/60 border-[#3B82F6]/30 text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20"
      }`}
    >
      <Leaf className="w-4 h-4" />
    </button>
  );

  const renderSeniorButton = () => (
    <button
      onClick={() => { toggleSeniorMode(); showToast(seniorMode ? t.header.seniorOff : t.header.seniorOn); announce(seniorMode ? t.header.seniorOff : t.header.seniorOn); }}
      aria-label={seniorMode ? t.header.seniorOn : t.header.seniorOff}
      aria-pressed={seniorMode}
      title={seniorMode ? t.header.seniorOn : t.header.seniorOff}
      className={`${iconButtonClass} ${
        seniorMode
          ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-glow-warn"
          : "bg-[#0A0A0B]/60 border-[#3B82F6]/30 text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20"
      }`}
    >
      <ALargeSmall className="w-4 h-4" />
    </button>
  );

  const largePages = HEADER_PAGES.filter((p) => LARGE_PAGE_IDS.includes(p.id));
  const smallPages = HEADER_PAGES.filter((p) => SMALL_PAGE_IDS.includes(p.id));

  return (
    <>
      {/* Vertical sidebar rail — fixed on the left, full height (per reference).
          Scrolls (scrollbar hidden) on short screens like landscape phones so
          the brand + toggles + socials never get cut off. */}
      <header
        className="fixed top-0 left-0 bottom-0 z-[80] w-16 sm:w-20 flex flex-col items-center border-r border-[#3C404A]/40 bg-[#0A0A0B]/90 backdrop-blur-md shadow-[4px_0_30px_rgba(0,0,0,0.4)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
        id="main-nav-header"
      >
        {/* Brand name — inside the rail (top, vertical) */}
        <button
          onClick={handleLogoHome}
          className="mt-3 flex flex-col items-center gap-1 cursor-pointer select-none group"
          aria-label="TrustNode — Home"
          id="header-brand-name"
        >
          <span className="[writing-mode:vertical-rl] [transform:rotate(180deg)] font-display font-medium text-sm sm:text-base tracking-tighter text-[#F5F5F0] group-hover:text-[#3B82F6] transition-colors">
            Trust<span className="text-[#3B82F6]">Node</span>
          </span>
        </button>

        {/* Burger — centered in the free space between the brand block and the
            bottom controls; turns into a close (X) while the nav is open. */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={() => (isOpen ? closeMenu() : openMenu())}
            className="w-9 h-9 inline-flex items-center justify-center rounded-xl bg-[#3C404A]/40 border border-[#3C404A]/50 text-gray-400 hover:text-[#3B82F6] hover:border-[#3B82F6]/40 transition-colors cursor-pointer"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="fullscreen-nav"
            id="mobile-menu-toggle"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Utility toggles (eco / senior / language) */}
        <div className="flex flex-col items-center gap-2 mb-3">
          {renderEcoButton()}
          {renderSeniorButton()}
          <LanguageSwitcher variant="mobile" />
        </div>

        {/* Social icons — vertical stack at the bottom of the rail */}
        <div className="flex flex-col items-center gap-2">
          {SOCIAL_LINKS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#3C404A]/50 bg-[#0A0A0B]/60 text-gray-400 hover:text-[#3B82F6] hover:border-[#3B82F6]/40 transition-all duration-300"
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </header>

      {/* Fullscreen navigation overlay — portaled to <body> so it escapes the
          transformed sidebar wrapper (a CSS transform on an ancestor would turn
          this fixed overlay into a 64px-tall column inside the rail). */}
      {isOpen &&
        createPortal(
          <div
            className={`fixed top-0 bottom-0 left-16 sm:left-20 right-0 z-[70] flex flex-col overflow-hidden ${
              isClosing ? "menu-slide-out" : "menu-slide-in"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            id="fullscreen-nav"
          >
            {/* Star-sky map as the navigation background — fully interactive
                (hover tooltips), constellation lines appear only on hover,
                and the field is denser than usual. */}
            <NetworkBackground
              interactive
              constellationsOnHoverOnly
              starDensity={1.35}
            />

            {/* Content above the star field — the panel starts where the left
                rail ends, so the sidebar and its buttons stay visible. Tight
                padding on phones so the big nav labels never clip horizontally. */}
            <div
              className="relative z-10 flex flex-col flex-1 overflow-y-auto pl-6 sm:pl-14 pr-3 sm:pr-10"
              style={{ paddingTop: "max(0px, env(safe-area-inset-top))", paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
            >
          {/* Overlay top row: brand (darkens to home). No dark backdrop — the
              star-sky field flows up right behind the company name. */}
          <div className="flex items-center justify-between px-6 sm:px-12 py-4 border-b border-[#3C404A]/30">
            <button
              onClick={handleLogoHome}
              className="flex items-center gap-3 cursor-pointer select-none"
              aria-label="TrustNode — Home"
            >
              <span className="font-display font-medium text-xl text-[#F5F5F0] tracking-tighter">
                Trust<span className="text-[#3B82F6]">Node</span>
              </span>
            </button>
          </div>

          {/* Navigation: vertical list of 4 (main sections), to the right a
              list of 4 secondary pages (Download is the 8th item) — side by
              side (per reference layout). Staggered reveal: items 01..08 fade
              in one by one. */}
          <nav
            aria-label={t.header.nav}
            className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-8 max-w-6xl mx-auto w-full"
          >
            {/* Logo above the nav heading */}
            <div className="menu-item-in w-20 h-24 sm:w-24 sm:h-28 mb-5 sm:mb-7">
              <img src={`${import.meta.env.BASE_URL}frame1.svg`} alt="TrustNode" className="w-full h-full object-contain" />
            </div>

            {/* Live clock: МСК for Russian, GMT for the rest */}
            <div className="menu-item-in font-mono text-[11px] text-[#F5F5F0]/80 tracking-[0.2em] mb-3" style={{ animationDelay: "0.08s" }}>
              <span className="text-[#3B82F6] font-bold">{clockLabel}</span>{" "}
              <span className="tabular-nums">{clockTime}</span>
            </div>

            <span className="menu-item-in font-mono text-[11px] tracking-[0.3em] text-[#3B82F6] uppercase font-bold mb-6 sm:mb-10">
              {t.header.nav}
            </span>

            <div className="flex flex-col lg:flex-row items-center justify-center lg:items-center gap-8 sm:gap-10 lg:gap-12">
              {/* Left column: the four main sections */}
              <div className="flex flex-col gap-3 sm:gap-4 items-start max-w-full">
                {largePages.map((page, idx) => {
                  const isActive = activePage === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => handlePageNavigation(page.id)}
                      aria-current={isActive ? "page" : undefined}
                      style={{ animationDelay: `${0.1 + idx * 0.09}s` }}
                      className="menu-item-in flex items-baseline gap-3 sm:gap-6 text-left group cursor-pointer max-w-full"
                    >
                      <span className="font-mono text-xl sm:text-3xl lg:text-5xl text-[#3B82F6] shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-display font-medium text-xl sm:text-3xl lg:text-5xl tracking-tighter transition-colors duration-300 pb-1 min-w-0 ${
                          isActive
                            ? "text-white underline decoration-white decoration-2 underline-offset-8"
                            : "text-[#F5F5F0] group-hover:text-[#3B82F6]"
                        }`}
                      >
                        {getPageLabel(page.id)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Middle column: the secondary pages — bigger than before, yet
                  ~10-15% smaller than the left column's 4 items. Download is
                  the 8th item here. */}
              <div className="flex flex-col gap-3 sm:gap-4 items-start pl-0 lg:pl-10 lg:border-l lg:border-[#3C404A]/30 max-w-full">
                {smallPages.map((page, idx) => {
                  const isActive = activePage === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => handlePageNavigation(page.id)}
                      aria-current={isActive ? "page" : undefined}
                      style={{ animationDelay: `${0.1 + (idx + 4) * 0.09}s` }}
                      className="menu-item-in flex items-baseline gap-3 text-left group cursor-pointer max-w-full"
                    >
                      <span className="font-mono text-lg sm:text-[28px] lg:text-[44px] text-[#3B82F6] shrink-0">
                        {String(idx + 5).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-sans text-lg sm:text-[28px] lg:text-[44px] tracking-tighter transition-colors duration-300 pb-1 min-w-0 ${
                          isActive
                            ? "text-white underline decoration-white decoration-2 underline-offset-8"
                            : "text-gray-300 group-hover:text-[#3B82F6]"
                        }`}
                      >
                        {getPageLabel(page.id)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

            {/* Overlay footer: tagline only (socials live in the sidebar). No
                dark backdrop — the star-sky field stays visible around it. */}
            <div className="px-6 sm:px-12 py-4 border-t border-[#3C404A]/30">
              <span className="menu-item-in font-mono text-[11px] text-gray-500 uppercase tracking-widest truncate" style={{ animationDelay: "0.95s" }}>
                {t.brand.tagline}
              </span>
            </div>
            </div>
          </div>,
          document.body
        )}

      {/* Non-blocking mode toast confirmation — portaled to <body> for the same
          reason as the fullscreen nav (escapes the transformed sidebar wrapper). */}
      {createPortal(
        <div
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl border border-[#3B82F6]/30 bg-[#0A0A0B]/95 text-[#F5F5F0] font-sans text-xs shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}
        >
          {toast}
        </div>,
        document.body
      )}
      {/* Full-screen black fade on brand click — covers everything (rail, nav,
          toast) so the transition to Home reads as a cinematic "load". */}
      {createPortal(
        <div
          aria-hidden="true"
          className={`fixed inset-0 z-[90] bg-black pointer-events-none transition-opacity duration-500 ${
            isDarkening ? "opacity-100" : "opacity-0"
          }`}
          id="logo-darken-overlay"
        />,
        document.body
      )}
    </>
  );
}
