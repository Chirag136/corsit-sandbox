import React, { useState } from 'react';
import { X, Copy, Download, Check, Sparkles, FileCode } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  onExplainCode: () => void;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  code,
  onExplainCode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'corsit_bot_sketch.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-panel border border-trace rounded-lg w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 py-3 bg-panel-2 border-b border-trace flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs font-mono font-bold text-white">
                Flashable Arduino / ESP32 C++ Code Export
              </h3>
              <p className="text-[10px] text-muted font-mono">
                Production-grade firmware ready for Arduino IDE or PlatformIO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-trace text-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 bg-base border-b border-trace flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3 text-muted text-[11px]">
            <span>Target: <strong className="text-white">ESP32 Dev Module</strong></span>
            <span>•</span>
            <span>Framework: <strong className="text-white">Arduino.h</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExplainCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-panel-2 hover:bg-trace text-sky-400 border border-trace transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explain with AI</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-panel-2 hover:bg-trace text-white border border-trace transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-red hover:bg-red/90 text-white font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ino</span>
            </button>
          </div>
        </div>

        {/* Code Content Viewport */}
        <div className="flex-1 overflow-auto bg-[#0E090D] p-4 font-mono text-xs text-white/90 leading-relaxed select-text">
          <pre className="whitespace-pre">
            {code}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-panel-2 border-t border-trace flex items-center justify-between text-[11px] font-mono text-muted">
          <span>CorSIT Robotics Club • Siddaganga Institute of Technology</span>
          <span>Verified Flashable C++ Target</span>
        </div>
      </div>
    </div>
  );
};
