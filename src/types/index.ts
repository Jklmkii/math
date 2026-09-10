export type RootType = 'two_real' | 'single_real' | 'complex';

export interface ComplexRoot {
  real: number;
  imaginary: number;
  formatted: string;
}

export interface BhaskaraResult {
  a: number;
  b: number;
  c: number;
  delta: number;
  rootType: RootType;
  x1: number | null;
  x2: number | null;
  complexRoots?: {
    x1: ComplexRoot;
    x2: ComplexRoot;
  };
  vertex: {
    x: number;
    y: number;
  };
  axisOfSymmetry: number;
  steps: string[];
  formattedEquation: string;
}

export type ProportionType = 'direct' | 'inverse';

export type SimpleGridPosition = 'a1' | 'b1' | 'a2' | 'b2';

export interface RegraDeTresSimplesInput {
  a1: string;
  b1: string;
  a2: string;
  b2: string;
  unknownPos: SimpleGridPosition;
  type: ProportionType;
  labelA?: string;
  labelB?: string;
}

export interface RegraDeTresSimplesResult {
  x: number;
  formattedX: string;
  steps: string[];
  type: ProportionType;
  formula: string;
}

export interface CompostaColumn {
  id: string;
  name: string;
  val1: string;
  val2: string;
  isTarget: boolean; // Column that contains x
  proportionWithTarget: ProportionType; // Direct or inverse relative to the target
}

export interface RegraDeTresCompostaResult {
  x: number;
  formattedX: string;
  steps: string[];
  equation: string;
}

export type CalculationType = 'bhaskara' | 'regra_simples' | 'regra_composta';

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: CalculationType;
  title: string;
  summary: string;
  details: string;
  isPinned: boolean;
  rawPayload: unknown;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type DecimalPlaces = 2 | 4 | 6;
export type DecimalSeparator = ',' | '.';

export interface AppSettings {
  theme: ThemeMode;
  decimalPlaces: DecimalPlaces;
  decimalSeparator: DecimalSeparator;
  historyLimit: number;
  hasCompletedOnboarding: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'bhaskara' | 'regra_simples';
  question: string;
  context?: string;
  correctAnswer: number;
  options: number[];
  explanation: string[];
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      saveFile: (
        defaultName: string,
        content: string,
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
      openFile: (
        filters?: Array<{ name: string; extensions: string[] }>
      ) => Promise<{ success: boolean; data?: HistoryItem[]; path?: string; canceled?: boolean; error?: string }>;
    };
  }
}
