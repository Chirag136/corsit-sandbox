import React, { useState, useRef, useEffect } from 'react';
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Line,
  Text,
  Group,
  Wedge,
} from 'react-konva';
import {
  Circuit,
  CircuitError,
  Component,
  Connection,
  Pin,
  Point,
} from '../../types/circuit';
import { COMPONENT_CATALOG } from '../../data/componentCatalog';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface TinkerCanvasProps {
  circuit: Circuit;
  errors: CircuitError[];
  isRunning: boolean;
  selectedWireColor: string;
  selectedComponentId: string | null;
  selectedWireId: string | null;
  onSelectComponent: (id: string | null) => void;
  onSelectWire: (id: string | null) => void;
  onUpdateComponentPosition: (id: string, x: number, y: number) => void;
  onAddConnection: (connection: Connection) => void;
  onRemoveConnection: (id: string) => void;
}

export const TinkerCanvas: React.FC<TinkerCanvasProps> = ({
  circuit,
  errors,
  isRunning,
  selectedWireColor,
  selectedComponentId,
  selectedWireId,
  onSelectComponent,
  onSelectWire,
  onUpdateComponentPosition,
  onAddConnection,
  onRemoveConnection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 1000, height: 700 });
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);

  // Active wiring state
  const [wireStart, setWireStart] = useState<{
    componentId: string;
    pinId: string;
    x: number;
    y: number;
  } | null>(null);
  const [wireBends, setWireBends] = useState<Point[]>([]);
  const [currentMousePos, setCurrentMousePos] = useState<Point>({ x: 0, y: 0 });

  // Hover state
  const [hoveredPin, setHoveredPin] = useState<{
    componentId: string;
    pin: Pin;
    absX: number;
    absY: number;
  } | null>(null);

  // Ultrasonic interactive cone state during sim
  const [ultrasonicCone, setUltrasonicCone] = useState<{
    componentId: string;
    distanceCm: number;
  } | null>(null);

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Helper: Pin absolute canvas coordinate considering component rotation
  const getPinAbsolutePos = (comp: Component, pin: Pin): Point => {
    const rot = (comp.rotation || 0) * (Math.PI / 180);
    const catalog = COMPONENT_CATALOG[comp.type] || { width: 100, height: 100 };
    const relX = pin.relX ?? 10;
    const relY = pin.relY ?? 10;

    // Component center
    const cx = catalog.width / 2;
    const cy = catalog.height / 2;

    // Relative to center
    const dx = relX - cx;
    const dy = relY - cy;

    // Rotated around center
    const rx = dx * Math.cos(rot) - dy * Math.sin(rot);
    const ry = dx * Math.sin(rot) + dy * Math.cos(rot);

    return {
      x: comp.position.x + cx + rx,
      y: comp.position.y + cy + ry,
    };
  };

  const findPinPos = (compGuid: string, pinId: string): Point | null => {
    const comp = circuit.components.find((c) => c.id === compGuid);
    if (!comp) return null;
    const pin = comp.pins.find((p) => p.id === pinId);
    if (!pin) return null;
    return getPinAbsolutePos(comp, pin);
  };

  // Mouse wheel zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.3, Math.min(2.5, newScale));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    setScale(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Stage Pan
  const handleStageMouseDown = (e: any) => {
    // Left click on stage background or middle click initiates pan
    if (e.target === e.target.getStage() || e.evt.button === 1 || e.evt.button === 0 && e.evt.spaceKey) {
      setIsPanning(true);
      onSelectComponent(null);
      onSelectWire(null);
    }
  };

  const handleStageMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Transform pointer to canvas coordinate space
    const canvasPoint: Point = {
      x: (pointer.x - stagePos.x) / scale,
      y: (pointer.y - stagePos.y) / scale,
    };
    setCurrentMousePos(canvasPoint);

    if (isPanning && e.evt.buttons === 1) {
      setStagePos((prev) => ({
        x: prev.x + e.evt.movementX,
        y: prev.y + e.evt.movementY,
      }));
    }
  };

  const handleStageMouseUp = () => {
    setIsPanning(false);
  };

  // Click on pin to start or finish wire
  const handlePinClick = (comp: Component, pin: Pin) => {
    const absPos = getPinAbsolutePos(comp, pin);

    if (!wireStart) {
      // Begin new wire
      setWireStart({
        componentId: comp.id,
        pinId: pin.id,
        x: absPos.x,
        y: absPos.y,
      });
      setWireBends([]);
    } else {
      // Terminate wire on different pin
      if (wireStart.componentId !== comp.id || wireStart.pinId !== pin.id) {
        const newConn: Connection = {
          id: `w_${Date.now()}`,
          from: { componentId: wireStart.componentId, pinId: wireStart.pinId },
          to: { componentId: comp.id, pinId: pin.id },
          color: selectedWireColor || '#22C55E',
          bendPoints: [...wireBends],
        };
        onAddConnection(newConn);
      }
      setWireStart(null);
      setWireBends([]);
    }
  };

  // Click on empty canvas to add elbow bend point (Signature TinkerCAD wiring!)
  const handleCanvasClick = (e: any) => {
    if (e.target === e.target.getStage() && wireStart) {
      // Add bend point
      setWireBends((prev) => [...prev, currentMousePos]);
    } else if (e.target === e.target.getStage()) {
      onSelectComponent(null);
      onSelectWire(null);
      setUltrasonicCone(null);
    }
  };

  // Render TinkerCAD realistic components
  const renderComponentGraphic = (comp: Component) => {
    const catalog = COMPONENT_CATALOG[comp.type] || { width: 100, height: 100, name: comp.type };
    const isSelected = selectedComponentId === comp.id;
    const error = errors.find((e) => e.componentId === comp.id);
    const rot = comp.rotation || 0;

    return (
      <Group
        key={comp.id}
        x={comp.position.x + catalog.width / 2}
        y={comp.position.y + catalog.height / 2}
        rotation={rot}
        offset={{ x: catalog.width / 2, y: catalog.height / 2 }}
        draggable
        onDragStart={() => onSelectComponent(comp.id)}
        onDragEnd={(e) => {
          onUpdateComponentPosition(
            comp.id,
            Math.round(e.target.x() - catalog.width / 2),
            Math.round(e.target.y() - catalog.height / 2)
          );
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectComponent(comp.id);
          onSelectWire(null);
          if (comp.type === 'UltrasonicSensor') {
            setUltrasonicCone({
              componentId: comp.id,
              distanceCm: Number(comp.state.distanceCm) || 45,
            });
          }
        }}
      >
        {/* Selection Bounding Halo (TinkerCAD Blue Selection) */}
        {isSelected && (
          <Rect
            width={catalog.width + 12}
            height={catalog.height + 12}
            x={-6}
            y={-6}
            stroke="#0284C7"
            strokeWidth={2}
            dash={[4, 4]}
            cornerRadius={4}
          />
        )}

        {/* 0. ARDUINO UNO R3 */}
        {comp.type === 'ArduinoUno' && (
          <Group>
            {/* Iconic Italian Teal/Blue Arduino PCB */}
            <Rect
              width={catalog.width}
              height={catalog.height}
              fill="#0E5B63"
              stroke="#093E44"
              strokeWidth={2}
              cornerRadius={6}
              shadowColor="#000"
              shadowBlur={12}
              shadowOpacity={0.45}
            />

            {/* Silver USB Type-B Connector */}
            <Rect width={38} height={34} x={-4} y={15} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={1} cornerRadius={2} />
            <Rect width={18} height={18} x={2} y={23} fill="#475569" />

            {/* DC Power Barrel Jack (9V-12V) */}
            <Rect width={44} height={42} x={-6} y={118} fill="#18181B" stroke="#27272A" strokeWidth={1} cornerRadius={2} />
            <Circle x={14} y={139} radius={7} fill="#3F3F46" />

            {/* Red Reset Pushbutton */}
            <Rect width={16} height={16} x={50} y={15} fill="#D4D4D8" stroke="#A1A1AA" strokeWidth={0.5} cornerRadius={2} />
            <Circle x={58} y={23} radius={4.5} fill="#EF4444" />

            {/* 16 MHz Crystal Oscillator */}
            <Rect width={14} height={26} x={60} y={55} fill="#E2E8F0" stroke="#94A3B8" strokeWidth={1} cornerRadius={3} />
            <Text text="16.000" x={61} y={63} fill="#64748B" fontSize={5} fontFamily="IBM Plex Mono" rotation={90} />

            {/* ATmega328P Microcontroller (DIP-28 Socket) */}
            <Rect width={88} height={30} x={124} y={86} fill="#1C1917" stroke="#44403C" strokeWidth={1} cornerRadius={2} />
            <Circle x={128} y={101} radius={3} fill="#44403C" />
            <Text text="ATMEGA328P-PU" x={136} y={96} fill="#A8A29E" fontSize={7} fontFamily="IBM Plex Mono" fontStyle="bold" />

            {/* Onboard LEDs: 'ON' and 'L' (Pin 13) */}
            <Circle x={82} y={68} radius={3} fill={isRunning ? '#22C55E' : '#14532D'} shadowColor={isRunning ? '#22C55E' : 'transparent'} shadowBlur={6} />
            <Text text="ON" x={78} y={74} fill="#94A3B8" fontSize={6} fontFamily="IBM Plex Mono" fontStyle="bold" />

            {/* Built-in Pin 13 'L' LED (Glows when Pin 13 is HIGH!) */}
            <Circle
              x={82}
              y={94}
              radius={3.5}
              fill={comp.state.pin13Led ? '#F59E0B' : '#78350F'}
              shadowColor={comp.state.pin13Led ? '#F59E0B' : 'transparent'}
              shadowBlur={comp.state.pin13Led ? 10 : 0}
            />
            <Text text="L" x={80} y={100} fill="#F59E0B" fontSize={7} fontFamily="IBM Plex Mono" fontStyle="bold" />

            {/* Silkscreen Branding */}
            <Text text="ARDUINO" x={130} y={40} fill="#F8FAFC" fontSize={13} fontFamily="Space Grotesk" fontStyle="bold" />
            <Text text="UNO" x={192} y={39} fill="#38BDF8" fontSize={14} fontFamily="Space Grotesk" fontStyle="bold" />
            <Text text="CorSIT Sandbox Edition" x={130} y={55} fill="#94A3B8" fontSize={7} fontFamily="IBM Plex Mono" />

            {/* Top Digital Socket Header Bar */}
            <Rect width={160} height={16} x={80} y={10} fill="#18181B" stroke="#27272A" strokeWidth={1} />
            <Text text="DIGITAL (PWM ~)" x={125} y={28} fill="#F8FAFC" fontSize={7} fontFamily="IBM Plex Mono" />

            {/* Bottom Power & Analog Socket Header Bars */}
            <Rect width={78} height={16} x={102} y={154} fill="#18181B" stroke="#27272A" strokeWidth={1} />
            <Text text="POWER" x={124} y={144} fill="#F8FAFC" fontSize={7} fontFamily="IBM Plex Mono" />

            <Rect width={72} height={16} x={192} y={154} fill="#18181B" stroke="#27272A" strokeWidth={1} />
            <Text text="ANALOG IN" x={202} y={144} fill="#F8FAFC" fontSize={7} fontFamily="IBM Plex Mono" />
          </Group>
        )}

        {/* 1. BREADBOARD SMALL */}
        {comp.type === 'Breadboard' && (
          <Group>
            {/* White/cream plastic base */}
            <Rect
              width={catalog.width}
              height={catalog.height}
              fill="#EDE8E2"
              stroke="#B3ABA0"
              strokeWidth={1.5}
              cornerRadius={6}
              shadowColor="#000"
              shadowBlur={12}
              shadowOpacity={0.3}
            />
            {/* Red and Blue Power Rail Stripes */}
            <Line points={[35, 12, 450, 12]} stroke="#EF4444" strokeWidth={2} />
            <Line points={[35, 40, 450, 40]} stroke="#3B82F6" strokeWidth={2} />
            <Line points={[35, 244, 450, 244]} stroke="#EF4444" strokeWidth={2} />
            <Line points={[35, 272, 450, 272]} stroke="#3B82F6" strokeWidth={2} />

            {/* Central divider channel */}
            <Rect width={430} height={18} x={25} y={130} fill="#D6CEC5" />
            <Text text="CorSIT BREADBOARD" x={170} y={134} fill="#8A8075" fontSize={9} fontFamily="Space Grotesk" fontStyle="bold" />

            {/* Render realistic square pin sockets */}
            {comp.pins.map((p) => (
              <Rect
                key={p.id}
                x={(p.relX ?? 0) - 2.5}
                y={(p.relY ?? 0) - 2.5}
                width={5}
                height={5}
                fill="#2B2628"
                stroke="#6B625B"
                strokeWidth={0.5}
              />
            ))}
          </Group>
        )}

        {/* 2. ESP32 NODEMCU */}
        {comp.type === 'ESP32' && (
          <Group>
            {/* Matte Dark PCB */}
            <Rect
              width={catalog.width}
              height={catalog.height}
              fill="#181115"
              stroke="#3A2A2E"
              strokeWidth={2}
              cornerRadius={4}
              shadowColor="#000"
              shadowBlur={10}
              shadowOpacity={0.5}
            />
            {/* Dual Black Header Strips */}
            <Rect width={16} height={210} x={10} y={20} fill="#0D080B" stroke="#241A1F" strokeWidth={1} />
            <Rect width={16} height={210} x={144} y={20} fill="#0D080B" stroke="#241A1F" strokeWidth={1} />

            {/* Silver ESP-WROOM-32 Metal RF Shield */}
            <Rect width={84} height={96} x={43} y={65} fill="#332B30" stroke="#5E535A" strokeWidth={1.5} cornerRadius={3} />
            <Text text="ESP-WROOM-32" x={47} y={72} fill="#A89E9A" fontSize={8} fontFamily="IBM Plex Mono" fontStyle="bold" />
            <Text text="CE 0700 FCC ID" x={47} y={84} fill="#7A6F75" fontSize={6} fontFamily="IBM Plex Mono" />

            {/* Onboard Running LED */}
            <Circle x={50} y={190} radius={3.5} fill={isRunning ? '#22C55E' : '#EF4444'} shadowColor={isRunning ? '#22C55E' : '#EF4444'} shadowBlur={6} />
            <Text text="PWR" x={56} y={187} fill="#9C8B90" fontSize={7} fontFamily="IBM Plex Mono" />

            {/* Micro USB Port at bottom */}
            <Rect width={30} height={14} x={70} y={240} fill="#7A6F75" stroke="#4A3F45" strokeWidth={1} cornerRadius={2} />
          </Group>
        )}

        {/* 3. ULTRASONIC SENSOR HC-SR04 */}
        {comp.type === 'UltrasonicSensor' && (
          <Group>
            {/* Blue / CorSIT PCB */}
            <Rect
              width={catalog.width}
              height={catalog.height}
              fill="#1E2C3D"
              stroke="#0284C7"
              strokeWidth={1.5}
              cornerRadius={4}
              shadowColor="#000"
              shadowBlur={8}
            />
            {/* Transducer T (Transmitter) */}
            <Circle x={45} y={42} radius={24} fill="#94A3B8" stroke="#475569" strokeWidth={2} />
            <Circle x={45} y={42} radius={18} fill="#334155" />
            <Text text="T" x={41} y={35} fill="#94A3B8" fontSize={14} fontFamily="IBM Plex Mono" fontStyle="bold" />

            {/* Transducer R (Receiver) */}
            <Circle x={125} y={42} radius={24} fill="#94A3B8" stroke="#475569" strokeWidth={2} />
            <Circle x={125} y={42} radius={18} fill="#334155" />
            <Text text="R" x={121} y={35} fill="#94A3B8" fontSize={14} fontFamily="IBM Plex Mono" fontStyle="bold" />

            {/* Crystal Oscillator */}
            <Rect width={22} height={8} x={74} y={20} fill="#CBD5E1" stroke="#64748B" strokeWidth={0.5} cornerRadius={3} />
            <Text text="HC-SR04" x={67} y={48} fill="#38BDF8" fontSize={8} fontFamily="Space Grotesk" fontStyle="bold" />
          </Group>
        )}

        {/* 4. MOTOR DRIVER L298N */}
        {comp.type === 'MotorDriver' && (
          <Group>
            {/* Red / Maroon PCB */}
            <Rect width={catalog.width} height={catalog.height} fill="#581622" stroke="#7A1B2B" strokeWidth={1.5} cornerRadius={4} />
            {/* Black Aluminum Heatsink Fins */}
            <Rect width={120} height={55} x={35} y={20} fill="#140D10" stroke="#3A2A2E" strokeWidth={1.5} cornerRadius={2} />
            {/* Blue Terminal Blocks */}
            <Rect width={18} height={50} x={6} y={32} fill="#1D4ED8" stroke="#1E40AF" strokeWidth={1} cornerRadius={2} />
            <Rect width={18} height={50} x={166} y={32} fill="#1D4ED8" stroke="#1E40AF" strokeWidth={1} cornerRadius={2} />
            <Text text="L298N DUAL H-BRIDGE" x={42} y={85} fill="#F1E9E4" fontSize={9} fontFamily="IBM Plex Mono" fontStyle="bold" />
          </Group>
        )}

        {/* 5. DC MOTOR */}
        {comp.type === 'DCMotor' && (
          <Group>
            {/* Yellow TT Gearbox Body */}
            <Rect width={catalog.width} height={catalog.height} fill="#EAB308" stroke="#CA8A04" strokeWidth={1.5} cornerRadius={6} />
            {/* White Drive Shaft */}
            <Circle x={70} y={42} radius={14} fill="#F8FAFC" stroke="#94A3B8" strokeWidth={1.5} />
            <Rect width={6} height={20} x={67} y={32} fill="#0F172A" />
            <Text text="TT GEARMOTOR" x={24} y={66} fill="#713F12" fontSize={9} fontFamily="IBM Plex Mono" fontStyle="bold" />
          </Group>
        )}

        {/* 6. LED (TinkerCAD 5mm Diffused) */}
        {comp.type === 'LED' && (
          <Group>
            {/* Translucent Dome Lens */}
            <Circle
              x={35}
              y={38}
              radius={24}
              fill={comp.state.isOn ? '#EF4444' : '#7A1B2B'}
              stroke="#C13B3B"
              strokeWidth={2}
              shadowColor="#EF4444"
              shadowBlur={comp.state.isOn ? 26 : 2}
              shadowOpacity={0.9}
            />
            {/* Internal Anvil & Post */}
            <Line points={[30, 48, 30, 36, 38, 36]} stroke="#F1E9E4" strokeWidth={1.5} opacity={0.6} />
            <Line points={[40, 48, 40, 32]} stroke="#F1E9E4" strokeWidth={1.5} opacity={0.6} />
            {/* Metal Pins */}
            <Line points={[24, 48, 24, 96]} stroke="#94A3B8" strokeWidth={2} />
            <Line points={[46, 48, 46, 96]} stroke="#94A3B8" strokeWidth={2} />
          </Group>
        )}

        {/* 7. RESISTOR (TinkerCAD 4-band Beige) */}
        {comp.type === 'Resistor' && (
          <Group>
            {/* Metal Leads */}
            <Line points={[8, 22, 102, 22]} stroke="#94A3B8" strokeWidth={2.5} />
            {/* Ceramic Beige Body */}
            <Rect width={60} height={22} x={25} y={11} fill="#D4C5B9" stroke="#9C8B90" strokeWidth={1} cornerRadius={6} />
            {/* 4 Color Bands (220Ω: Red, Red, Brown, Gold) */}
            <Rect width={4} height={22} x={34} y={11} fill="#EF4444" />
            <Rect width={4} height={22} x={44} y={11} fill="#EF4444" />
            <Rect width={4} height={22} x={54} y={11} fill="#78350F" />
            <Rect width={4} height={22} x={66} y={11} fill="#EAB308" />
          </Group>
        )}

        {/* 8. PUSHBUTTON (TinkerCAD 4-pin Tactile Switch) */}
        {comp.type === 'Pushbutton' && (
          <Group
            onMouseDown={(e) => {
              e.cancelBubble = true;
              comp.state.isPressed = true;
            }}
            onMouseUp={(e) => {
              e.cancelBubble = true;
              comp.state.isPressed = false;
            }}
          >
            {/* Plastic Base */}
            <Rect
              width={catalog.width}
              height={catalog.height}
              fill="#18181B"
              stroke="#3F3F46"
              strokeWidth={1.5}
              cornerRadius={6}
              shadowColor="#000"
              shadowBlur={8}
            />
            {/* Metal Face Plate */}
            <Rect width={50} height={50} x={10} y={10} fill="#71717A" stroke="#52525B" strokeWidth={1} cornerRadius={4} />
            {/* Corner Rivets */}
            <Circle x={14} y={14} radius={2} fill="#A1A1AA" />
            <Circle x={56} y={14} radius={2} fill="#A1A1AA" />
            <Circle x={14} y={56} radius={2} fill="#A1A1AA" />
            <Circle x={56} y={56} radius={2} fill="#A1A1AA" />
            {/* Round Actuator Button (Depresses on click) */}
            <Circle
              x={35}
              y={35}
              radius={comp.state.isPressed ? 14 : 16}
              fill={comp.state.isPressed ? '#1D4ED8' : '#2563EB'}
              stroke="#1E40AF"
              strokeWidth={2}
              shadowColor={comp.state.isPressed ? '#3B82F6' : 'transparent'}
              shadowBlur={comp.state.isPressed ? 10 : 0}
            />
            <Text text={comp.state.isPressed ? 'DOWN' : 'PUSH'} x={24} y={32} fill="#FFFFFF" fontSize={7} fontFamily="IBM Plex Mono" fontStyle="bold" />
          </Group>
        )}

        {/* 9. POTENTIOMETER (TinkerCAD Rotary Dial) */}
        {comp.type === 'Potentiometer' && (
          <Group>
            {/* Blue Sealed Cermet Body */}
            <Rect
              width={catalog.width}
              height={catalog.height}
              fill="#1D4ED8"
              stroke="#1E40AF"
              strokeWidth={1.5}
              cornerRadius={6}
              shadowColor="#000"
              shadowBlur={8}
            />
            {/* Metal Bushing & Flange */}
            <Circle x={40} y={38} radius={24} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={1.5} />
            {/* Inner Rotating Rotor */}
            <Circle x={40} y={38} radius={18} fill="#475569" stroke="#334155" strokeWidth={1} />
            {/* Wiper Pointer Indicator based on state value */}
            {(() => {
              const val = Number(comp.state.value) || 512;
              const angleRad = ((val / 1023) * 270 - 135) * (Math.PI / 180);
              const pX = 40 + Math.cos(angleRad) * 14;
              const pY = 38 + Math.sin(angleRad) * 14;
              return (
                <Group>
                  <Line points={[40, 38, pX, pY]} stroke="#F59E0B" strokeWidth={3} lineCap="round" />
                  <Circle x={pX} y={pY} radius={3} fill="#EF4444" />
                </Group>
              );
            })()}
            <Text text={`${comp.state.value ?? 512}`} x={28} y={4} fill="#F8FAFC" fontSize={8} fontFamily="IBM Plex Mono" fontStyle="bold" />
          </Group>
        )}

        {/* AI Error Badge if component has an issue */}
        {error && (
          <Group x={catalog.width - 20} y={-8}>
            <Circle radius={11} fill="#C13B3B" stroke="#F1E9E4" strokeWidth={1.5} shadowColor="#C13B3B" shadowBlur={8} />
            <Text text="!" x={-3} y={-7} fill="#F1E9E4" fontSize={13} fontFamily="Space Grotesk" fontStyle="bold" />
          </Group>
        )}

        {/* Render Connection Pin Terminals (Interactive Halos) */}
        {comp.pins.map((pin) => {
          const px = pin.relX ?? 10;
          const py = pin.relY ?? 10;
          const isHovered = hoveredPin?.componentId === comp.id && hoveredPin?.pin.id === pin.id;

          let pinPadColor = '#64748B';
          if (pin.kind === 'power') pinPadColor = '#EF4444';
          else if (pin.kind === 'ground') pinPadColor = '#1E293B';
          else if (pin.kind === 'pwm') pinPadColor = '#EC4899';
          else if (pin.kind === 'digital') pinPadColor = '#10B981';

          return (
            <Group
              key={pin.id}
              x={px}
              y={py}
              onMouseEnter={() => {
                const absPos = getPinAbsolutePos(comp, pin);
                setHoveredPin({ componentId: comp.id, pin, absX: absPos.x, absY: absPos.y });
              }}
              onMouseLeave={() => setHoveredPin(null)}
              onClick={(e) => {
                e.cancelBubble = true;
                handlePinClick(comp, pin);
              }}
            >
              {/* TinkerCAD Green Pin Halo Hover Ring */}
              {isHovered && (
                <Circle
                  radius={9}
                  stroke="#22C55E"
                  strokeWidth={2.5}
                  fill="rgba(34, 197, 94, 0.25)"
                />
              )}
              {/* Outer solder pad ring */}
              <Circle
                radius={4.5}
                fill="#181115"
                stroke={pinPadColor}
                strokeWidth={1.5}
              />
              {/* Inner Hole */}
              <Circle radius={1.8} fill={pinPadColor} />
            </Group>
          );
        })}
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-base pcb-grid overflow-hidden select-none"
    >
      {/* TinkerCAD Floating Pin Tooltip */}
      {hoveredPin && (
        <div
          className="absolute z-40 bg-black/90 text-white border border-trace rounded px-2 py-1 text-[11px] font-mono shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-9"
          style={{
            left: `${stagePos.x + hoveredPin.absX * scale}px`,
            top: `${stagePos.y + hoveredPin.absY * scale}px`,
          }}
        >
          <span className="text-emerald-400 mr-1">●</span>
          <span>{hoveredPin.pin.label || hoveredPin.pin.id}</span>
          <span className="text-muted ml-1 text-[10px]">({hoveredPin.pin.kind})</span>
        </div>
      )}

      {/* Main Konva Stage */}
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onClick={handleCanvasClick}
        className={wireStart ? 'cursor-crosshair' : isPanning ? 'cursor-grabbing' : 'cursor-default'}
      >
        <Layer>
          {/* 1. RENDER WIRES / CONNECTIONS (TinkerCAD Bendable Wires) */}
          {circuit.connections.map((conn) => {
            const pStart = findPinPos(conn.from.componentId, conn.from.pinId);
            const pEnd = findPinPos(conn.to.componentId, conn.to.pinId);
            if (!pStart || !pEnd) return null;

            const isSelected = selectedWireId === conn.id;
            const wireColor = isSelected ? '#38BDF8' : conn.color || '#22C55E';

            // Multi-point path (Start -> Bend points -> End)
            const pts: number[] = [pStart.x, pStart.y];
            if (conn.bendPoints && conn.bendPoints.length > 0) {
              for (const bp of conn.bendPoints) {
                pts.push(bp.x, bp.y);
              }
            }
            pts.push(pEnd.x, pEnd.y);

            return (
              <Group key={conn.id} onClick={(e) => {
                e.cancelBubble = true;
                onSelectWire(conn.id);
                onSelectComponent(null);
              }}>
                {/* Hit Box / Selection Glow */}
                <Line
                  points={pts}
                  stroke={isSelected ? '#38BDF8' : 'transparent'}
                  strokeWidth={isSelected ? 8 : 14}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.25}
                />
                {/* Main Wire Line */}
                <Line
                  points={pts}
                  stroke={wireColor}
                  strokeWidth={3}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.25}
                  shadowColor={wireColor}
                  shadowBlur={isSelected ? 10 : 3}
                  shadowOpacity={0.6}
                />
                {/* End Terminals */}
                <Circle x={pStart.x} y={pStart.y} radius={3.5} fill={wireColor} />
                <Circle x={pEnd.x} y={pEnd.y} radius={3.5} fill={wireColor} />

                {/* Bend Nodes if selected */}
                {isSelected && conn.bendPoints?.map((bp, i) => (
                  <Circle
                    key={i}
                    x={bp.x}
                    y={bp.y}
                    radius={5}
                    fill="#38BDF8"
                    stroke="#FFFFFF"
                    strokeWidth={1.5}
                  />
                ))}
              </Group>
            );
          })}

          {/* 2. ACTIVE PENDING WIRE BEING ROUTED */}
          {wireStart && (
            <Group>
              <Line
                points={[
                  wireStart.x,
                  wireStart.y,
                  ...wireBends.flatMap((b) => [b.x, b.y]),
                  currentMousePos.x,
                  currentMousePos.y,
                ]}
                stroke={selectedWireColor || '#22C55E'}
                strokeWidth={2.5}
                dash={[6, 4]}
                lineCap="round"
                lineJoin="round"
                tension={0.25}
              />
              <Circle x={currentMousePos.x} y={currentMousePos.y} radius={4} fill={selectedWireColor || '#22C55E'} />
            </Group>
          )}

          {/* 3. HARDWARE COMPONENTS */}
          {circuit.components.map((comp) => renderComponentGraphic(comp))}

          {/* 4. ULTRASONIC SENSOR RADAR CONE IN SIMULATION (Signature TinkerCAD feature!) */}
          {ultrasonicCone && isRunning && (() => {
            const comp = circuit.components.find((c) => c.id === ultrasonicCone.componentId);
            if (!comp) return null;
            const originX = comp.position.x + 85;
            const originY = comp.position.y + 90;
            const radius = Math.min(300, ultrasonicCone.distanceCm * 4);

            return (
              <Group>
                {/* Green Detection Field of View Wedge */}
                <Wedge
                  x={originX}
                  y={originY}
                  radius={radius}
                  angle={55}
                  rotation={comp.rotation ? comp.rotation + 62 : 62}
                  fill="rgba(34, 197, 94, 0.18)"
                  stroke="#22C55E"
                  strokeWidth={1.5}
                />
                {/* Draggable Target Obstacle Ball */}
                <Group
                  x={originX + Math.sin(0) * radius}
                  y={originY + radius}
                  draggable
                  onDragMove={(e) => {
                    const dy = e.target.y() - originY;
                    const newCm = Math.max(2, Math.min(400, Math.round(dy / 4)));
                    setUltrasonicCone({ ...ultrasonicCone, distanceCm: newCm });
                    comp.state.distanceCm = newCm;
                  }}
                >
                  <Circle radius={12} fill="#38BDF8" stroke="#FFFFFF" strokeWidth={2} shadowColor="#38BDF8" shadowBlur={8} />
                  <Text text={`${ultrasonicCone.distanceCm} cm`} x={16} y={-6} fill="#F1E9E4" fontSize={11} fontFamily="IBM Plex Mono" fontStyle="bold" />
                </Group>
              </Group>
            );
          })()}
        </Layer>
      </Stage>

      {/* Canvas Bottom-Left Zoom & Fit Controls (TinkerCAD Toolbar) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 bg-panel/90 backdrop-blur border border-trace rounded p-1 shadow-lg text-white">
        <button
          onClick={() => setScale((s) => Math.min(2.5, s * 1.2))}
          title="Zoom In (+)"
          className="p-1.5 rounded hover:bg-trace transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s / 1.2))}
          title="Zoom Out (-)"
          className="p-1.5 rounded hover:bg-trace transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setScale(1);
            setStagePos({ x: 40, y: 30 });
          }}
          title="Reset View / Fit to Screen"
          className="p-1.5 rounded hover:bg-trace transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Wire Routing Helper Bar */}
      {wireStart && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-20 bg-panel/95 backdrop-blur border border-trace rounded px-3 py-1.5 shadow-xl text-xs font-mono flex items-center gap-2 text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Click on canvas to add <strong>elbow bends</strong> • Click target pin to connect • Esc to cancel</span>
        </div>
      )}
    </div>
  );
};
