/**
 * Daily Challenge Engine — Quantora
 * 
 * Deterministic PRNG seeded by integer hash of YYYY-MM-DD (Mulberry32).
 * Guarantees identical challenge on all devices for the same date.
 */

export type DailyChallengeCategory = 'aritmetica' | 'porcentagem' | 'algebra' | 'proporcao';

export interface DailyChallengeProblem {
  id: string;
  date: string;
  category: DailyChallengeCategory;
  categoryLabel: string;
  title: string;
  question: string;
  displayExpression: string;
  options: number[];
  correctAnswer: number;
  explanation: string[];
  xpReward: number;
}

export interface TimeUntilMidnight {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
}

/**
 * 32-bit FNV-1a string hash function
 * Converts any YYYY-MM-DD date string into a consistent unsigned 32-bit integer seed.
 */
export function hashDateStringToSeed(dateStr: string): number {
  const clean = (dateStr || '').trim();
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 32-bit Pseudo-Random Number Generator.
 * Extremely fast, excellent statistical distribution, identical sequence on all platforms.
 */
export function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded PRNG wrapper providing typed random generators.
 */
export class SeededPRNG {
  private nextFloat: () => number;

  constructor(seed: number) {
    this.nextFloat = createMulberry32(seed);
  }

  /** Returns pseudo-random float in [0, 1) */
  next(): number {
    return this.nextFloat();
  }

  /** Returns pseudo-random integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    if (min === max) return min;
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return Math.floor(this.next() * (high - low + 1)) + low;
  }

  /** Pick a pseudo-random element from an array */
  pick<T>(items: T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Shuffles an array deterministically using Fisher-Yates */
  shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }
}

/**
 * Helper returning the local today string in YYYY-MM-DD format.
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates remaining hours, minutes, and seconds until the next local midnight.
 */
export function getTimeUntilMidnight(now: Date = new Date()): TimeUntilMidnight {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    formatted,
  };
}

/**
 * Formats daily challenge completion summary for clipboard sharing.
 */
export function formatDailyShareText(dateStr: string, isCorrect: boolean, streak: number): string {
  const resultIcon = isCorrect ? '✅ Acertou!' : '❌';
  return [
    `📐 Quantora — Desafio Diário (${dateStr})`,
    `Resultado: ${resultIcon}`,
    `🔥 Sequência: ${streak} dias`,
    `💡 quantora.app`,
  ].join('\n');
}

/**
 * Generates 4 distinct multiple-choice options with realistic distractors
 * and deterministic shuffling.
 */
function generateFourOptions(correctAnswer: number, rng: SeededPRNG): number[] {
  const optionsSet = new Set<number>();
  optionsSet.add(correctAnswer);

  // Plausible candidate distractors based on magnitude
  const candidates: number[] = [];
  if (correctAnswer > 20) {
    candidates.push(correctAnswer + rng.nextInt(2, 5));
    candidates.push(correctAnswer - rng.nextInt(2, 5));
    candidates.push(correctAnswer + rng.nextInt(6, 12));
    candidates.push(correctAnswer - rng.nextInt(6, 12));
    candidates.push(Math.round(correctAnswer * 1.1));
    candidates.push(Math.round(correctAnswer * 0.9));
    candidates.push(Math.round(correctAnswer * 1.25));
  } else {
    candidates.push(correctAnswer + 1);
    candidates.push(correctAnswer - 1);
    candidates.push(correctAnswer + 2);
    candidates.push(correctAnswer - 2);
    candidates.push(correctAnswer + 3);
    candidates.push(correctAnswer + 4);
  }

  // Pick candidates
  for (const c of candidates) {
    if (c > 0 && c !== correctAnswer && !optionsSet.has(c)) {
      optionsSet.add(c);
      if (optionsSet.size === 4) break;
    }
  }

  // Safety fallback: increment/decrement until exactly 4 distinct positive options
  let offset = 1;
  while (optionsSet.size < 4) {
    const plus = correctAnswer + offset;
    if (plus > 0 && !optionsSet.has(plus)) optionsSet.add(plus);
    if (optionsSet.size >= 4) break;

    const minus = correctAnswer - offset;
    if (minus > 0 && !optionsSet.has(minus)) optionsSet.add(minus);
    offset++;
  }

  return rng.shuffle(Array.from(optionsSet));
}

/**
 * Deterministically generates a rich math challenge for any date string.
 * Categories:
 * 1. Aritmética (Expressões numéricas com parênteses e ordem de operações)
 * 2. Porcentagem (Descontos e acréscimos comerciais práticos)
 * 3. Álgebra (Equações do 1º grau com isolamento de incógnita)
 * 4. Proporção (Regra de três direta com contextos reais)
 */
export function getDailyChallenge(dateStr: string): DailyChallengeProblem {
  const effectiveDate = (dateStr && dateStr.trim().length >= 8) ? dateStr.trim() : getTodayDateString();
  const seed = hashDateStringToSeed(effectiveDate);
  const rng = new SeededPRNG(seed);

  const CATEGORIES: DailyChallengeCategory[] = ['aritmetica', 'porcentagem', 'algebra', 'proporcao'];
  const categoryIndex = rng.nextInt(0, CATEGORIES.length - 1);
  const category = CATEGORIES[categoryIndex];

  let title = '';
  let categoryLabel = '';
  let question = '';
  let displayExpression = '';
  let correctAnswer = 0;
  let explanation: string[] = [];

  switch (category) {
    case 'aritmetica': {
      categoryLabel = 'Aritmética Expressa';
      title = 'Ordem das Operações';
      const variant = rng.nextInt(0, 1);

      if (variant === 0) {
        // Pattern: a × (b + c) - d
        const a = rng.nextInt(3, 9);
        const b = rng.nextInt(4, 12);
        const c = rng.nextInt(3, 9);
        const d = rng.nextInt(5, 20);

        const sumInside = b + c;
        const product = a * sumInside;
        correctAnswer = product - d;

        displayExpression = `${a} × (${b} + ${c}) - ${d}`;
        question = `Calcule o valor exato da expressão numérica com parênteses:`;
        explanation = [
          `Passo 1: Resolver a operação dentro dos parênteses primeiro: **${b} + ${c} = ${sumInside}**`,
          `Passo 2: Efetuar a multiplicação prioritária: **${a} × ${sumInside} = ${product}**`,
          `Passo 3: Finalizar com a subtração: **${product} - ${d} = ${correctAnswer}**`,
          `Resultado final: **${correctAnswer}**`,
        ];
      } else {
        // Pattern: (a × b) + (c × d) - e
        const a = rng.nextInt(4, 11);
        const b = rng.nextInt(3, 8);
        const c = rng.nextInt(3, 9);
        const d = rng.nextInt(2, 6);
        const e = rng.nextInt(6, 25);

        const prod1 = a * b;
        const prod2 = c * d;
        const sum = prod1 + prod2;
        correctAnswer = sum - e;

        displayExpression = `(${a} × ${b}) + (${c} × ${d}) - ${e}`;
        question = `Determine o valor da expressão aritmética combinada:`;
        explanation = [
          `Passo 1: Calcular as duas multiplicações prioritárias: **${a} × ${b} = ${prod1}** e **${c} × ${d} = ${prod2}**`,
          `Passo 2: Somar os produtos obtidos: **${prod1} + ${prod2} = ${sum}**`,
          `Passo 3: Subtrair o termo restante: **${sum} - ${e} = ${correctAnswer}**`,
          `Resultado final: **${correctAnswer}**`,
        ];
      }
      break;
    }

    case 'porcentagem': {
      categoryLabel = 'Porcentagem & Finanças';
      title = 'Cálculo Comercial';
      const isDiscount = rng.nextInt(0, 1) === 0;

      if (isDiscount) {
        // Desconto em produto
        const basePrices = [80, 120, 150, 200, 240, 250, 300, 400, 500, 600, 800];
        const discounts = [10, 15, 20, 25, 30, 40, 50];
        const price = rng.pick(basePrices);
        // Ensure discount results in integer
        const validDiscounts = discounts.filter((d) => (price * d) % 100 === 0);
        const discountPercent = rng.pick(validDiscounts.length > 0 ? validDiscounts : [10, 20, 50]);

        const discountValue = (price * discountPercent) / 100;
        correctAnswer = price - discountValue;

        displayExpression = `R$ ${price},00 − ${discountPercent}%`;
        question = `Um item custa R$ ${price},00 e recebeu um desconto promocional de ${discountPercent}%. Qual é o valor final a pagar?`;
        explanation = [
          `Passo 1: Calcular o valor absoluto do desconto: **${discountPercent}% de R$ ${price},00 = (${price} × ${discountPercent}) / 100 = R$ ${discountValue},00**`,
          `Passo 2: Subtrair o desconto do preço original: **R$ ${price},00 - R$ ${discountValue},00 = R$ ${correctAnswer},00**`,
          `Conclusão: O preço final com desconto aplicado é **R$ ${correctAnswer},00**.`,
        ];
      } else {
        // Acréscimo / Rendimento
        const baseValues = [100, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
        const rates = [5, 10, 12, 15, 20, 25, 30];
        const capital = rng.pick(baseValues);
        const validRates = rates.filter((r) => (capital * r) % 100 === 0);
        const ratePercent = rng.pick(validRates.length > 0 ? validRates : [10, 20]);

        const interest = (capital * ratePercent) / 100;
        correctAnswer = capital + interest;

        displayExpression = `R$ ${capital},00 + ${ratePercent}%`;
        question = `Um investimento de R$ ${capital},00 teve um rendimento de ${ratePercent}% no mês. Qual é o saldo total atualizado?`;
        explanation = [
          `Passo 1: Calcular o montante de rendimento obtido: **${ratePercent}% de R$ ${capital},00 = (${capital} × ${ratePercent}) / 100 = R$ ${interest},00**`,
          `Passo 2: Somar o rendimento ao capital inicial: **R$ ${capital},00 + R$ ${interest},00 = R$ ${correctAnswer},00**`,
          `Conclusão: O saldo final total é **R$ ${correctAnswer},00**.`,
        ];
      }
      break;
    }

    case 'algebra': {
      categoryLabel = 'Álgebra & Equações';
      title = 'Equação do 1º Grau';
      const variant = rng.nextInt(0, 1);

      if (variant === 0) {
        // Pattern: a·x + b = c
        const x = rng.nextInt(3, 14);
        const a = rng.nextInt(2, 7);
        const b = rng.nextInt(4, 32);
        const c = a * x + b;
        correctAnswer = x;

        displayExpression = `${a}x + ${b} = ${c}`;
        question = `Determine o valor de x na seguinte equação do 1º grau:`;
        explanation = [
          `Passo 1: Isolar o termo com incógnita subtraindo ${b} dos dois membros: **${a}x = ${c} - ${b} = ${c - b}**`,
          `Passo 2: Dividir ambos os lados pelo coeficiente ${a}: **x = ${c - b} / ${a}**`,
          `Passo 3: Concluir a raiz da equação: **x = ${x}**`,
        ];
      } else {
        // Pattern: a·(x - b) = c
        const x = rng.nextInt(5, 20);
        const a = rng.nextInt(2, 6);
        const b = rng.nextInt(2, 9);
        const c = a * (x - b);
        correctAnswer = x;

        displayExpression = `${a}(x - ${b}) = ${c}`;
        question = `Encontre a solução da equação linear:`;
        explanation = [
          `Passo 1: Dividir ambos os lados pelo fator ${a}: **x - ${b} = ${c} / ${a} = ${c / a}**`,
          `Passo 2: Somar ${b} em ambos os lados para isolar x: **x = ${c / a} + ${b}**`,
          `Passo 3: Obter a solução: **x = ${x}**`,
        ];
      }
      break;
    }

    case 'proporcao': {
      categoryLabel = 'Regra de Três & Proporção';
      title = 'Proporcionalidade Direta';
      const variant = rng.nextInt(0, 1);

      if (variant === 0) {
        // Produção industrial
        const unitRate = rng.nextInt(5, 18); // peças por máquina
        const m1 = rng.nextInt(2, 6);
        const p1 = m1 * unitRate;
        const m2 = rng.nextInt(7, 14);
        correctAnswer = m2 * unitRate;

        displayExpression = `${m1} máq. ➔ ${p1} peças | ${m2} máq. ➔ x`;
        question = `Se ${m1} máquinas produzem ${p1} peças por dia, quantas peças ${m2} dessas mesmas máquinas produzirão no mesmo período?`;
        explanation = [
          `Passo 1: Identificar a relação de proporcionalidade direta: aumentando as máquinas, a produção aumenta proporcionalmente.`,
          `Passo 2: Estruturar a proporção: **${m1} / ${p1} = ${m2} / x**`,
          `Passo 3: Multiplicar cruzado: **${m1} · x = ${p1} × ${m2} = ${p1 * m2}**`,
          `Passo 4: Isolar x: **x = ${p1 * m2} / ${m1} = ${correctAnswer} peças**`,
        ];
      } else {
        // Consumo de combustível
        const efficiency = rng.nextInt(9, 16); // km por litro
        const liters1 = rng.nextInt(4, 10);
        const km1 = liters1 * efficiency;
        correctAnswer = rng.nextInt(12, 25);
        const km2 = correctAnswer * efficiency;

        displayExpression = `${km1} km ➔ ${liters1} L | ${km2} km ➔ x`;
        question = `Um veículo percorre ${km1} km utilizando ${liters1} litros de combustível. Quantos litros serão necessários para percorrer ${km2} km nas mesmas condições?`;
        explanation = [
          `Passo 1: Grandezas diretamente proporcionais: maior distância percorrida exige proporcionalmente mais combustível.`,
          `Passo 2: Montar a Regra de Três: **${km1} / ${liters1} = ${km2} / x**`,
          `Passo 3: Multiplicação cruzada: **${km1} · x = ${liters1} × ${km2} = ${liters1 * km2}**`,
          `Passo 4: Resolver para x: **x = ${liters1 * km2} / ${km1} = ${correctAnswer} litros**`,
        ];
      }
      break;
    }
  }

  const options = generateFourOptions(correctAnswer, rng);

  return {
    id: `daily_${effectiveDate}_${seed.toString(36)}`,
    date: effectiveDate,
    category,
    categoryLabel,
    title,
    question,
    displayExpression,
    options,
    correctAnswer,
    explanation,
    xpReward: 150,
  };
}
