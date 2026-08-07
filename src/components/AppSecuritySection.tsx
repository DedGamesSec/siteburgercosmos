import React from "react";
import { Shield, Lock, Eye, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageCode } from "../i18n/languages";
import { useEcoMode } from "../context/EcoModeContext";
import SectionBadge from "./SectionBadge";

const TITLE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ РєСѓРїРѕР»Р°",
  en: "Dome Hardening",
  es: "Seguridad de la CГєpula",
  zh: "з©№йЎ¶е®‰е…ЁйІжЉ¤",
  hi: "а¤ЎаҐ‹а¤® а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ",
  ar: "ШЈЩ…Ш§Щ† Ш§Щ„Щ‚ШЁШ©",
  pt: "SeguranГ§a da CГєpula",
  fr: "SГ©curitГ© du DГґme",
  de: "Kuppelsicherheit",
  ja: "гѓ‰гѓјгѓ гЃ®е®‰е…ЁеЇѕз­–"
};

const SUBTITLE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "РљР°Рє TrustNode Р·Р°С‰РёС‰Р°РµС‚ СЃРѕР±СЃС‚РІРµРЅРЅС‹Рµ Р°Р»РіРѕСЂРёС‚РјС‹ Рё РІР°С€Рё РґР°РЅРЅС‹Рµ РѕС‚ Р°РЅР°Р»РёР·Р° Рё РІР·Р»РѕРјР°",
  en: "How TrustNode hardens its own environment and secures local user analytics",
  es: "CГіmo TrustNode protege sus propios algoritmos y sus datos contra anГЎlisis y hackeos",
  zh: "TrustNode е¦‚дЅ•ејєеЊ–и‡Єиє«иїђиЎЊзЋЇеўѓе№¶дїќжЉ¤жњ¬ењ°з”Ёж€·е€†жћђе…ЌеЏ—йЂ†еђ‘дёЋж”»е‡»",
  hi: "TrustNode а¤…а¤Єа¤ЁаҐ‡ а¤ёаҐЌа¤µа¤Їа¤‚ а¤•аҐ‡ а¤Џа¤ІаҐЌа¤—аҐ‹а¤°а¤їа¤¦а¤® а¤”а¤° а¤†а¤Єа¤•аҐ‡ а¤ЎаҐ‡а¤џа¤ѕ а¤•аҐ‹ а¤µа¤їа¤¶аҐЌа¤ІаҐ‡а¤·а¤Ј а¤”а¤° а¤№аҐ€а¤•а¤їа¤‚а¤— а¤ёаҐ‡ а¤•аҐ€а¤ёаҐ‡ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤°а¤–а¤¤а¤ѕ а¤№аҐ€",
  ar: "ЩѓЩЉЩЃ ШЄШ­Щ…ЩЉ TrustNode Ш®Щ€Ш§Ш±ШІЩ…ЩЉШ§ШЄЩ‡Ш§ Ш§Щ„Ш®Ш§ШµШ© Щ€ШЁЩЉШ§Щ†Ш§ШЄЩѓ Щ…Щ† Ш§Щ„ШЄШ­Щ„ЩЉЩ„ Щ€Ш§Щ„Ш§Ш®ШЄШ±Ш§Щ‚",
  pt: "Como o TrustNode protege seus prГіprios algoritmos e seus dados contra anГЎlise e invasГЈo",
  fr: "Comment TrustNode protГЁge ses propres algorithmes et vos donnГ©es contre l'analyse et le piratage",
  de: "Wie TrustNode seine eigenen Algorithmen und Ihre Daten vor Analyse und Hacking schГјtzt",
  ja: "TrustNodeгЃЊз‹¬и‡ЄгЃ®г‚ўгѓ«г‚ґгѓЄг‚єгѓ гЃЁгѓ¦гѓјг‚¶гѓјгѓ‡гѓјг‚їг‚’и§Јжћђг‚„гѓЏгѓѓг‚­гѓіг‚°гЃ‹г‚‰дїќи­·гЃ™г‚‹ж–№жі•"
};

const BADGE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "Р—РђР©РРўРђ РЎРђРњРћР“Рћ РџР РР›РћР–Р•РќРРЇ",
  en: "APPLICATION HARDENING MODEL",
  es: "MODELO DE PROTECCIГ“N DE LA APLICACIГ“N",
  zh: "еє”з”ЁзЁ‹еєЏеЉ е›єжЁЎећ‹",
  hi: "а¤Џа¤ЄаҐЌа¤Іа¤їа¤•аҐ‡а¤¶а¤Ё а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤®аҐ‰а¤Ўа¤І",
  ar: "Щ†Щ…Щ€Ш°Ш¬ Ш­Щ…Ш§ЩЉШ© Ш§Щ„ШЄШ·ШЁЩЉЩ‚",
  pt: "MODELO DE PROTEГ‡ГѓO DO APLICATIVO",
  fr: "MODГ€LE DE SГ‰CURITГ‰ DE L'APPLICATION",
  de: "ANWENDUNGSSICHERHEITSMODELL",
  ja: "г‚ўгѓ—гѓЄг‚±гѓјг‚·гѓ§гѓіеЉ е›єгѓўгѓ‡гѓ«"
};

const COMPLIANCE_LABEL_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "Р®Р РР”РР§Р•РЎРљРђРЇ Р РЎР•Р РўРР¤РРљРђР¦РРћРќРќРђРЇ РљР›РђРЎРЎРР¤РРљРђР¦РРЇ",
  en: "LEGAL & SECURITY COMPLIANCE CLASSIFICATION",
  es: "CLASIFICACIГ“N DE CUMPLIMIENTO LEGAL Y DE SEGURIDAD",
  zh: "жі•еѕ‹дёЋе®‰е…Ёеђ€и§„е€†з±»",
  hi: "а¤•а¤ѕа¤ЁаҐ‚а¤ЁаҐЂ а¤”а¤° а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤…а¤ЁаҐЃа¤Єа¤ѕа¤Іа¤Ё а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј",
  ar: "ШЄШµЩ†ЩЉЩЃ Ш§Щ„Ш§Щ…ШЄШ«Ш§Щ„ Ш§Щ„Щ‚Ш§Щ†Щ€Щ†ЩЉ Щ€Ш§Щ„ШЈЩ…Щ†ЩЉ",
  pt: "CLASSIFICAГ‡ГѓO DE CONFORMIDADE LEGAL E SEGURANГ‡A",
  fr: "CLASSIFICATION DE CONFORMITГ‰ LГ‰GALE ET SГ‰CURITAIRE",
  de: "RECHTLICHE & SICHERHEITSKLASSIFIZIERUNG",
  ja: "жі•зљ„гЃЉг‚€гЃіг‚»г‚­гѓҐгѓЄгѓ†г‚Јжє–ж‹ гЃ®е€†йЎћ"
};

const COMPLIANCE_TEXT_BY_LANG: Partial<Record<LanguageCode, string>> = {
  ru: "TrustNode РєР»Р°СЃСЃРёС„РёС†РёСЂСѓРµС‚СЃСЏ РєР°Рє СЃРµРјР°РЅС‚РёС‡РµСЃРєРёР№ СЌРІСЂРёСЃС‚РёС‡РµСЃРєРёР№ Р°РЅР°Р»РёР·Р°С‚РѕСЂ Р»РѕРєР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С… Рё С‚РµРєСЃС‚РѕРІС‹С… РїР°С‚С‚РµСЂРЅРѕРІ. РЎРёСЃС‚РµРјР° РќР• СЃРѕРґРµСЂР¶РёС‚ РІСЃС‚СЂРѕРµРЅРЅС‹С… СЃСЂРµРґСЃС‚РІ С€РёС„СЂРѕРІР°РЅРёСЏ СЃС‚РѕСЂРѕРЅРЅРµРіРѕ С‚СЂР°С„РёРєР°, Р±Р»Р°РіРѕРґР°СЂСЏ С‡РµРјСѓ РЅРµ С‚СЂРµР±СѓРµС‚ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕРіРѕ Р»РёС†РµРЅР·РёСЂРѕРІР°РЅРёСЏ РІ Р¤РЎР‘ Р РѕСЃСЃРёРё РїРѕ РџРѕСЃС‚Р°РЅРѕРІР»РµРЅРёСЋ РџСЂР°РІРёС‚РµР»СЊСЃС‚РІР° в„–313.",
  en: "TrustNode operates strictly as a semantic heuristic text analyzer inside a localized memory environment. Since it does not encrypt or decrypt external network payloads, it does not require mandatory Russian Federal Security Service (FSB) licensing.",
  es: "TrustNode se clasifica como un analizador heurГ­stico semГЎntico de datos locales y patrones de texto. El sistema NO contiene herramientas de cifrado para trГЎfico externo, por lo que no requiere licencias obligatorias del Servicio Federal de Seguridad (FSB) de Rusia.",
  zh: "TrustNode дёҐж јдЅњдёєжњ¬ењ°еЊ–е†…е­зЋЇеўѓдё­зљ„иЇ­д№‰еђЇеЏ‘ејЏж–‡жњ¬е€†жћђе™ЁиїђиЎЊгЂ‚з”±дєЋе®ѓдёЌеЇ№е¤–йѓЁзЅ‘з»њиґџиЅЅиї›иЎЊеЉ еЇ†ж€–и§ЈеЇ†пјЊе› ж­¤дёЌйњЂи¦Ѓдї„зЅ—ж–ЇиЃ”й‚¦е®‰е…Ёе±Ђ (FSB) зљ„ејєе€¶и®ёеЏЇгЂ‚",
  hi: "TrustNode а¤Џа¤• а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Їа¤•аҐѓа¤¤ а¤®аҐ‡а¤®аҐ‹а¤°аҐЂ а¤µа¤ѕа¤¤а¤ѕа¤µа¤°а¤Ј а¤•аҐ‡ а¤­аҐЂа¤¤а¤° а¤…а¤°аҐЌа¤Ґа¤—а¤¤ а¤…а¤ЁаҐЃа¤®а¤ѕа¤ЁаҐЂ а¤Єа¤ѕа¤  а¤µа¤їа¤¶аҐЌа¤ІаҐ‡а¤·а¤• а¤•аҐ‡ а¤°аҐ‚а¤Є а¤®аҐ‡а¤‚ а¤•а¤ѕа¤°аҐЌа¤Ї а¤•а¤°а¤¤а¤ѕ а¤№аҐ€аҐ¤ а¤љаҐ‚а¤‚а¤•а¤ї а¤Їа¤№ а¤¬а¤ѕа¤№а¤°аҐЂ а¤ЁаҐ‡а¤џа¤µа¤°аҐЌа¤• а¤ЄаҐ‡а¤ІаҐ‹Рґ а¤•аҐ‹ а¤Џа¤ЁаҐЌа¤•аҐЌа¤°а¤їа¤ЄаҐЌа¤џ а¤Їа¤ѕ а¤Ўа¤їа¤•аҐЌа¤°а¤їа¤ЄаҐЌа¤џ а¤Ёа¤№аҐЂа¤‚ а¤•а¤°а¤¤а¤ѕ а¤№аҐ€, а¤‡а¤ёа¤Іа¤їа¤Џ а¤‡а¤ёа¤•аҐ‡ а¤Іа¤їа¤Џ а¤°аҐ‚а¤ёаҐЂ а¤ёа¤‚а¤аҐЂа¤Ї а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤ёаҐ‡а¤µа¤ѕ (FSB) а¤Іа¤ѕа¤‡а¤ёаҐ‡а¤‚а¤ёа¤їа¤‚а¤— а¤•аҐЂ а¤†а¤µа¤¶аҐЌа¤Їа¤•а¤¤а¤ѕ а¤Ёа¤№аҐЂа¤‚ а¤№аҐ€аҐ¤",
  ar: "ЩЉШЄЩ… ШЄШµЩ†ЩЉЩЃ TrustNode ЩѓЩ…Ш­Щ„Щ„ ШҐШ±ШґШ§ШЇЩЉ ШЇЩ„Ш§Щ„ЩЉ Щ„Щ„ШЁЩЉШ§Щ†Ш§ШЄ Ш§Щ„Щ…Ш­Щ„ЩЉШ© Щ€ШЈЩ†Щ…Ш§Ш· Ш§Щ„Щ†ШµЩ€Шµ. Щ„Ш§ ЩЉШ­ШЄЩ€ЩЉ Ш§Щ„Щ†ШёШ§Щ… Ш№Щ„Щ‰ ШЈЩЉ ШЈШЇЩ€Ш§ШЄ ШЄШґЩЃЩЉШ± Щ„Ш­Ш±ЩѓШ© Щ…Ш±Щ€Ш± Ш®Ш§Ш±Ш¬ЩЉШ©ШЊ Щ€ШЁШ§Щ„ШЄШ§Щ„ЩЉ Щ„Ш§ ЩЉШЄШ·Щ„ШЁ ШЄШ±Ш®ЩЉШµЩ‹Ш§ ШҐЩ„ШІШ§Щ…ЩЉЩ‹Ш§ Щ…Щ† Ш¬Щ‡Ш§ШІ Ш§Щ„ШЈЩ…Щ† Ш§Щ„ЩЃЩЉШЇШ±Ш§Щ„ЩЉ Ш§Щ„Ш±Щ€ШіЩЉ (FSB).",
  pt: "O TrustNode Г© classificado como um analisador heurГ­stico semГўntico de dados locais e padrГµes de texto. O sistema NГѓO contГ©m ferramentas de criptografia para trГЎfego de terceiros, portanto, nГЈo exige licenciamento obrigatГіrio do FSB russo.",
  fr: "TrustNode est classГ© comme un analyseur heuristique sГ©mantique de donnГ©es locales et de motifs textuels. Le systГЁme ne contient aucun outil de chiffrement tiers, il n'est donc pas soumis Г  l'octroi d'une licence obligatoire par le FSB russe.",
  de: "TrustNode arbeitet ausschlieГџlich als semantisch-heuristischer Textanalysator in einer lokalen Speicherumgebung. Da es keine externen Netzwerknutzdaten verschlГјsselt oder entschlГјsselt, ist keine gesetzlich vorgeschriebene FSB-Lizenzierung erforderlich.",
  ja: "TrustNodeгЃЇгЂЃгѓ­гѓјг‚«гѓ«гѓЎгѓўгѓЄз’°еўѓе†…гЃ®ж„Џе‘іи«–зљ„гѓ’гѓҐгѓјгѓЄг‚№гѓ†г‚Јгѓѓг‚Їгѓ†г‚­г‚№гѓ€е€†жћђгѓ„гѓјгѓ«гЃЁгЃ—гЃ¦гЃ®гЃїе‹•дЅњгЃ—гЃѕгЃ™гЂ‚е¤–йѓЁзЅ‘з»њгѓљг‚¤гѓ­гѓјгѓ‰г‚’жљ—еЏ·еЊ–гЃѕгЃџгЃЇеѕ©еЏ·гЃ™г‚‹гЃ“гЃЁгЃЇгЃЄгЃ„гЃџг‚ЃгЂЃгѓ­г‚·г‚ўйЂЈй‚¦дїќе®‰еєЃпј€FSBпј‰гЃ«г‚€г‚‹еј·е€¶гѓ©г‚¤г‚»гѓіг‚№гЃ®еЇѕи±Ўе¤–гЃЁгЃЄг‚ЉгЃѕгЃ™гЂ‚"
};

const FEATURES_BY_LANG: Partial<Record<LanguageCode, Array<{ title: string; desc: string }>>> = {
  ru: [
    {
      title: "РЁРёС„СЂРѕРІР°РЅРЅРѕРµ С…СЂР°РЅРёР»РёС‰Рµ VAULT",
      desc: "РЁРёС„СЂРѕРІР°РЅРёРµ РїРѕ СЃС‚Р°РЅРґР°СЂС‚Сѓ AES-256-GCM СЃ РёРЅС‚РµРіСЂР°С†РёРµР№ Р°РїРїР°СЂР°С‚РЅРѕРіРѕ С‡РёРїР° Android Keystore / StrongBox. Р›РѕРєР°Р»СЊРЅС‹Рµ Р±Р°Р·С‹ Р·Р°С‰РёС‰РµРЅС‹ С‡РµСЂРµР· SQLCipher Рё PBKDF2+HKDF."
    },
    {
      title: "РђРєС‚РёРІРЅР°СЏ Р·Р°С‰РёС‚Р° AEGIS RASP",
      desc: "Р—Р°С‰РёС‚Р° РїСЂРёР»РѕР¶РµРЅРёСЏ РІРѕ РІСЂРµРјСЏ СЂР°Р±РѕС‚С‹ (Runtime Application Self-Protection). РћР±РЅР°СЂСѓР¶РёРІР°РµС‚ РѕС‚Р»Р°РґРєСѓ (Anti-Debug), СЂСѓС‚-РїСЂР°РІР°, СЌРјСѓР»СЏС‚РѕСЂС‹ Рё РїРѕРїС‹С‚РєРё РёРЅСЉРµРєС†РёРё РєРѕРґР°."
    },
    {
      title: "РЎРёСЃС‚РµРјР° Р°СѓРґРёС‚Р° Self-Audit",
      desc: "Р¤РѕРЅРѕРІС‹Рµ РїРµСЂРёРѕРґРёС‡РµСЃРєРёРµ РїСЂРѕРІРµСЂРєРё С†РµР»РѕСЃС‚РЅРѕСЃС‚Рё РёСЃРїРѕР»РЅСЏРµРјС‹С… С„Р°Р№Р»РѕРІ РЅР° Р±Р°Р·Рµ WorkManager. Р’С‹С‡РёСЃР»СЏРµС‚ РєРѕРЅС‚СЂРѕР»СЊРЅС‹Рµ СЃСѓРјРјС‹ CRC32 РЅР°С‚РёРІРЅС‹С… РјРѕРґСѓР»РµР№ Рё СЃСЂР°РІРЅРёРІР°РµС‚ СЃ СЌС‚Р°Р»РѕРЅРѕРј."
    },
    {
      title: "Р›РѕРєР°Р»СЊРЅР°СЏ РїРµСЃРѕС‡РЅРёС†Р° Рё 152-Р¤Р—",
      desc: "РџРѕР»РЅРѕРµ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ Р·Р°РєРѕРЅСѓ Рѕ РїРµСЂСЃРѕРЅР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С…. РСЃС…РѕРґРЅС‹Рµ С„Р°Р№Р»С‹, Р»РѕРіРё Рё Р°СѓРґРёРѕРїРѕС‚РѕРєРё РѕР±СЂР°Р±Р°С‚С‹РІР°СЋС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ РћР—РЈ СѓСЃС‚СЂРѕР№СЃС‚РІР° Рё РЅРёРєРѕРіРґР° РЅРµ РѕС‚РїСЂР°РІР»СЏСЋС‚СЃСЏ РЅР° СЃРµСЂРІРµСЂР°."
    }
  ],
  en: [
    {
      title: "VAULT Secure Storage",
      desc: "Military-grade AES-256-GCM encryption backed by physical Android Keystore / StrongBox hardware chips. Local data collections are hardened via SQLCipher & PBKDF2+HKDF."
    },
    {
      title: "AEGIS Active RASP",
      desc: "Proactive Runtime Application Self-Protection (RASP). Constantly audits memory integrity, blocking debuggers, root tools, emulator environments, and code injections."
    },
    {
      title: "Periodic Self-Audit Engine",
      desc: "Background file and component integrity auditor driven by WorkManager. Calculates CRC32 checksums of native NDK binaries to detect tampering on the fly."
    },
    {
      title: "On-Device Sandbox & Law 152-FZ",
      desc: "Strict localization complying with Russian Federal Law 152-FZ. All call transcribing, messaging, and memory logs stay strictly inside the local device RAM."
    }
  ],
  es: [
    {
      title: "Almacenamiento Seguro VAULT",
      desc: "Cifrado AES-256-GCM respaldado por chips fГ­sicos Android Keystore / StrongBox. Las bases de datos locales estГЎn protegidas mediante SQLCipher y PBKDF2+HKDF."
    },
    {
      title: "ProtecciГіn Activa AEGIS RASP",
      desc: "AutoprotecciГіn de la aplicaciГіn en tiempo de ejecuciГіn (RASP). Detecta depuraciГіn (Anti-Debug), privilegios de root, emuladores e intentos de inyecciГіn de cГіdigo."
    },
    {
      title: "Motor de AutoauditorГ­a PeriГіdica",
      desc: "Comprobaciones en segundo plano de la integridad de los archivos ejecutables a travГ©s de WorkManager. Calcula sumas de comprobaciГіn CRC32 de binarios nativos NDK."
    },
    {
      title: "Espacio de Trabajo Local y Ley 152-FZ",
      desc: "Cumplimiento estricto de la ley de datos personales. Los registros de voz, archivos y transcripciones se procesan solo en la RAM del dispositivo y nunca se envГ­an a servidores."
    }
  ],
  zh: [
    {
      title: "VAULT еЉ еЇ†е­е‚Ё",
      desc: "з”±з‰©зђ† Android Keystore / StrongBox зЎ¬д»¶иЉЇз‰‡ж”ЇжЊЃзљ„е†›з”Ёзє§ AES-256-GCM еЉ еЇ†гЂ‚жњ¬ењ°ж•°жЌ®й›†еђ€йЂљиї‡ SQLCipher е’Њ PBKDF2+HKDF иї›иЎЊеЉ е›єгЂ‚"
    },
    {
      title: "AEGIS дё»еЉЁиїђиЎЊж—¶дїќжЉ¤ (RASP)",
      desc: "дё»еЉЁиїђиЎЊж—¶еє”з”ЁзЁ‹еєЏи‡ЄдїќжЉ¤ (RASP)гЂ‚жЊЃз»­е®Ўи®Ўе†…е­е®Њж•ґжЂ§пјЊж‹¦ж€Єи°ѓиЇ•е™ЁгЂЃRootе·Ґе…·гЂЃжЁЎж‹џе™ЁзЋЇеўѓе’Њд»Јз ЃжіЁе…ҐгЂ‚"
    },
    {
      title: "Self-Audit е®љжњџи‡ЄжЈЂеј•ж“Ћ",
      desc: "з”± WorkManager й©±еЉЁзљ„еђЋеЏ°ж–‡д»¶е’Њз»„д»¶е®Њж•ґжЂ§е®Ўи®Ўе™ЁгЂ‚и®Ўз®—еЋџз”џ NDK дєЊиї›е€¶ж–‡д»¶зљ„ CRC32 ж ЎйЄЊе’ЊпјЊд»Ґе®ћж—¶жЈЂжµ‹зЇЎж”№гЂ‚"
    },
    {
      title: "жњ¬ењ°жІ™з›’дёЋдї„зЅ—ж–Ї 152-FZ жі•еѕ‹еђ€и§„",
      desc: "е®Ње…Ёз¬¦еђ€дёЄдєєж•°жЌ®дїќжЉ¤жі•гЂ‚ж‰Ђжњ‰йЂљиЇќиЅ¬еЅ•гЂЃж¶€жЃЇе’Ње†…е­ж—Ґеї—еќ‡дёҐж јдїќе­ењЁжњ¬ењ°и®ѕе¤‡ RAM дё­пјЊз»ќдёЌеЏ‘йЂЃе€°жњЌеЉЎе™ЁгЂ‚"
    }
  ],
  hi: [
    {
      title: "VAULT а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤ёаҐЌа¤џаҐ‹а¤°аҐ‡а¤њ",
      desc: "а¤­аҐЊа¤¤а¤їа¤• Android Keystore / StrongBox а¤№а¤ѕа¤°аҐЌа¤Ўа¤µаҐ‡а¤Їа¤° а¤ља¤їа¤ЄаҐЌа¤ё а¤¦аҐЌа¤µа¤ѕа¤°а¤ѕ а¤ёа¤®а¤°аҐЌа¤Ґа¤їа¤¤ а¤ёаҐ€а¤ЁаҐЌа¤Ї-а¤—аҐЌа¤°аҐ‡а¤Ў AES-256-GCM а¤Џа¤ЁаҐЌа¤•аҐЌа¤°а¤їа¤ЄаҐЌа¤¶а¤ЁаҐ¤ а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Ї а¤ЎаҐ‡а¤џа¤ѕ SQLCipher а¤”а¤° PBKDF2+HKDF а¤•аҐ‡ а¤®а¤ѕа¤§аҐЌа¤Їа¤® а¤ёаҐ‡ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤№аҐ€аҐ¤"
    },
    {
      title: "AEGIS а¤ёа¤•аҐЌа¤°а¤їа¤Ї RASP а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ",
      desc: "а¤ёа¤•аҐЌа¤°а¤їа¤Ї а¤°а¤Ёа¤џа¤ѕа¤‡а¤® а¤Џа¤ЄаҐЌа¤Іа¤їа¤•аҐ‡а¤¶а¤Ё а¤ёаҐ‡а¤ІаҐЌа¤«-а¤ЄаҐЌа¤°аҐ‹а¤џаҐ‡а¤•аҐЌа¤¶а¤Ё (RASP)аҐ¤ а¤®аҐ‡а¤®аҐ‹а¤°аҐЂ а¤…а¤–а¤‚а¤Ўа¤¤а¤ѕ а¤•а¤ѕ а¤Іа¤—а¤ѕа¤¤а¤ѕа¤° а¤‘а¤Ўа¤їа¤џ а¤•а¤°а¤¤а¤ѕ а¤№аҐ€, а¤Ўа¤їа¤¬а¤—а¤°аҐЌа¤ё, а¤°аҐ‚а¤џ а¤џаҐ‚а¤ІаҐЌа¤ё, а¤Џа¤®аҐЃа¤ІаҐ‡а¤џа¤° а¤µа¤ѕа¤¤а¤ѕа¤µа¤°а¤Ј а¤”а¤° а¤•аҐ‹а¤Ў а¤‡а¤‚а¤њаҐ‡а¤•аҐЌа¤¶а¤Ё а¤•аҐ‹ а¤°аҐ‹а¤•а¤¤а¤ѕ а¤№аҐ€аҐ¤"
    },
    {
      title: "а¤†а¤µа¤§а¤їа¤• а¤ёаҐЌа¤µ-а¤‘а¤Ўа¤їа¤џ а¤‡а¤‚а¤ња¤Ё",
      desc: "WorkManager а¤¦аҐЌа¤µа¤ѕа¤°а¤ѕ а¤ёа¤‚а¤ља¤ѕа¤Іа¤їа¤¤ а¤ЄаҐѓа¤·аҐЌа¤ а¤­аҐ‚а¤®а¤ї а¤«а¤ја¤ѕа¤‡а¤І а¤”а¤° а¤а¤џа¤• а¤…а¤–а¤‚а¤Ўа¤¤а¤ѕ а¤Єа¤°аҐЂа¤•аҐЌа¤·а¤•аҐ¤ а¤µа¤ѕа¤ёаҐЌа¤¤а¤µа¤їа¤• а¤ёа¤®а¤Ї а¤®аҐ‡а¤‚ а¤›аҐ‡а¤Ўа¤ја¤›а¤ѕа¤Ўа¤ј а¤•а¤ѕ а¤Єа¤¤а¤ѕ а¤Іа¤—а¤ѕа¤ЁаҐ‡ а¤•аҐ‡ а¤Іа¤їа¤Џ а¤®аҐ‚а¤І NDK а¤¬а¤ѕа¤‡а¤Ёа¤°аҐЂ а¤•аҐ‡ CRC32 а¤љаҐ‡а¤•а¤ёа¤® а¤•аҐЂ а¤—а¤Ја¤Ёа¤ѕ а¤•а¤°а¤¤а¤ѕ а¤№аҐ€аҐ¤"
    },
    {
      title: "а¤‘а¤Ё-а¤Ўа¤їа¤µа¤ѕа¤‡а¤ё а¤ёаҐ€а¤‚а¤Ўа¤¬аҐ‰а¤•аҐЌа¤ё а¤”а¤° а¤•а¤ѕа¤ЁаҐ‚а¤Ё 152-FZ",
      desc: "а¤µаҐЌа¤Їа¤•аҐЌа¤¤а¤їа¤—а¤¤ а¤ЎаҐ‡а¤џа¤ѕ а¤•а¤ѕа¤ЁаҐ‚а¤Ё а¤•а¤ѕ а¤ЄаҐ‚а¤°аҐЌа¤Ј а¤…а¤ЁаҐЃа¤Єа¤ѕа¤Іа¤ЁаҐ¤ а¤ёа¤­аҐЂ а¤•аҐ‰а¤І а¤џаҐЌа¤°а¤ѕа¤‚а¤ёа¤•аҐЌа¤°а¤їа¤ЄаҐЌа¤¶а¤Ё, а¤®аҐ€а¤ёаҐ‡а¤ња¤їа¤‚а¤— а¤”а¤° а¤®аҐ‡а¤®аҐ‹а¤°аҐЂ а¤ІаҐ‰а¤— а¤•аҐ‡а¤µа¤І а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Ї а¤Ўа¤їа¤µа¤ѕа¤‡а¤ё а¤°аҐ€а¤® а¤•аҐ‡ а¤­аҐЂа¤¤а¤° а¤°а¤№а¤¤аҐ‡ а¤№аҐ€а¤‚ а¤”а¤° а¤•а¤­аҐЂ а¤­аҐЂ а¤ёа¤°аҐЌа¤µа¤° а¤Єа¤° а¤Ёа¤№аҐЂа¤‚ а¤­аҐ‡а¤њаҐ‡ а¤ња¤ѕа¤¤аҐ‡ а¤№аҐ€а¤‚аҐ¤"
    }
  ],
  ar: [
    {
      title: "Щ…ШіШЄЩ€ШЇШ№ VAULT Ш§Щ„ШўЩ…Щ†",
      desc: "ШЄШґЩЃЩЉШ± AES-256-GCM Щ…ШЇШ№Щ€Щ… ШЁШґШ±ЩЉШ­Ш© Ш№ШЄШ§ШЇ Android Keystore / StrongBox. ЩЉШЄЩ… ШЄШЈЩ…ЩЉЩ† Щ‚Щ€Ш§Ш№ШЇ Ш§Щ„ШЁЩЉШ§Щ†Ш§ШЄ Ш§Щ„Щ…Ш­Щ„ЩЉШ© Ш№ШЁШ± SQLCipher Щ€ PBKDF2+HKDF."
    },
    {
      title: "Ш­Щ…Ш§ЩЉШ© AEGIS RASP Ш§Щ„Щ†ШґШ·Ш©",
      desc: "Ш§Щ„Ш­Щ…Ш§ЩЉШ© Ш§Щ„Ш°Ш§ШЄЩЉШ© Щ„Щ„ШЄШ·ШЁЩЉЩ‚ ШЈШ«Щ†Ш§ШЎ Ш§Щ„ШЄШґШєЩЉЩ„ (RASP). ШЄЩѓШЄШґЩЃ ШЈШЇЩ€Ш§ШЄ Ш§Щ„ШЄШµШ­ЩЉШ­ (Anti-Debug)ШЊ Щ€ШµЩ„Ш§Ш­ЩЉШ§ШЄ Ш§Щ„Ш±Щ€ШЄШЊ Щ€Ш§Щ„Щ…Ш­Ш§ЩѓЩЉШ§ШЄШЊ Щ€Щ…Ш­Ш§Щ€Щ„Ш§ШЄ Ш­Щ‚Щ† Ш§Щ„ШґЩЉЩЃШ±Ш©."
    },
    {
      title: "Щ…Ш­Ш±Щѓ Ш§Щ„ШЄШЇЩ‚ЩЉЩ‚ Ш§Щ„Ш°Ш§ШЄЩЉ Ш§Щ„ШЇЩ€Ш±ЩЉ",
      desc: "ЩЃШ­Щ€ШµШ§ШЄ ШЇЩ€Ш±ЩЉШ© ЩЃЩЉ Ш§Щ„Ш®Щ„ЩЃЩЉШ© Щ„Щ„ШЄШЈЩѓШЇ Щ…Щ† ШіЩ„Ш§Щ…Ш© Ш§Щ„Щ…Щ„ЩЃШ§ШЄ Ш§Щ„Щ‚Ш§ШЁЩ„Ш© Щ„Щ„ШЄЩ†ЩЃЩЉШ° Ш№ШЁШ± WorkManager. ЩЉШ­ШіШЁ Щ…Ш¬Щ…Щ€Ш№ Ш§Щ„ШЄШ­Щ‚Щ‚ CRC32 Щ„Щ…Щ„ЩЃШ§ШЄ NDK Ш§Щ„Ш«Щ†Ш§Ш¦ЩЉШ© Ш§Щ„ШЈШµЩ„ЩЉШ©."
    },
    {
      title: "ШЁЩЉШ¦Ш© Ш§Щ„Ш№Щ…Щ„ Ш§Щ„Щ…Ш­Щ„ЩЉШ© Щ€Щ‚Ш§Щ†Щ€Щ† 152-FZ",
      desc: "Ш§Щ…ШЄШ«Ш§Щ„ ЩѓШ§Щ…Щ„ Щ„Щ‚Ш§Щ†Щ€Щ† Ш§Щ„ШЁЩЉШ§Щ†Ш§ШЄ Ш§Щ„ШґШ®ШµЩЉШ©. ШЄЩЏШ№Ш§Щ„Ш¬ Щ…Щ„ЩЃШ§ШЄ Ш§Щ„ШµЩ€ШЄ Щ€Ш§Щ„ШіШ¬Щ„Ш§ШЄ Щ€Ш§Щ„ШЄШ±Ш¬Щ…Ш§ШЄ ЩЃЩЉ Ш°Ш§ЩѓШ±Ш© Ш§Щ„Щ€ШµЩ€Щ„ Ш§Щ„Ш№ШґЩ€Ш§Ш¦ЩЉ Щ„Щ„Ш¬Щ‡Ш§ШІ ЩЃЩ‚Ш· Щ€Щ„Ш§ ШЄЩЏШ±ШіЩ„ Щ…Ш·Щ„Щ‚Щ‹Ш§ ШҐЩ„Щ‰ Ш§Щ„ШіЩЉШ±ЩЃШ±Ш§ШЄ."
    }
  ],
  pt: [
    {
      title: "Armazenamento Seguro VAULT",
      desc: "Criptografia AES-256-GCM com integraГ§ГЈo do chip de hardware Android Keystore / StrongBox. As bases locais sГЈo protegidas via SQLCipher e PBKDF2+HKDF."
    },
    {
      title: "ProteГ§ГЈo Ativa AEGIS RASP",
      desc: "AutoproteГ§ГЈo do aplicativo em tempo de execuГ§ГЈo (RASP). Detecta depuraГ§ГЈo (Anti-Debug), privilГ©gios de root, emuladores e tentativas de injeГ§ГЈo de cГіdigo."
    },
    {
      title: "Sistema de Autoauditoria PeriГіdica",
      desc: "VerificaГ§Гµes periГіdicas em segundo plano da integridade de arquivos executГЎveis baseadas no WorkManager. Calcula somas de verificaГ§ГЈo CRC32 dos binГЎrios nativos do NDK."
    },
    {
      title: "Sandbox Local e Lei Federal 152-FZ",
      desc: "Conformidade total com a lei de dados pessoais. Arquivos originais, logs e fluxos de ГЎudio sГЈo processados apenas na RAM do dispositivo e nunca saem do aparelho."
    }
  ],
  fr: [
    {
      title: "Stockage SГ©curisГ© VAULT",
      desc: "Chiffrement AES-256-GCM de niveau militaire soutenu par les puces physiques Android Keystore / StrongBox. Les bases de donnГ©es locales sont sГ©curisГ©es via SQLCipher et PBKDF2+HKDF."
    },
    {
      title: "Protection Active AEGIS RASP",
      desc: "Autoprotection de l'application au moment de l'exГ©cution (RASP). DГ©tecte le dГ©bogage (Anti-Debug), les privilГЁges root, les Г©mulateurs et les injections de code."
    },
    {
      title: "Moteur d'Auto-audit PГ©riodique",
      desc: "VГ©rifications d'intГ©gritГ© en arriГЁre-plan des exГ©cutables gГ©rГ©es par WorkManager. Calcule les sommes de contrГґle CRC32 des binaires NDK natifs pour dГ©tecter les altГ©rations."
    },
    {
      title: "Bac Г  sable local & Loi 152-FZ",
      desc: "ConformitГ© stricte Г  la loi sur les donnГ©es personnelles. Toutes les transcriptions d'appels, messages et journaux restent uniquement dans la RAM locale de l'appareil et ne sont jamais envoyГ©s aux serveurs."
    }
  ],
  de: [
    {
      title: "Sicherer VAULT-Speicher",
      desc: "AES-256-GCM-VerschlГјsselung auf MilitГ¤rniveau, unterstГјtzt durch physische Android Keystore / StrongBox-Hardwarechips. Lokale DatensГ¤tze sind Гјber SQLCipher & PBKDF2+HKDF geschГјtzt."
    },
    {
      title: "AEGIS Aktiver RASP-Schutz",
      desc: "Proaktive Runtime Application Self-Protection (RASP). ГњberprГјft stГ¤ndig die SpeicherintegritГ¤t und blockiert Debugger, Root-Tools, Emulatorumgebungen und Code-Injections."
    },
    {
      title: "RegelmГ¤Гџige Self-Audit-Engine",
      desc: "HintergrundintegritГ¤tsprГјfung fГјr Dateien und Komponenten via WorkManager. Berechnet CRC32-PrГјfsummen nativer NDK-BinГ¤rdateien, um Manipulationen sofort zu erkennen."
    },
    {
      title: "On-Device-Sandbox & Gesetz 152-FZ",
      desc: "Strikte Einhaltung des russischen Bundesgesetzes 152-FZ. Alle Anruftranskriptionen, Nachrichten und Speicherprotokolle verbleiben ausschlieГџlich im RAM des lokalen GerГ¤ts."
    }
  ],
  ja: [
    {
      title: "жљ—еЏ·еЊ–г‚№гѓ€гѓ¬гѓјг‚ё VAULT",
      desc: "Android Keystore / StrongBox з‰©зђ†гѓЏгѓјгѓ‰г‚¦г‚§г‚ўгѓЃгѓѓгѓ—г‚’еџєз›¤гЃЁгЃ™г‚‹и»Ќз”Ёгѓ¬гѓ™гѓ«гЃ® AES-256-GCM жљ—еЏ·еЊ–гЂ‚гѓ­гѓјг‚«гѓ«гѓ‡гѓјг‚їгѓ™гѓјг‚№гЃЇ SQLCipher гЃЁ PBKDF2+HKDF гЃ§дїќи­·гЃ•г‚ЊгЃ¦гЃ„гЃѕгЃ™гЂ‚"
    },
    {
      title: "г‚ўг‚Їгѓ†г‚Јгѓ–дїќи­· AEGIS RASP",
      desc: "е®џиЎЊж™‚г‚ўгѓ—гѓЄг‚±гѓјг‚·гѓ§гѓіи‡Єе·±дїќи­·пј€RASPпј‰гЂ‚гѓЎгѓўгѓЄгЃ®е®Ње…ЁжЂ§г‚’з¶™з¶љзљ„гЃ«з›Ји¦–гЃ—гЂЃгѓ‡гѓђгѓѓг‚¬пј€Anti-Debugпј‰гЂЃгѓ«гѓјгѓ€жЁ©й™ђгЂЃг‚ЁгѓџгѓҐгѓ¬гѓјг‚їгЂЃг‚ігѓјгѓ‰г‚¤гѓіг‚ёг‚§г‚Їг‚·гѓ§гѓіг‚’ж¤ње‡єгѓ»йЃ®ж–­гЃ—гЃѕгЃ™гЂ‚"
    },
    {
      title: "и‡Єе·±з›Јжџ»г‚Ёгѓіг‚ёгѓі Self-Audit",
      desc: "WorkManager г‚’дЅїз”ЁгЃ—гЃџгѓђгѓѓг‚Їг‚°гѓ©г‚¦гѓігѓ‰гЃ§гЃ®е®џиЎЊгѓ•г‚Ўг‚¤гѓ«е®Ње…ЁжЂ§з›Јжџ»гЂ‚гѓЌг‚¤гѓ†г‚Јгѓ– NDK гѓђг‚¤гѓЉгѓЄгЃ® CRC32 гѓЃг‚§гѓѓг‚Їг‚µгѓ г‚’з®—е‡єгЃ—гЂЃж”№гЃ–г‚“г‚’гѓЄг‚ўгѓ«г‚їг‚¤гѓ гЃ«ж¤њзџҐгЃ—гЃѕгЃ™гЂ‚"
    },
    {
      title: "г‚Єгѓігѓ‡гѓђг‚¤г‚№гѓ»г‚µгѓігѓ‰гѓњгѓѓг‚Їг‚№гЃЁеЂ‹дєєжѓ…е ±дїќи­·жі•",
      desc: "еЂ‹дєєгѓ‡гѓјг‚їдїќи­·жі•гЃ«е®Ње…Ёжє–ж‹ гЂ‚йџіеЈ°гЂЃиЁйЊІгЂЃгѓ†г‚­г‚№гѓ€гЃ®гѓ­г‚°гЃЇгѓ‡гѓђг‚¤г‚№гЃ® RAM дёЉгЃ§гЃ®гЃїе‡¦зђ†гЃ•г‚ЊгЂЃг‚µгѓјгѓђгѓјгЃ«йЂЃдїЎгЃ•г‚Њг‚‹гЃ“гЃЁгЃЇгЃ‚г‚ЉгЃѕгЃ›г‚“гЂ‚"
    }
  ]
};

const FEATURE_ICONS = [
  <Lock className="w-5 h-5 text-[#3B82F6]" />,
  <Shield className="w-5 h-5 text-[#3B82F6]" />,
  <RefreshCw className="w-5 h-5 text-[#3B82F6]" />,
  <Eye className="w-5 h-5 text-[#3B82F6]" />
];

type ScanState = "idle" | "active" | "exiting";

interface SecurityCardProps {
  feat: { icon: React.ReactNode; title: string; desc: string };
  className: string;
  ecoMode: boolean;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ feat, className, ecoMode }) => {
  const [scan, setScan] = React.useState<ScanState>("idle");
  const scanning = !ecoMode && scan !== "idle";

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-md bg-[#0A0A0B]/95 border border-white/[0.04] hover:border-[#3B82F6]/40 transition-all duration-300 group flex gap-5 overflow-hidden ${className}`}
      onMouseEnter={() => { if (!ecoMode) setScan("active"); }}
      onMouseLeave={() => {
        if (!ecoMode) setScan((s) => (s === "active" ? "exiting" : s));
      }}
    >
      {/* Single scan stripe: slow infinite sweep on hover; on leave the SAME
          stripe accelerates from its current position and exits */}
      {scanning && (
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none overflow-hidden rounded-md">
          <motion.div
            className="absolute left-0 w-full h-[2px]"
            style={{
              background: "linear-gradient(to right, transparent, rgba(59,130,246,0.5), transparent)",
              boxShadow: "0 0 10px rgba(59,130,246,0.35)",
            }}
            animate={scan === "active" ? { top: ["-12%", "102%"] } : { top: "102%" }}
            transition={
              scan === "active"
                ? { duration: 4.5, ease: "linear", repeat: Infinity }
                : { duration: 0.2, ease: "easeIn" }
            }
            onAnimationComplete={() => {
              if (scan === "exiting") setScan("idle");
            }}
          />
        </div>
      )}
      <div className="w-10 h-10 rounded-md bg-[#12141A] flex items-center justify-center border border-[#3B82F6]/10 shrink-0 group-hover:border-[#3B82F6]/30 transition-all duration-300">
        {feat.icon}
      </div>
      <div>
        <h3 className="font-display font-bold text-base sm:text-lg text-[#F5F5F0] mb-2 group-hover:text-[#3B82F6] transition-all duration-300 group-hover:appsec-glitch">
          {feat.title}
        </h3>
        <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">
          {feat.desc}
        </p>
      </div>
    </div>
  );
};

const AppSecuritySection = React.memo(function AppSecuritySection() {
  const { t } = useTranslation();
  const { ecoMode } = useEcoMode();

  const title = t.security.title;
  const subtitle = t.security.subtitle;
  const badgeText = t.security.badge;
  const complianceLabel = t.security.complianceLabel;
  const complianceText = t.security.complianceText;

  const currentFeatures = t.security.features || [];
  const securityFeatures = currentFeatures.map((feat: any, index: number) => ({
    icon: FEATURE_ICONS[index] || FEATURE_ICONS[0],
    title: feat.title,
    desc: feat.desc,
  }));

  return (
    <section 
      className="relative w-full pt-8 pb-16 sm:pt-10 sm:pb-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B]" 
      id="app-security"
    >
      {/* Background soft tech visual accents */}
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#3B82F6]/[0.02] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.02)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16 sm:mb-24"
          initial={ecoMode ? false : { opacity: 0, y: 16 }}
          whileInView={ecoMode ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <SectionBadge variant="brackets" label={badgeText} className="mb-6" />
          
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {title}
          </h2>
          
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Feature grid with clean layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {securityFeatures.map((feat, index) => (
            <motion.div
              key={index}
              initial={ecoMode ? false : { opacity: 0, y: 16 }}
              whileInView={ecoMode ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.2), ease: "easeOut" }}
              className={index === 3 ? "md:col-span-3" : ""}
            >
              <SecurityCard
                feat={feat}
                ecoMode={ecoMode}
                className=""
              />
            </motion.div>
          ))}
        </div>

        {/* Technical Architecture Info Row */}
        <div className="mt-16 p-6 rounded-md border border-[#3B82F6]/15 bg-[#090F1B]/40 backdrop-blur-md max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-[#3B82F6]/10 flex items-center justify-center shrink-0 border border-[#3B82F6]/20">
            <AlertCircle className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div className="text-center sm:text-left">
            <h4 className="font-mono text-xs font-bold text-[#F5F5F0] uppercase tracking-wider mb-1">
              {complianceLabel}
            </h4>
            <p className="font-sans text-[11px] sm:text-xs text-gray-400 leading-relaxed">
              {complianceText}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
});

export default AppSecuritySection;
