import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNewTime,
  getComboMultiplier,
  updateCombo,
  calculateBlitzXp,
  calculateQuestionXp,
  calculateAccuracy,
  generateBlitzQuestion,
  generateOptions,
  createInitialBlitzState,
  processAnswer,
  BLITZ_INITIAL_TIME,
  BLITZ_TIME_BONUS,
  BLITZ_TIME_PENALTY,
} from '../core/quiz/blitzEngine';
import { useAppStore } from '../store/useAppStore';

describe('Modo Blitz (blitzEngine)', () => {
  describe('Constantes e Configuração do Blitz', () => {
    it('possui tempo inicial de 60s, bônus de 2s e penalidade de 3s', () => {
      expect(BLITZ_INITIAL_TIME).toBe(60);
      expect(BLITZ_TIME_BONUS).toBe(2);
      expect(BLITZ_TIME_PENALTY).toBe(3);
    });

    it('gera 4 opções distintas com generateOptions', () => {
      const opts = generateOptions(42);
      expect(opts.length).toBe(4);
      expect(opts).toContain(42);
      expect(new Set(opts).size).toBe(4);
    });
  });

  describe('Ajustes Dinâmicos de Tempo (calculateNewTime)', () => {
    it('adiciona +2 segundos em acerto', () => {
      expect(calculateNewTime(40, true)).toBe(42);
      expect(calculateNewTime(58, true)).toBe(60);
      expect(calculateNewTime(0, true)).toBe(BLITZ_TIME_BONUS);
    });

    it('subtrai -3 segundos em erro', () => {
      expect(calculateNewTime(40, false)).toBe(37);
      expect(calculateNewTime(10, false)).toBe(7);
    });

    it('aplica piso (floor) estrito em 0s em erros quando tempo restante é menor que 3s', () => {
      expect(calculateNewTime(2, false)).toBe(0);
      expect(calculateNewTime(1, false)).toBe(0);
      expect(calculateNewTime(0, false)).toBe(0);
      expect(calculateNewTime(0.5, false)).toBe(0);
    });
  });

  describe('Multiplicadores de Combo e Resets (getComboMultiplier & updateCombo)', () => {
    it('mantém multiplicador 1x para 0 a 2 acertos consecutivos', () => {
      expect(getComboMultiplier(0)).toBe(1);
      expect(getComboMultiplier(1)).toBe(1);
      expect(getComboMultiplier(2)).toBe(1);
    });

    it('aplica multiplicador 2x para 3 a 4 acertos consecutivos', () => {
      expect(getComboMultiplier(3)).toBe(2);
      expect(getComboMultiplier(4)).toBe(2);
    });

    it('aplica multiplicador 3x para 5 ou mais acertos consecutivos', () => {
      expect(getComboMultiplier(5)).toBe(3);
      expect(getComboMultiplier(6)).toBe(3);
      expect(getComboMultiplier(15)).toBe(3);
    });

    it('incrementa combo no acerto e zera no erro', () => {
      expect(updateCombo(0, true)).toBe(1);
      expect(updateCombo(4, true)).toBe(5);
      expect(updateCombo(5, false)).toBe(0);
      expect(updateCombo(1, false)).toBe(0);
      expect(updateCombo(0, false)).toBe(0);
    });
  });

  describe('Fórmulas de Pontuação e Cálculo de XP', () => {
    it('calcula o XP do Blitz pela fórmula score * 5 * multiplier', () => {
      // 10 pontos * 5 * 1x = 50 XP
      expect(calculateBlitzXp(10, 1)).toBe(50);
      // 20 pontos * 5 * 2x = 200 XP
      expect(calculateBlitzXp(20, 2)).toBe(200);
      // 30 pontos * 5 * 3x = 450 XP
      expect(calculateBlitzXp(30, 3)).toBe(450);
      // Score zero
      expect(calculateBlitzXp(0, 3)).toBe(0);
    });

    it('calcula XP por questão conforme o multiplicador', () => {
      expect(calculateQuestionXp(10, 1)).toBe(50);
      expect(calculateQuestionXp(10, 2)).toBe(100);
      expect(calculateQuestionXp(10, 3)).toBe(150);
    });

    it('calcula a porcentagem de precisão corretamente', () => {
      expect(calculateAccuracy(10, 10)).toBe(100);
      expect(calculateAccuracy(8, 10)).toBe(80);
      expect(calculateAccuracy(1, 4)).toBe(25);
      expect(calculateAccuracy(0, 5)).toBe(0);
      expect(calculateAccuracy(0, 0)).toBe(0); // Divisão por zero segura
    });
  });

  describe('Transições de Estado Puras (processAnswer)', () => {
    it('processa acerto com incremento de tempo, pontos, combo e totalAnswers', () => {
      const initial = createInitialBlitzState();
      expect(initial.score).toBe(0);
      expect(initial.timeLeft).toBe(60);
      expect(initial.combo).toBe(0);

      const res = processAnswer(initial, true, 10);
      expect(res.timeDelta).toBe(2);
      expect(res.nextState.timeLeft).toBe(62);
      expect(res.nextState.combo).toBe(1);
      expect(res.nextState.score).toBe(10); // 10 * 1
      expect(res.nextState.correctAnswers).toBe(1);
      expect(res.nextState.totalAnswers).toBe(1);
      expect(res.nextState.isGameOver).toBe(false);
    });

    it('processa sequência de acertos e escala multiplicador no score', () => {
      let state = createInitialBlitzState();
      for (let i = 0; i < 3; i++) {
        state = processAnswer(state, true, 10).nextState;
      }
      expect(state.combo).toBe(3);
      // 4º acerto com combo 3 ativa multiplicador 2x: +20 pontos
      const step4 = processAnswer(state, true, 10);
      expect(step4.multiplier).toBe(2);
      expect(step4.pointsEarned).toBe(20);
      expect(step4.nextState.score).toBe(60); // 10 + 10 + 20 + 20 = 60
    });

    it('processa erro com penalidade de tempo e reset de combo', () => {
      const stateWithCombo: typeof createInitialBlitzState extends () => infer S ? S : never = {
        score: 100,
        timeLeft: 30,
        combo: 4,
        maxCombo: 4,
        correctAnswers: 8,
        totalAnswers: 8,
        isGameOver: false,
      };

      const res = processAnswer(stateWithCombo, false, 10);
      expect(res.timeDelta).toBe(-3);
      expect(res.nextState.timeLeft).toBe(27);
      expect(res.nextState.combo).toBe(0);
      expect(res.nextState.maxCombo).toBe(4);
      expect(res.nextState.score).toBe(100);
      expect(res.nextState.correctAnswers).toBe(8);
      expect(res.nextState.totalAnswers).toBe(9);
      expect(res.pointsEarned).toBe(0);
      expect(res.xpEarned).toBe(0);
    });

    it('declara fim de jogo quando tempo esgota após erro', () => {
      const criticalState: typeof createInitialBlitzState extends () => infer S ? S : never = {
        score: 50,
        timeLeft: 2,
        combo: 2,
        maxCombo: 2,
        correctAnswers: 4,
        totalAnswers: 4,
        isGameOver: false,
      };

      const res = processAnswer(criticalState, false, 10);
      expect(res.nextState.timeLeft).toBe(0);
      expect(res.nextState.isGameOver).toBe(true);
    });
  });

  describe('Gerador de Perguntas Aritméticas Rápidas (generateBlitzQuestion)', () => {
    it('gera perguntas com 4 opções distintas contendo a resposta correta', () => {
      for (let i = 0; i < 20; i++) {
        const q = generateBlitzQuestion();
        expect(q.id).toBeDefined();
        expect(q.expression).toBeTruthy();
        expect(q.options.length).toBe(4);

        const uniqueOptions = new Set(q.options);
        expect(uniqueOptions.size).toBe(4);
        expect(q.options).toContain(q.correctAnswer);
        expect(typeof q.correctAnswer).toBe('number');
        expect(isFinite(q.correctAnswer)).toBe(true);
      }
    });

    it('distribui operadores aritméticos fundamentais (+, -, ×, ÷)', () => {
      const seenOperators = new Set<string>();
      for (let i = 0; i < 40; i++) {
        const q = generateBlitzQuestion();
        seenOperators.add(q.operator);
      }
      expect(seenOperators.has('+')).toBe(true);
      expect(seenOperators.has('-')).toBe(true);
      expect(seenOperators.has('×')).toBe(true);
      expect(seenOperators.has('÷')).toBe(true);
    });

    it('garante que divisões nunca geram frações/restos', () => {
      // Gera questões com gerador determinístico simulado ou múltiplas iterações
      for (let i = 0; i < 25; i++) {
        const q = generateBlitzQuestion();
        if (q.operator === '÷') {
          expect(Number.isInteger(q.correctAnswer)).toBe(true);
          expect(q.operand1 % q.operand2).toBe(0);
        }
      }
    });
  });

  describe('Integração com Store Zustand (recordBlitzResult)', () => {
    beforeEach(() => {
      useAppStore.setState({
        profile: {
          totalXp: 0,
          streakDays: 1,
          lastActiveDate: '2026-09-15',
          unlockedAchievements: [],
          stats: {
            totalCalculations: 0,
            totalBhaskara: 0,
            totalRegraDeTres: 0,
            totalQuizCorrect: 0,
            bestSurvivalRecord: 0,
            scratchpadUses: 0,
            dailyChallengesCompleted: 0,
            blitzHighScore: 0,
            blitzMaxCombo: 0,
            bossesDefeated: 0,
            flawlessBossVictories: 0,
            criticalHits: 0,
          },
        },
        toastQueue: [],
      });
    });

    it('atualiza recordes de pontuação, maior combo e XP na store', () => {
      const store = useAppStore.getState();
      store.recordBlitzResult(45, 6, 12, 250);

      const updated = useAppStore.getState();
      expect(updated.profile.stats.blitzHighScore).toBe(45);
      expect(updated.profile.stats.blitzMaxCombo).toBe(6);
      expect(updated.profile.stats.totalQuizCorrect).toBe(12);
      expect(updated.profile.totalXp).toBeGreaterThanOrEqual(250);
    });

    it('desbloqueia conquista blitz_speedster ao atingir pontuação >= 10', () => {
      const store = useAppStore.getState();
      store.recordBlitzResult(12, 3, 5, 80);

      const updated = useAppStore.getState();
      expect(updated.profile.unlockedAchievements).toContain('blitz_speedster');
      expect(updated.toastQueue.some((a) => a.id === 'blitz_speedster')).toBe(true);
    });
  });
});
