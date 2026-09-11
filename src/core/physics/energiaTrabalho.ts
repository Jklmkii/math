import Big from 'big.js';
import type { EnergiaTrabalhoInput, EnergiaTrabalhoResult, EnergyChartData } from '../../types';
import { formatNumberSmart, parseBig } from '../math/precision';
import type { PhysicsCalculationOptions } from './physicsUtils';
import { normalizeGravity, cosDeg } from './physicsUtils';

/**
 * Conservação de Energia Mecânica & Trabalho e Potência
 * Ec = 1/2 * m * v^2
 * Ep = m * g * h
 * Em = Ec + Ep
 * Trabalho: W = F * d * cos(θ)
 * Potência: P = W / Δt
 */
export function calculateEnergiaTrabalho(
  input: EnergiaTrabalhoInput,
  options: PhysicsCalculationOptions = {}
): EnergiaTrabalhoResult {
  const decimals = options.decimals ?? 2;
  const separator = options.separator ?? ',';

  const steps: string[] = [];
  const subtype = input.calculationSubtype;

  let bigEc: Big | undefined;
  let bigEp: Big | undefined;
  let bigEm: Big | undefined;
  let bigWork: Big | undefined;
  let bigPower: Big | undefined;
  let bigPowerCv: Big | undefined;
  let bigPowerHp: Big | undefined;

  const formattedValues: Record<string, string> = {};

  if (subtype === 'conservacao_energia') {
    steps.push('**Conservação da Energia Mecânica (Ec, Ep, Em)**');

    if (!input.mass || input.mass.trim() === '') {
      throw new Error('A massa do corpo (m) deve ser informada.');
    }

    const bigM = parseBig(input.mass);
    if (bigM.lte(0)) {
      throw new Error('A massa do corpo deve ser estritamente positiva (m > 0).');
    }

    const bigV =
      input.v !== undefined && input.v.trim() !== '' ? parseBig(input.v) : new Big(0);

    const bigH =
      input.h !== undefined && input.h.trim() !== '' ? parseBig(input.h) : new Big(0);

    if (bigH.lt(0)) {
      throw new Error('A altura não pode ser negativa.');
    }

    const bigG = normalizeGravity(input.g ?? options.gravity);

    // 1. Energia Cinética: Ec = 1/2 * m * v^2
    const vSq = bigV.times(bigV);
    bigEc = bigM.times(vSq).times(0.5);

    // 2. Energia Potencial Gravitacional: Ep = m * g * h
    bigEp = bigM.times(bigG).times(bigH);

    // 3. Energia Mecânica Total: Em = Ec + Ep
    bigEm = bigEc.plus(bigEp);

    steps.push(
      `1. **Identificação dos Dados do Sistema:**\n` +
        `   • Massa do corpo (m) = **${formatNumberSmart(bigM, decimals, separator)} kg**\n` +
        `   • Velocidade escalar (v) = **${formatNumberSmart(bigV, decimals, separator)} m/s**\n` +
        `   • Altura em relação ao referencial (h) = **${formatNumberSmart(bigH, decimals, separator)} m**\n` +
        `   • Gravidade local (g) = **${formatNumberSmart(bigG, decimals, separator)} m/s²**`
    );

    steps.push(
      `2. **Energia Cinética (Ec):**\n` +
        `   Associada ao estado de movimento do corpo:\n` +
        `   Ec = ½ · m · v²\n` +
        `   Ec = ½ · ${formatNumberSmart(bigM, decimals, separator)} · (${formatNumberSmart(bigV, decimals, separator)})²\n` +
        `   **Ec = ${formatNumberSmart(bigEc, decimals, separator)} J (Joules)**`
    );

    steps.push(
      `3. **Energia Potencial Gravitacional (Ep):**\n` +
        `   Associada à posição do corpo no campo gravitacional:\n` +
        `   Ep = m · g · h\n` +
        `   Ep = ${formatNumberSmart(bigM, decimals, separator)} · ${formatNumberSmart(bigG, decimals, separator)} · ${formatNumberSmart(bigH, decimals, separator)}\n` +
        `   **Ep = ${formatNumberSmart(bigEp, decimals, separator)} J (Joules)**`
    );

    steps.push(
      `4. **Energia Mecânica Total (Em):**\n` +
        `   Pelo Princípio da Conservação da Energia Mecânica em sistemas conservativos:\n` +
        `   Em = Ec + Ep\n` +
        `   Em = ${formatNumberSmart(bigEc, decimals, separator)} + ${formatNumberSmart(bigEp, decimals, separator)}\n` +
        `   **Em = ${formatNumberSmart(bigEm, decimals, separator)} J (Joules)**`
    );

    formattedValues.mass = formatNumberSmart(bigM, decimals, separator);
    formattedValues.v = formatNumberSmart(bigV, decimals, separator);
    formattedValues.h = formatNumberSmart(bigH, decimals, separator);
    formattedValues.g = formatNumberSmart(bigG, decimals, separator);
    formattedValues.ec = formatNumberSmart(bigEc, decimals, separator);
    formattedValues.ep = formatNumberSmart(bigEp, decimals, separator);
    formattedValues.em = formatNumberSmart(bigEm, decimals, separator);
  } else if (subtype === 'trabalho_potencia') {
    steps.push('**Trabalho de uma Força Constante & Potência Mecânica**');

    if (!input.force || input.force.trim() === '') {
      throw new Error('A intensidade da força (F) deve ser informada.');
    }
    if (!input.distance || input.distance.trim() === '') {
      throw new Error('O deslocamento (d) deve ser informado.');
    }

    const bigForce = parseBig(input.force);
    const bigDistance = parseBig(input.distance);

    if (bigDistance.lt(0)) {
      throw new Error('A distância percorrida não pode ser negativa.');
    }

    const bigAngle =
      input.angleDeg !== undefined && input.angleDeg.trim() !== ''
        ? parseBig(input.angleDeg)
        : new Big(0);

    const cosTheta = cosDeg(bigAngle);

    // Trabalho: W = F * d * cos(θ)
    bigWork = bigForce.times(bigDistance).times(cosTheta);

    steps.push(
      `1. **Identificação dos Dados:**\n` +
        `   • Força aplicada (F) = **${formatNumberSmart(bigForce, decimals, separator)} N**\n` +
        `   • Deslocamento (d) = **${formatNumberSmart(bigDistance, decimals, separator)} m**\n` +
        `   • Ângulo entre a força e o deslocamento (θ) = **${formatNumberSmart(bigAngle, decimals, separator)}°** (cos θ = ${formatNumberSmart(cosTheta, 4, separator)})`
    );

    let workType = '';
    if (bigWork.gt(0)) {
      workType = 'Trabalho Motor (a força favorece o deslocamento e transfere energia ao corpo)';
    } else if (bigWork.lt(0)) {
      workType = 'Trabalho Resistente (a força se opõe ao deslocamento e retira energia do corpo)';
    } else {
      workType = 'Trabalho Nulo (força perpendicular ao deslocamento ou nula, não realiza trabalho)';
    }

    steps.push(
      `2. **Cálculo do Trabalho Mecânico (W):**\n` +
        `   W = F · d · cos(θ)\n` +
        `   W = ${formatNumberSmart(bigForce, decimals, separator)} · ${formatNumberSmart(bigDistance, decimals, separator)} · ${formatNumberSmart(cosTheta, 4, separator)}\n` +
        `   **W = ${formatNumberSmart(bigWork, decimals, separator)} J (Joules)**\n` +
        `   Classificação: **${workType}**`
    );

    formattedValues.force = formatNumberSmart(bigForce, decimals, separator);
    formattedValues.distance = formatNumberSmart(bigDistance, decimals, separator);
    formattedValues.angleDeg = formatNumberSmart(bigAngle, decimals, separator);
    formattedValues.work = formatNumberSmart(bigWork, decimals, separator);

    // Potência se o tempo for fornecido
    if (input.time !== undefined && input.time.trim() !== '') {
      const bigTime = parseBig(input.time);
      if (bigTime.lte(0)) {
        throw new Error('O intervalo de tempo para cálculo de potência deve ser estritamente positivo (Δt > 0).');
      }

      bigPower = bigWork.div(bigTime);
      bigPowerCv = bigPower.div(new Big('735.5'));
      bigPowerHp = bigPower.div(new Big('745.7'));

      steps.push(
        `3. **Potência Mecânica Média (P):**\n` +
          `   Taxa temporal de realização de trabalho:\n` +
          `   P = W / Δt = ${formatNumberSmart(bigWork, decimals, separator)} / ${formatNumberSmart(bigTime, decimals, separator)}\n` +
          `   **P = ${formatNumberSmart(bigPower, decimals, separator)} W (Watts)**\n` +
          `   • Em Cavalos-Vapor: **${formatNumberSmart(bigPowerCv, decimals, separator)} CV** (1 CV ≈ 735,5 W)\n` +
          `   • Em Horsepower: **${formatNumberSmart(bigPowerHp, decimals, separator)} HP** (1 HP ≈ 745,7 W)`
      );

      formattedValues.time = formatNumberSmart(bigTime, decimals, separator);
      formattedValues.power = formatNumberSmart(bigPower, decimals, separator);
      formattedValues.powerCv = formatNumberSmart(bigPowerCv, decimals, separator);
      formattedValues.powerHp = formatNumberSmart(bigPowerHp, decimals, separator);
    }
  } else {
    throw new Error(`Subtipo de cálculo desconhecido: "${String(subtype)}".`);
  }

  // Montagem dos dados de gráficos de barras
  let chartData: EnergyChartData;
  if (subtype === 'conservacao_energia') {
    const ecNum = Number((bigEc ?? new Big(0)).toString());
    const epNum = Number((bigEp ?? new Big(0)).toString());
    const emNum = Number((bigEm ?? new Big(0)).toString());
    chartData = {
      type: 'energy_bars',
      ec: ecNum,
      ep: epNum,
      em: emNum,
      bars: [
        { label: 'Cinética (Ec)', value: ecNum, color: '#3b82f6' },
        { label: 'Potencial (Ep)', value: epNum, color: '#10b981' },
        { label: 'Mecânica Total (Em)', value: emNum, color: '#8b5cf6' },
      ],
    };
  } else {
    const wNum = Number((bigWork ?? new Big(0)).toString());
    const pNum = bigPower ? Number(bigPower.toString()) : undefined;
    chartData = {
      type: 'energy_bars',
      ec: 0,
      ep: 0,
      em: 0,
      work: wNum,
      power: pNum,
      bars: [
        { label: 'Trabalho Realizado (W)', value: wNum, color: '#f59e0b' },
        ...(pNum !== undefined ? [{ label: 'Potência Média (P)', value: pNum, color: '#ef4444' }] : []),
      ],
    };
  }

  const summary =
    subtype === 'conservacao_energia'
      ? `Em = ${formattedValues.em} J | Ec = ${formattedValues.ec} J | Ep = ${formattedValues.ep} J`
      : `W = ${formattedValues.work} J` + (formattedValues.power ? ` | P = ${formattedValues.power} W` : '');

  return {
    mode: 'energia_trabalho',
    category: 'dinamica_energia',
    equationTitle:
      subtype === 'conservacao_energia'
        ? 'Conservação de Energia Mecânica'
        : 'Trabalho e Potência Mecânica',
    summary,
    subtype,
    ec: bigEc ? Number(bigEc.toString()) : undefined,
    ep: bigEp ? Number(bigEp.toString()) : undefined,
    em: bigEm ? Number(bigEm.toString()) : undefined,
    work: bigWork ? Number(bigWork.toString()) : undefined,
    power: bigPower ? Number(bigPower.toString()) : undefined,
    formattedValues,
    steps,
    chartData,
  };
}
