import type { QuizTrack, SpacedBox, SpacedCard } from '../../types';

export const BOX_INTERVALS: Record<SpacedBox, { questions: number; timeMs: number }> = {
  1: { questions: 2, timeMs: 10 * 60 * 1000 },          // 10 minutos ou 2 perguntas
  2: { questions: 5, timeMs: 4 * 3600 * 1000 },         // 4 horas ou 5 perguntas
  3: { questions: 15, timeMs: 24 * 3600 * 1000 },       // 1 dia ou 15 perguntas
  4: { questions: 40, timeMs: 5 * 24 * 3600 * 1000 },   // 5 dias ou 40 perguntas
  5: { questions: 150, timeMs: 21 * 24 * 3600 * 1000 }, // 21 dias ou 150 perguntas (longo prazo)
};

export const BASE_REVIEW_XP = 10;
export const RESILIENCE_BONUS_XP = 5; // Caixas 1 e 2
export const MASTERY_GRADUATION_BONUS_XP = 50; // Único / Primeira vez que atinge Caixa 5

/**
 * Normaliza a chave do fato matemático respeitando propriedades comutativas.
 * Soma e Multiplicação: min(a, b) op max(a, b)
 * Subtração e Divisão: a op b estrito
 */
export function createItemKey(track: QuizTrack, a: number, b: number): string {
  if (track === 'soma') {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `soma:${min}+${max}`;
  }
  if (track === 'multiplicacao') {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `mult:${min}x${max}`;
  }
  if (track === 'subtracao') {
    return `sub:${a}-${b}`;
  }
  if (track === 'divisao') {
    return `div:${a}/${b}`;
  }
  return `${track}:${a}_${b}`;
}

/**
 * Extrai os operandos normalizados de acordo com a comutatividade da operação.
 */
export function normalizeOperands(track: QuizTrack, a: number, b: number): [number, number] {
  if (track === 'soma' || track === 'multiplicacao') {
    return [Math.min(a, b), Math.max(a, b)];
  }
  return [a, b];
}

/**
 * Avalia o gatilho dual: uma carta é considerada "Due" (pendente) se atingiu
 * a quantidade de perguntas globais necessárias OU o tempo real decorrido.
 */
export function isCardDue(
  card: SpacedCard,
  currentGlobalQuestions: number,
  nowTimestamp: number = Date.now()
): boolean {
  return (
    currentGlobalQuestions >= card.nextReviewQuestions ||
    nowTimestamp >= card.nextReviewTimestamp
  );
}

/**
 * Cria uma carta inicial na Caixa 1 quando o usuário erra um fato matemático pela primeira vez.
 */
export function createInitialCard(
  track: QuizTrack,
  a: number,
  b: number,
  currentGlobalQuestions: number,
  nowTimestamp: number = Date.now()
): SpacedCard {
  const id = createItemKey(track, a, b);
  const operands = normalizeOperands(track, a, b);
  const interval = BOX_INTERVALS[1];

  return {
    id,
    track,
    operands,
    box: 1,
    consecutiveCorrect: 0,
    lastReviewedAt: nowTimestamp,
    lastQuestionCounter: currentGlobalQuestions,
    nextReviewTimestamp: nowTimestamp + interval.timeMs,
    nextReviewQuestions: currentGlobalQuestions + interval.questions,
    hasGraduated: false,
    totalMistakes: 1,
    totalReviews: 1,
  };
}

export interface ProcessCardResult {
  updatedCard: SpacedCard;
  xpEarned: number;
  graduatedNow: boolean;
  isResilienceBonus: boolean;
}

/**
 * Processa a resposta do usuário a uma carta existente aplicando o algoritmo
 * Leitner Amortecido com economia anti-exploit de XP.
 */
export function processCardAnswer(
  card: SpacedCard,
  isCorrect: boolean,
  currentGlobalQuestions: number,
  nowTimestamp: number = Date.now()
): ProcessCardResult {
  const oldBox = card.box;

  if (isCorrect) {
    const newBox = Math.min(5, oldBox + 1) as SpacedBox;
    const graduatedNow = !card.hasGraduated && newBox === 5;
    const hasGraduated = card.hasGraduated || graduatedNow;

    const isResilienceBonus = oldBox === 1 || oldBox === 2;
    let xpEarned = BASE_REVIEW_XP;
    if (isResilienceBonus) {
      xpEarned += RESILIENCE_BONUS_XP;
    }
    if (graduatedNow) {
      xpEarned += MASTERY_GRADUATION_BONUS_XP;
    }

    const interval = BOX_INTERVALS[newBox];
    const updatedCard: SpacedCard = {
      ...card,
      box: newBox,
      consecutiveCorrect: card.consecutiveCorrect + 1,
      lastReviewedAt: nowTimestamp,
      lastQuestionCounter: currentGlobalQuestions,
      nextReviewTimestamp: nowTimestamp + interval.timeMs,
      nextReviewQuestions: currentGlobalQuestions + interval.questions,
      hasGraduated,
      totalReviews: card.totalReviews + 1,
    };

    return {
      updatedCard,
      xpEarned,
      graduatedNow,
      isResilienceBonus,
    };
  }

  // Resposta incorreta: Rebaixamento amortecido
  let newBox: SpacedBox;
  if (oldBox <= 2) {
    newBox = 1;
  } else {
    // Se já havia errada na última interação (consecutiveCorrect === 0), cai para Caixa 1
    if (card.consecutiveCorrect === 0) {
      newBox = 1;
    } else {
      // Rebaixamento amortecido: desce apenas 1 nível
      newBox = (oldBox - 1) as SpacedBox;
    }
  }

  const interval = BOX_INTERVALS[newBox];
  const updatedCard: SpacedCard = {
    ...card,
    box: newBox,
    consecutiveCorrect: 0,
    lastReviewedAt: nowTimestamp,
    lastQuestionCounter: currentGlobalQuestions,
    nextReviewTimestamp: nowTimestamp + interval.timeMs,
    nextReviewQuestions: currentGlobalQuestions + interval.questions,
    totalMistakes: card.totalMistakes + 1,
    totalReviews: card.totalReviews + 1,
  };

  return {
    updatedCard,
    xpEarned: 0,
    graduatedNow: false,
    isResilienceBonus: false,
  };
}

/**
 * Retorna todas as cartas devidas para revisão ordenada por urgência:
 * 1. Caixa menor primeiro (Caixa 1 tem máxima prioridade)
 * 2. Tempo de vencimento menor (mais tempo atrasada)
 */
export function getDueCards(
  cards: Record<string, SpacedCard>,
  currentGlobalQuestions: number,
  nowTimestamp: number = Date.now(),
  trackFilter?: QuizTrack
): SpacedCard[] {
  const list = Object.values(cards).filter((card) => {
    if (trackFilter && card.track !== trackFilter) return false;
    return isCardDue(card, currentGlobalQuestions, nowTimestamp);
  });

  return list.sort((a, b) => {
    if (a.box !== b.box) return a.box - b.box;
    return a.nextReviewTimestamp - b.nextReviewTimestamp;
  });
}

/**
 * Seleciona a próxima carta prioritária para revisão.
 */
export function selectNextDueCard(
  cards: Record<string, SpacedCard>,
  currentGlobalQuestions: number,
  nowTimestamp: number = Date.now(),
  trackFilter?: QuizTrack
): SpacedCard | null {
  const due = getDueCards(cards, currentGlobalQuestions, nowTimestamp, trackFilter);
  return due.length > 0 ? due[0] : null;
}
