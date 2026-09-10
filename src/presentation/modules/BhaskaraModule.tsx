import React, { useState, useEffect } from 'react';
import { Sparkles, Calculator, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { NumericInput } from '../components/NumericInput';
import { ParabolaChart } from '../components/ParabolaChart';
import { StepByStep } from '../components/StepByStep';
import { calculateBhaskara, parseQuadraticEquation } from '../../core/math/bhaskara';
import { formatNumberSmart } from '../../core/math/precision';
import { useAppStore } from '../../store/useAppStore';
import type { BhaskaraResult } from '../../types';

export const BhaskaraModule: React.FC = () => {
  const { settings, addHistoryItem } = useAppStore();

  const [a, setA] = useState<string>('1');
  const [b, setB] = useState<string>('-5');
  const [c, setC] = useState<string>('6');

  const [equationText, setEquationText] = useState<string>('');
  const [textParserNotice, setTextParserNotice] = useState<string | null>(null);

  const [result, setResult] = useState<BhaskaraResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Parse text equation if user types one
  const handleParseTextEquation = () => {
    if (!equationText.trim()) return;
    const parsed = parseQuadraticEquation(equationText);
    if (parsed) {
      setA(parsed.a);
      setB(parsed.b);
      setC(parsed.c);
      setTextParserNotice(`Extraído: a = ${parsed.a}, b = ${parsed.b}, c = ${parsed.c}`);
      setTimeout(() => setTextParserNotice(null), 3500);
      setError(null);
    } else {
      setError('Formato não reconhecido. Exemplo: 2x² - 3x + 1 = 0');
    }
  };

  // Perform calculation
  const runCalculation = (saveToHistory = false) => {
    setError(null);

    if (!a.trim()) {
      setError('O coeficiente "a" é obrigatório.');
      setResult(null);
      return;
    }

    if (a.trim() === '0' || a.trim() === '-0') {
      setError('Em uma equação de 2º grau, o coeficiente "a" não pode ser zero.');
      setResult(null);
      return;
    }

    try {
      const calc = calculateBhaskara(a, b || '0', c || '0', {
        decimals: settings.decimalPlaces,
        separator: settings.decimalSeparator,
      });
      setResult(calc);

      if (saveToHistory) {
        let rootSummary = '';
        if (calc.rootType === 'two_real') {
          rootSummary = `x₁ = ${formatNumberSmart(calc.x1!, settings.decimalPlaces, settings.decimalSeparator)}, x₂ = ${formatNumberSmart(calc.x2!, settings.decimalPlaces, settings.decimalSeparator)}`;
        } else if (calc.rootType === 'single_real') {
          rootSummary = `x = ${formatNumberSmart(calc.x1!, settings.decimalPlaces, settings.decimalSeparator)}`;
        } else {
          rootSummary = `Complexas: ${calc.complexRoots?.x1.formatted}`;
        }

        addHistoryItem({
          type: 'bhaskara',
          title: `Bhaskara: ${calc.formattedEquation}`,
          summary: `Δ = ${calc.delta} | ${rootSummary}`,
          details: calc.steps.join('\n'),
          rawPayload: { a, b, c },
        });
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro ao calcular.');
      setResult(null);
    }
  };

  // Run calculation whenever coefficients change
  useEffect(() => {
    runCalculation(false);
  }, [a, b, c, settings.decimalPlaces, settings.decimalSeparator]);

  const handleManualCalculate = () => {
    runCalculation(true);
  };

  const handleReset = () => {
    setA('1');
    setB('-5');
    setC('6');
    setEquationText('');
    setError(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 rounded-3xl bg-gradient-to-r from-indigo-900/20 via-purple-900/20 to-pink-900/20 border border-indigo-200/50 dark:border-indigo-800/40 backdrop-blur-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="text-indigo-600 dark:text-indigo-400" /> Equação do 2º Grau (Bhaskara)
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Cálculo didático com discriminante (Δ), raízes reais/complexas, vértice e gráfico dinâmico.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="self-start md:self-auto flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target"
        >
          <RefreshCw size={14} /> Restaurar Exemplo
        </button>
      </div>

      {/* Text Equation Parser Input (Feature Nova) */}
      <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles size={14} className="text-indigo-500" />
          Entrada por Texto da Equação (Opcional)
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={equationText}
            onChange={(e) => setEquationText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleParseTextEquation()}
            placeholder="Ex: 2x² - 3x + 1 = 0 ou x^2 = 9"
            className="flex-1 px-4 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 touch-manipulation"
          />
          <button
            type="button"
            onClick={handleParseTextEquation}
            className="px-5 py-3 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 touch-target"
          >
            Extrair Coeficientes
          </button>
        </div>

        {textParserNotice && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} /> {textParserNotice}
          </div>
        )}
      </div>

      {/* Individual Coeff Inputs Grid */}
      <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Coeficientes: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">ax² + bx + c = 0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumericInput
            id="bhaskara-a"
            label="Coeficiente 'a' (≠ 0)"
            value={a}
            onChange={setA}
            placeholder="1"
            prefix="a ="
            error={a === '0' || a === '-0' ? "Não pode ser zero" : undefined}
          />
          <NumericInput
            id="bhaskara-b"
            label="Coeficiente 'b'"
            value={b}
            onChange={setB}
            placeholder="0"
            prefix="b ="
          />
          <NumericInput
            id="bhaskara-c"
            label="Coeficiente 'c'"
            value={c}
            onChange={setC}
            placeholder="0"
            prefix="c ="
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-semibold">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleManualCalculate}
          disabled={!result || Boolean(error)}
          className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 touch-target"
        >
          <Calculator size={18} /> Salvar no Histórico
        </button>
      </div>

      {/* Results Display */}
      {result && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Delta Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discriminante</span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                  Δ = {result.delta}
                </div>
              </div>
              <div className="mt-4">
                {result.delta > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    2 raízes reais distintas
                  </span>
                )}
                {result.delta === 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    1 raiz real dupla
                  </span>
                )}
                {result.delta < 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Raízes complexas (ℂ)
                  </span>
                )}
              </div>
            </div>

            {/* Roots Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Raízes Encontradas</span>
              <div className="flex flex-col gap-1.5 mt-2 font-mono">
                {result.rootType === 'two_real' && (
                  <>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      x₁ = {formatNumberSmart(result.x1!, settings.decimalPlaces, settings.decimalSeparator)}
                    </div>
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      x₂ = {formatNumberSmart(result.x2!, settings.decimalPlaces, settings.decimalSeparator)}
                    </div>
                  </>
                )}
                {result.rootType === 'single_real' && (
                  <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    x₁ = x₂ = {formatNumberSmart(result.x1!, settings.decimalPlaces, settings.decimalSeparator)}
                  </div>
                )}
                {result.rootType === 'complex' && result.complexRoots && (
                  <div className="flex flex-col gap-1 text-sm font-bold text-purple-600 dark:text-purple-400">
                    <div>x₁ = {result.complexRoots.x1.formatted}</div>
                    <div>x₂ = {result.complexRoots.x2.formatted}</div>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                Pontos onde a parábola corta ou se aproxima do eixo X.
              </span>
            </div>

            {/* Vertex Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Vértice da Parábola</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1 font-mono">
                  V = ({formatNumberSmart(result.vertex.x, settings.decimalPlaces, settings.decimalSeparator)};{' '}
                  {formatNumberSmart(result.vertex.y, settings.decimalPlaces, settings.decimalSeparator)})
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>
                  Eixo de simetria: <span className="font-mono font-bold">x = {formatNumberSmart(result.axisOfSymmetry, settings.decimalPlaces, settings.decimalSeparator)}</span>
                </p>
                <p>
                  Ponto de:{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {result.a > 0 ? 'Mínimo (concavidade para cima)' : 'Máximo (concavidade para baixo)'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Auto-scaled Parabola Chart */}
          <ParabolaChart
            result={result}
            decimals={settings.decimalPlaces}
            separator={settings.decimalSeparator}
          />

          {/* Step By Step Accordion */}
          <StepByStep
            title={`Passo a Passo: ${result.formattedEquation}`}
            steps={result.steps}
            summaryText={`Resolução completa da equação quadrática ${result.formattedEquation}`}
          />
        </div>
      )}
    </div>
  );
};
