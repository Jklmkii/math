import { describe, it, expect } from 'vitest';

import {


  sinDeg,
  cosDeg,
  tanDeg,
  safeSqrt,
  kmhToMs,
  msToKmh,
  normalizeGravity,
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
} from '../core/physics';

describe('Empirical Challenger M2 — Physical Invariants & Stress Testing', () => {
  // =========================================================================
  // 1. INVARIANTE: CONSERVAÇÃO DE ENERGIA MECÂNICA (Em = Ec + Ep)
  // =========================================================================
  describe('1. Conservação da Energia Mecânica e Teorema Trabalho-Energia', () => {
    it('verifica Em = Ec + Ep com exatidão aritmética em diversas combinações', () => {
      const testCases = [
        { mass: '2', v: '10', h: '5', g: '10' }, // Ec = 100, Ep = 100 => Em = 200
        { mass: '0.5', v: '20', h: '0', g: '9.8' }, // Ec = 100, Ep = 0 => Em = 100
        { mass: '10', v: '0', h: '15', g: '9.8' }, // Ec = 0, Ep = 1470 => Em = 1470
        { mass: '12345.6789', v: '45.67', h: '89.12', g: '9.8' },
      ];

      for (const tc of testCases) {
        const res = calculateEnergiaTrabalho({
          calculationSubtype: 'conservacao_energia',
          mass: tc.mass,
          v: tc.v,
          h: tc.h,
          g: tc.g,
        });

        expect(res.ec).toBeDefined();
        expect(res.ep).toBeDefined();
        expect(res.em).toBeDefined();

        const ec = res.ec!;
        const ep = res.ep!;
        const em = res.em!;

        // Erro relativo deve ser menor que a tolerância de ponto flutuante de 64 bits (1e-12)
        const diff = Math.abs(em - (ec + ep));
        const relDiff = em > 0 ? diff / em : diff;
        expect(relDiff).toBeLessThan(1e-12);
      }
    });

    it('conservação de energia em Queda Livre: Ec_impacto == Ep_inicial', () => {
      // Ep_inicial = m * g * h0
      // Ec_impacto = 1/2 * m * v_impacto^2
      // Logo v_impacto^2 = 2 * g * h0
      const heights = [1, 5, 20, 45, 100, 500];
      const g = '9.8';
      const gNum = 9.8;

      for (const h0 of heights) {
        const ql = calculateQuedaLivre({ h0: h0.toString(), g });
        const vImpacto = ql.vImpacto;
        const vImpactoSq = vImpacto * vImpacto;
        const expectedVSq = 2 * gNum * h0;

        expect(Math.abs(vImpactoSq - expectedVSq)).toBeLessThan(1e-6);
      }
    });

    it('conservação de energia em Lançamento Vertical: Ec_lancamento == Ep_max', () => {
      // 1/2 * m * v0^2 = m * g * (H_max - y0) => H_max - y0 = v0^2 / (2 * g)
      const velocities = [5, 10, 25, 50, 100];
      const g = '10';
      const gNum = 10;

      for (const v0 of velocities) {
        const lv = calculateLancamentoVertical({ v0: v0.toString(), y0: '0', g });
        const deltaH = lv.hMax;
        const expectedH = (v0 * v0) / (2 * gNum);

        expect(Math.abs(deltaH - expectedH)).toBeLessThan(1e-6);
        // Ao retornar ao solo (y0 = 0), v_retorno deve ser exatamente v0
        expect(Math.abs(lv.vRetorno - v0)).toBeLessThan(1e-6);
      }
    });

    it('conservação de energia em Lançamento Horizontal: Ec_final == Ec_inicial + Ep_inicial', () => {
      // 1/2 * m * v_impacto^2 = 1/2 * m * v0x^2 + m * g * h0
      // v_impacto^2 = v0x^2 + 2 * g * h0
      const h0 = 45;
      const v0x = 30;
      const g = '10';
      const gNum = 10;

      const lh = calculateLancamentoHorizontal({ h0: h0.toString(), v0x: v0x.toString(), g });
      const vImpactoSq = lh.vImpacto * lh.vImpacto;
      const expectedVSq = v0x * v0x + 2 * gNum * h0;

      expect(Math.abs(vImpactoSq - expectedVSq)).toBeLessThan(1e-6);
    });

    it('conservação de energia no Sistema Massa-Mola: 1/2 * k * A^2 == 1/2 * m * v_max^2', () => {
      const mass = '2';
      const k = '200';
      const amplitude = '0.5';

      const mhs = calculateMHS({
        type: 'massa_mola',
        mass,
        k,
        amplitude,
      });

      const omega = mhs.omega;
      const vMax = omega * 0.5; // v_max = omega * A
      const epMax = 0.5 * 200 * (0.5 * 0.5); // 1/2 k A^2 = 25 J
      const ecMax = 0.5 * 2 * (vMax * vMax); // 1/2 m v_max^2

      expect(Math.abs(epMax - ecMax)).toBeLessThan(1e-6);
      expect(Math.abs(epMax - 25)).toBeLessThan(1e-6);
    });

    it('Trabalho com ângulo de 90° deve ser estritamente zero (W = F * d * cos 90° = 0)', () => {
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '500',
        distance: '100',
        angleDeg: '90',
      });

      expect(res.work).toBe(0);
      expect(res.steps.some((s) => s.includes('Trabalho Nulo'))).toBe(true);
    });

    it('Trabalho resistente com ângulo de 180° deve ser negativo (W = -F * d)', () => {
      const res = calculateEnergiaTrabalho({
        calculationSubtype: 'trabalho_potencia',
        force: '50',
        distance: '10',
        angleDeg: '180',
      });

      expect(res.work).toBe(-500);
      expect(res.steps.some((s) => s.includes('Trabalho Resistente'))).toBe(true);
    });
  });

  // =========================================================================
  // 2. INVARIANTE: CONSISTÊNCIA DE TORRICELLI (v^2 = v0^2 + 2aΔS)
  // =========================================================================
  describe('2. Consistência e Ciclos da Equação de Torricelli', () => {
    it('satisfaz v^2 = v0^2 + 2aΔS em cálculo direto de v', () => {
      const v0 = 10;
      const a = 4;
      const deltaS = 50;

      const res = calculateMRUV({
        subMode: 'torricelli',
        unknown: 'v',
        v0: v0.toString(),
        a: a.toString(),
        deltaS: deltaS.toString(),
      });

      // v^2 = 100 + 2*4*50 = 100 + 400 = 500 => v = sqrt(500) ≈ 22.360679775
      const expectedV = Math.sqrt(v0 * v0 + 2 * a * deltaS);
      expect(Math.abs(res.v - expectedV)).toBeLessThan(1e-6);
    });

    it('ciclo fechado de Torricelli: (v0, a, deltaS) -> v -> deltaS_recuperado', () => {
      // Executa 50 testes verificando idempotência e reversibilidade
      for (let i = 1; i <= 50; i++) {
        const v0 = i * 2;
        const a = (i % 5) + 1;
        const deltaS = i * 10;

        // 1. Calcula v a partir de (v0, a, deltaS)
        const step1 = calculateMRUV({
          subMode: 'torricelli',
          unknown: 'v',
          v0: v0.toString(),
          a: a.toString(),
          deltaS: deltaS.toString(),
        });

        const computedV = step1.v;

        // 2. Calcula deltaS a partir de (computedV, v0, a)
        const step2 = calculateMRUV({
          subMode: 'torricelli',
          unknown: 'deltaS',
          v: computedV.toString(),
          v0: v0.toString(),
          a: a.toString(),
        });

        expect(Math.abs(step2.deltaS! - deltaS)).toBeLessThan(1e-4);

        // 3. Calcula a a partir de (computedV, v0, deltaS)
        const step3 = calculateMRUV({
          subMode: 'torricelli',
          unknown: 'a',
          v: computedV.toString(),
          v0: v0.toString(),
          deltaS: deltaS.toString(),
        });

        expect(Math.abs(step3.a - a)).toBeLessThan(1e-4);
      }
    });

    it('equivalência entre funções horárias do MRUV e Torricelli', () => {
      // Se um móvel acelera com v0 e a durante tempo t:
      // Pela horária: v = v0 + a*t e deltaS = v0*t + 1/2*a*t^2
      // Por Torricelli: v^2 deve ser v0^2 + 2*a*deltaS
      for (let t = 1; t <= 20; t++) {
        const v0 = 15;
        const a = 3;

        const horaria = calculateMRUV({
          subMode: 'horaria',
          unknown: 's',
          v0: v0.toString(),
          a: a.toString(),
          t: t.toString(),
          s0: '0',
        });

        const vHoraria = horaria.v;
        const deltaSHoraria = horaria.deltaS!;

        const torricelli = calculateMRUV({
          subMode: 'torricelli',
          unknown: 'v',
          v0: v0.toString(),
          a: a.toString(),
          deltaS: deltaSHoraria.toString(),
        });

        expect(Math.abs(vHoraria - torricelli.v)).toBeLessThan(1e-6);
      }
    });

    it('lança erro descritivo para radicando negativo de Torricelli (v0^2 + 2aΔS < 0)', () => {
      // Móvel a 10 m/s desacelerando a -5 m/s^2 tenta andar 20m: 100 + 2*(-5)*20 = 100 - 200 = -100 < 0
      expect(() =>
        calculateMRUV({
          subMode: 'torricelli',
          unknown: 'v',
          v0: '10',
          a: '-5',
          deltaS: '20',
        })
      ).toThrowError(/Radicando de Torricelli negativo/);
    });
  });

  // =========================================================================
  // 3. INVARIANTE: SIMETRIA PARABÓLICA E ALCANCE NO LANÇAMENTO OBLÍQUO
  // =========================================================================
  describe('3. Simetria Balística e Alcance Parabólico', () => {
    it('alcance idêntico para ângulos complementares: A(θ) == A(90° - θ)', () => {
      const v0 = '50';
      const g = '9.8';
      const pairs = [
        [15, 75],
        [30, 60],
        [20, 70],
        [40, 50],
        [10, 80],
      ];

      for (const [theta1, theta2] of pairs) {
        const r1 = calculateLancamentoObliquo({
          v0,
          angleDeg: theta1.toString(),
          g,
          y0: '0',
        });

        const r2 = calculateLancamentoObliquo({
          v0,
          angleDeg: theta2.toString(),
          g,
          y0: '0',
        });

        // Alcances devem ser idênticos
        expect(Math.abs(r1.alcance - r2.alcance)).toBeLessThan(1e-4);

        // Mas o tempo de voo e a altura máxima são diferentes
        expect(r1.hMax).not.toBe(r2.hMax);
        expect(r1.tVoo).not.toBe(r2.tVoo);
      }
    });

    it('alcance máximo absoluto ocorre a 45°', () => {
      const v0 = '40';
      const g = '10';

      const r45 = calculateLancamentoObliquo({
        v0,
        angleDeg: '45',
        g,
        y0: '0',
      });

      // A_max = v0^2 / g = 1600 / 10 = 160m
      expect(Math.abs(r45.alcance - 160)).toBeLessThan(1e-4);

      // Para qualquer outro ângulo próximo, o alcance deve ser estritamente menor
      for (const angle of [44, 44.9, 45.1, 46]) {
        const rOther = calculateLancamentoObliquo({
          v0,
          angleDeg: angle.toString(),
          g,
          y0: '0',
        });
        expect(rOther.alcance).toBeLessThan(r45.alcance);
      }
    });

    it('simetria do ápice da parábola: X_ápice = Alcance / 2 e t_voo = 2 * t_subida (quando y0 = 0)', () => {
      const angles = [15, 30, 45, 60, 75];

      for (const angle of angles) {
        const res = calculateLancamentoObliquo({
          v0: '35',
          angleDeg: angle.toString(),
          g: '9.8',
          y0: '0',
        });

        // t_voo = 2 * t_subida
        expect(Math.abs(res.tVoo - 2 * res.tSubida)).toBeLessThan(1e-6);

        // x do ápice no chartData deve ser metade do range
        const apexX = res.chartData!.apex!.x;
        const rangeX = res.chartData!.range!.x;
        expect(Math.abs(apexX - rangeX / 2)).toBeLessThan(1e-3);
      }
    });

    it('pontos de trajetória balística y(x) mantêm y >= 0 e iniciam em y0 terminando no solo', () => {
      const res = calculateLancamentoObliquo({
        v0: '25',
        angleDeg: '30',
        y0: '10',
        g: '10',
      });

      expect(res.trajectoryPoints.length).toBeGreaterThan(10);

      // Primeiro ponto em x = 0, y = y0 = 10
      const first = res.trajectoryPoints[0];
      expect(first.x).toBe(0);
      expect(first.y).toBe(10);

      // Todos os pontos têm y >= 0
      for (const pt of res.trajectoryPoints) {
        expect(pt.y).toBeGreaterThanOrEqual(0);
      }

      // Último ponto está no solo (y = 0)
      const last = res.trajectoryPoints[res.trajectoryPoints.length - 1];
      expect(last.y).toBe(0);
      expect(Math.abs(last.x - res.alcance)).toBeLessThan(0.1);
    });
  });

  // =========================================================================
  // 4. PRECISÃO TRIGONOMÉTRICA EM ÂNGULOS CARDINAIS E IDENTIDADES
  // =========================================================================
  describe('4. Precisão Trigonométrica em Ângulos Cardinais e Decomposição', () => {
    it('elimina resíduos IEEE 754 em sinDeg, cosDeg e tanDeg', () => {
      // Ângulos exatos
      expect(sinDeg(0).toString()).toBe('0');
      expect(sinDeg(30).toString()).toBe('0.5');
      expect(sinDeg(90).toString()).toBe('1');
      expect(sinDeg(150).toString()).toBe('0.5');
      expect(sinDeg(180).toString()).toBe('0');
      expect(sinDeg(270).toString()).toBe('-1');

      expect(cosDeg(0).toString()).toBe('1');
      expect(cosDeg(60).toString()).toBe('0.5');
      expect(cosDeg(90).toString()).toBe('0');
      expect(cosDeg(180).toString()).toBe('-1');
      expect(cosDeg(270).toString()).toBe('0');
      expect(cosDeg(300).toString()).toBe('0.5');

      expect(tanDeg(0).toString()).toBe('0');
      expect(tanDeg(45).toString()).toBe('1');
      expect(tanDeg(180).toString()).toBe('0');
      expect(tanDeg(225).toString()).toBe('1');
      expect(() => tanDeg(90)).toThrowError(/Tangente indefinida/);
      expect(() => tanDeg(270)).toThrowError(/Tangente indefinida/);
    });

    it('identidade de Pitágoras trigonométrica (sin²θ + cos²θ = 1) em múltiplos ângulos', () => {
      for (let deg = 0; deg < 360; deg += 15) {
        const s = Number(sinDeg(deg).toString());
        const c = Number(cosDeg(deg).toString());
        const sumSq = s * s + c * c;
        expect(Math.abs(sumSq - 1)).toBeLessThan(1e-12);
      }
    });

    it('Plano Inclinado satisfaz Px² + Py² = P² em todos os ângulos', () => {
      const angles = [0, 15, 30, 45, 60, 75, 90];
      const mass = '10';
      const g = '9.8';

      for (const angle of angles) {
        const res = calculatePlanoInclinado({
          mass,
          angleDeg: angle.toString(),
          frictionCoef: '0.2',
          g,
        });

        const px = res.px;
        const py = res.py;
        const p = res.peso;

        const sumSq = px * px + py * py;
        const pSq = p * p;

        expect(Math.abs(sumSq - pSq)).toBeLessThan(1e-6);
      }
    });

    it('Plano Inclinado nos extremos: 0° (plano horizontal) e 90° (parede vertical)', () => {
      // A 0°: Px = 0, Py = P, N = P, repouso estático absoluto
      const res0 = calculatePlanoInclinado({
        mass: '5',
        angleDeg: '0',
        frictionCoef: '0.3',
        g: '10',
      });
      expect(res0.px).toBe(0);
      expect(res0.py).toBe(50);
      expect(res0.normal).toBe(50);
      expect(res0.isStatic).toBe(true);
      expect(res0.aceleracao).toBe(0);

      // A 90°: Px = P, Py = 0, N = 0, aceleração livre igual a g
      const res90 = calculatePlanoInclinado({
        mass: '5',
        angleDeg: '90',
        frictionCoef: '0.3',
        g: '10',
      });
      expect(res90.px).toBe(50);
      expect(res90.py).toBe(0);
      expect(res90.normal).toBe(0);
      expect(res90.fat).toBe(0);
      expect(res90.isStatic).toBe(false);
      expect(res90.aceleracao).toBe(10); // aceleração = g
    });
  });

  // =========================================================================
  // 5. INVARIANTES DE MCU E MHS
  // =========================================================================
  describe('5. Relações Cinemáticas e Oscilatórias (MCU & MHS)', () => {
    it('MCU: T * f = 1 e v = ω * R e a_cp = v² / R = ω² * R', () => {
      const inputs = [
        { parameterType: 'period' as const, value: '2', radius: '5' },
        { parameterType: 'frequency' as const, value: '0.5', radius: '5' },
        { parameterType: 'angular_speed' as const, value: Math.PI.toString(), radius: '5' },
        { parameterType: 'linear_speed' as const, value: (5 * Math.PI).toString(), radius: '5' },
      ];

      for (const input of inputs) {
        const res = calculateMCU(input);

        // T * f = 1
        expect(Math.abs(res.period * res.frequency - 1)).toBeLessThan(1e-6);

        // v = omega * R
        expect(Math.abs(res.vLinear - res.omega * res.radius)).toBeLessThan(1e-6);

        // a_cp = v^2 / R
        const acpFromV = (res.vLinear * res.vLinear) / res.radius;
        expect(Math.abs(res.aCentripeta - acpFromV)).toBeLessThan(1e-4);

        // a_cp = omega^2 * R
        const acpFromOmega = res.omega * res.omega * res.radius;
        expect(Math.abs(res.aCentripeta - acpFromOmega)).toBeLessThan(1e-4);
      }
    });

    it('MHS Pêndulo: T = 2π * sqrt(L / g) e amplitude não altera o período (isocronismo)', () => {
      const L = '1';
      const g = '9.8';
      const expectedT = 2 * Math.PI * Math.sqrt(1 / 9.8);

      const res1 = calculateMHS({
        type: 'pendulo',
        amplitude: '0.1',
        length: L,
        g,
      });

      const res2 = calculateMHS({
        type: 'pendulo',
        amplitude: '0.3',
        length: L,
        g,
      });

      expect(Math.abs(res1.period - expectedT)).toBeLessThan(1e-4);
      expect(Math.abs(res2.period - expectedT)).toBeLessThan(1e-4);
      expect(res1.period).toBe(res2.period);
    });

    it('MHS: v_max = ω * A e a_max = ω² * A nos extremos da onda', () => {
      const res = calculateMHS({
        type: 'massa_mola',
        amplitude: '0.2',
        mass: '1',
        k: '100',
      });

      // omega = sqrt(100 / 1) = 10 rad/s
      expect(res.omega).toBe(10);

      // Limites calculados na onda senoidal
      const maxSampledV = Math.max(...res.wavePoints.map((p) => Math.abs(p.v)));
      const maxSampledA = Math.max(...res.wavePoints.map((p) => Math.abs(p.a)));

      const expectedVMax = 10 * 0.2; // 2 m/s
      const expectedAMax = 10 * 10 * 0.2; // 20 m/s^2

      // Na amostragem discreta da onda, o pico fica extremamente próximo do analítico
      expect(Math.abs(maxSampledV - expectedVMax)).toBeLessThan(0.05);
      expect(Math.abs(maxSampledA - expectedAMax)).toBeLessThan(0.05);
    });
  });

  // =========================================================================
  // 6. CASOS DE BORDA, VELOCIDADE ZERO, TEMPO ZERO E PRECISÃO DECIMAL
  // =========================================================================
  describe('6. Casos de Borda e Validação Estrita de Erros em Todos os 10 Motores', () => {
    it('MRU: divisão por zero tempo lança erro; velocidade zero com posições distintas lança erro', () => {
      // t = 0 para calcular v
      expect(() =>
        calculateMRU({
          unknown: 'v',
          s: '100',
          s0: '0',
          t: '0',
        })
      ).toThrowError(/O tempo decorrido não pode ser zero/);

      // v = 0 com s != s0 para calcular t
      expect(() =>
        calculateMRU({
          unknown: 't',
          s: '100',
          s0: '0',
          v: '0',
        })
      ).toThrowError(/A velocidade é zero com posições distintas/);

      // v = 0 com s == s0 para calcular t retorna t = 0
      const atRest = calculateMRU({
        unknown: 't',
        s: '50',
        s0: '50',
        v: '0',
      });
      expect(atRest.t).toBe(0);
    });

    it('MRUV: tempo zero no cálculo da aceleração lança erro', () => {
      expect(() =>
        calculateMRUV({
          subMode: 'horaria',
          unknown: 'a',
          v0: '0',
          v: '20',
          t: '0',
        })
      ).toThrowError(/O tempo decorrido não pode ser zero/);
    });

    it('Torricelli: deltaS zero no cálculo da aceleração lança erro', () => {
      expect(() =>
        calculateMRUV({
          subMode: 'torricelli',
          unknown: 'a',
          v: '20',
          v0: '10',
          deltaS: '0',
        })
      ).toThrowError(/Deslocamento nulo/);
    });

    it('Queda Livre: altura não positiva lança erro', () => {
      expect(() => calculateQuedaLivre({ h0: '0' })).toThrowError(/estritamente positiva/);
      expect(() => calculateQuedaLivre({ h0: '-10' })).toThrowError(/estritamente positiva/);
    });

    it('Lançamento Vertical: velocidade inicial não positiva lança erro', () => {
      expect(() => calculateLancamentoVertical({ v0: '0', y0: '0' })).toThrowError(
        /estritamente positiva/
      );
      expect(() => calculateLancamentoVertical({ v0: '-15', y0: '0' })).toThrowError(
        /estritamente positiva/
      );
      expect(() => calculateLancamentoVertical({ v0: '20', y0: '-5' })).toThrowError(
        /não pode ser negativa/
      );
    });

    it('Lançamento Horizontal: v0x e h0 não positivos lançam erro', () => {
      expect(() => calculateLancamentoHorizontal({ h0: '0', v0x: '10' })).toThrowError(
        /estritamente positiva/
      );
      expect(() => calculateLancamentoHorizontal({ h0: '20', v0x: '0' })).toThrowError(
        /estritamente positiva/
      );
    });

    it('Lançamento Oblíquo: ângulo fora de (0°, 90°) lança erro', () => {
      expect(() => calculateLancamentoObliquo({ v0: '20', angleDeg: '0' })).toThrowError(
        /estritamente entre 0° e 90°/
      );
      expect(() => calculateLancamentoObliquo({ v0: '20', angleDeg: '90' })).toThrowError(
        /estritamente entre 0° e 90°/
      );
      expect(() => calculateLancamentoObliquo({ v0: '20', angleDeg: '-10' })).toThrowError(
        /estritamente entre 0° e 90°/
      );
      expect(() => calculateLancamentoObliquo({ v0: '20', angleDeg: '95' })).toThrowError(
        /estritamente entre 0° e 90°/
      );
    });

    it('MCU: raio e parâmetros não positivos lançam erro', () => {
      expect(() =>
        calculateMCU({ parameterType: 'period', value: '2', radius: '0' })
      ).toThrowError(/estritamente positivo/);
      expect(() =>
        calculateMCU({ parameterType: 'frequency', value: '-1', radius: '5' })
      ).toThrowError(/estritamente positivo/);
    });

    it('MHS: parâmetros físicos inválidos lançam erro', () => {
      expect(() =>
        calculateMHS({ type: 'pendulo', amplitude: '0', length: '1' })
      ).toThrowError(/estritamente positiva/);
      expect(() =>
        calculateMHS({ type: 'pendulo', amplitude: '0.1', length: '-2' })
      ).toThrowError(/estritamente positivo/);
      expect(() =>
        calculateMHS({ type: 'massa_mola', amplitude: '0.1', mass: '0', k: '10' })
      ).toThrowError(/estritamente positiva/);
      expect(() =>
        calculateMHS({ type: 'massa_mola', amplitude: '0.1', mass: '1', k: '-5' })
      ).toThrowError(/estritamente positiva/);
    });

    it('Plano Inclinado: ângulo e coeficiente de atrito inválidos lançam erro', () => {
      expect(() =>
        calculatePlanoInclinado({ mass: '5', angleDeg: '-5', frictionCoef: '0.1' })
      ).toThrowError(/entre 0° e 90°/);
      expect(() =>
        calculatePlanoInclinado({ mass: '5', angleDeg: '95', frictionCoef: '0.1' })
      ).toThrowError(/entre 0° e 90°/);
      expect(() =>
        calculatePlanoInclinado({ mass: '5', angleDeg: '30', frictionCoef: '-0.2' })
      ).toThrowError(/não pode ser negativo/);
      expect(() =>
        calculatePlanoInclinado({ mass: '0', angleDeg: '30', frictionCoef: '0.2' })
      ).toThrowError(/estritamente positiva/);
    });

    it('Energia e Trabalho: parâmetros inválidos lançam erro', () => {
      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'conservacao_energia',
          mass: '0',
          v: '10',
          h: '5',
        })
      ).toThrowError(/estritamente positiva/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'conservacao_energia',
          mass: '5',
          v: '10',
          h: '-2',
        })
      ).toThrowError(/não pode ser negativa/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'trabalho_potencia',
          force: '100',
          distance: '-5',
        })
      ).toThrowError(/não pode ser negativa/);

      expect(() =>
        calculateEnergiaTrabalho({
          calculationSubtype: 'trabalho_potencia',
          force: '100',
          distance: '50',
          time: '0',
        })
      ).toThrowError(/estritamente positivo/);
    });

    it('Gravidade local: valores não positivos lançam erro', () => {
      expect(() => normalizeGravity('0')).toThrowError(/estritamente positiva/);
      expect(() => normalizeGravity('-9.8')).toThrowError(/estritamente positiva/);
    });

    it('Conversões de velocidade com big.js mantêm exatidão (3.6)', () => {
      // 72 km/h deve ser exatamente 20 m/s
      expect(kmhToMs(72).toString()).toBe('20');
      // 20 m/s deve ser exatamente 72 km/h
      expect(msToKmh(20).toString()).toBe('72');
      // 108 km/h -> 30 m/s
      expect(kmhToMs(108).toString()).toBe('30');
      // 36 km/h -> 10 m/s
      expect(kmhToMs(36).toString()).toBe('10');
    });

    it('safeSqrt protege contra radicandos negativos', () => {
      expect(safeSqrt(0).toString()).toBe('0');
      expect(safeSqrt(16).toString()).toBe('4');
      expect(() => safeSqrt(-0.0001, 'teste')).toThrowError(/Radicando negativo/);
    });
  });

  // =========================================================================
  // 7. DIDÁTICA DE PASSOS E FORMATO DOS GRÁFICOS
  // =========================================================================
  describe('7. Didática StepByStep e Estrutura de ChartData', () => {
    it('todos os 10 motores geram steps formatados em Markdown e dados de gráficos compatíveis', () => {
      const engines = [
        () => calculateMRU({ unknown: 's', s0: '0', v: '10', t: '5' }),
        () => calculateMRUV({ subMode: 'horaria', unknown: 's', s0: '0', v0: '5', a: '2', t: '3' }),
        () => calculateQuedaLivre({ h0: '20' }),
        () => calculateLancamentoVertical({ v0: '20' }),
        () => calculateLancamentoHorizontal({ h0: '20', v0x: '10' }),
        () => calculateLancamentoObliquo({ v0: '20', angleDeg: '45' }),
        () => calculateMCU({ parameterType: 'period', value: '2', radius: '1' }),
        () => calculateMHS({ type: 'pendulo', amplitude: '0.1', length: '1' }),
        () => calculatePlanoInclinado({ mass: '2', angleDeg: '30' }),
        () => calculateEnergiaTrabalho({ calculationSubtype: 'conservacao_energia', mass: '2', v: '10', h: '5' }),
      ];

      for (const run of engines) {
        const res = run();
        expect(res.steps.length).toBeGreaterThanOrEqual(3);
        expect(res.steps[0]).toContain('**');
        expect(res.chartData).toBeDefined();
        expect(res.chartData!.type).toMatch(/temporal|ballistic|circular|inclined_plane|energy_bars/);
      }
    });
  });
});
