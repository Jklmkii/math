import type { HistoryItem, CalculationType } from '../../types';

export interface HistoryValidationResult {
  valid: boolean;
  error?: string;
  data?: HistoryItem[];
}

const VALID_TYPES: CalculationType[] = ['bhaskara', 'regra_simples', 'regra_composta'];

/**
 * Validates whether an unknown parsed JSON matches the expected HistoryItem[] schema.
 * Reusable across Web (file upload) and Electron environments.
 */
export function validateHistorySchema(raw: unknown): HistoryValidationResult {
  if (!raw || !Array.isArray(raw)) {
    return {
      valid: false,
      error: 'Formato inválido: o backup de histórico deve ser uma lista (array) de itens.',
    };
  }

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.id !== 'string' ||
      typeof item.timestamp !== 'number' ||
      !VALID_TYPES.includes(item.type) ||
      typeof item.title !== 'string' ||
      typeof item.summary !== 'string' ||
      typeof item.details !== 'string'
    ) {
      return {
        valid: false,
        error: `O item #${i + 1} do arquivo não segue a estrutura esperada do histórico.`,
      };
    }
  }

  return {
    valid: true,
    data: raw as HistoryItem[],
  };
}
