import { Circuit, CircuitError } from './circuit';

export interface WiringCheckResult {
  hasErrors: boolean;
  errors: CircuitError[];
  timestamp: string;
}

export interface CircuitExplanation {
  summary: string;
  architecture: string;
  signalFlow: string[];
}

export interface CodeDebugResult {
  analysis: string;
  suggestions: string[];
  correctedCode?: string;
}

export interface AutoWireResult {
  success: boolean;
  circuit?: Circuit;
  explanation: string;
  error?: string;
}
