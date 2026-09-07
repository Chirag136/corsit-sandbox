import React, { useState } from 'react';
import { CircuitError } from '../../types/circuit';
import { CircuitExplanation, CodeDebugResult } from '../../types/ai';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Wand2,
  X,
  Check,
  Bot,
  Terminal,
} from 'lucide-react';
import { aiService } from '../../services/aiService';

interface TinkerAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: CircuitError[];
  onCheckWiring: () => void;
  onAutoWirePrompt: (prompt: string) => void;
  onExplainCircuit: () => void;
  explanation: CircuitExplanation | null;
  arduinoCode: string;
  isAiBusy: boolean;
}

export const TinkerAiModal: React.FC<TinkerAiModalProps> = ({
  isOpen,
  onClose,
  errors,
  onCheckWiring,
  onAutoWirePrompt,
  onExplainCircuit,
  explanation,
  arduinoCode,
  isAiBusy,
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'autowire' | 'explain' | 'debug'>('errors');
  const [promptInput, setPromptInput] = useState('build me an obstacle-avoiding bot');
  const [debugIssue, setDebugIssue] = useState('Bot is not turning when obstacle detected');
  const [debugResult, setDebugResult] = useState<CodeDebugResult | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  if (!isOpen) return null;

  const handleAutoWireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAutoWirePrompt(promptInput.trim());
    onClose();
  };

  const handleRunDebugger = async () => {
    setIsDebugging(true);
    try {
      const res = await aiService.debugCode(arduinoCode, debugIssue);
      setDebugResult(res);
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none text-white font-sans animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-panel border border-trace rounded-lg w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-panel-2 border-b border-trace flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-maroon flex items-center justify-center border border-red/50 shadow-glow-red">
              <Bot className="w-4 h-4 text-red" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                CorSIT AI Assistant
                <span className="text-[10px] text-red font-mono lowercase bg-red/10 border border-red/30 px-1.5 py-0.2 rounded">
                  Claude & Robotics Engine
                </span>
              </h3>
              <p className="text-[11px] text-muted font-sans">
                Automated electrical validation, intelligent auto-wiring, and circuit tutoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-trace text-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-base border-b border-trace text-xs font-mono">
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'errors'
                ? 'border-red text-red bg-panel/70'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            {errors.length > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-red" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Wiring Doctor ({errors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('autowire')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'autowire'
                ? 'border-purple-400 text-purple-400 bg-panel/70'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Auto-Wire from Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab('explain')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'explain'
                ? 'border-sky-400 text-sky-400 bg-panel/70'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Explain Circuit</span>
          </button>

          <button
            onClick={() => setActiveTab('debug')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'debug'
                ? 'border-amber-400 text-amber-400 bg-panel/70'
                : 'border-transparent text-muted hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Code Debugger</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: WIRING ERRORS */}
          {activeTab === 'errors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-trace">
                <span className="text-xs text-muted font-mono">
                  Real-time electrical validation against short circuits, reverse diodes & swapped lines
                </span>
                <button
                  onClick={onCheckWiring}
                  disabled={isAiBusy}
                  className="px-3 py-1 bg-red hover:bg-red/90 text-white rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5 shadow-glow-red"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAiBusy ? 'Diagnosing...' : 'Re-scan Circuit'}
                </button>
              </div>

              {errors.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">All Electrical Nets Healthy</h4>
                  <p className="text-xs text-muted max-w-sm mx-auto font-sans">
                    No open circuits, missing current-limiting resistors, or swapped signal lines found. Ready to power on!
                  </p>
                </div>
              ) : (
                errors.map((err, i) => (
                  <div
                    key={i}
                    className="bg-panel-2 border border-red/40 rounded p-3 space-y-2 shadow-glow-red"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-red flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        {err.issue}
                      </span>
                      <span className="text-[10px] font-mono bg-red/20 text-red px-2 py-0.5 rounded border border-red/30 uppercase">
                        {err.componentId}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-sans leading-relaxed">
                      {err.explanation}
                    </p>
                    <div className="bg-base p-2 rounded border border-trace font-mono text-xs text-emerald-300">
                      💡 Fix: {err.suggestedFix}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: AUTO-WIRE FROM PROMPT (Core Pitch Feature 3) */}
          {activeTab === 'autowire' && (
            <div className="space-y-4 font-sans">
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase mb-1">
                  Natural Language Hardware Synthesis
                </h4>
                <p className="text-xs text-muted">
                  Type what you want to build. CorSIT AI will automatically place the necessary chips on the workbench and route all power, ground, and signal traces cleanly.
                </p>
              </div>

              <form onSubmit={handleAutoWireSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="e.g. build me an obstacle-avoiding bot..."
                    className="w-full bg-base border border-trace rounded p-3 text-white text-xs font-mono focus:border-purple-400 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-muted">Suggested prompts:</span>
                  <button
                    type="button"
                    onClick={() => setPromptInput('build me an obstacle-avoiding bot')}
                    className="text-[11px] font-mono bg-panel-2 hover:bg-trace border border-trace px-2 py-0.5 rounded text-white transition-colors"
                  >
                    Obstacle-Avoiding Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromptInput('blink a red LED with 220 ohm resistor')}
                    className="text-[11px] font-mono bg-panel-2 hover:bg-trace border border-trace px-2 py-0.5 rounded text-white transition-colors"
                  >
                    Blink Red LED
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isAiBusy || !promptInput.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-plum to-red hover:opacity-95 text-white rounded font-mono font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  {isAiBusy ? 'Synthesizing Circuit...' : 'Auto-Wire onto Workbench'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: EXPLAIN CIRCUIT */}
          {activeTab === 'explain' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-trace">
                <span className="text-xs text-muted font-mono">
                  Plain-English explanation of hardware interaction & signal flow
                </span>
                <button
                  onClick={onExplainCircuit}
                  disabled={isAiBusy}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAiBusy ? 'Analyzing...' : 'Generate Overview'}
                </button>
              </div>

              {explanation ? (
                <div className="space-y-3 font-sans">
                  <div className="bg-panel-2 border border-trace rounded p-3 space-y-1.5">
                    <h4 className="text-xs font-mono font-bold text-sky-400">Circuit Architecture</h4>
                    <p className="text-xs text-white/90 leading-relaxed font-sans">{explanation.summary}</p>
                  </div>

                  <div className="bg-panel-2 border border-trace rounded p-3 space-y-1.5">
                    <h4 className="text-xs font-mono font-bold text-purple-400">Signal Pipeline</h4>
                    <ul className="space-y-2 text-xs font-mono">
                      {explanation.signalFlow.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-white/80">
                          <span className="text-red font-bold">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted text-xs font-mono">
                  Click "Generate Overview" to synthesize circuit documentation.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CODE DEBUGGER */}
          {activeTab === 'debug' && (
            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="text-muted font-mono uppercase text-[10px] block mb-1">
                  Describe the Behavioral Bug:
                </label>
                <textarea
                  rows={2}
                  value={debugIssue}
                  onChange={(e) => setDebugIssue(e.target.value)}
                  className="w-full bg-base border border-trace rounded p-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                onClick={handleRunDebugger}
                disabled={isDebugging}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Terminal className="w-3.5 h-3.5" />
                {isDebugging ? 'Analyzing Logic...' : 'Analyze Firmware'}
              </button>

              {debugResult && (
                <div className="space-y-3 pt-2">
                  <div className="bg-panel-2 border border-amber-500/40 rounded p-3 space-y-1.5">
                    <h4 className="text-xs font-bold font-mono text-amber-300">Root Cause Diagnosis</h4>
                    <p className="text-xs text-white/90 leading-relaxed font-sans">{debugResult.analysis}</p>
                  </div>

                  <div className="bg-panel-2 border border-trace rounded p-3 space-y-1.5 font-sans">
                    <h4 className="text-[10px] text-muted font-mono uppercase">Recommendations</h4>
                    <ul className="space-y-1.5 text-xs text-white/90">
                      {debugResult.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">✓</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
