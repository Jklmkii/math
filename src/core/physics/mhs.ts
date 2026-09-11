import Big from 'big.js';
import type { MHSInput, MHSResult, TemporalChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, safeSqrt } from './physicsUtils';

/**
 * Movimento Harmônico Simples (MHS)
 * Pêndulo Simples: ω = sqrt(g / L), T = 2π * sqrt(L / g)
 * Sistema Massa-Mola: ω = sqrt(k / m), T = 2π * sqrt(m / k)
 */
export function calculateMHS(
  input: MHSInput,
  options: PhysicsCalculationOptions = {}
): MHSResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  if (!input.amplitude || input.amplitude.trim() === '') {
    throw new Error('A amplitude de oscilação (A) deve ser informada.');
  }

  const bigA = parseBig(input.amplitude);
  if (bigA.lte(0)) {
    throw new Error('A amplitude de oscilação deve ser estritamente positiva (A > 0).');
  }

  let bigOmega: Big;
  let bigPeriod: Big;
  let bigFrequency: Big;

  const steps: string[] = [];
  const twoPi = 2 * Math.PI;

  if (input.type === 'pendulo') {
    steps.push('**Movimento Harmônico Simples — Pêndulo Simples (Pequenas Oscilações)**');

    if (!input.length || input.length.trim() === '') {
      throw new Error('O comprimento do fio (L) deve ser informado para o pêndulo simples.');
    }

    const bigL = parseBig(input.length);
    if (bigL.lte(0)) {
      throw new Error('O comprimento do fio deve ser estritamente positivo (L > 0).');
    }

    const bigG = normalizeGravity(input.g ?? options.gravity);

    // ω = sqrt(g / L)
    const gOverL = bigG.div(bigL);
    bigOmega = safeSqrt(gOverL, 'pulsação do pêndulo');

    // T = 2π / ω
    const omegaNum = Number(bigOmega.toString());
    const periodNum = twoPi / omegaNum;
    bigPeriod = new Big(periodNum);
    bigFrequency = new Big(1 / periodNum);

    steps.push(
      `1. **Identificação dos Parâmetros do Pêndulo:**\n` +
        `   • Amplitude máxima (A) = **${formatNumberSmart(bigA, decimals, separator)} m**\n` +
        `   • Comprimento da haste/fio (L) = **${formatNumberSmart(bigL, decimals, separator)} m**\n` +
        `   • Gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**`
    );

    steps.push(
      `2. **Frequência Angular (Pulsação ω):**\n` +
        `   Para aproximação linear de pequenas amplitudes (sin θ ≈ θ em radianos):\n` +
        `   ω = √(g / L) = √(${formatNumberSmart(bigG, decimals, separator)} / ${formatNumberSmart(bigL, decimals, separator)})\n` +
        `   **ω = ${formatNumberSmart(bigOmega, decimals, separator)} rad/s**`
    );

    steps.push(
      `3. **Período (T) e Frequência (f):**\n` +
        `   T = 2π · √(L / g) = 2π / ω\n` +
        `   T = 2π / ${formatNumberSmart(bigOmega, decimals, separator)}\n` +
        `   **T = ${formatNumberSmart(bigPeriod, decimals, separator)} s**\n` +
        `   f = 1 / T = **${formatNumberSmart(bigFrequency, decimals, separator)} Hz**`
    );
  } else if (input.type === 'massa_mola') {
    steps.push('**Movimento Harmônico Simples — Sistema Massa-Mola Ideal**');

    if (!input.mass || input.mass.trim() === '') {
      throw new Error('A massa (m) deve ser informada para o sistema massa-mola.');
    }
    if (!input.k || input.k.trim() === '') {
      throw new Error('A constante elástica (k) deve ser informada para o sistema massa-mola.');
    }

    const bigM = parseBig(input.mass);
    if (bigM.lte(0)) {
      throw new Error('A massa do corpo deve ser estritamente positiva (m > 0).');
    }

    const bigK = parseBig(input.k);
    if (bigK.lte(0)) {
      throw new Error('A constante elástica da mola deve ser estritamente positiva (k > 0).');
    }

    // ω = sqrt(k / m)
    const kOverM = bigK.div(bigM);
    bigOmega = safeSqrt(kOverM, 'pulsação da mola');

    // T = 2π / ω
    const omegaNum = Number(bigOmega.toString());
    const periodNum = twoPi / omegaNum;
    bigPeriod = new Big(periodNum);
    bigFrequency = new Big(1 / periodNum);

    steps.push(
      `1. **Identificação dos Parâmetros do Sistema:**\n` +
        `   • Amplitude máxima (A) = **${formatNumberSmart(bigA, decimals, separator)} m**\n` +
        `   • Massa do oscilador (m) = **${formatNumberSmart(bigM, decimals, separator)} kg**\n` +
        `   • Constante elástica da mola (k) = **${formatNumberSmart(bigK, decimals, separator)} N/m**`
    );

    steps.push(
      `2. **Frequência Angular (Pulsação ω):**\n` +
        `   A frequência própria de vibração do oscilador harmônico linear é:\n` +
        `   ω = √(k / m) = √(${formatNumberSmart(bigK, decimals, separator)} / ${formatNumberSmart(bigM, decimals, separator)})\n` +
        `   **ω = ${formatNumberSmart(bigOmega, decimals, separator)} rad/s**`
    );

    steps.push(
      `3. **Período (T) e Frequência (f):**\n` +
        `   T = 2π · √(m / k) = 2π / ω\n` +
        `   T = 2π / ${formatNumberSmart(bigOmega, decimals, separator)}\n` +
        `   **T = ${formatNumberSmart(bigPeriod, decimals, separator)} s**\n` +
        `   f = 1 / T = **${formatNumberSmart(bigFrequency, decimals, separator)} Hz**`
    );
  } else {
    throw new Error(`Tipo de oscilador inválido: "${String(input.type)}". Escolha 'pendulo' ou 'massa_mola'.`);
  }

  // Valores extremos de velocidade e aceleração
  const bigVMax = bigA.times(bigOmega);
  const bigAMax = bigA.times(bigOmega).times(bigOmega);

  steps.push(
    `4. **Equações Horárias e Limites Cinemáticos:**\n` +
      `   • Elongação: x(t) = A · cos(ω · t) = **${formatNumberSmart(bigA, decimals, separator)} · cos(${formatNumberSmart(bigOmega, decimals, separator)} · t)**\n` +
      `   • Velocidade máxima (na posição de equilíbrio x = 0): v_máx = A · ω = **${formatNumberSmart(bigVMax, decimals, separator)} m/s**\n` +
      `   • Aceleração máxima (nos extremos x = ±A): a_máx = A · ω² = **${formatNumberSmart(bigAMax, decimals, separator)} m/s²**`
  );

  // Gera pontos da curva senoidal para 2 períodos completos (t = 0 até 2 * T)
  const TNum = Number(bigPeriod.toString());
  const omegaFloat = Number(bigOmega.toString());
  const aFloat = Number(bigA.toString());

  const pointsCount = 41;
  const maxT = 2 * TNum;
  const stepT = maxT / (pointsCount - 1);

  const wavePoints: Array<{ t: number; x: number; v: number; a: number }> = [];

  for (let i = 0; i < pointsCount; i++) {
    const t = Number((i * stepT).toFixed(4));
    const phase = omegaFloat * t;
    const xVal = aFloat * Math.cos(phase);
    const vVal = -aFloat * omegaFloat * Math.sin(phase);
    const aVal = -aFloat * omegaFloat * omegaFloat * Math.cos(phase);
    wavePoints.push({
      t: Number(t.toFixed(4)),
      x: Number(xVal.toFixed(4)),
      v: Number(vVal.toFixed(4)),
      a: Number(aVal.toFixed(4)),
    });
  }

  const chartData: TemporalChartData = {
    type: 'temporal',
    points: wavePoints.map((p) => ({ t: p.t, x: p.x, v: p.v, a: p.a })),
    xLabel: 'Tempo (s)',
    yLabel: 'Elongação x(t) (m)',
  };

  const formattedPeriod = formatNumberSmart(bigPeriod, decimals, separator);
  const formattedFrequency = formatNumberSmart(bigFrequency, decimals, separator);
  const formattedOmega = formatNumberSmart(bigOmega, decimals, separator);

  return {
    mode: 'mhs',
    category: 'circular_oscilacoes',
    equationTitle: input.type === 'pendulo' ? 'MHS — Pêndulo Simples' : 'MHS — Massa-Mola',
    summary: `T = ${formattedPeriod} s | f = ${formattedFrequency} Hz | ω = ${formattedOmega} rad/s`,
    type: input.type,
    amplitude: Number(bigA.toString()),
    omega: Number(bigOmega.toString()),
    period: Number(bigPeriod.toString()),
    frequency: Number(bigFrequency.toString()),
    formattedPeriod,
    formattedFrequency,
    formattedOmega,
    wavePoints,
    steps,
    chartData,
  };
}
