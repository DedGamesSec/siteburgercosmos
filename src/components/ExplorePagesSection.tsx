import React from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { PAGES_CONFIG } from "../navigation/pages.config";
import { Home, Cpu, ShieldCheck, Map, Users, BarChart3, Download, Newspaper } from "lucide-react";
import type { LanguageCode } from "../i18n/languages";

const PAGE_ICONS: Record<string, React.ElementType> = {
  home: Home,
  "how-it-works": Cpu,
  tech: ShieldCheck,
  roadmap: Map,
  about: Users,
  comparison: BarChart3,
  download: Download,
  news: Newspaper,
};

const HEADER_PAGES = PAGES_CONFIG.filter((p) => p.showInHeader).sort((a, b) => a.order - b.order);

type LangDict = Record<LanguageCode, string>;

const PAGE_BADGES: Record<string, LangDict> = {
  home: {
    ru: "РџРћР РўРђР› РџР›РђРўР¤РћР РњР«", en: "PLATFORM PORTAL", es: "PORTAL DE PLATAFORMA", zh: "е№іеЏ°й—Ёж€·", tr: "PLATFORM PORTALI",
    hi: "а¤ЄаҐЌа¤ІаҐ‡а¤џа¤«а¤јаҐ‰а¤°аҐЌа¤® а¤ЄаҐ‹а¤°аҐЌа¤џа¤І", ar: "ШЁЩ€Ш§ШЁШ© Ш§Щ„Щ…Щ†ШµШ©", pt: "PORTAL DA PLATAFORMA", fr: "PORTAL PLATEFORME", de: "PLATTFORM-PORTAL", ja: "гѓ—гѓ©гѓѓгѓ€гѓ•г‚©гѓјгѓ гѓќгѓјг‚їгѓ«",
  },
  "how-it-works": {
    ru: "РЎРРЎРўР•РњРђ PHANTOM", en: "PHANTOM SYSTEM", es: "SISTEMA PHANTOM", zh: "PHANTOM зі»з»џ", tr: "PHANTOM SД°STEMД°",
    hi: "PHANTOM а¤ЄаҐЌа¤°а¤Ја¤ѕа¤ІаҐЂ", ar: "Щ†ШёШ§Щ… PHANTOM", pt: "SISTEMA PHANTOM", fr: "SYSTГ€ME PHANTOM", de: "PHANTOM-SYSTEM", ja: "PHANTOM г‚·г‚№гѓ†гѓ ",
  },
  tech: {
    ru: "Р—РђР©РРўРђ Р РђР РҐРРўР•РљРўРЈР Рђ", en: "SECURITY & ARCHITECTURE", es: "SEGURIDAD Y ARQUITECTURA", zh: "е®‰е…ЁдёЋжћ¶жћ„", tr: "GГњVENLД°K VE MД°MARД°",
    hi: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤”а¤° а¤†а¤°аҐЌа¤•а¤їа¤џаҐ‡а¤•аҐЌа¤ља¤°", ar: "Ш§Щ„ШЈЩ…Ш§Щ† Щ€Ш§Щ„ШЁЩ†ЩЉШ©", pt: "SEGURANГ‡A E ARQUITETURA", fr: "SГ‰CURITГ‰ ET ARCHITECTURE", de: "SICHERHEIT & ARCHITEKTUR", ja: "г‚»г‚­гѓҐгѓЄгѓ†г‚ЈгЃЁг‚ўгѓјг‚­гѓ†г‚ЇгѓЃгѓЈ",
  },
  roadmap: {
    ru: "Р”РћР РћР–РќРђРЇ РљРђР РўРђ", en: "ROADMAP", es: "HOJA DE RUTA", zh: "и·Їзєїе›ѕ", tr: "YOL HARД°TASI",
    hi: "а¤°аҐ‹а¤Ўа¤®аҐ€а¤Є", ar: "Ш®Ш§Ш±Ш·Ш© Ш§Щ„Ш·Ш±ЩЉЩ‚", pt: "ROTEIRO", fr: "FEUILLE DE ROUTE", de: "FAHRPLAN", ja: "гѓ­гѓјгѓ‰гѓћгѓѓгѓ—",
  },
  about: {
    ru: "Р’РђР›РР”РђР¦РРЇ Р РџРђРўР•РќРўР«", en: "VALIDATION & PATENTS", es: "VALIDACIГ“N Y PATENTES", zh: "и®¤иЇЃдёЋдё“е€©", tr: "DOДћRULAMA VE PATENTLER",
    hi: "а¤®а¤ѕа¤ЁаҐЌа¤Їа¤¤а¤ѕ а¤”а¤° а¤ЄаҐ‡а¤џаҐ‡а¤‚а¤џ", ar: "Ш§Щ„ШЄШ­Щ‚Щ‚ Щ€Ш§Щ„ШЁШ±Ш§ШЎШ§ШЄ", pt: "VALIDAГ‡ГѓO E PATENTES", fr: "VALIDATION ET BREVETS", de: "VALIDIERUNG & PATENTE", ja: "ж¤њиЁјгЃЁз‰№иЁ±",
  },
  comparison: {
    ru: "Р¤РђРљРўР« Р РљРћРќРљРЈР Р•РќРўР«", en: "FACTS & COMPETITORS", es: "HECHOS Y COMPETIDORES", zh: "дє‹е®ћдёЋз«ће“Ѓ", tr: "GERГ‡EKLER VE RAKД°PLER",
    hi: "а¤¤а¤ҐаҐЌа¤Ї а¤”а¤° а¤ЄаҐЌа¤°а¤¤а¤їа¤ёаҐЌа¤Єа¤°аҐЌа¤§аҐЂ", ar: "Ш§Щ„Ш­Щ‚Ш§Ш¦Щ‚ Щ€Ш§Щ„Щ…Щ†Ш§ЩЃШіЩ€Щ†", pt: "FATOS E CONCORRENTES", fr: "FAITS ET CONCURRENTS", de: "FAKTEN & KONKURRENZ", ja: "дє‹е®џгЃЁз«¶еђ€",
  },
  download: {
    ru: "РЈРЎРўРђРќРћР’РРўР¬", en: "INSTALL", es: "INSTALAR", zh: "е®‰иЈ…", tr: "KUR",
    hi: "а¤‡а¤‚а¤ёаҐЌа¤џаҐ‰а¤І а¤•а¤°аҐ‡а¤‚", ar: "ШЄШ«ШЁЩЉШЄ", pt: "INSTALAR", fr: "INSTALLER", de: "INSTALLIEREN", ja: "г‚¤гѓіг‚№гѓ€гѓјгѓ«",
  },
  news: {
    ru: "РќРћР’РћРЎРўР Р РђРќРћРќРЎР«", en: "NEWS & ANNOUNCEMENTS", es: "NOTICIAS Y ANUNCIOS", zh: "ж–°й—»дёЋе…¬е‘Љ", tr: "HABERLER VE DUYURULAR",
    hi: "а¤ёа¤®а¤ѕа¤ља¤ѕа¤° а¤”а¤° а¤аҐ‹а¤·а¤Ја¤ѕа¤Џа¤Ѓ", ar: "Ш§Щ„ШЈШ®ШЁШ§Ш± Щ€Ш§Щ„ШҐШ№Щ„Ш§Щ†Ш§ШЄ", pt: "NOTГЌCIAS E ANГљNCIOS", fr: "ACTUALITГ‰S ET ANNONCES", de: "NEUIGKEITEN & ANKГњNDIGUNGEN", ja: "гѓ‹гѓҐгѓјг‚№гЃЁгЃЉзџҐг‚‰гЃ›",
  },
};

const PAGE_DESCRIPTIONS: Record<string, LangDict> = {
  home: {
    ru: "РћР±Р·РѕСЂ РїР»Р°С‚С„РѕСЂРјС‹ TrustNode: Р»РѕРєР°Р»СЊРЅС‹Р№ AI-Р°РЅС‚РёС„СЂРёРґ, Р·Р°С‰РёС‚Р° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё Рё РїРѕР»РЅС‹Р№ РєРѕРЅС‚СЂРѕР»СЊ РЅР°Рґ РІР°С€РёРјРё РґР°РЅРЅС‹РјРё.",
    en: "TrustNode platform overview: local AI anti-fraud, privacy protection, and full control over your data.",
    es: "DescripciГіn general de TrustNode: anti-fraude con IA local, protecciГіn de privacidad y control total de sus datos.",
    zh: "TrustNode е№іеЏ°ж¦‚и§€пјљжњ¬ењ° AI еЏЌж¬єиЇ€гЂЃйљђз§ЃдїќжЉ¤д»ҐеЏЉеЇ№ж•°жЌ®зљ„е®Ње…ЁжЋЊжЋ§гЂ‚",
    tr: "TrustNode platforma genel bakД±Еџ: yerel AI dolandД±rД±cД±lД±k korumasД±, gizlilik ve verileriniz Гјzerinde tam kontrol.",
    hi: "TrustNode а¤ЄаҐЌа¤ІаҐ‡а¤џа¤«а¤јаҐ‰а¤°аҐЌа¤® а¤…а¤µа¤ІаҐ‹а¤•а¤Ё: а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Ї AI а¤Џа¤‚а¤џаҐЂ-а¤«аҐЌа¤°аҐ‰а¤Ў, а¤—аҐ‹а¤Єа¤ЁаҐЂа¤Їа¤¤а¤ѕ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤”а¤° а¤†а¤Єа¤•аҐ‡ а¤ЎаҐ‡а¤џа¤ѕ а¤Єа¤° а¤ЄаҐ‚а¤°аҐЌа¤Ј а¤Ёа¤їа¤Їа¤‚а¤¤аҐЌа¤°а¤ЈаҐ¤",
    ar: "Щ†ШёШ±Ш© Ш№Ш§Щ…Ш© Ш№Щ„Щ‰ Щ…Щ†ШµШ© TrustNode: Щ…ЩѓШ§ЩЃШ­Ш© Ш§Ш­ШЄЩЉШ§Щ„ Щ…Ш­Щ„ЩЉШ© ШЁШ§Щ„Ш°ЩѓШ§ШЎ Ш§Щ„Ш§ШµШ·Щ†Ш§Ш№ЩЉШЊ Ш­Щ…Ш§ЩЉШ© Ш§Щ„Ш®ШµЩ€ШµЩЉШ©ШЊ Щ€ШЄШ­ЩѓЩ… ЩѓШ§Щ…Щ„ ЩЃЩЉ ШЁЩЉШ§Щ†Ш§ШЄЩѓ.",
    pt: "VisГЈo geral da plataforma TrustNode: antifraude local com IA, proteГ§ГЈo de privacidade e controle total dos seus dados.",
    fr: "AperГ§u de TrustNode : anti-fraude IA local, protection de la vie privГ©e et contrГґle total de vos donnГ©es.",
    de: "TrustNode-PlattformГјberblick: lokaler KI-Anti-Fraud, Datenschutz und volle Kontrolle Гјber Ihre Daten.",
    ja: "TrustNode гѓ—гѓ©гѓѓгѓ€гѓ•г‚©гѓјгѓ ж¦‚и¦Ѓпјљгѓ­гѓјг‚«гѓ«AIдёЌж­ЈйІж­ўгЂЃгѓ—гѓ©г‚¤гѓђг‚·гѓјдїќи­·гЂЃгѓ‡гѓјг‚їгЃ®е®Ње…ЁгЃЄз®Ўзђ†гЂ‚",
  },
  "how-it-works": {
    ru: "РўРµС…РЅРёС‡РµСЃРєР°СЏ РґРµС‚Р°Р»РёР·Р°С†РёСЏ Р·Р°С‰РёС‚РЅРѕРіРѕ РєСѓРїРѕР»Р° PHANTOM 2.0: Р°РєСѓСЃС‚РёС‡РµСЃРєРёР№ Р°РЅР°Р»РёР· Рё ML-РєР»Р°СЃСЃРёС„РёРєР°С†РёСЏ rubert-tiny2 СЂР°Р±РѕС‚Р°СЋС‚ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ, РѕСЃС‚Р°Р»СЊРЅС‹Рµ СЃР»РѕРё вЂ” РІ СЂР°Р·СЂР°Р±РѕС‚РєРµ (Roadmap).",
    en: "Technical breakdown of the PHANTOM 2.0 security dome: acoustic analysis and rubert-tiny2 ML classification run on-device, while the remaining layers are in development (Roadmap).",
    es: "Desglose tГ©cnico del domo de seguridad PHANTOM 2.0: el anГЎlisis acГєstico y la clasificaciГіn ML rubert-tiny2 funcionan en el dispositivo, y las capas restantes estГЎn en desarrollo (Roadmap).",
    zh: "PHANTOM 2.0 йІжЉ¤з©№йЎ¶зљ„жЉЂжњЇи§ЈжћђпјљеЈ°е­¦е€†жћђдёЋ rubert-tiny2 ML е€†з±»ењЁи®ѕе¤‡з«ЇиїђиЎЊпјЊе…¶дЅ™е±‚е¤„дєЋејЂеЏ‘й¶ж®µпј€Roadmapпј‰гЂ‚",
    tr: "PHANTOM 2.0 gГјvenlik kubbesinin teknik analizi: akustik analiz ve rubert-tiny2 ML sД±nД±flandД±rma cihazda Г§alД±ЕџД±r, kalan katmanlar geliЕџtirme aЕџamasД±ndadД±r (Roadmap).",
    hi: "PHANTOM 2.0 а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤ЎаҐ‹а¤® а¤•а¤ѕ а¤¤а¤•а¤ЁаҐЂа¤•аҐЂ а¤µа¤їа¤µа¤°а¤Ј: а¤§аҐЌа¤µа¤Ёа¤їа¤• а¤µа¤їа¤¶аҐЌа¤ІаҐ‡а¤·а¤Ј а¤”а¤° rubert-tiny2 ML а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј а¤Ўа¤їа¤µа¤ѕа¤‡а¤ё а¤Єа¤° а¤ља¤Іа¤¤аҐ‡ а¤№аҐ€а¤‚, а¤¶аҐ‡а¤· а¤Єа¤°а¤¤аҐ‡а¤‚ а¤µа¤їа¤•а¤ѕа¤ё а¤®аҐ‡а¤‚ а¤№аҐ€а¤‚ (Roadmap)аҐ¤",
    ar: "ШЄЩЃШ§ШµЩЉЩ„ ШЄЩ‚Щ†ЩЉШ© Щ„Щ‚ШЁШ© Ш§Щ„Ш­Щ…Ш§ЩЉШ© PHANTOM 2.0: Ш§Щ„ШЄШ­Щ„ЩЉЩ„ Ш§Щ„ШµЩ€ШЄЩЉ Щ€ШЄШµЩ†ЩЉЩЃ Ш§Щ„ШЄШ№Щ„Щ… Ш§Щ„ШўЩ„ЩЉ rubert-tiny2 ЩЉШ№Щ…Щ„Ш§Щ† Ш№Щ„Щ‰ Ш§Щ„Ш¬Щ‡Ш§ШІШЊ ШЁЩЉЩ†Щ…Ш§ Ш§Щ„Ш·ШЁЩ‚Ш§ШЄ Ш§Щ„Щ…ШЄШЁЩ‚ЩЉШ© Щ‚ЩЉШЇ Ш§Щ„ШЄШ·Щ€ЩЉШ± (Roadmap).",
    pt: "Detalhamento tГ©cnico do domo de seguranГ§a PHANTOM 2.0: a anГЎlise acГєstica e a classificaГ§ГЈo ML rubert-tiny2 rodam no dispositivo, e as demais camadas estГЈo em desenvolvimento (Roadmap).",
    fr: "Analyse technique du dГґme de sГ©curitГ© PHANTOM 2.0 : l'analyse acoustique et la classification ML rubert-tiny2 fonctionnent sur l'appareil, tandis que les autres couches sont en cours de dГ©veloppement (Roadmap).",
    de: "Technische AufschlГјsselung der PHANTOM-2.0-Sicherheitskuppel: Akustikanalyse und ML-Klassifikation rubert-tiny2 laufen auf dem GerГ¤t, die Гјbrigen Ebenen befinden sich in Entwicklung (Roadmap).",
    ja: "PHANTOM 2.0 г‚»г‚­гѓҐгѓЄгѓ†г‚Јгѓ‰гѓјгѓ гЃ®жЉЂиЎ“и§ЈиЄ¬пјљйџійџїи§ЈжћђгЃЁ rubert-tiny2 гЃ®MLе€†йЎћгЃЇз«Їжњ«дёЉгЃ§зЁјеѓЌгЃ—гЂЃгЃќгЃ®д»–гЃ®гѓ¬г‚¤гѓ¤гѓјгЃЇй–‹з™єдё­пј€Roadmapпј‰гЃ§гЃ™гЂ‚",
  },
  tech: {
    ru: "Р“Р»СѓР±РѕРєРѕРµ РїРѕРіСЂСѓР¶РµРЅРёРµ РІ Р°СЂС…РёС‚РµРєС‚СѓСЂСѓ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё, РјРѕР±РёР»СЊРЅС‹Р№ AI-РґРІРёР¶РѕРє ruBERT Рё СЃРёСЃС‚РµРјСѓ РѕР±РЅР°СЂСѓР¶РµРЅРёСЏ РјРѕС€РµРЅРЅРёС‡РµСЃС‚РІР° РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё.",
    en: "Deep dive into the security architecture, mobile AI engine ruBERT, and real-time fraud detection system.",
    es: "AnГЎlisis profundo de la arquitectura de seguridad, el motor de IA mГіvil ruBERT y la detecciГіn de fraude en tiempo real.",
    zh: "ж·±е…ҐжЋўи®Ёе®‰е…Ёжћ¶жћ„гЂЃз§»еЉЁ AI еј•ж“Ћ ruBERT е’Ње®ћж—¶ж¬єиЇ€жЈЂжµ‹зі»з»џгЂ‚",
    tr: "GГјvenlik mimarisine, mobil AI motoru ruBERT'e ve gerГ§ek zamanlД± dolandД±rД±cД±lД±k tespit sistemine derinlemesine bir bakД±Еџ.",
    hi: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤†а¤°аҐЌа¤•а¤їа¤џаҐ‡а¤•аҐЌа¤ља¤°, а¤®аҐ‹а¤¬а¤ѕа¤‡а¤І AI а¤‡а¤‚а¤ња¤Ё ruBERT а¤”а¤° а¤°аҐЂа¤Їа¤І-а¤џа¤ѕа¤‡а¤® а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤Єа¤№а¤ља¤ѕа¤Ё а¤ЄаҐЌа¤°а¤Ја¤ѕа¤ІаҐЂ а¤•аҐЂ а¤—а¤№а¤Ё а¤ёа¤®аҐЂа¤•аҐЌа¤·а¤ѕаҐ¤",
    ar: "ШЄШ№Щ…Щ‚ ЩЃЩЉ ШЁЩ†ЩЉШ© Ш§Щ„ШЈЩ…Ш§Щ† Щ€Щ…Ш­Ш±Щѓ Ш§Щ„Ш°ЩѓШ§ШЎ Ш§Щ„Ш§ШµШ·Щ†Ш§Ш№ЩЉ Ш§Щ„Щ…Ш­Щ…Щ€Щ„ ruBERT Щ€Щ†ШёШ§Щ… ЩѓШґЩЃ Ш§Щ„Ш§Ш­ШЄЩЉШ§Щ„ ЩЃЩЉ Ш§Щ„Щ€Щ‚ШЄ Ш§Щ„ЩЃШ№Щ„ЩЉ.",
    pt: "AnГЎlise profunda da arquitetura de seguranГ§a, do mecanismo de IA mГіvel ruBERT e da detecГ§ГЈo de fraudes em tempo real.",
    fr: "PlongГ©e dans l'architecture de sГ©curitГ©, le moteur IA mobile ruBERT et la dГ©tection de fraude en temps rГ©el.",
    de: "Tiefer Einblick in die Sicherheitsarchitektur, die mobile KI-Engine ruBERT und die Echtzeit-Betrugserkennung.",
    ja: "г‚»г‚­гѓҐгѓЄгѓ†г‚Јг‚ўгѓјг‚­гѓ†г‚ЇгѓЃгѓЈгЂЃгѓўгѓђг‚¤гѓ«AIг‚Ёгѓіг‚ёгѓіruBERTгЂЃгѓЄг‚ўгѓ«г‚їг‚¤гѓ и©ђж¬єж¤њзџҐг‚·г‚№гѓ†гѓ г‚’ж·±жЋг‚ЉгЂ‚",
  },
  roadmap: {
    ru: "РџР»Р°РЅ СЂР°Р·РІРёС‚РёСЏ РїСЂРѕРµРєС‚Р°: РѕС‚ С‚РµРєСѓС‰РµР№ MVP-РІРµСЂСЃРёРё РґРѕ РїРѕР»РЅРѕС†РµРЅРЅРѕР№ СЌРєРѕСЃРёСЃС‚РµРјС‹ СЃ РїСѓР±Р»РёС‡РЅС‹Рј Р°СѓРґРёС‚РѕРј Рё РѕС‚РєСЂС‹С‚С‹Рј API.",
    en: "Project development plan: from the current MVP to a full ecosystem with public audit and open API.",
    es: "Plan de desarrollo: desde el MVP actual hasta un ecosistema completo con auditorГ­a pГєblica y API abierta.",
    zh: "йЎ№з›®еЏ‘е±•и®Ўе€’пјљд»ЋеЅ“е‰Ќзљ„ MVP е€°ж‹Ґжњ‰е…¬е…±е®Ўи®Ўе’ЊејЂж”ѕ API зљ„е®Њж•ґз”џжЂЃзі»з»џгЂ‚",
    tr: "Proje geliЕџtirme planД±: mevcut MVP'den genel denetimli ve aГ§Д±k API'li tam ekosisteme.",
    hi: "а¤Єа¤°а¤їа¤ЇаҐ‹а¤ња¤Ёа¤ѕ а¤µа¤їа¤•а¤ѕа¤ё а¤ЇаҐ‹а¤ња¤Ёа¤ѕ: а¤µа¤°аҐЌа¤¤а¤®а¤ѕа¤Ё MVP а¤ёаҐ‡ а¤ёа¤ѕа¤°аҐЌа¤µа¤ња¤Ёа¤їа¤• а¤‘а¤Ўа¤їа¤џ а¤”а¤° а¤“а¤Єа¤Ё API а¤µа¤ѕа¤ІаҐ‡ а¤ЄаҐ‚а¤°аҐЌа¤Ј а¤‡а¤•аҐ‹а¤ёа¤їа¤ёаҐЌа¤џа¤® а¤¤а¤•аҐ¤",
    ar: "Ш®Ш·Ш© ШЄШ·Щ€ЩЉШ± Ш§Щ„Щ…ШґШ±Щ€Ш№: Щ…Щ† Ш§Щ„Щ†ШіШ®Ш© Ш§Щ„ШЈЩ€Щ„ЩЉШ© Ш§Щ„Ш­Ш§Щ„ЩЉШ© ШҐЩ„Щ‰ Щ†ШёШ§Щ… ШЁЩЉШ¦ЩЉ ЩѓШ§Щ…Щ„ Щ…Ш№ ШЄШЇЩ‚ЩЉЩ‚ Ш№Ш§Щ… Щ€API Щ…ЩЃШЄЩ€Ш­.",
    pt: "Plano de desenvolvimento do projeto: do MVP atual a um ecossistema completo com auditoria pГєblica e API aberta.",
    fr: "Plan de dГ©veloppement : du MVP actuel Г  un Г©cosystГЁme complet avec audit public et API ouverte.",
    de: "Projektentwicklungsplan: vom aktuellen MVP zu einem vollstГ¤ndigen Г–kosystem mit Г¶ffentlichem Audit und offener API.",
    ja: "гѓ—гѓ­г‚ёг‚§г‚Їгѓ€й–‹з™єиЁ€з”»пјљзЏѕењЁгЃ®MVPгЃ‹г‚‰гЂЃе…¬й–‹з›Јжџ»гЃЁг‚Єгѓјгѓ—гѓіAPIг‚’е‚™гЃ€гЃџе®Ње…ЁгЃЄг‚Ёг‚іг‚·г‚№гѓ†гѓ гЃёгЂ‚",
  },
  about: {
    ru: "РћС„РёС†РёР°Р»СЊРЅС‹Р№ РїР°С‚РµРЅС‚ Р¤РРџРЎ, Р·РѕР»РѕС‚Р°СЏ РјРµРґР°Р»СЊ РЅР° СЂРµРіРёРѕРЅР°Р»СЊРЅРѕРј РќРР , СѓС‡Р°СЃС‚РёРµ РІРѕ РІСЃРµСЂРѕСЃСЃРёР№СЃРєРѕРј С„РёРЅР°Р»Рµ РІ РњРѕСЃРєРІРµ Рё РёСЃС‚РѕСЂРёСЏ СЃРѕР·РґР°РЅРёСЏ РїСЂРѕРµРєС‚Р°.",
    en: "Official patent filings, first place in regional IT research, national finals invitation, and our project development journey.",
    es: "Patentes oficiales, primer lugar en investigaciГіn regional de TI, invitaciГіn a la final nacional y nuestra trayectoria.",
    zh: "е®ж–№дё“е€©з”іжЉҐгЂЃењ°еЊєдїЎжЃЇжЉЂжњЇз ”з©¶з¬¬дёЂеђЌгЂЃе…Ёе›ЅжЂ»е†іиµ›й‚ЂиЇ·д»ҐеЏЉж€‘д»¬зљ„йЎ№з›®еЏ‘е±•еЋ†зЁ‹гЂ‚",
    tr: "Resmi patent baЕџvurularД±, bГ¶lgesel BT araЕџtД±rmasД±nda birincilik, ulusal final daveti ve proje geliЕџtirme yolculuДџumuz.",
    hi: "а¤†а¤§а¤їа¤•а¤ѕа¤°а¤їа¤• а¤ЄаҐ‡а¤џаҐ‡а¤‚а¤џ а¤¦а¤ѕа¤–а¤їа¤І, а¤•аҐЌа¤·аҐ‡а¤¤аҐЌа¤°аҐЂа¤Ї а¤†а¤€а¤џаҐЂ а¤…а¤ЁаҐЃа¤ёа¤‚а¤§а¤ѕа¤Ё а¤®аҐ‡а¤‚ а¤ЄаҐЌа¤°а¤Ґа¤® а¤ёаҐЌа¤Ґа¤ѕа¤Ё, а¤°а¤ѕа¤·аҐЌа¤џаҐЌа¤°аҐЂа¤Ї а¤«а¤ѕа¤‡а¤Ёа¤І а¤†а¤®а¤‚а¤¤аҐЌа¤°а¤Ј а¤”а¤° а¤№а¤®а¤ѕа¤°аҐЂ а¤Єа¤°а¤їа¤ЇаҐ‹а¤ња¤Ёа¤ѕ а¤Їа¤ѕа¤¤аҐЌа¤°а¤ѕаҐ¤",
    ar: "Щ…Щ„ЩЃШ§ШЄ ШЁШ±Ш§ШЎШ§ШЄ Ш§Ш®ШЄШ±Ш§Ш№ Ш±ШіЩ…ЩЉШ©ШЊ Ш§Щ„Щ…Ш±ЩѓШІ Ш§Щ„ШЈЩ€Щ„ ЩЃЩЉ Ш§Щ„ШЈШЁШ­Ш§Ш« Ш§Щ„ШЄЩ‚Щ†ЩЉШ© Ш§Щ„ШҐЩ‚Щ„ЩЉЩ…ЩЉШ©ШЊ ШЇШ№Щ€Ш© Щ„Щ„Щ†Щ‡Ш§Ш¦ЩЉ Ш§Щ„Щ€Ш·Щ†ЩЉ Щ€Ш±Ш­Щ„Ш© ШЄШ·Щ€ЩЉШ± Щ…ШґШ±Щ€Ш№Щ†Ш§.",
    pt: "Registros oficiais de patente, primeiro lugar em pesquisa regional de TI, convite para a final nacional e nossa trajetГіria.",
    fr: "DГ©pГґts de brevets officiels, premiГЁre place en recherche rГ©gionale informatique, invitation Г  la finale nationale et notre parcours.",
    de: "Offizielle Patentanmeldungen, erster Platz in regionaler IT-Forschung, Einladung zum nationalen Finale und unsere Projektentwicklung.",
    ja: "е…¬ејЏз‰№иЁ±е‡єйЎгЂЃењ°еџџITз ”з©¶гЃ§з¬¬1дЅЌгЂЃе…Ёе›Ѕе¤§дјљгѓ•г‚Ўг‚¤гѓЉгѓ«гЃёгЃ®ж‹›еѕ…гЂЃгЃќгЃ—гЃ¦гѓ—гѓ­г‚ёг‚§г‚Їгѓ€гЃ®ж­©гЃїгЂ‚",
  },
  comparison: {
    ru: "РћР±СЉРµРєС‚РёРІРЅР°СЏ СЃСЂР°РІРЅРёС‚РµР»СЊРЅР°СЏ С‚Р°Р±Р»РёС†Р° С„СѓРЅРєС†РёРѕРЅР°Р»СЊРЅРѕСЃС‚Рё TrustNode СЃ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРјРё РЅР° СЂС‹РЅРєРµ Р°РЅР°Р»РѕРіР°РјРё РїРѕ РєР»СЋС‡РµРІС‹Рј РїР°СЂР°РјРµС‚СЂР°Рј.",
    en: "An objective comparative analysis of TrustNode vs leading global security solutions across key parameters.",
    es: "Un anГЎlisis comparativo objetivo de TrustNode frente a las principales soluciones de seguridad globales.",
    zh: "TrustNode дёЋе…Ёзђѓйў†е…€е®‰е…Ёи§Је†іж–№жЎ€ењЁе…ій”®еЏ‚ж•°дёЉзљ„е®ўи§‚еЇ№жЇ”е€†жћђгЂ‚",
    tr: "TrustNode'un Г¶nde gelen kГјresel gГјvenlik Г§Г¶zГјmleriyle temel parametreler Гјzerinden objektif karЕџД±laЕџtД±rmasД±.",
    hi: "а¤ЄаҐЌа¤°а¤®аҐЃа¤– а¤®а¤ѕа¤Ёа¤•аҐ‹а¤‚ а¤Єа¤° TrustNode а¤¬а¤Ёа¤ѕа¤® а¤…а¤—аҐЌа¤°а¤ЈаҐЂ а¤µаҐ€а¤¶аҐЌа¤µа¤їа¤• а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤ёа¤®а¤ѕа¤§а¤ѕа¤ЁаҐ‹а¤‚ а¤•а¤ѕ а¤Ёа¤їа¤·аҐЌа¤Єа¤•аҐЌа¤· а¤¤аҐЃа¤Іа¤Ёа¤ѕа¤¤аҐЌа¤®а¤• а¤µа¤їа¤¶аҐЌа¤ІаҐ‡а¤·а¤ЈаҐ¤",
    ar: "ШЄШ­Щ„ЩЉЩ„ Щ…Щ‚Ш§Ш±Щ† Щ…Щ€Ш¶Щ€Ш№ЩЉ ШЁЩЉЩ† TrustNode Щ€Ш­Щ„Щ€Щ„ Ш§Щ„ШЈЩ…Ш§Щ† Ш§Щ„Ш№Ш§Щ„Щ…ЩЉШ© Ш§Щ„Ш±Ш§Ш¦ШЇШ© Ш№ШЁШ± Ш§Щ„Щ…Ш№Ш§ЩЉЩЉШ± Ш§Щ„ШЈШіШ§ШіЩЉШ©.",
    pt: "Uma anГЎlise comparativa objetiva do TrustNode versus as principais soluГ§Гµes globais de seguranГ§a.",
    fr: "Une analyse comparative objective de TrustNode face aux principales solutions de sГ©curitГ© mondiales.",
    de: "Eine objektive vergleichende Analyse von TrustNode gegenГјber fГјhrenden globalen SicherheitslГ¶sungen.",
    ja: "дё»и¦ЃгЃЄгѓ‘гѓ©гѓЎгѓјг‚їгЃ«еџєгЃҐгЃЏгЂЃTrustNodeгЃЁдё–з•ЊгЃ®дё»и¦Ѓг‚»г‚­гѓҐгѓЄгѓ†г‚Јг‚ЅгѓЄгѓҐгѓјг‚·гѓ§гѓігЃ®е®ўи¦ізљ„жЇ”ијѓе€†жћђгЂ‚",
  },
  download: {
    ru: "РЎРєР°С‡Р°Р№С‚Рµ TrustNode Р±РµСЃРїР»Р°С‚РЅРѕ РёР· RuStore РёР»Рё СЃ GitHub Рё Р·Р°С‰РёС‚РёС‚Рµ СЃРІРѕР№ СЃРјР°СЂС‚С„РѕРЅ РѕС‚ РјРѕС€РµРЅРЅРёРєРѕРІ Рё СЃРїР°РјР°.",
    en: "Download TrustNode for free from RuStore or GitHub and protect your smartphone from scammers and spam.",
    es: "Descargue TrustNode gratis desde RuStore o GitHub y proteja su smartphone de estafadores y spam.",
    zh: "д»Ћ RuStore ж€– GitHub е…Ќиґ№дё‹иЅЅ TrustNodeпјЊдїќжЉ¤ж‚Ёзљ„ж™єиѓЅж‰‹жњєе…ЌеЏ—иЇ€йЄ—е’ЊећѓењѕдїЎжЃЇйЄљж‰°гЂ‚",
    tr: "TrustNode'u RuStore veya GitHub'dan Гјcretsiz indirin ve akД±llД± telefonunuzu dolandД±rД±cД±lardan ve spam'lerden koruyun.",
    hi: "RuStore а¤Їа¤ѕ GitHub а¤ёаҐ‡ TrustNode а¤®аҐЃа¤«аҐЌа¤¤ а¤®аҐ‡а¤‚ а¤Ўа¤ѕа¤‰а¤Ёа¤ІаҐ‹а¤Ў а¤•а¤°аҐ‡а¤‚ а¤”а¤° а¤…а¤Єа¤ЁаҐ‡ а¤ёаҐЌа¤®а¤ѕа¤°аҐЌа¤џа¤«аҐ‹а¤Ё а¤•аҐ‹ а¤ёаҐЌа¤•аҐ€а¤®а¤°аҐЌа¤ё а¤”а¤° а¤ёаҐЌа¤ЄаҐ€а¤® а¤ёаҐ‡ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤°а¤–аҐ‡а¤‚аҐ¤",
    ar: "Ш­Щ…Щ‘Щ„ TrustNode Щ…Ш¬Ш§Щ†Ш§Щ‹ Щ…Щ† RuStore ШЈЩ€ GitHub Щ€Ш§Ш­Щ…Щђ Щ‡Ш§ШЄЩЃЩѓ Ш§Щ„Ш°ЩѓЩЉ Щ…Щ† Ш§Щ„Щ…Ш­ШЄШ§Щ„ЩЉЩ† Щ€Ш§Щ„Ш±ШіШ§Ш¦Щ„ Ш§Щ„Щ…ШІШ№Ш¬Ш©.",
    pt: "Baixe o TrustNode gratuitamente na RuStore ou no GitHub e proteja seu smartphone contra golpes e spam.",
    fr: "TГ©lГ©chargez TrustNode gratuitement depuis RuStore ou GitHub et protГ©gez votre smartphone des arnaques et du spam.",
    de: "Laden Sie TrustNode kostenlos von RuStore oder GitHub herunter und schГјtzen Sie Ihr Smartphone vor BetrГјgern und Spam.",
    ja: "RuStoreгЃѕгЃџгЃЇGitHubгЃ‹г‚‰TrustNodeг‚’з„Ўж–™гЃ§гѓЂг‚¦гѓігѓ­гѓјгѓ‰гЃ—гЃ¦гЂЃи©ђж¬єг‚„г‚№гѓ‘гѓ гЃ‹г‚‰г‚№гѓћгѓјгѓ€гѓ•г‚©гѓіг‚’е®€г‚ЉгЃѕгЃ—г‚‡гЃ†гЂ‚",
  },
  news: {
    ru: "РџРѕСЃР»РµРґРЅРёРµ РїСѓР±Р»РёРєР°С†РёРё РєРѕРјР°РЅРґС‹ TrustNode РёР· Telegram Рё VK: РѕР±РЅРѕРІР»РµРЅРёСЏ СЂР°Р·СЂР°Р±РѕС‚РєРё Рё Р°РЅРѕРЅСЃС‹.",
    en: "Latest posts from the TrustNode team on Telegram and VK: development updates and announcements.",
    es: "Гљltimas publicaciones del equipo TrustNode en Telegram y VK: actualizaciones de desarrollo y anuncios.",
    zh: "TrustNode е›ўйџењЁ Telegram е’Њ VK зљ„жњЂж–°еЏ‘еёѓпјљејЂеЏ‘еЉЁжЂЃдёЋе…¬е‘ЉгЂ‚",
    tr: "TrustNode ekibinin Telegram ve VK'daki son gГ¶nderileri: geliЕџtirme gГјncellemeleri ve duyurular.",
    hi: "Telegram а¤”а¤° VK а¤Єа¤° TrustNode а¤џаҐЂа¤® а¤•аҐ‡ а¤Ёа¤µаҐЂа¤Ёа¤¤а¤® а¤ЄаҐ‹а¤ёаҐЌа¤џ: а¤µа¤їа¤•а¤ѕа¤ё а¤…а¤Єа¤ЎаҐ‡а¤џ а¤”а¤° а¤аҐ‹а¤·а¤Ја¤ѕа¤Џа¤ЃаҐ¤",
    ar: "ШЈШ­ШЇШ« Щ…Щ†ШґЩ€Ш±Ш§ШЄ ЩЃШ±ЩЉЩ‚ TrustNode Ш№Щ„Щ‰ Telegram Щ€ VK: ШЄШ­ШЇЩЉШ«Ш§ШЄ Ш§Щ„ШЄШ·Щ€ЩЉШ± Щ€Ш§Щ„ШҐШ№Щ„Ш§Щ†Ш§ШЄ.",
    pt: "PublicaГ§Гµes mais recentes da equipe TrustNode no Telegram e VK: atualizaГ§Гµes de desenvolvimento e anГєncios.",
    fr: "DerniГЁres publications de l'Г©quipe TrustNode sur Telegram et VK : mises Г  jour de dГ©veloppement et annonces.",
    de: "Neueste BeitrГ¤ge des TrustNode-Teams auf Telegram und VK: Entwicklungs-Updates und AnkГјndigungen.",
    ja: "Telegram гЃЁ VK гЃ§гЃ® TrustNode гѓЃгѓјгѓ гЃ®жњЂж–°жЉ•зЁїпјљй–‹з™єжѓ…е ±гЃЁгЃЉзџҐг‚‰гЃ›гЂ‚",
  },
};

const PAGE_CTA: Record<string, LangDict> = {
  home: {
    ru: "РћС‚РєСЂС‹С‚СЊ РіР»Р°РІРЅСѓСЋ в†’", en: "Open Home в†’", es: "Abrir inicio в†’", zh: "ж‰“ејЂй¦–йЎµ в†’", tr: "Ana SayfayД± AГ§ в†’",
    hi: "а¤®аҐЃа¤–аҐЌа¤Ї а¤–аҐ‹а¤ІаҐ‡а¤‚ в†’", ar: "Ш§ЩЃШЄШ­ Ш§Щ„Ш±Ш¦ЩЉШіЩЉШ© в†’", pt: "Abrir InГ­cio в†’", fr: "Ouvrir l'accueil в†’", de: "Startseite Г¶ffnen в†’", ja: "гѓ›гѓјгѓ г‚’й–‹гЃЏ в†’",
  },
  "how-it-works": {
    ru: "РР·СѓС‡РёС‚СЊ С‚РµС…РЅРѕР»РѕРіРёРё в†’", en: "Explore Technology в†’", es: "Explorar tecnologГ­a в†’", zh: "дє†и§ЈжЉЂжњЇ в†’", tr: "Teknolojiyi KeЕџfet в†’",
    hi: "а¤¤а¤•а¤ЁаҐЂа¤• а¤¦аҐ‡а¤–аҐ‡а¤‚ в†’", ar: "Ш§ШіШЄЩѓШґЩЃ Ш§Щ„ШЄЩ‚Щ†ЩЉШ© в†’", pt: "Explorar tecnologia в†’", fr: "Explorer la technologie в†’", de: "Technologie entdecken в†’", ja: "жЉЂиЎ“г‚’жЋўг‚‹ в†’",
  },
  tech: {
    ru: "РџРµСЂРµР№С‚Рё Рє Р·Р°С‰РёС‚Рµ в†’", en: "View Security в†’", es: "Ver seguridad в†’", zh: "жџҐзњ‹е®‰е…Ё в†’", tr: "GГјvenliДџi GГ¶r в†’",
    hi: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤¦аҐ‡а¤–аҐ‡а¤‚ в†’", ar: "Ш№Ш±Ш¶ Ш§Щ„ШЈЩ…Ш§Щ† в†’", pt: "Ver seguranГ§a в†’", fr: "Voir la sГ©curitГ© в†’", de: "Sicherheit ansehen в†’", ja: "г‚»г‚­гѓҐгѓЄгѓ†г‚Јг‚’и¦‹г‚‹ в†’",
  },
  roadmap: {
    ru: "РЎРјРѕС‚СЂРµС‚СЊ Roadmap в†’", en: "View Roadmap в†’", es: "Ver hoja de ruta в†’", zh: "жџҐзњ‹и·Їзєїе›ѕ в†’", tr: "Yol HaritasД±nД± GГ¶r в†’",
    hi: "а¤°аҐ‹а¤Ўа¤®аҐ€а¤Є а¤¦аҐ‡а¤–аҐ‡а¤‚ в†’", ar: "Ш№Ш±Ш¶ Ш®Ш§Ш±Ш·Ш© Ш§Щ„Ш·Ш±ЩЉЩ‚ в†’", pt: "Ver roteiro в†’", fr: "Voir la feuille de route в†’", de: "Roadmap ansehen в†’", ja: "гѓ­гѓјгѓ‰гѓћгѓѓгѓ—г‚’и¦‹г‚‹ в†’",
  },
  about: {
    ru: "Рћ РїСЂРѕРµРєС‚Рµ Рё РєРѕРјР°РЅРґРµ в†’", en: "About Us & Team в†’", es: "Sobre nosotros y equipo в†’", zh: "е…ідєЋж€‘д»¬дёЋе›ўйџ в†’", tr: "HakkД±mД±zda ve Ekip в†’",
    hi: "а¤№а¤®а¤ѕа¤°аҐ‡ а¤¬а¤ѕа¤°аҐ‡ а¤®аҐ‡а¤‚ а¤”а¤° а¤џаҐЂа¤® в†’", ar: "Щ…Щ† Щ†Ш­Щ† Щ€Ш§Щ„ЩЃШ±ЩЉЩ‚ в†’", pt: "Sobre nГіs e equipe в†’", fr: "ГЂ propos et Г©quipe в†’", de: "Гњber uns & Team в†’", ja: "з§ЃгЃџгЃЎгЃЁгѓЃгѓјгѓ гЃ«гЃ¤гЃ„гЃ¦ в†’",
  },
  comparison: {
    ru: "РћС‚РєСЂС‹С‚СЊ С‚Р°Р±Р»РёС†Сѓ СЃСЂР°РІРЅРµРЅРёСЏ в†’", en: "Open Comparison в†’", es: "Abrir comparaciГіn в†’", zh: "ж‰“ејЂеЇ№жЇ” в†’", tr: "KarЕџД±laЕџtД±rmayД± AГ§ в†’",
    hi: "а¤¤аҐЃа¤Іа¤Ёа¤ѕ а¤–аҐ‹а¤ІаҐ‡а¤‚ в†’", ar: "Ш§ЩЃШЄШ­ Ш§Щ„Щ…Щ‚Ш§Ш±Щ†Ш© в†’", pt: "Abrir comparaГ§ГЈo в†’", fr: "Ouvrir la comparaison в†’", de: "Vergleich Г¶ffnen в†’", ja: "жЇ”ијѓг‚’й–‹гЃЏ в†’",
  },
  download: {
    ru: "Р’С‹Р±СЂР°С‚СЊ РїР»Р°С‚С„РѕСЂРјСѓ", en: "Choose Platform", es: "Elegir plataforma", zh: "йЂ‰ж‹©е№іеЏ°", tr: "Platform SeГ§",
    hi: "а¤ЄаҐЌа¤ІаҐ‡а¤џа¤«а¤јаҐ‰а¤°аҐЌа¤® а¤љаҐЃа¤ЁаҐ‡а¤‚", ar: "Ш§Ш®ШЄШ± Ш§Щ„Щ…Щ†ШµШ©", pt: "Escolher plataforma", fr: "Choisir la plateforme", de: "Plattform wГ¤hlen", ja: "гѓ—гѓ©гѓѓгѓ€гѓ•г‚©гѓјгѓ г‚’йЃёжЉћ",
  },
  news: {
    ru: "Р§РёС‚Р°С‚СЊ РЅРѕРІРѕСЃС‚Рё в†’", en: "Read News в†’", es: "Leer noticias в†’", zh: "й…иЇ»ж–°й—» в†’", tr: "Haberleri Oku в†’",
    hi: "а¤ёа¤®а¤ѕа¤ља¤ѕа¤° а¤Єа¤ўа¤јаҐ‡а¤‚ в†’", ar: "Ш§Щ‚Ш±ШЈ Ш§Щ„ШЈШ®ШЁШ§Ш± в†’", pt: "Ler notГ­cias в†’", fr: "Lire les actualitГ©s в†’", de: "Neuigkeiten lesen в†’", ja: "гѓ‹гѓҐгѓјг‚№г‚’иЄ­г‚Ђ в†’",
  },
};

export default function ExplorePagesSection() {
  const { t, language } = useTranslation();
  const { activePage, navigateTo } = useNavigation();
  const visiblePages = HEADER_PAGES.filter((p) => p.id !== activePage);
  const gridPages = visiblePages.filter((p) => p.id !== "download");
  const downloadPage = visiblePages.find((p) => p.id === "download");

  const renderCard = (page: (typeof HEADER_PAGES)[number], extraClass = "") => {
    const Icon = PAGE_ICONS[page.id];
    const badge = PAGE_BADGES[page.id]?.[language] || "";
    const desc = PAGE_DESCRIPTIONS[page.id]?.[language] || "";
    const cta = PAGE_CTA[page.id]?.[language] || "";

    return (
      <div
        key={page.id}
        onClick={() => navigateTo(page.id)}
        className={`group relative flex flex-col justify-between p-6 sm:p-8 rounded-md border border-[#3C404A]/50 shadow-[0_4px_30px_rgba(0,0,0,0.6)] bg-[#12141A] hover:border-[#3B82F6]/55 transition-all duration-300 cursor-pointer ${
          page.id === "how-it-works"
            ? "border-[#3B82F6]/30 shadow-[0_4px_35px_rgba(59,130,246,0.08)]"
            : ""
        } ${extraClass}`}
        id={`explore-${page.id}-card`}
      >
        <div className="absolute -inset-px rounded-md bg-gradient-to-b from-[#3B82F6]/10 to-transparent pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="w-11 h-11 rounded-md bg-[#0A0A0B]/80 border border-[#3B82F6]/25 flex items-center justify-center text-[#3B82F6] group-hover:shadow-glow-lg transition-all">
              {Icon && <Icon className="w-5 h-5" />}
            </div>
            <span className="font-mono text-xs tracking-widest text-[#3B82F6] font-bold bg-[#3B82F6]/5 px-3 py-1.5 rounded border border-[#3B82F6]/15">
              {badge}
            </span>
          </div>

          <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5F5F0] group-hover:text-[#3B82F6] transition-colors mb-3">
            {t.pageNames[page.labelKey]}
          </h3>
          <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
            {desc}
          </p>
        </div>

        <span className="inline-flex justify-center w-full font-mono text-sm font-bold text-[#3B82F6] group-hover:text-white transition-all">
          {cta}
        </span>
      </div>
    );
  };

  return (
    <section 
      className="relative w-full py-16 sm:py-20 px-4 overflow-hidden border-t border-[#3C404A]/35 bg-[#0A0A0B] select-none"
      id="explore-portal-section"
    >
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#3B82F6]/5 filter blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#3B82F6]/5 filter blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto flex flex-col items-center">
        <div className="text-center max-w-2xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0A0B]/70 border border-[#3B82F6]/30 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-[0.15em] text-[#3B82F6]">
              EXPLORE PROTOCOL PORTAL
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#F5F5F0] tracking-tight mb-4">
            {t.explore.title}
          </h2>
          <p className="font-sans text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            {t.explore.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          {gridPages.map((page) => renderCard(page))}
        </div>

        {downloadPage && (
          <div className="mt-6 w-full max-w-5xl mx-auto flex justify-center">
            {renderCard(downloadPage, "w-full sm:max-w-sm")}
          </div>
        )}
      </div>
    </section>
  );
}
