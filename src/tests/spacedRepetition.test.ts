import { describe, it, expect } from 'vitest';
import {
  createItemKey,
  normalizeOperands,
  isCardDue,
  createInitialCard,
  processCardAnswer,
  getDueCards,
  selectNextDueCard,
  BOX_INTERVALS,
  BASE_REVIEW_XP,
  RESILIENCE_BONUS_XP,
  MASTERY_GRADUATION_BONUS_XP,
} from '../core/quiz/spacedRepetition';
import type { SpacedCard } from '../types';

describe('Motor de Repetição Espaçada (Spaced Repetition)', () => {
  it('normaliza operações comutativas e preserva ordem nas não-comutativas', () => {
    // Soma: comutativa
    expect(createItemKey('soma', 7, 8)).toBe('soma:7+8');
    expect(createItemKey('soma', 8, 7)).toBe('soma:7+8');
    expect(normalizeOperands('soma', 12, 5)).toEqual([5, 12]);

    // Multiplicação: comutativa
    expect(createItemKey('multiplicacao', 9, 6)).toBe('mult:6x9');
    expect(createItemKey('multiplicacao', 6, 9)).toBe('mult:6x9');
    expect(normalizeOperands('multiplicacao', 9, 6)).toEqual([6, 9]);

    // Subtração: não-comutativa
    expect(createItemKey('subtracao', 15, 8)).toBe('sub:15-8');
    expect(createItemKey('subtracao', 8, 15)).toBe('sub:8-15');
    expect(normalizeOperands('subtracao', 15, 8)).toEqual([15, 8]);

    // Divisão: não-comutativa
    expect(createItemKey('divisao', 56, 7)).toBe('div:56/7');
    expect(createItemKey('divisao', 7, 56)).toBe('div:7/56');
    expect(normalizeOperands('divisao', 56, 7)).toEqual([56, 7]);
  });

  it('cria carta inicial na Caixa 1 com prazos corretos', () => {
    const now = 1000000;
    const globalQ = 10;
    const card = createInitialCard('multiplicacao', 7, 8, globalQ, now);

    expect(card.id).toBe('mult:7x8');
    expect(card.box).toBe(1);
    expect(card.consecutiveCorrect).toBe(0);
    expect(card.totalMistakes).toBe(1);
    expect(card.totalReviews).toBe(1);
    expect(card.hasGraduated).toBe(false);
    expect(card.nextReviewQuestions).toBe(globalQ + BOX_INTERVALS[1].questions);
    expect(card.nextReviewTimestamp).toBe(now + BOX_INTERVALS[1].timeMs);
  });

  it('avalia o gatilho dual corretamente (perguntas globais OU tempo)', () => {
    const now = 1000000;
    const card: SpacedCard = {
      id: 'mult:7x8',
      track: 'multiplicacao',
      operands: [7, 8],
      box: 2,
      consecutiveCorrect: 1,
      lastReviewedAt: now,
      lastQuestionCounter: 10,
      nextReviewTimestamp: now + 3600 * 1000, // +1h
      nextReviewQuestions: 15,
      hasGraduated: false,
      totalMistakes: 1,
      totalReviews: 2,
    };

    // Cenário 1: Nem tempo nem perguntas atingidas
    expect(isCardDue(card, 12, now + 1000)).toBe(false);

    // Cenário 2: Perguntas globais atingidas (15 >= 15) antes do tempo
    expect(isCardDue(card, 15, now + 1000)).toBe(true);

    // Cenário 3: Tempo decorrido antes de responder 5 perguntas
    expect(isCardDue(card, 11, now + 3600 * 1000)).toBe(true);
  });

  it('avança progressivamente pelas caixas e concede bônus de resiliência e maestria', () => {
    const baseTime = 1000000;
    let card = createInitialCard('soma', 15, 27, 0, baseTime);

    // Acerto 1: Caixa 1 -> Caixa 2 (+15 XP)
    let res = processCardAnswer(card, true, 2, baseTime + 600000);
    card = res.updatedCard;
    expect(card.box).toBe(2);
    expect(res.xpEarned).toBe(BASE_REVIEW_XP + RESILIENCE_BONUS_XP);
    expect(res.isResilienceBonus).toBe(true);
    expect(res.graduatedNow).toBe(false);

    // Acerto 2: Caixa 2 -> Caixa 3 (+15 XP)
    res = processCardAnswer(card, true, 7, baseTime + 15000000);
    card = res.updatedCard;
    expect(card.box).toBe(3);
    expect(res.xpEarned).toBe(BASE_REVIEW_XP + RESILIENCE_BONUS_XP);

    // Acerto 3: Caixa 3 -> Caixa 4 (+10 XP)
    res = processCardAnswer(card, true, 22, baseTime + 100000000);
    card = res.updatedCard;
    expect(card.box).toBe(4);
    expect(res.xpEarned).toBe(BASE_REVIEW_XP);
    expect(res.isResilienceBonus).toBe(false);

    // Acerto 4: Caixa 4 -> Caixa 5 (+10 XP + 50 XP maestria)
    res = processCardAnswer(card, true, 62, baseTime + 500000000);
    card = res.updatedCard;
    expect(card.box).toBe(5);
    expect(res.graduatedNow).toBe(true);
    expect(card.hasGraduated).toBe(true);
    expect(res.xpEarned).toBe(BASE_REVIEW_XP + MASTERY_GRADUATION_BONUS_XP);
  });

  it('anti-exploit: impede re-farm do bônus de +50 XP se a carta for rebaixada e subir novamente', () => {
    const baseTime = 1000000;
    const initial = createInitialCard('soma', 15, 27, 0, baseTime);

    // Simula carta já graduada na Caixa 5
    const graduatedCard: SpacedCard = {
      ...initial,
      box: 5,
      hasGraduated: true,
      consecutiveCorrect: 4,
    };

    // Erro: Rebaixamento amortecido para Caixa 4
    const errRes = processCardAnswer(graduatedCard, false, 50, baseTime + 2000000);
    const demotedCard = errRes.updatedCard;
    expect(demotedCard.box).toBe(4);
    expect(demotedCard.hasGraduated).toBe(true); // Permanece com a flag

    // Acerto: Retorna à Caixa 5
    const fixRes = processCardAnswer(demotedCard, true, 90, baseTime + 6000000);
    expect(fixRes.updatedCard.box).toBe(5);
    expect(fixRes.graduatedNow).toBe(false); // NÃO gradua de novo!
    expect(fixRes.xpEarned).toBe(BASE_REVIEW_XP); // Apenas +10 XP padrão, SEM +50 XP!
  });

  it('aplica rebaixamento amortecido (desce 1 nível para 1 erro, cai para Caixa 1 em 2 erros seguidos)', () => {
    const baseTime = 1000000;
    const cardBox4: SpacedCard = {
      id: 'mult:7x8',
      track: 'multiplicacao',
      operands: [7, 8],
      box: 4,
      consecutiveCorrect: 3,
      lastReviewedAt: baseTime,
      lastQuestionCounter: 100,
      nextReviewTimestamp: baseTime + 1000,
      nextReviewQuestions: 140,
      hasGraduated: false,
      totalMistakes: 1,
      totalReviews: 4,
    };

    // Primeiro erro a partir da Caixa 4: amortecido para Caixa 3
    const res1 = processCardAnswer(cardBox4, false, 140, baseTime + 2000);
    expect(res1.updatedCard.box).toBe(3);
    expect(res1.updatedCard.consecutiveCorrect).toBe(0);

    // Segundo erro consecutivo (consecutiveCorrect === 0): cai direto para Caixa 1!
    const res2 = processCardAnswer(res1.updatedCard, false, 142, baseTime + 3000);
    expect(res2.updatedCard.box).toBe(1);
    expect(res2.updatedCard.consecutiveCorrect).toBe(0);
  });

  it('ordena cartas devidas por prioridade (Caixa 1 tem precedência sobre Caixa 3)', () => {
    const now = 5000000;
    const globalQ = 100;

    const cardBox1: SpacedCard = {
      id: 'mult:7x8',
      track: 'multiplicacao',
      operands: [7, 8],
      box: 1,
      consecutiveCorrect: 0,
      lastReviewedAt: now - 100000,
      lastQuestionCounter: 90,
      nextReviewTimestamp: now - 50000,
      nextReviewQuestions: 92,
      hasGraduated: false,
      totalMistakes: 1,
      totalReviews: 1,
    };

    const cardBox3: SpacedCard = {
      id: 'soma:14+29',
      track: 'soma',
      operands: [14, 29],
      box: 3,
      consecutiveCorrect: 2,
      lastReviewedAt: now - 200000,
      lastQuestionCounter: 80,
      nextReviewTimestamp: now - 100000,
      nextReviewQuestions: 95,
      hasGraduated: false,
      totalMistakes: 1,
      totalReviews: 3,
    };

    const cards = {
      [cardBox1.id]: cardBox1,
      [cardBox3.id]: cardBox3,
    };

    const due = getDueCards(cards, globalQ, now);
    expect(due.length).toBe(2);
    // Caixa 1 deve vir primeiro mesmo tendo nextReviewTimestamp posterior
    expect(due[0].id).toBe(cardBox1.id);
    expect(due[1].id).toBe(cardBox3.id);

    const nextDue = selectNextDueCard(cards, globalQ, now);
    expect(nextDue?.id).toBe(cardBox1.id);
  });
});
