import { describe, it, expect } from 'vitest';
import {
  calculateLevelInfo,
  calculateStreakUpdate,
  checkNewAchievements,
  getXpRequiredForLevel,
  getTitleForLevel,
} from '../core/gamification/leveling';
import type { UserProfile } from '../types';

describe('Gamificação & Nível de Perfil', () => {
  it('calcula corretamente o XP requerido por nível', () => {
    expect(getXpRequiredForLevel(1)).toBe(0);
    expect(getXpRequiredForLevel(2)).toBe(100);
    expect(getXpRequiredForLevel(3)).toBe(300);
    expect(getXpRequiredForLevel(4)).toBe(600);
    expect(getXpRequiredForLevel(5)).toBe(1000);
  });

  it('determina o título correto para cada faixa de nível em PT e EN', () => {
    expect(getTitleForLevel(1, 'pt')).toBe('Aprendiz de Pitágoras');
    expect(getTitleForLevel(1, 'en')).toBe('Pythagoras Apprentice');

    expect(getTitleForLevel(6, 'pt')).toBe('Explorador de Euclides');
    expect(getTitleForLevel(6, 'en')).toBe('Euclidean Explorer');

    expect(getTitleForLevel(12, 'pt')).toBe('Calculista Ágil');
    expect(getTitleForLevel(12, 'en')).toBe('Swift Calculator');

    expect(getTitleForLevel(25, 'pt')).toBe('Arquiteto de Descartes');
    expect(getTitleForLevel(25, 'en')).toBe('Cartesian Architect');

    expect(getTitleForLevel(40, 'pt')).toBe('Mestre de Gauss');
    expect(getTitleForLevel(40, 'en')).toBe('Master of Gauss');

    expect(getTitleForLevel(55, 'pt')).toBe('Oráculo dos Números');
    expect(getTitleForLevel(55, 'en')).toBe('Oracle of Numbers');
  });

  it('calcula o progresso de nível a partir do XP acumulado', () => {
    const info0 = calculateLevelInfo(0, 'pt');
    expect(info0.level).toBe(1);
    expect(info0.progressPercent).toBe(0);
    expect(info0.currentLevelXp).toBe(0);
    expect(info0.xpForNextLevel).toBe(100);

    const info50 = calculateLevelInfo(50, 'pt');
    expect(info50.level).toBe(1);
    expect(info50.progressPercent).toBe(50);

    const info100 = calculateLevelInfo(100, 'pt');
    expect(info100.level).toBe(2);
    expect(info100.currentLevelXp).toBe(0);
    expect(info100.xpForNextLevel).toBe(200); // 300 - 100 = 200

    const info200 = calculateLevelInfo(200, 'pt');
    expect(info200.level).toBe(2);
    expect(info200.progressPercent).toBe(50); // 100 / 200 = 50%
  });

  describe('Lógica de Ofensiva Diária (Streak)', () => {
    it('inicia com 1 dia no primeiro acesso', () => {
      const res = calculateStreakUpdate(null, 0, '2026-09-10');
      expect(res.newStreak).toBe(1);
      expect(res.newLastActiveDate).toBe('2026-09-10');
      expect(res.isStreakIncremented).toBe(true);
    });

    it('mantém o mesmo streak no mesmo dia', () => {
      const res = calculateStreakUpdate('2026-09-10', 3, '2026-09-10');
      expect(res.newStreak).toBe(3);
      expect(res.isStreakIncremented).toBe(false);
    });

    it('incrementa a ofensiva em dias consecutivos', () => {
      const res = calculateStreakUpdate('2026-09-09', 3, '2026-09-10');
      expect(res.newStreak).toBe(4);
      expect(res.isStreakIncremented).toBe(true);
    });

    it('reinicia para 1 dia se houver interrupção de 2 ou mais dias', () => {
      const res = calculateStreakUpdate('2026-09-07', 5, '2026-09-10');
      expect(res.newStreak).toBe(1);
      expect(res.isStreakIncremented).toBe(false);
    });
  });

  describe('Desbloqueio de Conquistas (Achievements)', () => {
    const baseProfile: UserProfile = {
      totalXp: 0,
      streakDays: 1,
      lastActiveDate: '2026-09-10',
      unlockedAchievements: [],
      stats: {
        totalCalculations: 0,
        totalBhaskara: 0,
        totalRegraDeTres: 0,
        totalQuizCorrect: 0,
        bestSurvivalRecord: 0,
      },
    };

    it('desbloqueia Primeiro Passo após o primeiro cálculo', () => {
      const profile = {
        ...baseProfile,
        stats: { ...baseProfile.stats, totalCalculations: 1 },
      };
      const unlocked = checkNewAchievements(profile);
      expect(unlocked).toContain('first_calculation');
    });

    it('desbloqueia Mestre da Parábola ao atingir 5 cálculos de Bhaskara', () => {
      const profile = {
        ...baseProfile,
        stats: { ...baseProfile.stats, totalBhaskara: 5 },
      };
      const unlocked = checkNewAchievements(profile);
      expect(unlocked).toContain('bhaskara_master');
    });

    it('desbloqueia Sobrevivente ao atingir a conta #10', () => {
      const profile = {
        ...baseProfile,
        stats: { ...baseProfile.stats, bestSurvivalRecord: 10 },
      };
      const unlocked = checkNewAchievements(profile);
      expect(unlocked).toContain('survival_10');
    });

    it('não desbloqueia novamente conquistas que já foram conquistadas', () => {
      const profile = {
        ...baseProfile,
        unlockedAchievements: ['first_calculation', 'bhaskara_master'],
        stats: { ...baseProfile.stats, totalCalculations: 10, totalBhaskara: 10 },
      };
      const unlocked = checkNewAchievements(profile);
      expect(unlocked).not.toContain('first_calculation');
      expect(unlocked).not.toContain('bhaskara_master');
    });
  });
});
