import React from "react";
import { ArrowLeft, ShieldCheck, Lock, Cpu, Smartphone } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useNavigation } from "../navigation/NavigationContext";
import { RUSTORE_URL, GITHUB_APK_URL } from "./Header";
import ScanCard from "./ScanCard";

const TRUST_DICT: Record<string, Record<string, string>> = {
  ru: {
    noStoreTitle: "Почему приложения нет в Google Play",
    noStoreText: "TrustNode — специализированное антифрод-решение, поэтому мы распространяем его через RuStore и официальный релиз на GitHub, чтобы быть прозрачными относительно версии и подписи.",
  },
  en: {
    noStoreTitle: "Why is the app not on Google Play",
    noStoreText: "TrustNode is a specialised anti-fraud solution; it is distributed via RuStore and an official GitHub release.",
  },
  es: {
    noStoreTitle: "Por qué la app no está en Google Play",
    noStoreText: "TrustNode es una solución antifraude especializada; por eso se distribuye mediante RuStore y GitHub.",
  },
  zh: {
    noStoreTitle: "为什么应用不在 Google Play",
    noStoreText: "TrustNode 是专门的防欺诈方案，因此通过 RuStore 和 GitHub 官方发布，保持透明。",
  },
  tr: {
    noStoreTitle: "Uygulama neden Google Play'de değil",
    noStoreText: "TrustNode, odaklı bir dolandırıcılık önleme çözümüdür; bu yüzden RuStore ve GitHub üzerinden dağıtılır.",
  },
  hi: {
    noStoreTitle: "ऐप Google Play पर क्यों नहीं है",
    noStoreText: "TrustNode एक विशेष एंटी-फ्रॉड समाधान है, इसलिए इसे RuStore और GitHub से वितरित किया जाता है।",
  },
  ar: {
    noStoreTitle: "لماذا التطبيق غير متوفر على Google Play",
    noStoreText: "TrustNode حل متخصص ضد الاحتيال، لذلك نوزعه عبر RuStore و GitHub.",
  },
  pt: {
    noStoreTitle: "Por que o app não está no Google Play",
    noStoreText: "TrustNode é uma solução antifraude especializada; por isso é distribuída pela RuStore e GitHub.",
  },
  fr: {
    noStoreTitle: "Pourquoi l'app n'est pas sur Google Play",
    noStoreText: "TrustNode est une solution antifraude spécialisée, donc nous le distribuons via GitHub et RuStore.",
  },
  de: {
    noStoreTitle: "Warum ist die App nicht im Google Play Store",
    noStoreText: "TrustNode ist eine spezialisierte Antifraud-Lösung und wird daher über Rustore und GitHub verteilt.",
  },
  ja: {
    noStoreTitle: "アプリが Google Play にない理由",
    noStoreText: "TrustNode は特殊な詐欺対処ソリューションのため、正式なリポジトリと GitHub で配布しています。",
  },
};

export default function EarlyAccessPage() {
  const { t, language } = useTranslation();
  const { navigateTo } = useNavigation();
  const lp = t.earlyAccessPage;
  const trust = TRUST_DICT[language] || TRUST_DICT.en;

  const featureIcons = [Smartphone, Cpu, Lock];
  return (
    <div className="relative w-full min-h-0 py-8 px-4 flex flex-col items-center justify-start bg-[#121212] overflow-hidden select-none" id="download-root">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(62,207,142,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(62,207,142,0.03)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto flex flex-col relative z-10">

        <button onClick={() => navigateTo("home")}
          className="self-start mb-8 font-mono text-xs text-gray-500 hover:text-[#3ecf8e] flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.04] bg-white/[0.02] transition-colors cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lp.back}</span>
        </button>

        <div className="inline-flex self-center items-center gap-2 px-3 py-1 bg-[#242424]/40 border border-[#3ecf8e]/20 rounded-full mb-4">
          <ShieldCheck className="w-3 h-3 text-[#3ecf8e] animate-pulse" />
          <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-[#3ecf8e] uppercase">{lp.badge}</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-5xl text-[#fafafa] text-center tracking-tight mb-4 filter drop-shadow-glow-sm">{lp.title}</h1>
        <p className="font-sans text-sm sm:text-base text-gray-500 text-center max-w-2xl mx-auto mb-12 leading-relaxed">{lp.subtitle}</p>

        <div className="max-w-2xl mx-auto w-full mb-12">
          <ScanCard accent="62,207,142" borderColor="border-[#2e2e2e]/30" cardClassName="bg-[#242424] backdrop-blur-md" className="items-center gap-6">
            <a href={GITHUB_APK_URL} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-full font-sans text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 bg-[#3ecf8e] text-white hover:bg-[#3ecf8e]/90 cursor-pointer shadow-glow-md hover:shadow-glow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {lp.githubBtn}
            </a>
            <a href={RUSTORE_URL} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-full font-sans text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 bg-[#242424] border border-[#3ecf8e]/40 text-gray-200 hover:text-white hover:bg-[#242424] cursor-pointer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              {lp.rustoreBtn}
            </a>
          </ScanCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
          {[lp.feature1Title, lp.feature2Title, lp.feature3Title].map((title, idx) => {
            const Icon = featureIcons[idx];
            const descs = [lp.feature1Desc, lp.feature2Desc, lp.feature3Desc];
            return (
                          <ScanCard key={idx} accent="62,207,142" borderColor="border-[#2e2e2e]/40" cardClassName="bg-[#121212]/80" padding="p-5 sm:p-6">
                <div className="w-11 h-11 rounded-xl bg-[#121212]/80 border border-[#3ecf8e]/25 flex items-center justify-center text-[#3ecf8e] mb-4"><Icon className="w-5 h-5" /></div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#fafafa] mb-2">{title}</h3>
                <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">{descs[idx]}</p>
              </ScanCard>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto w-full mb-12">
          <ScanCard accent="62,207,142" borderColor="border-[#2e2e2e]/40" cardClassName="bg-[#121212]/80" padding="p-6 sm:p-8">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#fafafa] mb-3">{trust.noStoreTitle}</h3>
            <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">{trust.noStoreText}</p>
          </ScanCard>
        </div>

        <p className="font-mono text-sm sm:text-base tracking-normal text-gray-400 text-center">{lp.note}</p>
      </div>
    </div>
  );
}
