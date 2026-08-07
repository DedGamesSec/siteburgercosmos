import React, { useState } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageCode } from "../i18n/languages";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Award, Cpu, Network, FileCode, CheckCircle2, Copy, ExternalLink, Sparkles, Send, AlertTriangle, RefreshCw, AlertCircle, Play, Info, ShieldCheck, Milestone } from "lucide-react";
import { SiTelegram, SiVk, SiGithub } from "react-icons/si";
const SiTelegramIcon = SiTelegram as React.ComponentType<any>;
const SiVkIcon = SiVk as React.ComponentType<any>;
const SiGithubIcon = SiGithub as React.ComponentType<any>;
const base = typeof import.meta !== "undefined" ? import.meta.env.BASE_URL : "/";
const certImg = `${base}real_cert.jpg`;
const certImgWebp = `${base}real_cert.webp`;
const graphImg = `${base}real_obsidian.png`;
const graphImgWebp = `${base}real_obsidian.webp`;

export default function RealDevelopmentSection({ onlyRoadmap = false }: { onlyRoadmap?: boolean }) {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<"awards" | "graph" | "onnx" | "roadmap">(onlyRoadmap ? "roadmap" : "awards");

  const dui = t.realDev.devUi;
  const tTitle = t.realDev.title;
  const tSubtitle = t.realDev.subtitle;
  const tBadge = t.realDev.badge;
  const rmp = t.roadmapPage;

  const displayTitle = onlyRoadmap ? rmp.title : tTitle;
  const displaySubtitle = onlyRoadmap ? rmp.subtitle : tSubtitle;
  const displayBadge = onlyRoadmap ? rmp.badge : tBadge;

  const currentAward = t.realDev.awardDetails;
  const currentGraph = t.realDev.graphDetails;
  const currentOnnx = t.realDev.onnxDetails;

  const onnxConsole = ONNX_DICT[language] || ONNX_DICT.en;

  return (
    <section 
      className="relative w-full py-16 sm:py-20 px-4 border-t border-[#3C404A]/30 bg-[#0A0A0B] overflow-hidden" 
      id="verification"
    >
      {/* Background cyber grid and glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-[#3B82F6]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#3B82F6]/[0.015] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3C404A] border border-[#3B82F6]/20 mb-6">
            <Shield className="w-4.5 h-4.5 text-[#3B82F6]" />
            <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-[#3B82F6] uppercase">
              {displayBadge}
            </span>
          </div>
          
          <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F5F5F0] tracking-tight mb-6">
            {displayTitle}
          </h2>
          
          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {/* Tab Controls */}
        {!onlyRoadmap && (
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-12 max-w-2xl mx-auto p-1 rounded-md bg-[#0A0A0B] border border-[#3C404A]/50">
            <button
              onClick={() => setActiveTab("awards")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeTab === "awards"
                  ? "bg-[#3B82F6] text-white shadow-glow-md"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]"
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{dui.awards}</span>
            </button>
            
            <button
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeTab === "graph"
                  ? "bg-[#3B82F6] text-white shadow-glow-md"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]"
              }`}
            >
              <Network className="w-4 h-4" />
              <span>{dui.graph}</span>
            </button>
            
            <button
              onClick={() => setActiveTab("onnx")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-mono text-xs font-semibold tracking-wide transition-all duration-300 ${
                activeTab === "onnx"
                  ? "bg-[#3B82F6] text-white shadow-glow-md"
                  : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.02]"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{dui.core}</span>
            </button>
          </div>
        )}

        {/* Tab Display Area */}
        <div className="relative w-full">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: AWARDS & CERTIFICATES */}
            {activeTab === "awards" && (
              <motion.div
                key="awards-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
              >
                {/* Visual Certificate Mockup */}
                <div className="lg:col-span-5 relative group overflow-hidden rounded-md border border-[#3C404A]/50 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-80 z-10" />
                  <picture>
                    <source type="image/webp" srcSet={certImgWebp} />
                    <img 
                      src={certImg} 
                      alt="Scientific Certificate" 
                      loading="lazy"
                      className="w-full h-auto object-cover transform group-hover:scale-[1.05] transition-transform duration-300 rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  </picture>
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-[#3C404A]/90 border border-amber-500/30 font-mono text-[9px] font-bold text-amber-500 tracking-wider">
                    {currentAward.badge}
                  </div>
                </div>

                {/* Details Meta Block */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F5F5F0] mb-2">
                      {currentAward.title}
                    </h3>
                    <p className="font-mono text-xs text-[#3B82F6] uppercase tracking-wider mb-4">
                      {currentAward.issuer}
                    </p>
                  </div>

                  <div className="p-6 rounded-md bg-[#0A0A0B]/80 border border-[#3C404A]/40 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-mono text-[10px] text-gray-500 uppercase tracking-widest">{dui.recipient}</span>
                        <span className="font-sans text-sm sm:text-base font-bold text-[#F5F5F0]">{currentAward.recipient}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-mono text-[10px] text-gray-500 uppercase tracking-widest">{dui.inst}</span>
                        <span className="font-sans text-xs sm:text-sm text-gray-300">{currentAward.institution}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3B82F6] shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-mono text-[10px] text-gray-500 uppercase tracking-widest">{dui.event}</span>
                        <span className="font-sans text-xs sm:text-sm text-gray-300">{currentAward.event}</span>
                      </div>
                    </div>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {currentAward.desc}
                  </p>
                </div>
              </motion.div>
            )}

            {/* TAB 2: OBSIDIAN CONNECTION MAP */}
            {activeTab === "graph" && (
              <motion.div
                key="graph-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
              >
                {/* Graph Image Display */}
                <div className="lg:col-span-5 relative group overflow-hidden rounded-md border border-[#3C404A]/50 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-80 z-10" />
                  <picture>
                    <source type="image/webp" srcSet={graphImgWebp} />
                    <img 
                      src={graphImg} 
                      alt="Obsidian Repository Graph" 
                      loading="lazy"
                      className="w-full h-auto object-cover transform group-hover:scale-[1.05] transition-transform duration-300 rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  </picture>
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-[#3C404A]/90 border border-cyan-500/30 font-mono text-[9px] font-bold text-cyan-500 tracking-wider">
                    {currentGraph.badge}
                  </div>
                </div>

                {/* Technical Node Description */}
                <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F5F5F0] mb-2">
                      {currentGraph.title}
                    </h3>
                    <p className="font-mono text-xs text-[#3B82F6] uppercase tracking-wider mb-4">
                      {currentGraph.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-md bg-[#0A0A0B]/80 border border-[#3C404A]/40 text-center">
                      <span className="block font-display font-bold text-2xl sm:text-3xl text-cyan-500">74</span>
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{dui.nodes}</span>
                    </div>
                    
                    <div className="p-4 rounded-md bg-[#0A0A0B]/80 border border-[#3C404A]/40 text-center">
                      <span className="block font-display font-bold text-2xl sm:text-3xl text-[#3B82F6]">328</span>
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">{dui.conns}</span>
                    </div>
                  </div>

                  <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">
                    {currentGraph.desc}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Architecture", "BertPhantomClassifier", "HeuristicsLayer", "ConsensusVoting", "SecurityTests", "VAULT_Egis"].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded bg-[#3C404A] border border-[#3B82F6]/15 font-mono text-[10px] text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: ONNX CORE MODEL */}
            {activeTab === "onnx" && (
              <motion.div
                key="onnx-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Specs & Playground Header */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                  
                  {/* Left Column: Live Model Architecture Inspector Widget */}
                  <div className="lg:col-span-5 p-6 rounded-md bg-[#0A0A0B] border border-[#3C404A]/60 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-[1px] bg-gradient-to-l from-[#3B82F6]/40 to-transparent" />
                    
                    <div>
                      {/* File card header */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3C404A]/40">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded bg-blue-950/40 border border-blue-500/30 text-[#3B82F6]">
                            <FileCode className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block font-mono text-[10px] text-gray-500 tracking-wider">{onnxConsole.consoleRootFile}</span>
                            <span className="font-mono text-xs font-bold text-[#F5F5F0]">{currentOnnx.filename}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-500 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-bold">
                          {currentOnnx.size}
                        </span>
                      </div>

                      {/* Inspector Console */}
                      <div className="space-y-3 font-mono text-[10px] sm:text-xs text-gray-400 bg-black/40 p-4 rounded-md border border-white/[0.02] mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">&gt;_ onnx.checker.check_model()</span>
                          <span className="text-emerald-500">{onnxConsole.consoleSuccess}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">&gt;_ model.graph.input[0]</span>
                          <span className="text-cyan-400">"input_ids" [1, 512]</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">&gt;_ model.graph.output[0]</span>
                          <span className="text-cyan-400">"fraud_logits" [1, 2]</span>
                        </div>
                        <div className="pt-2 border-t border-[#3C404A]/30 flex justify-between items-center text-[9px] text-gray-500">
                          <span>{onnxConsole.consoleQuant}</span>
                          <span>{onnxConsole.consoleCompat}</span>
                        </div>
                      </div>

                      {/* Specifications */}
                      <div className="p-4 rounded-md bg-[#0A0A0B]/80 border border-[#3C404A]/40">
                        <h4 className="font-display font-semibold text-xs text-[#F5F5F0] uppercase tracking-wider mb-3">
                          {dui.specs}
                        </h4>
                        <ul className="space-y-2 font-mono text-[11px] text-gray-400">
                          <li className="flex justify-between">
                            <span>{dui.baseArch}</span>
                            <span className="text-gray-200">RuBERT-tiny2 (DeepPavlov)</span>
                          </li>
                          <li className="flex justify-between">
                            <span>{dui.params}</span>
                            <span className="text-gray-200">{onnxConsole.paramValue}</span>
                          </li>
                          <li className="flex justify-between">
                            <span>{dui.latency}</span>
                            <span className="text-[#3B82F6]">{onnxConsole.latencyValue}</span>
                          </li>
                        </ul>
                      </div>
                    </div>


                  </div>

                  {/* Right Column: Dynamic Neural Tester & Telegram Ticket Portal */}
                  <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-md bg-[#0A0A0B] border border-[#3C404A]/60 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-[1px] bg-gradient-to-l from-[#3B82F6]/40 to-transparent" />
                    
                    <OnnxInteractiveTester language={language} />
                  </div>

                </div>
              </motion.div>
            )}

            {activeTab === "roadmap" && (
              <motion.div
                key="roadmap-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* TN1 Card */}
                  <div className="p-6 rounded-md bg-[#0A0A0B] border border-emerald-500/30 shadow-glow-success relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono text-[10px] sm:text-xs text-emerald-300 uppercase tracking-widest bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                          {rmp.readyMvp}
                        </span>
                        <span className="font-mono text-sm text-gray-300">v1.2.0</span>
                      </div>
                      <h4 className="font-display font-bold text-xl text-white mb-2">TrustNode 1 (TN1)</h4>
                      <p className="font-sans text-sm text-gray-400 leading-relaxed mb-4">
                        {rmp.tn1Desc}
                      </p>
                      <div className="p-3 bg-black/40 rounded-md border border-emerald-500/10 font-mono text-xs text-emerald-300/90 space-y-1 mb-4">
                        <div className="flex justify-between">
                          <span>{rmp.packageLabel}</span>
                          <span className="text-gray-200">com.frauddetector.app</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{rmp.coreEngineLabel}</span>
                          <span className="text-gray-200">Heuristics v1.2</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{rmp.statusLabel}</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {rmp.fullyReady}
                          </span>
                        </div>
                      </div>
                      <a
                        href="https://github.com/TrustNodeLab"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#3C404A] border border-[#3B82F6]/20 hover:border-[#3B82F6]/50 text-gray-400 hover:text-[#3B82F6] transition-all font-mono text-xs font-semibold w-full justify-center"
                      >
                        <SiGithubIcon className="w-3.5 h-3.5" />
                        {rmp.sourceGithub}
                      </a>
                    </div>
                  </div>

                  {/* TN3 / PHANTOM 2.0 Card */}
                  <div className="p-6 rounded-md bg-[#0A0A0B] border border-[#3B82F6]/30 shadow-glow-sm relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono text-[10px] sm:text-xs text-[#6FB1FF] uppercase tracking-widest bg-[#0A0A0B]/60 border border-[#3B82F6]/40 px-2.5 py-0.5 rounded-full">
                          {rmp.underDevelopment}
                        </span>
                        <span className="font-mono text-sm text-gray-300">v2.0-alpha</span>
                      </div>
                      <h4 className="font-display font-bold text-xl text-white mb-2">TrustNode 3 (TN3) / PHANTOM 2.0</h4>
                      <p className="font-sans text-sm text-gray-400 leading-relaxed mb-4">
                        {rmp.tn3Desc}
                      </p>
                      <div className="p-3 bg-black/40 rounded-md border border-[#3B82F6]/10 font-mono text-xs text-gray-200 space-y-1 mb-4">
                        <div className="flex justify-between">
                          <span>{rmp.deadlineLabel}</span>
                          <span className="text-[#6FB1FF] font-bold">{rmp.september2026}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{rmp.phaseLabel}</span>
                          <span className="text-amber-500 font-bold">{rmp.architecturePhase}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KIRA Voice Card */}
                  <div className="p-6 rounded-md bg-[#0A0A0B] border border-amber-500/30 shadow-glow-warn relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono text-[10px] sm:text-xs text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                          {rmp.conceptualSpec}
                        </span>
                        <span className="font-mono text-sm text-gray-300">v3.0-design</span>
                      </div>
                      <h4 className="font-display font-bold text-xl text-white mb-2">Kira Voice Assistant</h4>
                      <p className="font-sans text-sm text-gray-400 leading-relaxed mb-4">
                        {rmp.kiraDesc}
                      </p>
                      <div className="p-3 bg-black/40 rounded-md border border-amber-500/10 font-mono text-xs text-amber-400 space-y-1 mb-4">
                        <div className="flex justify-between">
                          <span>{rmp.statusLabel}</span>
                          <span className="font-bold">{rmp.designPhase}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{rmp.coreComponentLabel}</span>
                          <span className="text-gray-200">Speech-Intent-Core</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{rmp.integrationLabel}</span>
                          <span className="text-gray-200">{rmp.ramAddon}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Disclosure Policy */}
                <div className="p-6 rounded-md bg-[#0A0A0B]/90 border border-emerald-500/20">
                  <div className="flex items-start gap-3 mb-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display font-bold text-base text-white">
                        {rmp.disclosureTitle}
                      </h4>
                      <p className="font-sans text-sm text-gray-400 leading-relaxed mt-2">
                        {rmp.disclosureDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://t.me/TrustNode_team"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Telegram"
                      title="Telegram"
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-md bg-[#12141A] border border-[#3B82F6]/40 text-gray-200 hover:text-white hover:bg-[#12141A] transition-colors font-sans text-xs font-bold"
                    >
                      <SiTelegramIcon className="w-4 h-4 text-[#3B82F6]" />
                      {rmp.reportTelegram}
                    </a>
                    <a
                      href="https://vk.com/trustnode"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="VK"
                      title="VK"
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-md bg-[#12141A] border border-[#3B82F6]/40 text-gray-200 hover:text-white hover:bg-[#12141A] transition-colors font-sans text-xs font-bold"
                    >
                      <SiVkIcon className="w-4 h-4 text-[#3B82F6]" />
                      {rmp.reportVk}
                    </a>
                    <a
                      href="https://github.com/TrustNodeLab/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub"
                      title="GitHub"
                      className="inline-flex items-center justify-center gap-2 min-h-11 px-4 py-2.5 rounded-md bg-[#12141A] border border-[#3B82F6]/40 text-gray-200 hover:text-white hover:bg-[#12141A] transition-colors font-sans text-xs font-bold"
                    >
                      <SiGithubIcon className="w-4 h-4 text-[#3B82F6]" />
                      {rmp.reportGithub}
                    </a>
                  </div>
                </div>

                {/* Release Milestones Timeline */}
                <div className="p-6 rounded-md bg-[#0A0A0B]/90 border border-[#3C404A]/50">
                  <div className="flex items-center gap-2.5 mb-5 border-b border-white/[0.04] pb-3">
                    <Milestone className="w-5 h-5 text-[#3B82F6]" />
                    <h4 className="font-display font-bold text-lg text-white">
                      {rmp.milestonesTitle}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {rmp.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex gap-4 items-start">
                        <div className="shrink-0 w-28 font-mono text-[11px] text-[#6FB1FF] uppercase tracking-wider pt-0.5">
                          {milestone.date}
                        </div>
                        <div className="flex-1 pb-4 border-b border-white/[0.03] last:border-0 last:pb-0">
                          <div className="font-sans font-semibold text-base text-[#F5F5F0] mb-1">{milestone.title}</div>
                          <div className="font-sans text-sm text-gray-400 leading-relaxed">{milestone.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <a
                    href="https://github.com/TrustNodeLab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-gray-400 hover:text-[#3B82F6] font-mono text-sm transition-colors"
                  >
                    <SiGithubIcon className="w-3.5 h-3.5" />
                    {rmp.allProjectsGithub}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

// ==========================================
// INTERACTIVE ONNX NEURAL TESTER & TG TICKET
// ==========================================

interface OnnxPreset {
  label: string;
  text: string;
  isThreat: boolean;
}

interface OnnxDictType {
  title: string; subtitle: string; placeholder: string; btnRun: string; btnRunning: string; resultHeader: string; fraudLabel: string; safeLabel: string; attentionTitle: string; presetTitle: string; feedbackHeader: string; feedbackSub: string; errType: string; errFalsePositive: string; errFalseNegative: string; errOther: string; commentLabel: string; commentPlaceholder: string; btnTg: string; btnCopy: string; copied: string; modelStatusSafe: string; modelStatusSuspicious: string; modelStatusFraud: string; hideTicketForm: string; ticketSpec: string; consoleRootFile: string; consoleSuccess: string; consoleQuant: string; consoleCompat: string; paramValue: string; latencyValue: string;
}

const ONNX_DICT: Record<LanguageCode, OnnxDictType> = {
  ru: {
    title: "РРЅС‚РµСЂР°РєС‚РёРІРЅР°СЏ Р›Р°Р±РѕСЂР°С‚РѕСЂРёСЏ РўРµСЃС‚РёСЂРѕРІР°РЅРёСЏ RuBERT",
    subtitle: "РћС†РµРЅРёС‚Рµ Р»РѕРєР°Р»СЊРЅС‹Р№ РёРЅС„РµСЂРµРЅСЃ РІРµСЃРѕРІ РјРѕРґРµР»Рё rubert_fraud_int8.onnx РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё.",
    placeholder: "Р’РІРµРґРёС‚Рµ С‚РµРєСЃС‚ РїРѕРґРѕР·СЂРёС‚РµР»СЊРЅРѕРіРѕ РґРёР°Р»РѕРіР° РёР»Рё РЎРњРЎ РґР»СЏ Р°РЅР°Р»РёР·Р°...",
    btnRun: "Р—Р°РїСѓСЃС‚РёС‚СЊ РёРЅС„РµСЂРµРЅСЃ РјРѕРґРµР»Рё",
    btnRunning: "Р’С‹С‡РёСЃР»РµРЅРёРµ РІРµСЃРѕРІ...",
    resultHeader: "Р’Р«РҐРћР” РЎР•РњРђРќРўРР§Р•РЎРљРћР“Рћ Р”Р•РљРћР”Р•Р Рђ",
    fraudLabel: "Р’РµСЂРѕСЏС‚РЅРѕСЃС‚СЊ РЎРѕС†. РРЅР¶РµРЅРµСЂРёРё (FRAUD):",
    safeLabel: "Р‘РµР·РѕРїР°СЃРЅС‹Р№ Р”РёР°Р»РѕРі (SAFE):",
    attentionTitle: "РљР°СЂС‚Р° РІРЅРёРјР°РЅРёСЏ BERT (Р¤Р»Р°РіРё С‚РѕРєРµРЅРѕРІ):",
    presetTitle: "Р‘С‹СЃС‚СЂС‹Рµ РїСЂРµСЃРµС‚С‹:",
    feedbackHeader: "вљ пёЏ РћР±РЅР°СЂСѓР¶РёР»Рё РѕС€РёР±РєСѓ РёРЅС„РµСЂРµРЅСЃР°?",
    feedbackSub: "РџРѕРјРѕРіРёС‚Рµ РѕР±СѓС‡РёС‚СЊ РІРµСЃР° РЅРµР№СЂРѕСЃРµС‚Рё! РћС‚РїСЂР°РІСЊС‚Рµ С‚РёРєРµС‚ РѕР± РѕС€РёР±РєРµ РЅР°РїСЂСЏРјСѓСЋ РІ РєРѕРјР°РЅРґСѓ РїРѕРґРґРµСЂР¶РєРё РІ Telegram.",
    errType: "РўРёРї РѕС€РёР±РєРё",
    errFalsePositive: "Р›РѕР¶РЅРѕРµ СЃСЂР°Р±Р°С‚С‹РІР°РЅРёРµ (Р‘РµР·РѕРїР°СЃРЅС‹Р№ С‚РµРєСЃС‚ РїРѕРјРµС‡РµРЅ РєР°Рє СѓРіСЂРѕР·Р°)",
    errFalseNegative: "РџСЂРѕРїСѓСЃРє СѓРіСЂРѕР·С‹ (РњРѕС€РµРЅРЅРёС‡РµСЃРєРёР№ С‚РµРєСЃС‚ РїРѕСЃС‡РёС‚Р°РЅ Р±РµР·РѕРїР°СЃРЅС‹Рј)",
    errOther: "Р”СЂСѓРіРѕР№ Р±Р°Рі РєР»Р°СЃСЃРёС„РёРєР°С†РёРё",
    commentLabel: "Р’Р°С€ РєРѕРјРјРµРЅС‚Р°СЂРёР№ (С‡С‚Рѕ РїРѕС€Р»Рѕ РЅРµ С‚Р°Рє?)",
    commentPlaceholder: "РЈРєР°Р¶РёС‚Рµ, РЅР°РїСЂРёРјРµСЂ, РєР°РєРёРµ СЃР»РѕРІР° РјРѕРґРµР»СЊ РїРѕСЃС‡РёС‚Р°Р»Р° РєСЂРёС‚РёС‡РЅС‹РјРё...",
    btnTg: "РћС‚РїСЂР°РІРёС‚СЊ С‚РёРєРµС‚ РІ Telegram",
    btnCopy: "РЎРєРѕРїРёСЂРѕРІР°С‚СЊ С‚РёРєРµС‚",
    copied: "РЎРєРѕРїРёСЂРѕРІР°РЅРѕ!",
    modelStatusSafe: "Р‘Р•Р—РћРџРђРЎРќРђРЇ РЎР•РњРђРќРўРРљРђ",
    modelStatusSuspicious: "РџРћР”РћР—Р РРўР•Р›Р¬РќРћ",
    modelStatusFraud: "РњРћРЁР•РќРќРР§Р•РЎРљРР™ РќРђР’Р«Рљ",
    hideTicketForm: "РЎРєСЂС‹С‚СЊ С‚РёРєРµС‚-С„РѕСЂРјСѓ",
    ticketSpec: "РЎРџР•Р¦РР¤РРљРђР¦РРЇ Р¤РћР РњРђРўРђ РўРРљР•РўРђ",
    consoleRootFile: "РљРћР РќР•Р’РћР™ Р¤РђР™Р› РџР РћР•РљРўРђ",
    consoleSuccess: "РЈРЎРџР•РҐ",
    consoleQuant: "РљР’РђРќРўРР—РђР¦РРЇ: INT8 (РґРёРЅР°РјРёС‡РµСЃРєР°СЏ)",
    consoleCompat: "РЎРћР’РњР•РЎРўРРњРћРЎРўР¬: ORT 1.18+",
    paramValue: "~29.1M (РѕРїС‚РёРјРёР·РёСЂРѕРІР°РЅРѕ)",
    latencyValue: "<14ms (РЅР° РјРѕР±РёР»СЊРЅРѕРј CPU)",
  },
  en: {
    title: "Interactive RuBERT ONNX Test Lab",
    subtitle: "Evaluate real-time local inference of the rubert_fraud_int8.onnx model weights.",
    placeholder: "Enter suspicious dialogue text or SMS for safety classification...",
    btnRun: "Run Model Inference",
    btnRunning: "Running Weights...",
    resultHeader: "SEMANTIC DECODER OUTPUT",
    fraudLabel: "Social Engineering Risk (FRAUD):",
    safeLabel: "Safe Dialogue (SAFE):",
    attentionTitle: "BERT Attention Map (Token Flags):",
    presetTitle: "Quick Presets:",
    feedbackHeader: "вљ пёЏ Found a Classification Error?",
    feedbackSub: "Help train the neural net weights! Report a classification bug ticket directly to our support team in Telegram.",
    errType: "Error Classification",
    errFalsePositive: "False Positive (Safe text flagged as threat)",
    errFalseNegative: "False Negative (Fraudulent text marked as safe)",
    errOther: "Other classification anomaly",
    commentLabel: "Your feedback comments",
    commentPlaceholder: "Explain which words caused the model to misbehave...",
    btnTg: "Send Ticket to Telegram",
    btnCopy: "Copy Ticket Content",
    copied: "Copied!",
    modelStatusSafe: "SAFE SEMANTICS",
    modelStatusSuspicious: "SUSPICIOUS ACTIVITY",
    modelStatusFraud: "FRAUDULENT SEMANTICS",
    hideTicketForm: "Hide ticket form",
    ticketSpec: "TICKET FORMAT SPEC",
    consoleRootFile: "PROJECT ROOT FILE",
    consoleSuccess: "SUCCESS",
    consoleQuant: "QUANTIZATION: INT8 (dynamic)",
    consoleCompat: "COMPATIBILITY: ORT 1.18+",
    paramValue: "~29.1M (optimized)",
    latencyValue: "<14ms (on mobile CPU)",
  },
  tr: {
    title: "EtkileЕџimli RuBERT ONNX Test LaboratuvarД±",
    subtitle: "rubert_fraud_int8.onnx model aДџД±rlД±klarД±nД±n gerГ§ek zamanlД± yerel Г§Д±karД±mД±nД± deДџerlendirin.",
    placeholder: "Analiz iГ§in ЕџГјpheli diyalog veya SMS metnini girin...",
    btnRun: "Model Г‡Д±karД±mД±nД± BaЕџlat",
    btnRunning: "Г‡Д±karД±m YapД±lД±yor...",
    resultHeader: "ANLAMSAL DEKODER Г‡IKTI",
    fraudLabel: "Sosyal MГјhendislik Riski (FRAUD):",
    safeLabel: "GГјvenli Diyalog (SAFE):",
    attentionTitle: "BERT Dikkat HaritasД± (Token BayraklarД±):",
    presetTitle: "HД±zlД± Ећablonlar:",
    feedbackHeader: "вљ пёЏ SД±nД±flandД±rma HatasД± mД± Buldunuz?",
    feedbackSub: "Yapay sinir aДџД± aДџД±rlД±klarД±nД± eДџitmeye yardД±mcД± olun! DoДџrudan destek ekibine Telegram Гјzerinden hata bildirimi gГ¶nderin.",
    errType: "Hata TГјrГј",
    errFalsePositive: "YanlД±Еџ Pozitif (GГјvenli metin tehdit olarak algД±landД±)",
    errFalseNegative: "YanlД±Еџ Negatif (Tehdit iГ§eren metin gГјvenli sayД±ldД±)",
    errOther: "DiДџer sД±nД±flandД±rma hatasД±",
    commentLabel: "Yorumunuz (ne yanlД±Еџ gitti?)",
    commentPlaceholder: "Г–rneДџin modelin hangi kelimeleri yanlД±Еџ yorumladД±ДџД±nД± belirtin...",
    btnTg: "Telegram'a Bildirim GГ¶nder",
    btnCopy: "Bildirimi Kopyala",
    copied: "KopyalandД±!",
    modelStatusSafe: "GГњVENLД° ANLAM",
    modelStatusSuspicious: "ЕћГњPHELД° DIALOG",
    modelStatusFraud: "DOLANDIRICILIK TESPД°TД°",
    hideTicketForm: "Bildirim Formunu Gizle",
    ticketSpec: "BД°LET FORMATI",
    consoleRootFile: "PROJE KГ–K DOSYASI",
    consoleSuccess: "BAЕћARILI",
    consoleQuant: "KANTД°ZASYON: INT8 (dinamik)",
    consoleCompat: "UYUMLULUK: ORT 1.18+",
    paramValue: "~29.1M (optimize edilmiЕџ)",
    latencyValue: "<14ms (mobil CPU'da)",
  },
  es: {
    title: "Laboratorio de pruebas interactivo RuBERT ONNX",
    subtitle: "EvalГєa la inferencia local en tiempo real de los pesos del modelo rubert_fraud_int8.onnx.",
    placeholder: "Introduce texto de diГЎlogo sospechoso o SMS para la clasificaciГіn de seguridad...",
    btnRun: "Ejecutar inferencia del modelo",
    btnRunning: "Calculando pesos...",
    resultHeader: "SALIDA DEL DECODIFICADOR SEMГЃNTICO",
    fraudLabel: "Riesgo de IngenierГ­a Social (FRAUD):",
    safeLabel: "DiГЎlogo seguro (SAFE):",
    attentionTitle: "Mapa de AtenciГіn BERT (Banderas de Tokens):",
    presetTitle: "Preajustes rГЎpidos:",
    feedbackHeader: "вљ пёЏ ВїEncontraste un error de clasificaciГіn?",
    feedbackSub: "ВЎAyuda a entrenar los pesos de la red neuronal! EnvГ­a un ticket de error de clasificaciГіn directamente a nuestro equipo de soporte en Telegram.",
    errType: "ClasificaciГіn del error",
    errFalsePositive: "Falso positivo (texto seguro marcado como amenaza)",
    errFalseNegative: "Falso negativo (texto fraudulento marcado como seguro)",
    errOther: "Otra anomalГ­a de clasificaciГіn",
    commentLabel: "Tus comentarios",
    commentPlaceholder: "Explica quГ© palabras hicieron que el modelo se comportara mal...",
    btnTg: "Enviar ticket a Telegram",
    btnCopy: "Copiar contenido del ticket",
    copied: "ВЎCopiado!",
    modelStatusSafe: "SEMГЃNTICA SEGURA",
    modelStatusSuspicious: "ACTIVIDAD SOSPECHOSA",
    modelStatusFraud: "SEMГЃNTICA FRAUDULENTA",
    hideTicketForm: "Ocultar formulario de ticket",
    ticketSpec: "ESPECIFICACIГ“N DEL FORMATO DE TICKET",
    consoleRootFile: "ARCHIVO RAГЌZ DEL PROYECTO",
    consoleSuccess: "Г‰XITO",
    consoleQuant: "CUANTIZACIГ“N: INT8 (dinГЎmica)",
    consoleCompat: "COMPATIBILIDAD: ORT 1.18+",
    paramValue: "~29.1M (optimizado)",
    latencyValue: "<14ms (en CPU mГіvil)",
  },
  zh: {
    title: "дє¤дє’ејЏ RuBERT ONNX жµ‹иЇ•е®ћйЄЊе®¤",
    subtitle: "иЇ„дј° rubert_fraud_int8.onnx жЁЎећ‹жќѓй‡Ќзљ„е®ћж—¶жњ¬ењ°жЋЁзђ†гЂ‚",
    placeholder: "иѕ“е…ҐеЏЇз–‘еЇ№иЇќж–‡жњ¬ж€–зџ­дїЎпјЊиї›иЎЊе®‰е…Ёе€†з±»...",
    btnRun: "иїђиЎЊжЁЎећ‹жЋЁзђ†",
    btnRunning: "ж­ЈењЁи®Ўз®—жќѓй‡Ќ...",
    resultHeader: "иЇ­д№‰и§Јз Ѓе™Ёиѕ“е‡є",
    fraudLabel: "з¤ѕдјље·ҐзЁ‹йЈЋй™©пј€FRAUDпј‰пјљ",
    safeLabel: "е®‰е…ЁеЇ№иЇќпј€SAFEпј‰пјљ",
    attentionTitle: "BERT жіЁж„ЏеЉ›е›ѕпј€д»¤з‰Њж ‡и®°пј‰пјљ",
    presetTitle: "еї«йЂџйў„и®ѕпјљ",
    feedbackHeader: "вљ пёЏ еЏ‘зЋ°е€†з±»й”™иЇЇпјџ",
    feedbackSub: "её®еЉ©и®­з»ѓзҐћз»ЏзЅ‘з»њжќѓй‡ЌпјЃз›ґжЋҐе°†е€†з±»й”™иЇЇзҐЁиЇЃжЉҐе‘Љз»™ж€‘д»¬ењЁ Telegram дёЉзљ„ж”ЇжЊЃе›ўйџгЂ‚",
    errType: "й”™иЇЇе€†з±»",
    errFalsePositive: "иЇЇжЉҐпј€е®‰е…Ёж–‡жњ¬иў«ж ‡и®°дёєеЁЃиѓЃпј‰",
    errFalseNegative: "жјЏжЉҐпј€ж¬єиЇ€ж–‡жњ¬иў«ж ‡и®°дёєе®‰е…Ёпј‰",
    errOther: "е…¶д»–е€†з±»еј‚еёё",
    commentLabel: "ж‚Ёзљ„еЏЌй¦€иЇ„и®є",
    commentPlaceholder: "иЇ·иЇґжЋе“Єдє›иЇЌеЇји‡ґжЁЎећ‹е‡єй”™...",
    btnTg: "еЏ‘йЂЃзҐЁиЇЃе€° Telegram",
    btnCopy: "е¤Ќе€¶зҐЁиЇЃе†…е®№",
    copied: "е·Іе¤Ќе€¶пјЃ",
    modelStatusSafe: "е®‰е…ЁиЇ­д№‰",
    modelStatusSuspicious: "еЏЇз–‘жґ»еЉЁ",
    modelStatusFraud: "ж¬єиЇ€иЇ­д№‰",
    hideTicketForm: "йљђи—ЏзҐЁиЇЃиЎЁеЌ•",
    ticketSpec: "зҐЁиЇЃж јејЏи§„иЊѓ",
    consoleRootFile: "йЎ№з›®ж №ж–‡д»¶",
    consoleSuccess: "ж€ђеЉџ",
    consoleQuant: "й‡ЏеЊ–пјљINT8пј€еЉЁжЂЃпј‰",
    consoleCompat: "е…је®№жЂ§пјљORT 1.18+",
    paramValue: "~29.1M (е·ІдјеЊ–)",
    latencyValue: "<14msпј€з§»еЉЁз«Ї CPUпј‰",
  },
  hi: {
    title: "а¤‡а¤‚а¤џа¤°аҐ€а¤•аҐЌа¤џа¤їа¤µ RuBERT ONNX а¤џаҐ‡а¤ёаҐЌа¤џ а¤ІаҐ€а¤¬",
    subtitle: "rubert_fraud_int8.onnx а¤®аҐ‰а¤Ўа¤І а¤•аҐ‡ а¤µа¤ња¤ја¤Ё а¤•аҐЂ а¤µа¤ѕа¤ёаҐЌа¤¤а¤µа¤їа¤• а¤ёа¤®а¤Ї а¤®аҐ‡а¤‚ а¤ёаҐЌа¤Ґа¤ѕа¤ЁаҐЂа¤Ї а¤‡а¤ЁаҐЌа¤«а¤ја¤°аҐ‡а¤‚а¤ё а¤•а¤ѕ а¤®аҐ‚а¤ІаҐЌа¤Їа¤ѕа¤‚а¤•а¤Ё а¤•а¤°аҐ‡а¤‚аҐ¤",
    placeholder: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј а¤•аҐ‡ а¤Іа¤їа¤Џ а¤ёа¤‚а¤¦а¤їа¤—аҐЌа¤§ а¤ёа¤‚а¤µа¤ѕа¤¦ а¤Єа¤ѕа¤  а¤Їа¤ѕ SMS а¤¦а¤°аҐЌа¤њ а¤•а¤°аҐ‡а¤‚...",
    btnRun: "а¤®аҐ‰а¤Ўа¤І а¤‡а¤ЁаҐЌа¤«а¤ја¤°аҐ‡а¤‚а¤ё а¤ља¤Іа¤ѕа¤Џа¤Ѓ",
    btnRunning: "а¤µа¤ња¤ја¤Ё а¤•аҐЂ а¤—а¤Ја¤Ёа¤ѕ а¤№аҐ‹ а¤°а¤№аҐЂ а¤№аҐ€...",
    resultHeader: "а¤ёа¤їа¤®аҐ‡а¤‚а¤џа¤їа¤• а¤Ўа¤їа¤•аҐ‹а¤Ўа¤° а¤†а¤‰а¤џа¤ЄаҐЃа¤џ",
    fraudLabel: "а¤ёа¤ѕа¤®а¤ѕа¤ња¤їа¤• а¤‡а¤‚а¤њаҐЂа¤Ёа¤їа¤Їа¤°а¤їа¤‚а¤— а¤њаҐ‹а¤–а¤їа¤® (FRAUD):",
    safeLabel: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤ёа¤‚а¤µа¤ѕа¤¦ (SAFE):",
    attentionTitle: "BERT а¤§аҐЌа¤Їа¤ѕа¤Ё а¤®а¤ѕа¤Ёа¤ља¤їа¤¤аҐЌа¤° (а¤џаҐ‹а¤•а¤Ё а¤«а¤јаҐЌа¤ІаҐ€а¤—):",
    presetTitle: "а¤¤аҐЌа¤µа¤°а¤їа¤¤ а¤ЄаҐЌа¤°аҐЂа¤ёаҐ‡а¤џ:",
    feedbackHeader: "вљ пёЏ а¤•аҐ‹а¤€ а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј а¤¤аҐЌа¤°аҐЃа¤џа¤ї а¤®а¤їа¤ІаҐЂ?",
    feedbackSub: "а¤ЁаҐЌа¤ЇаҐ‚а¤°а¤І а¤ЁаҐ‡а¤џ а¤µа¤ња¤ја¤Ё а¤ЄаҐЌа¤°а¤¶а¤їа¤•аҐЌа¤·а¤їа¤¤ а¤•а¤°а¤ЁаҐ‡ а¤®аҐ‡а¤‚ а¤®а¤¦а¤¦ а¤•а¤°аҐ‡а¤‚! а¤џаҐ‡а¤ІаҐЂа¤—аҐЌа¤°а¤ѕа¤® а¤Єа¤° а¤№а¤®а¤ѕа¤°аҐЂ а¤ёа¤№а¤ѕа¤Їа¤¤а¤ѕ а¤џаҐЂа¤® а¤•аҐ‹ а¤ёаҐЂа¤§аҐ‡ а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј а¤¬а¤— а¤џа¤їа¤•а¤џ а¤°а¤їа¤ЄаҐ‹а¤°аҐЌа¤џ а¤•а¤°аҐ‡а¤‚аҐ¤",
    errType: "а¤¤аҐЌа¤°аҐЃа¤џа¤ї а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј",
    errFalsePositive: "а¤—а¤ја¤Іа¤¤ а¤ёа¤•а¤ѕа¤°а¤ѕа¤¤аҐЌа¤®а¤• (а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤Єа¤ѕа¤  а¤•аҐ‹ а¤–а¤ја¤¤а¤°аҐ‡ а¤•аҐ‡ а¤°аҐ‚а¤Є а¤®аҐ‡а¤‚ а¤ља¤їа¤№аҐЌа¤Ёа¤їа¤¤ а¤•а¤їа¤Їа¤ѕ а¤—а¤Їа¤ѕ)",
    errFalseNegative: "а¤—а¤ја¤Іа¤¤ а¤Ёа¤•а¤ѕа¤°а¤ѕа¤¤аҐЌа¤®а¤• (а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤Єа¤ѕа¤  а¤•аҐ‹ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤ља¤їа¤№аҐЌа¤Ёа¤їа¤¤ а¤•а¤їа¤Їа¤ѕ а¤—а¤Їа¤ѕ)",
    errOther: "а¤…а¤ЁаҐЌа¤Ї а¤µа¤°аҐЌа¤—аҐЂа¤•а¤°а¤Ј а¤µа¤їа¤ёа¤‚а¤—а¤¤а¤ї",
    commentLabel: "а¤†а¤Єа¤•аҐЂ а¤ЄаҐЌа¤°а¤¤а¤їа¤•аҐЌа¤°а¤їа¤Їа¤ѕ а¤џа¤їа¤ЄаҐЌа¤Єа¤Ја¤їа¤Їа¤ѕа¤Ѓ",
    commentPlaceholder: "а¤¬а¤¤а¤ѕа¤Џа¤Ѓ а¤•а¤ї а¤•а¤їа¤Ё а¤¶а¤¬аҐЌа¤¦аҐ‹а¤‚ а¤ЁаҐ‡ а¤®аҐ‰а¤Ўа¤І а¤•аҐ‹ а¤—а¤ја¤Іа¤¤ а¤µаҐЌа¤Їа¤µа¤№а¤ѕа¤° а¤•а¤°а¤ЁаҐ‡ а¤Єа¤° а¤®а¤ња¤¬аҐ‚а¤° а¤•а¤їа¤Їа¤ѕ...",
    btnTg: "а¤џаҐ‡а¤ІаҐЂа¤—аҐЌа¤°а¤ѕа¤® а¤Єа¤° а¤џа¤їа¤•а¤џ а¤­аҐ‡а¤њаҐ‡а¤‚",
    btnCopy: "а¤џа¤їа¤•а¤џ а¤ёа¤ѕа¤®а¤—аҐЌа¤°аҐЂ а¤•аҐ‰а¤ЄаҐЂ а¤•а¤°аҐ‡а¤‚",
    copied: "а¤•аҐ‰а¤ЄаҐЂ а¤№аҐ‹ а¤—а¤Їа¤ѕ!",
    modelStatusSafe: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤ёа¤їа¤®аҐ‡а¤‚а¤џа¤їа¤•аҐЌа¤ё",
    modelStatusSuspicious: "а¤ёа¤‚а¤¦а¤їа¤—аҐЌа¤§ а¤—а¤¤а¤їа¤µа¤їа¤§а¤ї",
    modelStatusFraud: "а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤ёа¤їа¤®аҐ‡а¤‚а¤џа¤їа¤•аҐЌа¤ё",
    hideTicketForm: "а¤џа¤їа¤•а¤џ а¤«а¤јаҐ‰а¤°аҐЌа¤® а¤›аҐЃа¤Єа¤ѕа¤Џа¤Ѓ",
    ticketSpec: "а¤џа¤їа¤•а¤џ а¤ЄаҐЌа¤°а¤ѕа¤°аҐ‚а¤Є а¤µа¤їа¤Ёа¤їа¤°аҐЌа¤¦аҐ‡а¤¶",
    consoleRootFile: "а¤ЄаҐЌа¤°аҐ‹а¤њаҐ‡а¤•аҐЌа¤џ а¤°аҐ‚а¤џ а¤«а¤ја¤ѕа¤‡а¤І",
    consoleSuccess: "а¤ёа¤«а¤Іа¤¤а¤ѕ",
    consoleQuant: "а¤•аҐЌа¤µа¤ѕа¤‚а¤џа¤ѕа¤‡а¤ња¤јаҐ‡а¤¶а¤Ё: INT8 (а¤Ўа¤ѕа¤Їа¤Ёа¤ѕа¤®а¤їа¤•)",
    consoleCompat: "а¤ёа¤‚а¤—а¤¤а¤¤а¤ѕ: ORT 1.18+",
    paramValue: "~29.1M (а¤…а¤ЁаҐЃа¤•аҐ‚а¤Іа¤їа¤¤)",
    latencyValue: "<14ms (а¤®аҐ‹а¤¬а¤ѕа¤‡а¤І CPU а¤Єа¤°)",
  },
  ar: {
    title: "Щ…Ш®ШЄШЁШ± Ш§Ш®ШЄШЁШ§Ш± RuBERT ONNX Ш§Щ„ШЄЩЃШ§Ш№Щ„ЩЉ",
    subtitle: "Щ‚ЩЉЩ‘Щ… Ш§Щ„Ш§ШіШЄШЇЩ„Ш§Щ„ Ш§Щ„Щ…Ш­Щ„ЩЉ ЩЃЩЉ Ш§Щ„Щ€Щ‚ШЄ Ш§Щ„ЩЃШ№Щ„ЩЉ Щ„ШЈЩ€ШІШ§Щ† Щ†Щ…Щ€Ш°Ш¬ rubert_fraud_int8.onnx.",
    placeholder: "ШЈШЇШ®Щ„ Щ†Шµ Ш­Щ€Ш§Ш± Щ…ШґШЁЩ€Щ‡ ШЈЩ€ Ш±ШіШ§Щ„Ш© SMS Щ„ШЄШµЩ†ЩЉЩЃ Ш§Щ„ШЈЩ…Ш§Щ†...",
    btnRun: "ШЄШґШєЩЉЩ„ Ш§ШіШЄШЇЩ„Ш§Щ„ Ш§Щ„Щ†Щ…Щ€Ш°Ш¬",
    btnRunning: "Ш¬Ш§Ш±ЩЌ Ш­ШіШ§ШЁ Ш§Щ„ШЈЩ€ШІШ§Щ†...",
    resultHeader: "Щ…Ш®Ш±Ш¬Ш§ШЄ Ш§Щ„Щ…ЩЃЩѓЩѓ Ш§Щ„ШЇЩ„Ш§Щ„ЩЉ",
    fraudLabel: "Ш®Ш·Ш± Ш§Щ„Щ‡Щ†ШЇШіШ© Ш§Щ„Ш§Ш¬ШЄЩ…Ш§Ш№ЩЉШ© (FRAUD):",
    safeLabel: "Ш­Щ€Ш§Ш± ШўЩ…Щ† (SAFE):",
    attentionTitle: "Ш®Ш±ЩЉШ·Ш© Ш§Щ†ШЄШЁШ§Щ‡ BERT (ШЈШ№Щ„Ш§Щ… Ш§Щ„Ш±Щ…Щ€ШІ):",
    presetTitle: "ШҐШ№ШЇШ§ШЇШ§ШЄ ШіШ±ЩЉШ№Ш©:",
    feedbackHeader: "вљ пёЏ Щ€Ш¬ШЇШЄ Ш®Ш·ШЈ ЩЃЩЉ Ш§Щ„ШЄШµЩ†ЩЉЩЃШџ",
    feedbackSub: "ШіШ§Ш№ШЇ ЩЃЩЉ ШЄШЇШ±ЩЉШЁ ШЈЩ€ШІШ§Щ† Ш§Щ„ШґШЁЩѓШ© Ш§Щ„Ш№ШµШЁЩЉШ©! ШЈШЁЩ„Шє Ш№Щ† ШЄШ°ЩѓШ±Ш© Ш®Ш·ШЈ ШЄШµЩ†ЩЉЩЃ Щ…ШЁШ§ШґШ±Ш©Щ‹ ШҐЩ„Щ‰ ЩЃШ±ЩЉЩ‚ Ш§Щ„ШЇШ№Щ… Щ„ШЇЩЉЩ†Ш§ Ш№Щ„Щ‰ ШЄЩЉЩ„ЩЉШєШ±Ш§Щ….",
    errType: "ШЄШµЩ†ЩЉЩЃ Ш§Щ„Ш®Ш·ШЈ",
    errFalsePositive: "ШҐЩЉШ¬Ш§ШЁЩЉ ЩѓШ§Ш°ШЁ (Щ†Шµ ШўЩ…Щ† Щ€ЩЏШіЩ… ЩѓШЄЩ‡ШЇЩЉШЇ)",
    errFalseNegative: "ШіЩ„ШЁЩЉ ЩѓШ§Ш°ШЁ (Щ†Шµ Ш§Ш­ШЄЩЉШ§Щ„ЩЉ Щ€ЩЏШіЩ… ЩѓШўЩ…Щ†)",
    errOther: "ШґШ°Щ€Ш° ШЄШµЩ†ЩЉЩЃ ШўШ®Ш±",
    commentLabel: "ШЄШ№Щ„ЩЉЩ‚Ш§ШЄЩѓ",
    commentPlaceholder: "Ш§ШґШ±Ш­ Ш§Щ„ЩѓЩ„Щ…Ш§ШЄ Ш§Щ„ШЄЩЉ Ш¬Ш№Щ„ШЄ Ш§Щ„Щ†Щ…Щ€Ш°Ш¬ ЩЉШЄШµШ±ЩЃ ШЁШґЩѓЩ„ Ш®Ш§Ш·Ш¦...",
    btnTg: "ШҐШ±ШіШ§Щ„ Ш§Щ„ШЄШ°ЩѓШ±Ш© ШҐЩ„Щ‰ ШЄЩЉЩ„ЩЉШєШ±Ш§Щ…",
    btnCopy: "Щ†ШіШ® Щ…Ш­ШЄЩ€Щ‰ Ш§Щ„ШЄШ°ЩѓШ±Ш©",
    copied: "ШЄЩ… Ш§Щ„Щ†ШіШ®!",
    modelStatusSafe: "ШЇЩ„Ш§Щ„Ш§ШЄ ШўЩ…Щ†Ш©",
    modelStatusSuspicious: "Щ†ШґШ§Ш· Щ…ШґШЁЩ€Щ‡",
    modelStatusFraud: "ШЇЩ„Ш§Щ„Ш§ШЄ Ш§Ш­ШЄЩЉШ§Щ„ЩЉШ©",
    hideTicketForm: "ШҐШ®ЩЃШ§ШЎ Щ†Щ…Щ€Ш°Ш¬ Ш§Щ„ШЄШ°ЩѓШ±Ш©",
    ticketSpec: "Щ…Щ€Ш§ШµЩЃШ§ШЄ ШЄЩ†ШіЩЉЩ‚ Ш§Щ„ШЄШ°ЩѓШ±Ш©",
    consoleRootFile: "Щ…Щ„ЩЃ Ш¬Ш°Ш± Ш§Щ„Щ…ШґШ±Щ€Ш№",
    consoleSuccess: "Щ†Ш¬Ш§Ш­",
    consoleQuant: "Ш§Щ„Щ‚ЩЉШ§Ші Ш§Щ„ЩѓЩ…ЩЉ: INT8 (ШЇЩЉЩ†Ш§Щ…ЩЉЩѓЩЉ)",
    consoleCompat: "Ш§Щ„ШЄЩ€Ш§ЩЃЩ‚: ORT 1.18+",
    paramValue: "~29.1M (Щ…Ш­ШіЩ‘Щ†)",
    latencyValue: "<14ms (Ш№Щ„Щ‰ Щ…Ш№Ш§Щ„Ш¬ Ш§Щ„Щ‡Ш§ШЄЩЃ)",
  },
  pt: {
    title: "LaboratГіrio de Teste Interativo RuBERT ONNX",
    subtitle: "Avalie a inferГЄncia local em tempo real dos pesos do modelo rubert_fraud_int8.onnx.",
    placeholder: "Digite texto de diГЎlogo suspeito ou SMS para classificaГ§ГЈo de seguranГ§a...",
    btnRun: "Executar inferГЄncia do modelo",
    btnRunning: "Calculando pesos...",
    resultHeader: "SAГЌDA DO DECODIFICADOR SEMГ‚NTICO",
    fraudLabel: "Risco de Engenharia Social (FRAUD):",
    safeLabel: "DiГЎlogo seguro (SAFE):",
    attentionTitle: "Mapa de AtenГ§ГЈo BERT (Bandeiras de Tokens):",
    presetTitle: "PredefiniГ§Гµes rГЎpidas:",
    feedbackHeader: "вљ пёЏ Encontrou um erro de classificaГ§ГЈo?",
    feedbackSub: "Ajude a treinar os pesos da rede neural! Envie um ticket de erro de classificaГ§ГЈo diretamente Г  nossa equipe de suporte no Telegram.",
    errType: "ClassificaГ§ГЈo do Erro",
    errFalsePositive: "Falso Positivo (texto seguro sinalizado como ameaГ§a)",
    errFalseNegative: "Falso Negativo (texto fraudulento marcado como seguro)",
    errOther: "Outra anomalia de classificaГ§ГЈo",
    commentLabel: "Seus comentГЎrios",
    commentPlaceholder: "Explique quais palavras fizeram o modelo se comportar mal...",
    btnTg: "Enviar ticket para o Telegram",
    btnCopy: "Copiar conteГєdo do ticket",
    copied: "Copiado!",
    modelStatusSafe: "SEMГ‚NTICA SEGURA",
    modelStatusSuspicious: "ATIVIDADE SUSPEITA",
    modelStatusFraud: "SEMГ‚NTICA FRAUDULENTA",
    hideTicketForm: "Ocultar formulГЎrio de ticket",
    ticketSpec: "ESPECIFICAГ‡ГѓO DO FORMATO DO TICKET",
    consoleRootFile: "ARQUIVO RAIZ DO PROJETO",
    consoleSuccess: "SUCESSO",
    consoleQuant: "QUANTIZAГ‡ГѓO: INT8 (dinГўmica)",
    consoleCompat: "COMPATIBILIDADE: ORT 1.18+",
    paramValue: "~29.1M (otimizado)",
    latencyValue: "<14ms (em CPU mГіvel)",
  },
  fr: {
    title: "Laboratoire de test interactif RuBERT ONNX",
    subtitle: "Г‰valuez l'infГ©rence locale en temps rГ©el des poids du modГЁle rubert_fraud_int8.onnx.",
    placeholder: "Saisissez un texte de dialogue suspect ou un SMS pour la classification de sГ©curitГ©...",
    btnRun: "ExГ©cuter l'infГ©rence du modГЁle",
    btnRunning: "Calcul des poids...",
    resultHeader: "SORTIE DU DГ‰CODEUR SГ‰MANTIQUE",
    fraudLabel: "Risque d'ingГ©nierie sociale (FRAUD) :",
    safeLabel: "Dialogue sГ»r (SAFE) :",
    attentionTitle: "Carte d'attention BERT (Drapeaux de jetons) :",
    presetTitle: "PrГ©sГ©lections rapides :",
    feedbackHeader: "вљ пёЏ Vous avez trouvГ© une erreur de classification ?",
    feedbackSub: "Aidez Г  entraГ®ner les poids du rГ©seau neuronal ! Signalez un ticket de bug de classification directement Г  notre Г©quipe de support sur Telegram.",
    errType: "Classification de l'erreur",
    errFalsePositive: "Faux positif (texte sГ»r signalГ© comme menace)",
    errFalseNegative: "Faux nГ©gatif (texte frauduleux marquГ© comme sГ»r)",
    errOther: "Autre anomalie de classification",
    commentLabel: "Vos commentaires",
    commentPlaceholder: "Expliquez quels mots ont fait mal se comporter le modГЁle...",
    btnTg: "Envoyer le ticket sur Telegram",
    btnCopy: "Copier le contenu du ticket",
    copied: "CopiГ© !",
    modelStatusSafe: "SГ‰MANTIQUE SГ›RE",
    modelStatusSuspicious: "ACTIVITГ‰ SUSPECTE",
    modelStatusFraud: "SГ‰MANTIQUE FRAUDULEUSE",
    hideTicketForm: "Masquer le formulaire de ticket",
    ticketSpec: "SPГ‰CIFICATION DU FORMAT DE TICKET",
    consoleRootFile: "FICHIER RACINE DU PROJET",
    consoleSuccess: "SUCCГ€S",
    consoleQuant: "QUANTIFICATION : INT8 (dynamique)",
    consoleCompat: "COMPATIBILITГ‰ : ORT 1.18+",
    paramValue: "~29.1M (optimisГ©)",
    latencyValue: "<14ms (sur CPU mobile)",
  },
  de: {
    title: "Interaktives RuBERT-ONNX-Testlabor",
    subtitle: "Bewerten Sie die lokale Echtzeit-Inferenz der Gewichte des Modells rubert_fraud_int8.onnx.",
    placeholder: "Geben Sie verdГ¤chtigen Dialogtext oder SMS zur Sicherheitsklassifizierung ein...",
    btnRun: "Modell-Inferenz ausfГјhren",
    btnRunning: "Gewichte werden berechnet...",
    resultHeader: "AUSGABE DES SEMANTISCHEN DEKODERS",
    fraudLabel: "Social-Engineering-Risiko (FRAUD):",
    safeLabel: "Sicherer Dialog (SAFE):",
    attentionTitle: "BERT-Aufmerksamkeitskarte (Token-Flags):",
    presetTitle: "Schnelle Voreinstellungen:",
    feedbackHeader: "вљ пёЏ Einen Klassifizierungsfehler gefunden?",
    feedbackSub: "Helfen Sie, die Gewichte des neuronalen Netzes zu trainieren! Melden Sie ein Klassifizierungsfehler-Ticket direkt an unser Support-Team in Telegram.",
    errType: "Fehlerklassifizierung",
    errFalsePositive: "Falsch positiv (sicherer Text als Bedrohung markiert)",
    errFalseNegative: "Falsch negativ (betrГјgerischer Text als sicher markiert)",
    errOther: "Andere Klassifizierungsanomalie",
    commentLabel: "Ihre Feedback-Kommentare",
    commentPlaceholder: "ErklГ¤ren Sie, welche WГ¶rter das Modell zu Fehlverhalten veranlasst haben...",
    btnTg: "Ticket an Telegram senden",
    btnCopy: "Ticketinhalt kopieren",
    copied: "Kopiert!",
    modelStatusSafe: "SICHERE SEMANTIK",
    modelStatusSuspicious: "VERDГ„CHTIGE AKTIVITГ„T",
    modelStatusFraud: "BETRГњGERISCHE SEMANTIK",
    hideTicketForm: "Ticketformular ausblenden",
    ticketSpec: "TICKETFORMAT-SPEZIFIKATION",
    consoleRootFile: "PROJEKTROOT-DATEI",
    consoleSuccess: "ERFOLG",
    consoleQuant: "QUANTISIERUNG: INT8 (dynamisch)",
    consoleCompat: "KOMPATIBILITГ„T: ORT 1.18+",
    paramValue: "~29.1M (optimiert)",
    latencyValue: "<14ms (auf Mobil-CPU)",
  },
  ja: {
    title: "г‚¤гѓіг‚їгѓ©г‚Їгѓ†г‚Јгѓ– RuBERT ONNX гѓ†г‚№гѓ€гѓ©гѓњ",
    subtitle: "rubert_fraud_int8.onnx гѓўгѓ‡гѓ«гЃ®й‡ЌгЃїгЃ®гѓЄг‚ўгѓ«г‚їг‚¤гѓ гѓ­гѓјг‚«гѓ«жЋЁи«–г‚’и©•дѕЎгЃ—гЃѕгЃ™гЂ‚",
    placeholder: "е®‰е…Ёе€†йЎћгЃ®гЃџг‚ЃгЂЃз–‘г‚ЏгЃ—гЃ„еЇѕи©±гѓ†г‚­г‚№гѓ€гЃѕгЃџгЃЇ SMS г‚’е…ҐеЉ›гЃ—гЃ¦гЃЏгЃ гЃ•гЃ„...",
    btnRun: "гѓўгѓ‡гѓ«жЋЁи«–г‚’е®џиЎЊ",
    btnRunning: "й‡ЌгЃїг‚’иЁ€з®—дё­...",
    resultHeader: "ж„Џе‘ігѓ‡г‚ігѓјгѓЂе‡єеЉ›",
    fraudLabel: "г‚Ѕгѓјг‚·гѓЈгѓ«г‚Ёгѓіг‚ёгѓ‹г‚ўгѓЄгѓіг‚°гѓЄг‚№г‚Їпј€FRAUDпј‰пјљ",
    safeLabel: "е®‰е…ЁгЃЄеЇѕи©±пј€SAFEпј‰пјљ",
    attentionTitle: "BERT г‚ўгѓ†гѓіг‚·гѓ§гѓігѓћгѓѓгѓ—пј€гѓ€гѓјг‚Їгѓігѓ•гѓ©г‚°пј‰пјљ",
    presetTitle: "г‚Їг‚¤гѓѓг‚Їгѓ—гѓЄг‚»гѓѓгѓ€пјљ",
    feedbackHeader: "вљ пёЏ е€†йЎћг‚Ёгѓ©гѓјгЃЊи¦‹гЃ¤гЃ‹г‚ЉгЃѕгЃ—гЃџгЃ‹пјџ",
    feedbackSub: "гѓ‹гѓҐгѓјгѓ©гѓ«гѓЌгѓѓгѓ€гѓЇгѓјг‚ЇгЃ®й‡ЌгЃїгЃ®гѓ€гѓ¬гѓјгѓ‹гѓіг‚°гЃ«гЃ”еЌ”еЉ›гЃЏгЃ гЃ•гЃ„пјЃTelegram гЃ®г‚µгѓќгѓјгѓ€гѓЃгѓјгѓ гЃ«е€†йЎћгѓђг‚°гЃ®гѓЃг‚±гѓѓгѓ€г‚’з›ґжЋҐе ±е‘ЉгЃ—гЃ¦гЃЏгЃ гЃ•гЃ„гЂ‚",
    errType: "г‚Ёгѓ©гѓје€†йЎћ",
    errFalsePositive: "иЄ¤ж¤ње‡єпј€е®‰е…ЁгЃЄгѓ†г‚­г‚№гѓ€гЃЊи„…еЁЃгЃЁгЃ—гЃ¦гѓ•гѓ©г‚°д»гЃ‘пј‰",
    errFalseNegative: "и¦‹йЂѓгЃ—пј€дёЌж­ЈгЃЄгѓ†г‚­г‚№гѓ€гЃЊе®‰е…ЁгЃЁгЃ—гЃ¦гѓћгѓјг‚Їпј‰",
    errOther: "гЃќгЃ®д»–гЃ®е€†йЎћз•°еёё",
    commentLabel: "гѓ•г‚Јгѓјгѓ‰гѓђгѓѓг‚Їг‚ігѓЎгѓігѓ€",
    commentPlaceholder: "гѓўгѓ‡гѓ«гЃЊиЄ¤е‹•дЅњгЃ—гЃџеЋџе› гЃ®еЌиЄћг‚’иЄ¬жЋгЃ—гЃ¦гЃЏгЃ гЃ•гЃ„...",
    btnTg: "Telegram гЃ«гѓЃг‚±гѓѓгѓ€г‚’йЂЃдїЎ",
    btnCopy: "гѓЃг‚±гѓѓгѓ€е†…е®№г‚’г‚ігѓ”гѓј",
    copied: "г‚ігѓ”гѓјгЃ—гЃѕгЃ—гЃџпјЃ",
    modelStatusSafe: "е®‰е…ЁгЃЄж„Џе‘іи§Јжћђ",
    modelStatusSuspicious: "дёЌеЇ©гЃЄг‚ўг‚Їгѓ†г‚Јгѓ“гѓ†г‚Ј",
    modelStatusFraud: "дёЌж­ЈгЃЄж„Џе‘іи§Јжћђ",
    hideTicketForm: "гѓЃг‚±гѓѓгѓ€гѓ•г‚©гѓјгѓ г‚’йљ гЃ™",
    ticketSpec: "гѓЃг‚±гѓѓгѓ€еЅўејЏд»•ж§",
    consoleRootFile: "гѓ—гѓ­г‚ёг‚§г‚Їгѓ€гѓ«гѓјгѓ€гѓ•г‚Ўг‚¤гѓ«",
    consoleSuccess: "ж€ђеЉџ",
    consoleQuant: "й‡Џе­ђеЊ–пјљINT8пј€е‹•зљ„пј‰",
    consoleCompat: "дє’жЏ›жЂ§пјљORT 1.18+",
    paramValue: "~29.1Mпј€жњЂйЃ©еЊ–жё€гЃїпј‰",
    latencyValue: "<14msпј€гѓўгѓђг‚¤гѓ«CPUпј‰",
  },
};

const ONNX_PRESETS: Record<LanguageCode, OnnxPreset[]> = {
  ru: [
    {
      label: "Р‘Р°РЅРє (РЈРіСЂРѕР·Р°)",
      text: "Р’Р°Рј Р·РІРѕРЅСЏС‚ РёР· Р¦РµРЅС‚СЂРѕР±Р°РЅРєР°! РЎСЂРѕС‡РЅРѕ РїРµСЂРµРІРµРґРёС‚Рµ РІСЃРµ СЃСЂРµРґСЃС‚РІР° РЅР° РІСЂРµРјРµРЅРЅСѓСЋ Р±РµР·РѕРїР°СЃРЅСѓСЋ СЏС‡РµР№РєСѓ РґР»СЏ СЃРїР°СЃРµРЅРёСЏ РѕС‚ РЅРµСЃР°РЅРєС†РёРѕРЅРёСЂРѕРІР°РЅРЅРѕРіРѕ РєСЂРµРґРёС‚Р°.",
      isThreat: true,
    },
    {
      label: "РљСѓСЂСЊРµСЂ (РЈРіСЂРѕР·Р°)",
      text: "Р’Р°С€Р° РґРѕСЃС‚Р°РІРєР° РїРѕСЃС‹Р»РєРё РїСЂРёРѕСЃС‚Р°РЅРѕРІР»РµРЅР° РёР·-Р·Р° РЅРµРѕРїР»Р°С‚С‹ РїРѕС€Р»РёРЅС‹. РџРµСЂРµР№РґРёС‚Рµ РЅР° СЃР°Р№С‚ tracking-rus-post.net/pay Рё РѕРїР»Р°С‚РёС‚Рµ 15 СЂСѓР±Р»РµР№ РїСЂСЏРјРѕ СЃРµР№С‡Р°СЃ!",
      isThreat: true,
    },
    {
      label: "Р”РўРџ (РЈРіСЂРѕР·Р°)",
      text: "РњР°РјР°, РїСЂРёРІРµС‚, СЏ СЃР±РёР» С‡РµР»РѕРІРµРєР° РЅР° РјР°С€РёРЅРµ... РЎСЂРѕС‡РЅРѕ РїРµСЂРµРІРµРґРё 50 С‚С‹СЃСЏС‡ СЂСѓР±Р»РµР№ СЃР»РµРґРѕРІР°С‚РµР»СЋ РЅР° РєР°СЂС‚Сѓ, РёРЅР°С‡Рµ РЅР° РјРµРЅСЏ Р·Р°РєСЂРѕСЋС‚ РґРµР»Рѕ.",
      isThreat: true,
    },
    {
      label: "РћР±С‹С‡РЅС‹Р№ С‡Р°С‚ (Р‘РµР·РѕРїР°СЃРЅРѕ)",
      text: "РџСЂРёРІРµС‚! Р›РµРєС†РёСЏ РІ Р§РµР»СЏР±РёРЅСЃРєРѕРј СЂР°РґРёРѕС‚РµС…РЅРёС‡РµСЃРєРѕРј С‚РµС…РЅРёРєСѓРјРµ РЅР°С‡РЅРµС‚СЃСЏ Р·Р°РІС‚СЂР° СЂРѕРІРЅРѕ РІ 10 СѓС‚СЂР° РІ Р°СѓРґ. 402. РќРµ Р·Р°Р±СѓРґСЊ РІР·СЏС‚СЊ С‡РµСЂРЅРѕРІРёРє.",
      isThreat: false,
    },
  ],
  en: [
    {
      label: "Bank (Threat)",
      text: "This is Federal Bank Security! Immediately transfer your total balance to the temporary secured vault to protect it from theft.",
      isThreat: true,
    },
    {
      label: "Customs (Threat)",
      text: "Your delivery is delayed. Please log onto trustnode-tracking-secure.com/id203 to pay the processing fee of $1.50.",
      isThreat: true,
    },
    {
      label: "Accident (Threat)",
      text: "Hey mom, I got into a horrible car crash and hurt someone. Send $2000 immediately to this card for the lawyer.",
      isThreat: true,
    },
    {
      label: "Lecture (Safe)",
      text: "Hello! The network security lecture at ChRT college starts tomorrow morning at 10:00 AM sharp. Don't forget your drafts.",
      isThreat: false,
    },
  ],
  tr: [
    {
      label: "Banka (Tehdit)",
      text: "Merkez BankasД±'ndan arД±yoruz! Kredi dolandД±rД±cД±lД±ДџД±ndan kurtulmak iГ§in tГјm paranД±zД± acilen geГ§ici gГјvenli hesaba transfer edin.",
      isThreat: true,
    },
    {
      label: "Kargo (Tehdit)",
      text: "Kargonuz gГјmrГјk harcД± Г¶denmediДџi iГ§in askД±ya alД±ndД±. Hemen tracking-tr-post.net/pay adresine girip 15 TL Г¶deme yapД±n!",
      isThreat: true,
    },
    {
      label: "Kaza (Tehdit)",
      text: "Anne, merhaba! Arabayla birine Г§arptД±m... Avukat iГ§in acilen karta 5000 TL gГ¶nderebilir misin yoksa tutuklanacaДџД±m.",
      isThreat: true,
    },
    {
      label: "Normal KonuЕџma (GГјvenli)",
      text: "Selam! Г‡elyabinsk Radyoteknik Koleji'ndeki aДџ gГјvenliДџi dersi yarД±n saat 10'da baЕџlayacak. NotlarД±nД± unutma.",
      isThreat: false,
    },
  ],
  es: [
    {
      label: "Banco (Amenaza)",
      text: "ВЎHabla Seguridad del Banco Federal! Transfiere inmediatamente tu saldo total a la bГіveda segura temporal para protegerlo del robo.",
      isThreat: true,
    },
    {
      label: "Aduanas (Amenaza)",
      text: "Tu entrega se ha retrasado. Inicia sesiГіn en trustnode-tracking-secure.com/id203 para pagar la tarifa de procesamiento de $1.50.",
      isThreat: true,
    },
    {
      label: "Accidente (Amenaza)",
      text: "MamГЎ, tuve un horrible accidente de coche y herГ­ a alguien. EnvГ­a $2000 inmediatamente a esta tarjeta para el abogado.",
      isThreat: true,
    },
    {
      label: "Conferencia (Seguro)",
      text: "ВЎHola! La conferencia de seguridad de redes en la universidad ChRT comienza maГ±ana a las 10:00 AM en punto. No olvides tus borradores.",
      isThreat: false,
    },
  ],
  zh: [
    {
      label: "й“¶иЎЊпј€еЁЃиѓЃпј‰",
      text: "иї™й‡ЊжЇиЃ”й‚¦й“¶иЎЊе®‰е…ЁйѓЁй—ЁпјЃз«‹еЌіе°†ж‚Ёзљ„е…ЁйѓЁдЅ™йўќиЅ¬з§»е€°дёґж—¶е®‰е…Ёй‡‘еє“пјЊд»ҐйІиў«з›—гЂ‚",
      isThreat: true,
    },
    {
      label: "жµ·е…іпј€еЁЃиѓЃпј‰",
      text: "ж‚Ёзљ„еЊ…иЈ№й…ЌйЂЃе·Іе»¶иїџгЂ‚иЇ·з™»еЅ• trustnode-tracking-secure.com/id203 ж”Їд» 1.50 зѕЋе…ѓзљ„ж‰‹з»­иґ№гЂ‚",
      isThreat: true,
    },
    {
      label: "дє‹ж•…пј€еЁЃиѓЃпј‰",
      text: "е¦€е¦€пјЊж€‘е‡єдє†дёҐй‡Ќзљ„иЅ¦зҐёпјЊж’ћдј¤дє†дєєгЂ‚иЇ·з«‹еЌіеђ‘иї™еј еЌЎж±‡ж¬ѕ 2000 зѕЋе…ѓз»™еѕ‹её€гЂ‚",
      isThreat: true,
    },
    {
      label: "и®Іеє§пј€е®‰е…Ёпј‰",
      text: "дЅ еҐЅпјЃChRT е­¦й™ўзљ„зЅ‘з»ње®‰е…Ёи®Іеє§жЋе¤©дёЉеЌ€ 10 з‚№ж•ґејЂе§‹гЂ‚е€«еїдє†её¦иЌ‰зЁїгЂ‚",
      isThreat: false,
    },
  ],
  hi: [
    {
      label: "а¤¬аҐ€а¤‚а¤• (а¤–а¤ја¤¤а¤°а¤ѕ)",
      text: "а¤Їа¤№ а¤ёа¤‚а¤аҐЂа¤Ї а¤¬аҐ€а¤‚а¤• а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤№аҐ€! а¤љаҐ‹а¤°аҐЂ а¤ёаҐ‡ а¤¬а¤ља¤ѕа¤ЁаҐ‡ а¤•аҐ‡ а¤Іа¤їа¤Џ а¤¤аҐЃа¤°а¤‚а¤¤ а¤…а¤Єа¤ЁаҐЂ а¤ЄаҐ‚а¤°аҐЂ а¤°а¤ѕа¤¶а¤ї а¤…а¤ёаҐЌа¤Ґа¤ѕа¤ЇаҐЂ а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤¤а¤їа¤њаҐ‹а¤°аҐЂ а¤®аҐ‡а¤‚ а¤ёаҐЌа¤Ґа¤ѕа¤Ёа¤ѕа¤‚а¤¤а¤°а¤їа¤¤ а¤•а¤°аҐ‡а¤‚аҐ¤",
      isThreat: true,
    },
    {
      label: "а¤•а¤ёаҐЌа¤џа¤®аҐЌа¤ё (а¤–а¤ја¤¤а¤°а¤ѕ)",
      text: "а¤†а¤Єа¤•аҐЂ а¤Ўа¤їа¤ІаҐЂа¤µа¤°аҐЂ а¤®аҐ‡а¤‚ а¤¦аҐ‡а¤°аҐЂ а¤№аҐЃа¤€ а¤№аҐ€аҐ¤ а¤•аҐѓа¤Єа¤Їа¤ѕ $1.50 а¤ЄаҐЌа¤°а¤ёа¤‚а¤ёаҐЌа¤•а¤°а¤Ј а¤¶аҐЃа¤ІаҐЌа¤• а¤•а¤ѕ а¤­аҐЃа¤—а¤¤а¤ѕа¤Ё а¤•а¤°а¤ЁаҐ‡ а¤•аҐ‡ а¤Іа¤їа¤Џ trustnode-tracking-secure.com/id203 а¤Єа¤° а¤ІаҐ‰а¤—а¤їа¤Ё а¤•а¤°аҐ‡а¤‚аҐ¤",
      isThreat: true,
    },
    {
      label: "а¤¦аҐЃа¤°аҐЌа¤а¤џа¤Ёа¤ѕ (а¤–а¤ја¤¤а¤°а¤ѕ)",
      text: "а¤®а¤ѕа¤Ѓ, а¤®аҐ€а¤‚ а¤Џа¤• а¤­а¤Їа¤ѕа¤Ёа¤• а¤•а¤ѕа¤° а¤¦аҐЃа¤°аҐЌа¤а¤џа¤Ёа¤ѕ а¤®аҐ‡а¤‚ а¤«а¤Ѓа¤ё а¤—а¤Їа¤ѕ а¤”а¤° а¤•а¤їа¤ёаҐЂ а¤•аҐ‹ а¤љаҐ‹а¤џ а¤Єа¤№аҐЃа¤Ѓа¤ља¤ѕа¤€аҐ¤ а¤µа¤•аҐЂа¤І а¤•аҐ‡ а¤Іа¤їа¤Џ а¤¤аҐЃа¤°а¤‚а¤¤ а¤‡а¤ё а¤•а¤ѕа¤°аҐЌа¤Ў а¤Єа¤° $2000 а¤­аҐ‡а¤њаҐ‡а¤‚аҐ¤",
      isThreat: true,
    },
    {
      label: "а¤µаҐЌа¤Їа¤ѕа¤–аҐЌа¤Їа¤ѕа¤Ё (а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤)",
      text: "а¤Ёа¤®а¤ёаҐЌа¤¤аҐ‡! ChRT а¤•аҐ‰а¤ІаҐ‡а¤њ а¤®аҐ‡а¤‚ а¤ЁаҐ‡а¤џа¤µа¤°аҐЌа¤• а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤ѕ а¤µаҐЌа¤Їа¤ѕа¤–аҐЌа¤Їа¤ѕа¤Ё а¤•а¤І а¤ёаҐЃа¤¬а¤№ а¤ аҐЂа¤• 10:00 а¤¬а¤њаҐ‡ а¤¶аҐЃа¤°аҐ‚ а¤№аҐ‹а¤—а¤ѕаҐ¤ а¤…а¤Єа¤ЁаҐ‡ а¤ЎаҐЌа¤°а¤ѕа¤«а¤јаҐЌа¤џ а¤®а¤¤ а¤­аҐ‚а¤Іа¤Ёа¤ѕаҐ¤",
      isThreat: false,
    },
  ],
  ar: [
    {
      label: "ШЁЩ†Щѓ (ШЄЩ‡ШЇЩЉШЇ)",
      text: "Щ‡Ш°Ш§ ШЈЩ…Щ† Ш§Щ„ШЁЩ†Щѓ Ш§Щ„ЩЃЩЉШЇШ±Ш§Щ„ЩЉ! Ш­Щ€Щ‘Щ„ Ш±ШµЩЉШЇЩѓ Ш§Щ„ЩѓШ§Щ…Щ„ ЩЃЩ€Ш±Ш§Щ‹ ШҐЩ„Щ‰ Ш§Щ„Ш®ШІЩ†Ш© Ш§Щ„ШўЩ…Щ†Ш© Ш§Щ„Щ…Ш¤Щ‚ШЄШ© Щ„Ш­Щ…Ш§ЩЉШЄЩ‡ Щ…Щ† Ш§Щ„ШіШ±Щ‚Ш©.",
      isThreat: true,
    },
    {
      label: "Ш¬Щ…Ш§Ш±Щѓ (ШЄЩ‡ШЇЩЉШЇ)",
      text: "ШЄШЈШ®Ш± ШЄШіЩ„ЩЉЩ… Ш·Ш±ШЇЩѓ. ЩЉШ±Ш¬Щ‰ ШЄШіШ¬ЩЉЩ„ Ш§Щ„ШЇШ®Щ€Щ„ ШҐЩ„Щ‰ trustnode-tracking-secure.com/id203 Щ„ШЇЩЃШ№ Ш±ШіЩ€Щ… Ш§Щ„Щ…Ш№Ш§Щ„Ш¬Ш© Ш§Щ„ШЁШ§Щ„ШєШ© 1.50 ШЇЩ€Щ„Ш§Ш±.",
      isThreat: true,
    },
    {
      label: "Ш­Ш§ШЇШ« (ШЄЩ‡ШЇЩЉШЇ)",
      text: "ШЈЩ…ЩЉШЊ ШЄШ№Ш±Ш¶ШЄ Щ„Ш­Ш§ШЇШ« ШіЩЉШ§Ш±Ш© Щ…Ш±Щ€Ш№ Щ€ШЈШµШЁШЄ ШґШ®ШµШ§Щ‹. ШЈШ±ШіЩ„ 2000 ШЇЩ€Щ„Ш§Ш± ЩЃЩ€Ш±Ш§Щ‹ ШҐЩ„Щ‰ Щ‡Ш°Щ‡ Ш§Щ„ШЁШ·Ш§Щ‚Ш© Щ„Щ„Щ…Ш­Ш§Щ…ЩЉ.",
      isThreat: true,
    },
    {
      label: "Щ…Ш­Ш§Ш¶Ш±Ш© (ШўЩ…Щ†)",
      text: "Щ…Ш±Ш­ШЁШ§Щ‹! Щ…Ш­Ш§Ш¶Ш±Ш© ШЈЩ…Щ† Ш§Щ„ШґШЁЩѓШ§ШЄ ЩЃЩЉ ЩѓЩ„ЩЉШ© ChRT ШЄШЁШЇШЈ ШєШЇШ§Щ‹ ШµШЁШ§Ш­Ш§Щ‹ ЩЃЩЉ ШЄЩ…Ш§Щ… Ш§Щ„ШіШ§Ш№Ш© 10:00. Щ„Ш§ ШЄЩ†ШіЩЋ Щ…ШіЩ€ШЇШ§ШЄЩѓ.",
      isThreat: false,
    },
  ],
  pt: [
    {
      label: "Banco (AmeaГ§a)",
      text: "Aqui Г© a SeguranГ§a do Banco Federal! Transfira imediatamente seu saldo total para o cofre seguro temporГЎrio para protegГЄ-lo contra roubo.",
      isThreat: true,
    },
    {
      label: "AlfГўndega (AmeaГ§a)",
      text: "Sua entrega estГЎ atrasada. Entre em trustnode-tracking-secure.com/id203 para pagar a taxa de processamento de $1,50.",
      isThreat: true,
    },
    {
      label: "Acidente (AmeaГ§a)",
      text: "MГЈe, sofri um acidente de carro horrГ­vel e machuquei alguГ©m. Envie $2000 imediatamente para este cartГЈo para o advogado.",
      isThreat: true,
    },
    {
      label: "Palestra (Seguro)",
      text: "OlГЎ! A palestra de seguranГ§a de redes na faculdade ChRT comeГ§a amanhГЈ Г s 10h em ponto. NГЈo esqueГ§a seus rascunhos.",
      isThreat: false,
    },
  ],
  fr: [
    {
      label: "Banque (menace)",
      text: "Ici la SГ©curitГ© de la Banque FГ©dГ©rale ! TransfГ©rez immГ©diatement votre solde total dans le coffre sГ©curisГ© temporaire pour le protГ©ger du vol.",
      isThreat: true,
    },
    {
      label: "Douane (menace)",
      text: "Votre livraison est retardГ©e. Connectez-vous sur trustnode-tracking-secure.com/id203 pour payer les frais de traitement de 1,50 $.",
      isThreat: true,
    },
    {
      label: "Accident (menace)",
      text: "Maman, j'ai eu un horrible accident de voiture et j'ai blessГ© quelqu'un. Envoyez 2000 $ immГ©diatement sur cette carte pour l'avocat.",
      isThreat: true,
    },
    {
      label: "ConfГ©rence (sГ»r)",
      text: "Bonjour ! La confГ©rence sur la sГ©curitГ© des rГ©seaux au collГЁge ChRT commence demain matin Г  10h00 prГ©cises. N'oubliez pas vos brouillons.",
      isThreat: false,
    },
  ],
  de: [
    {
      label: "Bank (Bedrohung)",
      text: "Hier ist die Sicherheitsabteilung der Federal Bank! Гњberweisen Sie sofort Ihr gesamtes Guthaben in das temporГ¤re sichere Tresorfach, um es vor Diebstahl zu schГјtzen.",
      isThreat: true,
    },
    {
      label: "Zoll (Bedrohung)",
      text: "Ihre Lieferung verzГ¶gert sich. Bitte melden Sie sich unter trustnode-tracking-secure.com/id203 an, um die BearbeitungsgebГјhr von 1,50 $ zu zahlen.",
      isThreat: true,
    },
    {
      label: "Unfall (Bedrohung)",
      text: "Mama, ich hatte einen schrecklichen Autounfall und habe jemanden verletzt. Schicken Sie sofort 2000 $ auf diese Karte fГјr den Anwalt.",
      isThreat: true,
    },
    {
      label: "Vorlesung (Sicher)",
      text: "Hallo! Die Vorlesung Гјber Netzwerksicherheit am ChRT College beginnt morgen frГјh um genau 10:00 Uhr. Vergessen Sie Ihre EntwГјrfe nicht.",
      isThreat: false,
    },
  ],
  ja: [
    {
      label: "йЉЂиЎЊпј€и„…еЁЃпј‰",
      text: "гЃ“гЃЎг‚‰гЃЇйЂЈй‚¦йЉЂиЎЊгЃ®г‚»г‚­гѓҐгѓЄгѓ†г‚ЈгЃ§гЃ™пјЃз›—й›ЈгЃ‹г‚‰дїќи­·гЃ™г‚‹гЃџг‚ЃгЂЃж®‹й«е…ЁйЎЌг‚’з›ґгЃЎгЃ«дёЂж™‚дїќи­·й‡‘еє«гЃёйЂЃй‡‘гЃ—гЃ¦гЃЏгЃ гЃ•гЃ„гЂ‚",
      isThreat: true,
    },
    {
      label: "зЁЋй–ўпј€и„…еЁЃпј‰",
      text: "й…ЌйЃ”гЃЊйЃ…г‚ЊгЃ¦гЃ„гЃѕгЃ™гЂ‚trustnode-tracking-secure.com/id203 гЃ«гѓ­г‚°г‚¤гѓігЃ—гЃ¦гЂЃ1.50гѓ‰гѓ«гЃ®е‡¦зђ†ж‰‹ж•°ж–™г‚’гЃЉж”Їж‰•гЃ„гЃЏгЃ гЃ•гЃ„гЂ‚",
      isThreat: true,
    },
    {
      label: "дє‹ж•…пј€и„…еЁЃпј‰",
      text: "гѓћгѓћгЂЃгЃІгЃ©гЃ„дє¤йЂљдє‹ж•…гЃ«йЃ­гЃЈгЃ¦иЄ°гЃ‹г‚’е‚·гЃ¤гЃ‘гЃ¦гЃ—гЃѕгЃЈгЃџгЂ‚ејЃи­·еЈ«гЃ®гЃџг‚ЃгЂЃгЃ™гЃђгЃ«гЃ“гЃ®г‚«гѓјгѓ‰гЃё2000гѓ‰гѓ«йЂЃй‡‘гЃ—гЃ¦гЂ‚",
      isThreat: true,
    },
    {
      label: "и¬›зѕ©пј€е®‰е…Ёпј‰",
      text: "гЃ“г‚“гЃ«гЃЎгЃЇпјЃChRT е¤§е­¦гЃ®гѓЌгѓѓгѓ€гѓЇгѓјг‚Їг‚»г‚­гѓҐгѓЄгѓ†г‚Ји¬›зѕ©гЃЇжЋж—Ґжњќ10ж™‚гЃЎг‚‡гЃ†гЃ©гЃ«е§‹гЃѕг‚ЉгЃѕгЃ™гЂ‚дё‹ж›ёгЃЌг‚’еїг‚ЊгЃЄгЃ„гЃ§гЃЏгЃ гЃ•гЃ„гЂ‚",
      isThreat: false,
    },
  ],
};

const ONNX_TRIGGERS: Record<LanguageCode, string[]> = {
  ru: [
    "С†РµРЅС‚СЂРѕР±Р°РЅРє", "Р±РµР·РѕРїР°СЃРЅ", "СЏС‡РµР№Рє", "РїРµСЂРµРІРµРґРё", "РїРµСЂРµРІРѕРґ", "СЃС‡РµС‚", "РєСЂРµРґРёС‚", "СЃРїР°СЃ", "РєР°СЂС‚Сѓ", "РєРѕРґ", "СЃРјСЃ", "РїР°СЂРѕР»СЊ",
    "РґРѕСЃС‚Р°РІРє", "РїРѕС€Р»РёРЅ", "РїРѕСЃС‹Р»Рє", "РѕРїР»Р°С‚", "tracking", "СЃР±РёР»", "РґС‚Рї", "Р°РІР°СЂРё", "РїРѕР»РёС†Рё", "РґРµРЅСЊРіРё", "СЂСѓР±Р»", "РІС‹РёРіСЂР°",
    "СЃРµР№С„РѕРІС‹", "СЃР»РµРґСЃС‚РІРµРЅ",
  ],
  en: [
    "treasury", "escrow", "vault", "package", "fee", "accident", "lawyer", "card", "bank", "tracking",
  ],
  tr: [
    "merkez", "banka", "para", "transfer", "dolandД±rД±cД±lД±k", "kargo", "Г¶deme", "gГјmrГјk",
    "Г§arptД±m", "avukat", "kart", "tutuklan", "gГ¶nder", "tracking",
  ],
  es: [
    "banco", "bГіveda", "robo", "saldo", "tarifa", "pagar", "retrasado",
    "accidente", "herГ­", "tarjeta", "abogado", "envГ­a", "tracking",
  ],
  zh: [
    "й“¶иЎЊ", "дЅ™йўќ", "иЅ¬з§»е€°", "й‡‘еє“", "иў«з›—", "еЊ…иЈ№", "е»¶иїџ", "ж”Їд»", "ж‰‹з»­иґ№",
    "иЅ¦зҐё", "ж’ћдј¤", "ж±‡ж¬ѕ", "еѕ‹её€", "tracking",
  ],
  hi: [
    "а¤¬аҐ€а¤‚а¤•", "а¤љаҐ‹а¤°аҐЂ", "а¤°а¤ѕа¤¶а¤ї", "а¤¤а¤їа¤њаҐ‹а¤°аҐЂ", "а¤ёаҐЌа¤Ґа¤ѕа¤Ёа¤ѕа¤‚а¤¤а¤°а¤їа¤¤", "а¤Ўа¤їа¤ІаҐЂа¤µа¤°аҐЂ", "а¤¦аҐ‡а¤°аҐЂ",
    "а¤ЄаҐЌа¤°а¤ёа¤‚а¤ёаҐЌа¤•а¤°а¤Ј", "а¤¶аҐЃа¤ІаҐЌа¤•", "а¤­аҐЃа¤—а¤¤а¤ѕа¤Ё", "а¤¦аҐЃа¤°аҐЌа¤а¤џа¤Ёа¤ѕ", "а¤љаҐ‹а¤џ", "а¤µа¤•аҐЂа¤І", "а¤•а¤ѕа¤°аҐЌа¤Ў", "а¤­аҐ‡а¤њаҐ‡а¤‚", "tracking",
  ],
  ar: [
    "Ш§Щ„ШЁЩ†Щѓ", "Ш±ШµЩЉШЇЩѓ", "Ш§Щ„Ш®ШІЩ†Ш©", "Ш§Щ„ШіШ±Щ‚Ш©", "Ш­Щ€Щ‘Щ„", "ШЄШЈШ®Ш±", "Ш·Ш±ШЇЩѓ", "ШЇЩЃШ№", "Ш±ШіЩ€Щ…",
    "Ш§Щ„Щ…Ш№Ш§Щ„Ш¬Ш©", "Ш­Ш§ШЇШ«", "ШЈШµШЁШЄ", "Ш§Щ„ШЁШ·Ш§Щ‚Ш©", "Ш§Щ„Щ…Ш­Ш§Щ…ЩЉ", "ШЈШ±ШіЩ„", "tracking",
  ],
  pt: [
    "banco", "transfira", "saldo", "cofre", "roubo", "atrasada", "pagar", "taxa",
    "processamento", "acidente", "machuquei", "cartГЈo", "advogado", "envie", "tracking",
  ],
  fr: [
    "banque", "transfГ©rez", "solde", "coffre", "vol", "livraison", "retardГ©e", "payer",
    "frais", "traitement", "accident", "blessГ©", "carte", "avocat", "envoyez", "tracking",
  ],
  de: [
    "bank", "Гјberweisen", "guthaben", "tresorfach", "diebstahl", "lieferung", "verzГ¶gert",
    "bearbeitungsgebГјhr", "zahlen", "autounfall", "verletzt", "karte", "anwalt", "schicken", "tracking",
  ],
  ja: [
    "йЉЂиЎЊ", "з›—й›Ј", "ж®‹й«", "й‡‘еє«", "йЂЃй‡‘", "й…ЌйЃ”", "йЃ…г‚Њ", "е‡¦зђ†ж‰‹ж•°ж–™",
    "ж”Їж‰•гЃ„", "гѓ­г‚°г‚¤гѓі", "дє¤йЂљдє‹ж•…", "е‚·гЃ¤гЃ‘", "ејЃи­·еЈ«", "г‚«гѓјгѓ‰", "tracking",
  ],
};

const ONNX_STEPS: Record<LanguageCode, string[]> = {
  ru: [
    "РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ С‚РѕРєРµРЅРёР·Р°С‚РѕСЂР° BERT...",
    "РџРѕСЃС‚СЂРѕРµРЅРёРµ РІРµРєС‚РѕСЂРѕРІ СЌРјР±РµРґРґРёРЅРіРѕРІ РґР»СЏ С‚РѕРєРµРЅРѕРІ...",
    "РРЅС„РµСЂРµРЅСЃ СЃРІРµСЂС‚РѕС‡РЅС‹С… СЃР»РѕРµРІ RuBERT-tiny2 (Dynamic INT8)...",
    "РџСЂРёРјРµРЅРµРЅРёРµ СЃРѕС„С‚РјР°РєСЃР° Рє Р»РѕРіРёС‚Р°Рј [1, 2]...",
  ],
  en: [
    "Initializing BERT Tokenizer...",
    "Constructing embedding vectors for input sequence...",
    "Running RuBERT-tiny2 layer weights (Dynamic INT8)...",
    "Applying softmax to output logits [1, 2]...",
  ],
  tr: [
    "BERT Tokenizer baЕџlatД±lД±yor...",
    "Token gГ¶mme vektГ¶rleri oluЕџturuluyor...",
    "RuBERT-tiny2 katmanlarД±nda Г§Д±karД±m yapД±lД±yor (Dinamik INT8)...",
    "Logit deДџerlerine [1, 2] Softmax uygulanД±yor...",
  ],
  es: [
    "Inicializando el tokenizador BERT...",
    "Construyendo vectores de embedding para la secuencia de entrada...",
    "Ejecutando los pesos de la capa RuBERT-tiny2 (INT8 dinГЎmico)...",
    "Aplicando softmax a los logits de salida [1, 2]...",
  ],
  zh: [
    "ж­ЈењЁе€ќе§‹еЊ– BERT е€†иЇЌе™Ё...",
    "ж­ЈењЁдёєиѕ“е…ҐеєЏе€—жћ„е»єеµЊе…Ґеђ‘й‡Џ...",
    "ж­ЈењЁиїђиЎЊ RuBERT-tiny2 е±‚жќѓй‡Ќпј€еЉЁжЂЃ INT8пј‰...",
    "ж­ЈењЁеЇ№иѕ“е‡є logits [1, 2] еє”з”Ё softmax...",
  ],
  hi: [
    "BERT а¤џаҐ‹а¤•а¤Ёа¤ѕа¤‡а¤ња¤ја¤° а¤¶аҐЃа¤°аҐ‚ а¤№аҐ‹ а¤°а¤№а¤ѕ а¤№аҐ€...",
    "а¤‡а¤Ёа¤ЄаҐЃа¤џ а¤…а¤ЁаҐЃа¤•аҐЌа¤°а¤® а¤•аҐ‡ а¤Іа¤їа¤Џ а¤Џа¤®аҐЌа¤¬аҐ‡а¤Ўа¤їа¤‚а¤— а¤µаҐ‡а¤•аҐЌа¤џа¤° а¤¬а¤Ёа¤ѕа¤Џ а¤ња¤ѕ а¤°а¤№аҐ‡ а¤№аҐ€а¤‚...",
    "RuBERT-tiny2 а¤Єа¤°а¤¤ а¤µа¤ња¤ја¤Ё а¤ља¤І а¤°а¤№аҐ‡ а¤№аҐ€а¤‚ (а¤Ўа¤ѕа¤Їа¤Ёа¤ѕа¤®а¤їа¤• INT8)...",
    "а¤†а¤‰а¤џа¤ЄаҐЃа¤џ logits [1, 2] а¤Єа¤° softmax а¤Іа¤ѕа¤—аҐ‚ а¤•а¤їа¤Їа¤ѕ а¤ња¤ѕ а¤°а¤№а¤ѕ а¤№аҐ€...",
  ],
  ar: [
    "Ш¬Ш§Ш±ЩЌ ШЄЩ‡ЩЉШ¦Ш© Щ…Ш­Щ„Щ„ BERT...",
    "Ш¬Ш§Ш±ЩЌ ШЁЩ†Ш§ШЎ Щ…ШЄШ¬Щ‡Ш§ШЄ Ш§Щ„ШЄШ¶Щ…ЩЉЩ† Щ„ШЄШіЩ„ШіЩ„ Ш§Щ„ШҐШЇШ®Ш§Щ„...",
    "Ш¬Ш§Ш±ЩЌ ШЄШґШєЩЉЩ„ ШЈЩ€ШІШ§Щ† Ш·ШЁЩ‚Ш© RuBERT-tiny2 (INT8 ШЇЩЉЩ†Ш§Щ…ЩЉЩѓЩЉ)...",
    "Ш¬Ш§Ш±ЩЌ ШЄШ·ШЁЩЉЩ‚ softmax Ш№Щ„Щ‰ logits Ш§Щ„Щ…Ш®Ш±Ш¬Ш§ШЄ [1, 2]...",
  ],
  pt: [
    "Inicializando o tokenizador BERT...",
    "Construindo vetores de embedding para a sequГЄncia de entrada...",
    "Executando pesos da camada RuBERT-tiny2 (INT8 dinГўmico)...",
    "Aplicando softmax aos logits de saГ­da [1, 2]...",
  ],
  fr: [
    "Initialisation du tokenizer BERT...",
    "Construction des vecteurs d'embedding pour la sГ©quence d'entrГ©e...",
    "ExГ©cution des poids de la couche RuBERT-tiny2 (INT8 dynamique)...",
    "Application du softmax aux logits de sortie [1, 2]...",
  ],
  de: [
    "BERT-Tokenizer wird initialisiert...",
    "Einbettungsvektoren fГјr die Eingabesequenz werden erstellt...",
    "Gewichte der RuBERT-tiny2-Schicht werden ausgefГјhrt (dynamisches INT8)...",
    "Softmax wird auf die Ausgabe-Logits [1, 2] angewendet...",
  ],
  ja: [
    "BERT гѓ€гѓјг‚ЇгѓЉг‚¤г‚¶гѓјг‚’е€ќжњџеЊ–дё­...",
    "е…ҐеЉ›г‚·гѓјг‚±гѓіг‚№гЃ®еџ‹г‚ЃиѕјгЃїгѓ™г‚Їгѓ€гѓ«г‚’ж§‹зЇ‰дё­...",
    "RuBERT-tiny2 гѓ¬г‚¤гѓ¤гѓјгЃ®й‡ЌгЃїг‚’е®џиЎЊдё­пј€е‹•зљ„ INT8пј‰...",
    "е‡єеЉ›гѓ­г‚ёгѓѓгѓ€ [1, 2] гЃ« softmax г‚’йЃ©з”Ёдё­...",
  ],
};

interface OnnxTicketType { id: string; locale: string; errType: string; inputLabel: string; modelEst: string; fraudLine: string; safeLine: string; commentLabel: string; noComment: string; footer: string; inventory: string; }

const ONNX_TICKET: Record<LanguageCode, OnnxTicketType> = {
  ru: {
    id: "ID РўРёРєРµС‚Р°:",
    locale: "Р›РѕРєР°Р»СЊ:",
    errType: "РўРёРї РѕС€РёР±РєРё:",
    inputLabel: "Р’С…РѕРґРЅРѕР№ С‚РµРєСЃС‚ РґРёР°Р»РѕРіР°:",
    modelEst: "РћС†РµРЅРєР° РјРѕРґРµР»Рё:",
    fraudLine: "Р’РµСЂРѕСЏС‚РЅРѕСЃС‚СЊ СѓРіСЂРѕР·С‹ (FRAUD):",
    safeLine: "Р‘РµР·РѕРїР°СЃРЅР°СЏ СЃРµРјР°РЅС‚РёРєР° (SAFE):",
    commentLabel: "РљРѕРјРјРµРЅС‚Р°СЂРёР№ С‚РµСЃС‚РёСЂРѕРІС‰РёРєР°:",
    noComment: "Р‘РµР· РєРѕРјРјРµРЅС‚Р°СЂРёСЏ.",
    footer: "РћС‚РїСЂР°РІР»РµРЅРѕ РёР· СЃРёСЃС‚РµРјС‹ РІРµСЂРёС„РёРєР°С†РёРё TrustNode",
    inventory: "РРЅРІРµРЅС‚Р°СЂСЊ: rubert_fraud_int8.onnx (INT8 quantized)",
  },
  en: {
    id: "Ticket ID:",
    locale: "Locale:",
    errType: "Error Type:",
    inputLabel: "Dialogue Input Text:",
    modelEst: "Model Estimation:",
    fraudLine: "Fraud Probability (FRAUD):",
    safeLine: "Safe Semantics (SAFE):",
    commentLabel: "Tester Feedback Comments:",
    noComment: "No comment provided.",
    footer: "Sent from TrustNode Verification Suite",
    inventory: "Inventory: rubert_fraud_int8.onnx (INT8 quantized)",
  },
  tr: {
    id: "Bilet KimliДџi:",
    locale: "BГ¶lge:",
    errType: "Hata TГјrГј:",
    inputLabel: "Diyalog GiriЕџ Metni:",
    modelEst: "Model DeДџerlendirmesi:",
    fraudLine: "DolandД±rД±cД±lД±k OlasД±lД±ДџД± (FRAUD):",
    safeLine: "GГјvenli Anlam (SAFE):",
    commentLabel: "Test UzmanД± Geri Bildirimi:",
    noComment: "Yorum yapД±lmadД±.",
    footer: "TrustNode DoДџrulama Paketinden gГ¶nderildi",
    inventory: "Envanter: rubert_fraud_int8.onnx (INT8 quantized)",
  },
  es: {
    id: "ID del Ticket:",
    locale: "Idioma:",
    errType: "Tipo de error:",
    inputLabel: "Texto de entrada del diГЎlogo:",
    modelEst: "EstimaciГіn del modelo:",
    fraudLine: "Probabilidad de fraude (FRAUD):",
    safeLine: "SemГЎntica segura (SAFE):",
    commentLabel: "Comentarios del evaluador:",
    noComment: "Sin comentarios.",
    footer: "Enviado desde el conjunto de verificaciГіn TrustNode",
    inventory: "Inventario: rubert_fraud_int8.onnx (INT8 cuantizado)",
  },
  zh: {
    id: "зҐЁиЇЃ IDпјљ",
    locale: "иЇ­иЁЂзЋЇеўѓпјљ",
    errType: "й”™иЇЇз±»ећ‹пјљ",
    inputLabel: "еЇ№иЇќиѕ“е…Ґж–‡жњ¬пјљ",
    modelEst: "жЁЎећ‹иЇ„дј°пјљ",
    fraudLine: "ж¬єиЇ€ж¦‚зЋ‡пј€FRAUDпј‰пјљ",
    safeLine: "е®‰е…ЁиЇ­д№‰пј€SAFEпј‰пјљ",
    commentLabel: "жµ‹иЇ•иЂ…еЏЌй¦€иЇ„и®єпјљ",
    noComment: "жњЄжЏђдѕ›иЇ„и®єгЂ‚",
    footer: "з”± TrustNode йЄЊиЇЃеҐ—д»¶еЏ‘йЂЃ",
    inventory: "еє“е­пјљrubert_fraud_int8.onnxпј€INT8 й‡ЏеЊ–пј‰",
  },
  hi: {
    id: "а¤џа¤їа¤•а¤џ ID:",
    locale: "а¤ІаҐ‹а¤•аҐ‡а¤І:",
    errType: "а¤¤аҐЌа¤°аҐЃа¤џа¤ї а¤ЄаҐЌа¤°а¤•а¤ѕа¤°:",
    inputLabel: "а¤ёа¤‚а¤µа¤ѕа¤¦ а¤‡а¤Ёа¤ЄаҐЃа¤џ а¤Єа¤ѕа¤ :",
    modelEst: "а¤®аҐ‰а¤Ўа¤І а¤…а¤ЁаҐЃа¤®а¤ѕа¤Ё:",
    fraudLine: "а¤§аҐ‹а¤–а¤ѕа¤§а¤Ўа¤јаҐЂ а¤ёа¤‚а¤­а¤ѕа¤µа¤Ёа¤ѕ (FRAUD):",
    safeLine: "а¤ёаҐЃа¤°а¤•аҐЌа¤·а¤їа¤¤ а¤ёа¤їа¤®аҐ‡а¤‚а¤џа¤їа¤•аҐЌа¤ё (SAFE):",
    commentLabel: "а¤Єа¤°аҐЂа¤•аҐЌа¤·а¤• а¤ЄаҐЌа¤°а¤¤а¤їа¤•аҐЌа¤°а¤їа¤Їа¤ѕ а¤џа¤їа¤ЄаҐЌа¤Єа¤Ја¤їа¤Їа¤ѕа¤Ѓ:",
    noComment: "а¤•аҐ‹а¤€ а¤џа¤їа¤ЄаҐЌа¤Єа¤ЈаҐЂ а¤Ёа¤№аҐЂа¤‚ а¤¦аҐЂ а¤—а¤€аҐ¤",
    footer: "TrustNode а¤ёа¤¤аҐЌа¤Їа¤ѕа¤Єа¤Ё а¤ёаҐЃа¤‡а¤џ а¤ёаҐ‡ а¤­аҐ‡а¤ња¤ѕ а¤—а¤Їа¤ѕ",
    inventory: "а¤‡а¤ЁаҐЌа¤µаҐ‡а¤‚а¤џа¤°аҐЂ: rubert_fraud_int8.onnx (INT8 а¤•аҐЌа¤µа¤ѕа¤‚а¤џа¤ѕа¤‡а¤ња¤јаҐЌа¤Ў)",
  },
  ar: {
    id: "Щ…Ш№Ш±ЩЃ Ш§Щ„ШЄШ°ЩѓШ±Ш©:",
    locale: "Ш§Щ„Щ„ШєШ©:",
    errType: "Щ†Щ€Ш№ Ш§Щ„Ш®Ш·ШЈ:",
    inputLabel: "Щ†Шµ ШҐШЇШ®Ш§Щ„ Ш§Щ„Ш­Щ€Ш§Ш±:",
    modelEst: "ШЄЩ‚ШЇЩЉШ± Ш§Щ„Щ†Щ…Щ€Ш°Ш¬:",
    fraudLine: "Ш§Ш­ШЄЩ…Ш§Щ„ЩЉШ© Ш§Щ„Ш§Ш­ШЄЩЉШ§Щ„ (FRAUD):",
    safeLine: "ШЇЩ„Ш§Щ„Ш§ШЄ ШўЩ…Щ†Ш© (SAFE):",
    commentLabel: "ШЄШ№Щ„ЩЉЩ‚Ш§ШЄ Ш§Щ„Щ…Ш®ШЄШЁЩђШ±:",
    noComment: "Щ„Ш§ ЩЉЩ€Ш¬ШЇ ШЄШ№Щ„ЩЉЩ‚.",
    footer: "ШЈЩЏШ±ШіЩ„ Щ…Щ† Щ…Ш¬Щ…Щ€Ш№Ш© Ш§Щ„ШЄШ­Щ‚Щ‚ TrustNode",
    inventory: "Ш§Щ„Щ…Ш®ШІЩ€Щ†: rubert_fraud_int8.onnx (INT8 Щ…ЩѓЩ…Щ‘Щ…)",
  },
  pt: {
    id: "ID do Ticket:",
    locale: "Localidade:",
    errType: "Tipo de Erro:",
    inputLabel: "Texto de Entrada do DiГЎlogo:",
    modelEst: "Estimativa do Modelo:",
    fraudLine: "Probabilidade de Fraude (FRAUD):",
    safeLine: "SemГўntica Segura (SAFE):",
    commentLabel: "ComentГЎrios do Testador:",
    noComment: "Nenhum comentГЎrio.",
    footer: "Enviado do pacote de verificaГ§ГЈo TrustNode",
    inventory: "InventГЎrio: rubert_fraud_int8.onnx (INT8 quantizado)",
  },
  fr: {
    id: "ID du ticket :",
    locale: "Langue :",
    errType: "Type d'erreur :",
    inputLabel: "Texte d'entrГ©e du dialogue :",
    modelEst: "Estimation du modГЁle :",
    fraudLine: "ProbabilitГ© de fraude (FRAUD) :",
    safeLine: "SГ©mantique sГ»re (SAFE) :",
    commentLabel: "Commentaires du testeur :",
    noComment: "Aucun commentaire.",
    footer: "EnvoyГ© depuis la suite de vГ©rification TrustNode",
    inventory: "Inventaire : rubert_fraud_int8.onnx (quantifiГ© INT8)",
  },
  de: {
    id: "Ticket-ID:",
    locale: "Gebietsschema:",
    errType: "Fehlerart:",
    inputLabel: "Dialog-Eingabetext:",
    modelEst: "ModellschГ¤tzung:",
    fraudLine: "Betrugswahrscheinlichkeit (FRAUD):",
    safeLine: "Sichere Semantik (SAFE):",
    commentLabel: "Feedback-Kommentare des Testers:",
    noComment: "Kein Kommentar.",
    footer: "Gesendet von der TrustNode-Verifizierungssuite",
    inventory: "Inventar: rubert_fraud_int8.onnx (INT8-quantisiert)",
  },
  ja: {
    id: "гѓЃг‚±гѓѓгѓ€ID:",
    locale: "гѓ­г‚±гѓјгѓ«:",
    errType: "г‚Ёгѓ©гѓјгЃ®зЁ®йЎћ:",
    inputLabel: "еЇѕи©±е…ҐеЉ›гѓ†г‚­г‚№гѓ€:",
    modelEst: "гѓўгѓ‡гѓ«жЋЁе®љ:",
    fraudLine: "и©ђж¬єгЃ®зўєзЋ‡пј€FRAUDпј‰:",
    safeLine: "е®‰е…ЁгЃЄж„Џе‘іи§Јжћђпј€SAFEпј‰:",
    commentLabel: "гѓ†г‚№г‚їгѓјгЃ®гѓ•г‚Јгѓјгѓ‰гѓђгѓѓг‚Їг‚ігѓЎгѓігѓ€:",
    noComment: "г‚ігѓЎгѓігѓ€гЃЇгЃ‚г‚ЉгЃѕгЃ›г‚“гЂ‚",
    footer: "TrustNode ж¤њиЁјг‚№г‚¤гѓјгѓ€гЃ‹г‚‰йЂЃдїЎ",
    inventory: "ењЁеє«: rubert_fraud_int8.onnxпј€INT8 й‡Џе­ђеЊ–пј‰",
  },
};
export function OnnxInteractiveTester({ language }: { language: string }) {
  // Localized dictionaries
  const dict = ONNX_DICT[language as LanguageCode] || ONNX_DICT.en;

  const presets = ONNX_PRESETS[language as LanguageCode] || ONNX_PRESETS.en;
  const tkt = ONNX_TICKET[language as LanguageCode] || ONNX_TICKET.en;

  const [inputText, setInputText] = useState(presets[0].text);
  const [isTesting, setIsTesting] = useState(false);
  const [testStep, setTestStep] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Heuristic Inference outputs
  const [scores, setScores] = useState({ fraud: 98.4, safe: 1.6 });
  const [tokens, setTokens] = useState<string[]>([]);
  const [flaggedTokens, setFlaggedTokens] = useState<string[]>([]);

  // Feedback form states
  const [showFeedback, setShowFeedback] = useState(false);
  const [errorType, setErrorType] = useState("False Positive");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  const triggers = ONNX_TRIGGERS[language as LanguageCode] || ONNX_TRIGGERS.en;

  const handlePresetSelect = (preset: OnnxPreset) => {
    setInputText(preset.text);
    setShowResults(false);
    setShowFeedback(false);
  };

  const handleInference = () => {
    setIsTesting(true);
    setShowResults(false);
    setShowFeedback(false);

    // Dynamic ticket ID for this run
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setTicketId(`TRN-BERT-${randomNum}`);

    // Simulation steps
    const steps = ONNX_STEPS[language as LanguageCode] || ONNX_STEPS.en;

    let currentStepIdx = 0;
    setTestStep(steps[currentStepIdx]);

    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setTestStep(steps[currentStepIdx]);
      } else {
        clearInterval(interval);
        
        // Compute realistic score
        const lowercaseText = inputText.toLowerCase();
        let matchCount = 0;
        const foundFlags: string[] = [];
        
        const textTokens = inputText.split(/[\s,.:;!?"'\-пјЊгЂ‚пјЃгЂЃпјљпј›пј€пј‰]+/);
        textTokens.forEach(token => {
          const isFlagged = triggers.some(trigger => token.toLowerCase().includes(trigger));
          if (isFlagged && token.length > 2) {
            matchCount++;
            foundFlags.push(token);
          }
        });

        const calculatedFraud = Math.min(99.7, Math.max(1.1, matchCount > 0 ? (35 + matchCount * 22 + Math.random() * 5) : (1.5 + Math.random() * 4)));
        const calculatedSafe = 100 - calculatedFraud;

        setScores({
          fraud: parseFloat(calculatedFraud.toFixed(1)),
          safe: parseFloat(calculatedSafe.toFixed(1))
        });
        setTokens(textTokens.filter(t => t.trim().length > 0));
        setFlaggedTokens(foundFlags);
        
        setIsTesting(false);
        setShowResults(true);
      }
    }, 300);
  };

    const generateTicketText = () => {
    return `рџ¤– [TRUSTNODE BERT WEIGHTS TICKET] рџ¤–
-----------------------------------------
${tkt.id} ${ticketId}
${tkt.locale} ${language.toUpperCase()}
${tkt.errType} ${errorType}

${tkt.inputLabel}
"${inputText}"

${tkt.modelEst}
- ${tkt.fraudLine} ${scores.fraud}%
- ${tkt.safeLine} ${scores.safe}%

${tkt.commentLabel}
${feedbackComment || tkt.noComment}

-----------------------------------------
${tkt.footer}
${tkt.inventory}`;
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(generateTicketText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTelegram = () => {
    const text = encodeURIComponent(generateTicketText());
    // Direct link to community chat @TrustNode_team
    window.open(`https://t.me/TrustNode_team?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col h-full justify-between space-y-6">
      
      {/* Title block */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-display font-bold text-xl text-[#F5F5F0]">
            {dict.title}
          </h3>
        </div>
        <p className="font-sans text-xs text-gray-400 leading-relaxed">
          {dict.subtitle}
        </p>
      </div>

      {/* Preset Picker */}
      <div>
        <span className="block font-mono text-[9px] text-gray-500 uppercase tracking-wider mb-2">
          {dict.presetTitle}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetSelect(preset)}
              className="px-2.5 py-1 rounded bg-[#3C404A] hover:bg-[#12141A] border border-[#3C404A]/50 text-[10px] font-mono text-gray-300 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Area Input */}
      <div className="space-y-2">
        <textarea
          value={inputText}
          onChange={(e) => { setInputText(e.target.value); setShowResults(false); }}
          placeholder={dict.placeholder}
          rows={3}
          className="w-full p-3 bg-black/40 border border-[#3C404A]/80 rounded-md text-xs sm:text-sm font-sans text-gray-200 placeholder-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/70 focus:border-[#3B82F6]/50 resize-none transition"
        />

        <button
          onClick={handleInference}
          disabled={isTesting || !inputText.trim()}
          className="w-full py-2.5 rounded-md font-mono text-xs font-bold text-white bg-[#3B82F6] hover:bg-blue-600 shadow-glow-md hover:shadow-glow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isTesting ? (
            <>
              <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              <span>{dict.btnRunning}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>{dict.btnRun}</span>
            </>
          )}
        </button>
      </div>

      {/* Animation console */}
      {isTesting && (
        <div className="p-4 rounded-md bg-black/50 border border-white/[0.03] font-mono text-[10px] text-cyan-400 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3B82F6]" />
          <span>{testStep}</span>
        </div>
      )}

      {/* Interactive results mapping */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.96 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.96 }}
            style={{ transformOrigin: "top" }}
            className="space-y-4"
          >
            {/* Decoded Output Banner */}
            <div className="p-4 rounded-md bg-[#0A0A0B] border border-[#3C404A]/50 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#3C404A]/30">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">{dict.resultHeader}</span>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  scores.fraud > 70 
                    ? "bg-red-950/40 border border-red-500/40 text-red-500" 
                    : scores.fraud > 20 
                    ? "bg-amber-950/40 border border-amber-500/40 text-amber-500" 
                    : "bg-emerald-950/40 border border-emerald-500/40 text-emerald-500"
                }`}>
                  {scores.fraud > 70 ? dict.modelStatusFraud : scores.fraud > 20 ? dict.modelStatusSuspicious : dict.modelStatusSafe}
                </span>
              </div>

              {/* Progress bars */}
              <div className="space-y-2.5 font-mono text-xs text-gray-300">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>{dict.fraudLabel}</span>
                    <span className={scores.fraud > 60 ? "text-red-500 font-bold" : "text-gray-400"}>{scores.fraud}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${scores.fraud > 60 ? "bg-red-500" : "bg-[#3B82F6]"}`}
                      style={{ width: `${scores.fraud}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>{dict.safeLabel}</span>
                    <span>{scores.safe}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.03] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${scores.safe}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Token Attention Visualiser */}
            <div className="p-4 rounded-md bg-[#0A0A0B]/60 border border-white/[0.02] space-y-2">
              <span className="block font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                {dict.attentionTitle}
              </span>
              <div className="flex flex-wrap gap-1.5 font-sans text-xs">
                {tokens.map((token, i) => {
                  const isFlagged = flaggedTokens.includes(token);
                  return (
                    <span 
                      key={i} 
                      className={`px-1.5 py-0.5 rounded transition-all font-mono text-[10px] ${
                        isFlagged 
                          ? "bg-red-500/10 border border-red-500/30 text-red-400 font-bold animate-pulse" 
                          : "bg-white/[0.02] text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {token}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Toggle Feedback portal */}
            <div>
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400 hover:text-[#3B82F6] transition-all bg-[#3C404A] border border-[#3C404A]/50 px-3 py-1.5 rounded-md"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>{showFeedback ? dict.hideTicketForm : dict.feedbackHeader}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback ticket creator block */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-5 rounded-md border border-[#3C404A]/80 bg-[#0A0A0B] space-y-4"
          >
            <div>
              <h4 className="font-display font-semibold text-xs text-[#F5F5F0]">
                {dict.feedbackHeader}
              </h4>
              <p className="font-sans text-[11px] text-gray-500 mt-1 leading-relaxed">
                {dict.feedbackSub}
              </p>
            </div>

            {/* Selector error classification */}
            <div className="space-y-2.5">
              <div>
                <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">{dict.errType}</label>
                <select 
                  value={errorType}
                  onChange={(e) => setErrorType(e.target.value)}
                  className="w-full bg-[#3C404A] border border-[#3C404A]/80 text-xs text-gray-300 p-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/70 focus:border-[#3B82F6]/50"
                >
                  <option value="False Positive (Р›РѕР¶РЅРѕРµ СЃСЂР°Р±Р°С‚С‹РІР°РЅРёРµ)">{dict.errFalsePositive}</option>
                  <option value="False Negative (РџСЂРѕРїСѓСЃРє СѓРіСЂРѕР·С‹)">{dict.errFalseNegative}</option>
                  <option value="Other Anomaly (Р”СЂСѓРіРѕР№ Р±Р°Рі)">{dict.errOther}</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1">{dict.commentLabel}</label>
                <input 
                  type="text"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder={dict.commentPlaceholder}
                  className="w-full bg-[#3C404A] border border-[#3C404A]/80 text-xs text-gray-300 p-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/70 focus:border-[#3B82F6]/50 placeholder-gray-600"
                />
              </div>
            </div>

            {/* Pre-formatted Ticket Inspection Board */}
            <div className="p-3 bg-black/60 border border-[#3C404A]/50 rounded-md text-left">
              <span className="block font-mono text-[8px] text-[#3B82F6] uppercase tracking-widest mb-1.5">{dict.ticketSpec}</span>
              <pre className="font-mono text-[9px] text-gray-400 whitespace-pre-wrap select-all bg-black/20 p-2 rounded max-h-40 overflow-y-auto">
                {generateTicketText()}
              </pre>
            </div>

            {/* Interaction Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <button
                onClick={handleOpenTelegram}
                className="flex-1 py-2.5 rounded-md bg-[#3B82F6] hover:bg-blue-600 font-mono text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition-all shadow-glow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dict.btnTg}</span>
              </button>

              <button
                onClick={handleCopyTicket}
                className="px-4 py-2.5 rounded-md border border-[#3C404A]/60 bg-[#3C404A] hover:border-gray-500 font-mono text-[11px] text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? dict.copied : dict.btnCopy}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
