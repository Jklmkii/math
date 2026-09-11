import { describe, it, expect } from 'vitest';
import {
  calculateMRU,
  calculateMRUV,
  calculateQuedaLivre,
  calculateLancamentoVertical,
  calculateLancamentoHorizontal,
  calculateLancamentoObliquo,
  calculateMCU,
  calculateMHS,
  calculatePlanoInclinado,
  calculateEnergiaTrabalho,
  sinDeg,
  cosDeg,
  tanDeg,
  safeSqrt,
  kmhToMs,
  msToKmh,
  normalizeGravity,
} from '../core/physics';

describe('Empirical Challenger 2 — Classical Physics Engines Stress Testing', () => {
  // =========================================================================
  // 1. Extreme Values & Scale Invariance (Micro & Macro Limits)
  // =========================================================================
  describe('1. Extreme Values & Scale Invariance', () => {
    it('handles sub-millisecond times and micro-distances in MRU', () => {
      // Sub-millisecond time: t = 0.0001 s (0.1 ms)
      const res = calculateMRU({
        unknown: 's',
        s0: '0.00005',
        v: '20',
        t: '0.0001',
      });
      // S = 0.00005 + 20 * 0.0001 = 0.00005 + 0.002 = 0.00205 m
      expect(res.s).toBeCloseTo(0.00205, 5);
      expect(res.chartData!.points.length).toBe(21);
      expect(res.chartData!.points.every((p) => p.s !== undefined && !isNaN(p.s) && isFinite(p.s))).toBe(true);
    });

    it('handles astronomical distances in MRU without NaN or overflow', () => {
      // 1 Astronomical Unit: ~1.496e11 m, speed of light ~3e8 m/s
      const res = calculateMRU({
        unknown: 't',
        s0: '0',
        s: '149600000000',
        v: '299792458',
      });
      // t ≈ 499.01 s (~8.3 minutes)
      expect(res.t).toBeCloseTo(499.01, 1);
      expect(res.chartData!.points.every((p) => p.s !== undefined && p.t !== undefined && isFinite(p.s) && isFinite(p.t))).toBe(true);
    });

    it('handles micro-grams in Plano Inclinado and Energia', () => {
      // 1 microgram = 0.000000001 kg (1e-9 kg)
      const planoRes = calculatePlanoInclinado({
        mass: '0.000000001',
        angleDeg: '30',
        frictionCoef: '0.1',
        g: '10',
      });
      // P = 1e-9 * 10 = 1e-8 N
      expect(planoRes.peso).toBeCloseTo(1e-8, 12);
      expect(planoRes.px).toBeCloseTo(0.5e-8, 12);
      // a = g * (sin 30° - mu * cos 30°) = 10 * (0.5 - 0.1 * 0.866025) ≈ 4.13397 m/s²
      expect(planoRes.aceleracao).toBeCloseTo(4.134, 2);
      expect(planoRes.isStatic).toBe(false);

      // Energia com micrograma
      const energiaRes = calculateEnergiaTrabalho({
        calculationSubtype: 'conservacao_energia',
        mass: '0.000000001',
        v: '100',
        h: '10',
        g: '9.8',
      });
      // Ec = 0.5 * 1e-9 * 10000 = 5e-6 J
      // Ep = 1e-9 * 9.8 * 10 = 9.8e-8 J
      expect(energiaRes.ec).toBeCloseTo(5e-6, 9);
      expect(energiaRes.ep).toBeCloseTo(9.8e-8, 10);
      expect(energiaRes.em).toBeCloseTo(5e-6 + 9.8e-8, 9);
    });

    it('handles high frequency vs high period in MCU', () => {
      // High frequency: 1 MHz = 1,000,000 Hz
      const highFreqRes = calculateMCU({
        radius: '0.05', // 5 cm
        parameterType: 'frequency',
        value: '1000000',
      });
      // T = 1e-6 s
      expect(highFreqRes.period).toBeCloseTo(0.000001, 8);
      // omega = 2 * pi * 1e6 rad/s
      expect(highFreqRes.omega).toBeCloseTo(2 * Math.PI * 1e6, 0);
      expect(isFinite(highFreqRes.aCentripeta)).toBe(true);

      // High period: 1 year ≈ 31,536,000 s (Earth orbit R ≈ 1.496e11 m)
      const highPeriodRes = calculateMCU({
        radius: '149600000000',
        parameterType: 'period',
        value: '31536000',
      });
      // f ≈ 3.17e-8 Hz
      expect(highPeriodRes.frequency).toBeCloseTo(3.17e-8, 10);
      // v_orbital ≈ 2 * pi * 1.496e11 / 31536000 ≈ 29800 m/s (~30 km/s)
      expect(highPeriodRes.vLinear).toBeCloseTo(29800, -2);
      expect(isFinite(highPeriodRes.aCentripeta)).toBe(true);
    });

    it('handles sub-millisecond times in Torricelli and MRUV', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        unknown: 's',
        s0: '0',
        v0: '1000', // high speed projectile
        a: '-5000',
        t: '0.0005', // 0.5 ms
      });
      // S = 1000 * 0.0005 + 0.5 * (-5000) * (0.0005)^2 = 0.5 - 0.000625 = 0.499375 m
      expect(res.s).toBeCloseTo(0.499375, 4);
      expect(res.v).toBeCloseTo(1000 - 5000 * 0.0005, 3);
    });
  });

  // =========================================================================
  // 2. Inclined Plane Physical Limits & Friction Transitions
  // =========================================================================
  describe('2. Inclined Plane Boundary Conditions & Friction Transitions', () => {
    it('zero friction (mu = 0) down a 30° ramp accelerates at g * sin(30°)', () => {
      const res = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '30',
        frictionCoef: '0',
        g: '9.8',
      });
      expect(res.isStatic).toBe(false);
      expect(res.fat).toBe(0);
      // a = g * sin(30°) = 9.8 * 0.5 = 4.9 m/s²
      expect(res.aceleracao).toBeCloseTo(4.9, 2);
      expect(res.normal).toBeCloseTo(10 * 9.8 * Math.cos(Math.PI / 6), 2);
    });

    it('horizontal plane (theta = 0°): normal equals weight, zero tangential force, static equilibrium', () => {
      // With zero friction
      const resZeroMu = calculatePlanoInclinado({
        mass: '5',
        angleDeg: '0',
        frictionCoef: '0',
        g: '10',
      });
      expect(resZeroMu.px).toBe(0);
      expect(resZeroMu.py).toBe(50);
      expect(resZeroMu.normal).toBe(50);
      expect(resZeroMu.fat).toBe(0);
      expect(resZeroMu.aceleracao).toBe(0);
      expect(resZeroMu.isStatic).toBe(true);

      // With friction mu = 0.5
      const resWithMu = calculatePlanoInclinado({
        mass: '5',
        angleDeg: '0',
        frictionCoef: '0.5',
        g: '10',
      });
      expect(resWithMu.px).toBe(0);
      expect(resWithMu.fat).toBe(0); // Fat matches Px = 0, does not create artificial force!
      expect(resWithMu.aceleracao).toBe(0);
      expect(resWithMu.isStatic).toBe(true);
    });

    it('vertical wall (theta = 90°): normal is zero, friction is zero, free falls at a = g', () => {
      const res = calculatePlanoInclinado({
        mass: '2',
        angleDeg: '90',
        frictionCoef: '0.8', // high friction on wall
        g: '9.8',
      });
      expect(res.normal).toBeCloseTo(0, 5);
      expect(res.fat).toBe(0); // N = 0 implies Fat = 0
      expect(res.aceleracao).toBeCloseTo(9.8, 2); // a = g
      expect(res.isStatic).toBe(false);
      expect(res.px).toBeCloseTo(2 * 9.8, 2);
      expect(res.py).toBeCloseTo(0, 5);
    });

    it('critical friction: mu = tan(theta) produces static equilibrium with zero acceleration', () => {
      // theta = 45° -> tan(45°) = 1.0
      const resCrit = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '45',
        frictionCoef: '1.0',
        g: '10',
      });
      // Px = 10 * 10 * sin(45°) ≈ 70.7107 N
      // N = 10 * 10 * cos(45°) ≈ 70.7107 N
      // FatMax = 1.0 * N = 70.7107 N
      // Since Px <= FatMax, block is static and Fat = Px
      expect(resCrit.isStatic).toBe(true);
      expect(resCrit.aceleracao).toBe(0);
      expect(resCrit.fat).toBeCloseTo(resCrit.px, 4);

      // mu slightly less than tan(theta) -> slides
      const resSlide = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '45',
        frictionCoef: '0.99',
        g: '10',
      });
      expect(resSlide.isStatic).toBe(false);
      expect(resSlide.aceleracao).toBeGreaterThan(0);

      // mu greater than tan(theta) -> strictly static, Fat still equals Px (not FatMax)
      const resOverCrit = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '45',
        frictionCoef: '2.5',
        g: '10',
      });
      expect(resOverCrit.isStatic).toBe(true);
      expect(resOverCrit.aceleracao).toBe(0);
      expect(resOverCrit.fat).toBeCloseTo(resOverCrit.px, 4);
    });
  });

  // =========================================================================
  // 3. MHS Simple Pendulum & Mass-Spring Analysis
  // =========================================================================
  describe('3. MHS Simple Pendulum & Mass-Spring Dynamics', () => {
    it('pendulum didactic steps explicitly document small-angle approximation', () => {
      const res = calculateMHS({
        type: 'pendulo',
        amplitude: '0.05', // 5 cm
        length: '1.0',     // 1 m
        g: '9.8',
      });
      // T = 2 * pi * sqrt(1 / 9.8) ≈ 2.007 s
      expect(res.period).toBeCloseTo(2.007, 2);
      expect(res.frequency).toBeCloseTo(0.498, 2);

      // Verify didactic steps mention small angle approximation
      const allSteps = res.steps.join(' ');
      expect(allSteps).toMatch(/pequenas amplitudes|pequenas oscilações|sin θ ≈ θ/i);
    });

    it('mass-spring system correctly computes omega, T, f, and energy bounds', () => {
      const res = calculateMHS({
        type: 'massa_mola',
        amplitude: '0.2', // 20 cm
        mass: '0.5',      // 500 g
        k: '50',          // 50 N/m
      });
      // omega = sqrt(50 / 0.5) = sqrt(100) = 10 rad/s
      expect(res.omega).toBeCloseTo(10, 3);
      // T = 2 * pi / 10 ≈ 0.6283 s
      expect(res.period).toBeCloseTo((2 * Math.PI) / 10, 3);
      expect(res.frequency).toBeCloseTo(10 / (2 * Math.PI), 3);
      expect(res.wavePoints.length).toBe(41);
    });

    it('pendulum with extreme length (Foucault pendulum L = 67 m)', () => {
      const res = calculateMHS({
        type: 'pendulo',
        amplitude: '1.5',
        length: '67',
        g: '9.8',
      });
      // T = 2 * pi * sqrt(67 / 9.8) ≈ 16.43 s
      expect(res.period).toBeCloseTo(16.43, 1);
      expect(res.omega).toBeCloseTo(Math.sqrt(9.8 / 67), 3);
    });
  });

  // =========================================================================
  // 4. Ballistics & Trajectories (Horizontal & Oblique Launch)
  // =========================================================================
  describe('4. Ballistic Projectiles (Horizontal & Oblique)', () => {
    it('oblique launch at 45° maximizes range for y0 = 0', () => {
      const v0 = '20';
      const g = '9.8';
      const res45 = calculateLancamentoObliquo({ v0, angleDeg: '45', y0: '0', g });
      const res40 = calculateLancamentoObliquo({ v0, angleDeg: '40', y0: '0', g });
      const res50 = calculateLancamentoObliquo({ v0, angleDeg: '50', y0: '0', g });

      // Range at 45°: v0^2 / g = 400 / 9.8 ≈ 40.816 m
      expect(res45.alcance).toBeCloseTo(40.82, 1);
      expect(res45.alcance).toBeGreaterThan(res40.alcance);
      expect(res45.alcance).toBeGreaterThan(res50.alcance);

      // Complementary angles (40° and 50°) have identical horizontal range on flat ground
      expect(res40.alcance).toBeCloseTo(res50.alcance, 2);

      // Range and apex data in BallisticChartData
      expect(res45.chartData!.apex.y).toBeCloseTo(res45.hMax, 2);
      expect(res45.chartData!.range.x).toBeCloseTo(res45.alcance, 2);
    });

    it('horizontal launch produces parabolic trajectory with apex at initial height', () => {
      const res = calculateLancamentoHorizontal({
        h0: '45',
        v0x: '15',
        g: '10',
      });
      // t_queda = sqrt(2 * 45 / 10) = sqrt(9) = 3 s
      expect(res.tQueda).toBe(3);
      // alcance = 15 * 3 = 45 m
      expect(res.alcance).toBe(45);
      // vyFinal = 10 * 3 = 30 m/s
      expect(res.vyFinal).toBe(30);
      // vImpacto = sqrt(15^2 + 30^2) = sqrt(225 + 900) = sqrt(1125) ≈ 33.541 m/s
      expect(res.vImpacto).toBeCloseTo(Math.sqrt(1125), 2);
      expect(res.chartData!.apex).toEqual({ x: 0, y: 45 });
      expect(res.chartData!.range).toEqual({ x: 45, y: 0 });
    });

    it('vertical launch with elevation (y0 > 0) accounts for asymmetrical flight', () => {
      const res = calculateLancamentoVertical({
        v0: '20',
        y0: '25',
        g: '10',
      });
      // t_subida = 20 / 10 = 2 s
      expect(res.tSubida).toBe(2);
      // H_max = 25 + 20^2 / 20 = 25 + 20 = 45 m
      expect(res.hMax).toBe(45);
      // Fall from 45 m: t_queda = sqrt(2 * 45 / 10) = 3 s
      // t_total = 2 + 3 = 5 s
      expect(res.tTotal).toBe(5);
      // vRetorno = sqrt(v0^2 + 2 * g * y0) = sqrt(400 + 500) = sqrt(900) = 30 m/s
      expect(res.vRetorno).toBe(30);
    });

    it('free fall calculates exact velocity and time for cliff drop', () => {
      const res = calculateQuedaLivre({
        h0: '80',
        g: '10',
      });
      // t_queda = sqrt(2 * 80 / 10) = sqrt(16) = 4 s
      expect(res.tQueda).toBe(4);
      // v_impacto = 10 * 4 = 40 m/s
      expect(res.vImpacto).toBe(40);
    });
  });

  // =========================================================================
  // 5. Work, Power & Conservation of Energy
  // =========================================================================
  describe('5. Work, Energy & Power Dynamics', () => {
    it('conservacao_energia computes mechanical energy and bar chart proportions', () => {
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'conservacao_energia',
        mass: '2',
        v: '10',
        h: '5',
        g: '10',
      });
      // Ec = 0.5 * 2 * 100 = 100 J
      expect(res.ec).toBe(100);
      // Ep = 2 * 10 * 5 = 100 J
      expect(res.ep).toBe(100);
      // Em = 100 + 100 = 200 J
      expect(res.em).toBe(200);
      expect(res.chartData!.bars.length).toBe(3);
    });

    it('trabalho_potencia computes motor work, resistant work, and power conversions', () => {
      // Motor work (theta = 0°)
      const motorRes = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '100',
        distance: '50',
        angleDeg: '0',
        time: '10',
      });
      // W = 100 * 50 * 1 = 5000 J
      expect(motorRes.work).toBe(5000);
      // P = 5000 / 10 = 500 W
      expect(motorRes.power).toBe(500);
      expect(motorRes.steps.some((s) => s.includes('Trabalho Motor'))).toBe(true);

      // Resistant work (theta = 180°)
      const resistantRes = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '50',
        distance: '20',
        angleDeg: '180',
      });
      // W = 50 * 20 * (-1) = -1000 J
      expect(resistantRes.work).toBe(-1000);
      expect(resistantRes.steps.some((s) => s.includes('Trabalho Resistente'))).toBe(true);

      // Perpendicular force (theta = 90°)
      const nullRes = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '200',
        distance: '30',
        angleDeg: '90',
      });
      // W = 200 * 30 * 0 = 0 J
      expect(nullRes.work).toBe(0);
      expect(nullRes.steps.some((s) => s.includes('Trabalho Nulo'))).toBe(true);
    });
  });

  // =========================================================================
  // 6. Trigonometric Residue & Safe Square Root Helpers
  // =========================================================================
  describe('6. Physics Trigonometry & Safe Root Accuracy', () => {
    it('sinDeg and cosDeg eliminate floating point residues at cardinal angles', () => {
      expect(sinDeg(0).toNumber()).toBe(0);
      expect(sinDeg(90).toNumber()).toBe(1);
      expect(sinDeg(180).toNumber()).toBe(0);
      expect(sinDeg(270).toNumber()).toBe(-1);
      expect(sinDeg(360).toNumber()).toBe(0);
      expect(sinDeg(30).toNumber()).toBe(0.5);
      expect(sinDeg(150).toNumber()).toBe(0.5);

      expect(cosDeg(0).toNumber()).toBe(1);
      expect(cosDeg(90).toNumber()).toBe(0);
      expect(cosDeg(180).toNumber()).toBe(-1);
      expect(cosDeg(270).toNumber()).toBe(0);
      expect(cosDeg(360).toNumber()).toBe(1);
      expect(cosDeg(60).toNumber()).toBe(0.5);
    });

    it('tanDeg handles cardinal angles and throws on 90° and 270°', () => {
      expect(tanDeg(0).toNumber()).toBe(0);
      expect(tanDeg(45).toNumber()).toBe(1);
      expect(tanDeg(180).toNumber()).toBe(0);
      expect(() => tanDeg(90)).toThrow(/Tangente indefinida/);
      expect(() => tanDeg(270)).toThrow(/Tangente indefinida/);
    });

    it('safeSqrt throws on negative radicand and returns exact zero for 0', () => {
      expect(safeSqrt(0).toNumber()).toBe(0);
      expect(safeSqrt(4).toNumber()).toBe(2);
      expect(safeSqrt(100).toNumber()).toBe(10);
      expect(() => safeSqrt(-1, 'teste')).toThrow(/Radicando negativo \(-1\)/);
    });

    it('speed conversions kmhToMs and msToKmh are exact without float errors', () => {
      // 72 km/h = 20 m/s exact
      expect(kmhToMs(72).toString()).toBe('20');
      // 20 m/s = 72 km/h exact
      expect(msToKmh(20).toString()).toBe('72');
      // 36 km/h = 10 m/s
      expect(kmhToMs(36).toString()).toBe('10');
      // 100 km/h = 100 / 3.6 = 27.777...
      expect(kmhToMs(100).toFixed(4)).toBe('27.7778');
    });

    it('normalizeGravity validates non-positive values', () => {
      expect(normalizeGravity().toString()).toBe('9.8');
      expect(normalizeGravity('10').toString()).toBe('10');
      expect(normalizeGravity(9.81).toString()).toBe('9.81');
      expect(() => normalizeGravity('0')).toThrow(/estritamente positiva/);
      expect(() => normalizeGravity('-9.8')).toThrow(/estritamente positiva/);
    });
  });

  // =========================================================================
  // 7. Robust Negative Testing: Zero Crashes on Invalid Inputs
  // =========================================================================
  describe('7. Robust Negative Testing (Deterministic Error Throwing)', () => {
    it('MRU throws on missing parameters or division by zero time', () => {
      // Missing s0
      expect(() => calculateMRU({ unknown: 's', v: '10', t: '5' })).toThrow(/Parâmetro ausente/);
      // Missing v
      expect(() => calculateMRU({ unknown: 's', s0: '0', t: '5' })).toThrow(/Parâmetro ausente/);
      // Missing t
      expect(() => calculateMRU({ unknown: 's', s0: '0', v: '10' })).toThrow(/Parâmetro ausente/);
      // t = 0 for unknown 'v'
      expect(() => calculateMRU({ unknown: 'v', s0: '0', s: '10', t: '0' })).toThrow(/não pode ser zero/);
      // v = 0 with distinct positions for unknown 't'
      expect(() => calculateMRU({ unknown: 't', s0: '0', s: '10', v: '0' })).toThrow(/velocidade é zero com posições distintas/);
      // Invalid unknown
      expect(() => calculateMRU({ unknown: 'invalid' as any, s0: '0', v: '1', t: '1' })).toThrow(/Incógnita desconhecida/);
    });

    it('MRUV throws on negative Torricelli radicand or missing parameters', () => {
      // Torricelli negative radicand (e.g. v0 = 10, a = -5, deltaS = 20 -> v^2 = 100 - 200 = -100)
      expect(() =>
        calculateMRUV({
          subMode: 'torricelli',
          unknown: 'v',
          v0: '10',
          a: '-5',
          deltaS: '20',
        })
      ).toThrow(/Radicando de Torricelli negativo/);

      // Torricelli a = 0 for deltaS
      expect(() =>
        calculateMRUV({
          subMode: 'torricelli',
          unknown: 'deltaS',
          v0: '10',
          v: '20',
          a: '0',
        })
      ).toThrow(/Aceleração nula em Torricelli/);

      // MRUV horaria missing t
      expect(() =>
        calculateMRUV({
          subMode: 'horaria',
          unknown: 's',
          v0: '10',
          a: '2',
        })
      ).toThrow(/Parâmetro ausente/);
    });

    it('Queda Livre throws on non-positive initial height', () => {
      expect(() => calculateQuedaLivre({ h0: '0' })).toThrow(/estritamente positiva/);
      expect(() => calculateQuedaLivre({ h0: '-10' })).toThrow(/estritamente positiva/);
      expect(() => calculateQuedaLivre({ h0: '' })).toThrow(/deve ser informada/);
    });

    it('Lancamento Vertical throws on negative height or non-positive velocity', () => {
      expect(() => calculateLancamentoVertical({ v0: '0', y0: '0' })).toThrow(/estritamente positiva/);
      expect(() => calculateLancamentoVertical({ v0: '-10', y0: '10' })).toThrow(/estritamente positiva/);
      expect(() => calculateLancamentoVertical({ v0: '10', y0: '-5' })).toThrow(/não pode ser negativa/);
    });

    it('Lancamento Horizontal throws on non-positive height or horizontal speed', () => {
      expect(() => calculateLancamentoHorizontal({ h0: '0', v0x: '10' })).toThrow(/estritamente positiva/);
      expect(() => calculateLancamentoHorizontal({ h0: '10', v0x: '0' })).toThrow(/estritamente positiva/);
      expect(() => calculateLancamentoHorizontal({ h0: '-5', v0x: '10' })).toThrow(/estritamente positiva/);
    });

    it('Lancamento Obliquo throws on out-of-range angle or non-positive speed', () => {
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '0' })).toThrow(/estritamente entre 0° e 90°/);
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '90' })).toThrow(/estritamente entre 0° e 90°/);
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '-15' })).toThrow(/estritamente entre 0° e 90°/);
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '120' })).toThrow(/estritamente entre 0° e 90°/);
      expect(() => calculateLancamentoObliquo({ v0: '0', angleDeg: '45' })).toThrow(/estritamente positiva/);
    });

    it('MCU throws on non-positive radius or parameter value', () => {
      expect(() => calculateMCU({ radius: '0', parameterType: 'period', value: '2' })).toThrow(/estritamente positivo/);
      expect(() => calculateMCU({ radius: '-5', parameterType: 'period', value: '2' })).toThrow(/estritamente positivo/);
      expect(() => calculateMCU({ radius: '1', parameterType: 'frequency', value: '0' })).toThrow(/estritamente positivo/);
      expect(() => calculateMCU({ radius: '1', parameterType: 'invalid' as any, value: '2' })).toThrow(/Tipo de parâmetro desconhecido/);
    });

    it('MHS throws on non-positive amplitude, mass, length, or spring constant', () => {
      expect(() => calculateMHS({ type: 'pendulo', amplitude: '0', length: '1' })).toThrow(/estritamente positiva/);
      expect(() => calculateMHS({ type: 'pendulo', amplitude: '0.1', length: '0' })).toThrow(/estritamente positivo/);
      expect(() => calculateMHS({ type: 'pendulo', amplitude: '0.1', length: '-2' })).toThrow(/estritamente positivo/);
      expect(() => calculateMHS({ type: 'massa_mola', amplitude: '0.1', mass: '0', k: '10' })).toThrow(/estritamente positiva/);
      expect(() => calculateMHS({ type: 'massa_mola', amplitude: '0.1', mass: '1', k: '0' })).toThrow(/estritamente positiva/);
      expect(() => calculateMHS({ type: 'invalid' as any, amplitude: '0.1' })).toThrow(/Tipo de oscilador inválido/);
    });

    it('Plano Inclinado throws on invalid mass, angle, or negative friction', () => {
      expect(() => calculatePlanoInclinado({ mass: '0', angleDeg: '30' })).toThrow(/estritamente positiva/);
      expect(() => calculatePlanoInclinado({ mass: '-5', angleDeg: '30' })).toThrow(/estritamente positiva/);
      expect(() => calculatePlanoInclinado({ mass: '1', angleDeg: '-1' })).toThrow(/entre 0° e 90°/);
      expect(() => calculatePlanoInclinado({ mass: '1', angleDeg: '91' })).toThrow(/entre 0° e 90°/);
      expect(() => calculatePlanoInclinado({ mass: '1', angleDeg: '30', frictionCoef: '-0.2' })).toThrow(/não pode ser negativo/);
    });

    it('Energia & Trabalho throws on non-positive mass, negative height, negative distance, or zero time', () => {
      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'conservacao_energia',
          mass: '0',
        })
      ).toThrow(/estritamente positiva/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'conservacao_energia',
          mass: '1',
          h: '-5',
        })
      ).toThrow(/não pode ser negativa/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'trabalho_potencia',
          force: '10',
          distance: '-2',
        })
      ).toThrow(/não pode ser negativa/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'trabalho_potencia',
          force: '10',
          distance: '5',
          time: '0',
        })
      ).toThrow(/estritamente positivo/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'invalid' as any,
        })
      ).toThrow(/Subtipo de cálculo desconhecido/);
    });
  });

  // =========================================================================
  // 8. Internationalization & Formatting Options (Dot vs Comma, Decimals)
  // =========================================================================
  describe('8. Formatting Options (Separator & Decimals)', () => {
    it('formats results with dot separator when requested', () => {
      const res = calculateMRU(
        { unknown: 's', s0: '1.25', v: '2.5', t: '3' },
        { separator: '.', decimals: 4 }
      );
      expect(res.formattedS).toBe('8.75');
      expect(res.summary).toContain('S = 8.75 m');
    });

    it('formats results with comma separator by default', () => {
      const res = calculateMRU(
        { unknown: 's', s0: '1.25', v: '2.5', t: '3' },
        { separator: ',', decimals: 2 }
      );
      expect(res.formattedS).toBe('8,75');
      expect(res.summary).toContain('S = 8,75 m');
    });
  });

  // =========================================================================
  // 9. Chart Data Contract Verification Across All 10 Modes
  // =========================================================================
  describe('9. Chart Data Schema Integrity', () => {
    it('verifies all 10 modes produce strictly typed chartData matching UI contracts', () => {
      // 1. MRU -> temporal
      const mru = calculateMRU({ unknown: 's', s0: '0', v: '10', t: '5' });
      expect(mru.chartData!.type).toBe('temporal');
      expect(Array.isArray(mru.chartData!.points)).toBe(true);

      // 2. MRUV -> temporal
      const mruv = calculateMRUV({ subMode: 'horaria', unknown: 's', v0: '5', a: '2', t: '4' });
      expect(mruv.chartData!.type).toBe('temporal');

      // 3. Queda Livre -> temporal
      const ql = calculateQuedaLivre({ h0: '20' });
      expect(ql.chartData!.type).toBe('temporal');

      // 4. Lancamento Vertical -> temporal
      const lv = calculateLancamentoVertical({ v0: '15' });
      expect(lv.chartData!.type).toBe('temporal');

      // 5. Lancamento Horizontal -> ballistic
      const lh = calculateLancamentoHorizontal({ h0: '20', v0x: '10' });
      expect(lh.chartData!.type).toBe('ballistic');
      expect(lh.chartData!.apex).toBeDefined();
      expect(lh.chartData!.range).toBeDefined();

      // 6. Lancamento Obliquo -> ballistic
      const lo = calculateLancamentoObliquo({ v0: '20', angleDeg: '45' });
      expect(lo.chartData!.type).toBe('ballistic');
      expect(lo.chartData!.apex.y).toBeGreaterThan(0);

      // 7. MCU -> circular
      const mcu = calculateMCU({ radius: '2', parameterType: 'period', value: '4' });
      expect(mcu.chartData!.type).toBe('circular');
      expect(mcu.chartData!.radius).toBe(2);
      expect(mcu.chartData!.omega).toBeGreaterThan(0);

      // 8. MHS -> temporal
      const mhs = calculateMHS({ type: 'pendulo', amplitude: '0.1', length: '1' });
      expect(mhs.chartData!.type).toBe('temporal');

      // 9. Plano Inclinado -> inclined_plane
      const pi = calculatePlanoInclinado({ mass: '5', angleDeg: '30' });
      expect(pi.chartData!.type).toBe('inclined_plane');
      expect(pi.chartData!.peso).toBeGreaterThan(0);

      // 10. Energia & Trabalho -> energy_bars
      const et = calculateEnergiaTrabalho({
        calculationSubtype: 'conservacao_energia',
        mass: '2',
        v: '5',
        h: '10',
      });
      expect(et.chartData!.type).toBe('energy_bars');
      expect(et.chartData!.bars.length).toBe(3);
    });
  });

  // =========================================================================
  // 10. Angle Normalization & Periodic Trigonometry
  // =========================================================================
  describe('10. Angle Normalization & Periodic Trigonometry', () => {
    it('cosDeg and sinDeg correctly normalize angles outside [0, 360)', () => {
      // 450° = 90°
      expect(sinDeg(450).toNumber()).toBe(1);
      expect(cosDeg(450).toNumber()).toBe(0);

      // -90° = 270°
      expect(sinDeg(-90).toNumber()).toBe(-1);
      expect(cosDeg(-90).toNumber()).toBe(0);

      // 720° = 0°
      expect(sinDeg(720).toNumber()).toBe(0);
      expect(cosDeg(720).toNumber()).toBe(1);
    });
  });
});

