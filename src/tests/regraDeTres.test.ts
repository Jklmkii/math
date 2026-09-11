import { describe, it, expect } from 'vitest';
import { calculateRegraDeTresSimples, suggestProportionality } from '../core/math/regraDeTresSimples';
import { calculateRegraDeTresComposta } from '../core/math/regraDeTresComposta';

describe('Motor Matemático: Regra de Três Simples', () => {
  it('deve calcular proporção direta básica (b2 como incógnita)', () => {
    // 2 kg custam 10 reais. Quanto custam 6 kg?
    // A1=2, B1=10, A2=6, B2=x -> x = (6 * 10) / 2 = 30
    const res = calculateRegraDeTresSimples({
      a1: '2',
      b1: '10',
      a2: '6',
      b2: '',
      unknownPos: 'b2',
      type: 'direct',
    });
    expect(res.x).toBe(30);
    expect(res.formattedX).toBe('30');
  });

  it('deve calcular proporção inversa básica (b2 como incógnita)', () => {
    // 4 operários constroem um muro em 6 dias. Quantos dias levam 8 operários?
    // A1=4, B1=6, A2=8, B2=x -> x = (4 * 6) / 8 = 3
    const res = calculateRegraDeTresSimples({
      a1: '4',
      b1: '6',
      a2: '8',
      b2: '',
      unknownPos: 'b2',
      type: 'inverse',
    });
    expect(res.x).toBe(3);
    expect(res.formattedX).toBe('3');
  });

  it('deve permitir incógnita em qualquer célula da grade (ex: a1)', () => {
    // x / 10 = 6 / 20 (direta) -> x = (6 * 10) / 20 = 3
    const res = calculateRegraDeTresSimples({
      a1: '',
      b1: '10',
      a2: '6',
      b2: '20',
      unknownPos: 'a1',
      type: 'direct',
    });
    expect(res.x).toBe(3);
  });

  it('deve evitar erros clássicos de ponto flutuante do JS (0.1 + 0.2)', () => {
    // 0.1 / 0.2 = 0.3 / x -> x = (0.2 * 0.3) / 0.1 = 0.6 exato
    const res = calculateRegraDeTresSimples({
      a1: '0.1',
      b1: '0.2',
      a2: '0.3',
      b2: '',
      unknownPos: 'b2',
      type: 'direct',
    });
    expect(res.x).toBe(0.6);
  });

  it('deve sugerir proporcionalidade inversa para velocidade x tempo', () => {
    const sug = suggestProportionality('Velocidade (km/h)', 'Tempo (horas)');
    expect(sug).toBe('inverse');
  });

  it('deve lançar erro de divisão por zero se o divisor (a1) for 0', () => {
    expect(() =>
      calculateRegraDeTresSimples({
        a1: '0',
        b1: '10',
        a2: '5',
        b2: '',
        unknownPos: 'b2',
        type: 'direct',
      })
    ).toThrow('Divisão por zero: o valor de A₁ não pode ser 0.');
  });

  it('deve lançar erro de divisão por zero se o divisor (b1) for 0', () => {
    expect(() =>
      calculateRegraDeTresSimples({
        a1: '5',
        b1: '0',
        a2: '',
        b2: '10',
        unknownPos: 'a2',
        type: 'direct',
      })
    ).toThrow('Divisão por zero: o valor de B₁ não pode ser 0.');
  });

  it('deve lançar erro de divisão por zero se o divisor (a2) for 0', () => {
    expect(() =>
      calculateRegraDeTresSimples({
        a1: '5',
        b1: '',
        a2: '0',
        b2: '10',
        unknownPos: 'b1',
        type: 'direct',
      })
    ).toThrow('Divisão por zero: o valor de A₂ não pode ser 0.');
  });

  it('deve lançar erro de divisão por zero se o divisor (b2) for 0', () => {
    expect(() =>
      calculateRegraDeTresSimples({
        a1: '',
        b1: '10',
        a2: '5',
        b2: '0',
        unknownPos: 'a1',
        type: 'direct',
      })
    ).toThrow('Divisão por zero: o valor de B₂ não pode ser 0.');
  });
});

describe('Motor Matemático: Regra de Três Composta', () => {
  it('deve calcular com 3 grandezas com grandezas diretas e inversas', () => {
    // Exemplo clássico:
    // 6 operários fazem 120 metros em 8 dias.
    // Quantos dias (x) 8 operários levam para fazer 300 metros?
    // Alvo: Dias (val1 = 8)
    // Operários (inversa ao tempo): 6 e 8
    // Metros (direta ao tempo): 120 e 300
    // 8 / x = (8 / 6) * (120 / 300) = (8 * 120) / (6 * 300) = 960 / 1800 = 8 / 15
    // x = 8 * 15 / 8 = 15 dias
    const cols = [
      {
        id: '1',
        name: 'Operários',
        val1: '6',
        val2: '8',
        isTarget: false,
        proportionWithTarget: 'inverse' as const,
      },
      {
        id: '2',
        name: 'Metros',
        val1: '120',
        val2: '300',
        isTarget: false,
        proportionWithTarget: 'direct' as const,
      },
      {
        id: '3',
        name: 'Dias (Tempo)',
        val1: '8',
        val2: '',
        isTarget: true,
        proportionWithTarget: 'direct' as const,
      },
    ];

    const res = calculateRegraDeTresComposta(cols);
    expect(res.x).toBe(15);
    expect(res.formattedX).toBe('15');
  });

  it('deve lançar erro se o valor conhecido da grandeza alvo for zero', () => {
    const cols = [
      {
        id: '1',
        name: 'Operários',
        val1: '6',
        val2: '8',
        isTarget: false,
        proportionWithTarget: 'inverse' as const,
      },
      {
        id: '2',
        name: 'Metros',
        val1: '120',
        val2: '300',
        isTarget: false,
        proportionWithTarget: 'direct' as const,
      },
      {
        id: '3',
        name: 'Dias (Tempo)',
        val1: '0',
        val2: '',
        isTarget: true,
        proportionWithTarget: 'direct' as const,
      },
    ];

    expect(() => calculateRegraDeTresComposta(cols)).toThrow('O valor conhecido da grandeza alvo não pode ser zero.');
  });
});
