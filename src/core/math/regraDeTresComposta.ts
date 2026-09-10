import Big from 'big.js';
import type { CompostaColumn, DecimalPlaces, DecimalSeparator, RegraDeTresCompostaResult } from '../../types';
import { formatNumberSmart, parseBig } from './precision';

export interface RegraDeTresCompostaOptions {
  decimals?: DecimalPlaces;
  separator?: DecimalSeparator;
}

/**
 * Calculates Compound Rule of Three with dynamic quantities.
 */
export function calculateRegraDeTresComposta(
  columns: CompostaColumn[],
  options: RegraDeTresCompostaOptions = {}
): RegraDeTresCompostaResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (columns.length < 3) {
    throw new Error('A Regra de Três Composta requer pelo menos 3 grandezas.');
  }

  const targetCol = columns.find((c) => c.isTarget);
  if (!targetCol) {
    throw new Error('Selecione qual coluna possui a incógnita (x).');
  }

  if (!targetCol.val1 || targetCol.val1.trim() === '') {
    throw new Error(`Preencha o valor inicial da grandeza "${targetCol.name}".`);
  }

  const t1 = parseBig(targetCol.val1);
  if (t1.eq(0)) {
    throw new Error('O valor conhecido da grandeza alvo não pode ser zero.');
  }

  const steps: string[] = [];
  steps.push(`Grandeza com a incógnita (x): **${targetCol.name}** (Valor inicial: ${t1.toString()})`);

  // Compute product of fractions of all other columns
  // target_1 / x = product( fractions )
  // For direct: c1 / c2
  // For inverse: c2 / c1
  let productNumerator = new Big(1);
  let productDenominator = new Big(1);

  const otherCols = columns.filter((c) => !c.isTarget);

  steps.push('Análise das relações com a grandeza alvo:');

  for (const col of otherCols) {
    if (!col.val1 || !col.val2) {
      throw new Error(`Preencha todos os valores para a grandeza "${col.name}".`);
    }

    const c1 = parseBig(col.val1);
    const c2 = parseBig(col.val2);

    if (c1.eq(0) || c2.eq(0)) {
      throw new Error(`Nenhum valor pode ser zero na grandeza "${col.name}".`);
    }

    if (col.proportionWithTarget === 'direct') {
      steps.push(`• **${col.name}**: Diretamente Proporcional ➔ Razão mantida: (${c1.toString()} / ${c2.toString()})`);
      productNumerator = productNumerator.times(c1);
      productDenominator = productDenominator.times(c2);
    } else {
      steps.push(`• **${col.name}**: Inversamente Proporcional ➔ Razão invertida: (${c2.toString()} / ${c1.toString()})`);
      productNumerator = productNumerator.times(c2);
      productDenominator = productDenominator.times(c1);
    }
  }

  // Equation: t1 / x = productNumerator / productDenominator
  // x = (t1 * productDenominator) / productNumerator
  if (productNumerator.eq(0)) {
    throw new Error('Erro no cálculo: divisão por zero no numerador das grandezas.');
  }

  const numeratorFinal = t1.times(productDenominator);
  const xBig = numeratorFinal.div(productNumerator);

  const formattedX = formatNumberSmart(xBig, decimals, separator);

  steps.push(
    `Montagem da equação:\n` +
      `   ${t1.toString()} / x = ${productNumerator.toString()} / ${productDenominator.toString()}\n` +
      `   x · (${productNumerator.toString()}) = ${t1.toString()} · (${productDenominator.toString()})\n` +
      `   x · ${productNumerator.toString()} = ${numeratorFinal.toString()}\n` +
      `   x = ${numeratorFinal.toString()} / ${productNumerator.toString()}`
  );

  steps.push(`**Resultado final:** x = **${formattedX}**`);

  return {
    x: Number(xBig.toString()),
    formattedX,
    steps,
    equation: `${t1.toString()} / x = (${productNumerator.toString()} / ${productDenominator.toString()})`,
  };
}
