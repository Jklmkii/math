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
export type AppLanguage = 'pt' | 'en';

export interface AppSettings {
  theme: ThemeMode;
  language: AppLanguage;
  decimalPlaces: DecimalPlaces;
  decimalSeparator: DecimalSeparator;
  historyLimit: number;
  hasCompletedOnboarding: boolean;
}

export type QuizDifficultyMode = 'tranquilo' | 'velocidade' | 'brutal';
export type QuizTrack = 'soma' | 'subtracao' | 'multiplicacao' | 'divisao' | 'regra_simples';
export type QuizTrackSelector = QuizTrack | 'sobrevivencia';

export interface SurvivalStats {
  highScore: number;
  maxStreak: number;
  recordCount: number;
  totalAnswered: number;
  totalCorrect: number;
}

export interface QuizTrackProgress {
  currentLevel: number;
  bestStreak: number;
  recordCount: number;
  totalCorrect: number;
  totalAnswered: number;
}

export interface QuizProgress {
  survival: SurvivalStats;
  tracks: Record<QuizTrack, QuizTrackProgress>;
}

export interface QuizQuestion {
  id: string;
  type: QuizTrack;
  countNumber: number;
  totalGoal?: number;
  question: string;
  displayExpression: string;
  context?: string;
  correctAnswer: number;
  formattedCorrectAnswer: string;
  options?: number[];
  explanation: string[];
  timeLimitSeconds?: number;
}

export interface UpdaterStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  percent?: number;
  message?: string;
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
      checkForUpdates?: () => Promise<{ success: boolean; updateInfo?: unknown; error?: string; message?: string }>;
      installUpdate?: () => Promise<{ success: boolean }>;
      onUpdateStatus?: (callback: (status: UpdaterStatus) => void) => () => void;
    };
  }
}
