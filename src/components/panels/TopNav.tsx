import React, { useState } from 'react';
import {
  Play,
  Square,
  ShieldCheck,
  FileCode,
  Sparkles,
  HelpCircle,
  Wand2,
  FolderOpen,
} from 'lucide-react';

interface TopNavProps {
  isRunning: boolean;
  onToggleSimulation: () => void;
  onCheckWiring: () => void;
  onExplainCircuit: () => void;
  onOpenCodeExport: () => void;
  onSelectPreset: (presetKey: string) => void;
  onAutoWirePrompt: (prompt: string) => void;
  isAiBusy: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  isRunning,
  onToggleSimulation,
  onCheckWiring,
  onExplainCircuit,
  onOpenCodeExport,
  onSelectPreset,
  onAutoWirePrompt,
  isAiBusy,
}) => {
  const [promptInput, setPromptInput] = useState('');

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAutoWirePrompt(promptInput.trim());
  };

  return (
    <header className="h-16 bg-panel pcb-border-b flex items-center justify-between px-4 z-20 flex-shrink-0 select-none">
      {/* Brand & Hero Logo Section */}
      <div className="flex items-center gap-4">
        {/* CorSIT Logo with hero glowing aperture ring */}
        <div className="relative flex items-center justify-center">
          {/* Subtle pulsing red radial glow positioned behind the "O" aperture ring in COR */}
          <div
            className="aperture-glow"
            style={{
              width: '42px',
              height: '42px',
              left: '18px',
              top: '4px',
            }}
          />
          <img
            src="/corsit-logo-transparent.png"
            alt="CorSIT Logo"
            className="h-9 w-auto relative z-10 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-tight text-sm uppercase">
              CorSIT Sandbox
            </span>
            <span className="text-[10px] bg-maroon/50 text-red px-1.5 py-0.5 rounded font-mono border border-red/40">
              v2.0
            </span>
          </div>
          <span className="text-[10px] text-muted font-mono tracking-wider">
            CIRCUIT & ROBOTICS SIMULATOR
          </span>
        </div>
      </div>

      {/* Center: Natural Language Auto-Wire AI Prompt Box (Core Pitch Feature 3) */}
      <form
        onSubmit={handlePromptSubmit}
        className="flex-1 max-w-md mx-4 hidden md:flex items-center"
      >
        <div className="relative w-full flex items-center">
          <Sparkles className="w-3.5 h-3.5 text-red absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="AI Auto-Wire: 'build me an obstacle-avoiding bot'..."
            className="w-full bg-panel-2 text-white placeholder-muted text-xs pl-8 pr-20 py-2 rounded border border-trace focus:border-red focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={isAiBusy}
            className="absolute right-1 px-2.5 py-1 bg-red hover:bg-red/90 text-white rounded text-[11px] font-mono flex items-center gap-1 transition-all disabled:opacity-50"
          >
            <Wand2 className="w-3 h-3" />
            {isAiBusy ? 'Wiring...' : 'Auto-Wire'}
          </button>
        </div>
      </form>

      {/* Right Controls: Presets, AI Actions, Run Simulation, Code Export */}
      <div className="flex items-center gap-2">
        {/* Preset Selector Dropdown */}
        <div className="flex items-center gap-1.5 mr-2">
          <FolderOpen className="w-3.5 h-3.5 text-muted" />
          <select
            onChange={(e) => onSelectPreset(e.target.value)}
            defaultValue="obstacle_avoider"
            className="bg-panel-2 text-white text-xs font-mono py-1.5 px-2 rounded border border-trace focus:border-red focus:outline-none"
          >
            <option value="obstacle_avoider">⚡ Obstacle-Avoiding Bot (Demo)</option>
            <option value="swapped_challenge">⚠️ Wiring Bug Challenge (TRIG/ECHO)</option>
            <option value="led_blink">💡 LED Blinker Circuit</option>
            <option value="blank">📄 Empty Workbench</option>
          </select>
        </div>

        {/* AI Check Wiring Button */}
        <button
          onClick={onCheckWiring}
          title="Detect wiring errors using AI"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-panel-2 hover:bg-trace text-white text-xs font-mono border border-trace transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-red" />
          <span className="hidden sm:inline">Check Circuit</span>
        </button>

        {/* AI Explain Circuit Button */}
        <button
          onClick={onExplainCircuit}
          title="Explain circuit architecture and signal flow"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-panel-2 hover:bg-trace text-white text-xs font-mono border border-trace transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Explain</span>
        </button>

        {/* Export Code Modal Button */}
        <button
          onClick={onOpenCodeExport}
          title="View & Download Flashable Arduino C++ Code"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-panel-2 hover:bg-trace text-white text-xs font-mono border border-trace transition-colors"
        >
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Export C++</span>
        </button>

        {/* Run / Stop Simulation Button */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
            isRunning
              ? 'bg-red hover:bg-red/90 text-white shadow-glow-red animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP SIM</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN SIM</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
