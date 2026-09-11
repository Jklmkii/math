import { describe, it, expect } from 'vitest';
import Big from 'big.js';
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
  degToRad,
  radToDeg,
  sinDeg,
  cosDeg,
  tanDeg,
  safeSqrt,
  kmhToMs,
  msToKmh,
  normalizeGravity,
  formatUnit,
} from '../core/physics';

describe('Empirical Forensic Audit — Milestone M2 Physics Engine Stress & Integrity Test', () => {
  describe('1. Precision & Utility Functions (physicsUtils.ts)', () => {
    it('eliminates IEEE 754 precision residue at cardinal and common angles', () => {
      expect(sinDeg(0).toString()).toBe('0');
      expect(sinDeg(30).toString()).toBe('0.5');
      expect(sinDeg(90).toString()).toBe('1');
      expect(sinDeg(150).toString()).toBe('0.5');
      expect(sinDeg(180).toString()).toBe('0');
      expect(sinDeg(210).toString()).toBe('-0.5');
      expect(sinDeg(270).toString()).toBe('-1');
      expect(sinDeg(330).toString()).toBe('-0.5');
      expect(sinDeg(360).toString()).toBe('0');

      expect(cosDeg(0).toString()).toBe('1');
      expect(cosDeg(60).toString()).toBe('0.5');
      expect(cosDeg(90).toString()).toBe('0');
      expect(cosDeg(120).toString()).toBe('-0.5');
      expect(cosDeg(180).toString()).toBe('-1');
      expect(cosDeg(240).toString()).toBe('-0.5');
      expect(cosDeg(270).toString()).toBe('0');
      expect(cosDeg(300).toString()).toBe('0.5');
      expect(cosDeg(360).toString()).toBe('1');

      expect(tanDeg(0).toString()).toBe('0');
      expect(tanDeg(45).toString()).toBe('1');
      expect(tanDeg(135).toString()).toBe('-1');
      expect(tanDeg(180).toString()).toBe('0');
      expect(tanDeg(225).toString()).toBe('1');
      expect(tanDeg(315).toString()).toBe('-1');
      expect(() => tanDeg(90)).toThrow(/indefinida/i);
      expect(() => tanDeg(270)).toThrow(/indefinida/i);
    });

    it('performs exact speed conversion km/h <-> m/s with Big.js', () => {
      // 72 km/h / 3.6 = 20 m/s exactly
      const ms = kmhToMs(72);
      expect(ms.toString()).toBe('20');
      const kmh = msToKmh(20);
      expect(kmh.toString()).toBe('72');

      // 108 km/h / 3.6 = 30 m/s
      expect(kmhToMs(108).toString()).toBe('30');
      expect(msToKmh(30).toString()).toBe('108');

      // Precision test: 3.6 / 3.6 = 1
      expect(kmhToMs(new Big('3.6')).toString()).toBe('1');
      expect(msToKmh(new Big('1')).toString()).toBe('3.6');
    });

    it('enforces non-negative radicands in safeSqrt', () => {
      expect(safeSqrt(0).toString()).toBe('0');
      expect(safeSqrt(4).toString()).toBe('2');
      expect(safeSqrt(25).toString()).toBe('5');
      expect(safeSqrt(new Big('144')).toString()).toBe('12');
      expect(() => safeSqrt(-1)).toThrow(/Radicando negativo/i);
      expect(() => safeSqrt(new Big('-0.0001'), 'teste_contexto')).toThrow(/teste_contexto/i);
    });

    it('validates gravity normalization correctly', () => {
      expect(normalizeGravity().toString()).toBe('9.8');
      expect(normalizeGravity('').toString()).toBe('9.8');
      expect(normalizeGravity('9.8').toString()).toBe('9.8');
      expect(normalizeGravity(10).toString()).toBe('10');
      expect(normalizeGravity('10').toString()).toBe('10');
      expect(() => normalizeGravity(0)).toThrow(/positiva/i);
      expect(() => normalizeGravity(-9.8)).toThrow(/positiva/i);
    });

    it('converts degrees to radians and back accurately', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI, 6);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 6);
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 6);
    });

    it('formats numbers with units correctly', () => {
      expect(formatUnit(12.345, 'm/s', 2, ',')).toBe('12,35 m/s');
      expect(formatUnit(100, 'N', 2, '.')).toBe('100 N');
    });
  });

  describe('2. Mode 1: MRU (mru.ts)', () => {
    it('calculates position S = S0 + v * t', () => {
      const res = calculateMRU({ unknown: 's', s0: '10', v: '5', t: '3' });
      expect(res.s).toBe(25);
      expect(res.formattedS).toBe('25');
      expect(res.steps.length).toBeGreaterThanOrEqual(4);
      expect(res.chartData.points.length).toBe(21);
      expect(res.chartData.type).toBe('temporal');
    });

    it('calculates initial position S0 = S - v * t', () => {
      const res = calculateMRU({ unknown: 's0', s: '25', v: '5', t: '3' });
      expect(res.s0).toBe(10);
    });

    it('calculates velocity v = (S - S0) / t', () => {
      const res = calculateMRU({ unknown: 'v', s: '25', s0: '10', t: '3' });
      expect(res.v).toBe(5);
    });

    it('calculates time t = (S - S0) / v', () => {
      const res = calculateMRU({ unknown: 't', s: '25', s0: '10', v: '5' });
      expect(res.t).toBe(3);
    });

    it('handles negative velocity (retrograde motion)', () => {
      const res = calculateMRU({ unknown: 's', s0: '50', v: '-4', t: '10' });
      expect(res.s).toBe(10);
      expect(res.steps.some((st) => st.includes('Retrógrado'))).toBe(true);
    });

    it('throws error when t = 0 for velocity calculation', () => {
      expect(() => calculateMRU({ unknown: 'v', s: '20', s0: '10', t: '0' })).toThrow(/zero/i);
    });

    it('throws error when v = 0 and positions are distinct for time calculation', () => {
      expect(() => calculateMRU({ unknown: 't', s: '20', s0: '10', v: '0' })).toThrow(
        /nunca alcançará a posição final/i
      );
    });

    it('preserves arbitrary precision without floating-point artifacts', () => {
      const res = calculateMRU({ unknown: 's', s0: '0.1', v: '0.2', t: '3' }, { decimals: 4, separator: '.' });
      expect(res.s).toBe(0.7);
      expect(res.formattedS).toBe('0.7');
    });
  });

  describe('3. Mode 2: MRUV & Torricelli (mruv.ts)', () => {
    it('calculates horaria final position S = S0 + v0*t + 0.5*a*t^2', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        unknown: 's',
        s0: '0',
        v0: '10',
        a: '2',
        t: '5',
      });
      // S = 0 + 10*5 + 0.5*2*25 = 75
      expect(res.s).toBe(75);
      expect(res.v).toBe(20);
      expect(res.deltaS).toBe(75);
      expect(res.chartData.type).toBe('temporal');
      expect(res.chartData.points.length).toBe(21);
    });

    it('calculates final velocity v = v0 + a*t', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        unknown: 'v',
        v0: '5',
        a: '3',
        t: '4',
      });
      expect(res.v).toBe(17);
    });

    it('calculates acceleration a = (v - v0) / t', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        unknown: 'a',
        v0: '10',
        v: '30',
        t: '5',
      });
      expect(res.a).toBe(4);
    });

    it('solves time from quadratic position equation ½ a t² + v0 t - ΔS = 0', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        unknown: 't',
        s0: '0',
        s: '75',
        v0: '10',
        a: '2',
      });
      expect(res.t).toBe(5);
    });

    it('computes Torricelli final velocity v = sqrt(v0^2 + 2*a*deltaS)', () => {
      const res = calculateMRUV({
        subMode: 'torricelli',
        unknown: 'v',
        v0: '0',
        a: '2',
        deltaS: '25',
      });
      // v^2 = 0 + 2 * 2 * 25 = 100 -> v = 10
      expect(res.v).toBe(10);
    });

    it('computes Torricelli displacement deltaS = (v^2 - v0^2) / (2*a)', () => {
      const res = calculateMRUV({
        subMode: 'torricelli',
        unknown: 'deltaS',
        v0: '0',
        v: '20',
        a: '4',
      });
      // deltaS = 400 / 8 = 50
      expect(res.deltaS).toBe(50);
    });

    it('detects inversion of motion / stopping point when v0 and a have opposite signs', () => {
      const res = calculateMRUV({
        subMode: 'horaria',
        unknown: 's',
        s0: '0',
        v0: '20',
        a: '-5',
        t: '6',
      });
      // t_stop = 20 / 5 = 4s, d_stop = 20^2 / (2*5) = 40m
      expect(res.stoppingTime).toBe(4);
      expect(res.stoppingDistance).toBe(40);
    });

    it('throws error when Torricelli radicand is negative', () => {
      expect(() =>
        calculateMRUV({
          subMode: 'torricelli',
          unknown: 'v',
          v0: '10',
          a: '-5',
          deltaS: '20',
        })
      ).toThrow(/Radicando de Torricelli negativo/i);
    });
  });

  describe('4. Mode 3: Queda Livre (quedaLivre.ts)', () => {
    it('calculates fall time and impact speed accurately', () => {
      // h0 = 45 m, g = 10 m/s^2 -> t = sqrt(90/10) = 3 s, v = 10 * 3 = 30 m/s (108 km/h)
      const res = calculateQuedaLivre({ h0: '45', g: '10' });
      expect(res.tQueda).toBe(3);
      expect(res.vImpacto).toBe(30);
      expect(res.formattedTQueda).toBe('3');
      expect(res.formattedVImpacto).toBe('30');
      expect(res.trajectoryPoints.length).toBe(21);
      expect(res.trajectoryPoints[0].y).toBe(45);
      expect(res.trajectoryPoints[res.trajectoryPoints.length - 1].y).toBe(0);
    });

    it('handles standard earth gravity g = 9.8 m/s^2', () => {
      const res = calculateQuedaLivre({ h0: '19.6', g: '9.8' });
      // t = sqrt(39.2 / 9.8) = sqrt(4) = 2 s
      expect(res.tQueda).toBe(2);
      expect(res.vImpacto).toBeCloseTo(19.6, 2);
    });

    it('rejects non-positive release height', () => {
      expect(() => calculateQuedaLivre({ h0: '0' })).toThrow(/positiva/i);
      expect(() => calculateQuedaLivre({ h0: '-10' })).toThrow(/positiva/i);
      expect(() => calculateQuedaLivre({ h0: '' })).toThrow(/informada/i);
    });
  });

  describe('5. Mode 4: Lançamento Vertical (lancamentoVertical.ts)', () => {
    it('calculates vertical launch with ground origin (y0 = 0)', () => {
      // v0 = 30 m/s, g = 10 m/s^2
      // t_subida = 3 s, H_max = 30^2 / 20 = 45 m, t_total = 6 s, v_retorno = 30 m/s
      const res = calculateLancamentoVertical({ v0: '30', y0: '0', g: '10' });
      expect(res.tSubida).toBe(3);
      expect(res.hMax).toBe(45);
      expect(res.tTotal).toBe(6);
      expect(res.vRetorno).toBe(30);
      expect(res.trajectoryPoints.length).toBe(25);
    });

    it('calculates vertical launch from elevated platform (y0 > 0)', () => {
      // v0 = 10 m/s, y0 = 20 m, g = 10 m/s^2
      // t_subida = 1 s, H_max = 20 + 100/20 = 25 m
      // t_total = (10 + sqrt(100 + 400)) / 10 = (10 + sqrt(500)) / 10 ≈ 3.236 s
      const res = calculateLancamentoVertical({ v0: '10', y0: '20', g: '10' });
      expect(res.tSubida).toBe(1);
      expect(res.hMax).toBe(25);
      expect(res.tTotal).toBeCloseTo(3.236, 2);
    });

    it('rejects negative initial height or non-positive launch velocity', () => {
      expect(() => calculateLancamentoVertical({ v0: '0', y0: '0' })).toThrow(/positiva/i);
      expect(() => calculateLancamentoVertical({ v0: '-10', y0: '10' })).toThrow(/positiva/i);
      expect(() => calculateLancamentoVertical({ v0: '10', y0: '-5' })).toThrow(/negativa/i);
    });
  });

  describe('6. Mode 5: Lançamento Horizontal (lancamentoHorizontal.ts)', () => {
    it('calculates horizontal projectile motion using Galileo composition', () => {
      // h0 = 20 m, v0x = 15 m/s, g = 10 m/s^2
      // t_queda = sqrt(40/10) = 2 s
      // Alcance = 15 * 2 = 30 m
      // vyFinal = 10 * 2 = 20 m/s
      // vImpacto = sqrt(15^2 + 20^2) = 25 m/s
      const res = calculateLancamentoHorizontal({ h0: '20', v0x: '15', g: '10' });
      expect(res.tQueda).toBe(2);
      expect(res.alcance).toBe(30);
      expect(res.vyFinal).toBe(20);
      expect(res.vImpacto).toBe(25);
      expect(res.chartData.type).toBe('ballistic');
      expect(res.chartData.apex).toEqual({ x: 0, y: 20 });
      expect(res.chartData.range).toEqual({ x: 30, y: 0 });
      expect(res.trajectoryPoints.length).toBe(25);
    });

    it('rejects non-positive inputs', () => {
      expect(() => calculateLancamentoHorizontal({ h0: '0', v0x: '10' })).toThrow(/positiva/i);
      expect(() => calculateLancamentoHorizontal({ h0: '20', v0x: '0' })).toThrow(/positiva/i);
    });
  });

  describe('7. Mode 6: Lançamento Oblíquo (lancamentoObliquo.ts)', () => {
    it('calculates oblique launch with 30-degree angle', () => {
      // v0 = 20 m/s, angle = 30°, y0 = 0, g = 10 m/s^2
      // v0x = 20 * cos(30°) = 20 * sqrt(3)/2 ≈ 17.3205 m/s
      // v0y = 20 * sin(30°) = 20 * 0.5 = 10 m/s
      // t_subida = 10 / 10 = 1 s
      // H_max = 10^2 / 20 = 5 m
      // t_voo = 2 s
      // Alcance = 17.3205 * 2 ≈ 34.641 m
      const res = calculateLancamentoObliquo({ v0: '20', angleDeg: '30', y0: '0', g: '10' });
      expect(res.v0y).toBe(10);
      expect(res.v0x).toBeCloseTo(17.3205, 3);
      expect(res.tSubida).toBe(1);
      expect(res.hMax).toBe(5);
      expect(res.tVoo).toBe(2);
      expect(res.alcance).toBeCloseTo(34.641, 2);
      expect(res.chartData.type).toBe('ballistic');
      expect(res.chartData.points.length).toBe(31);
    });

    it('calculates maximum range at 45-degree angle', () => {
      // v0 = 20 m/s, angle = 45°, g = 10 m/s^2
      // A = v0^2 * sin(90°) / g = 400 / 10 = 40 m
      const res = calculateLancamentoObliquo({ v0: '20', angleDeg: '45', g: '10' });
      expect(res.alcance).toBeCloseTo(40, 1);
      expect(res.hMax).toBeCloseTo(10, 1);
    });

    it('rejects angles outside (0, 90) degrees', () => {
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '0' })).toThrow(/entre 0° e 90°/i);
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '90' })).toThrow(/entre 0° e 90°/i);
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '-15' })).toThrow(/entre 0° e 90°/i);
      expect(() => calculateLancamentoObliquo({ v0: '10', angleDeg: '95' })).toThrow(/entre 0° e 90°/i);
    });
  });

  describe('8. Mode 7: MCU (mcu.ts)', () => {
    it('calculates all circular parameters given radius and period', () => {
      // R = 2 m, T = 4 s
      // f = 0.25 Hz (15 RPM)
      // ω = 2π / 4 = π / 2 ≈ 1.5708 rad/s
      // v = ω * R = π ≈ 3.1416 m/s
      // a_cp = v^2 / R = π^2 / 2 ≈ 4.9348 m/s^2
      const res = calculateMCU({ radius: '2', parameterType: 'period', value: '4' });
      expect(res.frequency).toBe(0.25);
      expect(res.omega).toBeCloseTo(Math.PI / 2, 4);
      expect(res.vLinear).toBeCloseTo(Math.PI, 4);
      expect(res.aCentripeta).toBeCloseTo((Math.PI * Math.PI) / 2, 3);
      expect(res.chartData.type).toBe('circular');
    });

    it('calculates parameters given frequency', () => {
      const res = calculateMCU({ radius: '5', parameterType: 'frequency', value: '2' });
      expect(res.period).toBe(0.5);
      expect(res.omega).toBeCloseTo(4 * Math.PI, 3);
    });

    it('calculates parameters given angular_speed', () => {
      const res = calculateMCU({ radius: '3', parameterType: 'angular_speed', value: '10' });
      expect(res.vLinear).toBe(30);
      expect(res.aCentripeta).toBe(300);
    });

    it('calculates parameters given linear_speed', () => {
      const res = calculateMCU({ radius: '4', parameterType: 'linear_speed', value: '20' });
      expect(res.omega).toBe(5);
      expect(res.aCentripeta).toBe(100);
    });

    it('rejects non-positive radius or parameter values', () => {
      expect(() => calculateMCU({ radius: '0', parameterType: 'period', value: '1' })).toThrow(/positivo/i);
      expect(() => calculateMCU({ radius: '2', parameterType: 'period', value: '-5' })).toThrow(/positivo/i);
    });
  });

  describe('9. Mode 8: MHS (mhs.ts)', () => {
    it('calculates simple pendulum harmonic motion', () => {
      // L = 1 m, g = 9.8 m/s^2, A = 0.05 m
      // ω = sqrt(9.8 / 1) ≈ 3.1305 rad/s
      // T = 2π / ω ≈ 2.007 s
      const res = calculateMHS({
        type: 'pendulo',
        amplitude: '0.05',
        length: '1',
        g: '9.8',
      });
      expect(res.omega).toBeCloseTo(Math.sqrt(9.8), 3);
      expect(res.period).toBeCloseTo((2 * Math.PI) / Math.sqrt(9.8), 3);
      expect(res.chartData.type).toBe('temporal');
      expect(res.wavePoints.length).toBe(41);
    });

    it('calculates mass-spring harmonic motion', () => {
      // m = 2 kg, k = 50 N/m, A = 0.2 m
      // ω = sqrt(50 / 2) = sqrt(25) = 5 rad/s
      // T = 2π / 5 ≈ 1.2566 s
      // f = 5 / (2π) ≈ 0.7958 Hz
      const res = calculateMHS({
        type: 'massa_mola',
        amplitude: '0.2',
        mass: '2',
        k: '50',
      });
      expect(res.omega).toBe(5);
      expect(res.period).toBeCloseTo((2 * Math.PI) / 5, 4);
      expect(res.frequency).toBeCloseTo(5 / (2 * Math.PI), 4);
    });

    it('rejects non-positive physical parameters', () => {
      expect(() => calculateMHS({ type: 'pendulo', amplitude: '0', length: '1' })).toThrow(/positiva/i);
      expect(() => calculateMHS({ type: 'pendulo', amplitude: '0.1', length: '-1' })).toThrow(/positivo/i);
      expect(() => calculateMHS({ type: 'massa_mola', amplitude: '0.1', mass: '0', k: '10' })).toThrow(/positiva/i);
      expect(() => calculateMHS({ type: 'massa_mola', amplitude: '0.1', mass: '1', k: '0' })).toThrow(/positiva/i);
    });
  });

  describe('10. Mode 9: Plano Inclinado (planoInclinado.ts)', () => {
    it('calculates inclined plane dynamics with sliding acceleration', () => {
      // m = 10 kg, angle = 30°, g = 10 m/s^2, mu = 0.2
      // P = 100 N
      // Px = 100 * sin(30°) = 50 N
      // Py = 100 * cos(30°) = 100 * sqrt(3)/2 ≈ 86.6025 N
      // N = Py ≈ 86.6025 N
      // FatMax = 0.2 * 86.6025 ≈ 17.3205 N
      // Since Px (50) > FatMax (17.3205), sliding!
      // Fres = 50 - 17.3205 = 32.6795 N
      // a = 32.6795 / 10 = 3.26795 m/s^2
      const res = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '30',
        g: '10',
        frictionCoef: '0.2',
      });
      expect(res.peso).toBe(100);
      expect(res.px).toBe(50);
      expect(res.py).toBeCloseTo(86.6025, 3);
      expect(res.normal).toBeCloseTo(86.6025, 3);
      expect(res.isStatic).toBe(false);
      expect(res.fat).toBeCloseTo(17.3205, 3);
      expect(res.aceleracao).toBeCloseTo(3.268, 2);
      expect(res.chartData.type).toBe('inclined_plane');
    });

    it('identifies static equilibrium when friction prevents motion', () => {
      // Same parameters but mu = 0.8 -> FatMax = 0.8 * 86.6025 = 69.282 N > Px (50 N)
      const res = calculatePlanoInclinado({
        mass: '10',
        angleDeg: '30',
        g: '10',
        frictionCoef: '0.8',
      });
      expect(res.isStatic).toBe(true);
      expect(res.fat).toBe(50);
      expect(res.aceleracao).toBe(0);
      expect(res.fRes).toBe(0);
    });

    it('rejects angles outside [0, 90] degrees', () => {
      expect(() => calculatePlanoInclinado({ mass: '10', angleDeg: '-5' })).toThrow(/entre 0° e 90°/i);
      expect(() => calculatePlanoInclinado({ mass: '10', angleDeg: '95' })).toThrow(/entre 0° e 90°/i);
    });
  });

  describe('11. Mode 10: Energia Mecânica & Trabalho (energiaTrabalho.ts)', () => {
    it('calculates kinetic, potential, and total mechanical energy', () => {
      // m = 4 kg, v = 10 m/s, h = 5 m, g = 10 m/s^2
      // Ec = 0.5 * 4 * 100 = 200 J
      // Ep = 4 * 10 * 5 = 200 J
      // Em = 400 J
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'conservacao_energia',
        mass: '4',
        v: '10',
        h: '5',
        g: '10',
      });
      expect(res.ec).toBe(200);
      expect(res.ep).toBe(200);
      expect(res.em).toBe(400);
      expect(res.chartData.type).toBe('energy_bars');
      expect(res.chartData.bars.length).toBe(3);
    });

    it('calculates work and power with CV and HP conversions', () => {
      // F = 100 N, d = 20 m, angle = 60°, t = 10 s
      // W = 100 * 20 * cos(60°) = 2000 * 0.5 = 1000 J
      // P = 1000 / 10 = 100 W
      // CV = 100 / 735.5 ≈ 0.136 CV
      // HP = 100 / 745.7 ≈ 0.134 HP
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '100',
        distance: '20',
        angleDeg: '60',
        time: '10',
      });
      expect(res.work).toBe(1000);
      expect(res.power).toBe(100);
      expect(res.chartData.type).toBe('energy_bars');
      expect(res.chartData.bars.length).toBe(2);
      expect(res.steps.some((st) => st.includes('CV') && st.includes('HP'))).toBe(true);
    });

    it('identifies resistant work for opposing force (angle = 180°)', () => {
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '50',
        distance: '10',
        angleDeg: '180',
      });
      expect(res.work).toBe(-500);
      expect(res.steps.some((st) => st.includes('Trabalho Resistente'))).toBe(true);
    });

    it('rejects invalid inputs', () => {
      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'conservacao_energia',
          mass: '0',
        })
      ).toThrow(/positiva/i);
      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'trabalho_potencia',
          force: '10',
          distance: '-5',
        })
      ).toThrow(/negativa/i);
      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'trabalho_potencia',
          force: '10',
          distance: '5',
          time: '0',
        })
      ).toThrow(/positivo/i);
    });
  });
});
