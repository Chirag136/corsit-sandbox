import React from 'react';
import { RobotArena } from '../arena/RobotArena';
import { RobotState, Obstacle } from '../../types/simulation';
import { X, Bot, Maximize2, Minimize2 } from 'lucide-react';

interface ArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  robot: RobotState;
  obstacles: Obstacle[];
  isRunning: boolean;
  onResetRobot: (x?: number, y?: number, heading?: number) => void;
  onUpdateObstacles: (obstacles: Obstacle[]) => void;
  onUpdateRobotPos?: (x: number, y: number) => void;
}

export const ArenaModal: React.FC<ArenaModalProps> = ({
  isOpen,
  onClose,
  robot,
  obstacles,
  isRunning,
  onResetRobot,
  onUpdateObstacles,
  onUpdateRobotPos,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
      <div
        className={`bg-panel border border-trace rounded-lg flex flex-col overflow-hidden shadow-2xl transition-all ${
          isExpanded ? 'w-[780px] h-[540px]' : 'w-[580px] h-[440px]'
        }`}
      >
        {/* Header */}
        <div className="h-10 bg-panel-2 border-b border-trace px-3 flex items-center justify-between flex-shrink-0 select-none">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-red" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              Virtual Robot Test Track
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                isRunning
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800 animate-pulse'
                  : 'bg-base text-muted border-trace'
              }`}
            >
              {isRunning ? 'BOT ACTIVE' : 'SIM STOPPED'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-trace text-muted hover:text-white transition-colors"
              title={isExpanded ? 'Shrink' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-trace text-muted hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Arena Canvas */}
        <div className="flex-1 w-full h-full overflow-hidden">
          <RobotArena
            robot={robot}
            obstacles={obstacles}
            isRunning={isRunning}
            onResetRobot={onResetRobot}
            onUpdateObstacles={onUpdateObstacles}
            onUpdateRobotPos={onUpdateRobotPos}
          />
        </div>
      </div>
    </div>
  );
};
