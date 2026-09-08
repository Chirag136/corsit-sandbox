import { Circuit, Component, Connection } from '../types/circuit';
import { Obstacle, RobotState } from '../types/simulation';
import { castRay } from './raycaster';

export interface SimulationStepResult {
  circuit: Circuit;
  robot: RobotState;
}

export class SimulationEngine {
  private circuit: Circuit;
  private robot: RobotState;
  private obstacles: Obstacle[];
  private arenaWidth: number;
  private arenaHeight: number;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private onUpdateCallback?: (result: SimulationStepResult) => void;

  constructor(
    initialCircuit: Circuit,
    arenaWidth: number = 600,
    arenaHeight: number = 420
  ) {
    this.circuit = JSON.parse(JSON.stringify(initialCircuit));
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    this.obstacles = [
      { id: 'obs_1', x: 260, y: 80, width: 80, height: 80, label: 'Block A' },
      { id: 'obs_2', x: 140, y: 240, width: 100, height: 60, label: 'Wall B' },
      { id: 'obs_3', x: 380, y: 230, width: 70, height: 100, label: 'Pillar C' },
    ];

    this.robot = {
      x: 100,
      y: 100,
      heading: 0, // facing right
      width: 44,
      length: 56,
      speedLeft: 0,
      speedRight: 0,
      sensorRangeCm: 400,
      detectedDistanceCm: 400,
      sensorRayEnd: { x: 500, y: 100 },
      pathHistory: [{ x: 100, y: 100 }],
      isColliding: false,
    };
  }

  public setCircuit(newCircuit: Circuit) {
    this.circuit = JSON.parse(JSON.stringify(newCircuit));
  }

  public getCircuit(): Circuit {
    return this.circuit;
  }

  public getRobot(): RobotState {
    return this.robot;
  }

  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  public setObstacles(obstacles: Obstacle[]) {
    this.obstacles = obstacles;
  }

  public resetRobot(x = 100, y = 100, heading = 0) {
    this.robot = {
      ...this.robot,
      x,
      y,
      heading,
      speedLeft: 0,
      speedRight: 0,
      detectedDistanceCm: 400,
      pathHistory: [{ x, y }],
      isColliding: false,
    };
  }

  public setRobotPosition(x: number, y: number) {
    this.robot.x = x;
    this.robot.y = y;
    this.robot.pathHistory = [{ x, y }];
  }

  public start(callback: (result: SimulationStepResult) => void) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onUpdateCallback = callback;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // clamp dt to 100ms
      lastTime = currentTime;

      this.step(dt);

      if (this.onUpdateCallback) {
        this.onUpdateCallback({
          circuit: this.circuit,
          robot: this.robot,
        });
      }

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public step(dt: number = 0.016) {
    // 1. Ray-cast from front of robot to find current distance
    const frontSensorOffset = this.robot.length / 2;
    const sensorOrigin = {
      x: this.robot.x + Math.cos(this.robot.heading) * frontSensorOffset,
      y: this.robot.y + Math.sin(this.robot.heading) * frontSensorOffset,
    };

    const maxRayPx = (this.robot.sensorRangeCm * 2); // 2px per cm
    const hit = castRay(
      sensorOrigin,
      this.robot.heading,
      maxRayPx,
      this.obstacles,
      this.arenaWidth,
      this.arenaHeight
    );

    this.robot.detectedDistanceCm = hit.distanceCm;
    this.robot.sensorRayEnd = hit.point;

    // 2. Feed distance into Ultrasonic sensor components
    for (const comp of this.circuit.components) {
      if (comp.type === 'UltrasonicSensor') {
        comp.state = {
          ...comp.state,
          distanceCm: hit.distanceCm,
        };
      }
    }

    // 3. Evaluate ESP32 and Arduino Uno Control Logic
    this.evaluateControlLogic(hit.distanceCm);
    this.evaluateArduinoLogic(dt);

    // 4. Propagate signals across connections
    this.propagateSignals();

    // 5. Update actuators & passive components
    this.updateComponents();

    // 6. Kinematic physics update for Robot
    this.updateRobotKinematics(dt);
  }

  private elapsedTime: number = 0;

  private evaluateArduinoLogic(dt: number) {
    this.elapsedTime += dt;
    const arduinos = this.circuit.components.filter((c) => c.type === 'ArduinoUno');
    if (arduinos.length === 0) return;

    const code = this.circuit.code || '';
    const hasHigh13 = /digitalWrite\s*\(\s*(?:13|D13)\s*,\s*HIGH\s*\)/i.test(code);
    const hasLow13 = /digitalWrite\s*\(\s*(?:13|D13)\s*,\s*LOW\s*\)/i.test(code);

    let isHigh = true;
    if (hasHigh13 && hasLow13) {
      // Blink with custom delay
      const delayMatch = code.match(/delay\s*\(\s*(\d+)\s*\)/i);
      const delayMs = delayMatch ? Math.max(50, parseInt(delayMatch[1], 10)) : 1000;
      const periodSec = (delayMs * 2) / 1000;
      isHigh = (this.elapsedTime % periodSec) < (periodSec / 2);
    } else if (hasHigh13) {
      // Solid ON
      isHigh = true;
    } else if (hasLow13) {
      // Solid OFF
      isHigh = false;
    } else {
      // Default blink
      isHigh = (this.elapsedTime % 2.0) < 1.0;
    }

    const pinVal = isHigh ? 'HIGH' : 'LOW';

    for (const ard of arduinos) {
      const d13 = ard.pins.find((p) => p.id === 'D13');
      if (d13) d13.value = pinVal;

      const fiveV = ard.pins.find((p) => p.id === '5V');
      if (fiveV) fiveV.value = 'HIGH';

      const threeV = ard.pins.find((p) => p.id === '3V3');
      if (threeV) threeV.value = 'HIGH';

      const gnd1 = ard.pins.find((p) => p.id === 'GND1');
      if (gnd1) gnd1.value = 'LOW';
      const gnd2 = ard.pins.find((p) => p.id === 'GND2');
      if (gnd2) gnd2.value = 'LOW';
      const gnd3 = ard.pins.find((p) => p.id === 'GND3');
      if (gnd3) gnd3.value = 'LOW';

      ard.state = {
        ...ard.state,
        running: true,
        pin13Led: isHigh,
      };
    }
  }

  private evaluateControlLogic(distanceCm: number) {
    const esp32 = this.circuit.components.find((c) => c.type === 'ESP32');
    if (!esp32) return;

    // Check if ultrasonic is properly wired
    const usSensor = this.circuit.components.find((c) => c.type === 'UltrasonicSensor');
    const isUsWired = usSensor && this.isProperlyWired(usSensor, esp32);

    const setPin = (pinId: string, val: 'HIGH' | 'LOW' | number) => {
      const pin = esp32.pins.find((p) => p.id === pinId);
      if (pin) pin.value = val;
    };

    if (isUsWired) {
      // Reactive autonomous obstacle avoidance logic:
      if (distanceCm < 28) {
        // Obstacle imminent! Turn right sharply
        setPin('GPIO2', 'LOW');
        setPin('GPIO4', 'HIGH'); // reverse left wheel
        setPin('GPIO5', 180);
        setPin('GPIO16', 'HIGH'); // forward right wheel
        setPin('GPIO17', 'LOW');
      } else {
        // Clear forward cruising
        setPin('GPIO2', 'HIGH');
        setPin('GPIO4', 'LOW');
        setPin('GPIO5', 210);
        setPin('GPIO16', 'HIGH');
        setPin('GPIO17', 'LOW');
      }
    } else {
      // If ultrasonic is disconnected or swapped, motors stay idle or bot can't see
      setPin('GPIO5', 0);
    }
  }

  private isProperlyWired(usSensor: Component, esp32: Component): boolean {
    const hasVcc = this.circuit.connections.some(
      (c) =>
        (c.from.componentId === usSensor.id && c.from.pinId === 'VCC' && c.to.componentId === esp32.id && c.to.pinId === '3V3') ||
        (c.to.componentId === usSensor.id && c.to.pinId === 'VCC' && c.from.componentId === esp32.id && c.from.pinId === '3V3')
    );
    const hasGnd = this.circuit.connections.some(
      (c) =>
        (c.from.componentId === usSensor.id && c.from.pinId === 'GND' && c.to.componentId === esp32.id && c.to.pinId === 'GND') ||
        (c.to.componentId === usSensor.id && c.to.pinId === 'GND' && c.from.componentId === esp32.id && c.from.pinId === 'GND')
    );
    const hasTrig = this.circuit.connections.some(
      (c) =>
        (c.from.componentId === usSensor.id && c.from.pinId === 'TRIG' && c.to.componentId === esp32.id && c.to.pinId === 'GPIO18') ||
        (c.to.componentId === usSensor.id && c.to.pinId === 'TRIG' && c.from.componentId === esp32.id && c.from.pinId === 'GPIO18')
    );
    const hasEcho = this.circuit.connections.some(
      (c) =>
        (c.from.componentId === usSensor.id && c.from.pinId === 'ECHO' && c.to.componentId === esp32.id && c.to.pinId === 'GPIO19') ||
        (c.to.componentId === usSensor.id && c.to.pinId === 'ECHO' && c.from.componentId === esp32.id && c.from.pinId === 'GPIO19')
    );

    return !!(hasVcc && hasGnd && hasTrig && hasEcho);
  }

  private isPinGrounded(compGuid: string, pinId: string): boolean {
    for (const conn of this.circuit.connections) {
      const isFrom = conn.from.componentId === compGuid && conn.from.pinId === pinId;
      const isTo = conn.to.componentId === compGuid && conn.to.pinId === pinId;
      if (!isFrom && !isTo) continue;

      const other = isFrom ? conn.to : conn.from;
      const otherComp = this.circuit.components.find((c) => c.id === other.componentId);
      const otherPin = otherComp?.pins.find((p) => p.id === other.pinId);

      if (
        otherPin?.kind === 'ground' ||
        otherPin?.id.startsWith('GND') ||
        otherPin?.id.includes('minus') ||
        otherPin?.id.startsWith('p_minus_') ||
        otherPin?.id.startsWith('pb_minus_') ||
        otherPin?.label === '-'
      ) {
        return true;
      }
    }
    return false;
  }

  private propagateSignals() {
    // 1. Reset passive component and actuator input pins to 'LOW' so turned-off outputs immediately clear
    for (const comp of this.circuit.components) {
      if (comp.type === 'LED' || comp.type === 'Resistor' || comp.type === 'Breadboard') {
        for (const pin of comp.pins) {
          pin.value = 'LOW';
        }
      } else if (comp.type === 'MotorDriver') {
        // Reset control input pins
        for (const pin of comp.pins) {
          if (pin.id === 'IN1' || pin.id === 'IN2' || pin.id === 'IN3' || pin.id === 'IN4') {
            pin.value = 'LOW';
          } else if (pin.id === 'ENA' || pin.id === 'ENB') {
            pin.value = 0;
          }
        }
      }
    }

    // 2. Multi-pass forward propagation from driver sources (MCU, Motor driver outputs, etc.)
    for (let pass = 0; pass < 3; pass++) {
      // A. Resistor internal bridge: if one terminal is HIGH, the other is HIGH
      for (const res of this.circuit.components.filter((c) => c.type === 'Resistor')) {
        const t1 = res.pins.find((p) => p.id === 'T1');
        const t2 = res.pins.find((p) => p.id === 'T2');
        if (t1 && t2) {
          if (t1.value === 'HIGH') t2.value = 'HIGH';
          else if (t2.value === 'HIGH') t1.value = 'HIGH';
        }
      }

      // B. Breadboard internal rail & terminal strip buses
      for (const bb of this.circuit.components.filter((c) => c.type === 'Breadboard')) {
        // Group columns 1..30 top rows (a-e) and bottom rows (f-j)
        for (let col = 1; col <= 30; col++) {
          const topRows = ['a', 'b', 'c', 'd', 'e'].map((r) => bb.pins.find((p) => p.id === `bb_${col}${r}`)).filter(Boolean);
          const topHasHigh = topRows.some((p) => p?.value === 'HIGH' || (typeof p?.value === 'number' && p.value > 0));
          if (topHasHigh) {
            topRows.forEach((p) => { if (p) p.value = 'HIGH'; });
          }

          const botRows = ['f', 'g', 'h', 'i', 'j'].map((r) => bb.pins.find((p) => p.id === `bb_${col}${r}`)).filter(Boolean);
          const botHasHigh = botRows.some((p) => p?.value === 'HIGH' || (typeof p?.value === 'number' && p.value > 0));
          if (botHasHigh) {
            botRows.forEach((p) => { if (p) p.value = 'HIGH'; });
          }
        }

        // Top & bottom power rails (+ and -)
        const topPlus = bb.pins.filter((p) => p.id.startsWith('p_plus_'));
        if (topPlus.some((p) => p.value === 'HIGH')) {
          topPlus.forEach((p) => (p.value = 'HIGH'));
        }
        const botPlus = bb.pins.filter((p) => p.id.startsWith('pb_plus_'));
        if (botPlus.some((p) => p.value === 'HIGH')) {
          botPlus.forEach((p) => (p.value = 'HIGH'));
        }
      }

      // C. Pushbutton momentary bridge (connects T1a/T1b to T2a/T2b when isPressed)
      for (const pb of this.circuit.components.filter((c) => c.type === 'Pushbutton')) {
        if (pb.state.isPressed) {
          const t1a = pb.pins.find((p) => p.id === 'T1a');
          const t1b = pb.pins.find((p) => p.id === 'T1b');
          const t2a = pb.pins.find((p) => p.id === 'T2a');
          const t2b = pb.pins.find((p) => p.id === 'T2b');
          const isHigh = [t1a, t1b, t2a, t2b].some((p) => p?.value === 'HIGH' || (typeof p?.value === 'number' && p.value > 0));
          if (isHigh) {
            if (t1a) t1a.value = 'HIGH';
            if (t1b) t1b.value = 'HIGH';
            if (t2a) t2a.value = 'HIGH';
            if (t2b) t2b.value = 'HIGH';
          }
        }
      }

      // D. Wire connection propagation
      for (const conn of this.circuit.connections) {
        const fromComp = this.circuit.components.find((c) => c.id === conn.from.componentId);
        const toComp = this.circuit.components.find((c) => c.id === conn.to.componentId);
        if (!fromComp || !toComp) continue;

        const fromPin = fromComp.pins.find((p) => p.id === conn.from.pinId);
        const toPin = toComp.pins.find((p) => p.id === conn.to.pinId);
        if (!fromPin || !toPin) continue;

        const fromIsMcu = fromComp.type === 'ESP32' || fromComp.type === 'ArduinoUno';
        const toIsMcu = toComp.type === 'ESP32' || toComp.type === 'ArduinoUno';

        if (fromIsMcu && !toIsMcu) {
          // MCU output directly controls destination pin
          toPin.value = fromPin.value;
        } else if (toIsMcu && !fromIsMcu) {
          // Input to MCU
          toPin.value = fromPin.value;
        } else {
          const fromIsActive = fromPin.value === 'HIGH' || (typeof fromPin.value === 'number' && fromPin.value > 0);
          const toIsActive = toPin.value === 'HIGH' || (typeof toPin.value === 'number' && toPin.value > 0);

          if (fromIsActive && !toIsActive) {
            toPin.value = fromPin.value;
          } else if (toIsActive && !fromIsActive) {
            const toIsSource = toPin.kind === 'power';
            if (toIsSource) {
              fromPin.value = toPin.value;
            }
          }
        }
      }
    }
  }

  private updateComponents() {
    // 1. Motor Driver (L298N)
    const drivers = this.circuit.components.filter((c) => c.type === 'MotorDriver');
    for (const driver of drivers) {
      const in1 = driver.pins.find((p) => p.id === 'IN1')?.value;
      const in2 = driver.pins.find((p) => p.id === 'IN2')?.value;
      const in3 = driver.pins.find((p) => p.id === 'IN3')?.value;
      const in4 = driver.pins.find((p) => p.id === 'IN4')?.value;
      const ena = Number(driver.pins.find((p) => p.id === 'ENA')?.value) || 200;

      let speedL = 0;
      if (in1 === 'HIGH' && in2 === 'LOW') speedL = ena;
      else if (in1 === 'LOW' && in2 === 'HIGH') speedL = -ena;

      let speedR = 0;
      if (in3 === 'HIGH' && in4 === 'LOW') speedR = ena;
      else if (in3 === 'LOW' && in4 === 'HIGH') speedR = -ena;

      driver.state = {
        ...driver.state,
        speedLeft: speedL,
        speedRight: speedR,
        dirLeft: speedL > 0 ? 'FWD' : speedL < 0 ? 'REV' : 'STOP',
        dirRight: speedR > 0 ? 'FWD' : speedR < 0 ? 'REV' : 'STOP',
      };

      // Set robot wheel speeds from driver
      this.robot.speedLeft = speedL;
      this.robot.speedRight = speedR;
    }

    // 2. DC Motors
    const motors = this.circuit.components.filter((c) => c.type === 'DCMotor');
    for (const motor of motors) {
      const isLeft = motor.id.includes('left') || motor.label?.toLowerCase().includes('left');
      const targetSpeed = isLeft ? this.robot.speedLeft : this.robot.speedRight;
      motor.state = {
        ...motor.state,
        speed: targetSpeed,
        rpm: Math.round(targetSpeed * 1.5),
        direction: targetSpeed > 0 ? 'FWD' : targetSpeed < 0 ? 'REV' : 'STOP',
      };
    }

    // 3. LEDs (True dynamic ON / OFF state!)
    const leds = this.circuit.components.filter((c) => c.type === 'LED');
    for (const led of leds) {
      const anode = led.pins.find((p) => p.id === 'ANODE')?.value;
      const isAnodeHigh = anode === 'HIGH' || (typeof anode === 'number' && anode > 0);
      const isCathodeGrounded = this.isPinGrounded(led.id, 'CATHODE');

      const isOn = isAnodeHigh && isCathodeGrounded;
      led.state = {
        ...led.state,
        isOn,
        brightness: isOn ? 1 : 0,
      };
    }
  }

  private updateRobotKinematics(dt: number) {
    const W = 40; // effective wheelbase in canvas pixels
    const speedScale = 0.45; // scale PWM to px/sec

    const vL = this.robot.speedLeft * speedScale;
    const vR = this.robot.speedRight * speedScale;

    const vLinear = (vL + vR) / 2;
    const omega = (vR - vL) / W; // rad/sec

    const newHeading = this.robot.heading + omega * dt;
    const newX = this.robot.x + vLinear * Math.cos(newHeading) * dt;
    const newY = this.robot.y + vLinear * Math.sin(newHeading) * dt;

    // Check collision against arena boundaries
    const halfW = this.robot.width / 2;
    const halfL = this.robot.length / 2;
    const margin = Math.max(halfW, halfL);

    let clampedX = Math.max(margin, Math.min(this.arenaWidth - margin, newX));
    let clampedY = Math.max(margin, Math.min(this.arenaHeight - margin, newY));
    let colliding = clampedX !== newX || clampedY !== newY;

    // Check collision against obstacles
    for (const obs of this.obstacles) {
      if (
        clampedX + halfW > obs.x &&
        clampedX - halfW < obs.x + obs.width &&
        clampedY + halfL > obs.y &&
        clampedY - halfL < obs.y + obs.height
      ) {
        colliding = true;
        // halt or push back
        clampedX = this.robot.x;
        clampedY = this.robot.y;
        break;
      }
    }

    this.robot.x = clampedX;
    this.robot.y = clampedY;
    this.robot.heading = newHeading;
    this.robot.isColliding = colliding;

    // Path trail tracking
    const lastPoint = this.robot.pathHistory[this.robot.pathHistory.length - 1];
    if (
      !lastPoint ||
      Math.hypot(lastPoint.x - clampedX, lastPoint.y - clampedY) > 8
    ) {
      this.robot.pathHistory.push({ x: clampedX, y: clampedY });
      if (this.robot.pathHistory.length > 80) {
        this.robot.pathHistory.shift();
      }
    }
  }
}
