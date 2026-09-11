import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDailyChallenge,
  formatDailyShareText,
  getTimeUntilMidnight,
  getTodayDateString,
  hashDateStringToSeed,
  SeededPRNG,
} from '../core/daily/dailyEngine';
import { useAppStore } from '../store/useAppStore';

describe('Motor de Desafio Diário (dailyEngine)', () => {
  describe('Hash e PRNG Determinístico', () => {
    it('gera formato ISO local YYYY-MM-DD com getTodayDateString', () => {
      const today = getTodayDateString(new Date('2026-09-15T12:00:00'));
      expect(today).toBe('2026-09-15');
    });

    it('gera seed idêntica para a mesma string de data com hashDateStringToSeed', () => {
      const seed1 = hashDateStringToSeed('2026-09-15');
      const seed2 = hashDateStringToSeed('2026-09-15');
      expect(seed1).toBe(seed2);
      expect(typeof seed1).toBe('number');
    });

    it('produz sequência idêntica com SeededPRNG dada a mesma seed', () => {
      const seed = hashDateStringToSeed('2026-09-15');
      const rng1 = new SeededPRNG(seed);
      const rng2 = new SeededPRNG(seed);

      expect(rng1.next()).toBe(rng2.next());
      expect(rng1.nextInt(10, 50)).toBe(rng2.nextInt(10, 50));
      expect(rng1.shuffle([1, 2, 3, 4, 5])).toEqual(rng2.shuffle([1, 2, 3, 4, 5]));
    });
  });

  describe('Gerador Determinístico por Data (YYYY-MM-DD)', () => {
    it('gera exatamente o mesmo problema para a mesma data em múltiplas invocações', () => {
      const date = '2026-09-15';
      const run1 = getDailyChallenge(date);
      const run2 = getDailyChallenge(date);
      const run3 = getDailyChallenge(date);

      expect(run1.id).toBe(run2.id);
      expect(run1.question).toBe(run2.question);
      expect(run1.displayExpression).toBe(run2.displayExpression);
      expect(run1.correctAnswer).toBe(run2.correctAnswer);
      expect(run1.options).toEqual(run2.options);
      expect(run1.explanation).toEqual(run2.explanation);
      expect(run1.category).toBe(run2.category);

      expect(run2.id).toBe(run3.id);
      expect(run2.correctAnswer).toBe(run3.correctAnswer);
      expect(run2.options).toEqual(run3.options);
    });

    it('gera desafios distintos para datas diferentes', () => {
      const challengeDay1 = getDailyChallenge('2026-03-01');
      const challengeDay2 = getDailyChallenge('2026-03-02');
      const challengeDay3 = getDailyChallenge('2026-03-03');

      expect(challengeDay1.id).not.toBe(challengeDay2.id);
      expect(challengeDay2.id).not.toBe(challengeDay3.id);

      // Pelo menos a expressão ou a resposta esperada varia entre datas consecutivas
      const isDifferent =
        challengeDay1.displayExpression !== challengeDay2.displayExpression ||
        challengeDay1.correctAnswer !== challengeDay2.correctAnswer;
      expect(isDifferent).toBe(true);
    });

    it('lida com anos bissextos e viradas de mês/ano', () => {
      const leapDay = getDailyChallenge('2024-02-29');
      expect(leapDay.date).toBe('2024-02-29');
      expect(leapDay.options.length).toBe(4);
      expect(leapDay.options).toContain(leapDay.correctAnswer);

      const yearEnd = getDailyChallenge('2026-12-31');
      expect(yearEnd.date).toBe('2026-12-31');
      expect(yearEnd.options.length).toBe(4);
      expect(yearEnd.options).toContain(yearEnd.correctAnswer);

      const yearStart = getDailyChallenge('2027-01-01');
      expect(yearStart.date).toBe('2027-01-01');
      expect(yearStart.options.length).toBe(4);
      expect(yearStart.options).toContain(yearStart.correctAnswer);
    });

    it('produz 4 opções numéricas distintas contendo a resposta correta', () => {
      const dates = [
        '2026-01-10',
        '2026-04-15',
        '2026-07-20',
        '2026-10-05',
        '2026-11-11',
      ];

      for (const d of dates) {
        const c = getDailyChallenge(d);
        expect(c.options.length).toBe(4);
        const uniqueSet = new Set(c.options);
        expect(uniqueSet.size).toBe(4);
        expect(c.options).toContain(c.correctAnswer);
        expect(c.options.every((n) => typeof n === 'number' && !isNaN(n))).toBe(true);
        expect(c.xpReward).toBe(150);
      }
    });

    it('fallback seguro quando dateStr for vazio ou nulo', () => {
      const empty = getDailyChallenge('');
      expect(empty).toBeDefined();
      expect(empty.options.length).toBe(4);
      expect(empty.options).toContain(empty.correctAnswer);
    });
  });

  describe('Formatação de Compartilhamento (formatDailyShareText)', () => {
    it('formata corretamente o texto para acerto com emojis e streak', () => {
      const text = formatDailyShareText('2026-09-15', true, 5);
      expect(text).toContain('MathUtils');
      expect(text).toContain('2026-09-15');
      expect(text).toContain('✅ Acertou!');
      expect(text).toContain('🔥 Sequência: 5 dias');
      expect(text).toContain('mathutils.app');
    });

    it('formata corretamente o texto para erro com emojis e streak', () => {
      const text = formatDailyShareText('2026-09-15', false, 1);
      expect(text).toContain('MathUtils');
      expect(text).toContain('2026-09-15');
      expect(text).toContain('❌');
      expect(text).toContain('🔥 Sequência: 1 dias');
    });
  });

  describe('Cálculo de Tempo até a Meia-Noite (getTimeUntilMidnight)', () => {
    it('retorna horas, minutos e segundos válidos até a meia-noite', () => {
      const mockTime = new Date('2026-09-15T22:30:00');
      const time = getTimeUntilMidnight(mockTime);

      expect(time.hours).toBe(1);
      expect(time.minutes).toBe(30);
      expect(time.seconds).toBe(0);
      expect(time.totalSeconds).toBe(5400);
      expect(time.formatted).toBe('01:30:00');
    });

    it('formata com zeros à esquerda corretamente', () => {
      const mockTime = new Date('2026-09-15T23:55:07');
      const time = getTimeUntilMidnight(mockTime);

      expect(time.hours).toBe(0);
      expect(time.minutes).toBe(4);
      expect(time.seconds).toBe(53);
      expect(time.formatted).toBe('00:04:53');
    });
  });

  describe('Integração com a Store Zustand (completeDailyChallenge)', () => {
    beforeEach(() => {
      useAppStore.setState({
        profile: {
          totalXp: 0,
          streakDays: 1,
          lastActiveDate: '2026-09-14',
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
        dailyChallenge: {
          lastCompletedDate: null,
          history: [],
        },
        toastQueue: [],
      });
    });

    it('atribui +150 XP, avança streak e registra data ao completar desafio diário', () => {
      const store = useAppStore.getState();
      const testDate = '2026-09-15';

      store.completeDailyChallenge(testDate, 150);

      const updated = useAppStore.getState();
      expect(updated.dailyChallenge.lastCompletedDate).toBe(testDate);
      expect(updated.dailyChallenge.history.length).toBe(1);
      expect(updated.dailyChallenge.history[0].date).toBe(testDate);
      expect(updated.dailyChallenge.history[0].score).toBe(150);

      // +150 XP do desafio diário + bônus de conquista daily_starter se desbloqueada
      expect(updated.profile.totalXp).toBeGreaterThanOrEqual(150);
      expect(updated.profile.stats.dailyChallengesCompleted).toBe(1);
      expect(updated.profile.streakDays).toBe(2); // De 14 para 15 é consecutivo (+1)
    });

    it('desbloqueia conquista daily_starter no primeiro desafio concluído', () => {
      const store = useAppStore.getState();
      store.completeDailyChallenge('2026-09-15', 150);

      const updated = useAppStore.getState();
      expect(updated.profile.unlockedAchievements).toContain('daily_starter');
      expect(updated.toastQueue.some((a) => a.id === 'daily_starter')).toBe(true);
    });
  });
});
