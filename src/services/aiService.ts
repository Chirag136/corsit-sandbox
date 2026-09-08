import { Circuit, CircuitError } from '../types/circuit';
import { AutoWireResult, CircuitExplanation, CodeDebugResult, WiringCheckResult } from '../types/ai';
import { validateCircuit } from '../engine/circuitValidator';
import {
  OBSTACLE_AVOIDER_CIRCUIT,
  LED_BLINK_CIRCUIT,
  SWAPPED_PINS_CIRCUIT,
  ARDUINO_LED_CIRCUIT,
} from '../data/presetCircuits';

export interface AiConfig {
  apiKey?: string;
  provider: 'mock' | 'claude' | 'gemini' | 'openai';
  model?: string;
  apiEndpoint?: string;
}

class AiService {
  private config: AiConfig = {
    provider: 'mock',
    apiKey: '',
  };

  public setConfig(config: Partial<AiConfig>) {
    this.config = { ...this.config, ...config };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('corsit_ai_config', JSON.stringify(this.config));
      }
    } catch {}
  }

  public getConfig(): AiConfig {
    try {
      if (typeof window !== 'undefined' && window.localStorage && !this.config.apiKey) {
        const saved = window.localStorage.getItem('corsit_ai_config');
        if (saved) {
          this.config = { ...this.config, ...JSON.parse(saved) };
        }
      }
    } catch {}
    return this.config;
  }

  private async callLlm(prompt: string, systemInstruction: string): Promise<string | null> {
    const cfg = this.getConfig();
    if (!cfg.apiKey) return null;

    if (cfg.provider === 'gemini') {
      const model = cfg.model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nUser query:\n${prompt}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }

    if (cfg.provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: cfg.model || 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          system: systemInstruction,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await response.json();
      return data.content?.[0]?.text || null;
    }

    if (cfg.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    }

    return null;
  }

  /**
   * 1. Wiring Error Detector
   */
  public async checkWiring(circuit: Circuit): Promise<WiringCheckResult> {
    // Run rule-based validator first
    const ruleErrors = validateCircuit(circuit);

    // If live API key is available, augment with LLM
    if (this.config.apiKey) {
      try {
        const content = await this.callLlm(
          JSON.stringify(circuit),
          'You are a master robotics & electrical engineering professor. Given this circuit JSON, identify any electrical issues (short circuits, missing resistors, polarity reversals, inverted lines, missing grounds) and return a JSON object with format: { "errors": [ { "componentId": string, "issue": string, "explanation": string, "suggestedFix": string } ] }'
        );
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
            return {
              hasErrors: true,
              errors: parsed.errors,
              timestamp: new Date().toLocaleTimeString(),
            };
          }
        }
      } catch (err) {
        console.warn('Live LLM inspection skipped, using high-speed rule engine:', err);
      }
    }

    // Default fast deterministic result
    return {
      hasErrors: ruleErrors.length > 0,
      errors: ruleErrors,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  /**
   * 2. Circuit Explainer
   */
  public async explainCircuit(circuit: Circuit): Promise<CircuitExplanation> {
    const componentTypes = circuit.components.map((c) => c.type);

    if (this.config.apiKey) {
      try {
        const content = await this.callLlm(
          JSON.stringify({ components: circuit.components.map(c => ({ id: c.id, type: c.type, label: c.label })), connectionsCount: circuit.connections.length }),
          'You are an expert embedded systems and robotics educator. Explain the given circuit in clear plain English. Return JSON with format: { "summary": string, "architecture": string, "signalFlow": string[] }'
        );
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.summary && parsed.architecture && Array.isArray(parsed.signalFlow)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Live LLM explain failed, falling back to rule templates:', err);
      }
    }

    const hasArduino = componentTypes.includes('ArduinoUno');
    const hasEsp32 = componentTypes.includes('ESP32');
    const hasUltrasonic = componentTypes.includes('UltrasonicSensor');
    const hasMotorDriver = componentTypes.includes('MotorDriver');
    const hasMotors = componentTypes.includes('DCMotor');
    const hasLed = componentTypes.includes('LED');

    if (hasArduino && hasLed) {
      return {
        summary:
          'This is the iconic Arduino Uno light controller circuit. The ATmega328P microcontroller commands Digital Pin 13 to output 5V, driving current through a 220Ω current-limiting resistor to illuminate the external LED while lighting the onboard "L" status indicator in sync.',
        architecture: 'Microcontroller (Arduino Uno R3) ➔ Current Limiter (220Ω) ➔ Luminous Diode (LED) ➔ Arduino Ground (GND)',
        signalFlow: [
          'Arduino Uno Digital Pin 13 switches to 5V (HIGH) under firmware control.',
          'Built-in surface-mount yellow "L" LED on the board illuminates simultaneously.',
          '220Ω resistor prevents overcurrent, maintaining safe forward current (~15mA).',
          'Current excites the gallium phosphide LED die, emitting bright red light.',
          'Cathode returns current to Arduino GND1 completing the closed loop.',
        ],
      };
    }

    if (hasEsp32 && hasUltrasonic && hasMotorDriver && hasMotors) {
      return {
        summary:
          'This is a closed-loop autonomous obstacle-avoiding mobile robot. The ESP32 acts as the central brain, reading distance measurements from the HC-SR04 ultrasonic sensor and commanding a dual H-bridge motor driver to steer the chassis away from collisions.',
        architecture:
          'Sensor Input (HC-SR04) ➔ Microcontroller Logic (ESP32) ➔ Power Amplification (L298N) ➔ Mechanical Drive (DC Motors)',
        signalFlow: [
          'HC-SR04 TRIG pin receives high pulses from ESP32 GPIO18, emitting 40kHz ultrasonic burst.',
          'ECHO pin returns pulse duration proportional to distance to ESP32 GPIO19.',
          'ESP32 control loop calculates distance in cm. If < 25cm, it flags an impending collision.',
          'GPIO2 & GPIO4 set direction for the Left Motor, while GPIO16 & GPIO17 control Right Motor.',
          'GPIO5 provides PWM speed control to L298N ENA, allowing differential turns to dodge obstacles.',
        ],
      };
    }

    if (hasEsp32 && hasLed) {
      return {
        summary:
          'This is a classic embedded systems indicator circuit. The ESP32 microcontroller toggles a digital GPIO pin HIGH (3.3V) and LOW (0V) through a current-limiting resistor to illuminate the LED safely.',
        architecture: 'Microcontroller (ESP32) ➔ Current Limiter (220Ω) ➔ Luminous Emitter (LED) ➔ Common Ground',
        signalFlow: [
          'ESP32 GPIO2 outputs 3.3V logic high during active cycle.',
          '220Ω resistor limits the forward current to approximately 10mA, protecting the LED junction.',
          'LED anode receives current and drops ~2.0V forward voltage, illuminating the red die.',
          'Current returns to ESP32 GND rail completing the circuit.',
        ],
      };
    }

    return {
      summary: `A custom modular circuit featuring ${circuit.components.length} components (${componentTypes.join(
        ', '
      )}) and ${circuit.connections.length} point-to-point connections on the CorSIT workbench.`,
      architecture: 'Modular Embedded Architecture',
      signalFlow: [
        `Contains ${circuit.components.length} components interconnected via ${circuit.connections.length} traces.`,
        'Power and signals propagate across nodes based on microcontroller logic rules.',
      ],
    };
  }

  /**
   * 3. Natural Language -> Auto-Wire
   */
  public async autoWireFromPrompt(promptText: string): Promise<AutoWireResult> {
    const query = promptText.toLowerCase().trim();

    if (query.includes('arduino')) {
      return {
        success: true,
        circuit: JSON.parse(JSON.stringify(ARDUINO_LED_CIRCUIT)),
        explanation:
          'Synthesized Arduino Uno Light Controller: ATmega328P Digital Pin 13 routed through a 220Ω protective resistor to the Red LED Anode, with Cathode tied to Arduino Ground.',
      };
    }

    if (
      query.includes('obstacle') ||
      query.includes('bot') ||
      query.includes('robot') ||
      query.includes('car') ||
      query.includes('avoid') ||
      query.includes('rover')
    ) {
      return {
        success: true,
        circuit: JSON.parse(JSON.stringify(OBSTACLE_AVOIDER_CIRCUIT)),
        explanation:
          'Generated complete autonomous obstacle-avoiding bot: ESP32 + HC-SR04 Ultrasonic Sensor + L298N Dual Motor Driver + 2 TT DC Motors with all power, ground, and control signal wires routed.',
      };
    }

    if (query.includes('blink') || query.includes('led') || query.includes('light')) {
      return {
        success: true,
        circuit: JSON.parse(JSON.stringify(LED_BLINK_CIRCUIT)),
        explanation:
          'Generated LED indicator circuit: ESP32 GPIO2 connected through a 220Ω protective resistor to the Red LED Anode, with Cathode grounded.',
      };
    }

    if (query.includes('swap') || query.includes('bug') || query.includes('challenge') || query.includes('error')) {
      return {
        success: true,
        circuit: JSON.parse(JSON.stringify(SWAPPED_PINS_CIRCUIT)),
        explanation:
          'Generated diagnostic challenge circuit with intentionally inverted TRIG/ECHO lines and an unballasted LED for testing AI debugging.',
      };
    }

    // Default fallback to full robot bot
    return {
      success: true,
      circuit: JSON.parse(JSON.stringify(OBSTACLE_AVOIDER_CIRCUIT)),
      explanation:
        'Matched closest robotics blueprint: Autonomous Obstacle-Avoiding Bot with ESP32, L298N, HC-SR04, and DC Motors.',
    };
  }

  /**
   * 4. Code Helper / Debugger
   */
  public async debugCode(code: string, issueDescription: string): Promise<CodeDebugResult> {
    if (this.config.apiKey) {
      try {
        const content = await this.callLlm(
          `Code:\n${code}\n\nIssue reported:\n${issueDescription}`,
          'You are an expert embedded C++ firmware engineer. Diagnose bugs in the user\'s Arduino/ESP32 code. Return JSON with format: { "analysis": string, "suggestions": string[], "correctedCode": string }'
        );
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.analysis && Array.isArray(parsed.suggestions)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Live LLM debug failed, using default diagnostics:', err);
      }
    }

    return {
      analysis: `Examined Arduino C++ control routine against report: "${issueDescription}". The logic reads ultrasonic pulse time and triggers differential wheel steering.`,
      suggestions: [
        'Verify ultrasonic timeout: pulseIn(echoPin, HIGH, 30000) prevents blocking if the pulse doesn\'t return.',
        'Check motor driver logic: ensure ENA pin has analogWrite() or ledcWrite() > 150 to overcome motor stall torque.',
        'Ensure both motor channels share a common ground with the ESP32 to prevent floating logic levels.',
      ],
      correctedCode: `// Optimized Obstacle Avoidance Loop with non-blocking timeout
long readUltrasonicCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 26000); // 26ms max timeout (~4.5m)
  if (duration == 0) return 400; // no echo returned = clear path
  return duration * 0.034 / 2;
}

void loop() {
  long distance = readUltrasonicCM(18, 19);
  if (distance < 25) {
    // Sharp pivot right
    setMotors(-160, 180);
    delay(200);
  } else {
    // Forward cruise
    setMotors(200, 200);
  }
}`,
    };
  }
}

export const aiService = new AiService();
