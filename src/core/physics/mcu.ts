import Big from 'big.js';
import type { MCUInput, MCUResult, CircularVectorChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { msToKmh } from './physicsUtils';

/**
 * Movimento Circular Uniforme (MCU)
 * Período T, Frequência f (Hz e RPM), Velocidade Angular ω,
 * Velocidade Linear v e Aceleração Centrípeta a_cp.
 */
export function calculateMCU(
  input: MCUInput,
  options: PhysicsCalculationOptions = {}
): MCUResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.radius || input.radius.trim() === '') {
    throw new Error('O raio da trajetória circular deve ser informado.');
  }
  if (!input.value || input.value.trim() === '') {
    throw new Error('O valor do parâmetro selecionado deve ser informado.');
  }

  const bigR = parseBig(input.radius);
  if (bigR.lte(0)) {
    throw new Error('O raio da trajetória circular deve ser estritamente positivo (R > 0).');
  }

  const bigVal = parseBig(input.value);
  if (bigVal.lte(0)) {
    throw new Error('O valor do parâmetro informado deve ser estritamente positivo.');
  }

  let bigT: Big;
  let bigF: Big;
  let bigOmega: Big;
  let bigVLinear: Big;

  const steps: string[] = [];
  steps.push('**Movimento Circular Uniforme (MCU)**');

  const twoPi = 2 * Math.PI;

  switch (input.parameterType) {
    case 'period': {
      bigT = bigVal;
      bigF = new Big(1).div(bigT);
      bigOmega = new Big(twoPi / Number(bigT.toString()));
      bigVLinear = bigOmega.times(bigR);

      steps.push(
        `1. **Dados Fornecidos:**\n` +
          `   • Raio da trajetória circular (R) = **${formatNumberSmart(bigR, decimals, separator)} m**\n` +
          `   • Período de rotação (T) = **${formatNumberSmart(bigT, decimals, separator)} s**`
      );

      steps.push(
        `2. **Frequência de Rotação (f):**\n` +
          `   f = 1 / T = 1 / ${formatNumberSmart(bigT, decimals, separator)}\n` +
          `   **f = ${formatNumberSmart(bigF, decimals, separator)} Hz** (~**${formatNumberSmart(bigF.times(60), decimals, separator)} RPM**)`
      );
      break;
    }

    case 'frequency': {
      bigF = bigVal;
      bigT = new Big(1).div(bigF);
      bigOmega = new Big(twoPi * Number(bigF.toString()));
      bigVLinear = bigOmega.times(bigR);

      steps.push(
        `1. **Dados Fornecidos:**\n` +
          `   • Raio da trajetória circular (R) = **${formatNumberSmart(bigR, decimals, separator)} m**\n` +
          `   • Frequência (f) = **${formatNumberSmart(bigF, decimals, separator)} Hz** (~**${formatNumberSmart(bigF.times(60), decimals, separator)} RPM**)`
      );

      steps.push(
        `2. **Período de Rotação (T):**\n` +
          `   T = 1 / f = 1 / ${formatNumberSmart(bigF, decimals, separator)}\n` +
          `   **T = ${formatNumberSmart(bigT, decimals, separator)} s**`
      );
      break;
    }

    case 'angular_speed': {
      bigOmega = bigVal;
      const omegaNum = Number(bigOmega.toString());
      bigF = new Big(omegaNum / twoPi);
      bigT = new Big(1).div(bigF);
      bigVLinear = bigOmega.times(bigR);

      steps.push(
        `1. **Dados Fornecidos:**\n` +
          `   • Raio (R) = **${formatNumberSmart(bigR, decimals, separator)} m**\n` +
          `   • Velocidade angular (ω) = **${formatNumberSmart(bigOmega, decimals, separator)} rad/s**`
      );

      steps.push(
        `2. **Período e Frequência:**\n` +
          `   ω = 2π / T  ⟹  T = 2π / ω = **${formatNumberSmart(bigT, decimals, separator)} s**\n` +
          `   f = 1 / T = **${formatNumberSmart(bigF, decimals, separator)} Hz** (~**${formatNumberSmart(bigF.times(60), decimals, separator)} RPM**)`
      );
      break;
    }

    case 'linear_speed': {
      bigVLinear = bigVal;
      bigOmega = bigVLinear.div(bigR);
      const omegaNum = Number(bigOmega.toString());
      bigF = new Big(omegaNum / twoPi);
      bigT = new Big(1).div(bigF);

      steps.push(
        `1. **Dados Fornecidos:**\n` +
          `   • Raio (R) = **${formatNumberSmart(bigR, decimals, separator)} m**\n` +
          `   • Velocidade linear tangencial (v) = **${formatNumberSmart(bigVLinear, decimals, separator)} m/s**`
      );

      steps.push(
        `2. **Velocidade Angular (ω):**\n` +
          `   v = ω · R  ⟹  ω = v / R = ${formatNumberSmart(bigVLinear, decimals, separator)} / ${formatNumberSmart(bigR, decimals, separator)}\n` +
          `   **ω = ${formatNumberSmart(bigOmega, decimals, separator)} rad/s**\n` +
          `   T = 2π / ω = **${formatNumberSmart(bigT, decimals, separator)} s** | f = **${formatNumberSmart(bigF, decimals, separator)} Hz**`
      );
      break;
    }

    default:
      throw new Error(`Tipo de parâmetro desconhecido: "${String(input.parameterType)}".`);
  }

  // Aceleração centrípeta: a_cp = v² / R = ω² * R
  const bigACp = bigVLinear.times(bigVLinear).div(bigR);
  const bigVLinearKmh = msToKmh(bigVLinear);

  steps.push(
    `3. **Velocidade Linear Tangencial (v):**\n` +
      `   v = ω · R = ${formatNumberSmart(bigOmega, decimals, separator)} · ${formatNumberSmart(bigR, decimals, separator)}\n` +
      `   **v = ${formatNumberSmart(bigVLinear, decimals, separator)} m/s** (~**${formatNumberSmart(bigVLinearKmh, decimals, separator)} km/h**)`
  );

  steps.push(
    `4. **Aceleração Centrípeta (a_cp):**\n` +
      `   Responsável pela contínua alteração na direção do vetor velocidade:\n` +
      `   a_cp = v² / R = (${formatNumberSmart(bigVLinear, decimals, separator)})² / ${formatNumberSmart(bigR, decimals, separator)}\n` +
      `   **a_cp = ${formatNumberSmart(bigACp, decimals, separator)} m/s²**`
  );

  const chartData: CircularVectorChartData = {
    type: 'circular',
    radius: Number(bigR.toString()),
    omega: Number(bigOmega.toString()),
    vLinear: Number(bigVLinear.toString()),
    aCentripeta: Number(bigACp.toString()),
    angleDeg: 45,
  };

  const formattedValues: Record<string, string> = {
    radius: formatNumberSmart(bigR, decimals, separator),
    period: formatNumberSmart(bigT, decimals, separator),
    frequency: formatNumberSmart(bigF, decimals, separator),
    frequencyRpm: formatNumberSmart(bigF.times(60), decimals, separator),
    omega: formatNumberSmart(bigOmega, decimals, separator),
    vLinear: formatNumberSmart(bigVLinear, decimals, separator),
    vLinearKmh: formatNumberSmart(bigVLinearKmh, decimals, separator),
    aCentripeta: formatNumberSmart(bigACp, decimals, separator),
  };

  return {
    mode: 'mcu',
    category: 'circular_oscilacoes',
    equationTitle: 'Movimento Circular Uniforme (MCU)',
    summary: `ω = ${formattedValues.omega} rad/s | v = ${formattedValues.vLinear} m/s | a_cp = ${formattedValues.aCentripeta} m/s²`,
    radius: Number(bigR.toString()),
    period: Number(bigT.toString()),
    frequency: Number(bigF.toString()),
    omega: Number(bigOmega.toString()),
    vLinear: Number(bigVLinear.toString()),
    aCentripeta: Number(bigACp.toString()),
    formattedValues,
    steps,
    chartData,
  };
}
