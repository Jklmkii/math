import type { AppLanguage, AchievementDef, UserProfile } from '../../types';

export type { AchievementDef };

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
  nextTitle?: string;
  totalXp: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- Habilidade ---
  {
    id: 'first_calculation',
    icon: '🎯',
    title: 'Primeiro Passo',
    titlePt: 'Primeiro Passo',
    titleEn: 'First Step',
    description: 'Realizou seu primeiro cálculo com passo a passo.',
    descriptionPt: 'Realizou seu primeiro cálculo com passo a passo.',
    descriptionEn: 'Completed your first step-by-step calculation.',
    category: 'habilidade',
    xpReward: 50,
    condition: (p) =>
      (p.stats?.totalCalculations || 0) >= 1 ||
      (p.stats?.totalBhaskara || 0) >= 1 ||
      (p.stats?.totalRegraDeTres || 0) >= 1,
  },
  {
    id: 'quiz_starter',
    icon: '⚡',
    title: 'Desafiante',
    titlePt: 'Desafiante',
    titleEn: 'Agile Mind',
    description: 'Acertou 5 questões no modo Treino.',
    descriptionPt: 'Acertou 5 questões no modo Treino.',
    descriptionEn: 'Answered 5 questions correctly in Training.',
    category: 'habilidade',
    xpReward: 100,
    condition: (p) => (p.stats?.totalQuizCorrect || 0) >= 5,
  },
  {
    id: 'blitz_speedster',
    icon: '⏱️',
    title: 'Relâmpago',
    titlePt: 'Relâmpago',
    titleEn: 'Lightning',
    description: 'Alcançou 10 pontos no Modo Blitz.',
    descriptionPt: 'Alcançou 10 pontos no Modo Blitz.',
    descriptionEn: 'Scored 10 points in Blitz mode.',
    category: 'habilidade',
    xpReward: 150,
    condition: (p) => (p.stats?.blitzHighScore || 0) >= 10,
  },
  {
    id: 'crit_master',
    icon: '💥',
    title: 'Precisão Cirúrgica',
    titlePt: 'Precisão Cirúrgica',
    titleEn: 'Surgical Precision',
    description: 'Acertou um golpe crítico em menos de 3s no Chefe.',
    descriptionPt: 'Acertou um golpe crítico em menos de 3s no Chefe.',
    descriptionEn: 'Landed a critical hit in under 3s on the Boss.',
    category: 'habilidade',
    xpReward: 150,
    condition: (p) => (p.stats?.criticalHits || 0) >= 1 || (p.stats?.bossesDefeated || 0) >= 1,
  },

  // --- Consistência ---
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'Foco Constante',
    titlePt: 'Foco Constante',
    titleEn: 'Constant Focus',
    description: 'Manteve 3 dias consecutivos de ofensiva.',
    descriptionPt: 'Manteve 3 dias consecutivos de ofensiva.',
    descriptionEn: 'Maintained a 3-day daily streak.',
    category: 'consistencia',
    xpReward: 150,
    condition: (p) => (p.streakDays || 0) >= 3,
  },
  {
    id: 'streak_7',
    icon: '🏆',
    title: 'Hábito de Aço',
    titlePt: 'Hábito de Aço',
    titleEn: 'Steel Habit',
    description: 'Manteve 7 dias consecutivos de ofensiva.',
    descriptionPt: 'Manteve 7 dias consecutivos de ofensiva.',
    descriptionEn: 'Maintained a 7-day daily streak.',
    category: 'consistencia',
    xpReward: 300,
    condition: (p) => (p.streakDays || 0) >= 7,
  },
  {
    id: 'daily_starter',
    icon: '📅',
    title: 'Compromisso Diário',
    titlePt: 'Compromisso Diário',
    titleEn: 'Daily Commitment',
    description: 'Completou seu primeiro Desafio Diário.',
    descriptionPt: 'Completou seu primeiro Desafio Diário.',
    descriptionEn: 'Completed your first Daily Challenge.',
    category: 'consistencia',
    xpReward: 150,
    condition: (p) => (p.stats?.dailyChallengesCompleted || 0) >= 1,
  },
  {
    id: 'daily_champion',
    icon: '👑',
    title: 'Guardião da Rotina',
    titlePt: 'Guardião da Rotina',
    titleEn: 'Routine Guardian',
    description: 'Completou 5 Desafios Diários.',
    descriptionPt: 'Completou 5 Desafios Diários.',
    descriptionEn: 'Completed 5 Daily Challenges.',
    category: 'consistencia',
    xpReward: 300,
    condition: (p) => (p.stats?.dailyChallengesCompleted || 0) >= 5,
  },

  // --- Mestria ---
  {
    id: 'bhaskara_master',
    icon: '📐',
    title: 'Mestre de Bhaskara',
    titlePt: 'Mestre de Bhaskara',
    titleEn: 'Bhaskara Master',
    description: 'Resolveu 5 equações de segundo grau com Bhaskara.',
    descriptionPt: 'Resolveu 5 equações de segundo grau com Bhaskara.',
    descriptionEn: 'Solved 5 quadratic equations using Bhaskara.',
    category: 'mestria',
    xpReward: 100,
    condition: (p) => (p.stats?.totalBhaskara || 0) >= 5,
  },
  {
    id: 'rule_three_expert',
    icon: '⚖️',
    title: 'Especialista em Proporção',
    titlePt: 'Especialista em Proporção',
    titleEn: 'Proportion Expert',
    description: 'Resolveu 5 problemas de Regra de Três.',
    descriptionPt: 'Resolveu 5 problemas de Regra de Três.',
    descriptionEn: 'Solved 5 Rule of Three problems.',
    category: 'mestria',
    xpReward: 100,
    condition: (p) => (p.stats?.totalRegraDeTres || 0) >= 5,
  },
  {
    id: 'level_5',
    icon: '🌟',
    title: 'Aprendiz Dedicado',
    titlePt: 'Aprendiz Dedicado',
    titleEn: 'Dedicated Apprentice',
    description: 'Alcançou o Nível 5 de Perfil.',
    descriptionPt: 'Alcançou o Nível 5 de Perfil.',
    descriptionEn: 'Reached Profile Level 5.',
    category: 'mestria',
    xpReward: 250,
    condition: (p) => calculateLevelInfo(p.totalXp || 0).level >= 5,
  },
  {
    id: 'level_10',
    icon: '👑',
    title: 'Mestre dos Números',
    titlePt: 'Mestre dos Números',
    titleEn: 'Master of Numbers',
    description: 'Alcançou o Nível 10 de Perfil.',
    descriptionPt: 'Mestre dos Números',
    descriptionEn: 'Reached Profile Level 10.',
    category: 'mestria',
    xpReward: 500,
    condition: (p) => calculateLevelInfo(p.totalXp || 0).level >= 10,
  },

  // --- Desafios ---
  {
    id: 'survival_10',
    icon: '🛡️',
    title: 'Sobrevivente',
    titlePt: 'Sobrevivente',
    titleEn: 'Survivor',
    description: 'Alcançou a conta #10 no modo Sobrevivência.',
    descriptionPt: 'Alcançou a conta #10 no modo Sobrevivência.',
    descriptionEn: 'Reached problem #10 in Survival mode.',
    category: 'desafios',
    xpReward: 200,
    condition: (p) => (p.stats?.bestSurvivalRecord || 0) >= 10,
  },
  {
    id: 'scratchpad_thinker',
    icon: '✏️',
    title: 'Mente Criativa',
    titlePt: 'Mente Criativa',
    titleEn: 'Creative Mind',
    description: 'Utilizou a lousa de rascunho 3 vezes.',
    descriptionPt: 'Utilizou a lousa de rascunho 3 vezes.',
    descriptionEn: 'Used the scratchpad 3 times.',
    category: 'desafios',
    xpReward: 100,
    condition: (p) => (p.stats?.scratchpadUses || 0) >= 3,
  },
  {
    id: 'boss_slayer',
    icon: '⚔️',
    title: 'Matador de Chefes',
    titlePt: 'Matador de Chefes',
    titleEn: 'Boss Slayer',
    description: 'Derrotou o Chefe no Modo Batalha de Chefe.',
    descriptionPt: 'Derrotou o Chefe no Modo Batalha de Chefe.',
    descriptionEn: 'Defeated the Boss in Boss Rush mode.',
    category: 'desafios',
    xpReward: 250,
    condition: (p) => (p.stats?.bossesDefeated || 0) >= 1,
  },
  {
    id: 'boss_flawless',
    icon: '💎',
    title: 'Invicto',
    titlePt: 'Invicto',
    titleEn: 'Flawless',
    description: 'Derrotou o Chefe sem perder escudos.',
    descriptionPt: 'Derrotou o Chefe sem perder escudos.',
    descriptionEn: 'Defeated the Boss without taking shield damage.',
    category: 'desafios',
    xpReward: 350,
    condition: (p) => (p.stats?.flawlessBossVictories || 0) >= 1,
  },
];

/**
 * Retorna o título do jogador de acordo com o nível e idioma.
 */
export function getTitleForLevel(level: number, lang: AppLanguage = 'pt'): string {
  if (lang === 'en') {
    if (level < 5) return 'Pythagoras Apprentice';
    if (level < 10) return 'Euclidean Explorer';
    if (level < 20) return 'Swift Calculator';
    if (level < 35) return 'Cartesian Architect';
    if (level < 50) return 'Master of Gauss';
    return 'Oracle of Numbers';
  }

  if (level < 5) return 'Aprendiz de Pitágoras';
  if (level < 10) return 'Explorador de Euclides';
  if (level < 20) return 'Calculista Ágil';
  if (level < 35) return 'Arquiteto de Descartes';
  if (level < 50) return 'Mestre de Gauss';
  return 'Oráculo dos Números';
}

/**
 * Retorna a quantidade total de XP acumulada necessária para atingir um determinado nível.
 * Fórmula balanceada:
 * Nível 1: 0 XP
 * Nível 2: 100 XP
 * Nível 3: 250 XP
 * Nível 4: 450 XP
 * Nível 5: 700 XP
 * Nível L: 50 * (L - 1)^1.4 aproximado por degraus suaves
 */
export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  // Progressão quadrática suave: 50 * level * (level - 1)
  return Math.floor(50 * level * (level - 1));
}

/**
 * Calcula os detalhes completos de nível e progresso a partir do XP total acumulado.
 */
export function calculateLevelInfo(totalXp: number, lang: AppLanguage = 'pt'): LevelInfo {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;

  while (getXpRequiredForLevel(level + 1) <= safeXp) {
    level++;
  }

  const currentLevelBaseXp = getXpRequiredForLevel(level);
  const nextLevelBaseXp = getXpRequiredForLevel(level + 1);
  const xpNeeded = nextLevelBaseXp - currentLevelBaseXp;
  const currentLevelProgressXp = safeXp - currentLevelBaseXp;

  const progressPercent = xpNeeded > 0
    ? Math.min(100, Math.max(0, Math.floor((currentLevelProgressXp / xpNeeded) * 100)))
    : 100;

  return {
    level,
    currentLevelXp: currentLevelProgressXp,
    xpForNextLevel: xpNeeded,
    progressPercent,
    title: getTitleForLevel(level, lang),
    nextTitle: getTitleForLevel(level + 1, lang) !== getTitleForLevel(level, lang)
      ? getTitleForLevel(level + 1, lang)
      : undefined,
    totalXp: safeXp,
  };
}

/**
 * Calcula a atualização de streak diário dado a última data ativa (YYYY-MM-DD) e a data atual.
 */
export function calculateStreakUpdate(
  lastActiveDate: string | null | undefined,
  currentStreak: number = 0,
  todayIso: string = new Date().toISOString().split('T')[0]
): { newStreak: number; newLastActiveDate: string; isStreakIncremented: boolean } {
  if (!lastActiveDate) {
    return {
      newStreak: 1,
      newLastActiveDate: todayIso,
      isStreakIncremented: true,
    };
  }

  if (lastActiveDate === todayIso) {
    return {
      newStreak: Math.max(1, currentStreak),
      newLastActiveDate: todayIso,
      isStreakIncremented: false,
    };
  }

  const lastDate = new Date(lastActiveDate + 'T00:00:00Z');
  const currentDate = new Date(todayIso + 'T00:00:00Z');
  const diffTime = currentDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Dia consecutivo perfeito
    return {
      newStreak: (currentStreak || 0) + 1,
      newLastActiveDate: todayIso,
      isStreakIncremented: true,
    };
  } else if (diffDays > 1) {
    // Perdeu o streak, recomeça em 1
    return {
      newStreak: 1,
      newLastActiveDate: todayIso,
      isStreakIncremented: false,
    };
  }

  return {
    newStreak: Math.max(1, currentStreak),
    newLastActiveDate: todayIso,
    isStreakIncremented: false,
  };
}

/**
 * Avalia o perfil e estatísticas e retorna os IDs das novas conquistas desbloqueadas
 */
export function checkNewAchievements(profile: UserProfile): string[] {
  const unlocked = new Set(profile.unlockedAchievements || []);
  const newUnlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (!unlocked.has(ach.id) && typeof ach.condition === 'function' && ach.condition(profile)) {
      newUnlocked.push(ach.id);
    }
  }

  return newUnlocked;
}
