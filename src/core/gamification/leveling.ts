import type { AppLanguage } from '../../types';

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
  title: string;
  nextTitle?: string;
  totalXp: number;
}

export interface AchievementDef {
  id: string;
  icon: string;
  titlePt: string;
  titleEn: string;
  descriptionPt: string;
  descriptionEn: string;
  xpReward: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_calculation',
    icon: '🎯',
    titlePt: 'Primeiro Passo',
    titleEn: 'First Step',
    descriptionPt: 'Realizou seu primeiro cálculo com passo a passo.',
    descriptionEn: 'Completed your first step-by-step calculation.',
    xpReward: 50,
  },
  {
    id: 'bhaskara_master',
    icon: '📐',
    titlePt: 'Mestre da Parábola',
    titleEn: 'Parabola Master',
    descriptionPt: 'Resolveu 5 equações de segundo grau com Bhaskara.',
    descriptionEn: 'Solved 5 quadratic equations using Bhaskara.',
    xpReward: 100,
  },
  {
    id: 'rule_three_expert',
    icon: '⚖️',
    titlePt: 'Mestre da Proporção',
    titleEn: 'Proportion Master',
    descriptionPt: 'Resolveu 5 problemas de Regra de Três.',
    descriptionEn: 'Solved 5 Rule of Three problems.',
    xpReward: 100,
  },
  {
    id: 'quiz_starter',
    icon: '⚡',
    titlePt: 'Mente Ágil',
    titleEn: 'Agile Mind',
    descriptionPt: 'Acertou 10 questões no modo Treino.',
    descriptionEn: 'Answered 10 questions correctly in Training.',
    xpReward: 100,
  },
  {
    id: 'survival_10',
    icon: '🛡️',
    titlePt: 'Sobrevivente',
    titleEn: 'Survivor',
    descriptionPt: 'Alcançou a conta #10 no modo Sobrevivência.',
    descriptionEn: 'Reached problem #10 in Survival mode.',
    xpReward: 200,
  },
  {
    id: 'streak_3',
    icon: '🔥',
    titlePt: 'Foco Diário',
    titleEn: 'Daily Focus',
    descriptionPt: 'Manteve 3 dias consecutivos de ofensiva.',
    descriptionEn: 'Maintained a 3-day daily streak.',
    xpReward: 150,
  },
  {
    id: 'level_5',
    icon: '🌟',
    titlePt: 'Explorador Numérico',
    titleEn: 'Number Explorer',
    descriptionPt: 'Alcançou o Nível 5 de Perfil.',
    descriptionEn: 'Reached Profile Level 5.',
    xpReward: 250,
  },
  {
    id: 'level_10',
    icon: '👑',
    titlePt: 'Calculista Lendário',
    titleEn: 'Legendary Calculator',
    descriptionPt: 'Alcançou o Nível 10 de Perfil.',
    descriptionEn: 'Reached Profile Level 10.',
    xpReward: 500,
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
export function checkNewAchievements(profile: import('../../types').UserProfile): string[] {
  const unlocked = new Set(profile.unlockedAchievements || []);
  const newUnlocked: string[] = [];

  const levelInfo = calculateLevelInfo(profile.totalXp);
  const stats = profile.stats || {
    totalCalculations: 0,
    totalBhaskara: 0,
    totalRegraDeTres: 0,
    totalQuizCorrect: 0,
    bestSurvivalRecord: 0,
  };

  // 1. first_calculation
  if (!unlocked.has('first_calculation') && (stats.totalCalculations >= 1 || stats.totalBhaskara >= 1 || stats.totalRegraDeTres >= 1)) {
    newUnlocked.push('first_calculation');
  }

  // 2. bhaskara_master
  if (!unlocked.has('bhaskara_master') && stats.totalBhaskara >= 5) {
    newUnlocked.push('bhaskara_master');
  }

  // 3. rule_three_expert
  if (!unlocked.has('rule_three_expert') && stats.totalRegraDeTres >= 5) {
    newUnlocked.push('rule_three_expert');
  }

  // 4. quiz_starter
  if (!unlocked.has('quiz_starter') && stats.totalQuizCorrect >= 10) {
    newUnlocked.push('quiz_starter');
  }

  // 5. survival_10
  if (!unlocked.has('survival_10') && stats.bestSurvivalRecord >= 10) {
    newUnlocked.push('survival_10');
  }

  // 6. streak_3
  if (!unlocked.has('streak_3') && (profile.streakDays || 0) >= 3) {
    newUnlocked.push('streak_3');
  }

  // 7. level_5
  if (!unlocked.has('level_5') && levelInfo.level >= 5) {
    newUnlocked.push('level_5');
  }

  // 8. level_10
  if (!unlocked.has('level_10') && levelInfo.level >= 10) {
    newUnlocked.push('level_10');
  }

  return newUnlocked;
}
