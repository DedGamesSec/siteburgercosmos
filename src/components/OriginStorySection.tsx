import React, { useRef } from "react";
import { GraduationCap, Award, Compass, Heart, Code2 } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "motion/react";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageCode } from "../i18n/languages";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";

const TITLE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "РСЃС‚РѕСЂРёСЏ РїСЂРѕРµРєС‚Р°",
  en: "Project Legacy",
  es: "Historia del Proyecto",
  zh: "йЎ№з›®еЋ†зЁ‹дёЋиѓЊж™Ї",
  hi: "а¤Єа¤°а¤їа¤ЇаҐ‹а¤ња¤Ёа¤ѕ а¤•а¤ѕ а¤‡а¤¤а¤їа¤№а¤ѕа¤ё",
  ar: "ШЄШ§Ш±ЩЉШ® Ш§Щ„Щ…ШґШ±Щ€Ш№",
  pt: "HistГіria do Projeto",
  fr: "Histoire du Projet",
  de: "Projektgeschichte",
  ja: "гѓ—гѓ­г‚ёг‚§г‚Їгѓ€гЃ®ж­©гЃї"
};

const SUBTITLE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "РћС‚ РґРёРїР»РѕРјРЅС‹С… РёСЃСЃР»РµРґРѕРІР°РЅРёР№ СЃС‚СѓРґРµРЅС‚Р°-РєРёР±РµСЂР±РµР·РѕРїР°СЃРЅРёРєР° РґРѕ РїР°С‚РµРЅС‚РѕРІ Р¤РРџРЎ Рё С„РµРґРµСЂР°Р»СЊРЅРѕРіРѕ РїСЂРёР·РЅР°РЅРёСЏ",
  en: "From a cybersec student's research project to FIPS patents and nationwide recognition",
  es: "Desde las investigaciones de tesis de un estudiante de ciberseguridad hasta patentes FIPS y reconocimiento federal",
  zh: "д»ЋзЅ‘з»ње®‰е…Ёдё“дёље­¦з”џзљ„жЇ•дёљи®ѕи®ЎпјЊе€°иЌЈиЋ·е›Ѕе®¶дё“е€©дёЋиЃ”й‚¦зє§з§‘жЉЂз«ћиµ›и®¤еЏЇзљ„жј”иї›еЋ†зЁ‹",
  hi: "а¤Џа¤• а¤ёа¤ѕа¤‡а¤¬а¤° а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤›а¤ѕа¤¤аҐЌа¤° а¤•аҐ‡ а¤¶аҐ‹а¤§ а¤Єа¤¤аҐЌа¤° а¤ёаҐ‡ а¤ІаҐ‡а¤•а¤° а¤ЄаҐ‡а¤џаҐ‡а¤‚а¤џ а¤”а¤° а¤°а¤ѕа¤·аҐЌа¤џаҐЌа¤°аҐЂа¤Ї а¤ёаҐЌа¤¤а¤° а¤Єа¤° а¤®а¤ѕа¤ЁаҐЌа¤Їа¤¤а¤ѕ а¤ЄаҐЌа¤°а¤ѕа¤ЄаҐЌа¤¤ а¤•а¤°а¤ЁаҐ‡ а¤¤а¤• а¤•а¤ѕ а¤ёа¤«а¤°",
  ar: "Щ…Щ† Ш§Щ„ШЈШЁШ­Ш§Ш« Ш§Щ„ШЈЩѓШ§ШЇЩЉЩ…ЩЉШ© Щ„Ш·Ш§Щ„ШЁ ЩЃЩЉ Ш§Щ„ШЈЩ…Щ† Ш§Щ„ШіЩЉШЁШ±Ш§Щ†ЩЉ ШҐЩ„Щ‰ ШЁШ±Ш§ШЎШ§ШЄ Ш§Щ„Ш§Ш®ШЄШ±Ш§Ш№ Щ€Ш§Щ„Ш§Ш№ШЄШ±Ш§ЩЃ Ш§Щ„Ш§ШЄШ­Ш§ШЇЩЉ",
  pt: "Das pesquisas de conclusГЈo de curso de um estudante de seguranГ§a cibernГ©tica a patentes oficiais e reconhecimento federal",
  fr: "Des recherches universitaires d'un Г©tudiant en cybersГ©curitГ© aux brevets officiels et Г  la reconnaissance nationale",
  de: "Von den Abschlussarbeiten eines Cybersicherheitsstudenten bis hin zu Patenten und nationaler Anerkennung",
  ja: "дёЂдєєгЃ®г‚µг‚¤гѓђгѓјг‚»г‚­гѓҐгѓЄгѓ†г‚Је­¦з”џгЃ®еЌ’жҐ­з ”з©¶гЃ‹г‚‰е§‹гЃѕг‚ЉгЂЃз‰№иЁ±еЏ–еѕ—г‚„е…Ёе›Ѕзљ„гЃЄиЄЌе®љгЃ«и‡іг‚‹гЃѕгЃ§гЃ®и»Њи·Ў"
};

const BADGE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "РРЎРўРћР РРЇ Р РљРћРњРђРќР”Рђ",
  en: "LEGACY & CREDENTIALS",
  es: "HISTORIA Y EQUIPO",
  zh: "еЋ†еЏІдёЋе›ўйџ",
  hi: "а¤‡а¤¤а¤їа¤№а¤ѕа¤ё а¤”а¤° а¤џаҐЂа¤®",
  ar: "Ш§Щ„ШЄШ§Ш±ЩЉШ® Щ€Ш§Щ„ЩЃШ±ЩЉЩ‚",
  pt: "HISTГ“RIA E EQUIPE",
  fr: "HISTOIRE ET Г‰QUIPE",
  de: "GESCHICHTE UND TEAM",
  ja: "ж­©гЃїгЃЁй–‹з™єдЅ“е€¶"
};

const TIMELINE_BY_LANG: Partial<Record<LanguageCode, Array<{ badge: string; title: string; desc: string }>>> = {
  ru: [
    {
      badge: "Р“Р‘РџРћРЈ Р§Р Рў // РљР‘-284",
      title: "РќР°СѓС‡РЅС‹Рµ РёСЃС‚РѕРєРё Рё СЃРїРµС†РёР°Р»РёР·Р°С†РёСЏ",
      desc: "РџСЂРѕРµРєС‚ Р·Р°СЂРѕРґРёР»СЃСЏ РІ СЃС‚РµРЅР°С… Р§РµР»СЏР±РёРЅСЃРєРѕРіРѕ СЂР°РґРёРѕС‚РµС…РЅРёС‡РµСЃРєРѕРіРѕ С‚РµС…РЅРёРєСѓРјР° РІ СЂР°РјРєР°С… СѓС‡РµР±РЅРѕР№ РіСЂСѓРїРїС‹ РљР‘-284 (РЎРїРµС†РёР°Р»СЊРЅРѕСЃС‚СЊ 10.02.05 вЂ” В«РРЅС„РѕСЂРјР°С†РёРѕРЅРЅР°СЏ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°РЅРЅС‹С… СЃРёСЃС‚РµРјВ») РїРѕРґ СЂСѓРєРѕРІРѕРґСЃС‚РІРѕРј РЅР°СѓС‡РЅРѕРіРѕ СЂСѓРєРѕРІРѕРґРёС‚РµР»СЏ РњРѕСЂРѕР·РєРѕРІРѕР№ РќР°С‚Р°Р»СЊРё РђРЅР°С‚РѕР»СЊРµРІРЅС‹."
    },
    {
      badge: "РќРР  // I РњР•РЎРўРћ",
      title: "РўСЂРёСѓРјС„ РЅР° СЂРµРіРёРѕРЅР°Р»СЊРЅРѕРј РќРР ",
      desc: "РљРѕРјРїР»РµРєСЃРЅР°СЏ СЂР°Р±РѕС‚Р° Рё РёРЅРЅРѕРІР°С†РёРѕРЅРЅС‹Р№ Р°Р»РіРѕСЂРёС‚Рј TrustNode РїСЂРёРЅРµСЃР»Рё РїСЂРѕРµРєС‚Сѓ I РњР•РЎРўРћ РЅР° РѕР±Р»Р°СЃС‚РЅРѕРј РЅР°СѓС‡РЅРѕ-РёСЃСЃР»РµРґРѕРІР°С‚РµР»СЊСЃРєРѕРј РєРѕРЅРєСѓСЂСЃРµ (РќРР ) РІ СЃРµРєС†РёРё В«РРЅС„РѕСЂРјР°С†РёРѕРЅРЅС‹Рµ С‚РµС…РЅРѕР»РѕРіРёРёВ»."
    },
    {
      badge: "РњРћРЎРљР’Рђ // РЎР•РќРўРЇР‘Р Р¬ 2026",
      title: "Р’С‹С…РѕРґ РЅР° С„РµРґРµСЂР°Р»СЊРЅС‹Р№ С„РёРЅР°Р»",
      desc: "РџРѕСЃР»Рµ СѓСЃРїРµС…Р° РЅР° СЂРµРіРёРѕРЅР°Р»СЊРЅРѕРј СѓСЂРѕРІРЅРµ РїСЂРѕРµРєС‚ Р±С‹Р» РѕС‚РѕР±СЂР°РЅ РґР»СЏ РїСЂРµР·РµРЅС‚Р°С†РёРё РЅР° РїСЂРµСЃС‚РёР¶РЅРѕРј СЂРµРіРёРѕРЅР°Р»СЊРЅРѕРј РЅР°СѓС‡РЅРѕ-РёСЃСЃР»РµРґРѕРІР°С‚РµР»СЊСЃРєРѕРј С„РёРЅР°Р»Рµ РќРР  РІ РњРѕСЃРєРІРµ РІ СЃРµРЅС‚СЏР±СЂРµ 2026 РіРѕРґР°, РіРґРµ Р±СѓРґСѓС‚ РїСЂРѕРґРµРјРѕРЅСЃС‚СЂРёСЂРѕРІР°РЅС‹ РµРіРѕ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё РІ СЃС„РµСЂРµ Р·Р°С‰РёС‚С‹ РѕС‚ РјРѕС€РµРЅРЅРёС‡РµСЃС‚РІР°."
    },
    {
      badge: "РђР РҐРРўР•РљРўРћР  + AI-РџРћР”Р РЇР”Р§РРљР",
      title: "РќРѕРІР°СЏ РІРµС…Р°: Р Р°Р·СЂР°Р±РѕС‚РєР° Р±СѓРґСѓС‰РµРіРѕ",
      desc: "Р Р°Р·СЂР°Р±РѕС‚РєР° Р°СЂС…РёС‚РµРєС‚СѓСЂС‹ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё Рё РёРЅС‚РµРіСЂР°С†РёСЏ ONNX-РјРѕРґРµР»РµР№ TrustNode РІС‹РїРѕР»РЅРµРЅР° РїРѕ РїРµСЂРµРґРѕРІРѕР№ РјРµС‚РѕРґРѕР»РѕРіРёРё В«РђСЂС…РёС‚РµРєС‚РѕСЂ + AI-РїРѕРґСЂСЏРґС‡РёРєРёВ», РіРґРµ РіРµРЅРµСЂР°С†РёСЏ РєРѕРґР° (Kotlin/C++) Р±С‹Р»Р° РґРµР»РµРіРёСЂРѕРІР°РЅР° СЃРїРµС†РёР°Р»РёР·РёСЂРѕРІР°РЅРЅС‹Рј РР-Р°РіРµРЅС‚Р°Рј."
    }
  ],
  en: [
    {
      badge: "COLLEGE RESEARCH",
      title: "Academic Foundations",
      desc: "Developed at the Chelyabinsk Radiotechnical College under educational group KB-284 (Specialty 10.02.05 вЂ” Information Security of Automated Systems), mentored by scientific advisor Natalia Anatolyevna Morozkova."
    },
    {
      badge: "REGIONAL VICTORY",
      title: "Regional Science Triumph",
      desc: "The comprehensive semantic framework of TrustNode won 1st place in the regional scientific and research competition (IT section) for its novel approach to real-time mobile fraud mitigation."
    },
    {
      badge: "FEDERAL SUPERFINAL",
      title: "National Superfinal Moscow (Upcoming)",
      desc: "Following the regional triumph, the project has been selected for presentation at the prestigious federal scientific research superfinal in Moscow in September 2026 to demonstrate its real-time defense capabilities."
    },
    {
      badge: "AI-DRIVEN WORKFLOW",
      title: "Architect + AI Agents paradigm",
      desc: "The security architecture and patented TrustNode algorithms are developed under the 'Architect + AI Agents' framework, leveraging specialized AI code generators to accelerate production and deployment."
    }
  ],
  es: [
    {
      badge: "CRTC // KB-284",
      title: "Bases AcadГ©micas y EspecializaciГіn",
      desc: "El proyecto naciГі en la Escuela RadiotГ©cnica de Chelyabinsk dentro del grupo KB-284 (Especialidad 10.02.05 вЂ” Seguridad de la InformaciГіn en Sistemas Automatizados), bajo la direcciГіn cientГ­fica de Natalia Anatolyevna Morozkova."
    },
    {
      badge: "INVESTIGACIГ“N // 1.ER LUGAR",
      title: "Triunfo en el concurso regional",
      desc: "El trabajo integral y el innovador algoritmo de TrustNode le otorgaron al proyecto el 1.er lugar en el concurso regional de investigaciГіn cientГ­fica en la secciГіn de 'TecnologГ­as de la InformaciГіn'."
    },
    {
      badge: "MOSCГљ // SEPTIEMBRE 2026",
      title: "Pase a la sГєper final federal",
      desc: "Como resultado de la victoria, la escuela financiГі por completo el viaje del autor a MoscГє para participar en la sГєper final nacional de proyectos de investigaciГіn en septiembre de 2026."
    },
    {
      badge: "ARQUITECTO + AGENTES IA",
      title: "Paradigma de desarrollo del futuro",
      desc: "DiseГ±ado por un Гєnico desarrollador bajo la metodologГ­a 'Arquitecto + Agentes de IA'. La arquitectura de seguridad y los algoritmos son del autor, mientras que la codificaciГіn en Kotlin/C++ se delega en la IA."
    }
  ],
  zh: [
    {
      badge: "е­¦й™ўз ”з©¶ // KB-284",
      title: "е­¦жњЇеџєзЎЂдёЋдё“дёљйў†еџџ",
      desc: "иЇҐйЎ№з›®иЇћз”џдєЋиЅ¦й‡Њй›…е®ѕж–Їе…‹ж— зєїз”µжЉЂжњЇе­¦й™ўпјЊе±ћдєЋ KB-284 ж•™е­¦з»„пј€дё“дёљд»Јз Ѓ 10.02.05 вЂ”вЂ” и‡ЄеЉЁеЊ–зі»з»џдїЎжЃЇе®‰е…Ёпј‰пјЊз”±еЇјеё€ Natalia Anatolyevna Morozkova жЊ‡еЇјгЂ‚"
    },
    {
      badge: "з§‘з ”з«ћиµ› // з¬¬дёЂеђЌ",
      title: "еЊєеџџз§‘з ”з«ћиµ›дё­е¤єе† ",
      desc: "TrustNode зљ„з»јеђ€иЇ­д№‰жЎ†жћ¶е’Ње€›ж–°з®—жі•дЅїиЇҐйЎ№з›®ењЁеЊєеџџз§‘е­¦з ”з©¶з«ћиµ›пј€дїЎжЃЇжЉЂжњЇз»„пј‰дё­ж–©иЋ·з¬¬дёЂеђЌпјЊи‚Їе®љдє†е…¶ењЁе®ћж—¶йІж¬єиЇ€ж–№йќўзљ„ж€ђе°±гЂ‚"
    },
    {
      badge: "иЋ«ж–Їз§‘ // 2026е№ґ9жњ€",
      title: "ж™‹зє§е›Ѕе®¶зє§и¶…зє§жЂ»е†іиµ›",
      desc: "еџєдєЋењЁеЊєеџџз«ћиµ›дё­зљ„е¤єй­ЃпјЊе­¦й™ўе…Ёйўќиµ„еЉ©дЅњиЂ…е‰ЌеѕЂиЋ«ж–Їз§‘еЏ‚еЉ  2026 е№ґ 9 жњ€дёѕеЉћзљ„дє«жњ‰з››иЄ‰зљ„е…Ёе›Ѕз ”з©¶ж€ђжћњи¶…зє§жЂ»е†іиµ›гЂ‚"
    },
    {
      badge: "зі»з»џжћ¶жћ„её€ + AI ж™єиѓЅдЅ“",
      title: "е…Ёж–°й‡ЊзЁ‹зў‘пјљйќўеђ‘жњЄжќҐзљ„ејЂеЏ‘",
      desc: "иЇҐйЎ№з›®з”±з‹¬з«‹ејЂеЏ‘иЂ…й‡‡з”Ёе‰ЌжІїзљ„вЂњжћ¶жћ„её€ + AI ж™єиѓЅдЅ“вЂќжЁЎејЏи®ѕи®ЎпјљдЅњиЂ…жњ¬дєєж‹…д»»ж ёеїѓзі»з»џжћ¶жћ„её€дёЋз®—жі•и®ѕи®ЎиЂ…пјЊиЂЊд»Јз Ѓзј–е†™пј€Kotlin/C++пј‰е€™е§”ж‰з»™ AI еЉ©ж‰‹е®Њж€ђгЂ‚"
    }
  ],
  hi: [
    {
      badge: "а¤•аҐ‰а¤ІаҐ‡а¤њ а¤°а¤їа¤ёа¤°аҐЌа¤љ // KB-284",
      title: "а¤¶аҐ€а¤•аҐЌа¤·а¤Ја¤їа¤• а¤†а¤§а¤ѕа¤° а¤”а¤° а¤µа¤їа¤¶аҐ‡а¤·а¤њаҐЌа¤ћа¤¤а¤ѕ",
      desc: "а¤Їа¤№ а¤Єа¤°а¤їа¤ЇаҐ‹а¤ња¤Ёа¤ѕ а¤љаҐ‡а¤ІаҐЌа¤Їа¤ѕа¤¬а¤їа¤‚а¤ёаҐЌа¤• а¤°аҐ‡а¤Ўа¤їа¤ЇаҐ‹а¤џаҐ‡а¤•аҐЌа¤Ёа¤їа¤•а¤І а¤•аҐ‰а¤ІаҐ‡а¤њ а¤®аҐ‡а¤‚ а¤¶аҐ€а¤•аҐЌа¤·а¤їа¤• а¤ёа¤®аҐ‚а¤№ KB-284 (а¤µа¤їа¤¶аҐ‡а¤·а¤њаҐЌа¤ћа¤¤а¤ѕ 10.02.05 вЂ” а¤ёаҐЌа¤µа¤ља¤ѕа¤Іа¤їа¤¤ а¤ЄаҐЌа¤°а¤Ја¤ѕа¤Іа¤їа¤ЇаҐ‹а¤‚ а¤•аҐЂ а¤ёаҐ‚а¤ља¤Ёа¤ѕ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ) а¤•аҐ‡ а¤¤а¤№а¤¤ а¤µаҐ€а¤њаҐЌа¤ћа¤ѕа¤Ёа¤їа¤• а¤ёа¤Іа¤ѕа¤№а¤•а¤ѕа¤° а¤Ёа¤¤а¤ѕа¤Іа¤їа¤Їа¤ѕ а¤…а¤Ёа¤ѕа¤¤аҐ‹а¤ІаҐЂа¤µа¤Ёа¤ѕ а¤®аҐ‹а¤°аҐ‹а¤ња¤јаҐЌа¤•аҐ‹РІР° а¤•аҐ‡ а¤®а¤ѕа¤°аҐЌа¤—а¤¦а¤°аҐЌа¤¶а¤Ё а¤®аҐ‡а¤‚ а¤µа¤їа¤•а¤ёа¤їа¤¤ а¤•аҐЂ а¤—а¤€ а¤ҐаҐЂаҐ¤"
    },
    {
      badge: "а¤…а¤ЁаҐЃа¤ёа¤‚а¤§а¤ѕа¤Ё // а¤ЄаҐЌа¤°а¤Ґа¤® а¤ёаҐЌа¤Ґа¤ѕа¤Ё",
      title: "а¤•аҐЌа¤·аҐ‡а¤¤аҐЌа¤°аҐЂа¤Ї а¤…а¤ЁаҐЃа¤ёа¤‚а¤§а¤ѕа¤Ё а¤ЄаҐЌа¤°а¤¤а¤їа¤ЇаҐ‹а¤—а¤їа¤¤а¤ѕ а¤®аҐ‡а¤‚ а¤µа¤їа¤ња¤Ї",
      desc: "TrustNode а¤•аҐ‡ а¤µаҐЌа¤Їа¤ѕа¤Єа¤• а¤ёа¤їа¤®аҐ‡а¤‚а¤џа¤їа¤• а¤ўа¤ѕа¤‚а¤љаҐ‡ а¤”а¤° а¤…а¤­а¤їа¤Ёа¤µ а¤Џа¤ІаҐЌа¤—аҐ‹а¤°а¤їа¤¦а¤® а¤ЁаҐ‡ а¤†а¤€а¤џаҐЂ а¤…а¤ЁаҐЃа¤­а¤ѕа¤— а¤®аҐ‡а¤‚ а¤•аҐЌа¤·аҐ‡а¤¤аҐЌа¤°аҐЂа¤Ї а¤µаҐ€а¤њаҐЌа¤ћа¤ѕа¤Ёа¤їа¤• а¤”а¤° а¤…а¤ЁаҐЃа¤ёа¤‚а¤§а¤ѕа¤Ё а¤ЄаҐЌа¤°а¤¤а¤їа¤ЇаҐ‹а¤—а¤їа¤¤а¤ѕ а¤®аҐ‡а¤‚ а¤Єа¤°а¤їа¤ЇаҐ‹а¤ња¤Ёа¤ѕ а¤•аҐ‹ а¤Єа¤№а¤Іа¤ѕ а¤ёаҐЌа¤Ґа¤ѕа¤Ё а¤¦а¤їа¤Іа¤ѕа¤Їа¤ѕаҐ¤"
    },
    {
      badge: "а¤®а¤ѕа¤ёаҐЌа¤•аҐ‹ // а¤ёа¤їа¤¤а¤‚а¤¬а¤° 2026",
      title: "а¤°а¤ѕа¤·аҐЌа¤џаҐЌа¤°аҐЂа¤Ї а¤ёаҐЃа¤Єа¤°а¤«а¤ја¤ѕа¤‡а¤Ёа¤І а¤®аҐ‡а¤‚ а¤ЄаҐЌа¤°а¤µаҐ‡а¤¶",
      desc: "а¤•аҐЌа¤·аҐ‡а¤¤аҐЌа¤°аҐЂа¤Ї а¤њаҐЂа¤¤ а¤•аҐ‡ а¤†а¤§а¤ѕа¤° а¤Єа¤°, а¤•аҐ‰а¤ІаҐ‡а¤њ а¤ёа¤їа¤¤а¤‚а¤¬а¤° 2026 а¤®аҐ‡а¤‚ а¤№аҐ‹а¤ЁаҐ‡ а¤µа¤ѕа¤ІаҐ‡ а¤ЄаҐЌа¤°а¤¤а¤їа¤·аҐЌа¤ а¤їа¤¤ а¤°а¤ѕа¤·аҐЌа¤џаҐЌа¤°а¤µаҐЌа¤Їа¤ѕа¤ЄаҐЂ а¤…а¤ЁаҐЃа¤ёа¤‚а¤§а¤ѕа¤Ё а¤ёаҐЃа¤Єа¤°а¤«а¤ја¤ѕа¤‡а¤Ёа¤І а¤•аҐ‡ а¤Іа¤їа¤Џ а¤®а¤ѕа¤ёаҐЌа¤•аҐ‹ а¤•аҐЂ а¤Їа¤ѕа¤¤аҐЌа¤°а¤ѕ а¤•а¤ѕ а¤ЄаҐ‚а¤°а¤ѕ а¤–а¤°аҐЌа¤љ а¤‰а¤ а¤ѕ а¤°а¤№а¤ѕ а¤№аҐ€аҐ¤"
    },
    {
      badge: "а¤†а¤°аҐЌа¤•а¤їа¤џаҐ‡а¤•аҐЌа¤џ + а¤Џа¤†а¤€ а¤Џа¤њаҐ‡а¤‚а¤џ",
      title: "а¤Ёа¤Їа¤ѕ а¤®аҐЂа¤І а¤•а¤ѕ а¤Єа¤¤аҐЌа¤Ґа¤°: а¤­а¤µа¤їа¤·аҐЌа¤Ї а¤•а¤ѕ а¤µа¤їа¤•а¤ѕа¤ё",
      desc: "а¤Џа¤•а¤І а¤ЎаҐ‡а¤µа¤Іа¤Єа¤° а¤¦аҐЌа¤µа¤ѕа¤°а¤ѕ 'а¤†а¤°аҐЌа¤•а¤їа¤џаҐ‡а¤•аҐЌа¤џ + а¤Џа¤†а¤€ а¤Џа¤њаҐ‡а¤‚а¤џ' а¤Єа¤¦аҐЌа¤§а¤¤а¤ї а¤•а¤ѕ а¤‰а¤Єа¤ЇаҐ‹а¤— а¤•а¤°а¤•аҐ‡ а¤¬а¤Ёа¤ѕа¤Їа¤ѕ а¤—а¤Їа¤ѕаҐ¤ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤†а¤°аҐЌа¤•а¤їа¤џаҐ‡а¤•аҐЌа¤ља¤° а¤”а¤° а¤Џа¤ІаҐЌа¤—аҐ‹а¤°а¤їа¤¦а¤® а¤ІаҐ‡а¤–а¤• а¤¦аҐЌа¤µа¤ѕа¤°а¤ѕ а¤¬а¤Ёа¤ѕа¤Џ а¤—а¤Џ а¤№аҐ€а¤‚, а¤ња¤¬а¤•а¤ї а¤•аҐ‹а¤Ў а¤ІаҐ‡а¤–а¤Ё (Kotlin/C++) а¤Џа¤†а¤€ а¤Џа¤њаҐ‡а¤‚а¤џаҐ‹а¤‚ а¤•аҐ‹ а¤ёаҐЊа¤‚а¤Єа¤ѕ а¤—а¤Їа¤ѕ а¤№аҐ€аҐ¤"
    }
  ],
  ar: [
    {
      badge: "ШЈШЁШ­Ш§Ш« Ш§Щ„ЩѓЩ„ЩЉШ© // KB-284",
      title: "Ш§Щ„ШЈШіШі Ш§Щ„ШЈЩѓШ§ШЇЩЉЩ…ЩЉШ© Щ€Ш§Щ„ШЄШ®ШµШµ",
      desc: "Щ†ШґШЈ Ш§Щ„Щ…ШґШ±Щ€Ш№ ШЇШ§Ш®Щ„ ШЈШіЩ€Ш§Ш± ЩѓЩ„ЩЉШ© ШЄШґЩЉЩ„ЩЉШ§ШЁЩЉЩ†ШіЩѓ Щ„Щ„Щ‡Щ†ШЇШіШ© Ш§Щ„Щ„Ш§ШіЩ„ЩѓЩЉШ© ЩЃЩЉ Ш§Щ„Щ…Ш¬Щ…Щ€Ш№Ш© Ш§Щ„ШЄШ№Щ„ЩЉЩ…ЩЉШ© KB-284 (ШЄШ®ШµШµ 10.02.05 вЂ” ШЈЩ…Щ† Щ…Ш№Щ„Щ€Щ…Ш§ШЄ Ш§Щ„ШЈЩ†ШёЩ…Ш© Ш§Щ„ШўЩ„ЩЉШ©) ШЄШ­ШЄ ШҐШґШ±Ш§ЩЃ Ш§Щ„Щ…ШіШЄШґШ§Ш±Ш© Ш§Щ„Ш№Щ„Щ…ЩЉШ© Щ†Ш§ШЄШ§Щ„ЩЉШ§ ШЈЩ†Ш§ШЄЩ€Щ„ЩЉЩЃЩ†Ш§ Щ…Щ€Ш±Щ€ШІЩѓЩ€ЩЃШ§."
    },
    {
      badge: "Ш§Щ„ШЁШ­Ш« Ш§Щ„Ш№Щ„Щ…ЩЉ // Ш§Щ„Щ…Ш±ЩѓШІ Ш§Щ„ШЈЩ€Щ„",
      title: "Ш§Щ„Ш§Щ†ШЄШµШ§Ш± ЩЃЩЉ Ш§Щ„ШЁШ­Ш« Ш§Щ„Ш№Щ„Щ…ЩЉ Ш§Щ„ШҐЩ‚Щ„ЩЉЩ…ЩЉ",
      desc: "Ш­ШµШЇ Ш§Щ„ШҐШ·Ш§Ш± Ш§Щ„ШЇЩ„Ш§Щ„ЩЉ Ш§Щ„ШґШ§Щ…Щ„ Щ€Ш§Щ„Ш®Щ€Ш§Ш±ШІЩ…ЩЉШ© Ш§Щ„Щ…ШЁШЄЩѓШ±Ш© Щ„ЩЂ TrustNode Ш§Щ„Щ…Ш±ЩѓШІ Ш§Щ„ШЈЩ€Щ„ ЩЃЩЉ Ш§Щ„Щ…ШіШ§ШЁЩ‚Ш© Ш§Щ„Ш№Щ„Щ…ЩЉШ© Щ€Ш§Щ„ШЁШ­Ш«ЩЉШ© Ш§Щ„ШҐЩ‚Щ„ЩЉЩ…ЩЉШ© (Щ‚ШіЩ… ШЄЩѓЩ†Щ€Щ„Щ€Ш¬ЩЉШ§ Ш§Щ„Щ…Ш№Щ„Щ€Щ…Ш§ШЄ)."
    },
    {
      badge: "Щ…Щ€ШіЩѓЩ€ // ШіШЁШЄЩ…ШЁШ± 2026",
      title: "Ш§Щ„Щ€ШµЩ€Щ„ ШҐЩ„Щ‰ Ш§Щ„ШіЩ€ШЁШ± ЩЃШ§ЩЉЩ†Ш§Щ„ Ш§Щ„Ш§ШЄШ­Ш§ШЇЩЉ",
      desc: "ШЁЩ†Ш§ШЎЩ‹ Ш№Щ„Щ‰ Ш§Щ„Ш§Щ†ШЄШµШ§Ш± Ш§Щ„ШҐЩ‚Щ„ЩЉЩ…ЩЉ, Щ‚Ш§Щ…ШЄ Ш§Щ„ЩѓЩ„ЩЉШ© ШЁШЄЩ…Щ€ЩЉЩ„ Ш±Ш­Щ„Ш© Ш§Щ„Щ…Ш¤Щ„ЩЃ ШЁШ§Щ„ЩѓШ§Щ…Щ„ ШҐЩ„Щ‰ Щ…Щ€ШіЩѓЩ€ Щ„Щ„Щ…ШґШ§Ш±ЩѓШ© ЩЃЩЉ Ш§Щ„ШіЩ€ШЁШ± ЩЃШ§ЩЉЩ†Ш§Щ„ Ш§Щ„Щ€Ш·Щ†ЩЉ Ш§Щ„Щ…Ш±Щ…Щ€Щ‚ Щ„Щ„ШЈШЁШ­Ш§Ш« Ш§Щ„Ш№Щ„Щ…ЩЉШ© ЩЃЩЉ ШіШЁШЄЩ…ШЁШ± 2026."
    },
    {
      badge: "Ш§Щ„Щ…Щ‡Щ†ШЇШі Ш§Щ„Щ…Ш№Щ…Ш§Ш±ЩЉ + Щ€ЩѓЩ„Ш§ШЎ Ш§Щ„Ш°ЩѓШ§ШЎ Ш§Щ„Ш§ШµШ·Щ†Ш§Ш№ЩЉ",
      title: "Ш№ШµШ± Ш¬ШЇЩЉШЇ: ШЄШ·Щ€ЩЉШ± Ш§Щ„Щ…ШіШЄЩ‚ШЁЩ„",
      desc: "ШЄЩ… ШЄШµЩ…ЩЉЩ… Ш§Щ„Щ…ШґШ±Щ€Ш№ ШЁЩ€Ш§ШіШ·Ш© Щ…Ш·Щ€Ш± Щ…ШіШЄЩ‚Щ„ ШЁШ§ШіШЄШ®ШЇШ§Щ… Щ…Щ†Щ‡Ш¬ЩЉШ© 'Ш§Щ„Щ…Щ‡Щ†ШЇШі Ш§Щ„Щ…Ш№Щ…Ш§Ш±ЩЉ + Щ€ЩѓЩ„Ш§ШЎ Ш§Щ„Ш°ЩѓШ§ШЎ Ш§Щ„Ш§ШµШ·Щ†Ш§Ш№ЩЉ'. ШµЩ…Щ… Ш§Щ„Щ…Ш¤Щ„ЩЃ ШЁЩ†ЩЉШ© Ш§Щ„ШЈЩ…Щ† Щ€Ш®Щ€Ш§Ш±ШІЩ…ЩЉШ§ШЄ ШЁШ±Ш§ШЎШ§ШЄ Ш§Щ„Ш§Ш®ШЄШ±Ш§Ш№ ШЁЩ†ЩЃШіЩ‡ШЊ Щ€ШЄЩ… ШЄЩЃЩ€ЩЉШ¶ ЩѓШЄШ§ШЁШ© Ш§Щ„ШЈЩѓЩ€Ш§ШЇ (Kotlin/C++) Щ„Щ€ЩѓЩ„Ш§ШЎ Ш§Щ„Ш°ЩѓШ§ШЎ Ш§Щ„Ш§ШµШ·Щ†Ш§Ш№ЩЉ."
    }
  ],
  pt: [
    {
      badge: "CRTC // KB-284",
      title: "FundaГ§ГЈo AcadГЄmica e EspecializaГ§ГЈo",
      desc: "O projeto nasceu na Escola RadiotГ©cnica de Chelyabinsk no grupo KB-284 (EspecializaГ§ГЈo 10.02.05 вЂ” SeguranГ§a da InformaГ§ГЈo de Sistemas Automatizados), sob a orientaГ§ГЈo de Natalia Anatolyevna Morozkova."
    },
    {
      badge: "PESQUISA // 1Вє LUGAR",
      title: "Triunfo na pesquisa regional",
      desc: "A estrutura semГўntica integrada e o algoritmo inovador do TrustNode trouxeram ao projeto o 1Вє lugar no concurso regional de pesquisa cientГ­fica na seГ§ГЈo de 'Tecnologia da InformaГ§ГЈo'."
    },
    {
      badge: "MOSCOU // SETEMBRO 2026",
      title: "Acesso Г  superfinal federal",
      desc: "Devido Г  vitГіria regional, a escola financiou integralmente a viagem do autor a Moscou para participar da prestigiada superfinal de pesquisa nacional em setembro de 2026."
    },
    {
      badge: "ARQUITETO + AGENTES DE IA",
      title: "Novo paradigma de desenvolvimento",
      desc: "Criado por um desenvolvedor solo com o paradigma 'Arquiteto + Agentes de IA'. A arquitetura de seguranГ§a e os algoritmos sГЈo do autor, enquanto a codificaГ§ГЈo (Kotlin/C++) foi realizada por agentes de IA."
    }
  ],
  fr: [
    {
      badge: "RECHERCHE COLLГ€GE",
      title: "Fondations AcadГ©miques",
      desc: "DГ©veloppГ© au CollГЁge Radiotechnique de Chelyabinsk au sein du groupe d'Г©tudes KB-284 (SpГ©cialitГ© 10.02.05 вЂ” SГ©curitГ© de l'Information des SystГЁmes AutomatisГ©s), sous la direction de la conseillГЁre scientifique Natalia Anatolyevna Morozkova."
    },
    {
      badge: "VICTOIRE RГ‰GIONALE",
      title: "Triomphe Scientifique RГ©gional",
      desc: "Le cadre sГ©mantique global de TrustNode a remportГ© la 1ГЁre place du concours de recherche scientifique rГ©gional (section informatique) pour son approche novatrice de la lutte contre la fraude."
    },
    {
      badge: "SUPERFINALE FГ‰DГ‰RALE",
      title: "Superfinale Nationale Г  Moscou",
      desc: "Suite Г  ce triomphe, l'Г©tablissement finance intГ©gralement le voyage de l'auteur Г  Moscou pour participer Г  la prestigieuse superfinale nationale de recherche en septembre 2026."
    },
    {
      badge: "CONCEPTEUR + AGENTS IA",
      title: "Nouveau paradigme de dГ©veloppement",
      desc: "ConГ§u par un dГ©veloppeur solo selon la mГ©thodologie 'Concepteur + Agents IA' : l'auteur crГ©e l'architecture de sГ©curitГ© et les algorithmes, tandis que le codage (Kotlin/C++) est dГ©lГ©guГ© Г  des agents IA."
    }
  ],
  de: [
    {
      badge: "COLLEGE RESEARCH",
      title: "Akademische Grundlagen",
      desc: "Entwickelt am Radiotechnischen Kolleg Tscheljabinsk in der Studiengruppe KB-284 (Fachrichtung 10.02.05 вЂ” Informationssicherheit automatisierter Systeme) unter der wissenschaftlichen Leitung von Natalia Anna Morozkova."
    },
    {
      badge: "REGIONALER SIEG",
      title: "Regionaler Forschungserfolg",
      desc: "Das umfassende semantische Framework von TrustNode belegte den 1. Platz beim regionalen wissenschaftlichen Forschungswettbewerb in der Sektion Informationstechnologie."
    },
    {
      badge: "SUPERFINALE MOSKAU",
      title: "Bundesweites Superfinale",
      desc: "Aufgrund des regionalen Triumphs finanziert das Kolleg die Reise des Autors nach Moskau zum angesehenen bundesweiten Forschungs-Superfinale im September 2026 vollstГ¤ndig."
    },
    {
      badge: "ARCHITEKT + KI-AGENTEN",
      title: "Entwicklungsparadigma der Zukunft",
      desc: "Erstellt von einem Solo-Entwickler nach der Methode 'Architekt + KI-Agenten'. Die Sicherheitsarchitektur und Patentalgorithmen stammen vom Autor, wГ¤hrend die Codierung (Kotlin/C++) an KI-Agenten delegiert wurde."
    }
  ],
  ja: [
    {
      badge: "жЉЂиЎ“е°‚й–Ђе­¦ж Ўз ”з©¶ // KB-284",
      title: "е­¦иЎ“зљ„еџєз¤ЋгЃЁе°‚й–Ђе€†й‡Ћ",
      desc: "гѓЃг‚§гѓЄгѓЈгѓ“гѓіг‚№г‚Їз„Ўз·ље·Ґе­¦жЉЂиЎ“е°‚й–Ђе­¦ж ЎгЃ«гЃ¦гЂЃKB-284з ”з©¶г‚°гѓ«гѓјгѓ—пј€е°‚й–Ђе€†й‡Ћ 10.02.05 вЂ” гЂЊи‡Єе‹•еЊ–г‚·г‚№гѓ†гѓ жѓ…е ±г‚»г‚­гѓҐгѓЄгѓ†г‚ЈгЂЌпј‰гЃ®дёЂз’°гЃЁгЃ—гЃ¦гЂЃжЊ‡е°Ћж•™е®гѓЉг‚їгѓЄг‚ўгѓ»г‚ўгѓЉгѓ€гѓЄг‚ЁгѓґгѓЉгѓ»гѓўгѓ­г‚єг‚ігѓЇгЃ®жЊ‡е°ЋгЃ®г‚‚гЃЁгЃ§й–‹з™єгЃЊг‚№г‚їгѓјгѓ€гЃ—гЃѕгЃ—гЃџгЂ‚"
    },
    {
      badge: "е­¦иЎ“з ”з©¶ // з¬¬1дЅЌ",
      title: "ењ°еџџз ”з©¶г‚ігѓігѓ†г‚№гѓ€гЃ§гЃ®е„Єе‹ќ",
      desc: "TrustNodeгЃ®й«еє¦гЃЄг‚»гѓћгѓігѓ†г‚Јгѓѓг‚Їи§Јжћђгѓ•гѓ¬гѓјгѓ гѓЇгѓјг‚ЇгЃЁйќ©ж–°зљ„гЃЄг‚ўгѓ«г‚ґгѓЄг‚єгѓ гЃЇгЂЃењ°еџџгЃ®е­¦иЎ“з ”з©¶г‚ігѓігѓљгѓ†г‚Јг‚·гѓ§гѓігЃ®гЂЊжѓ…е ±жЉЂиЎ“гЂЌг‚»г‚Їг‚·гѓ§гѓігЃ§з¬¬1дЅЌг‚’зЌІеѕ—гЃ—гЃѕгЃ—гЃџгЂ‚"
    },
    {
      badge: "гѓўг‚№г‚ЇгѓЇ // 2026е№ґ9жњ€",
      title: "е…Ёе›Ѕг‚№гѓјгѓ‘гѓјгѓ•г‚Ўг‚¤гѓЉгѓ«йЂІе‡є",
      desc: "ењ°ж–№г‚ігѓігѓ†г‚№гѓ€гЃ§гЃ®ијќгЃ‹гЃ—гЃ„е„Єе‹ќг‚’еЏ—гЃ‘гЂЃе°‚й–Ђе­¦ж ЎгЃ®е…ЁйЎЌжЏґеЉ©гЃ«г‚€г‚ЉгЂЃ2026е№ґ9жњ€гЃ«гѓўг‚№г‚ЇгѓЇгЃ§й–‹е‚¬гЃ•г‚Њг‚‹жЁ©еЁЃгЃ‚г‚‹е…Ёе›Ѕз ”з©¶г‚ігѓігѓ†г‚№гѓ€гѓ»г‚№гѓјгѓ‘гѓјгѓ•г‚Ўг‚¤гѓЉгѓ«гЃёгЃ®е‡єе ґг‚’жћњгЃџгЃ—гЃѕгЃ—гЃџгЂ‚"
    },
    {
      badge: "г‚ўгѓјг‚­гѓ†г‚Їгѓ€ пј‹ AI г‚Ёгѓјг‚ёг‚§гѓігѓ€",
      title: "ж–°гѓћг‚¤гѓ«г‚№гѓ€гѓјгѓіпјљжњЄжќҐгЃ®й–‹з™єдЅ“е€¶",
      desc: "жњ¬гѓ—гѓ­г‚ёг‚§г‚Їгѓ€гЃЇгЂЃг‚Ѕгѓ­й–‹з™єиЂ…гЃЊгЂЊг‚ўгѓјг‚­гѓ†г‚Їгѓ€пј‹AIг‚Ёгѓјг‚ёг‚§гѓігѓ€гЂЌдЅ“е€¶гЃ§иЁ­иЁ€гЂ‚г‚»г‚­гѓҐгѓЄгѓ†г‚Јж§‹йЂ гЃЁз‰№иЁ±г‚ўгѓ«г‚ґгѓЄг‚єгѓ гЃЇи‘—иЂ…гЃЊж§‹зЇ‰гЃ—гЂЃг‚ігѓјгѓ‰гЃ®е®џиЈ…пј€Kotlin/C++пј‰г‚’AIг‚Ёгѓјг‚ёг‚§гѓігѓ€гЃ«е§”иЁ—гЃ—гЃѕгЃ—гЃџгЂ‚"
    }
  ]
};

const TIMELINE_ICONS = [
  <GraduationCap className="w-5 h-5 text-[#3B82F6]" />,
  <Award className="w-5 h-5 text-[#3B82F6]" />,
  <Compass className="w-5 h-5 text-[#3B82F6]" />,
  <Code2 className="w-5 h-5 text-[#3B82F6]" />
];

interface TimelineCardProps {
  item: { icon: React.ReactNode; badge: string; title: string; desc: string };
  index: number;
  ecoMode: boolean;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ item, index, ecoMode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px 0px" });
  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 sm:p-8 rounded-md bg-[#0A0A0B]/80 border border-white/[0.03] hover:border-[#3B82F6]/30 hover:shadow-glow-sm transition-all duration-300 relative group flex flex-col justify-between overflow-hidden"
    >
      {/* Top Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#3B82F6]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Milestone dot pinned to the top-left corner of the selected card;
          hidden on all others until hovered */}
      {!ecoMode && (
        <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full border border-[#3B82F6] bg-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-glow-md" />
      )}
      <div>
        {/* Header Row */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className={`w-10 h-10 rounded-md bg-[#12141A] flex items-center justify-center border transition-colors duration-300 ${inView ? "border-[#3B82F6]/50 text-[#3B82F6]" : "border-[#3B82F6]/10"}`}>
            {item.icon}
          </div>
          <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[#6FB1FF] uppercase font-bold bg-[#3B82F6]/10 px-3 py-1.5 rounded-md border border-[#3B82F6]/30">
            {item.badge}
          </span>
        </div>

        <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5F5F0] mb-3 group-hover:text-[#3B82F6] transition-all duration-300">
          {item.title}
        </h3>
      </div>

      <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed border-t border-[#3C404A]/30 pt-4 mt-2">
        {item.desc}
      </p>
    </motion.div>
  );
}

const OriginStorySection = React.memo(function OriginStorySection() {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();
  const timelineRef = useRef<HTMLDivElement>(null);

  const title = t.origin.title;
  const subtitle = t.origin.subtitle;
  const badgeText = t.origin.badge;

  const currentTimeline = t.origin.timeline;
  const timelineItems = currentTimeline.map((item, index) => ({
    icon: TIMELINE_ICONS[index] || TIMELINE_ICONS[0],
    badge: item.badge,
    title: item.title,
    desc: item.desc,
  }));

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 0.8", "end 0.6"],
  });
  // Progress of the timeline wire from 0 (hidden) to 1 (fully drawn)
  const lineProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section 
      className="relative w-full pt-8 pb-16 sm:pt-10 sm:pb-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B]" 
      id="origin-story"
    >
      {/* Background radial lights */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.015)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <SectionBadge
            variant="slash"
            icon={<Heart className={`w-3.5 h-3.5 text-red-500 ${ecoMode ? "" : "animate-pulse"}`} />}
            label={badgeText}
            className="mb-6"
          />
          
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {title}
          </h2>
          
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Timeline - chronological wire line with milestone dots */}
        <div ref={timelineRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto relative">
          {/* Central drawn connector line (desktop: vertical center; mobile: left rail) */}
          {!ecoMode && (
            <svg
              className="pointer-events-none absolute left-6 md:left-1/2 top-0 md:-translate-x-1/2 h-full w-[2px] overflow-visible"
              width="2"
              viewBox="0 0 2 1000"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="timeline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <motion.line
                x1="1" y1="0" x2="1" y2="1000"
                stroke="url(#timeline-grad)"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ pathLength: lineProgress }}
              />
            </svg>
          )}

          {timelineItems.map((item, index) => (
            <TimelineCard
              key={index}
              index={index}
              item={item}
              ecoMode={ecoMode}
            />
          ))}
        </div>

      </div>
    </section>
  );
});

export default OriginStorySection;
