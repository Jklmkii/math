import Big from 'big.js';
import type { LancamentoObliquoInput, LancamentoObliquoResult, BallisticChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, safeSqrt, sinDeg, cosDeg, degToRad } from './physicsUtils';

/**
 * Lançamento Oblíquo Balístico
 * Decomposição vetorial:
 * v0x = v0 * cos(θ)
 * v0y = v0 * sin(θ)
 * t_subida = v0y / g
 * H_max = y0 + v0y^2 / (2 * g)
 * t_voo = (v0y + sqrt(v0y^2 + 2 * g * y0)) / g
 * Alcance = v0x * t_voo
 */
export function calculateLancamentoObliquo(
  input: LancamentoObliquoInput,
  options: PhysicsCalculationOptions = {}
): LancamentoObliquoResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.v0 || input.v0.trim() === '') {
    throw new Error('A velocidade inicial de disparo (v0) deve ser informada.');
  }
  if (!input.angleDeg || input.angleDeg.trim() === '') {
    throw new Error('O ângulo de lançamento (θ) deve ser informado.');
  }

  const bigV0 = parseBig(input.v0);
  if (bigV0.lte(0)) {
    throw new Error('A velocidade inicial deve ser estritamente positiva (v0 > 0).');
  }

  const bigAngle = parseBig(input.angleDeg);
  if (bigAngle.lte(0) || bigAngle.gte(90)) {
    throw new Error('Para lançamento oblíquo, o ângulo deve estar estritamente entre 0° e 90°.');
  }

  const bigY0 = input.y0 !== undefined && input.y0.trim() !== '' ? parseBig(input.y0) : new Big(0);
  if (bigY0.lt(0)) {
    throw new Error('A altura inicial não pode ser negativa.');
  }

  const bigG = normalizeGravity(input.g ?? options.gravity);

  const angleDegNum = Number(bigAngle.toString());
  const angleRad = degToRad(angleDegNum);

  const cosVal = cosDeg(bigAngle);
  const sinVal = sinDeg(bigAngle);

  const bigV0x = bigV0.times(cosVal);
  const bigV0y = bigV0.times(sinVal);

  const steps: string[] = [];
  steps.push('**Lançamento Oblíquo Balístico**');

  steps.push(
    `1. **Identificação dos Dados Iniciais:**\n` +
      `   • Módulo da velocidade de lançamento (v₀) = **${formatNumberSmart(bigV0, decimals, separator)} m/s**\n` +
      `   • Ângulo de tiro com a horizontal (θ) = **${formatNumberSmart(bigAngle, decimals, separator)}°** (~**${angleRad.toFixed(4)} rad**)\n` +
      `   • Altura inicial de disparo (y₀) = **${formatNumberSmart(bigY0, decimals, separator)} m**\n` +
      `   • Aceleração da gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**`
  );

  steps.push(
    `2. **Decomposição Trigonométrica da Velocidade:**\n` +
      `   • Componente horizontal: v₀ₓ = v₀ · cos(θ) = ${formatNumberSmart(bigV0, decimals, separator)} · ${formatNumberSmart(cosVal, 4, separator)} = **${formatNumberSmart(bigV0x, decimals, separator)} m/s**\n` +
      `   • Componente vertical inicial: v₀ᵧ = v₀ · sin(θ) = ${formatNumberSmart(bigV0, decimals, separator)} · ${formatNumberSmart(sinVal, 4, separator)} = **${formatNumberSmart(bigV0y, decimals, separator)} m/s**`
  );

  // 1. Tempo de subida até o vértice: t_subida = v0y / g
  const bigTSubida = bigV0y.div(bigG);

  steps.push(
    `3. **Tempo de Subida até o Vértice:**\n` +
      `   No ápice da parábola, a componente vertical anula-se (vᵧ = 0):\n` +
      `   vᵧ(t) = v₀ᵧ - g · t  ⟹  t_subida = v₀ᵧ / g\n` +
      `   t_subida = ${formatNumberSmart(bigV0y, decimals, separator)} / ${formatNumberSmart(bigG, decimals, separator)}\n` +
      `   **t_subida = ${formatNumberSmart(bigTSubida, decimals, separator)} s**`
  );

  // 2. Altura máxima: H_max = y0 + v0y^2 / (2 * g)
  const v0ySq = bigV0y.times(bigV0y);
  const twoG = bigG.times(2);
  const deltaHMax = v0ySq.div(twoG);
  const bigHMax = bigY0.plus(deltaHMax);

  steps.push(
    `4. **Altura Máxima Atingida (H_máx):**\n` +
      `   H_máx = y₀ + v₀ᵧ² / (2 · g)\n` +
      `   H_máx = ${formatNumberSmart(bigY0, decimals, separator)} + (${formatNumberSmart(bigV0y, decimals, separator)})² / (2 · ${formatNumberSmart(bigG, decimals, separator)})\n` +
      `   **H_máx = ${formatNumberSmart(bigHMax, decimals, separator)} m**`
  );

  // 3. Tempo total de voo (t_voo)
  let bigTVoo: Big;
  if (bigY0.eq(0)) {
    bigTVoo = bigTSubida.times(2);
    steps.push(
      `5. **Tempo Total de Voo (Com Simetria de Trajetória y₀ = 0):**\n` +
        `   t_voo = 2 · t_subida = 2 · ${formatNumberSmart(bigTSubida, decimals, separator)}\n` +
        `   **t_voo = ${formatNumberSmart(bigTVoo, decimals, separator)} s**`
    );
  } else {
    // 1/2 g t^2 - v0y t - y0 = 0
    const twoGY0 = bigG.times(bigY0).times(2);
    const disc = v0ySq.plus(twoGY0);
    const sqrtDisc = safeSqrt(disc, 'tempo de voo oblíquo');
    bigTVoo = bigV0y.plus(sqrtDisc).div(bigG);

    steps.push(
      `5. **Tempo Total de Voo (Desnível Inicial y₀ > 0):**\n` +
        `   Resolvendo y(t) = 0:\n` +
        `   t_voo = (v₀ᵧ + √(v₀ᵧ² + 2 · g · y₀)) / g\n` +
        `   **t_voo = ${formatNumberSmart(bigTVoo, decimals, separator)} s**`
    );
  }

  // 4. Alcance horizontal: A = v0x * t_voo
  const bigAlcance = bigV0x.times(bigTVoo);

  steps.push(
    `6. **Alcance Horizontal Máximo (A):**\n` +
      `   A = v₀ₓ · t_voo = ${formatNumberSmart(bigV0x, decimals, separator)} · ${formatNumberSmart(bigTVoo, decimals, separator)}\n` +
      `   **Alcance (A) = ${formatNumberSmart(bigAlcance, decimals, separator)} m**`
  );

  // Gera pontos da trajetória 2D (x, y)
  const tVooNum = Number(bigTVoo.toString());
  const v0xNum = Number(bigV0x.toString());
  const v0yNum = Number(bigV0y.toString());
  const y0Num = Number(bigY0.toString());
  const gNum = Number(bigG.toString());

  const pointsCount = 31;
  const stepT = tVooNum / (pointsCount - 1);
  const trajectoryPoints: Array<{ x: number; y: number; t: number }> = [];

  for (let i = 0; i < pointsCount; i++) {
    const t = Number((i * stepT).toFixed(4));
    const xVal = v0xNum * t;
    const yVal = Math.max(0, y0Num + v0yNum * t - 0.5 * gNum * t * t);
    trajectoryPoints.push({
      x: Number(xVal.toFixed(4)),
      y: Number(yVal.toFixed(4)),
      t: Number(t.toFixed(4)),
    });
  }

  const apexX = Number(bigV0x.times(bigTSubida).toFixed(4));
  const apexY = Number(bigHMax.toFixed(4));
  const alcanceNum = Number(bigAlcance.toFixed(4));

  const chartData: BallisticChartData = {
    type: 'ballistic',
    points: trajectoryPoints.map((p) => ({ x: p.x, y: p.y, t: p.t })),
    apex: { x: apexX, y: apexY },
    range: { x: alcanceNum, y: 0 },
    initialHeight: y0Num,
  };

  const formattedHMax = formatNumberSmart(bigHMax, decimals, separator);
  const formattedAlcance = formatNumberSmart(bigAlcance, decimals, separator);
  const formattedTVoo = formatNumberSmart(bigTVoo, decimals, separator);

  return {
    mode: 'lancamento_obliquo',
    category: 'cinematica',
    equationTitle: 'Lançamento Oblíquo Balístico',
    summary: `Alcance = ${formattedAlcance} m | H_máx = ${formattedHMax} m | t_voo = ${formattedTVoo} s`,
    v0: Number(bigV0.toString()),
    angleDeg: angleDegNum,
    angleRad,
    v0x: v0xNum,
    v0y: v0yNum,
    g: gNum,
    tSubida: Number(bigTSubida.toString()),
    tVoo: tVooNum,
    hMax: Number(bigHMax.toString()),
    alcance: alcanceNum,
    formattedHMax,
    formattedAlcance,
    formattedTVoo,
    trajectoryPoints,
    steps,
    chartData,
  };
}
