import React, { useState } from "react";
import { Cpu, ServerCrash, CheckCircle2, Sliders, Shield, ChevronDown } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import SectionBadge from "./SectionBadge";
import ScanCard from "./ScanCard";

const USP_ICONS = [
  { Icon: Cpu, wrapClass: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20" },
  { Icon: ServerCrash, wrapClass: "bg-red-500/10 text-red-400 border border-red-500/10" },
  { Icon: CheckCircle2, wrapClass: "bg-green-500/10 text-green-400 border border-green-500/10" },
];

function renderUspDesc(desc: string) {
  const marker = "rubert-tiny2";
  const idx = desc.indexOf(marker);
  if (idx === -1) return desc;
  return (
    <>
      {desc.slice(0, idx)}
      <span className="font-mono text-gray-300">{marker}</span>
      {desc.slice(idx + marker.length)}
    </>
  );
}

const HowItWorksSection = React.memo(function HowItWorksSection() {
  const { t } = useTranslation();
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [isAdvancedView, setIsAdvancedView] = useState<boolean>(true);

  const simplifiedLayers = t.how.layers.map((layer, i) => ({
    num: String(i + 1).padStart(2, "0"),
    name: layer.name,
    tech: layer.tech,
    desc: layer.desc,
  }));

  const layersSource = t.how.sevenLayers || [];
  const fullLayers = layersSource.map((layer, i) => ({
    num: String(i + 1).padStart(2, "0"),
    name: layer.name,
    tech: layer.tech,
    desc: layer.desc,
  }));

  const activeLayersList = isAdvancedView ? fullLayers : simplifiedLayers;
  const currentActiveIndex = Math.min(activeLayer, activeLayersList.length - 1);
  const n = activeLayersList.length;

  // SVG dome geometry
  const CX = 200;
  const CY = 190;
  const R_MIN = 34;
  const R_MAX = 166;
  const radiusFor = (i: number) =>
    R_MIN + (i * (R_MAX - R_MIN)) / Math.max(n - 1, 1);
  const arcPath = (i: number) => {
    const r = radiusFor(i);
    return `M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}`;
  };

  const isRoadmap = (layer: { tech: string; name: string }) =>
    /roadmap|в разработке/i.test(`${layer.tech} ${layer.name}`);

  const activeLayerData = activeLayersList[currentActiveIndex];

  return (
    <section
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden"
      id="how-it-works"
    >
      {/* Background grid + glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3B82F6]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3B82F6]/[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <SectionBadge variant="slash" icon={<Shield className="w-3.5 h-3.5 text-[#3B82F6]" />} label={t.how.badge} className="mb-6" />

          <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-6">
            {t.how.title} <span className="text-[#3B82F6]">{t.how.titleHighlight}</span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t.how.subtitle}
          </p>

          {/* Toggle Tab Selector (Swiss-style segment control) */}
          <div className="inline-flex p-1 rounded-xl bg-[#0A0A0B] border border-white/[0.04] mt-8 shrink-0 relative z-20">
            <button
              onClick={() => {
                setIsAdvancedView(false);
                setActiveLayer(0);
              }}
              aria-pressed={!isAdvancedView}
              className={`px-4 py-2 rounded-xl font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                !isAdvancedView
                  ? "bg-[#3B82F6] text-white shadow-glow-md"
                  : "text-gray-500 hover:text-gray-300 bg-transparent"
              }`}
            >
              {t.how.btnSimplified}
            </button>
            <button
              onClick={() => {
                setIsAdvancedView(true);
                setActiveLayer(0);
              }}
              aria-pressed={isAdvancedView}
              className={`px-4 py-2 rounded-xl font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                isAdvancedView
                  ? "bg-[#3B82F6] text-white shadow-glow-md"
                  : "text-gray-500 hover:text-gray-300 bg-transparent"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {t.how.btnAdvanced}
            </button>
          </div>
        </div>

        {/* Dome + Pipeline split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* LEFT: Interactive PHANTOM dome */}
          <div className="lg:col-span-6" id="layered-diagram">
            <h3 className="font-display font-medium text-base sm:text-lg lg:text-xl text-[#F5F5F0] mb-4">
              {isAdvancedView ? t.how.pipelineHeader : t.how.layersHeading}
            </h3>

            <div className="relative rounded-2xl border border-white/[0.06] bg-[#0E0F12] overflow-hidden p-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.06)_0%,transparent_60%)] pointer-events-none" />

              <svg viewBox="0 0 400 230" className="w-full h-auto block relative">
                {/* base line */}
                <line x1={CX - R_MAX - 6} y1={CY} x2={CX + R_MAX + 6} y2={CY} stroke="rgba(60,64,74,0.5)" strokeWidth="1" />

                {/* radar sweep */}
                <g className="radar-sweep" opacity="0.35">
                  <line x1={CX} y1={CY} x2={CX} y2={CY - R_MAX - 6} stroke="rgba(59,130,246,0.7)" strokeWidth="1.5" />
                </g>

                {/* layer arcs */}
                {activeLayersList.map((layer, i) => {
                  const active = currentActiveIndex === i;
                  const roadmap = isRoadmap(layer);
                  const color = active ? "#3B82F6" : roadmap ? "rgba(251,146,60,0.45)" : "rgba(60,64,74,0.85)";
                  const r = radiusFor(i);
                  return (
                    <g
                      key={layer.num}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={`${layer.name} — LAYER ${layer.num}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setActiveLayer(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActiveLayer(i);
                        }
                      }}
                    >
                      {/* hit area */}
                      <path d={arcPath(i)} fill="none" stroke="transparent" strokeWidth="18" />
                      {/* glow for active */}
                      {active && (
                        <path d={arcPath(i)} fill="none" stroke="rgba(59,130,246,0.35)" strokeWidth="9" strokeLinecap="round" />
                      )}
                      <path
                        d={arcPath(i)}
                        fill="none"
                        stroke={color}
                        strokeWidth={active ? 3 : 1.6}
                        strokeLinecap="round"
                        opacity={active ? 1 : 0.9}
                      />
                      {/* node on top of arc */}
                      <circle
                        cx={CX}
                        cy={CY - r}
                        r={active ? 6.5 : 4.5}
                        fill={active ? "#3B82F6" : "#1A1D24"}
                        stroke={active ? "#6FB1FF" : "rgba(60,64,74,0.9)"}
                        strokeWidth="1.5"
                      />
                      <text
                        x={CX}
                        y={CY - r + (active ? 2.2 : 1.6)}
                        textAnchor="middle"
                        fill={active ? "#fff" : "#8B8F9C"}
                        fontSize="7.5"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        {layer.num}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Status chip */}
              <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#12141A]/80 backdrop-blur-sm px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                <span className="font-mono text-[9px] text-[#6FB1FF] uppercase tracking-widest font-semibold">
                  PHANTOM // DOME
                </span>
              </div>
            </div>

            {/* Active layer detail card */}
            <ScanCard
              className="mt-4"
              padding="p-4 sm:p-5"
              borderColor={isRoadmap(activeLayerData) ? "border-amber-500/30" : "border-[#3B82F6]/30"}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                <span className={`inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest font-bold ${
                  isRoadmap(activeLayerData) ? "text-amber-400" : "text-[#6FB1FF]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isRoadmap(activeLayerData) ? "bg-amber-400" : "bg-[#3B82F6]"}`} />
                  LAYER {activeLayerData.num}
                </span>
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider">
                  {activeLayerData.tech}
                </span>
              </div>
              <h4 className="font-display font-medium text-lg text-[#F5F5F0] mb-2">
                {activeLayerData.name}
              </h4>
              <p className="font-sans text-sm text-gray-400 leading-relaxed">
                {activeLayerData.desc}
              </p>
            </ScanCard>
          </div>

          {/* RIGHT: Pipeline stepper */}
          <div className="lg:col-span-6">
            <div className="relative">
              {/* connector line */}
              <div className="absolute left-[21px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-[#3B82F6]/40 via-[#3C404A]/40 to-transparent z-0" />

              <div className="space-y-2 relative z-10">
                {activeLayersList.map((layer, index) => {
                  const active = currentActiveIndex === index;
                  const roadmap = isRoadmap(layer);
                  return (
                    <button
                      key={layer.num}
                      onClick={() => setActiveLayer(index)}
                      aria-pressed={active}
                      className={`w-full text-left flex items-start gap-4 rounded-xl border p-3 sm:p-4 transition-all duration-300 cursor-pointer ${
                        active
                          ? "bg-[#12141A] border-[#3B82F6]/40 shadow-glow-md"
                          : "border-white/[0.04] hover:border-[#3B82F6]/20 bg-transparent"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-mono text-[11px] font-bold border transition-all duration-300 ${
                          active
                            ? "bg-[#3B82F6] border-[#3B82F6] text-white shadow-glow-sm"
                            : roadmap
                              ? "bg-[#12141A] border-amber-500/40 text-amber-400"
                              : "bg-[#12141A] border-[#3C404A] text-gray-400"
                        }`}
                      >
                        {layer.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className={`font-display font-medium text-sm ${active ? "text-[#F5F5F0]" : "text-gray-300"}`}>
                            {layer.name}
                          </span>
                          <span className="font-mono text-[9px] tracking-wider uppercase opacity-80 truncate">
                            {layer.tech}
                          </span>
                        </div>
                        <p
                          className={`font-sans text-xs text-gray-400 leading-relaxed transition-all duration-300 overflow-hidden ${
                            active ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"
                          }`}
                        >
                          {layer.desc}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 mt-1 transition-transform duration-300 ${
                          active ? "rotate-180 text-[#3B82F6]" : "text-gray-600"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* USP strip */}
        <div className="mt-14" id="usp-highlights">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#3B82F6] font-bold">
              CORE EDGE
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {t.how.usp.map((usp, i) => {
              const { Icon, wrapClass } = USP_ICONS[i];
              return (
                <ScanCard
                  key={usp.title}
                  padding="p-5"
                  className="h-full"
                  cardClassName="hover:border-[#3B82F6]/30 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${wrapClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-medium text-base text-[#F5F5F0] mb-1.5">
                        {usp.title}
                      </h4>
                      <p className="font-sans text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {i === 0 ? renderUspDesc(usp.desc) : usp.desc}
                      </p>
                    </div>
                  </div>
                </ScanCard>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HowItWorksSection;
