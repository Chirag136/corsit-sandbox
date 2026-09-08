import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Trash2,
  Undo2,
  Redo2,
  Code2,
  Play,
  Square,
  Sparkles,
  Download,
  PanelRightClose,
  PanelRightOpen,
  Edit2,
  Check,
} from 'lucide-react';

export interface WireColorOption {
  name: string;
  hex: string;
}

export const TINKER_WIRE_COLORS: WireColorOption[] = [
  { name: 'Green', hex: '#22C55E' },
  { name: 'Black', hex: '#1E293B' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'White', hex: '#F8FAFC' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Cyan', hex: '#06B6D4' },
];

interface TinkerNavProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  isRunning: boolean;
  onToggleSimulation: () => void;
  onRotateSelected: () => void;
  onDeleteSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedWireColor: string;
  onSelectWireColor: (color: string) => void;
  isCodeOpen: boolean;
  onToggleCode: () => void;
  isComponentDrawerOpen: boolean;
  onToggleComponentDrawer: () => void;
  onOpenAiModal: () => void;
  onExportCode: () => void;
  onSaveAndExit?: () => void;
  hasErrors: boolean;
  errorCount: number;
}

export const TinkerNav: React.FC<TinkerNavProps> = ({
  projectName,
  onUpdateProjectName,
  isRunning,
  onToggleSimulation,
  onRotateSelected,
  onDeleteSelected,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  selectedWireColor,
  onSelectWireColor,
  isCodeOpen,
  onToggleCode,
  isComponentDrawerOpen,
  onToggleComponentDrawer,
  onOpenAiModal,
  onExportCode,
  onSaveAndExit,
  hasErrors,
  errorCount,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);
  const [simSeconds, setSimSeconds] = useState(0);

  // Live simulation timer like TinkerCAD
  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      setSimSeconds(0);
      interval = setInterval(() => {
        setSimSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSimSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateProjectName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 bg-panel border-b border-trace flex items-center justify-between px-3 z-30 select-none flex-shrink-0 text-white font-sans">
      {/* LEFT: CorSIT Branding & Editable Project Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* CorSIT Logo with Hero Aperture Glow */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <div
            className="aperture-glow"
            style={{
              width: '36px',
              height: '36px',
              left: '16px',
              top: '4px',
            }}
          />
          <img
            src={`${import.meta.env.BASE_URL}corsit-logo-transparent.png`}
            alt="CorSIT Logo"
            className="h-8 w-auto relative z-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-trace hidden sm:block" />

        {/* Editable Title */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              autoFocus
              className="bg-panel-2 border border-red text-white text-xs px-2 py-1 rounded font-mono focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="p-1 text-emerald-400 hover:text-white"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingTitle(true)}
            className="group flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded hover:bg-panel-2 transition-colors max-w-[220px]"
          >
            <span className="text-xs font-semibold text-white truncate font-sans">
              {projectName}
            </span>
            <Edit2 className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        )}
      </div>

      {/* CENTER: TinkerCAD Standard Tools (Rotate, Delete, Undo, Redo, Wire Color) */}
      <div className="flex items-center gap-1 bg-panel-2/80 border border-trace rounded px-1.5 py-1">
        {/* Rotate Button (R) */}
        <button
          onClick={onRotateSelected}
          title="Rotate (R)"
          className="p-1.5 rounded hover:bg-trace text-muted hover:text-white transition-colors"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Delete Button (Trash / Backspace) */}
        <button
          onClick={onDeleteSelected}
          title="Delete (Del / Backspace)"
          className="p-1.5 rounded hover:bg-red/20 text-muted hover:text-red transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-trace mx-0.5" />

        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:bg-trace text-muted hover:text-white transition-colors disabled:opacity-40"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:bg-trace text-muted hover:text-white transition-colors disabled:opacity-40"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-trace mx-0.5" />

        {/* TinkerCAD Wire Color Swatch Dropdown */}
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-base rounded border border-trace">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm flex-shrink-0"
            style={{ backgroundColor: selectedWireColor }}
          />
          <select
            value={selectedWireColor}
            onChange={(e) => onSelectWireColor(e.target.value)}
            className="bg-transparent text-[11px] font-mono text-white focus:outline-none cursor-pointer pr-1"
          >
            {TINKER_WIRE_COLORS.map((c) => (
              <option key={c.hex} value={c.hex} className="bg-panel-2 text-white">
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RIGHT: Code Toggle, Simulation Toggle, CorSIT AI, Export, Drawer Toggle */}
      <div className="flex items-center gap-2">
        {/* < > Code Toggle Button (Signature TinkerCAD feature) */}
        <button
          onClick={onToggleCode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors border ${
            isCodeOpen
              ? 'bg-plum text-white border-plum-light shadow-glow-plum'
              : 'bg-panel-2 hover:bg-trace text-white border-trace'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code</span>
        </button>

        {/* Start / Stop Simulation (Signature TinkerCAD Big Green/Red Button) */}
        <button
          onClick={onToggleSimulation}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono font-semibold transition-all shadow-md ${
            isRunning
              ? 'bg-red hover:bg-red/90 text-white shadow-glow-red animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Sim</span>
              <span className="bg-black/40 px-1 py-0.5 rounded text-[10px]">
                {formatTimer(simSeconds)}
              </span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Simulation</span>
            </>
          )}
        </button>

        {/* CorSIT AI Assistant Button */}
        <button
          onClick={onOpenAiModal}
          title="CorSIT AI Assistant (Wiring Check, Auto-Wire, Explainer)"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono border transition-colors ${
            hasErrors
              ? 'bg-red/20 border-red text-red shadow-glow-red'
              : 'bg-panel-2 hover:bg-trace border-trace text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-red" />
          <span className="hidden md:inline">CorSIT AI</span>
          {hasErrors && (
            <span className="w-4 h-4 rounded-full bg-red text-white text-[9px] font-bold flex items-center justify-center">
              {errorCount}
            </span>
          )}
        </button>

        {/* Save & Exit Button */}
        {onSaveAndExit && (
          <button
            onClick={onSaveAndExit}
            title="Save Project and Exit to Dashboard"
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow"
          >
            <span className="hidden lg:inline">Save & Exit</span>
          </button>
        )}

        {/* Export C++ Button */}
        <button
          onClick={onExportCode}
          title="Export flashable Arduino/ESP32 C++ Code"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white text-xs font-mono border border-trace transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Export</span>
        </button>

        {/* Component Drawer Toggle Button */}
        <button
          onClick={onToggleComponentDrawer}
          title={isComponentDrawerOpen ? 'Collapse Components' : 'Open Components'}
          className="p-1.5 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white border border-trace transition-colors"
        >
          {isComponentDrawerOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
