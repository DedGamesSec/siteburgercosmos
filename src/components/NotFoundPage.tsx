import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigation } from "../navigation/NavigationContext";
import { useTranslation } from "../i18n/LanguageContext";

export default function NotFoundPage() {
  const { navigateTo } = useNavigation();
  const { language } = useTranslation();

  const translations: Record<string, { badge: string; title: string; desc: string; btn: string }> = {
    ru: {
      badge: "ERR_404 // ROUTE_NOT_FOUND",
      title: "РЎРµРєС‚РѕСЂ РЅРµ РѕР±РЅР°СЂСѓР¶РµРЅ РІ Р·Р°С‰РёС‚РЅРѕРј РєСѓРїРѕР»Рµ",
      desc: "Р—Р°РїСЂРѕС€РµРЅРЅС‹Р№ РїСѓС‚СЊ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚ РёР»Рё Р±С‹Р» РїРµСЂРµРјРµС‰С‘РЅ. РђРІС‚РѕРЅРѕРјРЅР°СЏ СЃРёСЃС‚РµРјР° Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё TrustNode СЂРµРєРѕРјРµРЅРґСѓРµС‚ РІРµСЂРЅСѓС‚СЊСЃСЏ РЅР° РіР»Р°РІРЅС‹Р№ СЌРєСЂР°РЅ.",
      btn: "Р’РµСЂРЅСѓС‚СЊСЃСЏ РЅР° РіР»Р°РІРЅСѓСЋ"
    },
    en: {
      badge: "ERR_404 // ROUTE_NOT_FOUND",
      title: "Sector Not Found in Security Dome",
      desc: "The requested route does not exist or has been relocated. TrustNode autonomous security shield recommends returning to the main sector.",
      btn: "Return to Home Sector"
    },
    es: {
      badge: "ERR_404 // ROUTE_NOT_FOUND",
      title: "Sector No Encontrado en el Domo",
      desc: "La ruta solicitada no existe o ha sido reubicada. Recomendamos regresar a la pantalla principal.",
      btn: "Volver a Inicio"
    },
    zh: {
      badge: "ERR_404 // ROUTE_NOT_FOUND",
      title: "е®‰е…Ёз›ѕе†…жњЄж‰ѕе€°иЇҐж‰‡еЊє",
      desc: "иЇ·ж±‚зљ„и·Їеѕ„дёЌе­ењЁж€–е·Ій‡Ќе®љдЅЌгЂ‚TrustNode е»єи®®иї”е›ћдё»йЎµйќўгЂ‚",
      btn: "иї”е›ћдё»йЎµ"
    }
  };

  const t404 = translations[language] || translations["en"];

  return (
    <div className="w-full min-h-[85vh] flex flex-col items-center justify-center px-4 pt-28 pb-16 text-center select-none bg-[#0A0A0B]">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3C404A]/50 border border-[#3B82F6]/40 text-[#3B82F6] font-mono text-xs mb-6 tracking-widest shadow-glow-md">
        <ShieldAlert className="w-4 h-4 animate-pulse" />
        <span>{t404.badge}</span>
      </div>

      <h1 className="font-display font-bold text-4xl sm:text-6xl text-[#F5F5F0] mb-4 max-w-2xl tracking-tight">
        {t404.title}
      </h1>

      <p className="font-sans text-sm sm:text-base text-gray-400 max-w-lg mb-8 leading-relaxed">
        {t404.desc}
      </p>

      <button
        onClick={() => navigateTo("home")}
        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-md bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white font-sans font-semibold text-sm shadow-glow-lg transition-all duration-300 cursor-pointer hover:scale-[1.05]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t404.btn}</span>
      </button>
    </div>
  );
}
