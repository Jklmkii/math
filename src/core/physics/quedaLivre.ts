import type { QuedaLivreInput, QuedaLivreResult, TemporalChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, safeSqrt, msToKmh } from './physicsUtils';

/**
 * Queda Livre sob Ação Gravitacional
 * Altura h(t) = h0 - 1/2 * g * t^2
 * Tempo de queda t = sqrt(2 * h0 / g)
 * Velocidade de impacto v = g * t = sqrt(2 * g * h0)
 */
export function calculateQuedaLivre(
  input: QuedaLivreInput,
  options: PhysicsCalculationOptions = {}
): QuedaLivreResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.h0 || input.h0.trim() === '') {
    throw new Error('A altura inicial de soltura deve ser informada.');
  }

  const bigH0 = parseBig(input.h0);
  if (bigH0.lte(0)) {
    throw new Error('A altura inicial de soltura deve ser estritamente positiva (h0 > 0).');
  }

  const bigG = normalizeGravity(input.g ?? options.gravity);

  const steps: string[] = [];
  steps.push('**Queda Livre a partir do Repouso (v₀ = 0)**');

  steps.push(
    `1. **Identificação dos Parâmetros Iniciais:**\n` +
      `   • Altura inicial de soltura (h₀) = **${formatNumberSmart(bigH0, decimals, separator)} m**\n` +
      `   • Aceleração da gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**\n` +
      `   • Velocidade inicial (v₀) = **0 m/s** (abandono a partir do repouso)`
  );

  // t_queda = sqrt(2 * h0 / g)
  const twoH0 = bigH0.times(2);
  const fractionT = twoH0.div(bigG);
  const bigTQueda = safeSqrt(fractionT, 'tempo de queda');

  steps.push(
    `2. **Cálculo do Tempo Total de Queda:**\n` +
      `   No solo, a altura final é y = 0. Pela função horária y(t) = h₀ - ½ · g · t²:\n` +
      `   0 = h₀ - ½ · g · t²  ⟹  t_queda = √(2 · h₀ / g)\n` +
      `   t_queda = √(2 · ${formatNumberSmart(bigH0, decimals, separator)} / ${formatNumberSmart(bigG, decimals, separator)})\n` +
      `   t_queda = √(${formatNumberSmart(fractionT, decimals, separator)})\n` +
      `   **t_queda = ${formatNumberSmart(bigTQueda, decimals, separator)} s**`
  );

  // v_impacto = g * t_queda = sqrt(2 * g * h0)
  const bigVImpacto = bigG.times(bigTQueda);
  const bigVImpactoKmh = msToKmh(bigVImpacto);

  steps.push(
    `3. **Cálculo da Velocidade de Impacto com o Solo:**\n` +
      `   Pela função da velocidade v(t) = g · t ou pela Equação de Torricelli v² = 2 · g · h₀:\n` +
      `   v_impacto = g · t_queda = ${formatNumberSmart(bigG, decimals, separator)} · ${formatNumberSmart(bigTQueda, decimals, separator)}\n` +
      `   **v_impacto = ${formatNumberSmart(bigVImpacto, decimals, separator)} m/s** (~**${formatNumberSmart(bigVImpactoKmh, decimals, separator)} km/h**)`
  );

  steps.push(
    `4. **Interpretação Física:**\n` +
      `   O corpo sofre aceleração constante para baixo, aumentando sua velocidade em ` +
      `**${formatNumberSmart(bigG, decimals, separator)} m/s a cada segundo**, atingindo o solo em ` +
      `**${formatNumberSmart(bigTQueda, decimals, separator)} s** a **${formatNumberSmart(bigVImpactoKmh, decimals, separator)} km/h**.`
  );

  // Gera pontos da trajetória y(t) e v(t)
  const tQuedaNum = Number(bigTQueda.toString());
  const h0Num = Number(bigH0.toString());
  const gNum = Number(bigG.toString());
  const pointsCount = 21;
  const stepT = tQuedaNum / (pointsCount - 1);

  const trajectoryPoints: Array<{ t: number; y: number; v: number }> = [];

  for (let i = 0; i < pointsCount; i++) {
    const t = Number((i * stepT).toFixed(4));
    const yVal = Math.max(0, h0Num - 0.5 * gNum * t * t);
    const vVal = gNum * t;
    trajectoryPoints.push({
      t: Number(t.toFixed(4)),
      y: Number(yVal.toFixed(4)),
      v: Number(vVal.toFixed(4)),
    });
  }

  const chartData: TemporalChartData = {
    type: 'temporal',
    points: trajectoryPoints.map((p) => ({ t: p.t, y: p.y, v: p.v })),
    xLabel: 'Tempo (s)',
    yLabel: 'Altura y(t) (m)',
  };

  const formattedTQueda = formatNumberSmart(bigTQueda, decimals, separator);
  const formattedVImpacto = formatNumberSmart(bigVImpacto, decimals, separator);

  return {
    mode: 'queda_livre',
    category: 'cinematica',
    equationTitle: 'Queda Livre sob Ação Gravitacional',
    summary: `t_queda = ${formattedTQueda} s | v_impacto = ${formattedVImpacto} m/s (${formatNumberSmart(bigVImpactoKmh, decimals, separator)} km/h)`,
    h0: h0Num,
    g: gNum,
    tQueda: tQuedaNum,
    vImpacto: Number(bigVImpacto.toString()),
    formattedTQueda,
    formattedVImpacto,
    trajectoryPoints,
    steps,
    chartData,
  };
}
