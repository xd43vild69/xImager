
export enum View {
  EXECUTION = 'execution',
  HISTORY = 'history',
  MODELS = 'models',
  SETTINGS = 'settings',
  LOGS = 'logs'
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'LOAD' | 'EXEC' | 'ERROR';
  message: string;
}

export interface GpuStats {
  name: string;
  vramTotal: string;
  vramUsedPercent: number;
}

export interface Workflow {
  id: string;
  name: string;
  filename: string;
}

export interface ExecutionState {
  isProcessing: boolean;
  progress: number;
  step: number;
  totalSteps: number;
  eta: string;
  iterRate: string;
  totalTime: string;
  resultUrl: string | null;
}

export interface HistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: string;
  workflow: string;
}

export interface ModelItem {
  id: string;
  name: string;
  type: 'Checkpoint' | 'LoRA' | 'ControlNet' | 'VAE';
  size: string;
  lastUsed: string;
}
