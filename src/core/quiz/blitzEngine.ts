/**
 * Blitz Engine (Modo 60 Segundos)
 *
 * Core pure functions and fast arithmetic question generator
 * for the high-intensity, rapid-solving MathUtils Blitz Mode.
 */

export const BLITZ_INITIAL_TIME = 60;
export const BLITZ_TIME_BONUS = 2; // +2s for correct answer
export const BLITZ_TIME_PENALTY = 3; // -3s for wrong answer (floor 0)
export const BLITZ_BASE_POINTS = 10;
export const BLITZ_XP_FACTOR = 5;

export type BlitzOperator = '+' | '-' | '×' | '÷';

export interface BlitzQuestion {
  id: string;
  expression: string;
  operand1: number;
  operand2: number;
  operator: BlitzOperator;
  correctAnswer: number;
  options: number[];
}

export interface BlitzState {
  score: number;
  timeLeft: number;
  combo: number;
  maxCombo: number;
  correctAnswers: number;
  totalAnswers: number;
  isGameOver: boolean;
}

/**
 * Calculates new time after an answer.
 * Correct: adds +2 seconds.
 * Incorrect: subtracts 3 seconds (floored at 0).
 */
export function calculateNewTime(currentTime: number, isCorrect: boolean): number {
  if (isCorrect) {
    return currentTime + BLITZ_TIME_BONUS;
  }
  return Math.max(0, currentTime - BLITZ_TIME_PENALTY);
}

/**
 * Calculates the combo multiplier based on consecutive hits.
 * - 0 to 2 hits: 1x
 * - 3 to 4 hits: 2x
 * - 5+ hits: 3x
 */
export function getComboMultiplier(consecutiveHits: number): number {
  if (consecutiveHits >= 5) {
    return 3;
  }
  if (consecutiveHits >= 3) {
    return 2;
  }
  return 1;
}

/**
 * Updates streak/combo counter. Resets to 0 on error.
 */
export function updateCombo(currentCombo: number, isCorrect: boolean): number {
  return isCorrect ? currentCombo + 1 : 0;
}

/**
 * Calculates Blitz XP formula: score * 5 * multiplier.
 * As defined in dispatch: `score * 5 * multiplier`
 */
export function calculateBlitzXp(score: number, multiplier: number = 1): number {
  return Math.max(0, Math.round(score * BLITZ_XP_FACTOR * multiplier));
}

/**
 * Calculates question XP gained from base points and current multiplier.
 */
export function calculateQuestionXp(basePoints: number, multiplier: number): number {
  return Math.max(0, Math.round(basePoints * BLITZ_XP_FACTOR * multiplier));
}

/**
 * Calculates accuracy percentage (0-100).
 */
export function calculateAccuracy(correctCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((correctCount / totalCount) * 100)));
}

/**
 * Creates initial clean Blitz state.
 */
export function createInitialBlitzState(): BlitzState {
  return {
    score: 0,
    timeLeft: BLITZ_INITIAL_TIME,
    combo: 0,
    maxCombo: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    isGameOver: false,
  };
}

/**
 * Pure state transition function for answering a question in Blitz Mode.
 */
export function processAnswer(
  state: BlitzState,
  isCorrect: boolean,
  basePoints: number = BLITZ_BASE_POINTS
): {
  nextState: BlitzState;
  timeDelta: number;
  multiplier: number;
  pointsEarned: number;
  xpEarned: number;
} {
  const currentCombo = state.combo;
  const newCombo = updateCombo(currentCombo, isCorrect);
  const maxCombo = Math.max(state.maxCombo, newCombo);
  const multiplier = getComboMultiplier(isCorrect ? newCombo : currentCombo);
  const timeDelta = isCorrect ? BLITZ_TIME_BONUS : -BLITZ_TIME_PENALTY;
  const nextTime = calculateNewTime(state.timeLeft, isCorrect);

  const pointsEarned = isCorrect ? basePoints * multiplier : 0;
  const nextScore = state.score + pointsEarned;
  const xpEarned = isCorrect ? calculateQuestionXp(basePoints, multiplier) : 0;

  const nextState: BlitzState = {
    score: nextScore,
    timeLeft: nextTime,
    combo: newCombo,
    maxCombo,
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
    totalAnswers: state.totalAnswers + 1,
    isGameOver: nextTime <= 0,
  };

  return {
    nextState,
    timeDelta,
    multiplier,
    pointsEarned,
    xpEarned,
  };
}

/**
 * Generates 4 plausible distinct choice options for a given correct answer.
 */
export function generateOptions(correctAnswer: number, rng: () => number = Math.random): number[] {
  const optionsSet = new Set<number>([correctAnswer]);
  const candidateDeltas = [
    1, -1, 2, -2, 3, -3, 5, -5, 10, -10, 4, -4, 6, -6, 7, -7, 8, -8, 9, -9
  ];

  // Shuffle deltas
  const shuffledDeltas = [...candidateDeltas].sort(() => rng() - 0.5);

  for (const delta of shuffledDeltas) {
    if (optionsSet.size >= 4) break;
    const candidate = correctAnswer + delta;
    // Keep answers reasonably natural (no negative answers for simple arithmetic)
    if (candidate >= 0) {
      optionsSet.add(candidate);
    }
  }

  // Fallback if set size is still < 4
  let offset = 1;
  while (optionsSet.size < 4) {
    optionsSet.add(correctAnswer + offset * 11);
    offset++;
  }

  const options = Array.from(optionsSet);
  // Shuffle options
  return options.sort(() => rng() - 0.5);
}

/**
 * Fast arithmetic question generator for Blitz Mode.
 * Balances addition, subtraction, multiplication, and division for mental agility.
 */
export function generateBlitzQuestion(rng: () => number = Math.random): BlitzQuestion {
  const operators: BlitzOperator[] = ['+', '-', '×', '÷'];
  const operatorIndex = Math.floor(rng() * operators.length);
  const operator = operators[operatorIndex];

  let operand1 = 0;
  let operand2 = 0;
  let correctAnswer = 0;
  let expression = '';

  switch (operator) {
    case '+': {
      // Fast addition: 5..50 + 3..49 or single-digit speed
      operand1 = Math.floor(rng() * 45) + 5;
      operand2 = Math.floor(rng() * 45) + 3;
      correctAnswer = operand1 + operand2;
      expression = `${operand1} + ${operand2}`;
      break;
    }
    case '-': {
      // Clean subtraction without negative results: minuend > subtrahend
      const a = Math.floor(rng() * 50) + 15;
      const b = Math.floor(rng() * (a - 5)) + 3;
      operand1 = a;
      operand2 = b;
      correctAnswer = operand1 - operand2;
      expression = `${operand1} - ${operand2}`;
      break;
    }
    case '×': {
      // Rapid multiplication: times tables 2..12 × 2..12
      operand1 = Math.floor(rng() * 11) + 2;
      operand2 = Math.floor(rng() * 11) + 2;
      correctAnswer = operand1 * operand2;
      expression = `${operand1} × ${operand2}`;
      break;
    }
    case '÷': {
      // Clean division without remainder
      const divisor = Math.floor(rng() * 10) + 2; // 2..11
      const quotient = Math.floor(rng() * 11) + 2; // 2..12
      operand1 = divisor * quotient;
      operand2 = divisor;
      correctAnswer = quotient;
      expression = `${operand1} ÷ ${operand2}`;
      break;
    }
  }

  const options = generateOptions(correctAnswer, rng);

  return {
    id: `blitz_${Date.now()}_${Math.floor(rng() * 100000)}`,
    expression,
    operand1,
    operand2,
    operator,
    correctAnswer,
    options,
  };
}
