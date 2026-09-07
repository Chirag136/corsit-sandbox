import { Circuit } from '../types/circuit';
import { createComponentInstance } from './componentCatalog';

export const OBSTACLE_AVOIDER_CIRCUIT: Circuit = {
  id: 'circuit_obstacle_avoider',
  name: 'Autonomous Obstacle-Avoiding Bot',
  components: [
    {
      ...createComponentInstance('ESP32', 80, 140, 'esp32_1'),
      label: 'ESP32 Controller',
    },
    {
      ...createComponentInstance('UltrasonicSensor', 300, 40, 'ultrasonic_1'),
      label: 'HC-SR04 Front Sensor',
    },
    {
      ...createComponentInstance('MotorDriver', 300, 200, 'driver_1'),
      label: 'L298N Dual H-Bridge',
    },
    {
      ...createComponentInstance('DCMotor', 540, 150, 'motor_left'),
      label: 'Left Drive Motor',
    },
    {
      ...createComponentInstance('DCMotor', 540, 270, 'motor_right'),
      label: 'Right Drive Motor',
    },
  ],
  connections: [
    // Ultrasonic power & signal
    { id: 'w1', from: { componentId: 'esp32_1', pinId: '3V3' }, to: { componentId: 'ultrasonic_1', pinId: 'VCC' }, color: '#C13B3B' },
    { id: 'w2', from: { componentId: 'esp32_1', pinId: 'GND' }, to: { componentId: 'ultrasonic_1', pinId: 'GND' }, color: '#3A2A2E' },
    { id: 'w3', from: { componentId: 'esp32_1', pinId: 'GPIO18' }, to: { componentId: 'ultrasonic_1', pinId: 'TRIG' }, color: '#38BDF8' },
    { id: 'w4', from: { componentId: 'esp32_1', pinId: 'GPIO19' }, to: { componentId: 'ultrasonic_1', pinId: 'ECHO' }, color: '#F59E0B' },

    // Motor driver control inputs from ESP32
    { id: 'w5', from: { componentId: 'esp32_1', pinId: 'GPIO2' }, to: { componentId: 'driver_1', pinId: 'IN1' }, color: '#10B981' },
    { id: 'w6', from: { componentId: 'esp32_1', pinId: 'GPIO4' }, to: { componentId: 'driver_1', pinId: 'IN2' }, color: '#10B981' },
    { id: 'w7', from: { componentId: 'esp32_1', pinId: 'GPIO5' }, to: { componentId: 'driver_1', pinId: 'ENA' }, color: '#EC4899' },
    { id: 'w8', from: { componentId: 'esp32_1', pinId: 'GPIO16' }, to: { componentId: 'driver_1', pinId: 'IN3' }, color: '#A855F7' },
    { id: 'w9', from: { componentId: 'esp32_1', pinId: 'GPIO17' }, to: { componentId: 'driver_1', pinId: 'IN4' }, color: '#A855F7' },
    { id: 'w10', from: { componentId: 'esp32_1', pinId: '3V3' }, to: { componentId: 'driver_1', pinId: 'VCC' }, color: '#C13B3B' },
    { id: 'w11', from: { componentId: 'esp32_1', pinId: 'GND' }, to: { componentId: 'driver_1', pinId: 'GND' }, color: '#3A2A2E' },

    // Driver outputs to motors
    { id: 'w12', from: { componentId: 'driver_1', pinId: 'OUT1' }, to: { componentId: 'motor_left', pinId: 'PLUS' }, color: '#E11D48' },
    { id: 'w13', from: { componentId: 'driver_1', pinId: 'OUT2' }, to: { componentId: 'motor_left', pinId: 'MINUS' }, color: '#1E293B' },
    { id: 'w14', from: { componentId: 'driver_1', pinId: 'OUT3' }, to: { componentId: 'motor_right', pinId: 'PLUS' }, color: '#E11D48' },
    { id: 'w15', from: { componentId: 'driver_1', pinId: 'OUT4' }, to: { componentId: 'motor_right', pinId: 'MINUS' }, color: '#1E293B' },
  ],
  code: `// CorSIT Sandbox - Autonomous Obstacle Avoider Logic
void setup() {
  pinMode(18, OUTPUT); // TRIG
  pinMode(19, INPUT);  // ECHO
  pinMode(2, OUTPUT);  // IN1
  pinMode(4, OUTPUT);  // IN2
  pinMode(5, OUTPUT);  // ENA
  pinMode(16, OUTPUT); // IN3
  pinMode(17, OUTPUT); // IN4
}

void loop() {
  long distance = readUltrasonicCM(18, 19);
  if (distance < 25) {
    // Obstacle detected! Stop & Turn Right
    setMotors(0, 180);
    delay(250);
  } else {
    // Path clear - Drive Forward
    setMotors(200, 200);
  }
}`,
};

export const SWAPPED_PINS_CIRCUIT: Circuit = {
  id: 'circuit_swapped_pins',
  name: 'Wiring Challenge: Swapped TRIG & ECHO',
  components: [
    {
      ...createComponentInstance('ESP32', 80, 140, 'esp32_1'),
      label: 'ESP32 Controller',
    },
    {
      ...createComponentInstance('UltrasonicSensor', 300, 50, 'ultrasonic_1'),
      label: 'HC-SR04 Front Sensor',
    },
    {
      ...createComponentInstance('LED', 340, 220, 'led_1'),
      label: 'Warning Indicator',
    },
  ],
  connections: [
    // Swapped TRIG and ECHO intentional bug for demo!
    { id: 'w1', from: { componentId: 'esp32_1', pinId: '3V3' }, to: { componentId: 'ultrasonic_1', pinId: 'VCC' }, color: '#C13B3B' },
    { id: 'w2', from: { componentId: 'esp32_1', pinId: 'GND' }, to: { componentId: 'ultrasonic_1', pinId: 'GND' }, color: '#3A2A2E' },
    // Swapped: GPIO18 (TRIG) goes to ECHO, GPIO19 (ECHO) goes to TRIG!
    { id: 'w3', from: { componentId: 'esp32_1', pinId: 'GPIO18' }, to: { componentId: 'ultrasonic_1', pinId: 'ECHO' }, color: '#F59E0B' },
    { id: 'w4', from: { componentId: 'esp32_1', pinId: 'GPIO19' }, to: { componentId: 'ultrasonic_1', pinId: 'TRIG' }, color: '#38BDF8' },
    // LED missing current limiting resistor bug
    { id: 'w5', from: { componentId: 'esp32_1', pinId: 'GPIO2' }, to: { componentId: 'led_1', pinId: 'ANODE' }, color: '#10B981' },
    { id: 'w6', from: { componentId: 'esp32_1', pinId: 'GND' }, to: { componentId: 'led_1', pinId: 'CATHODE' }, color: '#3A2A2E' },
  ],
  code: `void setup() {
  pinMode(18, OUTPUT);
  pinMode(19, INPUT);
  pinMode(2, OUTPUT);
}
void loop() {
  long distance = readUltrasonicCM(18, 19);
  digitalWrite(2, distance < 20 ? HIGH : LOW);
}`,
};

export const ARDUINO_LED_CIRCUIT: Circuit = {
  id: 'circuit_arduino_led',
  name: 'Arduino Uno: Turn on Light (LED Blinker)',
  components: [
    {
      ...createComponentInstance('ArduinoUno', 70, 90, 'arduino_1'),
      label: 'Arduino Uno R3',
    },
    {
      ...createComponentInstance('Resistor', 360, 110, 'resistor_1'),
      label: '220Ω Resistor',
    },
    {
      ...createComponentInstance('LED', 510, 80, 'led_1'),
      label: 'Red Diffused LED',
    },
  ],
  connections: [
    // Pin 13 from Arduino to Resistor Terminal 1
    {
      id: 'w_ard_1',
      from: { componentId: 'arduino_1', pinId: 'D13' },
      to: { componentId: 'resistor_1', pinId: 'T1' },
      color: '#22C55E', // Green wire
      bendPoints: [{ x: 260, y: 70 }, { x: 340, y: 70 }],
    },
    // Resistor Terminal 2 to LED Anode
    {
      id: 'w_ard_2',
      from: { componentId: 'resistor_1', pinId: 'T2' },
      to: { componentId: 'led_1', pinId: 'ANODE' },
      color: '#EF4444', // Red wire
    },
    // Arduino GND to LED Cathode
    {
      id: 'w_ard_3',
      from: { componentId: 'arduino_1', pinId: 'GND1' },
      to: { componentId: 'led_1', pinId: 'CATHODE' },
      color: '#1E293B', // Black wire
      bendPoints: [{ x: 240, y: 40 }, { x: 570, y: 40 }],
    },
  ],
  code: `// CorSIT Sandbox — Arduino Uno Light Controller
void setup() {
  pinMode(13, OUTPUT); // Built-in Pin 13
}

void loop() {
  digitalWrite(13, HIGH); // Turn the light ON
  delay(1000);            // Wait 1 second
  digitalWrite(13, LOW);  // Turn the light OFF
  delay(1000);            // Wait 1 second
}`,
};

export const LED_BLINK_CIRCUIT: Circuit = {
  id: 'circuit_led_blink',
  name: 'Phase 1: ESP32 LED Blinker',
  components: [
    {
      ...createComponentInstance('ESP32', 100, 100, 'esp32_1'),
      label: 'ESP32 Controller',
    },
    {
      ...createComponentInstance('Resistor', 320, 130, 'resistor_1'),
      label: '220Ω Resistor',
    },
    {
      ...createComponentInstance('LED', 470, 100, 'led_1'),
      label: 'Red Diffused LED',
    },
  ],
  connections: [
    { id: 'w1', from: { componentId: 'esp32_1', pinId: 'GPIO2' }, to: { componentId: 'resistor_1', pinId: 'T1' }, color: '#10B981' },
    { id: 'w2', from: { componentId: 'resistor_1', pinId: 'T2' }, to: { componentId: 'led_1', pinId: 'ANODE' }, color: '#C13B3B' },
    { id: 'w3', from: { componentId: 'esp32_1', pinId: 'GND' }, to: { componentId: 'led_1', pinId: 'CATHODE' }, color: '#3A2A2E' },
  ],
  code: `void setup() {
  pinMode(2, OUTPUT);
}
void loop() {
  digitalWrite(2, HIGH);
  delay(1000);
  digitalWrite(2, LOW);
  delay(1000);
}`,
};

export const EMPTY_CIRCUIT: Circuit = {
  id: 'circuit_blank',
  name: 'Empty Workbench',
  components: [],
  connections: [],
  code: `void setup() {\n  // Setup code here\n}\nvoid loop() {\n  // Main loop\n}`,
};

export const PRESET_CIRCUITS: Record<string, Circuit> = {
  arduino_led: ARDUINO_LED_CIRCUIT,
  obstacle_avoider: OBSTACLE_AVOIDER_CIRCUIT,
  swapped_challenge: SWAPPED_PINS_CIRCUIT,
  led_blink: LED_BLINK_CIRCUIT,
  blank: EMPTY_CIRCUIT,
};
