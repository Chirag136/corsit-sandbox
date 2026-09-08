import React, { useState, useEffect, useRef } from 'react';
import { Circuit, CircuitError, ComponentType, Connection } from '../../types/circuit';
import { RobotState, Obstacle } from '../../types/simulation';
import { CircuitExplanation } from '../../types/ai';
import { OBSTACLE_AVOIDER_CIRCUIT, PRESET_CIRCUITS, EMPTY_CIRCUIT } from '../../data/presetCircuits';
import { TRACK_PRESETS } from '../../data/trackPresets';
import { createComponentInstance } from '../../data/componentCatalog';
import { SimulationEngine } from '../../engine/simulationEngine';
import { aiService } from '../../services/aiService';

import { TinkerNav } from '../../components/tinkercad/TinkerNav';
import { ComponentDrawer } from '../../components/tinkercad/ComponentDrawer';
import { TinkerCanvas } from '../../components/tinkercad/TinkerCanvas';
import { CodeDrawer } from '../../components/tinkercad/CodeDrawer';
import { TinkerAiModal } from '../../components/tinkercad/TinkerAiModal';
import { ArenaModal } from '../../components/tinkercad/ArenaModal';
import { CodeExportModal } from '../../components/panels/CodeExportModal';

import { Bot } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavedProject, storageService } from '../../services/storageService';

interface WorkspaceProps {
  initialProject: SavedProject | null;
  currentUser: { username: string };
  onSaveAndExit: (project: SavedProject) => void;
}

export function Workspace({ initialProject, currentUser, onSaveAndExit }: WorkspaceProps) {
  const [projectId, setProjectId] = useState<string>(initialProject?.id || crypto.randomUUID());
  const [projectName, setProjectName] = useState(initialProject?.name || 'CorSIT Sandbox Project');
  const [circuit, setCircuit] = useState<Circuit>(initialProject?.circuit || EMPTY_CIRCUIT);
  const [undoStack, setUndoStack] = useState<Circuit[]>([]);
  const [redoStack, setRedoStack] = useState<Circuit[]>([]);

  // Selection state
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [selectedWireColor, setSelectedWireColor] = useState<string>('#22C55E'); // Default green wire

  // UI Drawer & Modal states
  const [isComponentDrawerOpen, setIsComponentDrawerOpen] = useState(true);
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isArenaModalOpen, setIsArenaModalOpen] = useState(false);
  const [isCodeExportModalOpen, setIsCodeExportModalOpen] = useState(false);

  // AI & Simulation state
  const [errors, setErrors] = useState<CircuitError[]>([]);
  const [explanation, setExplanation] = useState<CircuitExplanation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [arduinoCode, setArduinoCode] = useState<string>(circuit.code || '');

  // Simulation Engine Ref
  const engineRef = useRef<SimulationEngine | null>(null);
  const defaultTrack = TRACK_PRESETS[0];
  const [robotState, setRobotState] = useState<RobotState>({
    x: defaultTrack.robotStart.x,
    y: defaultTrack.robotStart.y,
    heading: defaultTrack.robotStart.heading,
    width: 44,
    length: 56,
    speedLeft: 0,
    speedRight: 0,
    sensorRangeCm: 400,
    detectedDistanceCm: 400,
    sensorRayEnd: { x: 500, y: defaultTrack.robotStart.y },
    pathHistory: [{ x: defaultTrack.robotStart.x, y: defaultTrack.robotStart.y }],
    isColliding: false,
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>(defaultTrack.obstacles);

  // Record undo state
  const pushUndoState = () => {
    setUndoStack((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(circuit))]);
    setRedoStack([]);
  };

  // Initialize engine
  useEffect(() => {
    const engine = new SimulationEngine(circuit, 580, 380);
    engine.setObstacles(obstacles);
    engineRef.current = engine;
    setRobotState(engine.getRobot());

    // Pre-validate circuit for AI status badge
    aiService.checkWiring(circuit).then((res) => setErrors(res.errors));

    return () => {
      engine.stop();
    };
  }, []);

  // Sync circuit updates to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCircuit(circuit);
    }
  }, [circuit]);

  // Keyboard shortcuts (R = rotate, Delete = remove)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        handleRotateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Rotate selected component by 90 degrees
  const handleRotateSelected = () => {
    if (!selectedComponentId) return;
    pushUndoState();
    setCircuit((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.id === selectedComponentId
          ? { ...c, rotation: ((c.rotation || 0) + 90) % 360 }
          : c
      ),
    }));
  };

  // Delete selected component or wire
  const handleDeleteSelected = () => {
    if (selectedWireId) {
      pushUndoState();
      setCircuit((prev) => ({
        ...prev,
        connections: prev.connections.filter((c) => c.id !== selectedWireId),
      }));
      setSelectedWireId(null);
    } else if (selectedComponentId) {
      pushUndoState();
      setCircuit((prev) => ({
        ...prev,
        components: prev.components.filter((c) => c.id !== selectedComponentId),
        connections: prev.connections.filter(
          (c) =>
            c.from.componentId !== selectedComponentId &&
            c.to.componentId !== selectedComponentId
        ),
      }));
      setSelectedComponentId(null);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(circuit))]);
    setUndoStack((prev) => prev.slice(0, -1));
    setCircuit(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(circuit))]);
    setRedoStack((prev) => prev.slice(0, -1));
    setCircuit(next);
  };

  // Change wire color on selected wire
  const handleSelectWireColor = (color: string) => {
    setSelectedWireColor(color);
    if (selectedWireId) {
      pushUndoState();
      setCircuit((prev) => ({
        ...prev,
        connections: prev.connections.map((c) =>
          c.id === selectedWireId ? { ...c, color } : c
        ),
      }));
    }
  };

  // Simulation Toggle
  const handleToggleSimulation = () => {
    if (!engineRef.current) return;

    if (isRunning) {
      engineRef.current.stop();
      setIsRunning(false);
    } else {
      // Recheck wiring
      aiService.checkWiring(circuit).then((res) => {
        setErrors(res.errors);
      });

      engineRef.current.start((result) => {
        setRobotState({ ...result.robot });
        setCircuit((prev) => ({
          ...prev,
          components: result.circuit.components,
        }));
      });
      setIsRunning(true);
      // Automatically open the floating arena track if testing a robot
      if (circuit.components.some((c) => c.type === 'UltrasonicSensor' || c.type === 'MotorDriver')) {
        setIsArenaModalOpen(true);
      }
    }
  };

  // Check Wiring AI
  const handleCheckWiring = async () => {
    setIsAiBusy(true);
    try {
      const res = await aiService.checkWiring(circuit);
      setErrors(res.errors);
      if (!res.hasErrors) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.15 },
          colors: ['#22C55E', '#C13B3B', '#F1E9E4'],
        });
      }
    } finally {
      setIsAiBusy(false);
    }
  };

  // Explain Circuit AI
  const handleExplainCircuit = async () => {
    setIsAiBusy(true);
    try {
      const res = await aiService.explainCircuit(circuit);
      setExplanation(res);
    } finally {
      setIsAiBusy(false);
    }
  };

  // Natural Language Auto-Wire
  const handleAutoWirePrompt = async (prompt: string) => {
    setIsAiBusy(true);
    try {
      const res = await aiService.autoWireFromPrompt(prompt);
      if (res.success && res.circuit) {
        pushUndoState();
        setCircuit(res.circuit);
        setErrors([]);
        if (engineRef.current) {
          engineRef.current.setCircuit(res.circuit);
          engineRef.current.resetRobot();
        }
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.2 },
          colors: ['#C13B3B', '#7A1B2B', '#F1E9E4'],
        });
      }
    } finally {
      setIsAiBusy(false);
    }
  };

  // Handle user-typed or block-generated C++ code change
  const handleCodeChange = (newCode: string) => {
    setArduinoCode(newCode);
    setCircuit((prev) => ({ ...prev, code: newCode }));
  };

  // Preset Starters
  const handleSelectStarter = (starterKey: string) => {
    const preset = PRESET_CIRCUITS[starterKey];
    if (preset) {
      if (isRunning && engineRef.current) {
        engineRef.current.stop();
        setIsRunning(false);
      }
      pushUndoState();
      setCircuit(JSON.parse(JSON.stringify(preset)));
      setProjectName(preset.name);
      setArduinoCode(preset.code || '');
      setErrors([]);
      if (engineRef.current) {
        engineRef.current.setCircuit(preset);
        engineRef.current.resetRobot();
      }
      aiService.checkWiring(preset).then((res) => setErrors(res.errors));
    }
  };

  // Add Component to Canvas
  const handleAddComponent = (type: ComponentType) => {
    pushUndoState();
    // Offset spawn position so new parts don't stack directly on each other
    const offset = (circuit.components.length % 5) * 35;
    const newComp = createComponentInstance(type, 160 + offset, 120 + offset);
    setCircuit((prev) => ({
      ...prev,
      components: [...prev.components, newComp],
    }));
    setSelectedComponentId(newComp.id);
  };

  // Update Component Position
  const handleUpdateComponentPosition = (id: string, x: number, y: number) => {
    setCircuit((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === id ? { ...c, position: { x, y } } : c)),
    }));
  };

  // Add Wire Connection
  const handleAddConnection = (conn: Connection) => {
    pushUndoState();
    setCircuit((prev) => ({
      ...prev,
      connections: [...prev.connections, conn],
    }));
  };

  // Remove Wire Connection
  const handleRemoveConnection = (connectionId: string) => {
    pushUndoState();
    setCircuit((prev) => ({
      ...prev,
      connections: prev.connections.filter((c) => c.id !== connectionId),
    }));
  };

  // Robot Arena handlers
  const handleResetRobot = (x = 100, y = 100, heading = 0) => {
    if (engineRef.current) {
      engineRef.current.resetRobot(x, y, heading);
      setRobotState(engineRef.current.getRobot());
    } else {
      setRobotState((prev) => ({
        ...prev,
        x,
        y,
        heading,
        speedLeft: 0,
        speedRight: 0,
        pathHistory: [{ x, y }],
        isColliding: false,
      }));
    }
  };

  const handleUpdateObstacles = (updated: Obstacle[]) => {
    setObstacles(updated);
    if (engineRef.current) {
      engineRef.current.setObstacles(updated);
    }
  };

  const handleUpdateRobotPos = (x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.setRobotPosition(x, y);
      setRobotState({ ...engineRef.current.getRobot() });
    } else {
      setRobotState((prev) => ({
        ...prev,
        x,
        y,
        pathHistory: [{ x, y }],
      }));
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-base text-white overflow-hidden select-none font-sans">
      {/* 1. TinkerCAD Signature Top Navigation Bar */}
      <TinkerNav
        projectName={projectName}
        onUpdateProjectName={setProjectName}
        isRunning={isRunning}
        onToggleSimulation={handleToggleSimulation}
        onRotateSelected={handleRotateSelected}
        onDeleteSelected={handleDeleteSelected}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        selectedWireColor={selectedWireColor}
        onSelectWireColor={handleSelectWireColor}
        isCodeOpen={isCodeOpen}
        onToggleCode={() => setIsCodeOpen(!isCodeOpen)}
        isComponentDrawerOpen={isComponentDrawerOpen}
        onToggleComponentDrawer={() => setIsComponentDrawerOpen(!isComponentDrawerOpen)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onExportCode={() => setIsCodeExportModalOpen(true)}
        onSaveAndExit={() => {
          onSaveAndExit({
            id: projectId,
            name: projectName,
            lastModified: Date.now(),
            circuit: circuit,
          });
        }}
        hasErrors={errors.length > 0}
        errorCount={errors.length}
      />

      {/* 2. Main Workspace: Expansive Canvas + Right-hand Component Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Full Viewport Canvas */}
        <div className="flex-1 h-full relative">
          <TinkerCanvas
            circuit={circuit}
            errors={errors}
            isRunning={isRunning}
            selectedWireColor={selectedWireColor}
            selectedComponentId={selectedComponentId}
            selectedWireId={selectedWireId}
            onSelectComponent={(id) => {
              setSelectedComponentId(id);
              if (id) setSelectedWireId(null);
            }}
            onSelectWire={(id) => {
              setSelectedWireId(id);
              if (id) setSelectedComponentId(null);
            }}
            onUpdateComponentPosition={handleUpdateComponentPosition}
            onAddConnection={handleAddConnection}
            onRemoveConnection={handleRemoveConnection}
          />

          {/* Floating Pill: View Bot Test Track */}
          <button
            onClick={() => setIsArenaModalOpen(!isArenaModalOpen)}
            className="absolute bottom-4 right-6 z-20 flex items-center gap-2 bg-panel/90 hover:bg-trace backdrop-blur border border-trace hover:border-red/40 rounded-full px-3.5 py-1.5 text-xs font-mono shadow-xl transition-all"
          >
            <Bot className="w-4 h-4 text-red" />
            <span>{isArenaModalOpen ? 'Hide Robot Track' : 'View Robot Track'}</span>
            {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
          </button>
        </div>

        {/* Slide-out Code Drawer (Blocks / Blocks+Text / Text) */}
        <CodeDrawer
          isOpen={isCodeOpen}
          onClose={() => setIsCodeOpen(false)}
          arduinoCode={arduinoCode}
          onCodeChange={handleCodeChange}
          isRunning={isRunning}
          onToggleSimulation={handleToggleSimulation}
        />

        {/* Right-Hand Component Drawer (TinkerCAD signature layout) */}
        <ComponentDrawer
          isOpen={isComponentDrawerOpen}
          onAddComponent={handleAddComponent}
          onSelectStarter={handleSelectStarter}
        />
      </div>

      {/* 3. CorSIT AI Assistant Modal */}
      <TinkerAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        errors={errors}
        onCheckWiring={handleCheckWiring}
        onAutoWirePrompt={handleAutoWirePrompt}
        onExplainCircuit={handleExplainCircuit}
        explanation={explanation}
        arduinoCode={arduinoCode}
        isAiBusy={isAiBusy}
      />

      {/* 4. Robot 2D Test Track Floating Modal */}
      <ArenaModal
        isOpen={isArenaModalOpen}
        onClose={() => setIsArenaModalOpen(false)}
        robot={robotState}
        obstacles={obstacles}
        isRunning={isRunning}
        onResetRobot={handleResetRobot}
        onUpdateObstacles={handleUpdateObstacles}
        onUpdateRobotPos={handleUpdateRobotPos}
      />

      {/* 5. Production C++ Firmware Export Modal */}
      <CodeExportModal
        isOpen={isCodeExportModalOpen}
        onClose={() => setIsCodeExportModalOpen(false)}
        code={arduinoCode}
        onExplainCode={() => {
          setIsCodeExportModalOpen(false);
          setIsAiModalOpen(true);
        }}
      />
    </div>
  );
}
