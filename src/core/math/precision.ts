import Big from 'big.js';
import type { DecimalPlaces, DecimalSeparator } from '../../types';

// Configure big.js defaults if needed
Big.PE = 40; // Positive exponent limit before exponential notation
Big.NE = -20; // Negative exponent limit

/**
 * Safely parse a number from string or number, tolerating both ',' and '.'
 */
export function parseBig(value: string | number): Big {
  if (typeof value === 'number') {
    if (isNaN(value) || !isFinite(value)) {
      throw new Error('Número inválido');
    }
    return new Big(value);
  }

  const cleaned = value.trim().replace(/\s+/g, '').replace(',', '.');
  if (!cleaned || isNaN(Number(cleaned))) {
    throw new Error(`Valor numérico inválido: "${value}"`);
  }

  return new Big(cleaned);
}

/**
 * Formats a Big number or regular number according to user settings
 */
export function formatNumber(
  value: Big | number,
  decimals: DecimalPlaces | number = 2,
  separator: DecimalSeparator = ','
): string {
  const bigVal = typeof value === 'number' ? new Big(value) : value;

  // Round according to precision
  const roundedStr = bigVal.toFixed(decimals);

  // If separator is comma, replace dot
  if (separator === ',') {
    return roundedStr.replace('.', ',');
  }
  return roundedStr;
}

/**
 * Formats with auto trimming of unnecessary trailing zeroes, e.g. 4.00 -> 4, but 4.25 -> 4,25
 */
export function formatNumberSmart(
  value: Big | number,
  maxDecimals: DecimalPlaces | number = 4,
  separator: DecimalSeparator = ','
): string {
  const bigVal = typeof value === 'number' ? new Big(value) : value;
  const fixed = bigVal.toFixed(maxDecimals);
  // Strip trailing zeros after decimal point
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
  
  if (separator === ',') {
    return trimmed.replace('.', ',');
  }
  return trimmed;
}

/**
 * Check if a string is a valid numeric input in progress (e.g. "-", "-.", "3.", etc.)
 */
export function isValidInputChar(val: string): boolean {
  // Allows empty, negative sign, decimals with comma or dot
  return /^-?[0-9]*[.,]?[0-9]*$/.test(val);
}
