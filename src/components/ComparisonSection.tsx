import React from "react";
import { Sparkles, ArrowLeft, Send, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { LanguageCode } from "../i18n/languages";
import { motion } from "motion/react";

const LOCAL_COMP_DICT: Record<LanguageCode, Record<string, string>> = {
  ru: {
    backToMain: "РќР°Р·Р°Рґ РЅР° Р“Р»Р°РІРЅСѓСЋ",
    targetIndicator: "рџЋЇ С†РµР»РµРІРѕР№ РѕСЂРёРµРЅС‚РёСЂ",
    roadmapInfo: "TrustNode (TN1) вЂ” С„Р°РєС‚РёС‡РµСЃРєРё РіРѕС‚РѕРІС‹Р№ MVP РјРѕР±РёР»СЊРЅРѕРіРѕ РїСЂРёР»РѕР¶РµРЅРёСЏ. РќРѕРІС‹Рµ РјРѕРґСѓР»Рё (TN3, KIRA) РЅР°С…РѕРґСЏС‚СЃСЏ РІ Р°РєС‚РёРІРЅРѕРј Р±СЌРєР»РѕРіРµ СЂР°Р·СЂР°Р±РѕС‚РєРё.",
    presetRf: "РЎСЂР°РІРЅРёС‚СЊ СЃ Р»РёРґРµСЂРѕРј Р Р¤-СЂС‹РЅРєР°",
    presetNiche: "РЎСЂР°РІРЅРёС‚СЊ СЃ РЅРёС€РµРІС‹РјРё AI-РґРµС‚РµРєС‚РѕСЂР°РјРё",
    kasperskyBadge: "вљЎ RU-Р»РёРґРµСЂ"
  },
  en: {
    backToMain: "Back to Main",
    targetIndicator: "рџЋЇ target indicator",
    roadmapInfo: "TrustNode (TN1) is a ready mobile application MVP. Next-gen modules (TN3, KIRA) are in active roadmap development.",
    presetRf: "Compare with RU market leader",
    presetNiche: "Compare with niche AI detectors",
    kasperskyBadge: "вљЎ RU leader"
  },
  es: {
    backToMain: "Volver al Inicio",
    targetIndicator: "рџЋЇ indicador objetivo",
    roadmapInfo: "TrustNode (TN1) es un MVP de aplicaciГіn mГіvil listo. Los mГіdulos de prГіxima generaciГіn (TN3, KIRA) se encuentran en desarrollo activo.",
    presetRf: "Comparar con lГ­der del mercado RU",
    presetNiche: "Comparar con detectores IA especializados",
    kasperskyBadge: "вљЎ LГ­der RU"
  },
  zh: {
    backToMain: "иї”е›ћдё»йЎµ",
    targetIndicator: "рџЋЇ ж ёеїѓи§„е€’жЊ‡ж ‡",
    roadmapInfo: "TrustNode (TN1) з§»еЉЁеє”з”Ё MVP е·Іе°±з»ЄгЂ‚дё‹дёЂд»ЈйІжЉ¤зЅ©пј€TN3гЂЃKIRAпј‰ж­Је¤„дєЋжґ»и·ѓејЂеЏ‘и®Ўе€’дё­гЂ‚",
    presetRf: "дёЋдї„зЅ—ж–Їеё‚ењєйў†еЇјиЂ…еЇ№жЇ”",
    presetNiche: "дёЋе°Џдј—AIжЈЂжµ‹е™ЁеЇ№жЇ”",
    kasperskyBadge: "вљЎ дї„её‚ењєйў†еЇјиЂ…"
  },
  tr: {
    backToMain: "Ana Sayfaya DГ¶n",
    targetIndicator: "рџЋЇ hedef gГ¶sterge",
    roadmapInfo: "TrustNode (TN1) mobil uygulama MVP'si hazД±r durumdadД±r. Yeni nesil modГјller (TN3, KIRA) aktif geliЕџtirme planД±ndadД±r.",
    presetRf: "RU pazar lideriyle karЕџД±laЕџtД±r",
    presetNiche: "NiЕџ AI dedektГ¶rleriyle karЕџД±laЕџtД±r",
    kasperskyBadge: "вљЎ RU lideri"
  },
  hi: {
    backToMain: "а¤®аҐЃа¤–аҐЌа¤Ї а¤ЄаҐѓа¤·аҐЌа¤  а¤Єа¤° а¤µа¤ѕа¤Єа¤ё",
    targetIndicator: "рџЋЇ а¤Іа¤•аҐЌа¤·а¤їа¤¤ а¤ёа¤‚а¤•аҐ‡а¤¤а¤•",
    roadmapInfo: "TrustNode (TN1) а¤Џа¤• а¤¤аҐ€а¤Їа¤ѕа¤° а¤®аҐ‹а¤¬а¤ѕа¤‡а¤І а¤Џа¤ЄаҐЌа¤ІаҐЂа¤•аҐ‡а¤¶а¤Ё MVP а¤№аҐ€аҐ¤ а¤…а¤—а¤ІаҐЂ а¤ЄаҐЂа¤ўа¤јаҐЂ а¤•аҐ‡ а¤®аҐ‰а¤ЎаҐЌа¤ЇаҐ‚а¤І (TN3, KIRA) а¤ёа¤•аҐЌа¤°а¤їа¤Ї а¤µа¤їа¤•а¤ѕа¤ё а¤°аҐ‹а¤Ўа¤®аҐ€а¤Є а¤®аҐ‡а¤‚ а¤№аҐ€а¤‚аҐ¤",
    presetRf: "RU а¤¬а¤ѕа¤ња¤ја¤ѕа¤° а¤ЁаҐ‡а¤¤а¤ѕ а¤ёаҐ‡ а¤¤аҐЃа¤Іа¤Ёа¤ѕ а¤•а¤°аҐ‡а¤‚",
    presetNiche: "а¤µа¤їа¤¶а¤їа¤·аҐЌа¤џ AI а¤Ўа¤їа¤џаҐ‡а¤•аҐЌа¤џа¤° а¤ёаҐ‡ а¤¤аҐЃа¤Іа¤Ёа¤ѕ а¤•а¤°аҐ‡а¤‚",
    kasperskyBadge: "вљЎ RU а¤ЁаҐ‡а¤¤а¤ѕ"
  },
  ar: {
    backToMain: "Ш§Щ„Ш№Щ€ШЇШ© Щ„Щ„Ш±Ш¦ЩЉШіЩЉШ©",
    targetIndicator: "рџЋЇ Ш§Щ„Щ…Ш¤ШґШ± Ш§Щ„Щ…ШіШЄЩ‡ШЇЩЃ",
    roadmapInfo: "ШЄШ·ШЁЩЉЩ‚ TrustNode (TN1) Ш¬Ш§Щ‡ШІ ЩѓШҐШµШЇШ§Ш± MVP. Ш§Щ„Щ€Ш­ШЇШ§ШЄ Ш§Щ„Щ†Щ‚ШЇЩЉШ© Ш§Щ„ШЄШ§Щ„ЩЉШ© (TN3, KIRA) ЩЃЩЉ Щ…Ш±Ш­Щ„Ш© Ш§Щ„ШЄШ·Щ€ЩЉШ± Ш§Щ„Щ†ШґШ· Ш­Ш§Щ„ЩЉШ§Щ‹.",
    presetRf: "Щ…Щ‚Ш§Ш±Щ†Ш© Щ…Ш№ ШіЩ€Щ‚ RU Ш§Щ„Ш±Ш§Ш¦ШЇ",
    presetNiche: "Щ…Щ‚Ш§Ш±Щ†Ш© Щ…Ш№ ЩѓШ§ШґЩЃШ§ШЄ AI Ш§Щ„Щ…ШЄШ®ШµШµШ©",
    kasperskyBadge: "вљЎ Ш±Ш§Ш¦ШЇ RU"
  },
  pt: {
    backToMain: "Voltar para Principal",
    targetIndicator: "рџЋЇ indicador-alvo",
    roadmapInfo: "O TrustNode (TN1) Г© um MVP de aplicativo mГіvel pronto. Os novos mГіdulos (TN3, KIRA) estГЈo em desenvolvimento ativo.",
    presetRf: "Comparar com lГ­der do mercado RU",
    presetNiche: "Comparar com detectores IA especializados",
    kasperskyBadge: "вљЎ LГ­der RU"
  },
  fr: {
    backToMain: "Retour Г  l'Accueil",
    targetIndicator: "рџЋЇ indicateur cible",
    roadmapInfo: "TrustNode (TN1) est un MVP d'application mobile opГ©rationnel. Les modules de nouvelle gГ©nГ©ration (TN3, KIRA) sont en cours de dГ©veloppement.",
    presetRf: "Comparer avec le leader du marchГ© RU",
    presetNiche: "Comparer avec les dГ©tecteurs IA spГ©cialisГ©s",
    kasperskyBadge: "вљЎ Leader RU"
  },
  de: {
    backToMain: "ZurГјck zur Hauptseite",
    targetIndicator: "рџЋЇ Zielindikator",
    roadmapInfo: "TrustNode (TN1) ist ein fertiges mobiles MVP. Die Module der nГ¤chsten Generation (TN3, KIRA) befinden sich in der aktiven Entwicklung.",
    presetRf: "Mit RU-MarktfГјhrer vergleichen",
    presetNiche: "Mit Nischen-AI-Detektoren vergleichen",
    kasperskyBadge: "вљЎ RU-FГјhrer"
  },
  ja: {
    backToMain: "гѓЎг‚¤гѓігЃ«ж€»г‚‹",
    targetIndicator: "рџЋЇ й–‹з™єз›®жЁ™жЊ‡жЁ™",
    roadmapInfo: "TrustNode (TN1) гЃЇе®џз”ЁеЏЇиѓЅгЃЄгѓўгѓђг‚¤гѓ«г‚ўгѓ—гѓЄMVPгЃ§гЃ™гЂ‚ж¬Ўдё–д»Јгѓўг‚ёгѓҐгѓјгѓ«пј€TN3гЂЃKIRAпј‰гЃЇгѓ­гѓјгѓ‰гѓћгѓѓгѓ—гЃ«еѕ“гЃ„гЂЃзЏѕењЁжґ»з™єгЃ«й–‹з™єдё­гЃ§гЃ™гЂ‚",
    presetRf: "RUеё‚е ґгѓЄгѓјгѓЂгѓјгЃЁжЇ”ијѓ",
    presetNiche: "гѓ‹гѓѓгѓЃAIж¤ње‡єе™ЁгЃЁжЇ”ијѓ",
    kasperskyBadge: "вљЎ RUгѓЄгѓјгѓЂгѓј"
  }
};

const COMPETITORS = [
  { id: "kaspersky", name: "Kaspersky", priceRu: "РѕС‚ ~1990в‚Ѕ/РіРѕРґ", priceEn: "from ~$19.99/yr" },
  { id: "norton", name: "Norton", priceRu: "РѕС‚ ~2990в‚Ѕ/РіРѕРґ", priceEn: "from ~$39.99/yr" },
  { id: "bitdefender", name: "Bitdefender", priceRu: "РѕС‚ ~2490в‚Ѕ/РіРѕРґ", priceEn: "from ~$29.99/yr" },
  { id: "googleSpam", name: "Google Protection", priceRu: "Р‘РµСЃРїР»Р°С‚РЅРѕ", priceEn: "Free" },
  { id: "truecaller", name: "Truecaller", priceRu: "РѕС‚ ~990в‚Ѕ/РіРѕРґ", priceEn: "from ~$29.99/yr" },
  { id: "malwarebytes", name: "Malwarebytes", priceRu: "РѕС‚ ~2490в‚Ѕ/РіРѕРґ", priceEn: "from ~$39.99/yr" },
  { id: "adguard", name: "AdGuard", priceRu: "РѕС‚ ~1290в‚Ѕ/РіРѕРґ", priceEn: "from ~$19.99/yr" },
  { id: "avast", name: "Avast Security", priceRu: "РѕС‚ ~1890в‚Ѕ/РіРѕРґ", priceEn: "from ~$29.99/yr" },
  { id: "yandex", name: "РЇРЅРґРµРєСЃ РћРїСЂРµРґРµР»РёС‚РµР»СЊ", priceRu: "Р‘РµСЃРїР»Р°С‚РЅРѕ", priceEn: "Free" },
  { id: "mcafee", name: "McAfee Security", priceRu: "РѕС‚ ~2490в‚Ѕ/РіРѕРґ", priceEn: "from ~$39.99/yr" },
  { id: "lookout", name: "Lookout Safety", priceRu: "РѕС‚ ~1890в‚Ѕ/РіРѕРґ", priceEn: "from ~$29.99/yr" },
  { id: "getcontact", name: "Getcontact", priceRu: "РѕС‚ ~1490в‚Ѕ/РіРѕРґ", priceEn: "from ~$19.99/yr" },
  { id: "phishbowl", name: "Phishbowl", priceRu: "Р‘РµСЃРїР»Р°С‚РЅРѕ / Pro-РїРѕРґРїРёСЃРєР°", priceEn: "Free / Pro subscription" }
];

const SELECT_LABELS: Record<LanguageCode, string> = {
  ru: "Р’С‹Р±РµСЂРёС‚Рµ РїСЂРѕРґСѓРєС‚С‹ РґР»СЏ СЃСЂР°РІРЅРµРЅРёСЏ СЃ TrustNode (Р°РєС‚РёРІРЅРѕ РґРѕ 4 РѕРґРЅРѕРІСЂРµРјРµРЅРЅРѕ):",
  en: "Select products to compare with TrustNode (up to 4 active simultaneously):",
  es: "Seleccione productos para comparar con TrustNode (hasta 4 activos a la vez):",
  zh: "йЂ‰ж‹©дёЋ TrustNode еЇ№жЇ”зљ„зњџе®ће®‰е…Ёдє§е“Ѓпј€еђЊж—¶жњЂе¤љйЂ‰ж‹© 4 дёЄпј‰пјљ",
  tr: "TrustNode ile karЕџД±laЕџtД±rmak iГ§in ГјrГјnleri seГ§in (en fazla 4 adet):",
  hi: "TrustNode а¤•аҐ‡ а¤ёа¤ѕа¤Ґ а¤¤аҐЃа¤Іа¤Ёа¤ѕ а¤•а¤°а¤ЁаҐ‡ а¤•аҐ‡ а¤Іа¤їа¤Џ а¤‰а¤¤аҐЌа¤Єа¤ѕа¤¦аҐ‹а¤‚ а¤•а¤ѕ а¤ља¤Їа¤Ё а¤•а¤°аҐ‡а¤‚ (а¤Џа¤• а¤¬а¤ѕа¤° а¤®аҐ‡а¤‚ 4 а¤¤а¤•):",
  ar: "Ш§Ш®ШЄШ± Ш§Щ„Щ…Щ†ШЄШ¬Ш§ШЄ Щ„Щ„Щ…Щ‚Ш§Ш±Щ†Ш© Щ…Ш№ TrustNode (ШЁШ­ШЇ ШЈЩ‚ШµЩ‰ 4 ЩЃЩЉ Щ€Щ‚ШЄ Щ€Ш§Ш­ШЇ):",
  pt: "Selecione produtos para comparar com TrustNode (atГ© 4 por vez):",
  fr: "SГ©lectionnez les produits Г  comparer avec TrustNode (jusqu'Г  4 Г  la fois):",
  de: "WГ¤hlen Sie Produkte zum Vergleich mit TrustNode aus (bis zu 4 gleichzeitig):",
  ja: "TrustNodeгЃЁжЇ”ијѓгЃ™г‚‹г‚»г‚­гѓҐгѓЄгѓ†г‚ЈиЈЅе“Ѓг‚’йЃёжЉћпј€еђЊж™‚гЃ«жњЂе¤§4гЃ¤гЃѕгЃ§пј‰пјљ"
};

const SELECT_LABELS_SINGLE: Record<LanguageCode, string> = {
  ru: "Р’С‹Р±РµСЂРёС‚Рµ РѕРґРёРЅ РїСЂРѕРґСѓРєС‚ РґР»СЏ СЃСЂР°РІРЅРµРЅРёСЏ 1-РЅР°-1 СЃ TrustNode:",
  en: "Select one product to compare 1-on-1 with TrustNode:",
  es: "Seleccione un producto para comparar 1 a 1 con TrustNode:",
  zh: "йЂ‰ж‹© 1 дёЄдёЋ TrustNode иї›иЎЊ 1еЇ№1 еЇ№жЇ”зљ„дє§е“Ѓпјљ",
  tr: "TrustNode ile 1-on-1 karЕџД±laЕџtД±rmak iГ§in bir ГјrГјn seГ§in:",
  hi: "TrustNode а¤•аҐ‡ а¤ёа¤ѕа¤Ґ 1-on-1 а¤¤аҐЃа¤Іа¤Ёа¤ѕ а¤•а¤°а¤ЁаҐ‡ а¤•аҐ‡ а¤Іа¤їа¤Џ а¤Џа¤• а¤‰а¤¤аҐЌа¤Єа¤ѕа¤¦ а¤љаҐЃа¤ЁаҐ‡а¤‚:",
  ar: "Ш§Ш®ШЄШ± Щ…Щ†ШЄШ¬Щ‹Ш§ Щ€Ш§Ш­ШЇЩ‹Ш§ Щ„Щ„Щ…Щ‚Ш§Ш±Щ†Ш© 1 Щ„ЩЂ 1 Щ…Ш№ TrustNode:",
  pt: "Selecione um produto para comparar 1 a 1 com TrustNode:",
  fr: "SГ©lectionnez un produit Г  comparer 1-Г -1 avec TrustNode:",
  de: "WГ¤hlen Sie ein Produkt fГјr den 1-zu-1-Vergleich mit TrustNode aus:",
  ja: "TrustNodeгЃЁ1еЇѕ1гЃ§жЇ”ијѓгЃ™г‚‹иЈЅе“Ѓг‚’1гЃ¤йЃёжЉћгЃ—гЃ¦гЃЏгЃ гЃ•гЃ„пјљ"
};

const MODE_LABELS: Record<string, { label: string; multi: string; single: string }> = {
  ru: {
    label: "Р РµР¶РёРј СЃСЂР°РІРЅРµРЅРёСЏ:",
    multi: "РњСѓР»СЊС‚Рё-СЃСЂР°РІРЅРµРЅРёРµ (РґРѕ 4)",
    single: "РЎСЂР°РІРЅРёС‚СЊ 1-РЅР°-1 (С‚РѕР»СЊРєРѕ 1)"
  },
  en: {
    label: "Comparison Mode:",
    multi: "Multi-compare (up to 4)",
    single: "1-on-1 Compare (only 1)"
  },
  es: {
    label: "Modo de comparaciГіn:",
    multi: "ComparaciГіn mГєltiple (hasta 4)",
    single: "Comparar 1 a 1 (solo 1)"
  },
  zh: {
    label: "еЇ№жЇ”жЁЎејЏпјљ",
    multi: "е¤љй‡ЌеЇ№жЇ”пј€жњЂе¤љ 4 дёЄпј‰",
    single: "1еЇ№1еЇ№жЇ”пј€д»…йЂ‰ 1 дёЄпј‰"
  },
  tr: {
    label: "KarЕџД±laЕџtД±rma Modu:",
    multi: "Г‡oklu KarЕџД±laЕџtД±rma (4'e kadar)",
    single: "1-on-1 KarЕџД±laЕџtД±rma (sadece 1)"
  },
  hi: {
    label: "а¤¤аҐЃа¤ІРЅР° а¤®аҐ‹а¤Ў:",
    multi: "а¤¬а¤№аҐЃ-а¤¤аҐЃа¤ІРЅР° (4 а¤¤а¤•)",
    single: "1-on-1 а¤¤аҐЃа¤Іа¤Ёа¤ѕ (а¤•аҐ‡а¤µа¤І 1)"
  },
  ar: {
    label: "Щ€Ш¶Ш№ Ш§Щ„Щ…Щ‚Ш§Ш±Щ†Ш©:",
    multi: "Щ…Щ‚Ш§Ш±Щ†Ш© Щ…ШЄШ№ШЇШЇШ© (Ш­ШЄЩ‰ 4)",
    single: "Щ…Щ‚Ш§Ш±Щ†Ш© 1 Щ„ЩЂ 1 (Щ€Ш§Ш­ШЇ ЩЃЩ‚Ш·)"
  },
  pt: {
    label: "Modo de ComparaГ§ГЈo:",
    multi: "Multi-comparaГ§ГЈo (atГ© 4)",
    single: "Comparar 1 a 1 (apenas 1)"
  },
  fr: {
    label: "Mode de comparaison:",
    multi: "Multi-comparaison (jusqu'Г  4)",
    single: "Comparer 1-Г -1 (seulement 1)"
  },
  de: {
    label: "Vergleichsmodus:",
    multi: "Mehrfachvergleich (bis zu 4)",
    single: "1-zu-1-Vergleich (nur 1)"
  },
  ja: {
    label: "жЇ”ијѓгѓўгѓјгѓ‰пјљ",
    multi: "гѓћгѓ«гѓЃжЇ”ијѓпј€жњЂе¤§4гЃ¤пј‰",
    single: "1еЇѕ1жЇ”ијѓпј€1гЃ¤гЃ®гЃїпј‰"
  }
};

const COMPARISON_DATA = [
  {
      key: "textAnalysis",
    trustNode: "yes",
    kaspersky: "yes",
    norton: "yes",
    bitdefender: "yes",
    googleSpam: "yes",
    truecaller: "yes",
    malwarebytes: "yes",
    adguard: "yes",
    avast: "yes",
    yandex: "yes",
    mcafee: "yes",
    lookout: "yes",
    getcontact: "yes",
    phishbowl: "yes"
  },
  {
      key: "voiceAnalysis",
    trustNode: "target",
    kaspersky: "no",
    norton: "no",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "no",
    adguard: "no",
    avast: "no",
    yandex: "no",
    mcafee: "no",
    lookout: "no",
    getcontact: "no",
    phishbowl: "no"
  },
  {
      key: "visualAnalysis",
    trustNode: "yes",
    kaspersky: "yes",
    norton: "yes",
    bitdefender: "yes",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "yes",
    adguard: "yes",
    avast: "yes",
    yandex: "no",
    mcafee: "yes",
    lookout: "yes",
    getcontact: "no",
    phishbowl: "no"
  },
  {
      key: "socialEngDetect",
    trustNode: "yes",
    kaspersky: "no",
    norton: "no",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "no",
    adguard: "no",
    avast: "no",
    yandex: "no",
    mcafee: "no",
    lookout: "no",
    getcontact: "no",
    phishbowl: "no"
  },
  {
      key: "behavioralRasp",
    trustNode: "yes",
    kaspersky: "yes",
    norton: "yes",
    bitdefender: "yes",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "yes",
    adguard: "no",
    avast: "yes",
    yandex: "no",
    mcafee: "yes",
    lookout: "yes",
    getcontact: "no",
    phishbowl: "no"
  },
  {
      key: "familyDefense",
    trustNode: "yes",
    kaspersky: "yes",
    norton: "yes",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "no",
    adguard: "no",
    avast: "yes",
    yandex: "no",
    mcafee: "yes",
    lookout: "yes",
    getcontact: "no",
    phishbowl: "no"
  },
  {
      key: "beaconSystem",
    trustNode: "yes",
    kaspersky: "no",
    norton: "no",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "no",
    adguard: "no",
    avast: "no",
    yandex: "no",
    mcafee: "no",
    lookout: "no",
    getcontact: "no",
    phishbowl: "no"
  },
  {
      key: "offlineOnDevice",
    trustNode: "yes",
    kaspersky: "no",
    norton: "no",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "no",
    adguard: "yes",
    avast: "no",
    yandex: "no",
    mcafee: "no",
    lookout: "no",
    getcontact: "no",
    phishbowl: "no"
  },
  {
    key: "unifiedScore",
    trustNode: "target",
    kaspersky: "no",
    norton: "no",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "no",
    adguard: "no",
    avast: "no",
    yandex: "no",
    mcafee: "no",
    lookout: "no",
    getcontact: "no",
    phishbowl: "no"
  },
  {
    key: "scamCategorization",
    trustNode: "target",
    kaspersky: "no",
    norton: "no",
    bitdefender: "no",
    googleSpam: "no",
    truecaller: "no",
    malwarebytes: "yes",
    adguard: "no",
    avast: "no",
    yandex: "no",
    mcafee: "no",
    lookout: "no",
    getcontact: "no",
    phishbowl: "yes"
  }
];

export default function ComparisonSection() {
  const { t, language } = useTranslation();
  const { navigateTo } = useNavigation();

  const cp = t.comparisonPage;
  const localComp = LOCAL_COMP_DICT[language] || LOCAL_COMP_DICT.en;

  const [comparisonMode, setComparisonMode] = React.useState<"multi" | "single">("multi");
  const [selectedCompIds, setSelectedCompIds] = React.useState<string[]>([
    "kaspersky",
    "truecaller",
    "googleSpam",
    "yandex"
  ]);

  const handleModeChange = (mode: "multi" | "single") => {
    setComparisonMode(mode);
    if (mode === "single") {
      setSelectedCompIds([selectedCompIds[0] || "kaspersky"]);
    }
  };

  const toggleCompetitor = (id: string) => {
    if (comparisonMode === "single") {
      setSelectedCompIds([id]);
    } else {
      if (selectedCompIds.includes(id)) {
        if (selectedCompIds.length > 1) {
          setSelectedCompIds(selectedCompIds.filter(cid => cid !== id));
        }
      } else {
        if (selectedCompIds.length < 4) {
          setSelectedCompIds([...selectedCompIds, id]);
        } else {
          setSelectedCompIds([...selectedCompIds.slice(1), id]);
        }
      }
    }
  };

  const getPrice = (compId: string) => {
    const comp = COMPETITORS.find(c => c.id === compId);
    if (!comp) return "";
    return language === "ru" ? comp.priceRu : comp.priceEn;
  };

  const renderCellStatus = (statusValue: string) => {
    if (statusValue === "yes") {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] sm:text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{cp.status.yes}</span>
          </div>
        </motion.div>
      );
    }
    if (statusValue === "no") {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] sm:text-xs">
            <XCircle className="w-3.5 h-3.5" />
            <span>{cp.status.no}</span>
          </div>
        </motion.div>
      );
    }
    if (statusValue === "inDev") {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[10px] sm:text-xs">
            <HelpCircle className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
            <span>{cp.status.inDev}</span>
          </div>
        </motion.div>
      );
    }
    if (statusValue === "target") {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-dashed border-blue-400/40 text-blue-400 font-mono text-[10px] sm:text-xs target-pulse">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>{localComp.targetIndicator}</span>
          </div>
        </motion.div>
      );
    }

    return <span className="text-gray-400 font-sans text-xs">{statusValue}</span>;
  };

  return (
    <div className="relative w-full min-h-screen pt-8 pb-16 px-4 flex flex-col items-center justify-start bg-[#0A0A0B] overflow-hidden select-none" id="comparison-root">
      {/* Dynamic ambient layout grids */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto flex flex-col relative z-10">
        
        {/* Go back header */}
        <button 
          onClick={() => navigateTo("home")}
          className="self-start mb-8 font-mono text-xs text-gray-500 hover:text-[#3B82F6] flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/[0.04] bg-white/[0.02] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{localComp.backToMain}</span>
        </button>

        {/* Badge */}
        <div className="inline-flex self-center items-center gap-2 px-3 py-1 bg-[#12141A]/40 border border-[#3B82F6]/20 rounded-full mb-4">
          <Sparkles className="w-3 h-3 text-[#3B82F6]" />
          <span className="font-mono text-xs font-bold tracking-[0.18em] text-[#3B82F6] uppercase">
            {cp.badge}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#F5F5F0] text-center tracking-tight mb-4 filter drop-shadow-glow-sm">
          {cp.title}
        </h1>
        <p className="font-sans text-sm sm:text-base text-gray-500 text-center max-w-2xl mx-auto mb-6 leading-relaxed">
          {cp.subtitle}
        </p>

        {/* Product status info box */}
        <div className="max-w-3xl mx-auto mb-8 px-4 py-2.5 rounded-md border border-blue-500/10 bg-blue-500/[0.02] text-center flex items-center justify-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
          <span className="font-sans text-xs text-blue-300 font-medium leading-relaxed">
            {localComp.roadmapInfo}
          </span>
        </div>

        {/* Interactive Selector badges */}
        <div className="w-full mb-8 p-6 border border-[#3C404A]/20 bg-[#12141A] rounded-md">
          {/* Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 pb-5 border-b border-white/[0.04]">
            <span className="font-mono text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-bold">
              {(MODE_LABELS[language] || MODE_LABELS.en).label}
            </span>
            <div className="flex bg-white/[0.02] border border-white/[0.06] p-1 rounded-md">
              <button
                onClick={() => handleModeChange("multi")}
                className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  comparisonMode === "multi"
                    ? "bg-[#3B82F6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {(MODE_LABELS[language] || MODE_LABELS.en).multi}
              </button>
              <button
                onClick={() => handleModeChange("single")}
                className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  comparisonMode === "single"
                    ? "bg-[#3B82F6] text-white shadow-[0_2px_8px_rgba(59,130,246,0.3)]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {(MODE_LABELS[language] || MODE_LABELS.en).single}
              </button>
            </div>
          </div>

          <h4 className="font-mono text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">
            {comparisonMode === "single"
              ? (SELECT_LABELS_SINGLE[language] || SELECT_LABELS_SINGLE.en)
              : (SELECT_LABELS[language] || SELECT_LABELS.en)}
          </h4>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={() => { setComparisonMode("single"); setSelectedCompIds(["kaspersky"]); }}
              className="px-3 py-1.5 rounded-md font-sans text-xs font-semibold border border-dashed border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300 cursor-pointer"
            >
              {localComp.presetRf}
            </button>
            <button
              onClick={() => { setComparisonMode("single"); setSelectedCompIds(["phishbowl"]); }}
              className="px-3 py-1.5 rounded-md font-sans text-xs font-semibold border border-dashed border-violet-500/30 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/50 transition-all duration-300 cursor-pointer"
            >
              {localComp.presetNiche}
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {COMPETITORS.map(comp => {
              const active = selectedCompIds.includes(comp.id);
              return (
                <button
                  key={comp.id}
                  onClick={() => toggleCompetitor(comp.id)}
                  className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold border transition-all duration-300 cursor-pointer ${
                    active
                      ? "bg-[#3B82F6]/15 border-[#3B82F6] text-white shadow-glow-md"
                      : "bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/[0.15] hover:text-gray-200"
                  }`}
                >
                  {comp.name}
                  {comp.id === "kaspersky" && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {localComp.kasperskyBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Container card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full p-4 sm:p-6 border border-[#3C404A]/30 bg-[#12141A] backdrop-blur-md rounded-md overflow-hidden mb-8"
        >
          <div className="w-full overflow-x-auto rounded-md border border-white/[0.04] bg-[#0A0A0B]/50">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="p-4 sm:p-5 font-mono text-xs sm:text-sm font-extrabold text-gray-500 uppercase tracking-wider w-[24%]">
                    {cp.thFeature}
                  </th>
                  <th className="p-4 sm:p-5 font-display font-black text-xs sm:text-sm text-[#3B82F6] uppercase tracking-wider w-[19%] bg-[#3B82F6]/5">
                    {cp.thTrustNode}
                  </th>
                  {selectedCompIds.map(compId => {
                    const comp = COMPETITORS.find(c => c.id === compId);
                    return (
                      <th key={compId} className="p-4 sm:p-5 font-display font-bold text-xs sm:text-sm text-gray-300 uppercase tracking-wider w-[14%]">
                        {comp?.name || compId}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, index) => {
                  const featureName = cp.features[row.key as keyof typeof cp.features] || row.key;
                  return (
                    <tr 
                      key={row.key} 
                      className={`border-b border-white/[0.03] transition-colors hover:bg-white/[0.01] ${
                        index === COMPARISON_DATA.length - 1 ? "border-none" : ""
                      }`}
                    >
                      {/* Feature Label */}
                      <td className="p-4 sm:p-5 font-sans text-xs sm:text-sm font-medium text-gray-300">
                        {featureName}
                      </td>

                      {/* TrustNode */}
                      <td className="p-4 sm:p-5 bg-[#3B82F6]/[0.02] border-x border-[#3B82F6]/10 font-sans">
                        {renderCellStatus(row.trustNode)}
                      </td>

                      {/* Competitors */}
                      {selectedCompIds.map(compId => (
                        <td key={compId} className="p-4 sm:p-5 font-sans">
                          {renderCellStatus(row[compId as keyof typeof row] || "no")}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Pricing Row */}
                <tr className="transition-colors hover:bg-white/[0.01]">
                  <td className="p-4 sm:p-5 font-sans text-xs sm:text-sm font-medium text-gray-300">
                    {cp.features.pricing}
                  </td>
                  <td className="p-4 sm:p-5 bg-[#3B82F6]/[0.02] border-x border-[#3B82F6]/10 font-sans">
                    <span className="text-[#3B82F6] font-sans text-xs font-semibold">{cp.pricingValues.trustNode}</span>
                  </td>
                  {selectedCompIds.map(compId => (
                    <td key={compId} className="p-4 sm:p-5 font-sans">
                      <span className="text-gray-400 font-sans text-xs">{getPrice(compId)}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Disclaimer section */}
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center p-6 sm:p-8 rounded-md border border-[#3C404A]/30 bg-[#12141A] backdrop-blur-md">
          <p className="font-sans text-xs text-gray-500 leading-relaxed mb-6">
            {cp.disclaimer}
          </p>
          <a
            href="https://t.me/TrustNode_team"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#3B82F6] text-white font-sans text-xs font-bold hover:bg-[#3B82F6]/90 transition-all cursor-pointer shadow-glow-md hover:shadow-glow-lg"
          >
            <Send className="w-4 h-4" />
            <span>{cp.telegramBtn}</span>
          </a>
        </div>

      </div>
    </div>
  );
}
