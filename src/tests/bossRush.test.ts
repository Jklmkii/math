import { describe, it, expect, beforeEach } from 'vitest';
import {
  BOSS_INITIAL_HP,
  PLAYER_INITIAL_SHIELDS,
  ROUND_TIME_LIMIT_SECONDS,
  CRITICAL_TIME_THRESHOLD_SECONDS,
  BASE_VICTORY_XP,
  STANDARD_DAMAGE_MIN,
  STANDARD_DAMAGE_MAX,
  CRITICAL_DAMAGE_MIN,
  CRITICAL_DAMAGE_MAX,
  calculateBossDamage,
  checkVictoryAndDefeat,
  calculateVictoryRewards,
  checkAnswerCorrectness,
  createInitialBossBattleState,
  processRound,
  generateBossQuestion,
} from '../core/quiz/bossEngine';
import { useAppStore } from '../store/useAppStore';

describe('Batalha de Chefe Matemático (bossEngine)', () => {
  describe('Constantes e Estado Inicial', () => {
    it('inicia o chefe com exatamente 100 HP e o jogador com 3 escudos', () => {
      expect(BOSS_INITIAL_HP).toBe(100);
      expect(PLAYER_INITIAL_SHIELDS).toBe(3);
      expect(ROUND_TIME_LIMIT_SECONDS).toBe(10);
      expect(CRITICAL_TIME_THRESHOLD_SECONDS).toBe(3);
      expect(BASE_VICTORY_XP).toBe(250);

      const state = createInitialBossBattleState();
      expect(state.bossHp).toBe(100);
      expect(state.bossMaxHp).toBe(100);
      expect(state.shields).toBe(3);
      expect(state.maxShields).toBe(3);
      expect(state.round).toBe(1);
      expect(state.status).toBe('fighting');
      expect(state.history).toEqual([]);
      expect(state.currentQuestion).toBeDefined();
    });
  });

  describe('Lógica de Dano e Golpes Críticos (calculateBossDamage)', () => {
    it('desfere Golpe Crítico (30-35 dano) quando tempo de resposta for < 3s', () => {
      // Testa várias respostas rápidas (< 3.0s)
      const times = [0.5, 1.2, 2.0, 2.8, 2.99];

      for (const t of times) {
        const res = calculateBossDamage(true, t);
        expect(res.isCritical).toBe(true);
        expect(res.damage).toBeGreaterThanOrEqual(CRITICAL_DAMAGE_MIN);
        expect(res.damage).toBeLessThanOrEqual(CRITICAL_DAMAGE_MAX);
        expect(res.shieldDamage).toBe(0);
        expect(res.reason).toBe('critical');
      }
    });

    it('desfere Golpe Padrão (15-20 dano) quando tempo de resposta for de 3s a 10s', () => {
      const times = [3.0, 3.5, 5.0, 7.2, 9.9, 10.0];

      for (const t of times) {
        const res = calculateBossDamage(true, t);
        expect(res.isCritical).toBe(false);
        expect(res.damage).toBeGreaterThanOrEqual(STANDARD_DAMAGE_MIN);
        expect(res.damage).toBeLessThanOrEqual(STANDARD_DAMAGE_MAX);
        expect(res.shieldDamage).toBe(0);
        expect(res.reason).toBe('standard');
      }
    });

    it('aplica dano customizado especificado por parâmetro determinístico', () => {
      const crit = calculateBossDamage(true, 1.5, 33);
      expect(crit.isCritical).toBe(true);
      expect(crit.damage).toBe(33);

      const standard = calculateBossDamage(true, 4.0, 18);
      expect(standard.isCritical).toBe(false);
      expect(standard.damage).toBe(18);
    });
  });

  describe('Lógica de Penalidade: Erro e Timeout (> 10s)', () => {
    it('quando a resposta é incorreta, causa 0 dano ao chefe e remove 1 escudo', () => {
      const res = calculateBossDamage(false, 1.5);
      expect(res.damage).toBe(0);
      expect(res.shieldDamage).toBe(1);
      expect(res.isCritical).toBe(false);
      expect(res.reason).toBe('wrong');
    });

    it('quando o tempo excede 10s (timeout), causa 0 dano ao chefe e remove 1 escudo', () => {
      const res = calculateBossDamage(true, 10.1);
      expect(res.damage).toBe(0);
      expect(res.shieldDamage).toBe(1);
      expect(res.isCritical).toBe(false);
      expect(res.reason).toBe('timeout');
    });

    it('erro combinado com timeout também penaliza 1 escudo', () => {
      const res = calculateBossDamage(false, 12.0);
      expect(res.damage).toBe(0);
      expect(res.shieldDamage).toBe(1);
      expect(res.isCritical).toBe(false);
      expect(res.reason).toBe('wrong');
    });
  });

  describe('Condições de Vitória e Derrota (checkVictoryAndDefeat)', () => {
    it('declara vitória quando o HP do chefe zera ou fica negativo', () => {
      expect(checkVictoryAndDefeat(0, 3)).toEqual({
        isVictory: true,
        isDefeat: false,
        status: 'victory',
      });
      expect(checkVictoryAndDefeat(-15, 1)).toEqual({
        isVictory: true,
        isDefeat: false,
        status: 'victory',
      });
    });

    it('declara derrota quando os escudos do jogador zeram', () => {
      expect(checkVictoryAndDefeat(45, 0)).toEqual({
        isVictory: false,
        isDefeat: true,
        status: 'defeat',
      });
      expect(checkVictoryAndDefeat(80, -1)).toEqual({
        isVictory: false,
        isDefeat: true,
        status: 'defeat',
      });
    });

    it('mantém combate ativo enquanto Chefe HP > 0 e Escudos > 0', () => {
      expect(checkVictoryAndDefeat(100, 3)).toEqual({
        isVictory: false,
        isDefeat: false,
        status: 'fighting',
      });
      expect(checkVictoryAndDefeat(20, 1)).toEqual({
        isVictory: false,
        isDefeat: false,
        status: 'fighting',
      });
    });
  });

  describe('Recompensas de Vitória e Conquistas (calculateVictoryRewards)', () => {
    it('concede +250 XP e conquista boss_slayer na vitória padrão', () => {
      const rewards = calculateVictoryRewards(2, 3);
      expect(rewards.xpEarned).toBe(250);
      expect(rewards.unlockedAchievements).toContain('boss_slayer');
      expect(rewards.unlockedAchievements).not.toContain('boss_flawless');
      expect(rewards.isFlawless).toBe(false);
    });

    it('concede vitória impecável (boss_flawless) se todos os 3 escudos permanecerem intactos', () => {
      const rewards = calculateVictoryRewards(3, 3);
      expect(rewards.xpEarned).toBe(250);
      expect(rewards.isFlawless).toBe(true);
      expect(rewards.unlockedAchievements).toContain('boss_slayer');
      expect(rewards.unlockedAchievements).toContain('boss_flawless');
    });
  });

  describe('Verificação de Respostas (checkAnswerCorrectness)', () => {
    it('suporta números, strings com vírgula ou ponto', () => {
      expect(checkAnswerCorrectness(12, 12)).toBe(true);
      expect(checkAnswerCorrectness('12', 12)).toBe(true);
      expect(checkAnswerCorrectness('12.0', 12)).toBe(true);
      expect(checkAnswerCorrectness('12,0', 12)).toBe(true);
      expect(checkAnswerCorrectness(13, 12)).toBe(false);
      expect(checkAnswerCorrectness('abc', 12)).toBe(false);
    });
  });

  describe('Transições de Rodada Completas (processRound)', () => {
    it('reduz vida do chefe e avança rodada no acerto', () => {
      const initial = createInitialBossBattleState();
      const { nextState, roundResult } = processRound(
        initial,
        initial.currentQuestion.correctAnswer,
        2.0, // rápido -> crítico
        35
      );

      expect(roundResult.isCorrect).toBe(true);
      expect(roundResult.damageResult.isCritical).toBe(true);
      expect(roundResult.damageResult.damage).toBe(35);
      expect(nextState.bossHp).toBe(65);
      expect(nextState.shields).toBe(3);
      expect(nextState.round).toBe(2);
      expect(nextState.status).toBe('fighting');
      expect(nextState.history.length).toBe(1);
    });

    it('reduz escudos do jogador em caso de erro', () => {
      const initial = createInitialBossBattleState();
      const wrongAnswer = initial.currentQuestion.correctAnswer + 999;
      const { nextState, roundResult } = processRound(initial, wrongAnswer, 4.0);

      expect(roundResult.isCorrect).toBe(false);
      expect(roundResult.damageResult.shieldDamage).toBe(1);
      expect(nextState.bossHp).toBe(100);
      expect(nextState.shields).toBe(2);
      expect(nextState.errorsCount).toBe(1);
      expect(nextState.status).toBe('fighting');
    });

    it('encaminha para vitória quando chefe recebe dano fatal', () => {
      const nearDeathState: typeof createInitialBossBattleState extends () => infer S ? S : never = {
        ...createInitialBossBattleState(),
        bossHp: 20,
        shields: 3,
      };

      const { nextState, roundResult } = processRound(
        nearDeathState,
        nearDeathState.currentQuestion.correctAnswer,
        1.5,
        30
      );

      expect(nextState.bossHp).toBe(0);
      expect(nextState.status).toBe('victory');
      expect(roundResult.isVictory).toBe(true);
      expect(nextState.earnedXp).toBe(250);
      expect(nextState.unlockedAchievements).toContain('boss_slayer');
      expect(nextState.unlockedAchievements).toContain('boss_flawless');
    });

    it('encaminha para derrota quando jogador perde o último escudo', () => {
      const lastShieldState: typeof createInitialBossBattleState extends () => infer S ? S : never = {
        ...createInitialBossBattleState(),
        bossHp: 80,
        shields: 1,
      };

      const { nextState, roundResult } = processRound(
        lastShieldState,
        lastShieldState.currentQuestion.correctAnswer + 50,
        4.0
      );

      expect(nextState.shields).toBe(0);
      expect(nextState.status).toBe('defeat');
      expect(roundResult.isDefeat).toBe(true);
    });
  });

  describe('Gerador de Perguntas do Chefe (generateBossQuestion)', () => {
    it('gera perguntas válidas com 4 opções distintas contendo a resposta correta', () => {
      for (let r = 1; r <= 10; r++) {
        const q = generateBossQuestion(r);
        expect(q.id).toBeDefined();
        expect(q.prompt).toBeTruthy();
        expect(q.displayExpression).toBeTruthy();
        expect(q.options.length).toBe(4);

        const unique = new Set(q.options);
        expect(unique.size).toBe(4);
        expect(q.options).toContain(q.correctAnswer);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integração com a Store Zustand (recordBossVictory)', () => {
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

    it('registra vitória do chefe, incrementa bossesDefeated e concede XP na store', () => {
      const store = useAppStore.getState();
      store.recordBossVictory(45, 2, 250);

      const updated = useAppStore.getState();
      expect(updated.profile.stats.bossesDefeated).toBe(1);
      expect(updated.profile.stats.flawlessBossVictories).toBe(0);
      expect(updated.profile.totalXp).toBeGreaterThanOrEqual(250);
      expect(updated.profile.unlockedAchievements).toContain('boss_slayer');
    });

    it('registra vitória impecável (flawless) e desbloqueia boss_flawless na store com 3 escudos', () => {
      const store = useAppStore.getState();
      store.recordBossVictory(30, 3, 250);

      const updated = useAppStore.getState();
      expect(updated.profile.stats.bossesDefeated).toBe(1);
      expect(updated.profile.stats.flawlessBossVictories).toBe(1);
      expect(updated.profile.unlockedAchievements).toContain('boss_slayer');
      expect(updated.profile.unlockedAchievements).toContain('boss_flawless');
      expect(updated.toastQueue.some((a) => a.id === 'boss_flawless')).toBe(true);
    });
  });
});
