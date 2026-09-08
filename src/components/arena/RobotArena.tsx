import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Obstacle, RobotState } from '../../types/simulation';
import { TRACK_PRESETS } from '../../data/trackPresets';
import {
  RotateCcw,
  Plus,
  Compass,
  Activity,
  Eye,
  Trash2,
  Move,
  Maximize,
  Layers,
  Square,
  Minus
} from 'lucide-react';

interface RobotArenaProps {
  robot: RobotState;
  obstacles: Obstacle[];
  isRunning: boolean;
  onResetRobot: (x?: number, y?: number, heading?: number) => void;
  onUpdateObstacles: (obstacles: Obstacle[]) => void;
  onUpdateRobotPos?: (x: number, y: number) => void;
}

type DragMode = 'none' | 'move_obstacle' | 'resize_obstacle' | 'move_robot';

export const RobotArena: React.FC<RobotArenaProps> = ({
  robot,
  obstacles,
  isRunning,
  onResetRobot,
  onUpdateObstacles,
  onUpdateRobotPos,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Selection & interaction state
  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activePreset, setActivePreset] = useState<string>('corsit_standard');
  const [hoveredTarget, setHoveredTarget] = useState<'none' | 'obstacle' | 'resize_handle' | 'robot'>('none');

  // Obstacle state for dragging/resizing
  const dragObstacleRef = useRef<Obstacle | null>(null);
  const resizeHandleSize = 9;

  // Convert client coordinates to canvas internal coordinates
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Check if click hits resize handle (bottom-right corner)
  const isOverResizeHandle = (x: number, y: number, obs: Obstacle) => {
    const handleX = obs.x + obs.width;
    const handleY = obs.y + obs.height;
    return (
      x >= handleX - resizeHandleSize &&
      x <= handleX + resizeHandleSize &&
      y >= handleY - resizeHandleSize &&
      y <= handleY + resizeHandleSize
    );
  };

  // Check if click hits obstacle
  const getObstacleAt = (x: number, y: number): Obstacle | null => {
    // Check in reverse order (top to bottom)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      if (
        x >= obs.x &&
        x <= obs.x + obs.width &&
        y >= obs.y &&
        y <= obs.y + obs.height
      ) {
        return obs;
      }
    }
    return null;
  };

  // Check if click hits robot
  const isOverRobot = (x: number, y: number): boolean => {
    return Math.hypot(x - robot.x, y - robot.y) <= Math.max(robot.width, robot.length) / 2 + 6;
  };

  // Render Arena onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Clear Arena Background with dark grid
    ctx.fillStyle = '#120C11';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines with snap guide
    ctx.strokeStyle = 'rgba(58, 42, 46, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer Track Border Accent
    ctx.strokeStyle = '#3A2A2E';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // 2. Draw Obstacles
    for (const obs of obstacles) {
      const isSelected = obs.id === selectedObstacleId;

      // Drop shadow for 3D feel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(obs.x + 3, obs.y + 3, obs.width, obs.height, 4);
      ctx.fill();

      // Main Obstacle Body
      ctx.fillStyle = isSelected ? '#2A1820' : '#1D1418';
      ctx.strokeStyle = isSelected ? '#EF4444' : '#7A1B2B';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
      ctx.fill();
      ctx.stroke();

      // Hazard diagonal stripe pattern
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 4);
      ctx.clip();
      ctx.strokeStyle = isSelected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(122, 27, 43, 0.25)';
      ctx.lineWidth = 3;
      for (let i = -obs.height; i < obs.width + obs.height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(obs.x + i, obs.y);
        ctx.lineTo(obs.x + i + obs.height, obs.y + obs.height);
        ctx.stroke();
      }
      ctx.restore();

      // Label & Dimensions
      if (obs.width >= 35 && obs.height >= 25) {
        ctx.fillStyle = isSelected ? '#FFFFFF' : '#9C8B90';
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayTxt = obs.label || `${Math.round(obs.width)}x${Math.round(obs.height)}`;
        ctx.fillText(displayTxt, obs.x + obs.width / 2, obs.y + obs.height / 2);
      }

      // Selection Corner Resize Handle
      if (isSelected) {
        // Outline bounding glow
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(obs.x - 3, obs.y - 3, obs.width + 6, obs.height + 6);
        ctx.setLineDash([]);

        // Bottom-Right Corner Resize Grip Handle
        const rx = obs.x + obs.width;
        const ry = obs.y + obs.height;
        ctx.fillStyle = '#EF4444';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(rx - 5, ry - 5, 10, 10, 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 3. Draw Robot Path History Trail
    if (robot.pathHistory.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(193, 59, 59, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(robot.pathHistory[0].x, robot.pathHistory[0].y);
      for (let i = 1; i < robot.pathHistory.length; i++) {
        ctx.lineTo(robot.pathHistory[i].x, robot.pathHistory[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Ultrasonic Sensor Raycast Cone and Hit Line
    const frontSensorOffset = robot.length / 2;
    const sensorOriginX = robot.x + Math.cos(robot.heading) * frontSensorOffset;
    const sensorOriginY = robot.y + Math.sin(robot.heading) * frontSensorOffset;

    // Visual Ray Beam
    const isClose = robot.detectedDistanceCm < 28;
    const beamColor = isClose ? '#C13B3B' : '#38BDF8';

    ctx.save();
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = isClose ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(sensorOriginX, sensorOriginY);
    ctx.lineTo(robot.sensorRayEnd.x, robot.sensorRayEnd.y);
    ctx.stroke();

    // Hit pulse circle
    ctx.fillStyle = beamColor;
    ctx.beginPath();
    ctx.arc(robot.sensorRayEnd.x, robot.sensorRayEnd.y, isClose ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Distance Label along Ray
    const midX = (sensorOriginX + robot.sensorRayEnd.x) / 2;
    const midY = (sensorOriginY + robot.sensorRayEnd.y) / 2;
    ctx.fillStyle = isClose ? '#F87171' : '#E0F2FE';
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    ctx.fillText(`${robot.detectedDistanceCm} cm`, midX + 8, midY - 6);
    ctx.restore();

    // 5. Draw Robot Chassis
    ctx.save();
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.heading);

    const halfW = robot.width / 2;
    const halfL = robot.length / 2;

    // Draggable indicator ring around robot if stopped
    if (!isRunning) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(halfW, halfL) + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Robot Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(-halfL + 2, -halfW + 2, robot.length, robot.width, 8);
    ctx.fill();

    // Main Acrylic / PCB Chassis
    ctx.fillStyle = robot.isColliding ? '#7A1B2B' : '#1D1418';
    ctx.strokeStyle = isClose ? '#C13B3B' : '#4B3358';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, robot.length, robot.width, 8);
    ctx.fill();
    ctx.stroke();

    // Left Wheel
    ctx.fillStyle = '#0F090E';
    ctx.strokeStyle = '#6B4A78';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-14, -halfW - 5, 28, 6);
    ctx.strokeRect(-14, -halfW - 5, 28, 6);

    // Right Wheel
    ctx.fillRect(-14, halfW - 1, 28, 6);
    ctx.strokeRect(-14, halfW - 1, 28, 6);

    // Ultrasonic Sensor Eyes on Front
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(halfL - 4, -9, 4.5, 0, Math.PI * 2);
    ctx.arc(halfL - 4, 9, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ESP32 Chip representation on chassis
    ctx.fillStyle = '#241A1F';
    ctx.strokeStyle = '#3A2A2E';
    ctx.lineWidth = 1;
    ctx.fillRect(-halfL + 8, -12, 20, 24);
    ctx.strokeRect(-halfL + 8, -12, 20, 24);

    // Heading Arrow
    ctx.fillStyle = isClose ? '#C13B3B' : '#F1E9E4';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-2, -5);
    ctx.lineTo(-2, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [robot, obstacles, selectedObstacleId, isRunning]);

  // Pointer Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // 1. First check if clicking selected obstacle resize handle
    if (selectedObstacleId) {
      const currentSelected = obstacles.find((o) => o.id === selectedObstacleId);
      if (currentSelected && isOverResizeHandle(x, y, currentSelected)) {
        setDragMode('resize_obstacle');
        setDragStart({ x, y });
        dragObstacleRef.current = { ...currentSelected };
        return;
      }
    }

    // 2. Check if clicking robot to reposition (only if stopped)
    if (!isRunning && isOverRobot(x, y)) {
      setDragMode('move_robot');
      setDragStart({ x, y });
      setSelectedObstacleId(null);
      return;
    }

    // 3. Check if clicking an obstacle
    const hitObs = getObstacleAt(x, y);
    if (hitObs) {
      setSelectedObstacleId(hitObs.id);
      setDragMode('move_obstacle');
      setDragStart({ x, y });
      dragObstacleRef.current = { ...hitObs };
      return;
    }

    // 4. Clicked blank arena background
    setSelectedObstacleId(null);
    setDragMode('none');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // Update cursor hover feedback when not dragging
    if (dragMode === 'none') {
      if (selectedObstacleId) {
        const currentSelected = obstacles.find((o) => o.id === selectedObstacleId);
        if (currentSelected && isOverResizeHandle(x, y, currentSelected)) {
          setHoveredTarget('resize_handle');
          return;
        }
      }
      if (!isRunning && isOverRobot(x, y)) {
        setHoveredTarget('robot');
        return;
      }
      if (getObstacleAt(x, y)) {
        setHoveredTarget('obstacle');
        return;
      }
      setHoveredTarget('none');
      return;
    }

    // Dragging Actions
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    if (dragMode === 'move_obstacle' && dragObstacleRef.current && selectedObstacleId) {
      const updated = obstacles.map((obs) => {
        if (obs.id === selectedObstacleId) {
          const initial = dragObstacleRef.current!;
          // Snap to 5px grid
          const nextX = Math.max(0, Math.min(580 - obs.width, Math.round((initial.x + dx) / 5) * 5));
          const nextY = Math.max(0, Math.min(380 - obs.height, Math.round((initial.y + dy) / 5) * 5));
          return { ...obs, x: nextX, y: nextY };
        }
        return obs;
      });
      onUpdateObstacles(updated);
    } else if (dragMode === 'resize_obstacle' && dragObstacleRef.current && selectedObstacleId) {
      const updated = obstacles.map((obs) => {
        if (obs.id === selectedObstacleId) {
          const initial = dragObstacleRef.current!;
          const nextW = Math.max(20, Math.min(300, Math.round((initial.width + dx) / 5) * 5));
          const nextH = Math.max(20, Math.min(300, Math.round((initial.height + dy) / 5) * 5));
          return { ...obs, width: nextW, height: nextH };
        }
        return obs;
      });
      onUpdateObstacles(updated);
    } else if (dragMode === 'move_robot' && !isRunning) {
      const nextRx = Math.max(30, Math.min(550, Math.round(x / 5) * 5));
      const nextRy = Math.max(30, Math.min(350, Math.round(y / 5) * 5));
      if (onUpdateRobotPos) {
        onUpdateRobotPos(nextRx, nextRy);
      } else {
        onResetRobot(nextRx, nextRy, robot.heading);
      }
    }
  };

  const handleMouseUp = () => {
    setDragMode('none');
    dragObstacleRef.current = null;
  };

  // Keyboard shortcut: Delete key deletes selected obstacle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedObstacleId && (e.key === 'Delete' || e.key === 'Backspace')) {
        handleDeleteSelectedObstacle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObstacleId, obstacles]);

  // Toolbar Actions
  const handleAddBox = () => {
    const newBox: Obstacle = {
      id: `obs_${Date.now()}`,
      x: 220 + (obstacles.length % 4) * 20,
      y: 120 + (obstacles.length % 4) * 20,
      width: 70,
      height: 70,
      label: `Block ${obstacles.length + 1}`,
    };
    const updated = [...obstacles, newBox];
    onUpdateObstacles(updated);
    setSelectedObstacleId(newBox.id);
  };

  const handleAddWall = (orientation: 'horizontal' | 'vertical') => {
    const newWall: Obstacle = {
      id: `wall_${Date.now()}`,
      x: 200,
      y: 150,
      width: orientation === 'horizontal' ? 140 : 25,
      height: orientation === 'horizontal' ? 25 : 140,
      label: 'Barrier',
    };
    const updated = [...obstacles, newWall];
    onUpdateObstacles(updated);
    setSelectedObstacleId(newWall.id);
  };

  const handleDeleteSelectedObstacle = () => {
    if (!selectedObstacleId) return;
    const updated = obstacles.filter((o) => o.id !== selectedObstacleId);
    onUpdateObstacles(updated);
    setSelectedObstacleId(null);
  };

  const handleClearAllObstacles = () => {
    onUpdateObstacles([]);
    setSelectedObstacleId(null);
  };

  const handleSelectPreset = (presetId: string) => {
    setActivePreset(presetId);
    const preset = TRACK_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onUpdateObstacles(JSON.parse(JSON.stringify(preset.obstacles)));
      setSelectedObstacleId(null);
      onResetRobot(preset.robotStart.x, preset.robotStart.y, preset.robotStart.heading);
    }
  };

  // Cursor style based on hover
  let cursorClass = 'cursor-default';
  if (hoveredTarget === 'resize_handle' || dragMode === 'resize_obstacle') {
    cursorClass = 'cursor-nwse-resize';
  } else if (hoveredTarget === 'obstacle' || hoveredTarget === 'robot' || dragMode === 'move_obstacle' || dragMode === 'move_robot') {
    cursorClass = 'cursor-grab active:cursor-grabbing';
  }

  const headingDeg = Math.round((((robot.heading * 180) / Math.PI) % 360 + 360) % 360);

  return (
    <div className="flex flex-col h-full bg-base pcb-border-l select-none">
      {/* Top Interactive Toolbar */}
      <div className="px-3 py-1.5 bg-panel border-b border-trace flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red shadow-glow-red animate-pulse" />
          <h3 className="text-xs font-mono font-semibold tracking-wider text-white uppercase hidden sm:inline">
            Interactive Track
          </h3>

          {/* Preset Challenge Selector */}
          <div className="flex items-center gap-1 bg-panel-2 px-2 py-0.5 rounded border border-trace">
            <Layers className="w-3 h-3 text-muted" />
            <select
              value={activePreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-transparent text-[11px] font-mono text-white focus:outline-none cursor-pointer"
            >
              {TRACK_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-panel-2 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Track Customization Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddBox}
            title="Add Block"
            className="flex items-center gap-1 px-2 py-1 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white text-[11px] font-mono transition-colors border border-trace"
          >
            <Square className="w-3 h-3 text-red" />
            <span>+ Box</span>
          </button>

          <button
            onClick={() => handleAddWall('horizontal')}
            title="Add Horizontal Barrier"
            className="flex items-center gap-1 px-2 py-1 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white text-[11px] font-mono transition-colors border border-trace"
          >
            <Minus className="w-3 h-3 text-amber-400" />
            <span>+ Wall</span>
          </button>

          {selectedObstacleId && (
            <button
              onClick={handleDeleteSelectedObstacle}
              title="Delete Selected Obstacle (Del)"
              className="flex items-center gap-1 px-2 py-1 rounded bg-red/20 hover:bg-red/30 text-red border border-red/40 text-[11px] font-mono transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={handleClearAllObstacles}
            title="Clear all obstacles"
            className="px-2 py-1 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white text-[11px] font-mono transition-colors border border-trace"
          >
            Clear
          </button>

          <div className="h-4 w-[1px] bg-trace mx-0.5" />

          <button
            onClick={() => onResetRobot()}
            title="Reset Robot to Start"
            className="flex items-center gap-1 px-2 py-1 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white text-[11px] font-mono transition-colors border border-trace"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Arena Canvas Area */}
      <div className="relative flex-1 bg-base flex items-center justify-center overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          width={580}
          height={380}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`rounded border border-trace shadow-lg max-w-full max-h-full ${cursorClass}`}
        />

        {/* Floating Hint Overlay */}
        <div className="absolute top-4 left-4 bg-panel/80 backdrop-blur border border-trace/60 rounded px-2.5 py-1 text-[10px] font-mono text-muted pointer-events-none flex items-center gap-2 shadow-sm">
          <span>💡 Tip: Click & drag obstacles or corner handle to reshape track</span>
          {!isRunning && <span className="text-sky-300">• Drag bot to set start</span>}
        </div>

        {/* Floating Telemetry Bar */}
        <div className="absolute bottom-4 left-4 bg-panel/90 backdrop-blur border border-trace rounded p-2 text-[11px] font-mono shadow-md flex gap-4 text-white">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-muted">Distance:</span>
            <span className={`font-semibold ${robot.detectedDistanceCm < 28 ? 'text-red' : 'text-sky-300'}`}>
              {robot.detectedDistanceCm} cm
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-muted">Heading:</span>
            <span>{headingDeg}°</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-muted">Motors (L/R):</span>
            <span>
              {robot.speedLeft} / {robot.speedRight}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
