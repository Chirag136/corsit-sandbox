import * as Blockly from 'blockly/core';

// Custom Arduino C++ Generator
export class ArduinoGenerator extends Blockly.Generator {
  constructor() {
    super('Arduino');
    this.addReservedWords(
      'setup,loop,if,else,for,switch,case,while,do,return,break,continue,void,int,long,float,double,char,boolean,byte,unsigned,const,digitalWrite,digitalRead,analogWrite,analogRead,pinMode,delay,delayMicroseconds,pulseIn'
    );
  }

  scrub_(block: Blockly.Block, code: string, _opt_thisOnly?: boolean): string {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    let nextCode = '';
    if (nextBlock) {
      nextCode = this.blockToCode(nextBlock) as string;
    }
    return code + nextCode;
  }
}

export const arduinoGenerator = new ArduinoGenerator();

// Define generator logic for custom blocks
arduinoGenerator.forBlock['esp32_digital_write'] = function (block: Blockly.Block) {
  const pin = block.getFieldValue('PIN');
  const state = block.getFieldValue('STATE');
  return `  digitalWrite(${pin}, ${state});\n`;
};

arduinoGenerator.forBlock['esp32_analog_write'] = function (block: Blockly.Block) {
  const pin = block.getFieldValue('PIN');
  const value = block.getFieldValue('VALUE');
  return `  analogWrite(${pin}, ${value});\n`;
};

arduinoGenerator.forBlock['esp32_read_ultrasonic'] = function (block: Blockly.Block) {
  const trig = block.getFieldValue('TRIG_PIN');
  const echo = block.getFieldValue('ECHO_PIN');
  return [`readUltrasonicCM(${trig}, ${echo})`, 0];
};

arduinoGenerator.forBlock['esp32_drive_motors'] = function (block: Blockly.Block) {
  const dir = block.getFieldValue('DIRECTION');
  const speed = block.getFieldValue('SPEED');

  switch (dir) {
    case 'FORWARD':
      return `  // Move Forward\n  setMotors(${speed}, ${speed});\n`;
    case 'RIGHT':
      return `  // Pivot Right\n  setMotors(-${speed}, ${speed});\n`;
    case 'LEFT':
      return `  // Pivot Left\n  setMotors(${speed}, -${speed});\n`;
    case 'REVERSE':
      return `  // Reverse\n  setMotors(-${speed}, -${speed});\n`;
    case 'STOP':
    default:
      return `  // Stop Motors\n  setMotors(0, 0);\n`;
  }
};

arduinoGenerator.forBlock['esp32_delay'] = function (block: Blockly.Block) {
  const delayMs = block.getFieldValue('DELAY_MS');
  return `  delay(${delayMs});\n`;
};

arduinoGenerator.forBlock['math_number'] = function (block: Blockly.Block) {
  const num = block.getFieldValue('NUM');
  return [num, 0];
};

arduinoGenerator.forBlock['logic_compare'] = function (block: Blockly.Block) {
  const op = block.getFieldValue('OP');
  const order = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const argument0 = (arduinoGenerator as any).valueToCode(block, 'A', order) || '0';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const argument1 = (arduinoGenerator as any).valueToCode(block, 'B', order) || '0';

  const operators: Record<string, string> = {
    EQ: '==',
    NEQ: '!=',
    LT: '<',
    LTE: '<=',
    GT: '>',
    GTE: '>=',
  };
  const code = `${argument0} ${operators[op] || '=='} ${argument1}`;
  return [code, order];
};

arduinoGenerator.forBlock['controls_if'] = function (block: Blockly.Block) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const condition = (arduinoGenerator as any).valueToCode(block, 'IF0', 0) || 'false';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const branch = (arduinoGenerator as any).statementToCode(block, 'DO0') || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elseBranch = (arduinoGenerator as any).statementToCode(block, 'ELSE') || '';

  let code = `  if (${condition}) {\n${branch}  }`;
  if (elseBranch) {
    code += ` else {\n${elseBranch}  }\n`;
  } else {
    code += '\n';
  }
  return code;
};

export function generateFullArduinoSketch(bodyCode: string): string {
  return `/**
 * CorSIT Sandbox — Flashable Arduino / ESP32 C++ Code
 * Generated automatically from visual logic blocks
 * Target: ESP32 Dev Module / NodeMCU-32S
 */

#include <Arduino.h>

// --- Pin Allocations ---
#define PIN_TRIG   18   // Ultrasonic Trigger
#define PIN_ECHO   19   // Ultrasonic Echo
#define PIN_IN1    2    // Motor Driver Left IN1
#define PIN_IN2    4    // Motor Driver Left IN2
#define PIN_ENA    5    // Motor Driver Left Speed (PWM)
#define PIN_IN3    16   // Motor Driver Right IN3
#define PIN_IN4    17   // Motor Driver Right IN4
#define PIN_ENB    23   // Motor Driver Right Speed (PWM)

// --- Helper Functions ---
long readUltrasonicCM(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH, 26000); // 26ms timeout (~400cm max)
  if (duration == 0) return 400; // Clear path
  return duration * 0.034 / 2;
}

void setMotors(int speedLeft, int speedRight) {
  // Left Motor Direction & Speed
  if (speedLeft > 0) {
    digitalWrite(PIN_IN1, HIGH);
    digitalWrite(PIN_IN2, LOW);
    analogWrite(PIN_ENA, speedLeft);
  } else if (speedLeft < 0) {
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, HIGH);
    analogWrite(PIN_ENA, -speedLeft);
  } else {
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, LOW);
    analogWrite(PIN_ENA, 0);
  }

  // Right Motor Direction & Speed
  if (speedRight > 0) {
    digitalWrite(PIN_IN3, HIGH);
    digitalWrite(PIN_IN4, LOW);
    analogWrite(PIN_ENB, speedRight);
  } else if (speedRight < 0) {
    digitalWrite(PIN_IN3, LOW);
    digitalWrite(PIN_IN4, HIGH);
    analogWrite(PIN_ENB, -speedRight);
  } else {
    digitalWrite(PIN_IN3, LOW);
    digitalWrite(PIN_IN4, LOW);
    analogWrite(PIN_ENB, 0);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("CorSIT Autonomous Bot Initialized.");

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_ENB, OUTPUT);

  setMotors(0, 0);
  delay(1000); // Sensor stabilization
}

void loop() {
${bodyCode}
}
`;
}
