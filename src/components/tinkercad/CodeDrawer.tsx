import React, { useState, useRef } from 'react';
import { BlocklyWorkspace } from '../blockly/BlocklyWorkspace';
import {
  X,
  Copy,
  Download,
  Check,
  Code2,
  FileCode,
  Sparkles,
  RotateCcw,
  Zap,
  Play,
  Square,
} from 'lucide-react';

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  arduinoCode: string;
  onCodeChange: (code: string) => void;
  isRunning?: boolean;
  onToggleSimulation?: () => void;
}

export const CodeDrawer: React.FC<CodeDrawerProps> = ({
  isOpen,
  onClose,
  arduinoCode,
  onCodeChange,
  isRunning = false,
  onToggleSimulation,
}) => {
  const [codeMode, setCodeMode] = useState<'blocks' | 'split' | 'text'>('text');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([arduinoCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'corsit_firmware.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Tab key inside code editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Insert 2 spaces
      const newValue =
        arduinoCode.substring(0, start) + '  ' + arduinoCode.substring(end);
      onCodeChange(newValue);

      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Quick Templates
  const handleLoadTemplate = (templateType: 'blink' | 'always_on') => {
    if (templateType === 'always_on') {
      onCodeChange(`// CorSIT Sandbox — Turn Light Permanently ON
void setup() {
  pinMode(13, OUTPUT); // Pin 13 / External LED
}

void loop() {
  digitalWrite(13, HIGH); // Turn the light ON
}
`);
    } else {
      onCodeChange(`// CorSIT Sandbox — LED Blinker (1 sec period)
void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH); // Light ON
  delay(1000);            // Wait 1000ms
  digitalWrite(13, LOW);  // Light OFF
  delay(1000);            // Wait 1000ms
}
`);
    }
  };

  const lineCount = Math.max(1, (arduinoCode || '').split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[620px] lg:w-[740px] bg-panel border-l border-trace z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-white font-sans select-none">
      {/* TinkerCAD Code Header Bar */}
      <div className="h-12 bg-panel-2 border-b border-trace px-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-red" />
          <span className="text-xs font-bold font-mono uppercase tracking-wider">
            Code Editor
          </span>

          {/* Mode Segmented Controls: Blocks / Blocks + Text / Text */}
          <div className="ml-3 flex items-center bg-base rounded p-0.5 border border-trace text-xs font-mono">
            <button
              onClick={() => setCodeMode('blocks')}
              className={`px-2.5 py-1 rounded transition-colors ${
                codeMode === 'blocks'
                  ? 'bg-plum text-white font-semibold'
                  : 'text-muted hover:text-white'
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setCodeMode('split')}
              className={`px-2.5 py-1 rounded transition-colors ${
                codeMode === 'split'
                  ? 'bg-plum text-white font-semibold'
                  : 'text-muted hover:text-white'
              }`}
            >
              Blocks + Text
            </button>
            <button
              onClick={() => setCodeMode('text')}
              className={`px-2.5 py-1 rounded transition-colors ${
                codeMode === 'text'
                  ? 'bg-plum text-white font-semibold'
                  : 'text-muted hover:text-white'
              }`}
            >
              Text (C++)
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Direct Run / Stop Simulation Button */}
          {onToggleSimulation && (
            <button
              onClick={onToggleSimulation}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold transition-all shadow-sm ${
                isRunning
                  ? 'bg-red hover:bg-red/90 text-white shadow-glow-red animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy Arduino C++ Code"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-panel hover:bg-trace text-xs font-mono text-white border border-trace transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            title="Download .ino sketch file"
            className="flex items-center gap-1 px-3 py-1 rounded bg-red hover:bg-red/90 text-white text-xs font-mono font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ino</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-trace text-muted hover:text-white transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. BLOCKS ONLY MODE */}
        {codeMode === 'blocks' && (
          <div className="w-full h-full">
            <BlocklyWorkspace onCodeChange={onCodeChange} />
          </div>
        )}

        {/* 2. TEXT (C++) EDITABLE MODE */}
        {codeMode === 'text' && (
          <div className="w-full h-full bg-[#0E090D] flex flex-col overflow-hidden">
            {/* Sub-toolbar */}
            <div className="px-3 py-1.5 bg-panel-2/70 border-b border-trace flex items-center justify-between text-[11px] font-mono flex-shrink-0">
              <div className="flex items-center gap-2 text-muted">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Type & Edit C++ Live
                </span>
                <span>•</span>
                <span>Arduino / ESP32</span>
              </div>

              {/* Quick Snippet Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted text-[10px]">Snippets:</span>
                <button
                  onClick={() => handleLoadTemplate('always_on')}
                  className="px-2 py-0.5 rounded bg-base hover:bg-trace border border-trace text-[10px] text-white transition-colors"
                >
                  Light ON
                </button>
                <button
                  onClick={() => handleLoadTemplate('blink')}
                  className="px-2 py-0.5 rounded bg-base hover:bg-trace border border-trace text-[10px] text-white transition-colors"
                >
                  Blink 1s
                </button>
              </div>
            </div>

            {/* Line Numbers + Real Code TextArea */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Line Numbers Gutter */}
              <div className="w-10 bg-[#090608] border-r border-trace/60 py-3 pr-2 select-none text-right font-mono text-xs text-muted/40 overflow-hidden">
                {lineNumbers.map((n) => (
                  <div key={n} className="leading-6">
                    {n}
                  </div>
                ))}
              </div>

              {/* Editable Textarea */}
              <textarea
                ref={textareaRef}
                value={arduinoCode}
                onChange={(e) => onCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="// Type your Arduino C++ code here..."
                className="flex-1 h-full bg-transparent p-3 font-mono text-xs text-white/95 leading-6 resize-none focus:outline-none select-text overflow-auto whitespace-pre"
                style={{ tabSize: 2 }}
              />
            </div>
          </div>
        )}

        {/* 3. SPLIT VIEW MODE (Blocks on Left, Editable C++ on Right) */}
        {codeMode === 'split' && (
          <div className="w-full h-full flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/2 h-1/2 sm:h-full border-b sm:border-b-0 sm:border-r border-trace">
              <BlocklyWorkspace onCodeChange={onCodeChange} />
            </div>
            <div className="w-full sm:w-1/2 h-1/2 sm:h-full bg-[#0E090D] flex flex-col overflow-hidden">
              <div className="px-3 py-1.5 bg-panel-2/70 border-b border-trace flex items-center justify-between text-[11px] font-mono flex-shrink-0">
                <span className="flex items-center gap-1.5 text-white">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  Editable C++ Firmware
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                  EDITABLE
                </span>
              </div>
              <div className="flex-1 flex overflow-hidden relative">
                {/* Line Numbers */}
                <div className="w-8 bg-[#090608] border-r border-trace/60 py-2.5 pr-1.5 select-none text-right font-mono text-[10px] text-muted/40 overflow-hidden">
                  {lineNumbers.map((n) => (
                    <div key={n} className="leading-5">
                      {n}
                    </div>
                  ))}
                </div>

                {/* Editable Textarea in Split View */}
                <textarea
                  value={arduinoCode}
                  onChange={(e) => onCodeChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  className="flex-1 h-full bg-transparent p-2.5 font-mono text-[11px] text-white/95 leading-5 resize-none focus:outline-none select-text overflow-auto whitespace-pre"
                  style={{ tabSize: 2 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
