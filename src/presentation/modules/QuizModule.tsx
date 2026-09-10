import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Skull,
  Flame,
  RotateCcw,
  XCircle,
  ArrowRight,
  Sparkles,
  Delete,
} from 'lucide-react';
import { generateQuizQuestion } from '../../core/math/quizGenerator';
import { parseBig, formatNumberSmart } from '../../core/math/precision';
import { StepByStep } from '../components/StepByStep';
import { useAppStore } from '../../store/useAppStore';
import type { QuizDifficultyMode, QuizQuestion, QuizTrackSelector } from '../../types';

export const QuizModule: React.FC = () => {
  const { quizProgress, recordQuizAnswer, settings } = useAppStore();

  // Settings & Modes
  const [selectedTrack, setSelectedTrack] = useState<QuizTrackSelector>('sobrevivencia');
  const [difficultyMode, setDifficultyMode] = useState<QuizDifficultyMode>('velocidade');

  // Game Progress State
  const [countNumber, setCountNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(() =>
    generateQuizQuestion('sobrevivencia', 1)
  );
  const [userInput, setUserInput] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  // Status & Feedback State
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const [showAgileBadge, setShowAgileBadge] = useState<boolean>(false);
  const [agileXpBonus, setAgileXpBonus] = useState<number>(5);
  const [flashColor, setFlashColor] = useState<'emerald' | 'red' | null>(null);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [totalTime, setTotalTime] = useState<number>(20);
  const timerRef = useRef<number | null>(null);

  // Get current record based on track
  const currentRecord =
    selectedTrack === 'sobrevivencia'
      ? quizProgress.survival?.recordCount || 0
      : quizProgress.tracks?.[selectedTrack]?.recordCount || 0;

  // Compute total time based on difficulty and count number
  const computeTimeLimit = useCallback((mode: QuizDifficultyMode, count: number): number => {
    if (mode === 'tranquilo') return Infinity;
    if (mode === 'velocidade') return 18;
    // Brutal mode: starts at 8s, decreases progressively down to 5s
    const reduction = Math.min(3, Math.floor(count / 25) * 0.5);
    return Math.max(5, 8 - reduction);
  }, []);

  // Initialize or Advance Question
  const loadQuestion = useCallback(
    (nextCount: number, track: QuizTrackSelector) => {
      const q = generateQuizQuestion(track, nextCount);
      const time = computeTimeLimit(difficultyMode, nextCount);

      setCountNumber(nextCount);
      setCurrentQuestion(q);
      setUserInput('');
      setIsAnswered(false);
      setIsCorrect(null);
      setIsTimedOut(false);
      setShowAgileBadge(false);
      setFlashColor(null);
      setTotalTime(time);
      setTimeLeft(time);
    },
    [difficultyMode, computeTimeLimit]
  );

  // Switch Track or Difficulty
  const handleTrackChange = (newTrack: QuizTrackSelector) => {
    setSelectedTrack(newTrack);
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    loadQuestion(1, newTrack);
  };

  const handleDifficultyChange = (newMode: QuizDifficultyMode) => {
    setDifficultyMode(newMode);
    const newTime = computeTimeLimit(newMode, countNumber);
    setTotalTime(newTime);
    setTimeLeft(newTime);
  };

  // Restart / Reset current run
  const handleRestart = () => {
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    loadQuestion(1, selectedTrack);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (difficultyMode === 'tranquilo' || isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 100;
    const decrement = intervalMs / 1000;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          // Trigger Timeout
          handleTimeout();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficultyMode, isAnswered, countNumber]);

  // Handle Timeout
  const handleTimeout = () => {
    setIsAnswered(true);
    setIsCorrect(false);
    setIsTimedOut(true);
    setFlashColor('red');
    setStreak(0);

    recordQuizAnswer({
      track: selectedTrack,
      countNumber,
      correct: false,
      xpEarned: score,
      currentStreak: 0,
    });
  };

  // Submission handler
  const handleConfirm = useCallback(() => {
    if (isAnswered || !userInput.trim()) return;

    let parsedUser = null;
    let parsedCorrect = null;

    try {
      parsedUser = parseBig(userInput);
      parsedCorrect = parseBig(currentQuestion.correctAnswer);
    } catch {
      // Invalid input format
      return;
    }

    const correct = parsedUser.eq(parsedCorrect);

    if (correct) {
      // Haptic feedback if supported
      if ('vibrate' in navigator) navigator.vibrate?.(40);

      const ratio = totalTime === Infinity ? 0 : timeLeft / totalTime;
      const isAgile = totalTime !== Infinity && ratio >= 0.6; // Answered in first 40% of time
      const bonus = isAgile ? Math.max(5, Math.floor(ratio * 15)) : 0;
      const earnedXp = 10 + Math.min(streak * 2, 20) + bonus;

      const nextScore = score + earnedXp;
      const nextStreak = streak + 1;

      setIsAnswered(true);
      setIsCorrect(true);
      setFlashColor('emerald');
      setScore(nextScore);
      setStreak(nextStreak);

      if (isAgile) {
        setAgileXpBonus(bonus);
        setShowAgileBadge(true);
      }

      recordQuizAnswer({
        track: selectedTrack,
        countNumber,
        correct: true,
        xpEarned: nextScore,
        currentStreak: nextStreak,
      });

      // Quick advance if correct
      setTimeout(() => {
        loadQuestion(countNumber + 1, selectedTrack);
      }, isAgile ? 850 : 500);
    } else {
      // Incorrect answer
      if ('vibrate' in navigator) navigator.vibrate?.([80, 50, 80]);

      setIsAnswered(true);
      setIsCorrect(false);
      setFlashColor('red');
      setStreak(0);

      recordQuizAnswer({
        track: selectedTrack,
        countNumber,
        correct: false,
        xpEarned: score,
        currentStreak: 0,
      });
    }
  }, [
    isAnswered,
    userInput,
    currentQuestion,
    totalTime,
    timeLeft,
    streak,
    score,
    selectedTrack,
    countNumber,
    loadQuestion,
    recordQuizAnswer,
  ]);

  // Keypad Handlers
  const handleAddDigit = (digit: string) => {
    if (isAnswered) return;
    setUserInput((prev) => {
      // Limit to 10 characters to avoid overflow
      if (prev.length >= 10) return prev;
      return prev + digit;
    });
  };

  const handleAddDecimal = () => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (prev.includes(',') || prev.includes('.')) return prev;
      return (prev || '0') + ',';
    });
  };

  const handleToggleNegative = () => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (!prev) return '-';
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  };

  const handleBackspace = () => {
    if (isAnswered) return;
    setUserInput((prev) => prev.slice(0, -1));
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadQuestion(countNumber + 1, selectedTrack);
        }
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleAddDigit(e.key);
      } else if (e.key === ',' || e.key === '.') {
        handleAddDecimal();
      } else if (e.key === '-' || e.key === '_') {
        handleToggleNegative();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, countNumber, selectedTrack, handleConfirm, loadQuestion]);

  // Timer calculation
  const timerPercentage =
    totalTime === Infinity ? 100 : Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  let timerColor = 'bg-emerald-500';
  if (timerPercentage < 25) {
    timerColor = 'bg-red-500 animate-pulse';
  } else if (timerPercentage < 50) {
    timerColor = 'bg-amber-500';
  }

  // Account progress calculation (e.g. #16 de 200)
  const totalGoal = currentQuestion.totalGoal || 200;
  const progressPercentage = Math.min(100, ((countNumber - 1) / totalGoal) * 100);

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto pb-24 md:pb-12 select-none">
      {/* Track & Difficulty Selectors Bar */}
      <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs backdrop-blur-md">
        {/* Track Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: 'sobrevivencia', label: 'Sobrevivência 💀' },
              { id: 'soma', label: 'Soma +' },
              { id: 'subtracao', label: 'Subtração −' },
              { id: 'multiplicacao', label: 'Multiplicação ×' },
              { id: 'divisao', label: 'Divisão ÷' },
              { id: 'regra_simples', label: 'Regra de 3' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTrackChange(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-target ${
                selectedTrack === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Difficulty Pills & Restart */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'tranquilo', label: 'Tranquilo' },
                { id: 'velocidade', label: 'Velocidade' },
                { id: 'brutal', label: 'Brutal 🔥' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleDifficultyChange(item.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  difficultyMode === item.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRestart}
            title="Reiniciar sessão"
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw size={13} /> Reiniciar
          </button>
        </div>
      </div>

      {/* Main Game Card (Dark Arcade Theme inspired by MatSpeed) */}
      <div
        className={`relative p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border transition-all duration-300 shadow-2xl flex flex-col items-center gap-6 overflow-hidden ${
          flashColor === 'emerald'
            ? 'border-emerald-500 shadow-emerald-500/20'
            : flashColor === 'red'
            ? 'border-red-500 shadow-red-500/20'
            : 'border-slate-800/90 shadow-indigo-950/40'
        }`}
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Top Header Row: Account Index vs XP/Streak */}
        <div className="w-full flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-black text-sm tracking-wider uppercase">
              <Skull size={18} className="text-indigo-400 shrink-0" />
              <span>CONTA #{countNumber}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              de {totalGoal} · recorde {currentRecord}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xl font-black tracking-tight text-amber-400 font-mono leading-none">
              {score.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              <span>XP SOBREVIVÊNCIA</span>
              {streak > 0 && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-black">
                  <Flame size={12} className="fill-orange-400 text-orange-400" />
                  x{streak}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dual Progress Bars */}
        <div className="w-full flex flex-col gap-1.5 z-10">
          {/* Top Bar: Timer (Countdown) */}
          {difficultyMode !== 'tranquilo' && (
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ease-linear ${timerColor}`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          )}

          {/* Bottom Bar: Account progress */}
          <div className="w-full h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500/80 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Agile Feedback Badge (Floating with slight rotation) */}
        {showAgileBadge && (
          <div className="absolute top-24 right-6 z-20 animate-bounce">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/30 transform rotate-3">
              <Sparkles size={14} className="fill-slate-950" />
              <span>✓ RESPOSTA ÁGIL! +{agileXpBonus} XP</span>
            </div>
          </div>
        )}

        {/* Math Display Area */}
        <div className="w-full flex flex-col items-center justify-center my-2 text-center z-10">
          {currentQuestion.context && (
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">
              {currentQuestion.context}
            </span>
          )}
          {currentQuestion.type === 'regra_simples' && (
            <p className="text-xs sm:text-sm text-slate-300 mb-2 max-w-md">
              {currentQuestion.question}
            </p>
          )}
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-wide font-mono">
            {currentQuestion.displayExpression}
          </h2>
        </div>

        {/* Input Box with Blinking Cursor */}
        <div className="w-full max-w-xs z-10">
          <div
            className={`w-full h-14 rounded-2xl bg-slate-900/90 border flex items-center justify-center px-4 font-mono text-2xl font-bold transition-all shadow-inner ${
              isAnswered
                ? isCorrect
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20 ring-2 ring-emerald-500/20'
                  : 'border-red-500 text-red-400 bg-red-950/20 ring-2 ring-red-500/20'
                : 'border-slate-800 text-cyan-400 focus-within:border-cyan-400'
            }`}
          >
            <span>{userInput || ''}</span>
            {!isAnswered && (
              <span className="inline-block w-0.5 h-7 bg-cyan-400 ml-1 animate-pulse" />
            )}
          </div>
        </div>

        {/* Virtual Keypad (3x4) + Confirm Button */}
        <div className="w-full max-w-xs flex flex-col gap-2.5 z-10">
          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isAnswered}
                onClick={() => handleAddDigit(num.toString())}
                className="h-12 sm:h-14 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-white font-mono text-xl font-bold transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
              >
                {num}
              </button>
            ))}

            {/* Row 4: Comma, 0, Backspace */}
            <button
              type="button"
              disabled={isAnswered}
              onClick={handleAddDecimal}
              className="h-12 sm:h-14 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-white font-mono text-2xl font-bold transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
            >
              ,
            </button>

            <button
              type="button"
              disabled={isAnswered}
              onClick={() => handleAddDigit('0')}
              className="h-12 sm:h-14 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border border-slate-800/80 text-white font-mono text-xl font-bold transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
            >
              0
            </button>

            <button
              type="button"
              disabled={isAnswered}
              onClick={handleBackspace}
              className="h-12 sm:h-14 rounded-xl bg-red-950/30 hover:bg-red-900/40 active:bg-red-800/50 border border-red-900/40 text-red-300 transition-all shadow-xs flex items-center justify-center touch-target disabled:opacity-60"
              title="Apagar (Backspace)"
            >
              <Delete size={20} />
            </button>
          </div>

          {/* Quick Negative Toggle for numbers that may be negative */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isAnswered}
              onClick={handleToggleNegative}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-slate-800/60 transition-colors"
            >
              <span className="font-bold text-xs">±</span> Alternar sinal (±)
            </button>
          </div>

          {/* Big GO! Button */}
          <button
            type="button"
            disabled={Boolean(isAnswered && isCorrect)}
            onClick={isAnswered ? () => loadQuestion(countNumber + 1, selectedTrack) : handleConfirm}
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 touch-target active:scale-[0.98] ${
              isAnswered && !isCorrect
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isAnswered && !isCorrect ? (
              <>
                Continuar <ArrowRight size={20} />
              </>
            ) : (
              'GO!'
            )}
          </button>
        </div>

        {/* Immediate Feedback Banner on Error / Timeout */}
        {isAnswered && !isCorrect && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-200 flex items-center justify-between gap-3 z-10 animate-in fade-in">
            <div className="flex items-center gap-3">
              <XCircle size={24} className="text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {isTimedOut ? 'Tempo esgotado!' : 'Resposta incorreta!'}
                </p>
                <p className="text-xs text-red-300/90 mt-0.5">
                  A resposta correta é{' '}
                  <span className="font-mono font-bold text-white underline">
                    {formatNumberSmart(
                      currentQuestion.correctAnswer,
                      settings.decimalPlaces,
                      settings.decimalSeparator
                    )}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadQuestion(countNumber + 1, selectedTrack)}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
            >
              Próxima <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Didactic Step-by-Step on Error or on Demand */}
      {isAnswered && !isCorrect && currentQuestion.explanation.length > 0 && (
        <div className="animate-in fade-in">
          <StepByStep
            title="Passo a Passo Didático da Resolução"
            steps={currentQuestion.explanation}
          />
        </div>
      )}
    </div>
  );
};
