import React from 'react';
import { ComponentType } from '../../types/circuit';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import { Cpu, Radio, Zap, Disc, Sun, Minus, Plus } from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddComponent }) => {
  const getIcon = (type: ComponentType) => {
    switch (type) {
      case 'ESP32':
        return <Cpu className="w-4 h-4 text-red" />;
      case 'UltrasonicSensor':
        return <Radio className="w-4 h-4 text-sky-400" />;
      case 'MotorDriver':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'DCMotor':
        return <Disc className="w-4 h-4 text-amber-400" />;
      case 'LED':
        return <Sun className="w-4 h-4 text-rose-500" />;
      case 'Resistor':
        return <Minus className="w-4 h-4 text-emerald-400" />;
    }
  };

  const categories = [
    { name: 'Microcontrollers', types: ['ESP32'] as ComponentType[] },
    { name: 'Sensors', types: ['UltrasonicSensor'] as ComponentType[] },
    { name: 'Motors & Drivers', types: ['MotorDriver', 'DCMotor'] as ComponentType[] },
    { name: 'Passives & Opto', types: ['LED', 'Resistor'] as ComponentType[] },
  ];

  return (
    <aside className="w-64 bg-panel pcb-border-r flex flex-col h-full select-none flex-shrink-0">
      {/* Sidebar Header */}
      <div className="px-4 py-3 bg-panel-2 border-b border-trace flex items-center justify-between">
        <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
          Components Tray
        </span>
        <span className="text-[10px] text-muted font-mono">6 AVAILABLE</span>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <h4 className="text-[10px] font-mono text-muted uppercase tracking-wider px-1">
              {cat.name}
            </h4>
            <div className="space-y-1.5">
              {cat.types.map((type) => {
                const item = COMPONENT_CATALOG[type];
                return (
                  <div
                    key={type}
                    onClick={() => onAddComponent(type)}
                    className="group bg-panel-2 hover:bg-trace border border-trace hover:border-plum-light rounded p-2.5 cursor-pointer transition-all flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded bg-base border border-trace group-hover:border-red/40 transition-colors flex-shrink-0 mt-0.5">
                      {getIcon(type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white group-hover:text-red transition-colors truncate">
                          {item.name}
                        </span>
                        <Plus className="w-3.5 h-3.5 text-muted group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-muted line-clamp-1 mt-0.5 font-sans">
                        {item.description}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[9px] font-mono text-muted/80">
                        <span>{item.defaultPins.length} Pins</span>
                        <span>•</span>
                        <span>{item.width}x{item.height}px</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 bg-panel-2 border-t border-trace text-[10px] text-muted font-mono leading-relaxed">
        <p className="text-white/90 font-semibold mb-0.5">⚡ Workbench Tip</p>
        Click any part to add to workbench. Click terminals to route traces.
      </div>
    </aside>
  );
};
