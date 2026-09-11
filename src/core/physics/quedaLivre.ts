import type { QuedaLivreInput, QuedaLivreResult, TemporalChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, safeSqrt, msToKmh } from './physicsUtils';
import Big from 'big.js';

/**
 * Queda Livre sob Ação Gravitacional
 * No vácuo:
 *   Altura h(t) = h0 - 1/2 * g * t^2
 *   Tempo de queda t = sqrt(2 * h0 / g)
 *   Velocidade de impacto v = g * t = sqrt(2 * g * h0)
 * Com resistência do ar (Velocidade Terminal vt):
 *   v(t) = vt * tanh(g * t / vt)
 *   y(t) = h0 - (vt^2 / g) * ln(cosh(g * t / vt))
 *   v_impacto = vt * sqrt(1 - exp(-2 * g * h0 / vt^2))
 *   t_queda = (vt / g) * arcosh(exp(g * h0 / vt^2))
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
  const h0Num = Number(bigH0.toString());
  const gNum = Number(bigG.toString());

  // Verificação de Velocidade Terminal (Arrasto Aerodinâmico)
  const hasAirResistance = Boolean(
    input.vTerminal && input.vTerminal.trim() !== '' && (input.enableAirResistance ?? true)
  );

  let bigVt: Big | undefined;
  if (hasAirResistance && input.vTerminal) {
    bigVt = parseBig(input.vTerminal);
    if (bigVt.lte(0)) {
      throw new Error('A velocidade terminal (vt) deve ser estritamente positiva (vt > 0).');
    }
  }

  // 1. Cálculo clássico no vácuo
  const twoH0 = bigH0.times(2);
  const fractionT = twoH0.div(bigG);
  const bigVacuumTQueda = safeSqrt(fractionT, 'tempo de queda no vácuo');
  const bigVacuumVImpacto = bigG.times(bigVacuumTQueda);
  const bigVacuumVImpactoKmh = msToKmh(bigVacuumVImpacto);

  const vacuumTQueda = Number(bigVacuumTQueda.toString());
  const vacuumVImpacto = Number(bigVacuumVImpacto.toString());

  const steps: string[] = [];

  if (!hasAirResistance || !bigVt) {
    // Modo Clássico (Vácuo / Sem Resistência do Ar)
    steps.push('**Queda Livre a partir do Repouso no Vácuo (v₀ = 0)**');

    steps.push(
      `1. **Identificação dos Parâmetros Iniciais:**\n` +
        `   • Altura inicial de soltura (h₀) = **${formatNumberSmart(bigH0, decimals, separator)} m**\n` +
        `   • Aceleração da gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**\n` +
        `   • Velocidade inicial (v₀) = **0 m/s** (abandono a partir do repouso)\n` +
        `   • Resistência do ar: **Desprezada (vácuo ideal)**`
    );

    steps.push(
      `2. **Cálculo do Tempo Total de Queda:**\n` +
        `   No solo, a altura final é y = 0. Pela função horária y(t) = h₀ - ½ · g · t²:\n` +
        `   0 = h₀ - ½ · g · t²  ⟹  t_queda = √(2 · h₀ / g)\n` +
        `   t_queda = √(2 · ${formatNumberSmart(bigH0, decimals, separator)} / ${formatNumberSmart(bigG, decimals, separator)})\n` +
        `   t_queda = √(${formatNumberSmart(fractionT, decimals, separator)})\n` +
        `   **t_queda = ${formatNumberSmart(bigVacuumTQueda, decimals, separator)} s**`
    );

    steps.push(
      `3. **Cálculo da Velocidade de Impacto com o Solo:**\n` +
        `   Pela função da velocidade v(t) = g · t ou pela Equação de Torricelli v² = 2 · g · h₀:\n` +
        `   v_impacto = g · t_queda = ${formatNumberSmart(bigG, decimals, separator)} · ${formatNumberSmart(bigVacuumTQueda, decimals, separator)}\n` +
        `   **v_impacto = ${formatNumberSmart(bigVacuumVImpacto, decimals, separator)} m/s** (~**${formatNumberSmart(bigVacuumVImpactoKmh, decimals, separator)} km/h**)`
    );

    steps.push(
      `4. **Interpretação Física:**\n` +
        `   O corpo sofre aceleração constante para baixo, aumentando sua velocidade em ` +
        `**${formatNumberSmart(bigG, decimals, separator)} m/s a cada segundo**, atingindo o solo em ` +
        `**${formatNumberSmart(bigVacuumTQueda, decimals, separator)} s** a **${formatNumberSmart(bigVacuumVImpactoKmh, decimals, separator)} km/h**.`
    );

    // Pontos da trajetória no vácuo
    const pointsCount = 21;
    const stepT = vacuumTQueda / (pointsCount - 1);
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

    const formattedTQueda = formatNumberSmart(bigVacuumTQueda, decimals, separator);
    const formattedVImpacto = formatNumberSmart(bigVacuumVImpacto, decimals, separator);

    return {
      mode: 'queda_livre',
      category: 'cinematica',
      equationTitle: 'Queda Livre sob Ação Gravitacional',
      summary: `t_queda = ${formattedTQueda} s | v_impacto = ${formattedVImpacto} m/s (${formatNumberSmart(bigVacuumVImpactoKmh, decimals, separator)} km/h)`,
      h0: h0Num,
      g: gNum,
      tQueda: vacuumTQueda,
      vImpacto: vacuumVImpacto,
      formattedTQueda,
      formattedVImpacto,
      trajectoryPoints,
      steps,
      chartData,
      hasAirResistance: false,
    };
  }

  // 2. Modo com Resistência do Ar e Velocidade Terminal
  const vtNum = Number(bigVt.toString());
  const vtKmh = vtNum * 3.6;

  steps.push('**Queda Livre com Resistência do Ar (Arrasto Quadrático & Velocidade Terminal)**');

  steps.push(
    `1. **Parâmetros Iniciais e Força de Arrasto Aerodinâmico:**\n` +
      `   • Altura de queda (h₀) = **${formatNumberSmart(bigH0, decimals, separator)} m**\n` +
      `   • Gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**\n` +
      `   • Velocidade Terminal (v_t) = **${formatNumberSmart(bigVt, decimals, separator)} m/s** (~**${formatNumberSmart(vtKmh, decimals, separator)} km/h**)\n` +
      `   • Modelo de Arrasto: Força de resistência $F_d = k \\cdot v^2$. No equilíbrio de velocidade terminal, $F_d = P \\implies k \\cdot v_t^2 = m \\cdot g$.`
  );

  // v_impacto = vt * sqrt(1 - exp(-2 * g * h0 / vt^2))
  const arg = (gNum * h0Num) / (vtNum * vtNum);
  const expFactor = Math.exp(-2 * arg);
  const vImpactoNum = vtNum * Math.sqrt(Math.max(0, 1 - expFactor));
  const vImpactoKmh = vImpactoNum * 3.6;

  steps.push(
    `2. **Velocidade de Impacto com a Superfície:**\n` +
      `   Integrando a equação diferencial $m \\frac{dv}{dt} = m g - k v^2$ em função da altura percorrida $y$:\n` +
      `   $v(y) = v_t \\cdot \\sqrt{1 - e^{-2 g (h₀ - y) / v_t^2}}$\n` +
      `   No solo ($y = 0$):\n` +
      `   $v_{impacto} = ${formatNumberSmart(vtNum, decimals, separator)} \\cdot \\sqrt{1 - e^{-2 \\cdot ${formatNumberSmart(gNum, decimals, separator)} \\cdot ${formatNumberSmart(h0Num, decimals, separator)} / ${formatNumberSmart(vtNum * vtNum, decimals, separator)}}}\n` +
      `   **v_impacto = ${formatNumberSmart(vImpactoNum, decimals, separator)} m/s** (~**${formatNumberSmart(vImpactoKmh, decimals, separator)} km/h**)`
  );

  // t_queda = (vt / g) * arcosh(exp(g * h0 / vt^2))
  let acoshVal: number;
  if (arg > 30) {
    acoshVal = arg + Math.LN2;
  } else {
    acoshVal = Math.acosh(Math.exp(arg));
  }
  const tQuedaNum = (vtNum / gNum) * acoshVal;

  steps.push(
    `3. **Cálculo do Tempo Total de Queda:**\n` +
      `   Pela integração temporal da função horária da velocidade $v(t) = v_t \\cdot \\tanh(g \\cdot t / v_t)$:\n` +
      `   $h(t) = h_0 - \\frac{v_t^2}{g} \\ln\\left(\\cosh\\left(\\frac{g \\cdot t}{v_t}\\right)\\right)$\n` +
      `   Fazendo $h(t) = 0$:\n` +
      `   $t_{queda} = \\frac{v_t}{g} \\cdot \\operatorname{arcosh}\\left(e^{\\frac{g \\cdot h_0}{v_t^2}}\\right)\n` +
      `   **t_queda = ${formatNumberSmart(tQuedaNum, decimals, separator)} s**`
  );

  const percentageOfVt = Math.min(100, Math.round((vImpactoNum / vtNum) * 100));

  steps.push(
    `4. **Comparação Didática: Vácuo vs Atmosfera:**\n` +
      `   • Tempo no Vácuo: **${formatNumberSmart(vacuumTQueda, decimals, separator)} s** ⟶ Com Arrasto: **${formatNumberSmart(tQuedaNum, decimals, separator)} s** (diferença de +${formatNumberSmart(tQuedaNum - vacuumTQueda, decimals, separator)} s)\n` +
      `   • Vel. Impacto no Vácuo: **${formatNumberSmart(vacuumVImpacto, decimals, separator)} m/s** (~${formatNumberSmart(vacuumVImpacto * 3.6, decimals, separator)} km/h)\n` +
      `   • Vel. Impacto Real: **${formatNumberSmart(vImpactoNum, decimals, separator)} m/s** (~${formatNumberSmart(vImpactoKmh, decimals, separator)} km/h)\n` +
      `   • O objeto atingiu **${percentageOfVt}% da velocidade terminal** antes de atingir o solo.`
  );

  // Geração da curva temporal com arrasto
  const pointsCount = 30;
  const stepT = tQuedaNum / (pointsCount - 1);
  const trajectoryPoints: Array<{ t: number; y: number; v: number }> = [];

  for (let i = 0; i < pointsCount; i++) {
    const t = Number((i * stepT).toFixed(4));
    const u = (gNum * t) / vtNum;
    const vVal = vtNum * Math.tanh(u);
    // y(t) = h0 - (vt^2 / g) * ln(cosh(u))
    // log(cosh(u)) para u grande pode ser aproximado por u - ln(2)
    const logCosh = u > 20 ? u - Math.LN2 : Math.log(Math.cosh(u));
    const fallDist = (vtNum * vtNum / gNum) * logCosh;
    const yVal = Math.max(0, h0Num - fallDist);

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

  const formattedTQueda = formatNumberSmart(tQuedaNum, decimals, separator);
  const formattedVImpacto = formatNumberSmart(vImpactoNum, decimals, separator);
  const formattedVTerminal = formatNumberSmart(bigVt, decimals, separator);

  return {
    mode: 'queda_livre',
    category: 'cinematica',
    equationTitle: 'Queda com Resistência do Ar (Velocidade Terminal)',
    summary: `t_queda = ${formattedTQueda} s | v_impacto = ${formattedVImpacto} m/s (${formatNumberSmart(vImpactoKmh, decimals, separator)} km/h) | vt = ${formattedVTerminal} m/s`,
    h0: h0Num,
    g: gNum,
    tQueda: tQuedaNum,
    vImpacto: vImpactoNum,
    vTerminal: vtNum,
    formattedTQueda,
    formattedVImpacto,
    formattedVTerminal,
    hasAirResistance: true,
    vacuumTQueda,
    vacuumVImpacto,
    percentageOfVTerminal: percentageOfVt,
    trajectoryPoints,
    steps,
    chartData,
  };
}
