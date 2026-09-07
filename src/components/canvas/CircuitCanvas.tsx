import React, { useState } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Group } from 'react-konva';
import { Circuit, CircuitError, Component, Connection, Pin } from '../../types/circuit';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface CircuitCanvasProps {
  circuit: Circuit;
  errors: CircuitError[];
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onAddConnection: (connection: Connection) => void;
  onRemoveConnection: (connectionId: string) => void;
  onRemoveComponent: (componentId: string) => void;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  circuit,
  errors,
  onUpdateComponentPosition,
  onAddConnection,
  onRemoveConnection,
  onRemoveComponent,
}) => {
  const [activeWireStart, setActiveWireStart] = useState<{
    componentId: string;
    pinId: string;
    x: number;
    y: number;
  } | null>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pinId: string } | null>(null);

  // Helper to find absolute pin coordinates on the canvas
  const getPinCanvasPos = (componentId: string, pinId: string): { x: number; y: number } | null => {
    const comp = circuit.components.find((c) => c.id === componentId);
    if (!comp) return null;
    const pin = comp.pins.find((p) => p.id === pinId);
    if (!pin) return null;

    const relX = pin.relX ?? 10;
    const relY = pin.relY ?? 10;
    return {
      x: comp.position.x + relX,
      y: comp.position.y + relY,
    };
  };

  const handlePinClick = (comp: Component, pin: Pin) => {
    if (!activeWireStart) {
      // Start a new wire
      const pos = getPinCanvasPos(comp.id, pin.id);
      if (pos) {
        setActiveWireStart({
          componentId: comp.id,
          pinId: pin.id,
          x: pos.x,
          y: pos.y,
        });
      }
    } else {
      // End wire if clicking a different component
      if (activeWireStart.componentId !== comp.id || activeWireStart.pinId !== pin.id) {
        // Assign smart color based on pin kind
        let wireColor = '#38BDF8';
        if (pin.kind === 'power' || activeWireStart.pinId === '3V3' || activeWireStart.pinId === 'VCC') {
          wireColor = '#C13B3B'; // Red for power
        } else if (pin.kind === 'ground' || activeWireStart.pinId === 'GND') {
          wireColor = '#3A2A2E'; // Dark trace/black for ground
        } else if (pin.kind === 'pwm') {
          wireColor = '#EC4899'; // Pink for PWM
        }

        const newConn: Connection = {
          id: `w_${Date.now()}`,
          from: { componentId: activeWireStart.componentId, pinId: activeWireStart.pinId },
          to: { componentId: comp.id, pinId: pin.id },
          color: wireColor,
        };
        onAddConnection(newConn);
      }
      setActiveWireStart(null);
    }
  };

  const handleStageMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (pointer) {
      setMousePos(pointer);
    }
  };

  const handleCanvasClick = (e: any) => {
    // If clicked on empty space, cancel active wire or selection
    if (e.target === e.target.getStage()) {
      setActiveWireStart(null);
      setSelectedWireId(null);
    }
  };

  return (
    <div className="relative w-full h-full bg-base pcb-grid overflow-hidden">
      {/* Canvas Top Bar Controls & Helpers */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 bg-panel/85 backdrop-blur px-3 py-1.5 rounded border border-trace text-xs font-mono">
        <span className="text-white font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-plum-light"></span>
          Workbench Canvas
        </span>
        <span className="text-muted text-[11px]">
          {activeWireStart ? '👉 Click target pin to complete connection' : 'Drag chips to position • Click pins to wire'}
        </span>
        {selectedWireId && (
          <button
            onClick={() => {
              onRemoveConnection(selectedWireId);
              setSelectedWireId(null);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-red/20 text-red border border-red hover:bg-red/30 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete Wire
          </button>
        )}
      </div>

      <Stage
        width={900}
        height={650}
        onMouseMove={handleStageMouseMove}
        onClick={handleCanvasClick}
        className="cursor-crosshair"
      >
        <Layer>
          {/* 1. Render All Connections / Wires */}
          {circuit.connections.map((conn) => {
            const p1 = getPinCanvasPos(conn.from.componentId, conn.from.pinId);
            const p2 = getPinCanvasPos(conn.to.componentId, conn.to.pinId);
            if (!p1 || !p2) return null;

            const isSelected = selectedWireId === conn.id;
            const wireColor = isSelected ? '#F1E9E4' : conn.color || '#38BDF8';

            // Quadratic / Bezier curve control points
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const ctrlX = p1.x + dx * 0.5;
            const ctrlY = Math.max(p1.y, p2.y) + Math.abs(dx) * 0.2 + 20;

            return (
              <Group key={conn.id} onClick={() => setSelectedWireId(conn.id)}>
                {/* Outer shadow / hit target */}
                <Line
                  points={[p1.x, p1.y, ctrlX, ctrlY, p2.x, p2.y]}
                  stroke={isSelected ? '#C13B3B' : 'transparent'}
                  strokeWidth={isSelected ? 6 : 10}
                  lineCap="round"
                  tension={0.4}
                />
                {/* Main wire line */}
                <Line
                  points={[p1.x, p1.y, ctrlX, ctrlY, p2.x, p2.y]}
                  stroke={wireColor}
                  strokeWidth={2.5}
                  lineCap="round"
                  tension={0.4}
                  shadowColor={wireColor}
                  shadowBlur={isSelected ? 8 : 2}
                  shadowOpacity={0.6}
                />
                {/* Terminal dots */}
                <Circle x={p1.x} y={p1.y} radius={3.5} fill={wireColor} />
                <Circle x={p2.x} y={p2.y} radius={3.5} fill={wireColor} />
              </Group>
            );
          })}

          {/* Active Pending Wire */}
          {activeWireStart && (
            <Line
              points={[
                activeWireStart.x,
                activeWireStart.y,
                (activeWireStart.x + mousePos.x) / 2,
                Math.max(activeWireStart.y, mousePos.y) + 30,
                mousePos.x,
                mousePos.y,
              ]}
              stroke="#F1E9E4"
              strokeWidth={2}
              dash={[5, 5]}
              tension={0.4}
            />
          )}

          {/* 2. Render Hardware Components */}
          {circuit.components.map((comp) => {
            const catalog = COMPONENT_CATALOG[comp.type] || {
              width: 140,
              height: 100,
              name: comp.type,
            };
            const error = errors.find((e) => e.componentId === comp.id);

            return (
              <Group
                key={comp.id}
                x={comp.position.x}
                y={comp.position.y}
                draggable
                onDragEnd={(e) => {
                  onUpdateComponentPosition(comp.id, Math.round(e.target.x()), Math.round(e.target.y()));
                }}
              >
                {/* Component PCB Body Card */}
                <Rect
                  width={catalog.width}
                  height={catalog.height}
                  fill={error ? '#1F1216' : '#1D1418'}
                  stroke={error ? '#C13B3B' : '#3A2A2E'}
                  strokeWidth={error ? 2 : 1}
                  cornerRadius={6}
                  shadowColor="#000000"
                  shadowBlur={10}
                  shadowOpacity={0.4}
                />

                {/* Top Header Bar inside chip */}
                <Rect
                  width={catalog.width}
                  height={24}
                  fill={error ? '#7A1B2B' : '#241A1F'}
                  cornerRadius={[6, 6, 0, 0]}
                />

                {/* Component Label */}
                <Text
                  text={comp.label || catalog.name}
                  x={10}
                  y={6}
                  fill="#F1E9E4"
                  fontSize={10}
                  fontFamily="Space Grotesk"
                  fontStyle="bold"
                />

                {/* Special Visuals per component type */}
                {comp.type === 'ESP32' && (
                  <Group x={35} y={35}>
                    {/* Metal RF Shield */}
                    <Rect width={80} height={100} fill="#181115" stroke="#3A2A2E" strokeWidth={1} cornerRadius={4} />
                    <Text text="ESP-WROOM-32" x={8} y={15} fill="#9C8B90" fontSize={8} fontFamily="IBM Plex Mono" />
                    <Rect width={40} height={3} fill="#C13B3B" x={20} y={30} opacity={0.6} />
                    {/* Running status LED */}
                    <Circle x={70} y={80} radius={4} fill={comp.state.running ? '#10B981' : '#C13B3B'} />
                  </Group>
                )}

                {comp.type === 'UltrasonicSensor' && (
                  <Group x={25} y={32}>
                    {/* Dual transducer circles */}
                    <Circle x={25} y={20} radius={18} fill="#241A1F" stroke="#38BDF8" strokeWidth={2} />
                    <Circle x={25} y={20} radius={8} fill="#120C11" />
                    <Text text="T" x={22} y={16} fill="#38BDF8" fontSize={8} fontFamily="IBM Plex Mono" />

                    <Circle x={95} y={20} radius={18} fill="#241A1F" stroke="#38BDF8" strokeWidth={2} />
                    <Circle x={95} y={20} radius={8} fill="#120C11" />
                    <Text text="R" x={92} y={16} fill="#38BDF8" fontSize={8} fontFamily="IBM Plex Mono" />
                  </Group>
                )}

                {comp.type === 'MotorDriver' && (
                  <Group x={35} y={35}>
                    {/* Heatsink fins */}
                    <Rect width={120} height={80} fill="#181115" stroke="#4B3358" strokeWidth={1} cornerRadius={4} />
                    <Text text="L298N DUAL H-BRIDGE" x={10} y={10} fill="#6B4A78" fontSize={8} fontFamily="IBM Plex Mono" fontStyle="bold" />
                    <Text text={`L: ${comp.state.dirLeft || 'STOP'}`} x={10} y={30} fill="#F1E9E4" fontSize={9} fontFamily="IBM Plex Mono" />
                    <Text text={`R: ${comp.state.dirRight || 'STOP'}`} x={70} y={30} fill="#F1E9E4" fontSize={9} fontFamily="IBM Plex Mono" />
                  </Group>
                )}

                {comp.type === 'LED' && (
                  <Group x={20} y={30}>
                    <Circle
                      x={15}
                      y={20}
                      radius={16}
                      fill={comp.state.isOn ? '#EF4444' : '#7A1B2B'}
                      stroke="#C13B3B"
                      strokeWidth={2}
                      shadowColor="#EF4444"
                      shadowBlur={comp.state.isOn ? 18 : 2}
                      shadowOpacity={0.9}
                    />
                  </Group>
                )}

                {comp.type === 'DCMotor' && (
                  <Group x={25} y={32}>
                    <Rect width={90} height={35} fill="#241A1F" stroke="#4B3358" strokeWidth={1} cornerRadius={4} />
                    <Text
                      text={`RPM: ${comp.state.rpm || 0}`}
                      x={10}
                      y={8}
                      fill="#F1E9E4"
                      fontSize={9}
                      fontFamily="IBM Plex Mono"
                    />
                    <Text
                      text={`DIR: ${comp.state.direction || 'IDLE'}`}
                      x={10}
                      y={20}
                      fill="#9C8B90"
                      fontSize={8}
                      fontFamily="IBM Plex Mono"
                    />
                  </Group>
                )}

                {/* AI Error Flag Badge on Canvas (Design System requirement) */}
                {error && (
                  <Group x={catalog.width - 24} y={-8}>
                    <Circle radius={10} fill="#C13B3B" stroke="#F1E9E4" strokeWidth={1} shadowColor="#C13B3B" shadowBlur={8} />
                    <Text text="!" x={-3} y={-6} fill="#F1E9E4" fontSize={12} fontFamily="Space Grotesk" fontStyle="bold" />
                  </Group>
                )}

                {/* Render Pins */}
                {comp.pins.map((pin) => {
                  const px = pin.relX ?? 10;
                  const py = pin.relY ?? 10;
                  const isHovered = hoveredPin?.componentId === comp.id && hoveredPin?.pinId === pin.id;
                  const isConnected = circuit.connections.some(
                    (c) =>
                      (c.from.componentId === comp.id && c.from.pinId === pin.id) ||
                      (c.to.componentId === comp.id && c.to.pinId === pin.id)
                  );

                  let pinColor = '#9C8B90';
                  if (pin.kind === 'power') pinColor = '#C13B3B';
                  else if (pin.kind === 'ground') pinColor = '#3A2A2E';
                  else if (pin.kind === 'pwm') pinColor = '#EC4899';
                  else if (pin.kind === 'digital') pinColor = '#10B981';

                  return (
                    <Group
                      key={pin.id}
                      x={px}
                      y={py}
                      onMouseEnter={() => setHoveredPin({ componentId: comp.id, pinId: pin.id })}
                      onMouseLeave={() => setHoveredPin(null)}
                      onClick={(e) => {
                        e.cancelBubble = true;
                        handlePinClick(comp, pin);
                      }}
                    >
                      {/* Outer Pad Ring */}
                      <Circle
                        radius={isHovered ? 7 : 5}
                        fill="#120C11"
                        stroke={pinColor}
                        strokeWidth={isHovered ? 2.5 : 1.5}
                      />
                      {/* Inner Solder Joint */}
                      <Circle radius={isConnected ? 3 : 2} fill={pinColor} />

                      {/* Pin Label */}
                      <Text
                        text={pin.label || pin.id}
                        x={px < catalog.width / 2 ? 8 : -38}
                        y={-4}
                        fill={isHovered ? '#F1E9E4' : '#9C8B90'}
                        fontSize={8}
                        fontFamily="IBM Plex Mono"
                      />
                    </Group>
                  );
                })}
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* Inline Canvas Error Details Bar if an error is present */}
      {errors.length > 0 && (
        <div className="absolute bottom-2 left-3 right-3 z-10 bg-panel/95 backdrop-blur border border-red/40 rounded p-2.5 shadow-glow-red flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red flex-shrink-0 animate-bounce" />
            <div>
              <span className="text-xs font-mono font-bold text-red mr-2">
                AI ALERT: {errors[0].issue}
              </span>
              <span className="text-[11px] text-white/90">{errors[0].explanation}</span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-red/20 text-red px-2 py-1 rounded border border-red/30 flex-shrink-0">
            Fix: {errors[0].suggestedFix}
          </span>
        </div>
      )}
    </div>
  );
};
