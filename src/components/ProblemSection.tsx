import React, { useState, useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, EyeOff, WifiOff, Phone, ServerOff } from "lucide-react";
import SectionBadge from "./SectionBadge";
import ScanCard from "./ScanCard";
import RevealOnScroll from "./ui/RevealOnScroll";

const ProblemSection = React.memo(function ProblemSection() {
  const { t, language } = useTranslation();

  const SIM_LABELS: Record<string, Record<string, string>> = {
    ru: { call: "ВХОДЯЩИЙ ЗВОНОК", alert: "УГРОЗА ОБНАРУЖЕНА", soc: "Атака соц-инженерии", leak: "УТЕЧКА", messenger: "Телеграм", cloud: "Облако", broken: "СТАНДАРТНАЯ ЗАЩИТА ОТКЛЮЧЕНА" },
    en: { call: "INCOMING CALL", alert: "ALERT DETECTED", soc: "Social Engineering", leak: "OUTFLOW", messenger: "Messenger", cloud: "Cloud Log", broken: "TRADITIONAL SECURITY BROKEN" },
    es: { call: "LLAMADA ENTRANTE", alert: "ALERTA DETECTADA", soc: "Ingeniería social", leak: "FUGA", messenger: "Mensajería", cloud: "Nube Log", broken: "SEGURIDAD TRADICIONAL VULNERADA" },
    zh: { call: "来电显示", alert: "发现威胁", soc: "社交工程攻击", leak: "数据外泄", messenger: "即时通讯", cloud: "云端日志", broken: "传统安全防御失效" },
    tr: { call: "GELEN ARAMA", alert: "TEHDİT ALGILANDI", soc: "Sosyal Mühendislik", leak: "VERİ SIZINTISI", messenger: "Mesajlaşma", cloud: "Bulut Log", broken: "GELENEKSEL GÜVENLİK DEVRE DIŞI" },
    hi: { call: "आने वाली कॉल", alert: "चेतावनी का पता चला", soc: "सामाजिक इंजीनियरिंग", leak: "डेटा लीक", messenger: "मैसेंजर", cloud: "क्लाउड लॉग", broken: "पारंपरिक सुरक्षा विफल" },
    ar: { call: "مكالمة واردة", alert: "تم اكتشاف تهديد", soc: "الهندسة الاجتماعية", leak: "تسريب البيانات", messenger: "المراسلة", cloud: "سجل السحابة", broken: "فشل الأمان التقليدي" },
    pt: { call: "CHAMADA RECEBIDA", alert: "ALERTA DETECTADO", soc: "Engenharia Social", leak: "VAZAMENTO", messenger: "Mensageiro", cloud: "Nuvem Log", broken: "SEGURANÇA TRADICIONAL FALHOU" },
    fr: { call: "APPEL ENTRANT", alert: "ALERTE DÉTECTÉE", soc: "Ingénierie Sociale", leak: "FUITE", messenger: "Messagerie", cloud: "Journal Cloud", broken: "SÉCURITÉ TRADITIONNELLE DÉFAILLANTE" },
    de: { call: "EINGEHENDER ANRUF", alert: "ALARM ERKANNT", soc: "Social Engineering", leak: "DATENABFLUSS", messenger: "Messenger", cloud: "Cloud-Log", broken: "HERKÖMMLICHE SICHERHEIT DEFEKT" },
    ja: { call: "着信", alert: "警告を検知", soc: "ソーシャルエンジニアリング", leak: "データ流出", messenger: "メッセンジャー", cloud: "クラウドログ", broken: "従来のセキュリティ無効化" }
  };
  const sim = SIM_LABELS[language] || SIM_LABELS.en;
  
  // States to drive cool mini-simulations in each panel
  const [incomingCall, setIncomingCall] = useState(true);
  const [dataLeakProgress, setDataLeakProgress] = useState(0);
  const [pingFailed, setPingFailed] = useState(true);

  // Call simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setIncomingCall(prev => !prev);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Data leak progress simulation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setDataLeakProgress(prev => (prev + 1) % 100);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // Offline status check animation loop
  useEffect(() => {
    const timer = setInterval(() => {
      setPingFailed(prev => !prev);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const problems = t.problem.items.map((item, i) => ({
    id: `prob-${i + 1}`,
    title: item.title,
    desc: item.desc,
  }));

  // Accent animated panels, one per problem (kept from the old cards)
  const problemVisuals: React.ReactNode[] = [
    // SOCIAL ENGINEERING CALL SPOOFING
    <div key="v1" className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-white/[0.04] bg-[#12141A] relative flex flex-col justify-between p-4 font-mono">
      <div className="flex justify-between items-center text-[12px] text-gray-500 pb-2 border-b border-white/[0.03]">
        <span>SIM_SLOT_01: ACTIVE</span>
        <span className="text-[#3B82F6] font-bold">LTE</span>
      </div>

      <div className="flex flex-col items-center justify-center my-auto text-center">
        <AnimatePresence mode="wait">
          {incomingCall ? (
            <motion.div
              key="active-call"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-500 animate-pulse">
                <Phone className="w-4 h-4" />
              </div>
              <span className="block text-[14px] font-bold text-red-400 uppercase tracking-widest">{sim.call}</span>
              <span className="block text-sm text-gray-300 font-bold">+7 (495) 900-30-00</span>
              <span className="block text-[11px] text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-white/[0.03]">
                SPOOFED NAME: "SECURITY DEP"
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="call-analysed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-500">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="block text-[13px] font-bold text-amber-400 uppercase tracking-wider">{sim.alert}</span>
              <span className="block text-[13px] text-gray-400">{sim.soc}</span>
              <span className="block text-[12px] text-amber-500 font-bold bg-amber-950/30 px-2.5 py-0.5 rounded border border-amber-500/20">
                PHANTOM LAYER 2 FLAG
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-[11px] text-red-400 font-bold">LIVE STREAM</span>
      </div>
    </div>,

    // PRIVACY LEAKS TO CLOUD SERVERS
    <div key="v2" className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-white/[0.04] bg-[#12141A] relative flex flex-col justify-between p-4 font-mono">
      <div className="flex justify-between items-center text-[12px] text-gray-500">
        <span>SSL_INSPECTOR: TRANSPARENT</span>
        <span className="text-red-400 font-bold">{sim.leak}</span>
      </div>

      <div className="my-auto space-y-4 relative">
        <div className="flex items-center justify-between text-[13px]">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[12px] font-bold">P</div>
            <span className="text-[11px] text-gray-500 mt-1">{sim.messenger}</span>
          </div>

          {/* Progress stream bar */}
          <div className="flex-1 mx-3 h-1.5 bg-white/[0.03] rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-transparent transition-all duration-300"
              style={{ width: `${dataLeakProgress}%` }}
            />
          </div>

          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-[12px]">
              <EyeOff className="w-3 h-3" />
            </div>
            <span className="text-[11px] text-red-500 mt-1 font-bold">{sim.cloud}</span>
          </div>
        </div>

        <div className="text-[12px] text-center text-gray-500 bg-red-950/20 border border-red-500/10 py-1.5 rounded">
          WARNING: PLAIN TEXT TRANSCRIPT UPLOADED
        </div>
      </div>

      <div className="flex justify-between items-center text-[11px] text-gray-600 border-t border-white/[0.03] pt-2">
        <span>PACKETS: TX/RX ENCRYPTED</span>
        <span>KEYS: SERVER-HELD</span>
      </div>
    </div>,

    // INERT / OFFLINE WITHOUT NETWORK
    <div key="v3" className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-white/[0.04] bg-[#12141A] relative flex flex-col justify-between p-4 font-mono">
      <div className="flex justify-between items-center text-[12px] text-gray-500">
        <span>CONN: DISCONNECTED</span>
        <span className="text-red-400 font-bold">OFFLINE</span>
      </div>

      <div className="my-auto flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {pingFailed ? (
            <motion.div
              key="ping-failed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
                <ServerOff className="w-4 h-4" />
              </div>
              <span className="block text-[13px] font-bold text-red-400 uppercase tracking-wider">CLOUD TIMEOUT</span>
              <span className="block text-[12px] text-gray-500">https://api.cloud-antifraud.io</span>
            </motion.div>
          ) : (
            <motion.div
              key="cloud-inert"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-1.5"
            >
              <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
                <WifiOff className="w-4 h-4 animate-bounce" />
              </div>
              <span className="block text-[13px] font-bold text-red-500 uppercase tracking-widest">INERT STATE</span>
              <span className="block text-[11px] text-gray-500 bg-red-950/20 border border-red-500/10 px-2 py-0.5 rounded">
                0% SHIELD COMPILATION
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-[12px] text-center text-red-500 font-bold bg-red-950/20 border border-red-500/15 py-1 rounded uppercase tracking-tighter">
        {sim.broken}
      </div>
    </div>,
  ];

  return (
    <section 
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden" 
      id="problem"
    >
      {/* Background glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <SectionBadge variant="slash" label={t.problem.badge} className="mb-6" />
          
          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.problem.titleLine1} <br className="hidden sm:inline" />
            <span className="text-[#3B82F6]">{t.problem.titleHighlight}</span>
          </h2>
          
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.problem.subtitle}
          </p>
        </div>

        {/* Vertical zigzag: alternating text / accent visual per problem */}
        <div className="flex flex-col">
          {problems.map((problem, i) => (
            <div
              key={problem.id}
              id={problem.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center mb-16 sm:mb-24 last:mb-0"
            >
              {/* Text block */}
              <RevealOnScroll className={i % 2 === 1 ? "md:order-2" : "md:order-1"} delay={i * 0.08}>
                <ScanCard className="h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="font-mono text-6xl sm:text-7xl font-black text-[#3C404A] leading-none select-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className={`h-[2px] flex-1 ${i === 1 ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-[#3B82F6]/40 to-transparent`} />
                  </div>
                  <h3 className="font-display font-medium text-3xl sm:text-4xl text-[#F5F5F0] mb-4 group-hover:text-[#3B82F6] transition-all duration-300">
                    {problem.title}
                  </h3>
                  <p className="font-sans text-sm sm:text-base text-gray-400 leading-relaxed">
                    {problem.desc}
                  </p>
                </ScanCard>
              </RevealOnScroll>

              {/* Accent animated visual */}
              <RevealOnScroll className={i % 2 === 1 ? "md:order-1" : "md:order-2"} delay={i * 0.08 + 0.1}>
                {problemVisuals[i]}
              </RevealOnScroll>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
});

export default ProblemSection;
