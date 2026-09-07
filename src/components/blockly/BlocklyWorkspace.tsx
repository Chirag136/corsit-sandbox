import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import { COR_TOOLBOX } from './customBlocks';
import { arduinoGenerator, generateFullArduinoSketch } from './arduinoGenerator';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface BlocklyWorkspaceProps {
  onCodeChange: (code: string) => void;
}

export const BlocklyWorkspace: React.FC<BlocklyWorkspaceProps> = ({ onCodeChange }) => {
  const blocklyDiv = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!blocklyDiv.current) return;

    let workspace: Blockly.WorkspaceSvg | null = null;

    try {
      // Define dark theme safely if not already defined
      let theme: any = undefined;
      try {
        if ((Blockly as any).registry?.hasItem((Blockly as any).registry.Type.THEME, 'corsit_dark')) {
          theme = (Blockly as any).registry.getItem((Blockly as any).registry.Type.THEME, 'corsit_dark');
        } else if (Blockly.Theme?.defineTheme) {
          theme = Blockly.Theme.defineTheme('corsit_dark', {
            name: 'corsit_dark',
            base: (Blockly.Themes as any)?.Classic || undefined,
            componentStyles: {
              workspaceBackgroundColour: '#160F14',
              toolboxBackgroundColour: '#1D1418',
              toolboxForegroundColour: '#F1E9E4',
              flyoutBackgroundColour: '#1D1418',
              flyoutForegroundColour: '#F1E9E4',
              flyoutOpacity: 0.95,
              scrollbarColour: '#3A2A2E',
              scrollbarOpacity: 0.8,
              insertionMarkerColour: '#C13B3B',
              insertionMarkerOpacity: 0.5,
            },
          });
        }
      } catch (themeErr) {
        console.warn('Blockly theme registration skipped:', themeErr);
      }

      // Inject Blockly Workspace with fallbacks
      workspace = Blockly.inject(blocklyDiv.current, {
        toolbox: COR_TOOLBOX,
        scrollbars: true,
        trashcan: true,
        grid: {
          spacing: 20,
          length: 3,
          colour: '#2A1F25',
          snap: true,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 0.85,
          maxScale: 2,
          minScale: 0.4,
          scaleSpeed: 1.15,
        },
        theme: theme || undefined,
      });

      workspaceRef.current = workspace;

      // Load initial obstacle-avoiding block tree
      const defaultXml = `
        <xml xmlns="https://developers.google.com/blockly/xml">
          <block type="controls_if" x="30" y="30">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">LT</field>
                <value name="A">
                  <block type="esp32_read_ultrasonic">
                    <field name="TRIG_PIN">18</field>
                    <field name="ECHO_PIN">19</field>
                  </block>
                </value>
                <value name="B">
                  <block type="math_number">
                    <field name="NUM">25</field>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="esp32_drive_motors">
                <field name="DIRECTION">RIGHT</field>
                <field name="SPEED">180</field>
                <next>
                  <block type="esp32_delay">
                    <field name="DELAY_MS">250</field>
                  </block>
                </next>
              </block>
            </statement>
            <next>
              <block type="esp32_drive_motors">
                <field name="DIRECTION">FORWARD</field>
                <field name="SPEED">200</field>
              </block>
            </next>
          </block>
        </xml>
      `;

      try {
        const dom = Blockly.utils.xml.textToDom(defaultXml);
        Blockly.Xml.domToWorkspace(dom, workspace);
      } catch (xmlErr) {
        console.warn('Default XML parse warning:', xmlErr);
      }

      // Code generator listener
      const handleChange = () => {
        if (!workspace) return;
        try {
          const bodyCode = arduinoGenerator.workspaceToCode(workspace);
          const fullSketch = generateFullArduinoSketch(bodyCode);
          onCodeChange(fullSketch);
        } catch (err) {
          console.error('Error generating Arduino code:', err);
        }
      };

      workspace.addChangeListener(handleChange);
      handleChange();

      // Trigger resize after DOM layout completes
      setTimeout(() => {
        if (workspace) {
          Blockly.svgResize(workspace);
        }
      }, 100);

      // ResizeObserver to keep Blockly responsive when drawer slides
      const resizeObserver = new ResizeObserver(() => {
        if (workspace) {
          Blockly.svgResize(workspace);
        }
      });
      resizeObserver.observe(blocklyDiv.current);

      return () => {
        resizeObserver.disconnect();
        if (workspace) {
          workspace.dispose();
        }
      };
    } catch (err: any) {
      console.error('Blockly injection error:', err);
      setLoadError(err?.message || 'Failed to initialize Blockly');
    }
  }, [onCodeChange]);

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-panel text-center text-white">
        <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
        <h4 className="text-sm font-bold font-mono">Visual Block Editor Notice</h4>
        <p className="text-xs text-muted max-w-sm mt-1 mb-4">
          {loadError}. You can still view, edit, and export the full Arduino C++ code directly in Text mode.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-panel-2 hover:bg-trace border border-trace rounded text-xs font-mono text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Editor</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#160F14] overflow-hidden">
      <div className="px-3 py-1.5 bg-panel-2 border-b border-trace flex items-center justify-between text-xs flex-shrink-0 select-none">
        <span className="text-white font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red shadow-glow-red"></span>
          Visual Logic Canvas
        </span>
        <span className="text-muted text-[11px] font-mono">Blocks auto-compile to Arduino C++</span>
      </div>
      <div
        ref={blocklyDiv}
        className="w-full flex-1 min-h-[300px]"
        style={{ width: '100%', height: 'calc(100% - 32px)' }}
      />
    </div>
  );
};
