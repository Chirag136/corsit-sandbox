import { Circuit, CircuitError, Component, Connection } from '../types/circuit';

export function validateCircuit(circuit: Circuit): CircuitError[] {
  const errors: CircuitError[] = [];
  const { components, connections } = circuit;

  if (components.length === 0) return [];

  // Helper to find connections involving a specific pin
  const getConnectionsForPin = (componentId: string, pinId: string): Connection[] => {
    return connections.filter(
      (c) =>
        (c.from.componentId === componentId && c.from.pinId === pinId) ||
        (c.to.componentId === componentId && c.to.pinId === pinId)
    );
  };

  const getConnectedTarget = (componentId: string, pinId: string) => {
    const conn = connections.find(
      (c) =>
        (c.from.componentId === componentId && c.from.pinId === pinId) ||
        (c.to.componentId === componentId && c.to.pinId === pinId)
    );
    if (!conn) return null;
    return conn.from.componentId === componentId ? conn.to : conn.from;
  };

  // 1. Check for Power Short Circuits (3V3/VCC wired directly to GND)
  for (const conn of connections) {
    const fromComp = components.find((c) => c.id === conn.from.componentId);
    const toComp = components.find((c) => c.id === conn.to.componentId);
    if (fromComp && toComp) {
      const fromPin = fromComp.pins.find((p) => p.id === conn.from.pinId);
      const toPin = toComp.pins.find((p) => p.id === conn.to.pinId);
      if (fromPin && toPin) {
        if (
          (fromPin.kind === 'power' && toPin.kind === 'ground') ||
          (fromPin.kind === 'ground' && toPin.kind === 'power')
        ) {
          errors.push({
            componentId: fromComp.id,
            issue: 'Short Circuit Detected',
            explanation: `Pin ${fromPin.id} (${fromPin.kind}) is wired directly to ${toComp.label}'s ${toPin.id} (${toPin.kind}).`,
            suggestedFix: 'Disconnect the power rail from ground immediately to prevent hardware damage.',
          });
        }
      }
    }
  }

  // 2. Validate Ultrasonic Sensors (HC-SR04)
  const ultrasonics = components.filter((c) => c.type === 'UltrasonicSensor');
  for (const us of ultrasonics) {
    const vccConns = getConnectionsForPin(us.id, 'VCC');
    const gndConns = getConnectionsForPin(us.id, 'GND');
    const trigTarget = getConnectedTarget(us.id, 'TRIG');
    const echoTarget = getConnectedTarget(us.id, 'ECHO');

    if (vccConns.length === 0) {
      errors.push({
        componentId: us.id,
        issue: 'Ultrasonic VCC Disconnected',
        explanation: 'HC-SR04 requires 3.3V or 5V power supply to pulse ultrasonic transducers.',
        suggestedFix: 'Wire VCC on HC-SR04 to 3V3 on the ESP32.',
      });
    }

    if (gndConns.length === 0) {
      errors.push({
        componentId: us.id,
        issue: 'Ultrasonic GND Disconnected',
        explanation: 'HC-SR04 must share a common ground reference with the microcontroller.',
        suggestedFix: 'Wire GND on HC-SR04 to GND on the ESP32.',
      });
    }

    // Check TRIG & ECHO swapping (e.g. TRIG wired to GPIO19 while ECHO wired to GPIO18 or swapped)
    if (trigTarget && echoTarget) {
      if (
        (trigTarget.pinId === 'GPIO19' && echoTarget.pinId === 'GPIO18') ||
        (trigTarget.pinId.toLowerCase().includes('echo')) ||
        (echoTarget.pinId.toLowerCase().includes('trig'))
      ) {
        errors.push({
          componentId: us.id,
          issue: 'TRIG and ECHO Pins Swapped',
          explanation: 'TRIG is an output trigger that must receive high pulses from the MCU (GPIO18), while ECHO is an input return pulse pin (GPIO19). Currently, the wires are inverted.',
          suggestedFix: 'Swap the wires: connect GPIO18 to TRIG, and GPIO19 to ECHO.',
        });
      }
    } else {
      if (!trigTarget) {
        errors.push({
          componentId: us.id,
          issue: 'TRIG Pin Disconnected',
          explanation: 'HC-SR04 TRIG pin has no trigger signal connection from the microcontroller.',
          suggestedFix: 'Wire TRIG to GPIO18 on the ESP32.',
        });
      }
      if (!echoTarget) {
        errors.push({
          componentId: us.id,
          issue: 'ECHO Pin Disconnected',
          explanation: 'HC-SR04 ECHO pin has no return connection to measure ultrasonic pulse travel time.',
          suggestedFix: 'Wire ECHO to GPIO19 on the ESP32.',
        });
      }
    }
  }

  // 3. Validate LEDs
  const leds = components.filter((c) => c.type === 'LED');
  for (const led of leds) {
    const anodeTarget = getConnectedTarget(led.id, 'ANODE');
    const cathodeTarget = getConnectedTarget(led.id, 'CATHODE');

    if (!anodeTarget && !cathodeTarget) {
      errors.push({
        componentId: led.id,
        issue: 'LED Unconnected',
        explanation: 'LED is placed on the canvas but neither Anode nor Cathode is wired.',
        suggestedFix: 'Connect Anode via a 220Ω resistor to a GPIO pin and Cathode to GND.',
      });
      continue;
    }

    // Check missing current-limiting resistor:
    // If anode is wired directly to a GPIO or 3V3 without a Resistor component
    if (anodeTarget) {
      const targetComp = components.find((c) => c.id === anodeTarget.componentId);
      if (targetComp && targetComp.type !== 'Resistor' && (anodeTarget.pinId.startsWith('GPIO') || anodeTarget.pinId === '3V3')) {
        errors.push({
          componentId: led.id,
          issue: 'Missing Current-Limiting Resistor',
          explanation: 'Connecting an LED Anode directly to ESP32 3.3V or GPIO causes over-current (>40mA) and will burn out the LED or damage the GPIO pad.',
          suggestedFix: 'Insert a 220Ω Resistor in series between the GPIO pin and the LED Anode.',
        });
      }
    }

    // Check reversed polarity: Anode to GND or Cathode to 3V3
    if (anodeTarget && anodeTarget.pinId === 'GND') {
      errors.push({
        componentId: led.id,
        issue: 'Reversed LED Polarity',
        explanation: 'The Anode (positive terminal) is connected to Ground (GND). An LED is a diode and will not conduct in reverse bias.',
        suggestedFix: 'Connect the Anode to positive voltage/GPIO and Cathode to Ground.',
      });
    }
  }

  // 4. Validate Motor Driver (L298N)
  const drivers = components.filter((c) => c.type === 'MotorDriver');
  for (const driver of drivers) {
    const vccConns = getConnectionsForPin(driver.id, 'VCC');
    const gndConns = getConnectionsForPin(driver.id, 'GND');
    const in1 = getConnectedTarget(driver.id, 'IN1');
    const in2 = getConnectedTarget(driver.id, 'IN2');

    if (vccConns.length === 0) {
      errors.push({
        componentId: driver.id,
        issue: 'L298N VCC Not Powered',
        explanation: 'The H-Bridge driver requires logic/motor supply power to switch MOSFETs/Darlingtons.',
        suggestedFix: 'Connect L298N VCC to the 3V3/5V power rail.',
      });
    }

    if (gndConns.length === 0) {
      errors.push({
        componentId: driver.id,
        issue: 'L298N Common Ground Missing',
        explanation: 'Driver ground must be bonded to the microcontroller ground for common logic reference.',
        suggestedFix: 'Connect L298N GND to the ESP32 GND pin.',
      });
    }

    if (!in1 || !in2) {
      errors.push({
        componentId: driver.id,
        issue: 'Motor Direction Pins Disconnected',
        explanation: 'IN1 and IN2 define the H-Bridge polarity for Motor Channel A.',
        suggestedFix: 'Connect IN1 to GPIO2 and IN2 to GPIO4.',
      });
    }

    // Check if motors are connected to OUT1/OUT2
    const out1 = getConnectedTarget(driver.id, 'OUT1');
    const out2 = getConnectedTarget(driver.id, 'OUT2');
    if (!out1 || !out2) {
      errors.push({
        componentId: driver.id,
        issue: 'Motor Left Not Connected',
        explanation: 'OUT1 and OUT2 have no motor connected.',
        suggestedFix: 'Connect OUT1 and OUT2 to the Left DC Motor terminals.',
      });
    }
  }

  return errors;
}
