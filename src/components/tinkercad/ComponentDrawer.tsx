import React, { useState } from 'react';
import { ComponentType } from '../../types/circuit';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import {
  Search,
  Cpu,
  Radio,
  Zap,
  Disc,
  Sun,
  Minus,
  Grid,
  ToggleLeft,
  Sliders,
  Sparkles,
  Plus,
} from 'lucide-react';

interface ComponentDrawerProps {
  isOpen: boolean;
  onAddComponent: (type: ComponentType) => void;
  onSelectStarter: (starterKey: string) => void;
}

export const ComponentDrawer: React.FC<ComponentDrawerProps> = ({
  isOpen,
  onAddComponent,
  onSelectStarter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Basic' | 'Robotics' | 'Starters'>('Basic');

  if (!isOpen) return null;

  const getComponentIcon = (type: ComponentType) => {
    switch (type) {
      case 'Breadboard':
        return <Grid className="w-5 h-5 text-amber-400" />;
      case 'ArduinoUno':
        return <Cpu className="w-5 h-5 text-teal-400" />;
      case 'ESP32':
        return <Cpu className="w-5 h-5 text-red" />;
      case 'UltrasonicSensor':
        return <Radio className="w-5 h-5 text-sky-400" />;
      case 'MotorDriver':
        return <Zap className="w-5 h-5 text-purple-400" />;
      case 'DCMotor':
        return <Disc className="w-5 h-5 text-amber-500" />;
      case 'LED':
        return <Sun className="w-5 h-5 text-rose-500" />;
      case 'Resistor':
        return <Minus className="w-5 h-5 text-emerald-400" />;
      case 'Pushbutton':
        return <ToggleLeft className="w-5 h-5 text-blue-400" />;
      case 'Potentiometer':
        return <Sliders className="w-5 h-5 text-indigo-400" />;
    }
  };

  const allTypes: ComponentType[] = [
    'ArduinoUno',
    'Breadboard',
    'ESP32',
    'Resistor',
    'LED',
    'Pushbutton',
    'Potentiometer',
    'UltrasonicSensor',
    'MotorDriver',
    'DCMotor',
  ];

  const filteredTypes = allTypes.filter((type) => {
    const item = COMPONENT_CATALOG[type];
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === 'Robotics') {
      return ['ESP32', 'UltrasonicSensor', 'MotorDriver', 'DCMotor'].includes(type);
    }
    return true;
  });

  return (
    <aside className="w-72 bg-panel border-l border-trace flex flex-col h-full select-none z-20 flex-shrink-0 text-white font-sans animate-in slide-in-from-right-10 duration-150">
      {/* Search & Category Filter (Signature TinkerCAD styling) */}
      <div className="p-3 bg-panel-2 border-b border-trace space-y-2">
        {/* Category Dropdown */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-muted text-[11px]">Components</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-base border border-trace text-white text-xs px-2 py-1 rounded focus:border-red focus:outline-none cursor-pointer"
          >
            <option value="Basic">Basic</option>
            <option value="Robotics">Robotics & Motors</option>
            <option value="Starters">Starters / Presets</option>
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search components..."
            className="w-full bg-base border border-trace text-white text-xs pl-8 pr-2 py-1.5 rounded focus:border-red focus:outline-none placeholder-muted font-sans"
          />
        </div>
      </div>

      {/* Component Cards or Starters */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {categoryFilter === 'Starters' ? (
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-muted uppercase tracking-wider px-1">
              CorSIT Challenge Starters
            </div>

            <div
              onClick={() => onSelectStarter('arduino_led')}
              className="bg-panel-2 hover:bg-trace border border-trace hover:border-teal-500/40 rounded p-2.5 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-rose-500" />
                  Arduino Uno: Turn on Light
                </span>
                <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
                  ARDUINO
                </span>
              </div>
              <p className="text-[11px] text-muted font-sans">
                Arduino Uno Pin 13 driving an LED through a 220Ω resistor with built-in L LED.
              </p>
            </div>

            <div
              onClick={() => onSelectStarter('obstacle_avoider')}
              className="bg-panel-2 hover:bg-trace border border-trace hover:border-red/40 rounded p-2.5 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red" />
                  Obstacle-Avoiding Bot
                </span>
                <span className="text-[9px] font-mono bg-red/20 text-red px-1.5 py-0.5 rounded">
                  DEMO
                </span>
              </div>
              <p className="text-[11px] text-muted font-sans">
                Full setup: ESP32 + HC-SR04 + L298N + 2 DC Motors ready to simulate.
              </p>
            </div>

            <div
              onClick={() => onSelectStarter('swapped_challenge')}
              className="bg-panel-2 hover:bg-trace border border-trace hover:border-amber-500/40 rounded p-2.5 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Swapped TRIG/ECHO Bug
                </span>
                <span className="text-[9px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                  AI DEBUG
                </span>
              </div>
              <p className="text-[11px] text-muted font-sans">
                Test AI wiring diagnostics on swapped pins and an unballasted LED.
              </p>
            </div>

            <div
              onClick={() => onSelectStarter('led_blink')}
              className="bg-panel-2 hover:bg-trace border border-trace hover:border-emerald-500/40 rounded p-2.5 cursor-pointer transition-all space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  💡 Blink LED Starter
                </span>
                <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                  BASIC
                </span>
              </div>
              <p className="text-[11px] text-muted font-sans">
                Simple ESP32 + 220Ω resistor + LED blinker circuit.
              </p>
            </div>

            <div
              onClick={() => onSelectStarter('blank')}
              className="bg-panel-2 hover:bg-trace border border-trace rounded p-2.5 cursor-pointer transition-all space-y-1 text-muted hover:text-white"
            >
              <span className="text-xs font-semibold">📄 Blank Canvas</span>
              <p className="text-[11px] text-muted font-sans">
                Clear workbench to wire everything from scratch.
              </p>
            </div>
          </div>
        ) : (
          filteredTypes.map((type) => {
            const item = COMPONENT_CATALOG[type];
            return (
              <div
                key={type}
                onClick={() => onAddComponent(type)}
                className="group bg-panel-2 hover:bg-trace border border-trace hover:border-plum-light rounded p-2.5 cursor-pointer transition-all flex items-start gap-2.5"
              >
                <div className="w-10 h-10 rounded bg-base border border-trace group-hover:border-red/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getComponentIcon(type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white group-hover:text-red transition-colors truncate">
                      {item.name}
                    </span>
                    <Plus className="w-3.5 h-3.5 text-muted group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-muted line-clamp-2 mt-0.5 font-sans leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Helper */}
      <div className="p-2.5 bg-panel-2 border-t border-trace text-[10px] text-muted font-mono text-center">
        Click to place onto canvas • Press R to rotate
      </div>
    </aside>
  );
};
