import Big from 'big.js';
import type { LancamentoVerticalInput, LancamentoVerticalResult, TemporalChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, safeSqrt, msToKmh } from './physicsUtils';

/**
 * Lançamento Vertical Unidimensional
 * y(t) = y0 + v0 * t - 1/2 * g * t^2
 * v(t) = v0 - g * t
 * t_subida = v0 / g
 * H_max = y0 + v0^2 / (2 * g)
 */
export function calculateLancamentoVertical(
  input: LancamentoVerticalInput,
  options: PhysicsCalculationOptions = {}
): LancamentoVerticalResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.v0 || input.v0.trim() === '') {
    throw new Error('A velocidade inicial de lançamento (v0) deve ser informada.');
  }

  const bigV0 = parseBig(input.v0);
  const bigY0 = input.y0 !== undefined && input.y0.trim() !== '' ? parseBig(input.y0) : new Big(0);

  if (bigY0.lt(0)) {
    throw new Error('A altura inicial não pode ser negativa.');
  }
  if (bigY0.lte(0) && bigV0.lte(0)) {
    throw new Error('A velocidade inicial deve ser estritamente positiva para um lançamento vertical ascendente a partir do solo.');
  }
  if (bigV0.lte(0)) {
    throw new Error('A velocidade inicial deve ser estritamente positiva (v0 > 0).');
  }

  const bigG = normalizeGravity(input.g ?? options.gravity);

  const steps: string[] = [];
  steps.push('**Lançamento Vertical Ascendente**');

  steps.push(
    `1. **Identificação dos Dados Iniciais:**\n` +
      `   • Velocidade inicial de lançamento (v₀) = **${formatNumberSmart(bigV0, decimals, separator)} m/s** (~**${formatNumberSmart(msToKmh(bigV0), decimals, separator)} km/h**)\n` +
      `   • Altura inicial (y₀) = **${formatNumberSmart(bigY0, decimals, separator)} m**\n` +
      `   • Aceleração da gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²** (atuando contra o movimento ascendente)`
  );

  // 1. Tempo de subida: t_subida = v0 / g
  const bigTSubida = bigV0.div(bigG);

  steps.push(
    `2. **Tempo de Subida até o Ápice:**\n` +
      `   No ponto mais alto da trajetória, a velocidade instantânea anula-se (v = 0):\n` +
      `   v(t) = v₀ - g · t  ⟹  0 = v₀ - g · t_subida  ⟹  t_subida = v₀ / g\n` +
      `   t_subida = ${formatNumberSmart(bigV0, decimals, separator)} / ${formatNumberSmart(bigG, decimals, separator)}\n` +
      `   **t_subida = ${formatNumberSmart(bigTSubida, decimals, separator)} s**`
  );

  // 2. Altura máxima: H_max = y0 + v0^2 / (2 * g)
  const v0Sq = bigV0.times(bigV0);
  const twoG = bigG.times(2);
  const deltaHMax = v0Sq.div(twoG);
  const bigHMax = bigY0.plus(deltaHMax);

  steps.push(
    `3. **Altura Máxima Atingida (H_máx):**\n` +
      `   H_máx = y₀ + v₀² / (2 · g)\n` +
      `   H_máx = ${formatNumberSmart(bigY0, decimals, separator)} + (${formatNumberSmart(bigV0, decimals, separator)})² / (2 · ${formatNumberSmart(bigG, decimals, separator)})\n` +
      `   H_máx = ${formatNumberSmart(bigY0, decimals, separator)} + (${formatNumberSmart(deltaHMax, decimals, separator)})\n` +
      `   **H_máx = ${formatNumberSmart(bigHMax, decimals, separator)} m**`
  );

  // 3. Tempo total até o solo (y = 0)
  // 1/2 g t^2 - v0 t - y0 = 0
  // t_total = (v0 + sqrt(v0^2 + 2 * g * y0)) / g
  const twoGY0 = bigG.times(bigY0).times(2);
  const discTotal = v0Sq.plus(twoGY0);
  const sqrtDiscTotal = safeSqrt(discTotal, 'tempo de voo total');
  const bigTTotal = bigV0.plus(sqrtDiscTotal).div(bigG);

  // 4. Velocidade de impacto com o solo: v_retorno = sqrt(v0^2 + 2 * g * y0)
  const bigVRetorno = sqrtDiscTotal;
  const bigVRetornoKmh = msToKmh(bigVRetorno);

  if (bigY0.eq(0)) {
    steps.push(
      `4. **Tempo Total de Voo e Retorno ao Solo (Simetria Parabólica):**\n` +
        `   Como o lançamento ocorre e termina na mesma cota de nível (y₀ = 0), o tempo de descida é exatamente igual ao de subida:\n` +
        `   t_total = 2 · t_subida = 2 · ${formatNumberSmart(bigTSubida, decimals, separator)}\n` +
        `   **t_total = ${formatNumberSmart(bigTTotal, decimals, separator)} s**\n` +
        `   Pela conservação da energia mecânica, o módulo da velocidade ao retornar ao solo é igual à inicial:\n` +
        `   **v_retorno = ${formatNumberSmart(bigVRetorno, decimals, separator)} m/s** (~**${formatNumberSmart(bigVRetornoKmh, decimals, separator)} km/h**)`
    );
  } else {
    steps.push(
      `4. **Tempo Total até o Solo e Velocidade de Impacto:**\n` +
        `   Resolvendo y(t) = 0 para y₀ > 0:\n` +
        `   t_total = (v₀ + √(v₀² + 2 · g · y₀)) / g\n` +
        `   **t_total = ${formatNumberSmart(bigTTotal, decimals, separator)} s**\n` +
        `   Velocidade de impacto no solo:\n` +
        `   v_retorno = √(v₀² + 2 · g · y₀) = **${formatNumberSmart(bigVRetorno, decimals, separator)} m/s** (~**${formatNumberSmart(bigVRetornoKmh, decimals, separator)} km/h**)`
    );
  }

  // Gera pontos da trajetória y(t) e v(t)
  const tTotalNum = Number(bigTTotal.toString());
  const y0Num = Number(bigY0.toString());
  const v0Num = Number(bigV0.toString());
  const gNum = Number(bigG.toString());

  const pointsCount = 25;
  const stepT = tTotalNum / (pointsCount - 1);
  const trajectoryPoints: Array<{ t: number; y: number; v: number }> = [];

  for (let i = 0; i < pointsCount; i++) {
    const t = Number((i * stepT).toFixed(4));
    const yVal = Math.max(0, y0Num + v0Num * t - 0.5 * gNum * t * t);
    const vVal = v0Num - gNum * t;
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

  const formattedTSubida = formatNumberSmart(bigTSubida, decimals, separator);
  const formattedHMax = formatNumberSmart(bigHMax, decimals, separator);
  const formattedTTotal = formatNumberSmart(bigTTotal, decimals, separator);

  return {
    mode: 'lancamento_vertical',
    category: 'cinematica',
    equationTitle: 'Lançamento Vertical Ascendente',
    summary: `H_máx = ${formattedHMax} m | t_subida = ${formattedTSubida} s | t_total = ${formattedTTotal} s`,
    y0: y0Num,
    v0: v0Num,
    g: gNum,
    tSubida: Number(bigTSubida.toString()),
    hMax: Number(bigHMax.toString()),
    tTotal: tTotalNum,
    vRetorno: Number(bigVRetorno.toString()),
    formattedTSubida,
    formattedHMax,
    formattedTTotal,
    trajectoryPoints,
    steps,
    chartData,
  };
}
