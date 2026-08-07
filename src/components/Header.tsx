import React, { useState, useEffect } from "react";
import { Menu, X, Leaf, ALargeSmall, Radar } from "lucide-react";
import { motion } from "motion/react";
import { SiTelegram, SiVk, SiTiktok, SiGithub } from "react-icons/si";
import MiniLogo from "./MiniLogo";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation, PageId } from "../navigation/NavigationContext";
import { useSeniorMode } from "../context/SeniorModeContext";
import { useEcoMode } from "../context/EcoModeContext";
import { HEADER_PAGES } from "../navigation/pages.config";
import { announce } from "../i18n/Announcer";

const SiTelegramIcon = SiTelegram as React.ComponentType<any>;
const SiVkIcon = SiVk as React.ComponentType<any>;
const SiTiktokIcon = SiTiktok as React.ComponentType<any>;
const SiGithubIcon = SiGithub as React.ComponentType<any>;

export const RUSTORE_URL = "https://www.rustore.ru/catalog/app/com.frauddetector.app";
export const PRODUCT_RADAR_URL = "https://productradar.ru/product/trustnode/";
export const GITHUB_APK_URL = "https://github.com/TrustNodeLab/trustnodelab.github.io/releases/download/1.2.0/app-arm64-v8a-release.apk";

export default function Header() {
  const { t } = useTranslation();
  const { activePage, navigateTo } = useNavigation();
  const { seniorMode, toggleSeniorMode } = useSeniorMode();
  const { ecoMode, toggleEcoMode } = useEcoMode();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 2600);
  };

  useEffect(() => {
    let rafId = 0;

    const handleScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        setScrolled(window.scrollY > 20);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const drawer = document.getElementById("mobile-drawer");
      const toggle = document.getElementById("mobile-menu-toggle");
      const langMenu = document.getElementById("language-switcher-portal");
      if (
        drawer &&
        toggle &&
        !drawer.contains(target) &&
        !toggle.contains(target) &&
        !(langMenu && langMenu.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const navPages = HEADER_PAGES;

  const getPageLabel = (page: PageId) => {
    const labels = t.pageNames;
    return labels[page as keyof typeof labels] || page;
  };

  const handlePageNavigation = (page: PageId, anchorId?: string) => {
    setIsOpen(false);
    navigateTo(page, anchorId);
  };

  const renderNavButton = (page: typeof navPages[number]) => {
    const isActive = activePage === page.id;
    return (
      <button
        key={page.id}
        onClick={() => handlePageNavigation(page.id)}
        className={`font-sans text-sm font-medium text-left transition-colors py-2.5 px-3 rounded-xl border cursor-pointer ${
          isActive
            ? "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20"
            : "text-gray-300 hover:text-[#3B82F6] border-transparent"
        }`}
      >
        {getPageLabel(page.id)}
      </button>
    );
  };

  const renderDesktopNavButton = (page: typeof navPages[number]) => {
    const isActive = activePage === page.id;
    return (
      <button
        key={page.id}
        onClick={() => handlePageNavigation(page.id)}
        className={`relative font-sans text-sm font-medium whitespace-nowrap px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
          isActive ? "text-[#3B82F6]" : "text-gray-300 hover:text-white"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        {isActive && (
          <>
            {ecoMode ? (
              <div className="absolute inset-0 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25" />
            ) : (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="absolute inset-0 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25"
              />
            )}
          </>
        )}
        <span className="relative">{getPageLabel(page.id)}</span>
      </button>
    );
  };

  const socialLinks = [
    { href: "https://t.me/TrustNode_team", label: "Telegram", Icon: SiTelegramIcon },
    { href: "https://vk.com/trustnode", label: "VK", Icon: SiVkIcon },
    { href: "https://github.com/TrustNodeLab", label: "GitHub", Icon: SiGithubIcon },
    { href: "https://www.tiktok.com/@trusrnode?_r=1&_t=ZS-97fr5YVyPCs", label: "TikTok", Icon: SiTiktokIcon },
  ] as const;

  const renderSocialButtons = (extraClass = "") => (
    <div className={`flex items-center gap-2 ${extraClass}`}>
      {socialLinks.map(({ href, label, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0A0A0B]/60 border border-[#3B82F6]/30 text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20 transition-all duration-300"
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
      <a
        href={PRODUCT_RADAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Product Radar"
        title="Product Radar"
        className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0A0A0B]/60 border border-[#3B82F6]/30 text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20 transition-all duration-300"
      >
        <Radar className="w-4 h-4" />
      </a>
    </div>
  );

  const utilityButtonClass =
    "inline-flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 cursor-pointer";

  const renderEcoButton = () => (
    <button
      onClick={() => { toggleEcoMode(); showToast(ecoMode ? t.header.ecoOff : t.header.ecoOn); announce(ecoMode ? t.header.ecoOff : t.header.ecoOn); }}
      aria-label={ecoMode ? t.header.ecoOn : t.header.ecoOff}
      title={ecoMode ? t.header.ecoOn : t.header.ecoOff}
      className={`${utilityButtonClass} ${
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
      title={seniorMode ? t.header.seniorOn : t.header.seniorOff}
      className={`${utilityButtonClass} ${
        seniorMode
          ? "bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-glow-warn"
          : "bg-[#0A0A0B]/60 border-[#3B82F6]/30 text-[#3B82F6] hover:text-white hover:bg-[#3B82F6]/20"
      }`}
    >
      <ALargeSmall className="w-4 h-4" />
    </button>
  );

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || activePage !== "home"
          ? "bg-[#0A0A0B]/85 backdrop-blur-md border-b border-[#3C404A]/30 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent"
      }`}
      style={{
        paddingTop: scrolled || activePage !== "home"
          ? "max(0.75rem, env(safe-area-inset-top))"
          : "max(1.25rem, env(safe-area-inset-top))",
        paddingBottom: scrolled || activePage !== "home" ? "0.75rem" : "1.25rem",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
      id="main-nav-header"
    >
<div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3 relative">

        {/* Left: Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none shrink-0 justify-self-start"
          onClick={() => handlePageNavigation("home")}
          id="header-logo-container"
        >
          <div className="w-12 h-14 flex items-center justify-center bg-[#3C404A]/30 rounded-xl border border-[#3B82F6]/15">
            <MiniLogo />
          </div>

          <div className="flex flex-col">
            <span className="font-display font-bold text-lg text-[#F5F5F0] tracking-tight">
              Trust<span className="text-[#3B82F6]">Node</span>
            </span>
            <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest leading-none">
              {t.brand.tagline}
            </span>
          </div>
        </div>

        {/* Center: primary navigation (strictly centered) */}
        <nav
          aria-label={t.header.nav}
          className="hidden lg:flex items-center justify-center gap-0.5 min-w-0 justify-self-center"
        >
          {navPages.map((page) => renderDesktopNavButton(page))}
        </nav>

        {/* Right: utility buttons */}
        <div className="hidden lg:flex items-center justify-end gap-2 shrink-0 justify-self-end">
          {renderSocialButtons()}
          <div className="w-px h-6 bg-[#3C404A]/40" />
          {renderEcoButton()}
          {renderSeniorButton()}
          <LanguageSwitcher variant="desktop" />
        </div>

        {/* Mobile: hamburger toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden col-start-3 justify-self-end p-2.5 rounded-xl bg-[#3C404A]/40 border border-[#3C404A]/50 text-gray-400 hover:text-[#3B82F6] transition-colors cursor-pointer"
          id="mobile-menu-toggle"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile menu drawer (below lg breakpoint) */}
      {isOpen && (
        <div
          className="lg:hidden absolute top-[100%] left-0 right-0 bg-[#0A0A0B]/98 border-t border-[#3C404A]/50 shadow-2xl animate-fade-in max-h-[calc(100dvh-64px)] overflow-y-auto"
          id="mobile-drawer"
        >
          <div className="max-w-6xl mx-auto flex flex-col gap-3 px-4 py-6">
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {navPages.map((page) => renderNavButton(page))}
            </nav>

            <div className="h-px bg-[#3C404A]/30 my-1" />

            <div className="flex items-center gap-2">
              {renderEcoButton()}
              {renderSeniorButton()}
              <LanguageSwitcher variant="mobile" />
            </div>
          </div>
        </div>
      )}
      {/* Non-blocking mode toast confirmation */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl border border-[#3B82F6]/30 bg-[#0A0A0B]/95 text-[#F5F5F0] font-sans text-xs shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}
      >
        {toast}
      </div>
    </header>
  );
}


