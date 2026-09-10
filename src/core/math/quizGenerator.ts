import type { QuizQuestion } from '../../types';
import { calculateBhaskara } from './bhaskara';
import { calculateRegraDeTresSimples } from './regraDeTresSimples';

export function generateQuizQuestion(): QuizQuestion {
  const isBhaskara = Math.random() > 0.5;

  if (isBhaskara) {
    // Generate quadratic with clean integer roots
    // (x - r1)(x - r2) = x² - (r1+r2)x + r1*r2
    const roots = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
    const r1 = roots[Math.floor(Math.random() * roots.length)];
    let r2 = roots[Math.floor(Math.random() * roots.length)];
    if (r2 === r1) r2 += 1;

    const a = 1;
    const b = -(r1 + r2);
    const c = r1 * r2;

    const questionType = Math.random() > 0.5 ? 'maior_raiz' : 'delta';

    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    const eqStr = `x² ${bSign}x ${cSign} = 0`;

    const result = calculateBhaskara(a, b, c);

    if (questionType === 'delta') {
      const correct = result.delta;
      const fakeOptions = [
        correct + Math.floor(Math.random() * 5) + 1,
        correct - Math.floor(Math.random() * 5) - 1,
        Math.abs(correct * 2 + 1),
      ];
      const uniqueOptions = Array.from(new Set([correct, ...fakeOptions])).slice(0, 4);
      uniqueOptions.sort(() => Math.random() - 0.5);

      return {
        id: `q_${Date.now()}_${Math.random()}`,
        type: 'bhaskara',
        question: `Qual é o valor do discriminante (Δ) da equação: ${eqStr}?`,
        correctAnswer: correct,
        options: uniqueOptions,
        explanation: result.steps,
      };
    } else {
      const maxRoot = Math.max(result.x1!, result.x2!);
      const minRoot = Math.min(result.x1!, result.x2!);
      const fakeOptions = [
        minRoot,
        maxRoot + 1,
        maxRoot - 2,
      ];
      const uniqueOptions = Array.from(new Set([maxRoot, ...fakeOptions])).slice(0, 4);
      uniqueOptions.sort(() => Math.random() - 0.5);

      return {
        id: `q_${Date.now()}_${Math.random()}`,
        type: 'bhaskara',
        question: `Dada a equação ${eqStr}, qual é a MAIOR raiz real?`,
        correctAnswer: maxRoot,
        options: uniqueOptions,
        explanation: result.steps,
      };
    }
  } else {
    // Regra de três simples
    const scenarios = [
      {
        text: (p1: number, v1: number, p2: number) =>
          `Se ${p1} operários constroem um muro em ${v1} dias, quantos dias levarão ${p2} operários?`,
        type: 'inverse' as const,
        colA: 'Operários',
        colB: 'Dias',
        p1: 4,
        v1: 6,
        p2: 8, // ans: (4*6)/8 = 3
      },
      {
        text: (p1: number, v1: number, p2: number) =>
          `Se um veículo a ${p1} km/h faz uma viagem em ${v1} horas, quantas horas levará a ${p2} km/h?`,
        type: 'inverse' as const,
        colA: 'Velocidade (km/h)',
        colB: 'Tempo (h)',
        p1: 60,
        v1: 4,
        p2: 80, // ans: (60*4)/80 = 3
      },
      {
        text: (p1: number, v1: number, p2: number) =>
          `Se ${p1} cadernos custam R$ ${v1}, quanto custarão ${p2} cadernos?`,
        type: 'direct' as const,
        colA: 'Cadernos',
        colB: 'Preço (R$)',
        p1: 3,
        v1: 15,
        p2: 7, // ans: (7*15)/3 = 35
      },
      {
        text: (p1: number, v1: number, p2: number) =>
          `Uma máquina produz ${p1} peças em ${v1} minutos. Quantas peças ela produzirá em ${p2} minutos?`,
        type: 'direct' as const,
        colA: 'Peças',
        colB: 'Minutos',
        p1: 40,
        v1: 10,
        p2: 25, // ans: (40*25)/10 = 100
      },
    ];

    const item = scenarios[Math.floor(Math.random() * scenarios.length)];
    const res = calculateRegraDeTresSimples({
      a1: item.p1.toString(),
      b1: item.v1.toString(),
      a2: item.p2.toString(),
      b2: '',
      unknownPos: 'b2',
      type: item.type,
      labelA: item.colA,
      labelB: item.colB,
    });

    const correct = res.x;
    const fake = [correct + 2, Math.max(1, correct - 2), correct * 2];
    const uniqueOptions = Array.from(new Set([correct, ...fake])).slice(0, 4);
    uniqueOptions.sort(() => Math.random() - 0.5);

    return {
      id: `q_${Date.now()}_${Math.random()}`,
      type: 'regra_simples',
      question: item.text(item.p1, item.v1, item.p2),
      correctAnswer: correct,
      options: uniqueOptions,
      explanation: res.steps,
    };
  }
}
