import { Component, ComponentType, Pin } from '../types/circuit';

export interface CatalogItem {
  type: ComponentType;
  name: string;
  category: 'Basic' | 'Microcontrollers' | 'Sensors' | 'Actuators';
  description: string;
  defaultPins: Pin[];
  defaultState: Record<string, number | string | boolean>;
  width: number;
  height: number;
}

// Generate realistic breadboard pins (Half-size breadboard: 30 columns x 10 rows + power rails)
function generateBreadboardPins(): Pin[] {
  const pins: Pin[] = [];
  const startX = 40;
  const colSpacing = 14;

  // Power rails Top: + and -
  for (let c = 1; c <= 30; c++) {
    const x = startX + (c - 1) * colSpacing;
    pins.push({ id: `p_plus_${c}`, kind: 'power', value: 'HIGH', label: '+', relX: x, relY: 18 });
    pins.push({ id: `p_minus_${c}`, kind: 'ground', value: 'LOW', label: '-', relX: x, relY: 34 });
  }

  // Row a-e (top terminal strip)
  const rowsTop = ['a', 'b', 'c', 'd', 'e'];
  rowsTop.forEach((r, rIdx) => {
    for (let c = 1; c <= 30; c++) {
      const x = startX + (c - 1) * colSpacing;
      const y = 60 + rIdx * 14;
      pins.push({ id: `bb_${c}${r}`, kind: 'analog', value: 'LOW', label: `${c}${r}`, relX: x, relY: y });
    }
  });

  // Row f-j (bottom terminal strip)
  const rowsBottom = ['f', 'g', 'h', 'i', 'j'];
  rowsBottom.forEach((r, rIdx) => {
    for (let c = 1; c <= 30; c++) {
      const x = startX + (c - 1) * colSpacing;
      const y = 160 + rIdx * 14;
      pins.push({ id: `bb_${c}${r}`, kind: 'analog', value: 'LOW', label: `${c}${r}`, relX: x, relY: y });
    }
  });

  // Power rails Bottom: + and -
  for (let c = 1; c <= 30; c++) {
    const x = startX + (c - 1) * colSpacing;
    pins.push({ id: `pb_plus_${c}`, kind: 'power', value: 'HIGH', label: '+', relX: x, relY: 250 });
    pins.push({ id: `pb_minus_${c}`, kind: 'ground', value: 'LOW', label: '-', relX: x, relY: 266 });
  }

  return pins;
}

export const COMPONENT_CATALOG: Record<ComponentType, CatalogItem> = {
  ArduinoUno: {
    type: 'ArduinoUno',
    name: 'Arduino Uno R3',
    category: 'Microcontrollers',
    description: 'ATmega328P-based microcontroller board with 14 digital I/O pins, 6 analog inputs, and USB interface.',
    width: 240,
    height: 180,
    defaultPins: [
      // Top Digital Header (left to right: AREF, GND, D13 down to D0)
      { id: 'AREF', kind: 'analog', value: 'LOW', label: 'AREF', relX: 85, relY: 18 },
      { id: 'GND1', kind: 'ground', value: 'LOW', label: 'GND', relX: 97, relY: 18 },
      { id: 'D13', kind: 'digital', value: 'LOW', label: '13', relX: 109, relY: 18 },
      { id: 'D12', kind: 'digital', value: 'LOW', label: '12', relX: 121, relY: 18 },
      { id: 'D11', kind: 'pwm', value: 0, label: '~11', relX: 133, relY: 18 },
      { id: 'D10', kind: 'pwm', value: 0, label: '~10', relX: 145, relY: 18 },
      { id: 'D9', kind: 'pwm', value: 0, label: '~9', relX: 157, relY: 18 },
      { id: 'D8', kind: 'digital', value: 'LOW', label: '8', relX: 169, relY: 18 },
      { id: 'D7', kind: 'digital', value: 'LOW', label: '7', relX: 185, relY: 18 },
      { id: 'D6', kind: 'pwm', value: 0, label: '~6', relX: 197, relY: 18 },
      { id: 'D5', kind: 'pwm', value: 0, label: '~5', relX: 209, relY: 18 },
      { id: 'D4', kind: 'digital', value: 'LOW', label: '4', relX: 221, relY: 18 },
      { id: 'D3', kind: 'pwm', value: 0, label: '~3', relX: 233, relY: 18 },
      { id: 'D2', kind: 'digital', value: 'LOW', label: '2', relX: 245, relY: 18 },
      { id: 'D1', kind: 'digital', value: 'LOW', label: '1 (TX)', relX: 257, relY: 18 },
      { id: 'D0', kind: 'digital', value: 'LOW', label: '0 (RX)', relX: 269, relY: 18 },

      // Bottom Power Header
      { id: 'IOREF', kind: 'power', value: 'HIGH', label: 'IOREF', relX: 105, relY: 162 },
      { id: 'RESET', kind: 'digital', value: 'HIGH', label: 'RESET', relX: 117, relY: 162 },
      { id: '3V3', kind: 'power', value: 'HIGH', label: '3.3V', relX: 129, relY: 162 },
      { id: '5V', kind: 'power', value: 'HIGH', label: '5V', relX: 141, relY: 162 },
      { id: 'GND2', kind: 'ground', value: 'LOW', label: 'GND', relX: 153, relY: 162 },
      { id: 'GND3', kind: 'ground', value: 'LOW', label: 'GND', relX: 165, relY: 162 },
      { id: 'VIN', kind: 'power', value: 'HIGH', label: 'VIN', relX: 177, relY: 162 },

      // Bottom Analog Header
      { id: 'A0', kind: 'analog', value: 0, label: 'A0', relX: 195, relY: 162 },
      { id: 'A1', kind: 'analog', value: 0, label: 'A1', relX: 207, relY: 162 },
      { id: 'A2', kind: 'analog', value: 0, label: 'A2', relX: 219, relY: 162 },
      { id: 'A3', kind: 'analog', value: 0, label: 'A3', relX: 231, relY: 162 },
      { id: 'A4', kind: 'analog', value: 0, label: 'A4', relX: 243, relY: 162 },
      { id: 'A5', kind: 'analog', value: 0, label: 'A5', relX: 255, relY: 162 },
    ],
    defaultState: { running: false, pin13Led: false },
  },

  Breadboard: {
    type: 'Breadboard',
    name: 'Breadboard Small',
    category: 'Basic',
    description: 'Half-size solderless breadboard with dual power distribution rails and 30 terminal rows.',
    width: 480,
    height: 290,
    defaultPins: generateBreadboardPins(),
    defaultState: {},
  },

  ESP32: {
    type: 'ESP32',
    name: 'ESP32 NodeMCU',
    category: 'Microcontrollers',
    description: '32-bit Dual-Core Tensilica Xtensa microcontroller with Wi-Fi, Bluetooth, and hardware PWM.',
    width: 170,
    height: 250,
    defaultPins: [
      { id: '3V3', kind: 'power', value: 'HIGH', label: '3V3', relX: 18, relY: 36 },
      { id: 'GND', kind: 'ground', value: 'LOW', label: 'GND', relX: 18, relY: 58 },
      { id: 'GPIO2', kind: 'digital', value: 'LOW', label: 'D2 (IN1)', relX: 18, relY: 80 },
      { id: 'GPIO4', kind: 'digital', value: 'LOW', label: 'D4 (IN2)', relX: 18, relY: 102 },
      { id: 'GPIO5', kind: 'pwm', value: 0, label: 'D5 (ENA)', relX: 18, relY: 124 },
      { id: 'GPIO16', kind: 'digital', value: 'LOW', label: 'D16 (IN3)', relX: 152, relY: 80 },
      { id: 'GPIO17', kind: 'digital', value: 'LOW', label: 'D17 (IN4)', relX: 152, relY: 102 },
      { id: 'GPIO18', kind: 'digital', value: 'LOW', label: 'D18 (TRIG)', relX: 152, relY: 124 },
      { id: 'GPIO19', kind: 'digital', value: 'LOW', label: 'D19 (ECHO)', relX: 152, relY: 146 },
    ],
    defaultState: { running: false, log: '' },
  },

  UltrasonicSensor: {
    type: 'UltrasonicSensor',
    name: 'Ultrasonic Sensor (HC-SR04)',
    category: 'Sensors',
    description: 'Non-contact sonic distance measurement module with dual transducers (2cm - 400cm).',
    width: 170,
    height: 95,
    defaultPins: [
      { id: 'VCC', kind: 'power', value: 'HIGH', label: 'VCC', relX: 35, relY: 86 },
      { id: 'TRIG', kind: 'digital', value: 'LOW', label: 'TRIG', relX: 68, relY: 86 },
      { id: 'ECHO', kind: 'digital', value: 'LOW', label: 'ECHO', relX: 102, relY: 86 },
      { id: 'GND', kind: 'ground', value: 'LOW', label: 'GND', relX: 135, relY: 86 },
    ],
    defaultState: { distanceCm: 400, testTargetDistance: 45, showCone: false },
  },

  MotorDriver: {
    type: 'MotorDriver',
    name: 'L298N Dual Motor Driver',
    category: 'Actuators',
    description: 'High-power H-Bridge driver with aluminum heatsink for 2 DC motors.',
    width: 190,
    height: 160,
    defaultPins: [
      { id: 'VCC', kind: 'power', value: 'HIGH', label: '12V/VCC', relX: 22, relY: 146 },
      { id: 'GND', kind: 'ground', value: 'LOW', label: 'GND', relX: 46, relY: 146 },
      { id: 'ENA', kind: 'pwm', value: 0, label: 'ENA', relX: 70, relY: 146 },
      { id: 'IN1', kind: 'digital', value: 'LOW', label: 'IN1', relX: 94, relY: 146 },
      { id: 'IN2', kind: 'digital', value: 'LOW', label: 'IN2', relX: 118, relY: 146 },
      { id: 'IN3', kind: 'digital', value: 'LOW', label: 'IN3', relX: 142, relY: 146 },
      { id: 'IN4', kind: 'digital', value: 'LOW', label: 'IN4', relX: 166, relY: 146 },
      { id: 'OUT1', kind: 'power', value: 'LOW', label: 'OUT1', relX: 12, relY: 45 },
      { id: 'OUT2', kind: 'power', value: 'LOW', label: 'OUT2', relX: 12, relY: 70 },
      { id: 'OUT3', kind: 'power', value: 'LOW', label: 'OUT3', relX: 178, relY: 45 },
      { id: 'OUT4', kind: 'power', value: 'LOW', label: 'OUT4', relX: 178, relY: 70 },
    ],
    defaultState: { speedLeft: 0, speedRight: 0, dirLeft: 'STOP', dirRight: 'STOP' },
  },

  DCMotor: {
    type: 'DCMotor',
    name: 'Hobby Gearmotor',
    category: 'Actuators',
    description: 'TT yellow hobby gearbox motor with drive wheel.',
    width: 140,
    height: 85,
    defaultPins: [
      { id: 'PLUS', kind: 'power', value: 'LOW', label: '+', relX: 20, relY: 42 },
      { id: 'MINUS', kind: 'ground', value: 'LOW', label: '-', relX: 120, relY: 42 },
    ],
    defaultState: { speed: 0, rpm: 0, direction: 'STOP' },
  },

  LED: {
    type: 'LED',
    name: 'LED (5mm)',
    category: 'Basic',
    description: 'Light emitting diode with polarized anode and cathode terminals.',
    width: 70,
    height: 105,
    defaultPins: [
      { id: 'ANODE', kind: 'power', value: 'LOW', label: 'Anode (+)', relX: 24, relY: 96 },
      { id: 'CATHODE', kind: 'ground', value: 'LOW', label: 'Cathode (-)', relX: 46, relY: 96 },
    ],
    defaultState: { isOn: false, color: '#C13B3B', hasBlown: false },
  },

  Resistor: {
    type: 'Resistor',
    name: 'Resistor',
    category: 'Basic',
    description: 'Through-hole passive resistor with colored 4-band multiplier rings.',
    width: 110,
    height: 45,
    defaultPins: [
      { id: 'T1', kind: 'analog', value: 'LOW', label: 'Terminal 1', relX: 8, relY: 22 },
      { id: 'T2', kind: 'analog', value: 'LOW', label: 'Terminal 2', relX: 102, relY: 22 },
    ],
    defaultState: { resistance: 220, unit: 'Ω' },
  },

  Pushbutton: {
    type: 'Pushbutton',
    name: 'Pushbutton',
    category: 'Basic',
    description: 'Momentary SPST tactile pushbutton.',
    width: 70,
    height: 70,
    defaultPins: [
      { id: 'T1a', kind: 'digital', value: 'LOW', label: 'Terminal 1a', relX: 12, relY: 15 },
      { id: 'T1b', kind: 'digital', value: 'LOW', label: 'Terminal 1b', relX: 58, relY: 15 },
      { id: 'T2a', kind: 'digital', value: 'LOW', label: 'Terminal 2a', relX: 12, relY: 55 },
      { id: 'T2b', kind: 'digital', value: 'LOW', label: 'Terminal 2b', relX: 58, relY: 55 },
    ],
    defaultState: { isPressed: false },
  },

  Potentiometer: {
    type: 'Potentiometer',
    name: 'Potentiometer',
    category: 'Basic',
    description: 'Variable 10kΩ rotary resistor with center wiper terminal.',
    width: 80,
    height: 80,
    defaultPins: [
      { id: 'T1', kind: 'power', value: 'HIGH', label: 'Terminal 1', relX: 15, relY: 68 },
      { id: 'WIPER', kind: 'analog', value: 512, label: 'Wiper', relX: 40, relY: 68 },
      { id: 'T2', kind: 'ground', value: 'LOW', label: 'Terminal 2', relX: 65, relY: 68 },
    ],
    defaultState: { value: 512, rotationDeg: 0 },
  },
};

export function createComponentInstance(
  type: ComponentType,
  x: number,
  y: number,
  customId?: string
): Component {
  const item = COMPONENT_CATALOG[type];
  const uniqueId = customId || `${type.toLowerCase()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: uniqueId,
    type,
    label: item.name,
    position: { x, y },
    rotation: 0,
    pins: item.defaultPins.map((p) => ({ ...p, value: p.value })),
    state: { ...item.defaultState },
  };
}
