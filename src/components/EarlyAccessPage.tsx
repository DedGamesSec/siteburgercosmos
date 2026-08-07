import React from "react";
import { ArrowLeft, ShieldCheck, Lock, Cpu, Smartphone } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { RUSTORE_URL, GITHUB_APK_URL } from "./Header";

const TRUST_DICT: Record<string, Record<string, string>> = {
  ru: {
    noStoreTitle: "РџРѕС‡РµРјСѓ РїСЂРёР»РѕР¶РµРЅРёСЏ РЅРµС‚ РІ Google Play",
    noStoreText: "TrustNode вЂ” СЃРїРµС†РёР°Р»РёР·РёСЂРѕРІР°РЅРЅРѕРµ Р°РЅС‚РёС„СЂРѕРґ-СЂРµС€РµРЅРёРµ, РїРѕСЌС‚РѕРјСѓ РјС‹ СЂР°СЃРїСЂРѕСЃС‚СЂР°РЅСЏРµРј РµРіРѕ С‡РµСЂРµР· RuStore Рё РѕС„РёС†РёР°Р»СЊРЅС‹Р№ СЂРµР»РёР· РЅР° GitHub, С‡С‚РѕР±С‹ Р±С‹С‚СЊ РїСЂРѕР·СЂР°С‡РЅС‹РјРё РѕС‚РЅРѕСЃРёС‚РµР»СЊРЅРѕ РІРµСЂСЃРёРё Рё РїРѕРґРїРёСЃРё.",
  },
  en: {
    noStoreTitle: "Why is the app not on Google Play",
    noStoreText: "TrustNode is a specialised anti-fraud solution; it is distributed via RuStore and an official GitHub release.",
  },
  es: {
    noStoreTitle: "Por quГ© la app no estГЎ en Google Play",
    noStoreText: "TrustNode es una soluciГіn antifraude especializada; por eso se distribuye mediante RuStore y GitHub.",
  },
  zh: {
    noStoreTitle: "дёєд»Ђд№€еє”з”ЁдёЌењЁ Google Play",
    noStoreText: "TrustNode жЇдё“й—Ёзљ„йІж¬єиЇ€ж–№жЎ€пјЊе› ж­¤йЂљиї‡ RuStore е’Њ GitHub е®ж–№еЏ‘еёѓпјЊдїќжЊЃйЂЏжЋгЂ‚",
  },
  tr: {
    noStoreTitle: "Uygulama neden Google Play'de deДџil",
    noStoreText: "TrustNode, odaklД± bir dolandД±rД±cД±lД±k Г¶nleme Г§Г¶zГјmГјdГјr; bu yГјzden RuStore ve GitHub Гјzerinden daДџД±tД±lД±r.",
  },
  hi: {
    noStoreTitle: "а¤ђа¤Є Google Play а¤Єа¤° а¤•аҐЌа¤ЇаҐ‹а¤‚ а¤Ёа¤№аҐЂа¤‚ а¤№аҐ€",
    noStoreText: "TrustNode а¤Џа¤• а¤µа¤їа¤¶аҐ‡а¤· а¤Џа¤‚а¤џаҐЂ-а¤«аҐЌа¤°аҐ‰а¤Ў а¤ёа¤®а¤ѕа¤§а¤ѕа¤Ё а¤№аҐ€, а¤‡а¤ёа¤Іа¤їа¤Џ а¤‡а¤ёаҐ‡ RuStore а¤”а¤° GitHub а¤ёаҐ‡ а¤µа¤їа¤¤а¤°а¤їа¤¤ а¤•а¤їа¤Їа¤ѕ а¤ња¤ѕа¤¤а¤ѕ а¤№аҐ€аҐ¤",
  },
  ar: {
    noStoreTitle: "Щ„Щ…Ш§Ш°Ш§ Ш§Щ„ШЄШ·ШЁЩЉЩ‚ ШєЩЉШ± Щ…ШЄЩ€ЩЃШ± Ш№Щ„Щ‰ Google Play",
    noStoreText: "TrustNode Ш­Щ„ Щ…ШЄШ®ШµШµ Ш¶ШЇ Ш§Щ„Ш§Ш­ШЄЩЉШ§Щ„ШЊ Щ„Ш°Щ„Щѓ Щ†Щ€ШІШ№Щ‡ Ш№ШЁШ± RuStore Щ€ GitHub.",
  },
  pt: {
    noStoreTitle: "Por que o app nГЈo estГЎ no Google Play",
    noStoreText: "TrustNode Г© uma soluГ§ГЈo antifraude especializada; por isso Г© distribuГ­da pela RuStore e GitHub.",
  },
  fr: {
    noStoreTitle: "Pourquoi l'app n'est pas sur Google Play",
    noStoreText: "TrustNode est une solution antifraude spГ©cialisГ©e, donc nous le distribuons via GitHub et RuStore.",
  },
  de: {
    noStoreTitle: "Warum ist die App nicht im Google Play Store",
    noStoreText: "TrustNode ist eine spezialisierte Antifraud-LГ¶sung und wird daher Гјber Rustore und GitHub verteilt.",
  },
  ja: {
    noStoreTitle: "г‚ўгѓ—гѓЄгЃЊ Google Play гЃ«гЃЄгЃ„зђ†з”±",
    noStoreText: "TrustNode гЃЇз‰№ж®ЉгЃЄи©ђж¬єеЇѕе‡¦г‚ЅгѓЄгѓҐгѓјг‚·гѓ§гѓігЃ®гЃџг‚ЃгЂЃж­ЈејЏгЃЄгѓЄгѓќг‚ёгѓ€гѓЄгЃЁ GitHub гЃ§й…ЌеёѓгЃ—гЃ¦гЃ„гЃѕгЃ™гЂ‚",
  },
};

export default function EarlyAccessPage() {
  const { t, language } = useTranslation();
  const { navigateTo } = useNavigation();
  const lp = t.earlyAccessPage;
  const trust = TRUST_DICT[language] || TRUST_DICT.en;

  const featureIcons = [Smartphone, Cpu, Lock];
  return (
    <div className="relative w-full min-h-0 py-8 px-4 flex flex-col items-center justify-start bg-[#0A0A0B] overflow-hidden select-none" id="download-root">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto flex flex-col relative z-10">

        <button onClick={() => navigateTo("home")}
          className="self-start mb-8 font-mono text-xs text-gray-500 hover:text-[#3B82F6] flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.04] bg-white/[0.02] transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lp.back}</span>
        </button>

        <div className="inline-flex self-center items-center gap-2 px-3 py-1 bg-[#12141A]/40 border border-[#3B82F6]/20 rounded-full mb-4">
          <ShieldCheck className="w-3 h-3 text-[#3B82F6] animate-pulse" />
          <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-[#3B82F6] uppercase">{lp.badge}</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#F5F5F0] text-center tracking-tight mb-4 filter drop-shadow-glow-sm">{lp.title}</h1>
        <p className="font-sans text-sm sm:text-base text-gray-500 text-center max-w-2xl mx-auto mb-12 leading-relaxed">{lp.subtitle}</p>

        <div className="max-w-2xl mx-auto w-full mb-12">
          <div className="p-6 sm:p-8 rounded-md border border-[#3C404A]/30 bg-[#12141A] backdrop-blur-md flex flex-col items-center gap-6">
            <a href={GITHUB_APK_URL} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-md font-sans text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 cursor-pointer shadow-glow-md hover:shadow-glow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {lp.githubBtn}
            </a>
            <a href={RUSTORE_URL} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-md font-sans text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 bg-[#12141A] border border-[#3B82F6]/40 text-gray-200 hover:text-white hover:bg-[#12141A] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {lp.rustoreBtn}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
          {[lp.feature1Title, lp.feature2Title, lp.feature3Title].map((title, idx) => {
            const Icon = featureIcons[idx];
            const descs = [lp.feature1Desc, lp.feature2Desc, lp.feature3Desc];
            return (
              <div key={idx} className="p-5 sm:p-6 rounded-md border border-[#3C404A]/40 bg-[#0A0A0B]/80">
                <div className="w-11 h-11 rounded-md bg-[#0A0A0B]/80 border border-[#3B82F6]/25 flex items-center justify-center text-[#3B82F6] mb-4"><Icon className="w-5 h-5" /></div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#F5F5F0] mb-2">{title}</h3>
                <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">{descs[idx]}</p>
              </div>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto w-full mb-12">
          <div className="rounded-md border border-[#3C404A]/40 bg-[#0A0A0B]/80 p-6 sm:p-8">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#F5F5F0] mb-3">{trust.noStoreTitle}</h3>
            <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">{trust.noStoreText}</p>
          </div>
        </div>

        <p className="font-mono text-sm sm:text-base tracking-normal text-gray-400 text-center">{lp.note}</p>
      </div>
    </div>
  );
}
