import React, { useRef, useEffect } from 'react';
import { Obstacle, RobotState } from '../../types/simulation';
import { RotateCcw, Plus, Compass, Activity, Eye } from 'lucide-react';

interface RobotArenaProps {
  robot: RobotState;
  obstacles: Obstacle[];
  isRunning: boolean;
  onResetRobot: () => void;
  onAddObstacle: () => void;
}

export const RobotArena: React.FC<RobotArenaProps> = ({
  robot,
  obstacles,
  isRunning,
  onResetRobot,
  onAddObstacle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(58, 42, 46, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 30;
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

    // 2. Draw Obstacles
    for (const obs of obstacles) {
      // Body
      ctx.fillStyle = '#1D1418';
      ctx.strokeStyle = '#7A1B2B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.stroke();

      // Hatching stripes for hazard look
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
      ctx.clip();
      ctx.strokeStyle = 'rgba(122, 27, 43, 0.25)';
      ctx.lineWidth = 3;
      for (let i = -obs.height; i < obs.width + obs.height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(obs.x + i, obs.y);
        ctx.lineTo(obs.x + i + obs.height, obs.y + obs.height);
        ctx.stroke();
      }
      ctx.restore();

      // Label
      if (obs.label) {
        ctx.fillStyle = '#9C8B90';
        ctx.font = '10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(obs.label, obs.x + obs.width / 2, obs.y + obs.height / 2 + 3);
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

    // Ultrasonic Sensor "Eyes" on Front
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
  }, [robot, obstacles]);

  const headingDeg = Math.round((((robot.heading * 180) / Math.PI) % 360 + 360) % 360);

  return (
    <div className="flex flex-col h-full bg-base pcb-border-l select-none">
      {/* Header Bar */}
      <div className="px-3 py-2 bg-panel border-b border-trace flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red shadow-glow-red animate-pulse"></span>
          <h3 className="text-xs font-mono font-semibold tracking-wider text-white uppercase">
            2D Physics Arena
          </h3>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              isRunning ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-panel-2 text-muted border border-trace'
            }`}
          >
            {isRunning ? 'SIMULATION ACTIVE' : 'IDLE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddObstacle}
            title="Add Obstacle Box"
            className="p-1 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white transition-colors border border-trace"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetRobot}
            title="Reset Robot to Start Position"
            className="flex items-center gap-1 px-2 py-1 rounded bg-panel-2 hover:bg-trace text-muted hover:text-white text-xs font-mono transition-colors border border-trace"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Bot
          </button>
        </div>
      </div>

      {/* Main Arena Canvas */}
      <div className="relative flex-1 bg-base flex items-center justify-center overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          width={580}
          height={380}
          className="rounded border border-trace shadow-lg max-w-full max-h-full"
        />

        {/* Floating Telemetry Overlay */}
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
