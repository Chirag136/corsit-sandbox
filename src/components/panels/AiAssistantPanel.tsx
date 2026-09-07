import React, { useState } from 'react';
import { CircuitError } from '../../types/circuit';
import { CircuitExplanation, CodeDebugResult } from '../../types/ai';
import {
  ShieldAlert,
  HelpCircle,
  Code,
  Key,
  X,
  Sparkles,
  ExternalLink,
  Bot,
  Terminal,
} from 'lucide-react';
import { aiService } from '../../services/aiService';

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  errors: CircuitError[];
  explanation: CircuitExplanation | null;
  code: string;
  onFixError?: (error: CircuitError) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  errors,
  explanation,
  code,
}) => {
  const [activeTab, setActiveTab] = useState<'errors' | 'explain' | 'debugger' | 'settings'>('errors');
  const [debugIssue, setDebugIssue] = useState('Bot is not turning when close to obstacle');
  const [debugResult, setDebugResult] = useState<CodeDebugResult | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(aiService.getConfig().apiKey || '');
  const [keySaved, setKeySaved] = useState(false);

  if (!isOpen) return null;

  const handleRunDebugger = async () => {
    setIsDebugging(true);
    try {
      const res = await aiService.debugCode(code, debugIssue);
      setDebugResult(res);
    } finally {
      setIsDebugging(false);
    }
  };

  const handleSaveApiKey = () => {
    aiService.setConfig({
      apiKey: apiKeyInput.trim(),
      provider: apiKeyInput.trim() ? 'claude' : 'mock',
    });
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-panel pcb-border-l shadow-2xl z-30 flex flex-col font-sans select-none animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3 bg-panel-2 border-b border-trace flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-maroon flex items-center justify-center border border-red/40">
            <Bot className="w-3.5 h-3.5 text-red" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono">CorSIT AI Assistant</h3>
            <p className="text-[10px] text-muted">Claude Sonnet & Robotics Engine</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-trace text-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-base border-b border-trace text-xs font-mono">
        <button
          onClick={() => setActiveTab('errors')}
          className={`flex-1 py-2 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'errors'
              ? 'border-red text-red bg-panel/60'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Errors ({errors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('explain')}
          className={`flex-1 py-2 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'explain'
              ? 'border-sky-400 text-sky-400 bg-panel/60'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Explain</span>
        </button>

        <button
          onClick={() => setActiveTab('debugger')}
          className={`flex-1 py-2 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === 'debugger'
              ? 'border-amber-400 text-amber-400 bg-panel/60'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Debug</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-2 px-3 flex items-center justify-center border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-purple-400 text-purple-400 bg-panel/60'
              : 'border-transparent text-muted hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: ERRORS */}
        {activeTab === 'errors' && (
          <div className="space-y-3">
            {errors.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center mx-auto">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-xs font-semibold text-white">Circuit Verified</h4>
                <p className="text-[11px] text-muted max-w-[220px] mx-auto">
                  No electrical wiring faults or short circuits detected. Ready for simulation!
                </p>
              </div>
            ) : (
              errors.map((err, idx) => (
                <div
                  key={idx}
                  className="bg-panel-2 border border-red/50 rounded p-3 space-y-2 shadow-glow-red"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-red flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      {err.issue}
                    </span>
                    <span className="text-[9px] font-mono bg-red/20 text-red px-1.5 py-0.5 rounded border border-red/40 uppercase">
                      Component: {err.componentId}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/90 leading-relaxed font-sans">
                    {err.explanation}
                  </p>
                  <div className="pt-2 border-t border-trace/60">
                    <span className="text-[10px] font-mono text-muted block mb-1">
                      SUGGESTED REMEDY:
                    </span>
                    <p className="text-[11px] font-mono text-emerald-300 bg-base/80 p-2 rounded border border-trace">
                      {err.suggestedFix}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: EXPLAIN */}
        {activeTab === 'explain' && (
          <div className="space-y-4">
            {explanation ? (
              <>
                <div className="bg-panel-2 border border-trace rounded p-3 space-y-2">
                  <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Circuit Overview
                  </h4>
                  <p className="text-[11px] text-white/90 leading-relaxed font-sans">
                    {explanation.summary}
                  </p>
                </div>

                <div className="bg-panel-2 border border-trace rounded p-3 space-y-2 font-mono text-[11px]">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">
                    Architecture Pipeline:
                  </span>
                  <p className="text-purple-300 font-semibold">{explanation.architecture}</p>
                </div>

                <div className="bg-panel-2 border border-trace rounded p-3 space-y-2 font-mono text-[11px]">
                  <span className="text-muted text-[10px] uppercase tracking-wider block">
                    Signal Flow Execution:
                  </span>
                  <ul className="space-y-2">
                    {explanation.signalFlow.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/80">
                        <span className="text-red font-bold text-[10px] mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted text-xs">
                Click "Explain" in the top bar to inspect circuit architecture.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CODE DEBUGGER */}
        {activeTab === 'debugger' && (
          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-[10px] text-muted uppercase tracking-wider block mb-1">
                Describe Simulation Anomaly:
              </label>
              <textarea
                rows={2}
                value={debugIssue}
                onChange={(e) => setDebugIssue(e.target.value)}
                className="w-full bg-base border border-trace rounded p-2 text-white text-xs focus:border-amber-400 focus:outline-none"
              />
            </div>

            <button
              onClick={handleRunDebugger}
              disabled={isDebugging}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5" />
              {isDebugging ? 'Analyzing Logic...' : 'Analyze Behavior'}
            </button>

            {debugResult && (
              <div className="space-y-3 pt-2">
                <div className="bg-panel-2 border border-amber-500/40 rounded p-3 space-y-2">
                  <h4 className="text-[11px] font-bold text-amber-300">Root Cause Analysis</h4>
                  <p className="text-[11px] text-white/90 font-sans leading-relaxed">
                    {debugResult.analysis}
                  </p>
                </div>

                <div className="bg-panel-2 border border-trace rounded p-3 space-y-2">
                  <h4 className="text-[10px] text-muted uppercase">Recommended Actions</h4>
                  <ul className="space-y-1.5 text-[11px] text-white/90 font-sans">
                    {debugResult.suggestions.map((sug, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-400 font-bold">✓</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: API SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-3 font-mono text-xs">
            <h4 className="text-xs font-bold text-white uppercase">AI Engine Settings</h4>
            <p className="text-[11px] text-muted font-sans leading-relaxed">
              CorSIT Sandbox contains a built-in offline robotics heuristic engine. You can also provide an Anthropic Claude API key to unlock live LLM reasoning.
            </p>

            <div>
              <label className="text-[10px] text-muted uppercase block mb-1">
                Anthropic API Key (Optional):
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-api..."
                className="w-full bg-base border border-trace rounded p-2 text-white text-xs focus:border-red focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveApiKey}
              className="w-full py-1.5 bg-panel-2 hover:bg-trace border border-trace text-white rounded font-mono text-xs transition-colors"
            >
              {keySaved ? 'Saved!' : 'Update Configuration'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
