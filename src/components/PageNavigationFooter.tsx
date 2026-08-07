import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigation, PageId } from "../navigation/NavigationContext";
import { useTranslation } from "../i18n/LanguageContext";
import { motion } from "motion/react";
import { HEADER_PAGES } from "../navigation/pages.config";

const NEXT_LABEL: Record<string, string> = {
  ru: "РЎР»РµРґСѓСЋС‰РёР№ СЂР°Р·РґРµР»",
  en: "Next Section",
  es: "Siguiente SecciГіn",
  zh: "дё‹дёЂз« иЉ‚",
  tr: "Sonraki BГ¶lГјm",
  hi: "а¤…а¤—а¤Іа¤ѕ а¤­а¤ѕа¤—",
  ar: "Ш§Щ„Щ‚ШіЩ… Ш§Щ„ШЄШ§Щ„ЩЉ",
  pt: "PrГіxima SeГ§ГЈo",
  fr: "Section Suivante",
  de: "NГ¤chster Abschnitt",
  ja: "ж¬ЎгЃ®г‚»г‚Їг‚·гѓ§гѓі",
};

const PAGE_DESCRIPTIONS: Record<PageId, Record<string, string>> = {
  home: {
    ru: "Р’РµСЂРЅСѓС‚СЊСЃСЏ РЅР° РіР»Р°РІРЅСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ TrustNode",
    en: "Return to the main TrustNode landing page",
    es: "Volver a la pГЎgina principal de TrustNode",
    zh: "иї”е›ћ TrustNode дё»йЎµ",
    tr: "TrustNode ana sayfasД±na geri dГ¶n",
    hi: "TrustNode а¤•аҐ‡ а¤®аҐЃа¤–аҐЌа¤Ї а¤ЄаҐѓа¤·аҐЌа¤  а¤Єа¤° а¤ІаҐЊа¤џаҐ‡а¤‚",
    ar: "Ш§Щ„Ш№Щ€ШЇШ© ШҐЩ„Щ‰ ШµЩЃШ­Ш© TrustNode Ш§Щ„Ш±Ш¦ЩЉШіЩЉШ©",
    pt: "Retornar Г  pГЎgina inicial do TrustNode",
    fr: "Retourner Г  la page d'accueil de TrustNode",
    de: "ZurГјck zur Hauptseite von TrustNode",
    ja: "TrustNodeгѓЎг‚¤гѓігѓљгѓјг‚ёгЃ«ж€»г‚‹",
  },
  "how-it-works": {
    ru: "РџРѕРґСЂРѕР±РЅС‹Р№ СЂР°Р·Р±РѕСЂ РР‘-РєСѓРїРѕР»Р° Рё Р°СЃСЃРёСЃС‚РµРЅС‚Р° Kira",
    en: "Deep dive into the security dome and Kira Assistant",
    es: "AnГЎlisis detallado de la cГєpula y el asistente Kira",
    zh: "ж·±е…Ґдє†и§Је®‰е…Ёз©№йЎ¶дёЋ Kira ж™єиѓЅеЉ©ж‰‹",
    tr: "GГјvenlik kubbesi ve Kira AsistanД± hakkД±nda detaylД± inceleme",
    hi: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤ЎаҐ‹а¤® а¤”а¤° Kira а¤ёа¤№а¤ѕа¤Їа¤• а¤•а¤ѕ а¤µа¤їа¤ёаҐЌа¤¤аҐѓа¤¤ а¤µа¤їа¤µа¤°а¤Ј",
    ar: "ШґШ±Ш­ Щ…ЩЃШµЩ„ Щ„Щ‚ШЁШ© Ш§Щ„ШЈЩ…Ш§Щ† Щ€Щ…ШіШ§Ш№ШЇ Kira",
    pt: "AnГЎlise detalhada do domo de seguranГ§a e assistente Kira",
    fr: "Analyse dГ©taillГ©e du dГґme de sГ©curitГ© et de l'assistant Kira",
    de: "Detaillierte Analyse der Sicherheitskuppel und des Kira-Assistenten",
    ja: "г‚»г‚­гѓҐгѓЄгѓ†г‚Јгѓ‰гѓјгѓ гЃЁKiraг‚ўг‚·г‚№г‚їгѓігѓ€гЃ®и©ізґ°и§ЈиЄ¬",
  },
  tech: {
    ru: "РўРµС…РЅРёС‡РµСЃРєРёРµ РїРѕРґСЂРѕР±РЅРѕСЃС‚Рё Рё РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІР° СЂР°Р·СЂР°Р±РѕС‚РєРё",
    en: "Technical details and active development evidence",
    es: "Detalles tГ©cnicos y evidencia de desarrollo activo",
    zh: "жЉЂжњЇз»†иЉ‚дёЋжґ»и·ѓејЂеЏ‘иЇЃжЌ®",
    tr: "Teknik detaylar ve aktif geliЕџtirme kanД±tlarД±",
    hi: "а¤¤а¤•а¤ЁаҐЂа¤•аҐЂ а¤µа¤їа¤µа¤°а¤Ј and а¤ёа¤•аҐЌа¤°а¤їа¤Ї а¤µа¤їа¤•а¤ѕа¤ё а¤ёа¤ѕа¤•аҐЌа¤·аҐЌа¤Ї",
    ar: "Ш§Щ„ШЄЩЃШ§ШµЩЉЩ„ Ш§Щ„ШЄЩ‚Щ†ЩЉШ© Щ€ШЈШЇЩ„Ш© Ш§Щ„ШЄШ·Щ€ЩЉШ± Ш§Щ„Щ†ШґШ·",
    pt: "Detalhes tГ©cnicos e evidГЄncias de desenvolvimento ativo",
    fr: "DГ©tails techniques et preuves de dГ©veloppement actif",
    de: "Technische Details und Nachweise der aktiven Entwicklung",
    ja: "жЉЂиЎ“зљ„гЃЄи©ізґ°гЃЁг‚ўг‚Їгѓ†г‚Јгѓ–гЃЄй–‹з™єе®џзёѕ",
  },
  roadmap: {
    ru: "РљР°СЂС‚Р° СЂР°Р·СЂР°Р±РѕС‚РєРё, РЅР°СѓС‡РЅС‹Рµ РіСЂР°РјРѕС‚С‹ Рё ONNX-СЏРґСЂРѕ",
    en: "Development roadmap, academic credentials, and ONNX engine",
    es: "Mapa de desarrollo, credenciales acadГ©micas y motor ONNX",
    zh: "з ”еЏ‘и·Їзєїе›ѕгЂЃе­¦жњЇе‡­иЇЃеЏЉ ONNX ж ёеїѓеј•ж“Ћ",
    tr: "GeliЕџtirme yol haritasД±, akademik belgeler ve ONNX motoru",
    hi: "а¤µа¤їа¤•а¤ѕа¤ё а¤°аҐ‹а¤Ўа¤®аҐ€а¤Є, а¤¶аҐ€а¤•аҐЌа¤·а¤Ја¤їа¤• а¤•rediаҐ‡а¤‚а¤¶а¤їа¤Їа¤ІаҐЌа¤ё а¤”а¤° ONNX а¤‡а¤‚а¤ња¤Ё",
    ar: "Ш®Ш±ЩЉШ·Ш© Ш·Ш±ЩЉЩ‚ Ш§Щ„ШЄШ·Щ€ЩЉШ± Щ€Ш§Щ„Щ…Ш¤Щ‡Щ„Ш§ШЄ Ш§Щ„ШЈЩѓШ§ШЇЩЉЩ…ЩЉШ© Щ€Щ…Ш­Ш±Щѓ ONNX",
    pt: "Roteiro de desenvolvimento, credenciais acadГЄmicas e motor ONNX",
    fr: "Feuille de route de dГ©veloppement, diplГґmes universitaires et moteur ONNX",
    de: "Entwicklungs-Roadmap, akademische Referenzen und ONNX-Motor",
    ja: "й–‹з™єгѓ­гѓјгѓ‰гѓћгѓѓгѓ—гЂЃе­¦иЎ“зљ„иі‡ж јгЂЃгЃЉг‚€гЃіONNXг‚Ёгѓіг‚ёгѓі",
  },
  about: {
    ru: "РћС„РёС†РёР°Р»СЊРЅС‹Р№ РїР°С‚РµРЅС‚, РёСЃС‚РѕСЂРёСЏ СЃРѕР·РґР°РЅРёСЏ Рё РєРѕРјР°РЅРґР°",
    en: "Official patent, origin story, and the core team",
    es: "Patente oficial, historia y el equipo central",
    zh: "е®ж–№дё“е€©гЂЃе€›з«‹еЋ†зЁ‹д»ҐеЏЉж ёеїѓе›ўйџ",
    tr: "Resmi patent, kuruluЕџ hikayesi ve Г§ekirdek ekip",
    hi: "а¤†а¤§а¤їа¤•а¤ѕа¤°а¤їа¤• а¤ЄаҐ‡а¤џаҐ‡а¤‚а¤џ, а¤‡а¤¤а¤їа¤№а¤ѕа¤ё а¤”а¤° а¤®аҐЃа¤–аҐЌа¤Ї а¤џаҐЂа¤®",
    ar: "Ш§Щ„ШЁШ±Ш§ШЎШ© Ш§Щ„Ш±ШіЩ…ЩЉШ© Щ€Щ‚ШµШ© Ш§Щ„ШЄШЈШіЩЉШі Щ€Ш§Щ„ЩЃШ±ЩЉЩ‚ Ш§Щ„ШЈШіШ§ШіЩЉ",
    pt: "Patente oficial, histГіria de origem e equipe principal",
    fr: "Brevet officiel, histoire de crГ©ation et Г©quipe principale",
    de: "Offizielles Patent, Entstehungsgeschichte und Kernteam",
    ja: "е…¬ејЏз‰№иЁ±гЂЃиЄ•з”џг‚№гѓ€гѓјгѓЄгѓјгЂЃгЃќгЃ—гЃ¦г‚іг‚ўгѓЃгѓјгѓ ",
  },
  comparison: {
    ru: "РЎСЂР°РІРЅРёС‚СЊ TrustNode СЃ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°РјРё РїРѕ С„СѓРЅРєС†РёСЏРј Рё РѕС„Р»Р°Р№РЅ-Р·Р°С‰РёС‚Рµ",
    en: "Compare TrustNode with alternatives across features and offline protection",
    es: "Compare TrustNode con alternativas por funciones y protecciГіn offline",
    zh: "жЊ‰еЉџиѓЅдёЋз¦»зєїйІжЉ¤еЇ№жЇ” TrustNode е’Ње…¶д»–ж–№жЎ€",
    tr: "Г–zellikler ve Г§evrimdД±ЕџД± koruma aГ§Д±sД±ndan TrustNode'u alternatiflerle karЕџД±laЕџtД±rД±n",
    hi: "а¤«а¤јаҐЂа¤ља¤°аҐЌа¤ё а¤”а¤° а¤‘а¤«а¤Іа¤ѕа¤‡а¤Ё а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤•аҐ‡ а¤†а¤§а¤ѕа¤° а¤Єа¤° TrustNode а¤•аҐЂ а¤¤аҐЃа¤Іа¤Ёа¤ѕ а¤µа¤їа¤•а¤ІаҐЌа¤ЄаҐ‹а¤‚ а¤ёаҐ‡ а¤•а¤°аҐ‡а¤‚",
    ar: "Щ‚Ш§Ш±Щ† TrustNode ШЁШ§Щ„ШЁШЇШ§Ш¦Щ„ Щ…Щ† Ш­ЩЉШ« Ш§Щ„Щ…ЩЉШІШ§ШЄ Щ€Ш§Щ„Ш­Щ…Ш§ЩЉШ© ШЇЩ€Щ† Ш§ШЄШµШ§Щ„",
    pt: "Compare o TrustNode com alternativas por recursos e proteГ§ГЈo offline",
    fr: "Comparez TrustNode aux alternatives selon les fonctions et la protection hors ligne",
    de: "Vergleichen Sie TrustNode mit Alternativen nach Funktionen und Offline-Schutz",
    ja: "ж©џиѓЅгЃЁг‚Єгѓ•гѓ©г‚¤гѓідїќи­·гЃ§ TrustNode г‚’д»–иЈЅе“ЃгЃЁжЇ”ијѓгЃ—гЃѕгЃ™",
  },
  download: {
    ru: "РЎРєР°С‡Р°С‚СЊ TrustNode Рё РїРѕР»СѓС‡РёС‚СЊ РґРѕСЃС‚СѓРї Рє Р±РµС‚Р°-РІРµСЂСЃРёРё",
    en: "Download TrustNode and get beta access",
    es: "Descargue TrustNode y obtenga acceso beta",
    zh: "дё‹иЅЅ TrustNode е№¶иЋ·еЏ–жµ‹иЇ•з‰€и®їй—®жќѓй™ђ",
    tr: "TrustNode'u indirin ve beta eriЕџimi alД±n",
    hi: "TrustNode а¤Ўа¤ѕа¤‰а¤Ёа¤ІаҐ‹а¤Ў а¤•а¤°аҐ‡а¤‚ а¤”а¤° а¤¬аҐЂа¤џа¤ѕ а¤Џа¤•аҐЌа¤ёаҐ‡а¤ё а¤ЄаҐЌа¤°а¤ѕа¤ЄаҐЌа¤¤ а¤•а¤°аҐ‡а¤‚",
    ar: "Щ†ШІЩ‘Щ„ TrustNode Щ€Ш§Ш­ШµЩ„ Ш№Щ„Щ‰ Щ€ШµЩ€Щ„ ШЄШ¬Ш±ЩЉШЁЩЉ",
    pt: "Baixe o TrustNode e obtenha acesso beta",
    fr: "TГ©lГ©chargez TrustNode et obtenez un accГЁs bГЄta",
    de: "Laden Sie TrustNode herunter und erhalten Sie Beta-Zugriff",
    ja: "TrustNodeг‚’гѓЂг‚¦гѓігѓ­гѓјгѓ‰гЃ—гЃ¦гѓ™гѓјг‚їг‚ўг‚Їг‚»г‚№г‚’е…Ґж‰‹",
  },
  news: {
    ru: "РќРѕРІРѕСЃС‚Рё РїСЂРѕРµРєС‚Р° РёР· Telegram Рё VK",
    en: "Project news from Telegram and VK",
    es: "Noticias del proyecto desde Telegram y VK",
    zh: "жќҐи‡Є Telegram е’Њ VK зљ„йЎ№з›®ж–°й—»",
    tr: "Telegram ve VK'dan proje haberleri",
    hi: "Telegram а¤”а¤° VK а¤ёаҐ‡ а¤ЄаҐЌа¤°аҐ‹а¤њаҐ‡а¤•аҐЌа¤џ а¤ёа¤®а¤ѕа¤ља¤ѕа¤°",
    ar: "ШЈШ®ШЁШ§Ш± Ш§Щ„Щ…ШґШ±Щ€Ш№ Щ…Щ† Telegram Щ€ VK",
    pt: "NotГ­cias do projeto do Telegram e VK",
    fr: "ActualitГ©s du projet depuis Telegram et VK",
    de: "Projekt-Neuigkeiten aus Telegram und VK",
    ja: "Telegram гЃЁ VK гЃ‹г‚‰гЃ®гѓ—гѓ­г‚ёг‚§г‚Їгѓ€гѓ‹гѓҐгѓјг‚№",
  },
  "not-found": {},
  privacy: {},
  terms: {},
};

interface PageNavigationFooterProps {
  currentPage: PageId;
}

export default function PageNavigationFooter({ currentPage }: PageNavigationFooterProps) {
  const { navigateTo } = useNavigation();
  const { t, language } = useTranslation();
  const pagesSeq = HEADER_PAGES;

  // Find index of current page in sequence
  const currentIndex = pagesSeq.findIndex((p) => p.id === currentPage);
  if (currentIndex === -1) return null;

  // Determine the next page in sequence
  const nextPageIndex = (currentIndex + 1) % pagesSeq.length;
  const nextPage = pagesSeq[nextPageIndex];

  // Get localized labels
  const pageLabel = t.pageNames[nextPage.id] || nextPage.id;
  const pageDesc = PAGE_DESCRIPTIONS[nextPage.id]?.[language] || PAGE_DESCRIPTIONS[nextPage.id]?.en || "";
  const nextLabel = NEXT_LABEL[language] || NEXT_LABEL.en;

  const handleNextNavigation = () => {
    navigateTo(nextPage.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full py-10 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B]/90 relative overflow-hidden select-none" id="page-nav-footer">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#3B82F6]/20 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          onClick={handleNextNavigation}
          className="group relative w-full md:max-w-2xl p-6 sm:p-8 border border-[#3C404A]/30 bg-[#12141A] backdrop-blur-md rounded-md hover:border-[#3B82F6]/45 hover:shadow-glow-md transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
        >
          {/* Accent light overlay */}
          <div className="absolute -inset-px rounded-md bg-gradient-to-r from-[#3B82F6]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="relative z-10">
            {/* Small Monospaced Badge */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3B82F6] animate-pulse" />
              <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.18em] text-[#3B82F6] uppercase">
                {nextLabel}
              </span>
            </div>

            {/* Next Page Title */}
            <h4 className="font-display font-bold text-xl sm:text-2xl text-[#F5F5F0] group-hover:text-[#3B82F6] transition-colors mb-2">
              {pageLabel}
            </h4>
            
            {/* Description */}
            <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
              {pageDesc}
            </p>
          </div>

          {/* Action indicator arrow */}
          <div className="relative z-10 flex items-center gap-2 self-end sm:self-center shrink-0">
            <div className="w-10 h-10 rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/5 group-hover:border-[#3B82F6]/50 group-hover:bg-[#3B82F6]/15 flex items-center justify-center text-[#3B82F6] group-hover:text-white transition-all duration-300 group-hover:scale-[1.05]">
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
