export type ComponentType =
  | 'ArduinoUno'
  | 'ESP32'
  | 'Breadboard'
  | 'LED'
  | 'Resistor'
  | 'DCMotor'
  | 'MotorDriver'
  | 'UltrasonicSensor'
  | 'Pushbutton'
  | 'Potentiometer';

export type PinKind = 'digital' | 'analog' | 'pwm' | 'power' | 'ground';
export type PinValue = number | 'HIGH' | 'LOW';

export interface Pin {
  id: string; // e.g. "GPIO2", "anode", "VCC"
  kind: PinKind;
  value: PinValue;
  label?: string;
  relX?: number; // relative coordinate on component graphic
  relY?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Component {
  id: string;
  type: ComponentType;
  position: Point;
  rotation?: number; // in degrees (0, 90, 180, 270)
  pins: Pin[];
  state: Record<string, number | string | boolean>;
  label?: string;
}

export interface Connection {
  id: string;
  from: { componentId: string; pinId: string };
  to: { componentId: string; pinId: string };
  color?: string;
  bendPoints?: Point[]; // TinkerCAD elbow bend points
}

export interface Circuit {
  id: string;
  name: string;
  components: Component[];
  connections: Connection[];
  code: string;
}

export interface CircuitError {
  componentId: string;
  issue: string;
  explanation: string;
  suggestedFix: string;
}
