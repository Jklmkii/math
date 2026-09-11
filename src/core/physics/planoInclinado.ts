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

  const hasAppliedForce = input.appliedForce !== undefined && input.appliedForce.trim() !== '';
  const bigFApp = hasAppliedForce ? parseBig(input.appliedForce!) : new Big(0);

  let isStatic = false;
  let bigFat: Big;
  let bigFRes: Big;
  let bigA: Big;
  let movementDirection: 'down' | 'up' | 'none' = 'none';

  const steps: string[] = [];
  steps.push('**Dinâmica do Plano Inclinado & Leis de Newton**');

  const paramStepLines = [
    `1. **Identificação dos Parâmetros do Sistema:**`,
    `   • Massa do bloco (m) = **${formatNumberSmart(bigM, decimals, separator)} kg**`,
    `   • Ângulo da rampa com a horizontal (θ) = **${formatNumberSmart(bigAngle, decimals, separator)}°**`,
    `   • Coeficiente de atrito com a superfície (μ) = **${formatNumberSmart(bigMu, decimals, separator)}**`,
    `   • Aceleração da gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**`,
  ];
  if (hasAppliedForce) {
    paramStepLines.push(
      `   • Força externa aplicada paralela à rampa (F) = **${formatNumberSmart(bigFApp, decimals, separator)} N** (sentido ascendente)`
    );
  }
  steps.push(paramStepLines.join('\n'));

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

  // Força motriz líquida no plano tangencial (descendente positiva)
  const bigNetDrive = bigPx.minus(bigFApp);

  if (bigNetDrive.gt(0)) {
    // Tendência de descer a rampa
    if (bigNetDrive.lte(bigFatMax)) {
      isStatic = true;
      movementDirection = 'none';
      bigFat = bigNetDrive;
      bigFRes = new Big(0);
      bigA = new Big(0);

      steps.push(
        `4. **Condição de Equilíbrio Estático (Sem Deslizamento):**\n` +
          `   • Força de atrito estático máxima disponível: F_at(máx) = μ · N = ${formatNumberSmart(bigMu, decimals, separator)} · ${formatNumberSmart(bigN, decimals, separator)} = **${formatNumberSmart(bigFatMax, decimals, separator)} N**\n` +
          `   • Como a tendência tangencial descendente (${formatNumberSmart(bigNetDrive, decimals, separator)} N) ≤ F_at(máx) (${formatNumberSmart(bigFatMax, decimals, separator)} N), o bloco **permanece em repouso estático**.\n` +
          `   • A força de atrito estático equilibra exatamente o sistema: **F_at = ${formatNumberSmart(bigFat, decimals, separator)} N** (apontando rampa acima)\n` +
          `   • Força resultante paralela: **F_res = 0 N**\n` +
          `   • Aceleração do bloco: **a = 0 m/s²**`
      );
    } else {
      isStatic = false;
      movementDirection = 'down';
      bigFat = bigFatMax;
      bigFRes = bigNetDrive.minus(bigFat);
      bigA = bigFRes.div(bigM);

      steps.push(
        `4. **Movimento Acelerado Descendo a Rampa:**\n` +
          `   • Força de atrito cinético contrária ao deslizamento: F_at = μ · N = **${formatNumberSmart(bigFat, decimals, separator)} N** (apontando rampa acima)\n` +
          `   • Como a tendência descendente (${formatNumberSmart(bigNetDrive, decimals, separator)} N) > F_at (${formatNumberSmart(bigFat, decimals, separator)} N), o bloco **desliza acelerado rampa abaixo**.\n` +
          `   • Força resultante: F_res = (Pₓ - F) - F_at = ${formatNumberSmart(bigNetDrive, decimals, separator)} - ${formatNumberSmart(bigFat, decimals, separator)} = **${formatNumberSmart(bigFRes, decimals, separator)} N**\n` +
          `   • Aceleração pela 2ª Lei de Newton: a = F_res / m = ${formatNumberSmart(bigFRes, decimals, separator)} / ${formatNumberSmart(bigM, decimals, separator)}\n` +
          `   **a = ${formatNumberSmart(bigA, decimals, separator)} m/s²** (sentido descendente)`
      );
    }
  } else if (bigNetDrive.lt(0)) {
    // Tendência de subir a rampa (F aplicada > Px)
    const bigUpwardDrive = bigNetDrive.abs();
    if (bigUpwardDrive.lte(bigFatMax)) {
      isStatic = true;
      movementDirection = 'none';
      bigFat = bigUpwardDrive;
      bigFRes = new Big(0);
      bigA = new Big(0);

      steps.push(
        `4. **Condição de Equilíbrio Estático com Força Externa:**\n` +
          `   • Força de atrito estático máxima disponível: F_at(máx) = μ · N = ${formatNumberSmart(bigMu, decimals, separator)} · ${formatNumberSmart(bigN, decimals, separator)} = **${formatNumberSmart(bigFatMax, decimals, separator)} N**\n` +
          `   • Como a tendência ascendente de tração (F - Pₓ = ${formatNumberSmart(bigUpwardDrive, decimals, separator)} N) ≤ F_at(máx) (${formatNumberSmart(bigFatMax, decimals, separator)} N), o bloco **permanece em repouso estático**.\n` +
          `   • A força de atrito estático age rampa abaixo equilibrando a força aplicada: **F_at = ${formatNumberSmart(bigFat, decimals, separator)} N**\n` +
          `   • Força resultante: **F_res = 0 N** | Aceleração: **a = 0 m/s²**`
      );
    } else {
      isStatic = false;
      movementDirection = 'up';
      bigFat = bigFatMax;
      bigFRes = bigUpwardDrive.minus(bigFat);
      bigA = bigFRes.div(bigM);

      steps.push(
        `4. **Movimento Acelerado Subindo a Rampa (F > Pₓ + F_at):**\n` +
          `   • Força de atrito cinético contrária ao movimento: F_at = μ · N = **${formatNumberSmart(bigFat, decimals, separator)} N** (apontando rampa abaixo)\n` +
          `   • A força externa aplicada vence a componente do peso e o atrito cinético!\n` +
          `   • Força resultante: F_res = (F - Pₓ) - F_at = ${formatNumberSmart(bigUpwardDrive, decimals, separator)} - ${formatNumberSmart(bigFat, decimals, separator)} = **${formatNumberSmart(bigFRes, decimals, separator)} N**\n` +
          `   • Aceleração pela 2ª Lei de Newton: a = F_res / m = ${formatNumberSmart(bigFRes, decimals, separator)} / ${formatNumberSmart(bigM, decimals, separator)}\n` +
          `   **a = ${formatNumberSmart(bigA, decimals, separator)} m/s²** (sentido ascendente)`
      );
    }
  } else {
    // Equilíbrio exato Px == F aplicada
    isStatic = true;
    movementDirection = 'none';
    bigFat = new Big(0);
    bigFRes = new Big(0);
    bigA = new Big(0);

    steps.push(
      `4. **Equilíbrio Tangencial Exato (Pₓ = F):**\n` +
        `   • A componente tangencial do peso (${formatNumberSmart(bigPx, decimals, separator)} N) é exatamente anulada pela força aplicada (${formatNumberSmart(bigFApp, decimals, separator)} N).\n` +
        `   • O bloco está em perfeito repouso estático sem solicitar força de atrito: **F_at = 0 N**.\n` +
        `   • Força resultante: **F_res = 0 N** | Aceleração: **a = 0 m/s²**`
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
    appliedForce: hasAppliedForce ? Number(bigFApp.toString()) : undefined,
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
    status: isStatic ? 'Estático (Repouso)' : movementDirection === 'up' ? 'Subindo (Acelerado)' : 'Descendo (Acelerado)',
  };

  if (hasAppliedForce) {
    formattedValues.appliedForce = formatNumberSmart(bigFApp, decimals, separator);
  }

  return {
    mode: 'plano_inclinado',
    category: 'dinamica_energia',
    equationTitle: 'Plano Inclinado & Decomposição das Leis de Newton',
    summary: `P = ${formattedValues.peso} N | N = ${formattedValues.normal} N | a = ${formattedValues.aceleracao} m/s² (${formattedValues.status})`,
    mass: Number(bigM.toString()),
    angleDeg: Number(bigAngle.toString()),
    g: Number(bigG.toString()),
    frictionCoef: Number(bigMu.toString()),
    appliedForce: hasAppliedForce ? Number(bigFApp.toString()) : undefined,
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
