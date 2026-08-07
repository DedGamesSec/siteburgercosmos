import { useState, useEffect, useRef, Suspense, lazy } from "react";
const NetworkBackground = lazy(() => import("./components/NetworkBackground"));
import AssembledLogo from "./components/AssembledLogo";

const hudTranslations: Record<string, { core: string; nodes: string; mode: string }> = {
  ru: { core: "Р›РћРљРђР›Р¬РќРћР• РЇР”Р Рћ", nodes: "РђРљРўРР’РќР«Р• РЈР—Р›Р«", mode: "Р Р•Р–РРњ Р—РђР©РРўР«" },
  en: { core: "LOCAL CORE", nodes: "ACTIVE NODES", mode: "PROTECTION MODE" },
  es: { core: "NГљCLEO LOCAL", nodes: "NODOS ACTIVOS", mode: "MODO DE PROTECCIГ“N" },
  zh: { core: "жњ¬ењ°ж ёеїѓ", nodes: "жґ»еЉЁиЉ‚з‚№", mode: "йІжЉ¤жЁЎејЏ" },
  tr: { core: "YEREL Г‡EKД°RDEK", nodes: "AKTД°F DГњДћГњMLER", mode: "KORUMA MODU" },
  hi: { core: "а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Ї а¤•аҐ‹а¤°", nodes: "а¤ёа¤•аҐЌа¤°а¤їа¤Ї а¤ЁаҐ‹а¤ЎаҐЌа¤ё", mode: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤®аҐ‹а¤Ў" },
  ar: { core: "Ш§Щ„Щ†Щ€Ш§Ш© Ш§Щ„Щ…Ш­Щ„ЩЉШ©", nodes: "Ш§Щ„Ш№Щ‚ШЇ Ш§Щ„Щ†ШґШ·Ш©", mode: "Щ€Ш¶Ш№ Ш§Щ„Ш­Щ…Ш§ЩЉШ©" },
  pt: { core: "NГљCLEO LOCAL", nodes: "NГ“S ATIVOS", mode: "MODO DE PROTEГ‡ГѓO" },
  fr: { core: "NOYAU LOCAL", nodes: "NЕ’UDS ACTIFS", mode: "MODE DE PROTECTION" },
  de: { core: "LOKALER KERN", nodes: "AKTIVE KNOTEN", mode: "SCHUTZMODUS" },
  ja: { core: "гѓ­гѓјг‚«гѓ«г‚іг‚ў", nodes: "г‚ўг‚Їгѓ†г‚Јгѓ–гѓЋгѓјгѓ‰", mode: "дїќи­·гѓўгѓјгѓ‰" }
};

function SkyPlaceholder() {
  return <div className="absolute inset-0 w-full h-full bg-[#0A0A0B] pointer-events-none" />;
}
import ProblemSection from "./components/ProblemSection";
import IntroSection from "./components/IntroSection";
import LiveSimulatorSection from "./components/LiveSimulatorSection";
import HowItWorksSection from "./components/HowItWorksSection";
import TrustSection from "./components/TrustSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import ExplorePagesSection from "./components/ExplorePagesSection";
import AppSecuritySection from "./components/AppSecuritySection";
import KiraAssistantSection from "./components/KiraAssistantSection";
import RealDevelopmentSection from "./components/RealDevelopmentSection";
import OriginStorySection from "./components/OriginStorySection";
import LegalPage from "./components/LegalPage";
import CookieConsent from "./components/CookieConsent";
import BackToTop from "./components/BackToTop";
import Announcer from "./i18n/Announcer";
import Breadcrumbs from "./components/Breadcrumbs";
import NotFoundPage from "./components/NotFoundPage";
import PageNavigationFooter from "./components/PageNavigationFooter";
import EarlyAccessPage from "./components/EarlyAccessPage";
import ComparisonSection from "./components/ComparisonSection";
import NewsSection from "./components/NewsSection";
import ProtectionMarquee from "./components/ProtectionMarquee";
import DamageCalculator from "./components/DamageCalculator";
import FaqSection from "./components/FaqSection";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useTranslation } from "./i18n/LanguageContext";
import { useNavigation, PageId } from "./navigation/NavigationContext";
import { useEcoMode } from "./context/EcoModeContext";

export default function App() {
  const { t, language } = useTranslation();
  const { activePage } = useNavigation();
  const { ecoMode, toggleEcoMode } = useEcoMode();
  const [showReplayIntro, setShowReplayIntro] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);
  const [activeMobileCard, setActiveMobileCard] = useState(0);
  const [userInteractedWithMobileCards, setUserInteractedWithMobileCards] = useState(false);
  const [skyStatus, setSkyStatus] = useState<string>("");

  const mobileCards = t.mobileCards;

  useEffect(() => {
    if (userInteractedWithMobileCards) return;
    const interval = setInterval(() => {
      setActiveMobileCard((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [userInteractedWithMobileCards]);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.visualViewport?.height || window.innerHeight);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  const coreLandingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = coreLandingRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowReplayIntro(entry.isIntersecting);
      },
      { root: null, threshold: 0.05 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activePage]);

  const vh = windowHeight || 800;

  const section2Ref = useRef<HTMLDivElement>(null);
  const isSection2InView = useInView(section2Ref, { once: true, margin: "-100px" });
  const [logoProgress, setLogoProgress] = useState(0);

  useEffect(() => {
    if (isSection2InView) {
      let start: number | null = null;
      const duration = 1200; // 1.2s animation
      const animate = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const p = Math.min(1, elapsed / duration);
        // Cubic ease-out
        const easedP = 1 - Math.pow(1 - p, 3);
        setLogoProgress(easedP);
        if (p < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isSection2InView]);

  // Dynamic Page Metadata & SEO Management
  useEffect(() => {
    const pageTitles: Record<string, Record<string, string>> = {
      ru: {
        home: "TrustNode вЂ” РњРѕР±РёР»СЊРЅРѕРµ РїСЂРёР»РѕР¶РµРЅРёРµ РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ РјРѕС€РµРЅРЅРёРєРѕРІ Рё СЃРїР°РјР°",
        "how-it-works": "РљР°Рє СѓСЃС‚СЂРѕРµРЅ РєСѓРїРѕР» Р·Р°С‰РёС‚С‹ // TrustNode Protocol",
        tech: "Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ Рё РўРµС…РЅРѕР»РѕРіРёРё // TrustNode Protocol",
        about: "Рћ РїСЂРѕРµРєС‚Рµ Рё РєРѕРјР°РЅРґРµ // TrustNode Protocol",
        roadmap: "РљР°СЂС‚Р° СЂР°Р·СЂР°Р±РѕС‚РєРё // TrustNode Protocol",
        privacy: "РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё // TrustNode Protocol",
        terms: "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ // TrustNode Protocol",
        news: "РќРѕРІРѕСЃС‚Рё // TrustNode Protocol",
      },
      en: {
        home: "TrustNode вЂ” On-Device Anti-Fraud & Spam Shield",
        "how-it-works": "How It Works // TrustNode Protocol",
        tech: "Security & Tech // TrustNode Protocol",
        about: "About Us & Team // TrustNode Protocol",
        roadmap: "Development Roadmap // TrustNode Protocol",
        privacy: "Privacy Policy // TrustNode Protocol",
        terms: "Terms of Service // TrustNode Protocol",
        news: "News // TrustNode Protocol",
      },
      es: {
        home: "TrustNode вЂ” Escudo Contra el Fraude en el Dispositivo",
        "how-it-works": "CГіmo Funciona // TrustNode Protocol",
        tech: "Seguridad y TecnologГ­a // TrustNode Protocol",
        about: "Sobre Nosotros // TrustNode Protocol",
        roadmap: "Hoja de Ruta de Desarrollo // TrustNode Protocol",
        privacy: "PolГ­tica de Privacidad // TrustNode Protocol",
        terms: "TГ©rminos de Uso // TrustNode Protocol",
        news: "Noticias // TrustNode Protocol",
      },
      zh: {
        home: "TrustNode вЂ” з§»еЉЁз«Їз¦»зєїйІиЇ€йЄ—е®‰е…Ёз›ѕ",
        "how-it-works": "е·ҐдЅњеЋџзђ† // TrustNode Protocol",
        tech: "е®‰е…ЁдёЋжЉЂжњЇ // TrustNode Protocol",
        about: "е…ідєЋж€‘д»¬дёЋе›ўйџ // TrustNode Protocol",
        roadmap: "еЏ‘е±•и·Їзєїе›ѕ // TrustNode Protocol",
        privacy: "йљђз§Ѓж”їз­– // TrustNode Protocol",
        terms: "з”Ёж€·еЌЏи®® // TrustNode Protocol",
        news: "ж–°й—» // TrustNode Protocol",
      },
      tr: {
        home: "TrustNode вЂ” Cihaz ГњstГј DolandД±rД±cД±lД±k KalkanД±",
        "how-it-works": "NasД±l Г‡alД±ЕџД±r // TrustNode Protocol",
        tech: "GГјvenlik ve Teknoloji // TrustNode Protocol",
        about: "HakkД±mД±zda // TrustNode Protocol",
        roadmap: "GeliЕџtirme Yol HaritasД± // TrustNode Protocol",
        privacy: "Gizlilik PolitikasД± // TrustNode Protocol",
        terms: "KullanД±cД± SГ¶zleЕџmesi // TrustNode Protocol",
        news: "Haberler // TrustNode Protocol",
      },
      hi: {
        home: "TrustNode вЂ” а¤‘а¤Ё-а¤Ўа¤їа¤µа¤ѕа¤‡а¤ё а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤•а¤µа¤љ",
        "how-it-works": "а¤Їа¤№ а¤•аҐ€а¤ёаҐ‡ а¤•а¤ѕа¤® а¤•а¤°а¤¤а¤ѕ а¤№аҐ€ // TrustNode Protocol",
        tech: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤”а¤° а¤¤а¤•а¤ЁаҐЂа¤• // TrustNode Protocol",
        about: "а¤№а¤®а¤ѕа¤°аҐ‡ а¤¬а¤ѕа¤°аҐ‡ а¤®аҐ‡а¤‚ // TrustNode Protocol",
        roadmap: "а¤µа¤їа¤•а¤ѕа¤ё а¤°аҐ‹а¤Ўа¤®аҐ€а¤Є // TrustNode Protocol",
        privacy: "а¤—аҐ‹а¤Єа¤ЁаҐЂа¤Їа¤¤а¤ѕ а¤ЁаҐЂа¤¤а¤ї // TrustNode Protocol",
        terms: "а¤‰а¤Єа¤ЇаҐ‹а¤— а¤•аҐЂ а¤¶а¤°аҐЌа¤¤аҐ‡а¤‚ // TrustNode Protocol",
        news: "а¤ёа¤®а¤ѕа¤ља¤ѕа¤° // TrustNode Protocol",
      },
      ar: {
        home: "TrustNode вЂ” ШЇШ±Ш№ Щ…ЩѓШ§ЩЃШ­Ш© Ш§Щ„Ш§Ш­ШЄЩЉШ§Щ„ Ш№Щ„Щ‰ Ш§Щ„Ш¬Щ‡Ш§ШІ",
        "how-it-works": "ЩѓЩЉЩЃ ЩЉШ№Щ…Щ„ // TrustNode Protocol",
        tech: "Ш§Щ„ШЈЩ…Ш§Щ† Щ€Ш§Щ„ШЄЩѓЩ†Щ€Щ„Щ€Ш¬ЩЉШ§ // TrustNode Protocol",
        about: "Щ…Щ† Щ†Ш­Щ† Щ€Ш§Щ„Щ€ШµЩ€Щ„ // TrustNode Protocol",
        roadmap: "Ш®Ш§Ш±Ш·Ш© Ш·Ш±ЩЉЩ‚ Ш§Щ„ШЄШ·Щ€ЩЉШ± // TrustNode Protocol",
        privacy: "ШіЩЉШ§ШіШ© Ш§Щ„Ш®ШµЩ€ШµЩЉШ© // TrustNode Protocol",
        terms: "ШґШ±Щ€Ш· Ш§Щ„Ш§ШіШЄШ®ШЇШ§Щ… // TrustNode Protocol",
        news: "Ш§Щ„ШЈШ®ШЁШ§Ш± // TrustNode Protocol",
      },
      pt: {
        home: "TrustNode вЂ” Escudo Anti-Fraude no Dispositivo",
        "how-it-works": "Como Funciona // TrustNode Protocol",
        tech: "SeguranГ§a e Tecnologia // TrustNode Protocol",
        about: "Sobre NГіs // TrustNode Protocol",
        roadmap: "Roteiro de Desenvolvimento // TrustNode Protocol",
        privacy: "PolГ­tica de Privacidade // TrustNode Protocol",
        terms: "Termos de Uso // TrustNode Protocol",
        news: "NotГ­cias // TrustNode Protocol",
      },
      fr: {
        home: "TrustNode вЂ” Protection Anti-Fraude sur l'Appareil",
        "how-it-works": "Comment Г§a marche // TrustNode Protocol",
        tech: "SГ©curitГ© & Technologie // TrustNode Protocol",
        about: "ГЂ Propos // TrustNode Protocol",
        roadmap: "Feuille de route de dГ©veloppement // TrustNode Protocol",
        privacy: "Politique de confidentialitГ© // TrustNode Protocol",
        terms: "Conditions d'utilisation // TrustNode Protocol",
        news: "ActualitГ©s // TrustNode Protocol",
      },
      de: {
        home: "TrustNode вЂ” On-Device Anti-Betrugs-Schutzschild",
        "how-it-works": "Wie es funktioniert // TrustNode Protocol",
        tech: "Sicherheit & Technologie // TrustNode Protocol",
        about: "Гњber Uns // TrustNode Protocol",
        roadmap: "Entwicklungs-Roadmap // TrustNode Protocol",
        privacy: "DatenschutzerklГ¤rung // TrustNode Protocol",
        terms: "Nutzungsbedingungen // TrustNode Protocol",
        news: "Neuigkeiten // TrustNode Protocol",
      },
      ja: {
        home: "TrustNode вЂ” г‚Єгѓігѓ‡гѓђг‚¤г‚№з‰№ж®Љи©ђж¬єеЇѕз­–г‚·гѓјгѓ«гѓ‰",
        "how-it-works": "д»•зµ„гЃї // TrustNode Protocol",
        tech: "г‚»г‚­гѓҐгѓЄгѓ†г‚ЈгЃЁгѓ†г‚ЇгѓЋгѓ­г‚ёгѓј // TrustNode Protocol",
        about: "з§ЃгЃџгЃЎгЃ«гЃ¤гЃ„гЃ¦ // TrustNode Protocol",
        roadmap: "й–‹з™єгѓ­гѓјгѓ‰гѓћгѓѓгѓ— // TrustNode Protocol",
        privacy: "гѓ—гѓ©г‚¤гѓђг‚·гѓјгѓќгѓЄг‚·гѓј // TrustNode Protocol",
        terms: "е€©з”Ёи¦Џзґ„ // TrustNode Protocol",
        news: "гѓ‹гѓҐгѓјг‚№ // TrustNode Protocol",
      }
    };

    const currentLang = language || localStorage.getItem("trustnode_lang") || "ru";
    const pageTitleMap = pageTitles[currentLang] || pageTitles["ru"];
    const pageTitle = pageTitleMap[activePage] || (pageTitleMap["home"] || pageTitles.ru.home);
    document.title = pageTitle;

    let linkIcon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!linkIcon) {
      linkIcon = document.createElement("link");
      linkIcon.setAttribute("rel", "icon");
      linkIcon.setAttribute("type", "image/svg+xml");
      document.head.appendChild(linkIcon);
    }
    linkIcon.setAttribute("href", `${import.meta.env.BASE_URL}favicon.svg`);

    const descriptions: Record<string, Record<string, string>> = {
      ru: {
        home: "TrustNode вЂ” РїРµСЂРІРѕРµ РІ РјРёСЂРµ РїРѕР»РЅРѕСЃС‚СЊСЋ Р»РѕРєР°Р»СЊРЅРѕРµ РјРѕР±РёР»СЊРЅРѕРµ РїСЂРёР»РѕР¶РµРЅРёРµ РЅР° Р±Р°Р·Рµ РР РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ С‚РµР»РµС„РѕРЅРЅС‹С… РјРѕС€РµРЅРЅРёРєРѕРІ, СЃРїР°РјР° Рё СѓС‚РµС‡РµРє РґР°РЅРЅС‹С….",
        "how-it-works": "РЈР·РЅР°Р№С‚Рµ, РєР°Рє РєСѓРїРѕР» TrustNode Р·Р°С‰РёС‰Р°РµС‚ Р±РµР· РїРµСЂРµРґР°С‡Рё РґР°РЅРЅС‹С… РІ РёРЅС‚РµСЂРЅРµС‚: Р°РєСѓСЃС‚РёС‡РµСЃРєРёР№ Р°РЅР°Р»РёР· Рё ML-РєР»Р°СЃСЃРёС„РёРєР°С†РёСЏ rubert-tiny2 СЂР°Р±РѕС‚Р°СЋС‚ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ, РѕСЃС‚Р°Р»СЊРЅС‹Рµ СЃР»РѕРё вЂ” РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ (Roadmap).",
        tech: "РўРµС…РЅРёС‡РµСЃРєРёРµ РїРѕРґСЂРѕР±РЅРѕСЃС‚Рё Рё Р·Р°РјРµСЂС‹ СЃРєРѕСЂРѕСЃС‚Рё СЂР°Р±РѕС‚С‹ TrustNode: Р»РѕРєР°Р»СЊРЅС‹Рµ ONNX-РјРѕРґРµР»Рё СЃ INT8-РєРІР°РЅС‚РѕРІР°РЅРёРµРј РїСЂСЏРјРѕ РЅР° РІР°С€РµРј РїСЂРѕС†РµСЃСЃРѕСЂРµ.",
        about: "РСЃС‚РѕСЂРёСЏ СЃРѕР·РґР°РЅРёСЏ TrustNode, РЅР°С€Р° РјРёСЃСЃРёСЏ РїСЂРѕС‚РёРІ РјРѕС€РµРЅРЅРёС‡РµСЃРєРёС… СЃРµС‚РµР№ Рё РєРѕРјР°РЅРґР° СЂР°Р·СЂР°Р±РѕС‚С‡РёРєРѕРІ СЃРёСЃС‚РµРј РР‘.",
        "not-found": "РЎС‚СЂР°РЅРёС†Р° РЅРµ РЅР°Р№РґРµРЅР°. Р’РµСЂРЅРёС‚РµСЃСЊ РІ Р·Р°С‰РёС‰С‘РЅРЅС‹Р№ РїРµСЂРёРјРµС‚СЂ TrustNode.",
        roadmap: "РЎС‚Р°С‚СѓСЃ СЂР°Р·СЂР°Р±РѕС‚РєРё TrustNode, РїРѕР»РёС‚РёРєР° Р±РµР·РѕРїР°СЃРЅРѕРіРѕ СЂР°СЃРєСЂС‹С‚РёСЏ Рё С„Р°Р·С‹ СЂР°Р·РІРµСЂС‚С‹РІР°РЅРёСЏ РёРЅС‚РµР»Р»РµРєС‚СѓР°Р»СЊРЅС‹С… РјРѕРґСѓР»РµР№",
        privacy: "РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё TrustNode: СЃР°Р№С‚ РЅРµ СЃРѕР±РёСЂР°РµС‚, РЅРµ РѕР±СЂР°Р±Р°С‚С‹РІР°РµС‚ Рё РЅРµ С…СЂР°РЅРёС‚ РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»РµР№.",
        terms: "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРѕРµ СЃРѕРіР»Р°С€РµРЅРёРµ TrustNode: СЃС‚Р°С‚СѓСЃ РїСЂРѕРјРѕ-СЂРµСЃСѓСЂСЃР°, Р»РёС†РµРЅР·РёРё, РёРЅС‚РµР»Р»РµРєС‚СѓР°Р»СЊРЅР°СЏ СЃРѕР±СЃС‚РІРµРЅРЅРѕСЃС‚СЊ Рё РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚СЊ.",
        news: "РќРѕРІРѕСЃС‚Рё РїСЂРѕРµРєС‚Р° TrustNode РёР· Telegram Рё VK: РѕР±РЅРѕРІР»РµРЅРёСЏ СЂР°Р·СЂР°Р±РѕС‚РєРё, Р°РЅРѕРЅСЃС‹ Рё Р·Р°РїРёСЃРё РєРѕРјР°РЅРґС‹.",
      },
      en: {
        home: "TrustNode вЂ” the world's first fully offline AI-powered security shield protecting your Android device from calls/SMS scam, phish links, and leaks.",
        "how-it-works": "Explore how TrustNode's security dome protects without sending data online: acoustic analysis and rubert-tiny2 ML classification run on-device, while the remaining layers are in development (Roadmap).",
        tech: "Explore the technical stack: secure sandboxed execution, quantized INT8 local ONNX models, and real latency metrics.",
        about: "The story behind TrustNode, our battle against organized fraud networks, and our core open-source team.",
        "not-found": "Page not found. Return to the secure TrustNode perimeter.",
        roadmap: "Current progress of TrustNode, responsible disclosure policy, and semantic core deployment timeline",
        privacy: "TrustNode Privacy Policy: the website does not collect, process, or store users' personal data.",
        terms: "TrustNode Terms of Service: site status, licenses, intellectual property, and liability.",
        news: "TrustNode project news from Telegram and VK: development updates, announcements and team posts.",
      },
      es: {
        home: "TrustNode вЂ” el primer escudo de seguridad impulsado por IA 100% offline que protege su dispositivo contra llamadas fraudulentas y spam.",
        "how-it-works": "Descubra cГіmo el domo de seguridad de TrustNode protege sin conexiГіn: el anГЎlisis acГєstico y la clasificaciГіn ML rubert-tiny2 funcionan en el dispositivo, y las capas restantes estГЎn en desarrollo (Roadmap).",
        tech: "Detalles tГ©cnicos y mГ©tricas de latencia de TrustNode: modelos ONNX locales con cuantizaciГіn INT8.",
        about: "La historia de TrustNode, nuestra lucha contra las redes delictivas organizadas y el equipo de desarrollo.",
        "not-found": "PГЎgina no encontrada. Regrese al perГ­metro seguro de TrustNode.",
        roadmap: "Progreso actual de TrustNode, polГ­tica de divulgaciГіn responsable y cronograma de despliegue del nГєcleo semГЎntico",
        privacy: "PolГ­tica de privacidad de TrustNode: el sitio no recopila, procesa ni almacena datos personales de los usuarios.",
        terms: "TГ©rminos de uso de TrustNode: estado del sitio, licencias, propiedad intelectual y responsabilidad.",
        news: "Noticias del proyecto TrustNode desde Telegram y VK: actualizaciones de desarrollo, anuncios y publicaciones del equipo.",
      },
      zh: {
        home: "TrustNode вЂ” е…Ёзђѓй¦–ж¬ѕе®Ње…Ёз¦»зєїиїђиЎЊзљ„ AI з§»еЉЁе®‰е…ЁйІжЉ¤з›ѕпјЊе…ЁйќўйІеѕЎз”µиЇќиЇ€йЄ—гЂЃећѓењѕзџ­дїЎе’Њж•°жЌ®жі„йњІгЂ‚",
        "how-it-works": "дє†и§Ј TrustNode йІжЉ¤з©№йЎ¶е¦‚дЅ•ењЁж— йњЂиЃ”зЅ‘зљ„жѓ…е†µдё‹дїќжЉ¤ж‚ЁпјљеЈ°е­¦е€†жћђдёЋ rubert-tiny2 ML е€†з±»ењЁи®ѕе¤‡з«ЇиїђиЎЊпјЊе…¶дЅ™е±‚е¤„дєЋејЂеЏ‘й¶ж®µпј€Roadmapпј‰гЂ‚",
        tech: "жЉЂжњЇз»†иЉ‚дёЋжЂ§иѓЅиЎЁзЋ°пјљз›ґжЋҐењЁз§»еЉЁе¤„зђ†е™ЁдёЉиїђиЎЊзљ„ INT8 й‡ЏеЊ–жњ¬ењ° ONNX еј•ж“ЋгЂ‚",
        about: "TrustNode зљ„е€›з«‹еЋ†зЁ‹гЂЃж€‘д»¬дёЋзЅ‘з»њиЇ€йЄ—й›†е›ўзљ„еЇ№жЉ—д»ҐеЏЉж ёеїѓејЂжєђжЉЂжњЇе›ўйџгЂ‚",
        "not-found": "жњЄж‰ѕе€°йЎµйќўпјЊиЇ·иї”е›ћ TrustNode е®‰е…ЁеЊєеџџгЂ‚",
        roadmap: "TrustNode зљ„еЅ“е‰Ќиї›е±•гЂЃиґџиґЈд»»жЉ«йњІж”їз­–дёЋиЇ­д№‰ж ёеїѓйѓЁзЅІж—¶й—ґиЎЁ",
        privacy: "TrustNode йљђз§Ѓж”їз­–пјљзЅ‘з«™дёЌж”¶й›†гЂЃдёЌе¤„зђ†гЂЃдёЌе­е‚Ёз”Ёж€·зљ„дёЄдєєж•°жЌ®гЂ‚",
        terms: "TrustNode з”Ёж€·еЌЏи®®пјљзЅ‘з«™жЂ§иґЁгЂЃи®ёеЏЇгЂЃзџҐиЇ†дє§жќѓдёЋиґЈд»»гЂ‚",
        news: "жќҐи‡Є Telegram е’Њ VK зљ„ TrustNode йЎ№з›®ж–°й—»пјљејЂеЏ‘еЉЁжЂЃгЂЃе…¬е‘ЉдёЋе›ўйџеЏ‘еёѓгЂ‚",
      },
      tr: {
        home: "TrustNode вЂ” Telefon dolandД±rД±cД±lД±ДџД± ve spama karЕџД± %100 Г§evrimdД±ЕџД± Г§alД±Еџan yapay zeka destekli mobil gГјvenlik kalkanД±.",
        "how-it-works": "TrustNode gГјvenlik kubbesinin internet olmadan nasД±l koruduДџunu Г¶Дџrenin: akustik analiz ve rubert-tiny2 ML sД±nД±flandД±rma cihazda Г§alД±ЕџД±r, kalan katmanlar geliЕџtirme aЕџamasД±ndadД±r (Roadmap).",
        tech: "Teknik detaylar ve hД±z Г¶lГ§Гјmleri: DoДџrudan cihazД±nД±zda Г§alД±Еџan INT8 nicemlemeli yerel ONNX modelleri.",
        about: "TrustNode'un kuruluЕџ hikayesi, organize dolandД±rД±cД±lД±k aДџlarД±na karЕџД± mГјcadelemiz ve geliЕџtirici ekibimiz.",
        "not-found": "Sayfa bulunamadД±. GГјvenli TrustNode alanД±na geri dГ¶nГјn.",
        roadmap: "TrustNode'un mevcut ilerlemesi, sorumlu aГ§Д±klama politikasД± ve anlamsal Г§ekirdek daДџД±tД±m zaman Г§izelgesi",
        privacy: "TrustNode Gizlilik PolitikasД±: site kullanД±cД±larД±n kiЕџisel verilerini toplamaz, iЕџlemez veya saklamaz.",
        terms: "TrustNode KullanД±cД± SГ¶zleЕџmesi: kaynak durumu, lisanslar, fikri mГјlkiyet ve sorumluluk.",
        news: "Telegram ve VK'dan TrustNode proje haberleri: geliЕџtirme gГјncellemeleri, duyurular ve ekip gГ¶nderileri.",
      },
      hi: {
        home: "TrustNode вЂ” а¤¦аҐЃа¤Ёа¤їа¤Їа¤ѕ а¤•а¤ѕ а¤Єа¤№а¤Іа¤ѕ а¤ЄаҐ‚а¤°аҐЂ а¤¤а¤°а¤№ а¤ёаҐ‡ а¤‘а¤«а¤Іа¤ѕа¤‡а¤Ё AI-а¤ёа¤‚а¤ља¤ѕа¤Іа¤їа¤¤ а¤®аҐ‹а¤¬а¤ѕа¤‡а¤І а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤•а¤µа¤љ а¤њаҐ‹ а¤†а¤Єа¤•аҐ‹ а¤ёаҐЌа¤ЄаҐ€а¤® а¤”а¤° а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤ёаҐ‡ а¤¬а¤ља¤ѕа¤¤а¤ѕ а¤№аҐ€аҐ¤",
        "how-it-works": "а¤ња¤ѕа¤ЁаҐ‡а¤‚ а¤•а¤ї TrustNode а¤•а¤ѕ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤ЎаҐ‹а¤® а¤‡а¤‚а¤џа¤°а¤ЁаҐ‡а¤џ а¤•аҐ‡ а¤¬а¤їа¤Ёа¤ѕ а¤•аҐ€а¤ёаҐ‡ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤•а¤°а¤¤а¤ѕ а¤№аҐ€: а¤§аҐЌа¤µа¤Ёа¤їа¤• а¤µа¤їа¤¶аҐЌа¤ІаҐ‡а¤·а¤Ј а¤”а¤° rubert-tiny2 ML а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј а¤Ўа¤їа¤µа¤ѕа¤‡а¤ё а¤Єа¤° а¤ља¤Іа¤¤аҐ‡ а¤№аҐ€а¤‚, а¤¶аҐ‡а¤· а¤Єа¤°а¤¤аҐ‡а¤‚ а¤µа¤їа¤•а¤ѕа¤ё а¤®аҐ‡а¤‚ а¤№аҐ€а¤‚ (Roadmap)аҐ¤",
        tech: "а¤¤а¤•а¤ЁаҐЂа¤•аҐЂ а¤µа¤їа¤µа¤°а¤Ј а¤”а¤° а¤—а¤¤а¤ї а¤®а¤ѕа¤Є: а¤ёаҐЂа¤§аҐ‡ а¤†а¤Єа¤•аҐ‡ а¤ЄаҐЌа¤°аҐ‹а¤ёаҐ‡а¤ёа¤° а¤Єа¤° а¤ља¤Іа¤ЁаҐ‡ а¤µа¤ѕа¤ІаҐ‡ INT8 а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Ї ONNX а¤®аҐ‰а¤Ўа¤ІаҐ¤",
        about: "TrustNode а¤•аҐЂ а¤•а¤№а¤ѕа¤ЁаҐЂ, а¤ёа¤‚а¤—а¤ а¤їа¤¤ а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤ЁаҐ‡а¤џа¤µа¤°аҐЌа¤• а¤•аҐ‡ а¤–а¤їа¤Іа¤ѕа¤« а¤№а¤®а¤ѕа¤°аҐЂ а¤Іа¤Ўа¤ја¤ѕа¤€ а¤”а¤° а¤№а¤®а¤ѕа¤°аҐЂ а¤џаҐЂа¤®аҐ¤",
        "not-found": "а¤ЄаҐѓа¤·аҐЌа¤  а¤Ёа¤№аҐЂа¤‚ а¤®а¤їа¤Іа¤ѕаҐ¤ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ TrustNode а¤ёаҐЂа¤®а¤ѕ а¤Єа¤° а¤ІаҐЊа¤џаҐ‡а¤‚аҐ¤",
        roadmap: "TrustNode а¤•аҐЂ а¤µа¤°аҐЌа¤¤а¤®а¤ѕа¤Ё а¤ЄаҐЌа¤°а¤—а¤¤а¤ї, а¤ња¤їа¤®аҐЌа¤®аҐ‡а¤¦а¤ѕа¤° а¤ЄаҐЌа¤°а¤•а¤џаҐЂа¤•а¤°а¤Ј а¤ЁаҐЂа¤¤а¤ї а¤”а¤° а¤ёа¤їа¤®аҐ‡а¤‚а¤џа¤їа¤• а¤•аҐ‹а¤° а¤Єа¤°а¤їа¤Ёа¤їа¤ЇаҐ‹а¤ња¤Ё а¤ёа¤®а¤Їа¤°аҐ‡а¤–а¤ѕ",
        privacy: "TrustNode а¤—аҐ‹а¤Єа¤ЁаҐЂа¤Їа¤¤а¤ѕ а¤ЁаҐЂа¤¤а¤ї: а¤µаҐ‡а¤¬а¤ёа¤ѕа¤‡а¤џ а¤‰а¤Єа¤ЇаҐ‹а¤—а¤•а¤°аҐЌа¤¤а¤ѕа¤“а¤‚ а¤•а¤ѕ а¤µаҐЌа¤Їа¤•аҐЌа¤¤а¤їа¤—а¤¤ а¤ЎаҐ‡а¤џа¤ѕ а¤Џа¤•а¤¤аҐЌа¤°, а¤ЄаҐЌа¤°а¤•аҐЌа¤°а¤їа¤Їа¤ѕ а¤Їа¤ѕ а¤ёа¤‚а¤—аҐЌа¤°а¤№аҐЂа¤¤ а¤Ёа¤№аҐЂа¤‚ а¤•а¤°а¤¤аҐЂаҐ¤",
        terms: "TrustNode а¤‰а¤Єа¤ЇаҐ‹а¤— а¤•аҐЂ а¤¶а¤°аҐЌа¤¤аҐ‡а¤‚: а¤ёа¤ѕа¤‡а¤џ а¤ёаҐЌа¤Ґа¤їа¤¤а¤ї, а¤Іа¤ѕа¤‡а¤ёаҐ‡а¤‚а¤ё, а¤¬аҐЊа¤¦аҐЌа¤§а¤їа¤• а¤ёа¤‚а¤Єа¤¦а¤ѕ а¤”а¤° а¤¦а¤ѕа¤Їа¤їа¤¤аҐЌа¤µаҐ¤",
        news: "Telegram а¤”а¤° VK а¤ёаҐ‡ TrustNode а¤ЄаҐЌа¤°аҐ‹а¤њаҐ‡а¤•аҐЌа¤џ а¤ёа¤®а¤ѕа¤ља¤ѕа¤°: а¤µа¤їа¤•а¤ѕа¤ё а¤…а¤Єа¤ЎаҐ‡а¤џ, а¤аҐ‹а¤·а¤Ја¤ѕа¤Џа¤Ѓ а¤”а¤° а¤џаҐЂа¤® а¤ЄаҐ‹а¤ёаҐЌа¤џаҐ¤",
      },
      ar: {
        home: "TrustNode вЂ” ШЈЩ€Щ„ ШЇШ±Ш№ ШЈЩ…Щ†ЩЉ ШЁШ§Щ„Ш°ЩѓШ§ШЎ Ш§Щ„Ш§ШµШ·Щ†Ш§Ш№ЩЉ ЩЉШ№Щ…Щ„ Щ…Ш­Щ„ЩЉШ§Щ‹ 100% Щ„Ш­Щ…Ш§ЩЉШ© Щ‡Ш§ШЄЩЃЩѓ Щ…Щ† Ш§Щ„Щ…ЩѓШ§Щ„Щ…Ш§ШЄ Ш§Щ„Ш§Ш­ШЄЩЉШ§Щ„ЩЉШ© Щ€Ш§Щ„Ш±ШіШ§Ш¦Щ„ Ш§Щ„Щ…ШІШ№Ш¬Ш©.",
        "how-it-works": "Ш§ЩѓШЄШґЩЃ ЩѓЩЉЩЃ ЩЉШ­Щ…ЩЉ Щ‚ШЁШ© TrustNode ШЇЩ€Щ† Ш§ШЄШµШ§Щ„ ШЁШ§Щ„ШҐЩ†ШЄШ±Щ†ШЄ: Ш§Щ„ШЄШ­Щ„ЩЉЩ„ Ш§Щ„ШµЩ€ШЄЩЉ Щ€ШЄШµЩ†ЩЉЩЃ Ш§Щ„ШЄШ№Щ„Щ… Ш§Щ„ШўЩ„ЩЉ rubert-tiny2 ЩЉШ№Щ…Щ„Ш§Щ† Ш№Щ„Щ‰ Ш§Щ„Ш¬Щ‡Ш§ШІШЊ ШЁЩЉЩ†Щ…Ш§ Ш§Щ„Ш·ШЁЩ‚Ш§ШЄ Ш§Щ„Щ…ШЄШЁЩ‚ЩЉШ© Щ‚ЩЉШЇ Ш§Щ„ШЄШ·Щ€ЩЉШ± (Roadmap).",
        tech: "Ш§Щ„ШЄЩЃШ§ШµЩЉЩ„ Ш§Щ„ШЄЩ‚Щ†ЩЉШ© Щ€Щ…Щ‚Ш§ЩЉЩЉШі Ш§Щ„ШЈШЇШ§ШЎ: Щ†Щ…Ш§Ш°Ш¬ ONNX Ш§Щ„Щ…Ш­Щ„ЩЉШ© ШЁШЇЩ‚Ш© INT8 ШЄШ№Щ…Щ„ Щ…ШЁШ§ШґШ±Ш© Ш№Щ„Щ‰ Щ…Ш№Ш§Щ„Ш¬ Щ‡Ш§ШЄЩЃЩѓ.",
        about: "Щ‚ШµШ© ШҐЩ†ШґШ§ШЎ TrustNode Щ€Щ…Щ‡Щ…ШЄЩ†Ш§ Ш¶ШЇ ШґШЁЩѓШ§ШЄ Ш§Щ„Ш§Ш­ШЄЩЉШ§Щ„ Ш§Щ„Щ…Щ†ШёЩ…Ш© Щ€ЩЃШ±ЩЉЩ‚ Ш§Щ„Щ…Ш·Щ€Ш±ЩЉЩ†.",
        "not-found": "Ш§Щ„ШµЩЃШ­Ш© ШєЩЉШ± Щ…Щ€Ш¬Щ€ШЇШ©. Ш№ШЇ ШҐЩ„Щ‰ Щ…Ш­ЩЉШ· TrustNode Ш§Щ„ШўЩ…Щ†.",
        roadmap: "Ш§Щ„ШЄЩ‚ШЇЩ… Ш§Щ„Ш­Ш§Щ„ЩЉ Щ„ЩЂ TrustNodeШЊ ШіЩЉШ§ШіШ© Ш§Щ„ЩѓШґЩЃ Ш§Щ„Щ…ШіШ¤Щ€Щ„ШЊ Щ€Ш§Щ„Ш¬ШЇЩ€Щ„ Ш§Щ„ШІЩ…Щ†ЩЉ Щ„ШЄШ·Щ€ЩЉШ± Ш§Щ„Щ†Щ€Ш§Ш© Ш§Щ„ШЇЩ„Ш§Щ„ЩЉШ©",
        privacy: "ШіЩЉШ§ШіШ© Ш®ШµЩ€ШµЩЉШ© TrustNode: Ш§Щ„Щ…Щ€Щ‚Ш№ Щ„Ш§ ЩЉШ¬Щ…Ш№ ШЁЩЉШ§Щ†Ш§ШЄ Ш§Щ„Щ…ШіШЄШ®ШЇЩ…ЩЉЩ† Ш§Щ„ШґШ®ШµЩЉШ© Щ€Щ„Ш§ ЩЉШ№Ш§Щ„Ш¬Щ‡Ш§ Щ€Щ„Ш§ ЩЉШ®ШІЩ†Щ‡Ш§.",
        terms: "ШґШ±Щ€Ш· Ш§ШіШЄШ®ШЇШ§Щ… TrustNode: Щ€Ш¶Ш№ Ш§Щ„Щ…Щ€Щ‚Ш№ Щ€Ш§Щ„ШЄШ±Ш§Ш®ЩЉШµ Щ€Ш§Щ„Щ…Щ„ЩѓЩЉШ© Ш§Щ„ЩЃЩѓШ±ЩЉШ© Щ€Ш§Щ„Щ…ШіШ¤Щ€Щ„ЩЉШ©.",
        news: "ШЈШ®ШЁШ§Ш± Щ…ШґШ±Щ€Ш№ TrustNode Щ…Щ† Telegram Щ€ VK: ШЄШ­ШЇЩЉШ«Ш§ШЄ Ш§Щ„ШЄШ·Щ€ЩЉШ± Щ€Ш§Щ„ШҐШ№Щ„Ш§Щ†Ш§ШЄ Щ€Щ…Щ†ШґЩ€Ш±Ш§ШЄ Ш§Щ„ЩЃШ±ЩЉЩ‚.",
      },
      pt: {
        home: "TrustNode вЂ” o primeiro escudo de seguranГ§a 100% offline com IA para proteger seu celular contra fraudes e spam.",
        "how-it-works": "Veja como o domo de seguranГ§a do TrustNode protege sem internet: a anГЎlise acГєstica e a classificaГ§ГЈo ML rubert-tiny2 rodam no dispositivo, e as demais camadas estГЈo em desenvolvimento (Roadmap).",
        tech: "Detalhes tГ©cnicos e mГ©tricas de velocidade: modelos ONNX locais INT8 rodando diretamente no processador.",
        about: "A histГіria do TrustNode, nossa luta contra redes de fraude organizadas e nossa equipe de engenharia.",
        "not-found": "PГЎgina nГЈo encontrada. Retorne ao perГ­metro seguro do TrustNode.",
        roadmap: "Progresso atual do TrustNode, polГ­tica de divulgaГ§ГЈo responsГЎvel e cronograma de implantaГ§ГЈo do nГєcleo semГўntico",
        privacy: "PolГ­tica de Privacidade da TrustNode: o site nГЈo coleta, processa nem armazena dados pessoais dos usuГЎrios.",
        terms: "Termos de Uso da TrustNode: status do site, licenГ§as, propriedade intelectual e responsabilidade.",
        news: "NotГ­cias do projeto TrustNode do Telegram e VK: atualizaГ§Гµes de desenvolvimento, anГєncios e publicaГ§Гµes da equipe.",
      },
      fr: {
        home: "TrustNode вЂ” le premier bouclier de sГ©curitГ© mobile 100% hors ligne propulsГ© par l'IA contre les fraudes et le spam.",
        "how-it-works": "DГ©couvrez comment le dГґme de sГ©curitГ© TrustNode protГЁge sans connexion : l'analyse acoustique et la classification ML rubert-tiny2 fonctionnent sur l'appareil, tandis que les autres couches sont en cours de dГ©veloppement (Roadmap).",
        tech: "DГ©tails techniques et performances : modГЁles ONNX locaux quantifiГ©s en INT8 fonctionnant sur votre processeur.",
        about: "L'histoire de TrustNode, notre combat contre les rГ©seaux de fraude organisГ©s et notre Г©quipe d'ingГ©nieurs.",
        "not-found": "Page introuvable. Retournez dans le pГ©rimГЁtre sГ©curisГ© TrustNode.",
        roadmap: "ProgrГЁs actuels de TrustNode, politique de divulgation responsable et calendrier de dГ©ploiement du noyau sГ©mantique",
        privacy: "Politique de confidentialitГ© de TrustNode : le site ne collecte, ne traite et ne stocke pas les donnГ©es personnelles des utilisateurs.",
        terms: "Conditions d'utilisation de TrustNode : statut du site, licences, propriГ©tГ© intellectuelle et responsabilitГ©.",
        news: "ActualitГ©s du projet TrustNode depuis Telegram et VK : mises Г  jour de dГ©veloppement, annonces et publications de l'Г©quipe.",
      },
      de: {
        home: "TrustNode вЂ” der weltweit erste vollstГ¤ndig offline funktionierende KI-Schutzschild gegen Telefonbetrug und Spam.",
        "how-it-works": "Erfahren Sie, wie die Sicherheitskuppel von TrustNode ohne Internet schГјtzt: Akustikanalyse und ML-Klassifikation rubert-tiny2 laufen auf dem GerГ¤t, die Гјbrigen Ebenen befinden sich in Entwicklung (Roadmap).",
        tech: "Technische Details und Latenzmetriken: INT8-quantisierte lokale ONNX-Modelle direkt auf Ihrem Prozessor.",
        about: "Die Geschichte von TrustNode, unser Kampf gegen organisierte Betrugsnetzwerke und unser Kernteam.",
        "not-found": "Seite nicht gefunden. Kehren Sie zum sicheren TrustNode-Bereich zurГјck.",
        roadmap: "Aktueller Fortschritt von TrustNode, Richtlinie zur verantwortungsvollen Offenlegung und Zeitplan fГјr die Bereitstellung des semantischen Kerns",
        privacy: "DatenschutzerklГ¤rung von TrustNode: Die Website erhebt, verarbeitet und speichert keine personenbezogenen Daten der Nutzer.",
        terms: "Nutzungsbedingungen von TrustNode: Website-Status, Lizenzen, geistiges Eigentum und Haftung.",
        news: "Projekt-Neuigkeiten von TrustNode aus Telegram und VK: Entwicklungs-Updates, AnkГјndigungen und BeitrГ¤ge des Teams.",
      },
      ja: {
        home: "TrustNode вЂ” дё–з•Ње€ќгЃ®е®Ње…Ёг‚Єгѓ•гѓ©г‚¤гѓіе‹•дЅњAIжђ­иј‰гѓўгѓђг‚¤гѓ«г‚»г‚­гѓҐгѓЄгѓ†г‚Јг‚·гѓјгѓ«гѓ‰гЂ‚з‰№ж®Љи©ђж¬єг‚„г‚№гѓ‘гѓ йЂљи©±г‚’йІгЃЋгЃѕгЃ™гЂ‚",
        "how-it-works": "TrustNodeгЃ®г‚»г‚­гѓҐгѓЄгѓ†г‚Јгѓ‰гѓјгѓ гЃЊг‚¤гѓіг‚їгѓјгѓЌгѓѓгѓ€гЃЄгЃ—гЃ§гЃ©гЃ†е®€г‚‹гЃ‹гЃ”и¦§гЃЏгЃ гЃ•гЃ„пјљйџійџїи§ЈжћђгЃЁ rubert-tiny2 гЃ®MLе€†йЎћгЃЇз«Їжњ«дёЉгЃ§зЁјеѓЌгЃ—гЂЃгЃќгЃ®д»–гЃ®гѓ¬г‚¤гѓ¤гѓјгЃЇй–‹з™єдё­пј€Roadmapпј‰гЃ§гЃ™гЂ‚",
        tech: "жЉЂиЎ“д»•ж§гЃЁйЃ…е»¶гѓЎгѓ€гѓЄг‚Їг‚№пјљгѓ—гѓ­г‚»гѓѓг‚µдёЉгЃ§з›ґжЋҐе‹•дЅњгЃ™г‚‹INT8й‡Џе­ђеЊ–гѓ­гѓјг‚«гѓ«ONNXгѓўгѓ‡гѓ«гЂ‚",
        about: "TrustNodeиЄ•з”џгЃ®г‚№гѓ€гѓјгѓЄгѓјгЂЃзµ„з№”зљ„и©ђж¬єгѓЌгѓѓгѓ€гѓЇгѓјг‚ЇгЃЁгЃ®ж€¦гЃ„гЂЃгЃќгЃ—гЃ¦й–‹з™єгѓЃгѓјгѓ гЃ®гЃ”зґ№д»‹гЂ‚",
        "not-found": "гѓљгѓјг‚ёгЃЊи¦‹гЃ¤гЃ‹г‚ЉгЃѕгЃ›г‚“гЂ‚е®‰е…ЁгЃЄTrustNodeг‚ЁгѓЄг‚ўгЃёгЃЉж€»г‚ЉгЃЏгЃ гЃ•гЃ„гЂ‚",
        roadmap: "TrustNode гЃ®зЏѕењЁгЃ®йЂІжЌ—зЉ¶жіЃгЂЃиІ¬д»»гЃ‚г‚‹й–‹з¤єгѓќгѓЄг‚·гѓјгЂЃг‚»гѓћгѓігѓ†г‚Јгѓѓг‚Їг‚іг‚ўе±•й–‹гЃ®г‚їг‚¤гѓ гѓ©г‚¤гѓі",
        privacy: "TrustNode гѓ—гѓ©г‚¤гѓђг‚·гѓјгѓќгѓЄг‚·гѓјпјљеЅ“г‚µг‚¤гѓ€гЃЇгѓ¦гѓјг‚¶гѓјгЃ®еЂ‹дєєгѓ‡гѓјг‚їг‚’еЏЋй›†гѓ»е‡¦зђ†гѓ»дїќе­гЃ—гЃѕгЃ›г‚“гЂ‚",
        terms: "TrustNode е€©з”Ёи¦Џзґ„пјљг‚µг‚¤гѓ€гЃ®дЅЌзЅ®д»гЃ‘гЂЃгѓ©г‚¤г‚»гѓіг‚№гЂЃзџҐзљ„иІЎз”ЈгЂЃгЃЉг‚€гЃіиІ¬д»»гЂ‚",
        news: "Telegram гЃЁ VK гЃ‹г‚‰гЃ® TrustNode гѓ—гѓ­г‚ёг‚§г‚Їгѓ€гѓ‹гѓҐгѓјг‚№пјљй–‹з™єжѓ…е ±гЂЃгЃЉзџҐг‚‰гЃ›гЂЃгѓЃгѓјгѓ гЃ®жЉ•зЁїгЂ‚",
      }
    };

    const descMap = descriptions[currentLang] || descriptions["en"] || descriptions["ru"];
    const descText = descMap[activePage] || (descMap["home"] || "");
    
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attrName, attrVal);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMetaTag('meta[name="description"]', "name", "description", descText);
    setMetaTag('meta[property="og:title"]', "property", "og:title", pageTitle);
    setMetaTag('meta[property="og:description"]', "property", "og:description", descText);
    setMetaTag('meta[property="og:url"]', "property", "og:url", window.location.href);
  }, [activePage, language]);

  // Continuous zoom factor for the starfield
  const zoomFactor = 1.05;

  // Beautiful Header is always visible for instant navigation
  const showHeader = true;

  return (
    <div 
      className="relative w-full max-w-full overflow-x-hidden bg-[#0A0A0B] selection:bg-[#3B82F6]/30 selection:text-[#F5F5F0]"
      style={{ minHeight: "100vh" }}
      id="app-container"
    >
      {/* Skip to content link (keyboard/screen-reader users) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[#3B82F6] focus:text-white focus:font-sans focus:text-sm"
      >
        {t.skipToContent}
      </a>
      {/* Fixed Network Background (Acts as the uniform starfield throughout) */}
      <div className="fixed inset-0 w-full h-full pointer-events-none">
        <Suspense fallback={<SkyPlaceholder />}>
          <NetworkBackground zoomFactor={zoomFactor} warpProgress={0} isEcoMode={ecoMode} onSkyStatusChange={setSkyStatus} language={language} />
        </Suspense>
      </div>

      {/* Universal Fixed Header - Displayed on all pages across the application */}
      <div 
        className="transition-all duration-300 fixed top-0 left-0 right-0 z-50"
        style={{ 
          opacity: 1, 
          transform: "translateY(0)",
          pointerEvents: "auto" 
        }}
      >
        <Header />
      </div>

      {/* DYNAMIC PAGE ROUTER */}
      <main
        id="main-content"
        className="relative z-10 w-full flex flex-col"
        tabIndex={-1}
      >
        <AnimatePresence mode="wait">
          {activePage === "home" && (
            <motion.div
              key={`home-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full flex flex-col"
            >
              {/* INTRO TRACK CONTAINER */}
              {/* Sequential flow: Section 1 (Hero Title) followed by Section 2 (Logo Assembly & Cards) */}
               <div className="relative w-full z-10 flex flex-col pointer-events-none" id="intro-scroll-track">
                  
                  {/* SECTION 1: HERO TITLE (100dvh) */}
                  <div 
                    className="relative w-full flex items-center justify-center px-4 select-none pointer-events-none"
                    style={{ height: "100dvh" }}
                    id="main-hero-section-container"
                  >
                    {/* Title and Status Badge Container */}
                    <motion.div 
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center text-center max-w-5xl px-4 pointer-events-none"
                      id="main-hero-section"
                    >
                      {/* Status Badge */}
                      <div 
                        className={`inline-flex flex-col items-center justify-center px-4 py-1.5 ${!ecoMode && skyStatus ? "rounded-sm gap-1 py-2" : "rounded-sm"} bg-[#12141A]/80 border border-[#3C404A] shadow-glow-sm mb-8 transition-all duration-300`}
                        id="status-badge"
                      >
                        <div className="inline-flex items-center gap-2.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2DD4BF]"></span>
                          </span>
                          <span className="font-mono text-[11px] sm:text-sm font-semibold tracking-[0.18em] text-[#2DD4BF]">
                            {t.hero.badge}
                          </span>
                        </div>
                        {!ecoMode && skyStatus && (
                          <span className="font-mono text-[10px] sm:text-xs font-medium tracking-[0.12em] text-[#3B82F6]/85 text-center">
                            {skyStatus}
                          </span>
                        )}
                      </div>

                      {/* Huge Hero Title */}
                      <h1 
                        className="font-display font-bold text-5xl sm:text-7xl md:text-[120px] lg:text-[140px] xl:text-[150px] leading-[0.9] tracking-tight mb-6"
                        id="main-title"
                      >
                        <span className="text-[#F5F5F0]">Trust</span>
                        <span className="text-[#8B8F9C]">Node</span>
                      </h1>

                      {/* Monospaced Bracketed Subtitle */}
                      <p 
                        className="font-mono text-xs sm:text-sm tracking-[0.22em] text-gray-500 max-w-2xl px-2"
                        id="main-subtitle"
                      >
                        {t.hero.titleSub}
                      </p>

                    </motion.div>

                    {/* Scroll Down Indicator */}
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center"
                      id="scroll-indicator-container-wrapper"
                    >
                      <button 
                        onClick={() => {
                          window.scrollTo({ top: vh * 1.0, behavior: "smooth" });
                        }}
                        className="flex flex-col items-center gap-2 cursor-pointer group pointer-events-auto z-30 transition-opacity duration-300"
                        id="scroll-indicator-container"
                      >
                        <span className="font-mono text-[10px] tracking-[0.25em] text-[#3B82F6] group-hover:text-[#2DD4BF] transition-colors uppercase font-bold">
                          {t.hero.scrollStart}
                        </span>
                        <svg 
                          className="w-4 h-4 text-gray-500 animate-bounce mt-1" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    </motion.div>
                  </div>

                  {/* SECTION 2: LOGO ASSEMBLY & PANELS (100dvh) */}
                  <div 
                    ref={section2Ref}
                    className="relative w-full flex items-center justify-center px-4 pb-28 pt-16 select-none pointer-events-none"
                    style={{ 
                      minHeight: "100dvh",
                    }}
                    id="slide2-assembly-section-container"
                  >
                    {/* Central content container shifted slightly higher to feel perfectly framed */}
                    <motion.div 
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 w-full px-4 pointer-events-auto"
                      style={{
                        transform: "translateY(-75px)",
                      }}
                      id="slide2-assembly-section"
                    >
                         
                      <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 w-full max-w-5xl mx-auto shrink-0">
                        {/* Left Status Label */}
                        <motion.div
                          style={{
                            opacity: logoProgress > 0.15 ? Math.min(1, (logoProgress - 0.15) / 0.85) : 0,
                            x: logoProgress > 0.15 ? -40 * (1 - Math.min(1, (logoProgress - 0.15) / 0.85)) : -40
                          }}
                          className="flex flex-col items-center lg:items-end text-center lg:text-right w-full lg:w-64"
                        >
                          <span className="font-display font-extrabold text-xl sm:text-2xl text-[#F5F5F0] tracking-tight">
                            {t.assembly?.leftPrimary || "OFFLINE-FIRST"}
                          </span>
                          <span className="font-mono text-[9px] sm:text-[10px] text-[#3B82F6] tracking-wider mt-1.5 uppercase">
                            {t.assembly?.leftSub || "// Р”РђРќРќР«Р• РќР• РџРћРљРР”РђР®Рў РЈРЎРўР РћР™РЎРўР’Рћ"}
                          </span>
                        </motion.div>

                        {/* Central Logo */}
                        <div className="flex items-center justify-center shrink-0">
                          <AssembledLogo progress={logoProgress} ecoMode={ecoMode} />
                        </div>

                        {/* Right Status Label */}
                        <motion.div
                          style={{
                            opacity: logoProgress > 0.15 ? Math.min(1, (logoProgress - 0.15) / 0.85) : 0,
                            x: logoProgress > 0.15 ? 40 * (1 - Math.min(1, (logoProgress - 0.15) / 0.85)) : 40
                          }}
                          className="flex flex-col items-center lg:items-start text-center lg:text-left w-full lg:w-64"
                        >
                          <span className="font-display font-extrabold text-xl sm:text-2xl text-[#F5F5F0] tracking-tight">
                            {t.assembly?.rightPrimary || "ZERO TELEMETRY"}
                          </span>
                          <span className="font-mono text-[9px] sm:text-[10px] text-[#3B82F6] tracking-wider mt-1.5 uppercase">
                            {t.assembly?.rightSub || "// РќРРљРђРљРћР™ РўР•Р›Р•РњР•РўР РР"}
                          </span>
                        </motion.div>
                      </div>

                      {/* Minimalist HUD Status Bar */}
                      <AnimatePresence>
                        {logoProgress > 0.6 && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={{
                              visible: {
                                transition: {
                                  staggerChildren: 0.15
                                }
                              }
                            }}
                            className="flex flex-wrap items-center justify-center gap-3 mt-2 pointer-events-none select-none"
                            id="logo-assembly-hud-bar"
                          >
                            {[
                              hudTranslations[language]?.core || hudTranslations.en.core,
                              hudTranslations[language]?.nodes || hudTranslations.en.nodes,
                              hudTranslations[language]?.mode || hudTranslations.en.mode
                            ].map((text, idx) => (
                              <motion.div
                                key={idx}
                                variants={{
                                  hidden: { opacity: 0, y: 10, scale: 0.95 },
                                  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
                                }}
                                className="font-mono text-[9px] sm:text-[11px] tracking-[0.1em] font-semibold text-[#3B82F6] bg-[#12141A]/60 border border-[#3C404A] px-3.5 py-1.5 rounded-sm whitespace-nowrap"
                              >
                                {text}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                    
                    {/* Bottom Area of Section 2 with Dynamic Dome Navigator */}
                    {logoProgress > 0.1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center shrink-0">
                        <button
                          onClick={() => {
                            window.scrollTo({ top: vh * 2.0, behavior: "smooth" });
                          }}
                          className="flex flex-col items-center gap-3 cursor-pointer group z-30 transition-all duration-300 pointer-events-auto"
                          id="enter-dome-arrow-btn"
                        >
                          <div className="relative flex items-center justify-center w-10 h-10 rounded-sm border border-[#3C404A] bg-[#12141A]/60 group-hover:border-[#2DD4BF] group-hover:shadow-glow-success transition-all duration-300">
                            <svg 
                              className="w-5 h-5 text-[#8B8F9C] group-hover:text-[#2DD4BF] transition-colors translate-y-0 group-hover:translate-y-0.5 transition-transform animate-bounce" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
                            </svg>
                          </div>
                          <span className="font-mono text-[9px] tracking-[0.3em] text-[#8B8F9C] group-hover:text-[#2DD4BF] transition-colors uppercase font-bold animate-pulse mt-2">
                            {t.hero.enterDome}
                          </span>
                        </button>
                      </div>
                    )}

                  </div>
              </div>

              {/* CORE LANDING CONTENT (NORMAL DOCUMENT FLOW) */}
              <div ref={coreLandingRef} className="relative z-20 w-full flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm shadow-[0_-30px_60px_rgba(10,10,11,0.95)]" id="core-landing-page">
                {showReplayIntro && (
                  <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-2 flex justify-start">
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="font-mono text-[9px] text-gray-500 hover:text-[#3B82F6] transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[#3C404A]/60 bg-[#12141A]/60 cursor-pointer hover:border-[#3B82F6]/50"
                      id="replay-intro-btn"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>{t.replayIntro}</span>
                    </button>
                  </div>
                )}
                <IntroSection />
                <ProtectionMarquee />
                <ProblemSection />
                <TrustSection />
                <LiveSimulatorSection />
                <DamageCalculator />
                <ExplorePagesSection />
                <Footer />
              </div>
            </motion.div>
          )}

          {activePage === "how-it-works" && (
            <motion.div
              key={`how-it-works-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <HowItWorksSection />
                <KiraAssistantSection />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}

          {activePage === "tech" && (
            <motion.div
              key={`tech-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <AppSecuritySection />
                <RealDevelopmentSection onlyRoadmap={false} />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}

          {activePage === "roadmap" && (
            <motion.div
              key={`roadmap-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <RealDevelopmentSection onlyRoadmap={true} />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}

          {activePage === "about" && (
            <motion.div
              key={`about-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <OriginStorySection />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}
          {activePage === "download" && (
            <motion.div
              key={`download-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <EarlyAccessPage />
                <FaqSection />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}

          {activePage === "comparison" && (
            <motion.div
              key={`comparison-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <ComparisonSection />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}

          {activePage === "news" && (
            <motion.div
              key={`news-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <NewsSection />
              </div>
              <PageNavigationFooter currentPage={activePage} />
              <Footer />
            </motion.div>
          )}

          {activePage === "not-found" && (
            <motion.div
              key={`not-found-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <div className="flex-1 flex flex-col bg-[#0A0A0B]/90 backdrop-blur-sm">
                <NotFoundPage />
              </div>
              <Footer />
            </motion.div>
          )}

          {activePage === "privacy" && (
            <motion.div
              key={`privacy-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <LegalPage tab="privacy" />
              <Footer />
            </motion.div>
          )}

          {activePage === "terms" && (
            <motion.div
              key={`terms-page-${language}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full min-h-[100vh] flex flex-col justify-between"
            >
              <Breadcrumbs currentPage={activePage} />
              <LegalPage tab="terms" />
              <Footer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Legal documents and FZ-152 Cookie Consent modules */}
      <BackToTop />
      <Announcer />
      <CookieConsent />

    </div>
  );
}
