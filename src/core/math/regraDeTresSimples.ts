import Big from 'big.js';
import type { DecimalPlaces, DecimalSeparator, ProportionType, RegraDeTresSimplesInput, RegraDeTresSimplesResult, SimpleGridPosition } from '../../types';
import { formatNumberSmart, parseBig } from './precision';

export interface RegraDeTresOptions {
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
}

/**
 * Solves a 2x2 Rule of Three (Direct or Inverse) where any cell can be the unknown 'x'.
 */
export function calculateRegraDeTresSimples(
  input: RegraDeTresSimplesInput,
  options: RegraDeTresOptions = {}
): RegraDeTresSimplesResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';
  const { a1, b1, a2, b2, unknownPos, type, labelA = 'Coluna A', labelB = 'Coluna B' } = input;

  // Retrieve known values
  const rawValues: Record<SimpleGridPosition, string> = { a1, b1, a2, b2 };

  // Validate the other 3 cells are valid numbers
  const positions: SimpleGridPosition[] = ['a1', 'b1', 'a2', 'b2'];
  const knownPositions = positions.filter((p) => p !== unknownPos);

  const bigValues: Partial<Record<SimpleGridPosition, Big>> = {};
  for (const pos of knownPositions) {
    const val = rawValues[pos];
    if (!val || val.trim() === '') {
      throw new Error(`Preencha todos os campos conhecidos (${pos.toUpperCase()}).`);
    }
    bigValues[pos] = parseBig(val);
  }

  const vA1 = bigValues.a1;
  const vB1 = bigValues.b1;
  const vA2 = bigValues.a2;
  const vB2 = bigValues.b2;

  let xBig: Big;
  let formulaStr = '';
  const steps: string[] = [];

  const typeDesc = type === 'direct' ? 'Diretamente Proporcional' : 'Inversamente Proporcional';
  steps.push(`Proporcionalidade selecionada: **${typeDesc}**`);
  steps.push(
    `Tabela montada:\n` +
      `| ${labelA} | ${labelB} |\n` +
      `|---|---|\n` +
      `| ${unknownPos === 'a1' ? '**x**' : a1} | ${unknownPos === 'b1' ? '**x**' : b1} |\n` +
      `| ${unknownPos === 'a2' ? '**x**' : a2} | ${unknownPos === 'b2' ? '**x**' : b2} |`
  );

  if (type === 'direct') {
    // Cross multiplication: a1 * b2 = a2 * b1
    steps.push(`Na proporção direta, multiplicamos em cruz: **A₁ · B₂ = A₂ · B₁**`);

    if (unknownPos === 'b2') {
      // b2 = (a2 * b1) / a1
      if (vA1!.eq(0)) throw new Error('Divisão por zero: o valor de A₁ não pode ser 0.');
      const num = vA2!.times(vB1!);
      xBig = num.div(vA1!);
      formulaStr = `x = (A₂ · B₁) / A₁`;
      steps.push(
        `1. Equação: ${vA1!.toString()} · x = ${vA2!.toString()} · ${vB1!.toString()}\n` +
          `2. Multiplicação: ${vA1!.toString()} · x = ${num.toString()}\n` +
          `3. Isolando x: x = ${num.toString()} / ${vA1!.toString()}`
      );
    } else if (unknownPos === 'a2') {
      // a2 = (a1 * b2) / b1
      if (vB1!.eq(0)) throw new Error('Divisão por zero: o valor de B₁ não pode ser 0.');
      const num = vA1!.times(vB2!);
      xBig = num.div(vB1!);
      formulaStr = `x = (A₁ · B₂) / B₁`;
      steps.push(
        `1. Equação: x · ${vB1!.toString()} = ${vA1!.toString()} · ${vB2!.toString()}\n` +
          `2. Multiplicação: ${vB1!.toString()} · x = ${num.toString()}\n` +
          `3. Isolando x: x = ${num.toString()} / ${vB1!.toString()}`
      );
    } else if (unknownPos === 'b1') {
      // b1 = (a1 * b2) / a2
      if (vA2!.eq(0)) throw new Error('Divisão por zero: o valor de A₂ não pode ser 0.');
      const num = vA1!.times(vB2!);
      xBig = num.div(vA2!);
      formulaStr = `x = (A₁ · B₂) / A₂`;
      steps.push(
        `1. Equação: ${vA2!.toString()} · x = ${vA1!.toString()} · ${vB2!.toString()}\n` +
          `2. Multiplicação: ${vA2!.toString()} · x = ${num.toString()}\n` +
          `3. Isolando x: x = ${num.toString()} / ${vA2!.toString()}`
      );
    } else {
      // unknownPos === 'a1' -> a1 = (a2 * b1) / b2
      if (vB2!.eq(0)) throw new Error('Divisão por zero: o valor de B₂ não pode ser 0.');
      const num = vA2!.times(vB1!);
      xBig = num.div(vB2!);
      formulaStr = `x = (A₂ · B₁) / B₂`;
      steps.push(
        `1. Equação: x · ${vB2!.toString()} = ${vA2!.toString()} · ${vB1!.toString()}\n` +
          `2. Multiplicação: ${vB2!.toString()} · x = ${num.toString()}\n` +
          `3. Isolando x: x = ${num.toString()} / ${vB2!.toString()}`
      );
    }
  } else {
    // Inverse proportion: straight lines: a1 * b1 = a2 * b2
    steps.push(`Na proporção inversa, multiplicamos em linha reta: **A₁ · B₁ = A₂ · B₂**`);

    if (unknownPos === 'b2') {
      // b2 = (a1 * b1) / a2
      if (vA2!.eq(0)) throw new Error('Divisão por zero: o valor de A₂ não pode ser 0.');
      const prod = vA1!.times(vB1!);
      xBig = prod.div(vA2!);
      formulaStr = `x = (A₁ · B₁) / A₂`;
      steps.push(
        `1. Equação: ${vA2!.toString()} · x = ${vA1!.toString()} · ${vB1!.toString()}\n` +
          `2. Multiplicação: ${vA2!.toString()} · x = ${prod.toString()}\n` +
          `3. Isolando x: x = ${prod.toString()} / ${vA2!.toString()}`
      );
    } else if (unknownPos === 'a2') {
      // a2 = (a1 * b1) / b2
      if (vB2!.eq(0)) throw new Error('Divisão por zero: o valor de B₂ não pode ser 0.');
      const prod = vA1!.times(vB1!);
      xBig = prod.div(vB2!);
      formulaStr = `x = (A₁ · B₁) / B₂`;
      steps.push(
        `1. Equação: x · ${vB2!.toString()} = ${vA1!.toString()} · ${vB1!.toString()}\n` +
          `2. Multiplicação: ${vB2!.toString()} · x = ${prod.toString()}\n` +
          `3. Isolando x: x = ${prod.toString()} / ${vB2!.toString()}`
      );
    } else if (unknownPos === 'b1') {
      // b1 = (a2 * b2) / a1
      if (vA1!.eq(0)) throw new Error('Divisão por zero: o valor de A₁ não pode ser 0.');
      const prod = vA2!.times(vB2!);
      xBig = prod.div(vA1!);
      formulaStr = `x = (A₂ · B₂) / A₁`;
      steps.push(
        `1. Equação: ${vA1!.toString()} · x = ${vA2!.toString()} · ${vB2!.toString()}\n` +
          `2. Multiplicação: ${vA1!.toString()} · x = ${prod.toString()}\n` +
          `3. Isolando x: x = ${prod.toString()} / ${vA1!.toString()}`
      );
    } else {
      // unknownPos === 'a1' -> a1 = (a2 * b2) / b1
      if (vB1!.eq(0)) throw new Error('Divisão por zero: o valor de B₁ não pode ser 0.');
      const prod = vA2!.times(vB2!);
      xBig = prod.div(vB1!);
      formulaStr = `x = (A₂ · B₂) / B₁`;
      steps.push(
        `1. Equação: x · ${vB1!.toString()} = ${vA2!.toString()} · ${vB2!.toString()}\n` +
          `2. Multiplicação: ${vB1!.toString()} · x = ${prod.toString()}\n` +
          `3. Isolando x: x = ${prod.toString()} / ${vB1!.toString()}`
      );
    }
  }

  const formattedX = formatNumberSmart(xBig, decimals, separator);
  steps.push(`**Resultado final:** x = **${formattedX}**`);

  return {
    x: Number(xBig.toString()),
    formattedX,
    steps,
    type,
    formula: formulaStr,
  };
}

/**
 * Heuristic to suggest proportionality based on labels or common mathematical contexts.
 */
export function suggestProportionality(labelA: string, labelB: string): ProportionType {
  const normA = labelA.toLowerCase().trim();
  const normB = labelB.toLowerCase().trim();

  // Inverse indicators:
  // (Velocidade, Tempo), (Operários/Trabalhadores/Máquinas, Horas/Dias/Tempo), (Torneiras, Tempo)
  const speedKeywords = ['velocidade', 'km/h', 'm/s', 'rapidez'];
  const timeKeywords = ['tempo', 'horas', 'hora', 'minutos', 'dias', 'segundos', 'prazo'];
  const workerKeywords = ['operarios', 'operários', 'trabalhadores', 'homens', 'pessoas', 'maquinas', 'máquinas', 'torneiras'];

  const aIsSpeed = speedKeywords.some((k) => normA.includes(k));
  const bIsSpeed = speedKeywords.some((k) => normB.includes(k));

  const aIsTime = timeKeywords.some((k) => normA.includes(k));
  const bIsTime = timeKeywords.some((k) => normB.includes(k));

  const aIsWorker = workerKeywords.some((k) => normA.includes(k));
  const bIsWorker = workerKeywords.some((k) => normB.includes(k));

  if ((aIsSpeed && bIsTime) || (bIsSpeed && aIsTime)) {
    return 'inverse';
  }

  if ((aIsWorker && bIsTime) || (bIsWorker && aIsTime)) {
    return 'inverse';
  }

  // Default to direct proportion
  return 'direct';
}
