import Big from 'big.js';
import type { PlanoInclinadoInput, PlanoInclinadoResult, InclinedPlaneChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, sinDeg, cosDeg } from './physicsUtils';

/**
 * Plano Inclinado & Leis de Newton
 * Peso: P = m * g
 * Px = P * sin(θ)
 * Py = P * cos(θ)
 * Normal: N = Py
 * Fat = μ * N
 * Análise de repouso estático vs deslizamento acelerado
 */
export function calculatePlanoInclinado(
  input: PlanoInclinadoInput,
  options: PhysicsCalculationOptions = {}
): PlanoInclinadoResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.mass || input.mass.trim() === '') {
    throw new Error('A massa do corpo deve ser informada.');
  }
  if (!input.angleDeg || input.angleDeg.trim() === '') {
    throw new Error('O ângulo de inclinação da rampa deve ser informado.');
  }

  const bigM = parseBig(input.mass);
  if (bigM.lte(0)) {
    throw new Error('A massa do corpo deve ser estritamente positiva (m > 0).');
  }

  const bigAngle = parseBig(input.angleDeg);
  if (bigAngle.lt(0) || bigAngle.gt(90)) {
    throw new Error('O ângulo do plano inclinado deve estar entre 0° e 90°.');
  }

  const bigMu =
    input.frictionCoef !== undefined && input.frictionCoef.trim() !== ''
      ? parseBig(input.frictionCoef)
      : new Big(0);

  if (bigMu.lt(0)) {
    throw new Error('O coeficiente de atrito não pode ser negativo (μ ≥ 0).');
  }

  const bigG = normalizeGravity(input.g ?? options.gravity);

  const sinVal = sinDeg(bigAngle);
  const cosVal = cosDeg(bigAngle);

  // 1. Força Peso
  const bigP = bigM.times(bigG);

  // 2. Componentes Px e Py
  const bigPx = bigP.times(sinVal);
  const bigPy = bigP.times(cosVal);

  // 3. Força Normal N = Py
  const bigN = bigPy;

  // 4. Força de atrito estático máxima (destaque)
  const bigFatMax = bigMu.times(bigN);

  let isStatic = false;
  let bigFat: Big;
  let bigFRes: Big;
  let bigA: Big;

  const steps: string[] = [];
  steps.push('**Dinâmica do Plano Inclinado & Leis de Newton**');

  steps.push(
    `1. **Identificação dos Parâmetros do Sistema:**\n` +
      `   • Massa do bloco (m) = **${formatNumberSmart(bigM, decimals, separator)} kg**\n` +
      `   • Ângulo da rampa com a horizontal (θ) = **${formatNumberSmart(bigAngle, decimals, separator)}°**\n` +
      `   • Coeficiente de atrito com a superfície (μ) = **${formatNumberSmart(bigMu, decimals, separator)}**\n` +
      `   • Aceleração da gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**`
  );

  steps.push(
    `2. **Cálculo da Força Peso e Decomposição Ortogonal:**\n` +
      `   • Força Gravitacional Total: P = m · g = ${formatNumberSmart(bigM, decimals, separator)} · ${formatNumberSmart(bigG, decimals, separator)} = **${formatNumberSmart(bigP, decimals, separator)} N**\n` +
      `   • Componente tangencial à rampa (tende a descer): Pₓ = P · sin(θ) = ${formatNumberSmart(bigP, decimals, separator)} · ${formatNumberSmart(sinVal, 4, separator)} = **${formatNumberSmart(bigPx, decimals, separator)} N**\n` +
      `   • Componente normal à rampa (comprime o plano): Pᵧ = P · cos(θ) = ${formatNumberSmart(bigP, decimals, separator)} · ${formatNumberSmart(cosVal, 4, separator)} = **${formatNumberSmart(bigPy, decimals, separator)} N**`
  );

  steps.push(
    `3. **Equilíbrio no Eixo Perpendicular ao Plano (Eixo Y):**\n` +
      `   Como não há movimento através da superfície da rampa (aᵧ = 0):\n` +
      `   N - Pᵧ = 0  ⟹  **N = Pᵧ = ${formatNumberSmart(bigN, decimals, separator)} N**`
  );

  // Análise de atrito e movimento no eixo X
  if (bigPx.lte(bigFatMax)) {
    isStatic = true;
    bigFat = bigPx;
    bigFRes = new Big(0);
    bigA = new Big(0);

    steps.push(
      `4. **Condição de Equilíbrio Estático (Sem Deslizamento):**\n` +
        `   • Força de atrito estático máxima disponível: F_at(máx) = μ · N = ${formatNumberSmart(bigMu, decimals, separator)} · ${formatNumberSmart(bigN, decimals, separator)} = **${formatNumberSmart(bigFatMax, decimals, separator)} N**\n` +
        `   • Como Pₓ (${formatNumberSmart(bigPx, decimals, separator)} N) ≤ F_at(máx) (${formatNumberSmart(bigFatMax, decimals, separator)} N), o bloco **permanece em repouso estático**.\n` +
        `   • A força de atrito efetiva equilibra exatamente a componente tangencial: **F_at = Pₓ = ${formatNumberSmart(bigFat, decimals, separator)} N**\n` +
        `   • Força resultante paralela: **F_res = 0 N**\n` +
        `   • Aceleração do bloco: **a = 0 m/s²**`
    );
  } else {
    isStatic = false;
    bigFat = bigFatMax;
    bigFRes = bigPx.minus(bigFat);
    bigA = bigFRes.div(bigM);

    steps.push(
      `4. **Movimento Acelerado Descendo a Rampa:**\n` +
        `   • Força de atrito cinético contrária ao deslizamento: F_at = μ · N = **${formatNumberSmart(bigFat, decimals, separator)} N**\n` +
        `   • Como Pₓ (${formatNumberSmart(bigPx, decimals, separator)} N) > F_at (${formatNumberSmart(bigFat, decimals, separator)} N), o bloco **desliza acelerado rampa abaixo**.\n` +
        `   • Força resultante: F_res = Pₓ - F_at = ${formatNumberSmart(bigPx, decimals, separator)} - ${formatNumberSmart(bigFat, decimals, separator)} = **${formatNumberSmart(bigFRes, decimals, separator)} N**\n` +
        `   • Aceleração pela 2ª Lei de Newton: a = F_res / m = ${formatNumberSmart(bigFRes, decimals, separator)} / ${formatNumberSmart(bigM, decimals, separator)}\n` +
        `   **a = ${formatNumberSmart(bigA, decimals, separator)} m/s²**`
    );
  }

  const chartData: InclinedPlaneChartData = {
    type: 'inclined_plane',
    angleDeg: Number(bigAngle.toString()),
    mass: Number(bigM.toString()),
    peso: Number(bigP.toString()),
    px: Number(bigPx.toString()),
    py: Number(bigPy.toString()),
    normal: Number(bigN.toString()),
    fat: Number(bigFat.toString()),
    aceleracao: Number(bigA.toString()),
    frictionCoef: Number(bigMu.toString()),
    isStatic,
  };

  const formattedValues: Record<string, string> = {
    mass: formatNumberSmart(bigM, decimals, separator),
    angleDeg: formatNumberSmart(bigAngle, decimals, separator),
    g: formatNumberSmart(bigG, decimals, separator),
    frictionCoef: formatNumberSmart(bigMu, decimals, separator),
    peso: formatNumberSmart(bigP, decimals, separator),
    px: formatNumberSmart(bigPx, decimals, separator),
    py: formatNumberSmart(bigPy, decimals, separator),
    normal: formatNumberSmart(bigN, decimals, separator),
    fat: formatNumberSmart(bigFat, decimals, separator),
    fRes: formatNumberSmart(bigFRes, decimals, separator),
    aceleracao: formatNumberSmart(bigA, decimals, separator),
    status: isStatic ? 'Estático (Repouso)' : 'Deslizando (Acelerado)',
  };

  return {
    mode: 'plano_inclinado',
    category: 'dinamica_energia',
    equationTitle: 'Plano Inclinado & Decomposição das Leis de Newton',
    summary: `P = ${formattedValues.peso} N | N = ${formattedValues.normal} N | a = ${formattedValues.aceleracao} m/s² (${formattedValues.status})`,
    mass: Number(bigM.toString()),
    angleDeg: Number(bigAngle.toString()),
    g: Number(bigG.toString()),
    frictionCoef: Number(bigMu.toString()),
    peso: Number(bigP.toString()),
    px: Number(bigPx.toString()),
    py: Number(bigPy.toString()),
    normal: Number(bigN.toString()),
    fat: Number(bigFat.toString()),
    fRes: Number(bigFRes.toString()),
    aceleracao: Number(bigA.toString()),
    isStatic,
    formattedValues,
    steps,
    chartData,
  };
}
