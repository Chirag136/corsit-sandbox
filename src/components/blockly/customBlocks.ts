import * as Blockly from 'blockly/core';

// 1. Digital Write Block
Blockly.Blocks['esp32_digital_write'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Digital Write Pin')
      .appendField(
        new Blockly.FieldDropdown([
          ['Pin 13 (Arduino LED)', '13'],
          ['GPIO 2 (IN1 / LED)', '2'],
          ['GPIO 4 (IN2)', '4'],
          ['GPIO 16 (IN3)', '16'],
          ['GPIO 17 (IN4)', '17'],
          ['GPIO 18 (TRIG)', '18'],
        ]),
        'PIN'
      )
      .appendField('to')
      .appendField(
        new Blockly.FieldDropdown([
          ['HIGH (3.3V)', 'HIGH'],
          ['LOW (0V)', 'LOW'],
        ]),
        'STATE'
      );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#7A1B2B');
    this.setTooltip('Set an ESP32 GPIO pin to HIGH or LOW logic state');
  },
};

// 2. PWM / Analog Write Block
Blockly.Blocks['esp32_analog_write'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Set PWM Pin')
      .appendField(
        new Blockly.FieldDropdown([
          ['GPIO 5 (ENA)', '5'],
          ['GPIO 23 (ENB)', '23'],
          ['GPIO 2', '2'],
        ]),
        'PIN'
      )
      .appendField('Speed (0-255)')
      .appendField(new Blockly.FieldNumber(200, 0, 255), 'VALUE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#4B3358');
    this.setTooltip('Output PWM duty cycle to control motor speed or LED brightness');
  },
};

// 3. Read Ultrasonic Sensor Block
Blockly.Blocks['esp32_read_ultrasonic'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Read Ultrasonic Distance (cm)')
      .appendField('TRIG')
      .appendField(
        new Blockly.FieldDropdown([
          ['GPIO 18', '18'],
          ['GPIO 2', '2'],
        ]),
        'TRIG_PIN'
      )
      .appendField('ECHO')
      .appendField(
        new Blockly.FieldDropdown([
          ['GPIO 19', '19'],
          ['GPIO 4', '4'],
        ]),
        'ECHO_PIN'
      );
    this.setOutput(true, 'Number');
    this.setColour('#C13B3B');
    this.setTooltip('Measures distance using HC-SR04 ultrasonic echo pulse');
  },
};

// 4. Drive Motors Command Block
Blockly.Blocks['esp32_drive_motors'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Drive Motors')
      .appendField(
        new Blockly.FieldDropdown([
          ['Forward ⬆️', 'FORWARD'],
          ['Turn Right ➡️', 'RIGHT'],
          ['Turn Left ⬅️', 'LEFT'],
          ['Reverse ⬇️', 'REVERSE'],
          ['Stop 🛑', 'STOP'],
        ]),
        'DIRECTION'
      )
      .appendField('at Speed')
      .appendField(new Blockly.FieldNumber(200, 0, 255), 'SPEED');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6B4A78');
    this.setTooltip('Send coordinated motor commands to L298N driver');
  },
};

// 5. Delay Block
Blockly.Blocks['esp32_delay'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('Wait')
      .appendField(new Blockly.FieldNumber(250, 10, 10000), 'DELAY_MS')
      .appendField('milliseconds');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#241A1F');
    this.setTooltip('Pauses execution for a specified duration');
  },
};

export const COR_TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Robotics & Motors',
      colour: '#6B4A78',
      contents: [
        { kind: 'block', type: 'esp32_drive_motors' },
        { kind: 'block', type: 'esp32_analog_write' },
        { kind: 'block', type: 'esp32_digital_write' },
      ],
    },
    {
      kind: 'category',
      name: 'Sensors',
      colour: '#C13B3B',
      contents: [{ kind: 'block', type: 'esp32_read_ultrasonic' }],
    },
    {
      kind: 'category',
      name: 'Logic & Control',
      colour: '#7A1B2B',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'esp32_delay' },
      ],
    },
  ],
};
