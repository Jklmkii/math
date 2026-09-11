import { describe, it, expect } from 'vitest';
import Big from 'big.js';
import {
  parseBig,
  formatNumber,
  formatNumberSmart,
  isValidInputChar,
} from '../core/math/precision';

describe('Motor Matemático: Precision', () => {
  describe('parseBig', () => {
    it('deve parsear números válidos', () => {
      expect(parseBig(10).toNumber()).toBe(10);
      expect(parseBig(-5.5).toNumber()).toBe(-5.5);
      expect(parseBig(0).toNumber()).toBe(0);
    });

    it('deve lançar erro para números inválidos', () => {
      expect(() => parseBig(NaN)).toThrow('Número inválido');
      expect(() => parseBig(Infinity)).toThrow('Número inválido');
      expect(() => parseBig(-Infinity)).toThrow('Número inválido');
    });

    it('deve parsear strings válidas com separadores diferentes', () => {
      expect(parseBig('10').toNumber()).toBe(10);
      expect(parseBig('-5.5').toNumber()).toBe(-5.5);
      expect(parseBig('3,14').toNumber()).toBe(3.14);
      expect(parseBig('  42  ').toNumber()).toBe(42);
    });

    it('deve lançar erro para strings inválidas', () => {
      expect(() => parseBig('')).toThrow('Valor numérico inválido: ""');
      expect(() => parseBig('abc')).toThrow('Valor numérico inválido: "abc"');
      expect(() => parseBig('12.34.56')).toThrow('Valor numérico inválido: "12.34.56"');
    });
  });

  describe('formatNumber', () => {
    it('deve formatar número e Big com defaults', () => {
      expect(formatNumber(10)).toBe('10,00');
      expect(formatNumber(new Big(3.1415))).toBe('3,14');
    });

    it('deve respeitar a precisão de decimais', () => {
      expect(formatNumber(10, 0)).toBe('10');
      expect(formatNumber(3.1415, 3)).toBe('3,142'); // Verifica o arredondamento
    });

    it('deve respeitar o separador', () => {
      expect(formatNumber(3.14, 2, '.')).toBe('3.14');
      expect(formatNumber(3.14, 2, ',')).toBe('3,14');
    });
  });

  describe('formatNumberSmart', () => {
    it('deve remover zeros à direita desnecessários', () => {
      expect(formatNumberSmart(4)).toBe('4');
      expect(formatNumberSmart(4.0)).toBe('4');
      expect(formatNumberSmart(4.25)).toBe('4,25');
      expect(formatNumberSmart(4.250)).toBe('4,25');
    });

    it('deve respeitar o limite máximo de decimais', () => {
      expect(formatNumberSmart(3.14159, 4)).toBe('3,1416');
      expect(formatNumberSmart(3.14159, 2)).toBe('3,14');
    });

    it('deve respeitar o separador', () => {
      expect(formatNumberSmart(4.5, 2, '.')).toBe('4.5');
      expect(formatNumberSmart(4.5, 2, ',')).toBe('4,5');
    });
  });

  describe('isValidInputChar', () => {
    it('deve aceitar inputs parciais válidos', () => {
      expect(isValidInputChar('')).toBe(true);
      expect(isValidInputChar('-')).toBe(true);
      expect(isValidInputChar('-.')).toBe(true);
      expect(isValidInputChar('3.')).toBe(true);
      expect(isValidInputChar('-3.14')).toBe(true);
      expect(isValidInputChar('3,14')).toBe(true);
    });

    it('deve rejeitar inputs inválidos', () => {
      expect(isValidInputChar('abc')).toBe(false);
      expect(isValidInputChar('--')).toBe(false);
      expect(isValidInputChar('3.14.2')).toBe(false);
      expect(isValidInputChar('12-3')).toBe(false);
    });
  });
});
