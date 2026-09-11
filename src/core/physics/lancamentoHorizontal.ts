import type { LancamentoHorizontalInput, LancamentoHorizontalResult, BallisticChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, safeSqrt, msToKmh, radToDeg } from './physicsUtils';

/**
 * Lançamento Horizontal Bidimensional (Composição de Galileu)
 * Eixo X: MRU -> x(t) = v0x * t
 * Eixo Y: Queda Livre -> y(t) = h0 - 1/2 * g * t^2
 * Tempo de queda: t_queda = sqrt(2 * h0 / g)
 * Alcance horizontal: A = v0x * t_queda
 */
export function calculateLancamentoHorizontal(
  input: LancamentoHorizontalInput,
  options: PhysicsCalculationOptions = {}
): LancamentoHorizontalResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.h0 || input.h0.trim() === '') {
    throw new Error('A altura inicial (h0) deve ser informada.');
  }
  if (!input.v0x || input.v0x.trim() === '') {
    throw new Error('A velocidade horizontal inicial (v0x) deve ser informada.');
  }

  const bigH0 = parseBig(input.h0);
  if (bigH0.lte(0)) {
    throw new Error('A altura inicial deve ser estritamente positiva (h0 > 0).');
  }

  const bigV0x = parseBig(input.v0x);
  if (bigV0x.lte(0)) {
    throw new Error('A velocidade horizontal inicial deve ser estritamente positiva (v0x > 0).');
  }

  const bigG = normalizeGravity(input.g ?? options.gravity);

  const steps: string[] = [];
  steps.push('**Lançamento Horizontal Bidimensional (Princípio de Galileu)**');

  steps.push(
    `1. **Identificação dos Dados Fornecidos:**\n` +
      `   • Altura da plataforma de lançamento (h₀) = **${formatNumberSmart(bigH0, decimals, separator)} m**\n` +
      `   • Velocidade horizontal de disparo (v₀ₓ) = **${formatNumberSmart(bigV0x, decimals, separator)} m/s** (~**${formatNumberSmart(msToKmh(bigV0x), decimals, separator)} km/h**)\n` +
      `   • Aceleração da gravidade (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**`
  );

  // 1. Tempo de queda no eixo Y
  const twoH0 = bigH0.times(2);
  const fractionT = twoH0.div(bigG);
  const bigTQueda = safeSqrt(fractionT, 'tempo de queda');

  steps.push(
    `2. **Princípio da Independência dos Movimentos (Tempo de Queda):**\n` +
      `   O movimento vertical é uma queda livre pura a partir do repouso em Y (v₀ᵧ = 0):\n` +
      `   y(t) = h₀ - ½ · g · t²  ⟹  t_queda = √(2 · h₀ / g)\n` +
      `   t_queda = √(2 · ${formatNumberSmart(bigH0, decimals, separator)} / ${formatNumberSmart(bigG, decimals, separator)})\n` +
      `   **t_queda = ${formatNumberSmart(bigTQueda, decimals, separator)} s**`
  );

  // 2. Alcance horizontal no eixo X
  const bigAlcance = bigV0x.times(bigTQueda);

  steps.push(
    `3. **Alcance Horizontal Máximo (Eixo X - MRU):**\n` +
      `   No plano horizontal, não há aceleração atuando (aₓ = 0). O movimento é uniforme:\n` +
      `   A = v₀ₓ · t_queda\n` +
      `   A = ${formatNumberSmart(bigV0x, decimals, separator)} · ${formatNumberSmart(bigTQueda, decimals, separator)}\n` +
      `   **Alcance (A) = ${formatNumberSmart(bigAlcance, decimals, separator)} m**`
  );

  // 3. Velocidade no impacto com o solo
  const bigVyFinal = bigG.times(bigTQueda);
  const v0xSq = bigV0x.times(bigV0x);
  const vySq = bigVyFinal.times(bigVyFinal);
  const vImpactoSq = v0xSq.plus(vySq);
  const bigVImpacto = safeSqrt(vImpactoSq, 'velocidade de impacto');
  const bigVImpactoKmh = msToKmh(bigVImpacto);

  const angleImpactRad = Math.atan2(Number(bigVyFinal.toString()), Number(bigV0x.toString()));
  const angleImpactDeg = radToDeg(angleImpactRad);

  steps.push(
    `4. **Composição Vetorial da Velocidade de Impacto:**\n` +
      `   • Componente horizontal constante: vₓ = **${formatNumberSmart(bigV0x, decimals, separator)} m/s**\n` +
      `   • Componente vertical final: vᵧ = g · t_queda = **${formatNumberSmart(bigVyFinal, decimals, separator)} m/s**\n` +
      `   • Módulo da velocidade resultante: v_impacto = √(vₓ² + vᵧ²)\n` +
      `   v_impacto = √(${formatNumberSmart(v0xSq, decimals, separator)} + ${formatNumberSmart(vySq, decimals, separator)})\n` +
      `   **v_impacto = ${formatNumberSmart(bigVImpacto, decimals, separator)} m/s** (~**${formatNumberSmart(bigVImpactoKmh, decimals, separator)} km/h**)\n` +
      `   • Ângulo com a horizontal no impacto: **θ = ${angleImpactDeg.toFixed(2)}°** abaixo da horizontal`
  );

  // Gera pontos da trajetória bidimensional (x, y)
  const tQuedaNum = Number(bigTQueda.toString());
  const v0xNum = Number(bigV0x.toString());
  const h0Num = Number(bigH0.toString());
  const gNum = Number(bigG.toString());

  const pointsCount = 25;
  const stepT = tQuedaNum / (pointsCount - 1);
  const trajectoryPoints: Array<{ x: number; y: number; t: number }> = [];

  for (let i = 0; i < pointsCount; i++) {
    const t = Number((i * stepT).toFixed(4));
    const xVal = v0xNum * t;
    const yVal = Math.max(0, h0Num - 0.5 * gNum * t * t);
    trajectoryPoints.push({
      x: Number(xVal.toFixed(4)),
      y: Number(yVal.toFixed(4)),
      t: Number(t.toFixed(4)),
    });
  }

  const h0Float = Number(bigH0.toString());
  const alcanceFloat = Number(bigAlcance.toString());

  const chartData: BallisticChartData = {
    type: 'ballistic',
    points: trajectoryPoints.map((p) => ({ x: p.x, y: p.y, t: p.t })),
    apex: { x: 0, y: h0Float },
    range: { x: alcanceFloat, y: 0 },
    initialHeight: h0Float,
  };

  const formattedTQueda = formatNumberSmart(bigTQueda, decimals, separator);
  const formattedAlcance = formatNumberSmart(bigAlcance, decimals, separator);
  const formattedVImpacto = formatNumberSmart(bigVImpacto, decimals, separator);

  return {
    mode: 'lancamento_horizontal',
    category: 'cinematica',
    equationTitle: 'Lançamento Horizontal (Galileu)',
    summary: `Alcance = ${formattedAlcance} m | t_queda = ${formattedTQueda} s | v_impacto = ${formattedVImpacto} m/s`,
    h0: h0Float,
    v0x: v0xNum,
    g: gNum,
    tQueda: tQuedaNum,
    alcance: alcanceFloat,
    vImpacto: Number(bigVImpacto.toString()),
    vyFinal: Number(bigVyFinal.toString()),
    formattedTQueda,
    formattedAlcance,
    formattedVImpacto,
    trajectoryPoints,
    steps,
    chartData,
  };
}
