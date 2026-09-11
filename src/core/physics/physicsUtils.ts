import Big from 'big.js';
import { parseBig, formatNumberSmart } from '../math/precision';
import type { DecimalPlaces, DecimalSeparator } from '../../types';

export interface PhysicsCalculationOptions {
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
  gravity?: string | number;
}

/**
 * Converte graus para radianos
 */
export function degToRad(degrees: Big | number): number {
  const degNum = typeof degrees === 'number' ? degrees : Number(degrees.toString());
  return (degNum * Math.PI) / 180;
}

/**
 * Converte radianos para graus
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Normaliza um ângulo em graus para o intervalo [0, 360)
 */
function normalizeAngle(degrees: Big | number): number {
  const deg = typeof degrees === 'number' ? degrees : Number(degrees.toString());
  return ((deg % 360) + 360) % 360;
}

/**
 * Seno para ângulo em graus com eliminação analítica de resíduos numéricos IEEE 754.
 */
export function sinDeg(degrees: Big | number): Big {
  const norm = normalizeAngle(degrees);
  
  if (norm === 0 || norm === 180) {
    return new Big(0);
  }
  if (norm === 90) {
    return new Big(1);
  }
  if (norm === 270) {
    return new Big(-1);
  }
  if (norm === 30 || norm === 150) {
    return new Big('0.5');
  }
  if (norm === 210 || norm === 330) {
    return new Big('-0.5');
  }

  const rad = (norm * Math.PI) / 180;
  const val = Math.sin(rad);
  const cleaned = Math.abs(val) < 1e-14 ? 0 : val;
  return new Big(cleaned);
}

/**
 * Cosseno para ângulo em graus com eliminação analítica de resíduos numéricos IEEE 754.
 */
export function cosDeg(degrees: Big | number): Big {
  const norm = normalizeAngle(degrees);

  if (norm === 90 || norm === 270) {
    return new Big(0);
  }
  if (norm === 0) {
    return new Big(1);
  }
  if (norm === 180) {
    return new Big(-1);
  }
  if (norm === 60 || norm === 300) {
    return new Big('0.5');
  }
  if (norm === 120 || norm === 240) {
    return new Big('-0.5');
  }

  const rad = (norm * Math.PI) / 180;
  const val = Math.cos(rad);
  const cleaned = Math.abs(val) < 1e-14 ? 0 : val;
  return new Big(cleaned);
}

/**
 * Tangente para ângulo em graus com validação de indefinição em cos(θ) = 0.
 */
export function tanDeg(degrees: Big | number): Big {
  const norm = normalizeAngle(degrees);

  if (norm === 90 || norm === 270) {
    throw new Error('Tangente indefinida para este ângulo (cosseno nulo em 90° ou 270°).');
  }
  if (norm === 0 || norm === 180) {
    return new Big(0);
  }
  if (norm === 45 || norm === 225) {
    return new Big(1);
  }
  if (norm === 135 || norm === 315) {
    return new Big(-1);
  }

  const rad = (norm * Math.PI) / 180;
  return new Big(Math.tan(rad));
}

/**
 * Raiz quadrada com verificação estrita de radicando não negativo.
 */
export function safeSqrt(value: Big | number, contextName = 'valor'): Big {
  const bigVal = typeof value === 'number' ? new Big(value) : value;
  if (bigVal.lt(0)) {
    throw new Error(`Radicando negativo (${bigVal.toString()}) ao calcular a raiz quadrada de ${contextName}.`);
  }
  if (bigVal.eq(0)) {
    return new Big(0);
  }
  return new Big(Math.sqrt(Number(bigVal.toString())));
}

/**
 * Converte velocidade de km/h para m/s com precisão exata do Big.js (divisão por 3.6).
 */
export function kmhToMs(vKmh: Big | number): Big {
  const bigVal = typeof vKmh === 'number' ? new Big(vKmh) : vKmh;
  return bigVal.div(new Big('3.6'));
}

/**
 * Converte velocidade de m/s para km/h com precisão exata do Big.js (multiplicação por 3.6).
 */
export function msToKmh(vMs: Big | number): Big {
  const bigVal = typeof vMs === 'number' ? new Big(vMs) : vMs;
  return bigVal.times(new Big('3.6'));
}

/**
 * Normaliza e valida a aceleração da gravidade local g (padrão: 9.8 ou 10).
 */
export function normalizeGravity(gravityInput?: string | number): Big {
  if (gravityInput === undefined || gravityInput === null || gravityInput === '') {
    return new Big('9.8');
  }
  const g = parseBig(gravityInput);
  if (g.lte(0)) {
    throw new Error('A aceleração da gravidade (g) deve ser estritamente positiva.');
  }
  return g;
}

/**
 * Alias de normalizeGravity para conformidade de nomenclatura.
 */
export const parseGravity = normalizeGravity;

/**
 * Formata um valor numérico com sua unidade física correspondente.
 */
export function formatUnit(
  val: Big | number,
  unit: string,
  decimals: DecimalPlaces = 2,
  separator: DecimalSeparator = ','
): string {
  const formatted = formatNumberSmart(val, decimals, separator);
  return `${formatted} ${unit}`;
}

/**
 * Converte string ou número de km/h para m/s formatado
 */
export function convertKmHToMS(vKmh: string | number): string {
  try {
    const b = parseBig(vKmh);
    return kmhToMs(b).toFixed(2);
  } catch {
    return '0';
  }
}

/**
 * Converte string ou número de m/s para km/h formatado
 */
export function convertMSToKmH(vMs: string | number): string {
  try {
    const b = parseBig(vMs);
    return msToKmh(b).toFixed(2);
  } catch {
    return '0';
  }
}

