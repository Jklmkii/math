import Big from 'big.js';
import type { MRUInput, MRUResult, TemporalChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';

/**
 * Movimento Retilíneo Uniforme (MRU)
 * Equação horária: S = S0 + v * t
 */
export function calculateMRU(
  input: MRUInput,
  options: PhysicsCalculationOptions = {}
): MRUResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';
  const unknown = input.unknown;

  let bigS0: Big;
  let bigV: Big;
  let bigT: Big;
  let bigS: Big;

  const steps: string[] = [];
  steps.push('**Movimento Retilíneo Uniforme (MRU)**');

  switch (unknown) {
    case 's': {
      if (input.s0 === undefined || input.s0 === '') {
        throw new Error('Parâmetro ausente: para calcular a posição final (S), forneça a posição inicial (S₀).');
      }
      if (input.v === undefined || input.v === '') {
        throw new Error('Parâmetro ausente: para calcular a posição final (S), forneça a velocidade (v).');
      }
      if (input.t === undefined || input.t === '') {
        throw new Error('Parâmetro ausente: para calcular a posição final (S), forneça o tempo (t).');
      }

      bigS0 = parseBig(input.s0);
      bigV = parseBig(input.v);
      bigT = parseBig(input.t);

      steps.push(
        `1. **Identificação dos Dados Fornecidos:**\n` +
          `   • Posição inicial (S₀) = **${formatNumberSmart(bigS0, decimals, separator)} m**\n` +
          `   • Velocidade constante (v) = **${formatNumberSmart(bigV, decimals, separator)} m/s**\n` +
          `   • Tempo decorrido (t) = **${formatNumberSmart(bigT, decimals, separator)} s**\n` +
          `   • Incógnita: Posição final (**S**)`
      );

      steps.push(
        `2. **Equação Horária da Posição:**\n` +
          `   A função que descreve o MRU é dada por:\n` +
          `   **S = S₀ + v · t**`
      );

      const deltaS = bigV.times(bigT);
      bigS = bigS0.plus(deltaS);

      steps.push(
        `3. **Substituição e Resolução Numérica:**\n` +
          `   S = ${formatNumberSmart(bigS0, decimals, separator)} + (${formatNumberSmart(bigV, decimals, separator)}) · (${formatNumberSmart(bigT, decimals, separator)})\n` +
          `   S = ${formatNumberSmart(bigS0, decimals, separator)} + (${formatNumberSmart(deltaS, decimals, separator)})\n` +
          `   **S = ${formatNumberSmart(bigS, decimals, separator)} m**`
      );
      break;
    }

    case 's0': {
      if (input.s === undefined || input.s === '') {
        throw new Error('Parâmetro ausente: para calcular a posição inicial (S₀), forneça a posição final (S).');
      }
      if (input.v === undefined || input.v === '') {
        throw new Error('Parâmetro ausente: para calcular a posição inicial (S₀), forneça a velocidade (v).');
      }
      if (input.t === undefined || input.t === '') {
        throw new Error('Parâmetro ausente: para calcular a posição inicial (S₀), forneça o tempo (t).');
      }

      bigS = parseBig(input.s);
      bigV = parseBig(input.v);
      bigT = parseBig(input.t);

      steps.push(
        `1. **Identificação dos Dados Fornecidos:**\n` +
          `   • Posição final (S) = **${formatNumberSmart(bigS, decimals, separator)} m**\n` +
          `   • Velocidade (v) = **${formatNumberSmart(bigV, decimals, separator)} m/s**\n` +
          `   • Tempo decorrido (t) = **${formatNumberSmart(bigT, decimals, separator)} s**\n` +
          `   • Incógnita: Posição inicial (**S₀**)`
      );

      steps.push(
        `2. **Isolamento Algébrico de S₀:**\n` +
          `   A partir da equação geral S = S₀ + v · t, subtraímos v · t em ambos os lados:\n` +
          `   **S₀ = S - v · t**`
      );

      const vt = bigV.times(bigT);
      bigS0 = bigS.minus(vt);

      steps.push(
        `3. **Substituição e Resolução Numérica:**\n` +
          `   S₀ = ${formatNumberSmart(bigS, decimals, separator)} - (${formatNumberSmart(bigV, decimals, separator)} · ${formatNumberSmart(bigT, decimals, separator)})\n` +
          `   S₀ = ${formatNumberSmart(bigS, decimals, separator)} - (${formatNumberSmart(vt, decimals, separator)})\n` +
          `   **S₀ = ${formatNumberSmart(bigS0, decimals, separator)} m**`
      );
      break;
    }

    case 'v': {
      if (input.s === undefined || input.s === '') {
        throw new Error('Parâmetro ausente: para calcular a velocidade (v), forneça a posição final (S).');
      }
      if (input.s0 === undefined || input.s0 === '') {
        throw new Error('Parâmetro ausente: para calcular a velocidade (v), forneça a posição inicial (S₀).');
      }
      if (input.t === undefined || input.t === '') {
        throw new Error('Parâmetro ausente: para calcular a velocidade (v), forneça o tempo (t).');
      }

      bigS = parseBig(input.s);
      bigS0 = parseBig(input.s0);
      bigT = parseBig(input.t);

      if (bigT.eq(0)) {
        throw new Error('O tempo decorrido não pode ser zero para calcular a velocidade.');
      }

      steps.push(
        `1. **Identificação dos Dados Fornecidos:**\n` +
          `   • Posição final (S) = **${formatNumberSmart(bigS, decimals, separator)} m**\n` +
          `   • Posição inicial (S₀) = **${formatNumberSmart(bigS0, decimals, separator)} m**\n` +
          `   • Tempo decorrido (t) = **${formatNumberSmart(bigT, decimals, separator)} s**\n` +
          `   • Incógnita: Velocidade constante (**v**)`
      );

      steps.push(
        `2. **Definição da Velocidade Média:**\n` +
          `   v = ΔS / Δt = (S - S₀) / t\n` +
          `   **v = (S - S₀) / t**`
      );

      const deltaS = bigS.minus(bigS0);
      bigV = deltaS.div(bigT);

      steps.push(
        `3. **Substituição e Resolução Numérica:**\n` +
          `   ΔS = ${formatNumberSmart(bigS, decimals, separator)} - (${formatNumberSmart(bigS0, decimals, separator)}) = ${formatNumberSmart(deltaS, decimals, separator)} m\n` +
          `   v = ${formatNumberSmart(deltaS, decimals, separator)} / ${formatNumberSmart(bigT, decimals, separator)}\n` +
          `   **v = ${formatNumberSmart(bigV, decimals, separator)} m/s**`
      );
      break;
    }

    case 't': {
      if (input.s === undefined || input.s === '') {
        throw new Error('Parâmetro ausente: para calcular o tempo (t), forneça a posição final (S).');
      }
      if (input.s0 === undefined || input.s0 === '') {
        throw new Error('Parâmetro ausente: para calcular o tempo (t), forneça a posição inicial (S₀).');
      }
      if (input.v === undefined || input.v === '') {
        throw new Error('Parâmetro ausente: para calcular o tempo (t), forneça a velocidade (v).');
      }

      bigS = parseBig(input.s);
      bigS0 = parseBig(input.s0);
      bigV = parseBig(input.v);

      if (bigV.eq(0)) {
        if (!bigS.eq(bigS0)) {
          throw new Error('A velocidade é zero com posições distintas; o móvel nunca alcançará a posição final.');
        }
        bigT = new Big(0);
      } else {
        const deltaS = bigS.minus(bigS0);
        bigT = deltaS.div(bigV);
      }

      steps.push(
        `1. **Identificação dos Dados Fornecidos:**\n` +
          `   • Posição final (S) = **${formatNumberSmart(bigS, decimals, separator)} m**\n` +
          `   • Posição inicial (S₀) = **${formatNumberSmart(bigS0, decimals, separator)} m**\n` +
          `   • Velocidade (v) = **${formatNumberSmart(bigV, decimals, separator)} m/s**\n` +
          `   • Incógnita: Tempo decorrido (**t**)`
      );

      steps.push(
        `2. **Isolamento do Tempo:**\n` +
          `   t = (S - S₀) / v\n` +
          `   **t = ΔS / v**`
      );

      const deltaS = bigS.minus(bigS0);
      steps.push(
        `3. **Substituição e Resolução Numérica:**\n` +
          `   t = (${formatNumberSmart(bigS, decimals, separator)} - ${formatNumberSmart(bigS0, decimals, separator)}) / ${formatNumberSmart(bigV, decimals, separator)}\n` +
          `   t = ${formatNumberSmart(deltaS, decimals, separator)} / ${formatNumberSmart(bigV, decimals, separator)}\n` +
          `   **t = ${formatNumberSmart(bigT, decimals, separator)} s**`
      );
      break;
    }

    default:
      throw new Error(`Incógnita desconhecida: "${String(unknown)}". Escolha entre 's', 's0', 'v' ou 't'.`);
  }

  // Classificação do movimento
  let motionClassification: string;
  if (bigV.gt(0)) {
    motionClassification = 'Movimento Progressivo (v > 0: o móvel se desloca no sentido positivo da trajetória)';
  } else if (bigV.lt(0)) {
    motionClassification = 'Movimento Retrógrado (v < 0: o móvel se desloca no sentido contrário ao da trajetória)';
  } else {
    motionClassification = 'Móvel em Repouso (v = 0: a posição não varia com o tempo)';
  }

  steps.push(
    `4. **Classificação e Interpretação Física:**\n` +
      `   • Classificação: **${motionClassification}**\n` +
      `   • Função Horária Específica: **S(t) = ${formatNumberSmart(bigS0, decimals, separator)} + (${formatNumberSmart(bigV, decimals, separator)}) · t**`
  );

  // Gera pontos para o gráfico temporal
  const tNum = Number(bigT.toString());
  const maxT = Math.max(Math.abs(tNum), 10);
  const pointsCount = 21;
  const stepT = maxT / (pointsCount - 1);

  const points = [];
  for (let i = 0; i < pointsCount; i++) {
    const currentT = Number((i * stepT).toFixed(4));
    const currentS = Number(bigS0.plus(bigV.times(currentT)).toFixed(4));
    const currentV = Number(bigV.toFixed(4));
    points.push({
      t: currentT,
      s: currentS,
      v: currentV,
    });
  }

  const chartData: TemporalChartData = {
    type: 'temporal',
    points,
    xLabel: 'Tempo (s)',
    yLabel: 'Posição S (m)',
  };

  const formattedS = formatNumberSmart(bigS, decimals, separator);
  const formattedV = formatNumberSmart(bigV, decimals, separator);

  return {
    mode: 'mru',
    category: 'cinematica',
    equationTitle: 'Movimento Retilíneo Uniforme (MRU)',
    summary: `S = ${formattedS} m | v = ${formattedV} m/s | t = ${formatNumberSmart(bigT, decimals, separator)} s`,
    s: Number(bigS.toString()),
    s0: Number(bigS0.toString()),
    v: Number(bigV.toString()),
    t: Number(bigT.toString()),
    formattedS,
    formattedV,
    steps,
    chartData,
  };
}
