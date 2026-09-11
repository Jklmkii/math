export * from './physicsUtils';
export * from './mru';
export * from './mruv';
export * from './quedaLivre';
export * from './lancamentoVertical';
export * from './lancamentoHorizontal';
export * from './lancamentoObliquo';
export * from './mcu';
export * from './mhs';
export * from './planoInclinado';
export * from './energiaTrabalho';

// Re-export dos tipos de física do Quantora
export type {
  PhysicsMode,
  PhysicsCategory,
  PhysicsCalculationBaseResult,
  PhysicsChartData,
  TemporalChartPoint,
  TemporalChartData,
  TrajectoryChartPoint,
  BallisticChartData,
  CircularVectorChartData,
  InclinedPlaneChartData,
  EnergyBarItem,
  EnergyChartData,
  PhysicsCalculationOutput,
  PhysicsCalculationResult,
  MRUInput,
  MRUResult,
  MRUVInput,
  MRUVResult,
  QuedaLivreInput,
  QuedaLivreResult,
  LancamentoVerticalInput,
  LancamentoVerticalResult,
  LancamentoHorizontalInput,
  LancamentoHorizontalResult,
  LancamentoObliquoInput,
  LancamentoObliquoResult,
  MCUInput,
  MCUResult,
  MHSInput,
  MHSResult,
  PlanoInclinadoInput,
  PlanoInclinadoResult,
  EnergiaTrabalhoInput,
  EnergiaTrabalhoResult,
  AnyPhysicsResult,
} from '../../types';
