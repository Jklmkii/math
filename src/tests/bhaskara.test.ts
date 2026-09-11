import { describe, it, expect } from 'vitest';
import { calculateBhaskara, parseQuadraticEquation } from '../core/math/bhaskara';

describe('Motor Matemático: Bhaskara', () => {
  it('deve lançar erro se o coeficiente "a" for zero', () => {
    expect(() => calculateBhaskara(0, 5, 2)).toThrow("O coeficiente 'a' não pode ser zero");
    expect(() => calculateBhaskara('0', '10', '-4')).toThrow("O coeficiente 'a' não pode ser zero");
  });

  it('deve calcular corretamente com Δ > 0 (duas raízes reais distintas)', () => {
    // x² - 5x + 6 = 0 -> raízes 3 e 2, vértice (2.5, -0.25), delta 1
    const result = calculateBhaskara(1, -5, 6);
    expect(result.delta).toBe(1);
    expect(result.rootType).toBe('two_real');
    expect(result.x1).toBe(3);
    expect(result.x2).toBe(2);
    expect(result.vertex.x).toBe(2.5);
    expect(result.vertex.y).toBe(-0.25);
  });

  it('deve calcular corretamente com Δ = 0 (raiz real única dupla)', () => {
    // x² - 4x + 4 = 0 -> raiz 2, vértice (2, 0), delta 0
    const result = calculateBhaskara(1, -4, 4);
    expect(result.delta).toBe(0);
    expect(result.rootType).toBe('single_real');
    expect(result.x1).toBe(2);
    expect(result.x2).toBe(2);
    expect(result.vertex.x).toBe(2);
    expect(result.vertex.y).toBe(0);
  });

  it('deve calcular corretamente com Δ < 0 (raízes complexas)', () => {
    // x² + 4 = 0 (a=1, b=0, c=4) -> delta = -16, raízes 0 ± 2i
    const result = calculateBhaskara(1, 0, 4);
    expect(result.delta).toBe(-16);
    expect(result.rootType).toBe('complex');
    expect(result.complexRoots).toBeDefined();
    expect(result.complexRoots?.x1.real).toBe(0);
    expect(result.complexRoots?.x1.imaginary).toBe(2);
    expect(result.complexRoots?.x2.imaginary).toBe(-2);
  });

  it('deve suportar equações com coeficientes extremos (ex: x² - 1000x + 500 = 0)', () => {
    const result = calculateBhaskara(1, -1000, 500);
    expect(result.delta).toBe(998000);
    expect(result.vertex.x).toBe(500);
    expect(result.vertex.y).toBe(-249500);
    expect(result.rootType).toBe('two_real');
  });

  it('deve tratar precisão decimal e vírgula como separador', () => {
    const result = calculateBhaskara('0,5', '-2,5', '3');
    // 0.5x² - 2.5x + 3 = 0 -> raízes 2 e 3
    expect(result.x1).toBe(3);
    expect(result.x2).toBe(2);
  });

  describe('Parser de Texto de Equação', () => {
    it('deve extrair a, b, c de equações padrão', () => {
      const parsed = parseQuadraticEquation('2x² - 4x + 2 = 0');
      expect(parsed).toEqual({ a: '2', b: '-4', c: '2' });
    });

    it('deve aceitar notação com circunflexo x^2', () => {
      const parsed = parseQuadraticEquation('x^2 - 5x + 6 = 0');
      expect(parsed).toEqual({ a: '1', b: '-5', c: '6' });
    });

    it('deve aceitar coeficientes negativos implícitos como -x²', () => {
      const parsed = parseQuadraticEquation('-x² + 4 = 0');
      expect(parsed).toEqual({ a: '-1', b: '0', c: '4' });
    });

    it('deve mover termos do lado direito para o esquerdo', () => {
      const parsed = parseQuadraticEquation('3x² = 27');
      expect(parsed).toEqual({ a: '3', b: '0', c: '-27' });
    });

    it('deve retornar null ao falhar no parse de números (catch block)', () => {
      const parsed = parseQuadraticEquation('x² + .x = 0');
      expect(parsed).toBeNull();
    });
  });
});
