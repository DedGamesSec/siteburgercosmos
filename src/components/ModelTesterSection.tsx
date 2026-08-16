import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageCode } from "../i18n/languages";
import { useEcoMode } from "../context/EcoModeContext";
import { classifyText, getLoadProgress, preloadRubert, RubertResult } from "../lib/rubert";
import { MODEL_TESTER_DICT, MODEL_TESTER_PRESETS } from "../i18n/dicts/modelTester";
import SectionBadge from "./SectionBadge";
import { Activity, AlertTriangle, CheckCircle2, Loader2, Play, RotateCcw, ShieldCheck, Zap } from "lucide-react";

type Phase = "idle" | "loading" | "ready" | "error";

const CLASS_COLORS = ["#3B82F6", "#EF4444", "#F59E0B"];

const ModelTesterSection: React.FC = () => {
  const { language } = useLanguage();
  const { ecoMode } = useEcoMode();
  const d = MODEL_TESTER_DICT[language] || MODEL_TESTER_DICT.en;
  const presets = MODEL_TESTER_PRESETS[language] || MODEL_TESTER_PRESETS.en;

  const wrapRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [inputText, setInputText] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RubertResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const startLoad = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("loading");
    try {
      await preloadRubert();
      setPhase("ready");
    } catch {
      setPhase("error");
      startedRef.current = false;
    }
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) startLoad();
      },
      { threshold: 0.05 }
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [startLoad]);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => setProgress(Math.round(getLoadProgress() * 100)), 120);
    return () => clearInterval(id);
  }, [phase]);

  const runInference = async (text: string) => {
    if (running) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setRunning(true);
    setErrorMsg("");
    setResult(null);
    try {
      if (phase !== "ready") await startLoad();
      const r = await classifyText(trimmed);
      setResult(r);
    } catch {
      setErrorMsg(d.errRun);
    } finally {
      setRunning(false);
    }
  };

  const handleCheck = () => runInference(inputText);
  const handlePreset = (text: string) => {
    setInputText(text);
    setResult(null);
    setErrorMsg("");
    if (phase === "idle") startLoad();
  };

  const handleRetry = () => {
    setPhase("idle");
    setProgress(0);
    startedRef.current = false;
    setErrorMsg("");
    startLoad();
  };

  const maxProb = result ? Math.max(result.probs.neutral, result.probs.fraud, result.probs.hardNeg) : 1;

  return (
    <section
      id="verification"
      className="relative w-full py-16 sm:py-20 px-4 bg-[#0A0A0B] overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10" ref={wrapRef}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* LEFT: CONTENT */}
          <div>
            <SectionBadge variant="slash" label={d.badge} className="mb-6" />

            <h2 className="font-display font-medium text-3xl sm:text-5xl text-[#F5F5F0] tracking-tighter mb-4">
              {d.title}
            </h2>

            <p className="font-mono text-xs sm:text-sm text-[#3B82F6] uppercase tracking-wider mb-6">
              {d.subtitle}
            </p>

            <p className="font-sans text-sm sm:text-base text-gray-400 leading-relaxed mb-10">
              {d.body}
            </p>

            {/* Entry 3.1 */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141A] p-5 mb-4">
              <h3 className="font-display font-medium text-lg text-[#F5F5F0] mb-2">
                {d.entryTriggerTitle}
              </h3>
              <p className="font-sans text-xs text-gray-400 leading-relaxed mb-3">
                {d.entryTriggerIntro}
              </p>
              <div className="space-y-2">
                <div>
                  <span className="font-mono text-[11px] text-[#6FB1FF] uppercase tracking-wider">
                    {d.entryTriggerStrongLabel}
                  </span>
                  <p className="font-sans text-xs text-gray-300 mt-0.5">{d.entryTriggerStrong}</p>
                </div>
                <div>
                  <span className="font-mono text-[11px] text-[#6FB1FF] uppercase tracking-wider">
                    {d.entryTriggerMediumLabel}
                  </span>
                  <p className="font-sans text-xs text-gray-300 mt-0.5">{d.entryTriggerMedium}</p>
                </div>
                <div>
                  <span className="font-mono text-[11px] text-[#6FB1FF] uppercase tracking-wider">
                    {d.entryTriggerMoneyLabel}
                  </span>
                  <p className="font-sans text-xs text-gray-300 mt-0.5">{d.entryTriggerMoney}</p>
                </div>
                <div>
                  <span className="font-mono text-[11px] text-[#6FB1FF] uppercase tracking-wider">
                    {d.entryTriggerStemLabel}
                  </span>
                  <p className="font-sans text-xs text-gray-300 mt-0.5">{d.entryTriggerStem}</p>
                </div>
              </div>
            </div>

            {/* Entry 3.2 */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141A] p-5 mb-4">
              <h3 className="font-display font-medium text-lg text-[#F5F5F0] mb-2">
                {d.entryDecisionTitle}
              </h3>
              <p className="font-sans text-xs text-gray-400 leading-relaxed mb-3">
                {d.entryDecisionIntro}
              </p>
              <ul className="space-y-2">
                {[d.entryDecisionA, d.entryDecisionB, d.entryDecisionC].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 w-1 h-1 rounded-full bg-[#3B82F6] shrink-0" />
                    <span className="font-sans text-xs text-gray-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-xl border border-[#3B82F6]/20 bg-[#0E0F12] p-3">
                <p className="font-sans text-xs text-gray-300 leading-relaxed">
                  {d.entryDecisionFinal}
                </p>
              </div>
            </div>

            {/* Entry 3.3 */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#12141A] p-5">
              <h3 className="font-display font-medium text-lg text-[#F5F5F0] mb-2">
                {d.entryClassesTitle}
              </h3>
              <p className="font-sans text-xs text-gray-400 leading-relaxed mb-3">
                {d.entryClassesIntro}
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#3B82F6] shrink-0" />
                  <p className="font-sans text-xs text-gray-300 leading-relaxed">{d.entryClasses0}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
                  <p className="font-sans text-xs text-gray-300 leading-relaxed">{d.entryClasses1}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                  <p className="font-sans text-xs text-gray-300 leading-relaxed">{d.entryClasses2}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE TESTER */}
          <div className="lg:sticky lg:top-24">
            <div className="relative rounded-2xl border border-white/[0.06] bg-[#0E0F12] overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#12141A]/80 backdrop-blur-sm px-3 py-1.5">
                <Activity className="w-3 h-3 text-[#3B82F6]" />
                <span className="font-mono text-[10px] text-[#6FB1FF] uppercase tracking-widest font-semibold">
                  {d.testerTitle}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-white/[0.06] bg-[#12141A]/80 backdrop-blur-sm px-3 py-1.5 max-w-[55%]">
                {phase === "ready" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Loader2 className="w-3 h-3 text-[#3B82F6] animate-spin shrink-0" />
                )}
                <span className="font-mono text-[10px] text-gray-300 uppercase tracking-wider truncate">
                  {phase === "ready" ? d.readyLabel : phase === "error" ? d.errBadge : d.loadingLabel.replace("{0}", String(progress))}
                </span>
              </div>

              <div className="p-6 pt-20 sm:p-8 sm:pt-20">
                <p className="font-sans text-sm text-gray-400 leading-relaxed mb-6">
                  {d.testerSubtitle}
                </p>

                {/* Presets */}
                <div className="mb-4">
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                    {d.presetTitle}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => handlePreset(p.text)}
                        className="rounded-full border border-white/[0.08] bg-[#12141A] px-3 py-1.5 font-mono text-[11px] text-gray-300 hover:border-[#3B82F6]/40 hover:text-[#6FB1FF] transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <label htmlFor="model-tester-input" className="sr-only">
                  {d.placeholder}
                </label>
                <textarea
                  id="model-tester-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={d.placeholder}
                  rows={5}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#12141A] p-3.5 font-sans text-sm text-[#F5F5F0] placeholder:text-gray-600 resize-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3B82F6] focus-visible:outline-offset-1 focus:border-[#3B82F6]/50 transition-colors"
                />

                {/* Load progress bar */}
                {phase === "loading" && (
                  <div className="mt-4" role="status" aria-live="polite">
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-[#3B82F6] transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                      {d.loadingLabel.replace("{0}", String(progress))}
                    </p>
                  </div>
                )}

                {/* Error */}
                {phase === "error" && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="font-sans text-xs text-red-300 flex-1">{d.errLoad}</p>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#12141A] px-3 py-1.5 font-mono text-[11px] text-gray-300 hover:text-[#6FB1FF] transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {d.retry}
                    </button>
                  </div>
                )}

                {/* Run error */}
                {errorMsg && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="font-sans text-xs text-red-300">{errorMsg}</p>
                  </div>
                )}

                {/* Check button */}
                <button
                  onClick={handleCheck}
                  disabled={running || phase === "error" || !inputText.trim()}
                  aria-busy={running}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-3 font-mono text-sm font-semibold text-[#0A0A0B] hover:bg-[#5B9DFB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {running ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {running ? d.btnChecking : d.btnCheck}
                </button>

                {/* Results */}
                {result && !running && (
                  <div className="mt-6" aria-live="polite">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span className="font-mono text-[10px] text-[#6FB1FF] uppercase tracking-widest font-semibold">
                        {d.resultHeader}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: d.classNeutralLabel, v: result.probs.neutral, c: CLASS_COLORS[0] },
                        { label: d.classFraudLabel, v: result.probs.fraud, c: CLASS_COLORS[1] },
                        { label: d.classHardNegLabel, v: result.probs.hardNeg, c: CLASS_COLORS[2] },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
                              {row.label}
                            </span>
                            <span className="font-mono text-xs font-bold" style={{ color: row.c }}>
                              {(row.v * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(row.v / maxProb) * 100}%`,
                                backgroundColor: row.c,
                                opacity: row.v === maxProb ? 1 : 0.45,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#12141A] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck
                          className="w-4 h-4"
                          style={{ color: CLASS_COLORS[result.verdict] }}
                        />
                        <span className="font-mono text-xs font-semibold text-[#F5F5F0] uppercase tracking-wider">
                          {result.verdict === 0
                            ? d.classNeutralLabel
                            : result.verdict === 1
                              ? d.classFraudLabel
                              : d.classHardNegLabel}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-wider">
                        {d.latencyLabel} · {result.latencyMs.toFixed(0)}ms · {result.inputTokens.length} tok
                      </span>
                    </div>

                    <p className="mt-3 font-sans text-[11px] text-gray-500 leading-relaxed">
                      {d.appNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModelTesterSection;
