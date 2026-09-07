# CorSIT Sandbox — Browser-Based Circuit & Robotics Simulator

![CorSIT Sandbox Logo](public/corsit-logo-transparent.png)

A browser-based, TinkerCAD-style circuit and robotics simulator created for **CorSIT (Robotics Club of Siddaganga Institute of Technology)**.

Users drag-and-drop components (ESP32, HC-SR04 ultrasonic sensors, L298N motor drivers, DC motors, LEDs, resistors), wire them together on an interactive PCB canvas, program autonomous control logic using **Google Blockly**, and observe a live simulation — including a differential-drive robot avoiding obstacles in a 2D arena powered by real-time ray-casting. An integrated AI layer detects wiring mistakes, explains circuit topology, auto-wires from natural language, and assists in code debugging.

---

## 🚀 Key Features

1. **Interactive Workbench Canvas (Konva.js)**
   - Drag-and-drop chips: ESP32 DevKit, HC-SR04 Ultrasonic Sensor, L298N Dual H-Bridge Driver, Geared DC Motors, LEDs, and Resistors.
   - Intelligent snap-to-pin wiring with color-coded signal/power traces (Red for 3.3V/VCC, Dark Trace for GND, Pink for PWM, Cyan for ultrasonic signals).
   - Dynamic pin voltage states and component indicators (motor RPM, LED glow).

2. **Visual Logic & Flashable Arduino C++ Export (Google Blockly)**
   - Custom robotics blocks: `Read Ultrasonic Distance (cm)`, `Drive Motors (Forward, Turn Right, Turn Left, Reverse, Stop)`, `Set PWM Pin`, `Digital Write Pin`, `Wait milliseconds`.
   - Dual-engine code compiler that generates **production-ready, flashable ESP32/Arduino C++ firmware** (`.ino`) with `#define` pin mappings, ultrasonic pulse timer, and H-bridge motor drivers.

3. **2D Real-Time Physics & Arena Simulation**
   - Differential drive kinematics: $v = (v_L + v_R)/2$, $\omega = (v_R - v_L)/W$.
   - Real-time ray-casting from the front sensor cone calculating obstacle hit distance in centimeters.
   - Boundary wall collision resolution and path history trail.
   - Interactive obstacles: add obstacle boxes, drag them, and reset robot position.

4. **CorSIT AI Layer (Claude Sonnet & Rule Engine)**
   - **Wiring Error Detector**: Identifies swapped TRIG/ECHO pins, floating inputs, missing current-limiting resistors on LEDs, reversed diodes, and short circuits. Renders inline `--red` alert badges on affected components on the canvas!
   - **Circuit Explainer**: Explains circuit architecture, component roles, and signal propagation flow in plain English.
   - **Natural Language Auto-Wire**: Type `"build me an obstacle-avoiding bot"` or `"blink an LED"` into the top prompt bar to automatically generate and wire full circuits.
   - **Code Helper / Debugger**: Analyzes behavior anomalies and suggests firmware adjustments.

5. **CorSIT Design System**
   - High-contrast wine/near-black theme: `--base: #120C11`, `--panel: #1D1418`, `--panel-2: #241A1F`, `--maroon: #7A1B2B`, `--red: #C13B3B`, `--plum: #4B3358`.
   - Space Grotesk for technical headlines, IBM Plex Mono for pin labels, telemetry readouts, and code.
   - Hero glowing aperture ring behind the "O" in COR on the CorSIT logo.

---

## 🎬 Pitch Demo Walkthrough

1. **Workbench Overview**: Launch app at `http://localhost:5173`. Observe the dark CorSIT aesthetic and glowing logo aperture ring.
2. **Auto-Wire via AI**: Select "Empty Workbench" or type `"build me an obstacle-avoiding bot"` into the top AI prompt box and click **Auto-Wire**. The full ESP32 + HC-SR04 + L298N + 2 Motors circuit spawns properly wired.
3. **Simulate Wiring Error**: Switch preset to *"Wiring Bug Challenge (TRIG/ECHO)"* or manually delete a wire. Click **Check Circuit**. Notice the inline `--red` alert flag on the ultrasonic sensor and the AI drawer explaining why inverted pins prevent pulse timing.
4. **Live Simulation**: Switch back to the Obstacle-Avoiding Bot and click **RUN SIM**. Watch the robot traverse the 2D arena, emit raycast beams, sense obstacles, and pivot away before collision!
5. **Circuit Explanation**: Click **Explain** to review the architecture and signal pipeline.
6. **Code Export**: Click **Export C++** to inspect the real Arduino C++ code and download `corsit_bot_sketch.ino`.

---

## 🛠️ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the frontend development server
npm run dev

# 3. (Optional) Run the backend AI proxy server
npm run server
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
