import { describe, it, expect } from 'vitest';
import { generateQuizQuestion } from '../core/math/quizGenerator';
import { parseBig } from '../core/math/precision';
import { useAppStore } from '../store/useAppStore';

describe('Modo Treino (MatSpeed) - Gerador e Validação', () => {
  it('gera perguntas válidas para todas as trilhas', () => {
    const tracks = ['soma', 'subtracao', 'multiplicacao', 'divisao', 'regra_simples', 'sobrevivencia'] as const;

    for (const track of tracks) {
      const q = generateQuizQuestion(track, 1);
      expect(q.id).toBeDefined();
      expect(q.displayExpression).toBeTruthy();
      expect(typeof q.correctAnswer).toBe('number');
      expect(isFinite(q.correctAnswer)).toBe(true);
      expect(isNaN(q.correctAnswer)).toBe(false);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it('escala a dificuldade proceduralmente até 250 contas (semi-infinito)', () => {
    const testCounts = [1, 15, 35, 75, 110, 160, 200, 250];

    for (const count of testCounts) {
      const q = generateQuizQuestion('sobrevivencia', count);
      expect(q.countNumber).toBe(count);
      expect(typeof q.correctAnswer).toBe('number');
      expect(isFinite(q.correctAnswer)).toBe(true);
      expect(isNaN(q.correctAnswer)).toBe(false);
    }
  });

  it('garante que divisões em níveis decimais nunca geram dízimas infinitas', () => {
    // Testa 30 gerações de divisões com níveis avançados (count > 100)
    for (let i = 0; i < 30; i++) {
      const q = generateQuizQuestion('divisao', 120 + i);
      expect(isFinite(q.correctAnswer)).toBe(true);

      // Converte para string e verifica se o número de casas decimais é razoável (<= 4)
      const str = q.correctAnswer.toString();
      const parts = str.split('.');
      if (parts[1]) {
        expect(parts[1].length).toBeLessThanOrEqual(4);
      }
    }
  });

  it('permite comparar respostas de usuário com vírgula ou ponto usando parseBig', () => {
    const target = 7.5;
    expect(parseBig('7,5').eq(parseBig(target))).toBe(true);
    expect(parseBig('7.5').eq(parseBig(target))).toBe(true);
    expect(parseBig(' 7,50 ').eq(parseBig(target))).toBe(true);

    const negativeTarget = -24;
    expect(parseBig('-24').eq(parseBig(negativeTarget))).toBe(true);
  });

  it('atualiza recordes de sobrevivência e trilhas na store Zustand', () => {
    const store = useAppStore.getState();
    store.resetQuizProgress();

    // Registra acerto no modo sobrevivência
    store.recordQuizAnswer({
      track: 'sobrevivencia',
      countNumber: 16,
      correct: true,
      xpEarned: 312,
      currentStreak: 15,
    });

    const updated = useAppStore.getState().quizProgress.survival;
    expect(updated.totalAnswered).toBe(1);
    expect(updated.totalCorrect).toBe(1);
    expect(updated.recordCount).toBe(16);
    expect(updated.maxStreak).toBe(15);
    expect(updated.highScore).toBe(312);

    // Registra acerto em trilha individual
    store.recordQuizAnswer({
      track: 'soma',
      countNumber: 25,
      correct: true,
      xpEarned: 200,
      currentStreak: 8,
    });

    const somaProgress = useAppStore.getState().quizProgress.tracks.soma;
    expect(somaProgress.recordCount).toBe(25);
    expect(somaProgress.bestStreak).toBe(8);
    expect(somaProgress.currentLevel).toBeGreaterThanOrEqual(5);
  });
});
