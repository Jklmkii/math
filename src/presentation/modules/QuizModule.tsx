import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Skull,
  Flame,
  RotateCcw,
  XCircle,
  ArrowRight,
  Sparkles,
  Delete,
  Plus,
  Minus,
  X,
  Divide,
  Scale,
  ChevronLeft,
  Trophy,
  Zap,
  Swords,
  Crown,
} from 'lucide-react';
import { generateQuizQuestion } from '../../core/math/quizGenerator';
import { parseBig, formatNumberSmart } from '../../core/math/precision';
import { StepByStep } from '../components/StepByStep';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../../core/i18n/translations';
import { DailyChallengeCard } from '../components/DailyChallengeCard';
import { BlitzGame } from '../components/BlitzGame';
import { BossBattle } from '../components/BossBattle';
import type { QuizDifficultyMode, QuizQuestion, QuizTrackSelector } from '../../types';

export const QuizModule: React.FC = () => {
  const { quizProgress, recordQuizAnswer, settings, profile } = useAppStore();
  const t = useTranslation(settings.language || 'pt');

  // Screen View: 'lobby' | 'playing' | 'game_over' | 'blitz' | 'boss_rush'
  const [screen, setScreen] = useState<'lobby' | 'playing' | 'game_over' | 'blitz' | 'boss_rush'>('lobby');

  const blitzHighScore = profile?.stats?.blitzHighScore || 0;
  const bossesDefeated = profile?.stats?.bossesDefeated || 0;

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
  const [maxStreakThisRun, setMaxStreakThisRun] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

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
    if (mode === 'velocidade') return 20; // 20s por conta como no MatSpeed
    // Brutal mode: 8s base, reduz gradualmente até 5s
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

  // Start game from Lobby
  const handleStartTrack = (track: QuizTrackSelector) => {
    setSelectedTrack(track);
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    setMaxStreakThisRun(0);
    setIsNewRecord(false);
    loadQuestion(1, track);
    setScreen('playing');
  };

  // Exit to Lobby
  const handleExitToLobby = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScreen('lobby');
  };

  // Restart current run
  const handleRestart = () => {
    setCountNumber(1);
    setScore(0);
    setStreak(0);
    setMaxStreakThisRun(0);
    setIsNewRecord(false);
    loadQuestion(1, selectedTrack);
    setScreen('playing');
  };

  // Handle Timeout
  const handleTimeout = useCallback(() => {
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

    // Se estiver na sobrevivência: errou / zerou tempo, acabou!
    if (selectedTrack === 'sobrevivencia') {
      if (countNumber > currentRecord) setIsNewRecord(true);
      setTimeout(() => {
        setScreen('game_over');
      }, 1000);
    }
  }, [selectedTrack, countNumber, score, currentRecord, recordQuizAnswer]);

  // Timer Countdown Effect
  useEffect(() => {
    if (screen !== 'playing' || difficultyMode === 'tranquilo' || isAnswered) {
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
          handleTimeout();
          return 0;
        }
        return next;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, difficultyMode, isAnswered, countNumber, handleTimeout]);

  // Submission handler
  const handleConfirm = useCallback(() => {
    if (isAnswered || !userInput.trim()) return;

    let parsedUser = null;
    let parsedCorrect = null;

    try {
      parsedUser = parseBig(userInput);
      parsedCorrect = parseBig(currentQuestion.correctAnswer);
    } catch {
      return;
    }

    const correct = parsedUser.eq(parsedCorrect);

    if (correct) {
      if ('vibrate' in navigator) navigator.vibrate?.(40);

      const ratio = totalTime === Infinity ? 0 : timeLeft / totalTime;
      const isAgile = totalTime !== Infinity && ratio >= 0.6;
      const bonus = isAgile ? Math.max(5, Math.floor(ratio * 15)) : 0;
      const earnedXp = 10 + Math.min(streak * 2, 20) + bonus;

      const nextScore = score + earnedXp;
      const nextStreak = streak + 1;
      const updatedMaxStreak = Math.max(maxStreakThisRun, nextStreak);

      setIsAnswered(true);
      setIsCorrect(true);
      setFlashColor('emerald');
      setScore(nextScore);
      setStreak(nextStreak);
      setMaxStreakThisRun(updatedMaxStreak);

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

      // Quick advance to next count
      setTimeout(() => {
        loadQuestion(countNumber + 1, selectedTrack);
      }, isAgile ? 850 : 500);
    } else {
      // Incorreto
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

      // Se for Sobrevivência: errou, acabou!
      if (selectedTrack === 'sobrevivencia') {
        if (countNumber > currentRecord) setIsNewRecord(true);
        setTimeout(() => {
          setScreen('game_over');
        }, 1200);
      }
    }
  }, [
    isAnswered,
    userInput,
    currentQuestion,
    totalTime,
    timeLeft,
    streak,
    score,
    maxStreakThisRun,
    selectedTrack,
    countNumber,
    currentRecord,
    loadQuestion,
    recordQuizAnswer,
  ]);

  // Keypad Handlers
  const handleAddDigit = useCallback((digit: string) => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (prev.length >= 10) return prev;
      return prev + digit;
    });
  }, [isAnswered]);

  const handleAddDecimal = useCallback(() => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (prev.includes(',') || prev.includes('.')) return prev;
      return (prev || '0') + ',';
    });
  }, [isAnswered]);

  const handleToggleNegative = useCallback(() => {
    if (isAnswered) return;
    setUserInput((prev) => {
      if (!prev) return '-';
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  }, [isAnswered]);

  const handleBackspace = useCallback(() => {
    if (isAnswered) return;
    setUserInput((prev) => prev.slice(0, -1));
  }, [isAnswered]);

  // Keyboard Event Listener
  useEffect(() => {
    if (screen !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered) {
        if (selectedTrack !== 'sobrevivencia' && (e.key === 'Enter' || e.key === ' ')) {
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
  }, [screen, isAnswered, countNumber, selectedTrack, handleConfirm, loadQuestion, handleAddDigit, handleAddDecimal, handleToggleNegative, handleBackspace]);

  // ==========================================
  // SCREEN: BLITZ GAME (60 Segundos)
  // ==========================================
  if (screen === 'blitz') {
    return <BlitzGame onExit={() => setScreen('lobby')} />;
  }

  // ==========================================
  // SCREEN: BOSS BATTLE (Boss Rush)
  // ==========================================
  if (screen === 'boss_rush') {
    return <BossBattle onExit={() => setScreen('lobby')} />;
  }

  // ==========================================
  // SCREEN 1: LOBBY / MENU (Estilo MatSpeed)
  // ==========================================
  if (screen === 'lobby') {
    const somaNivel = quizProgress.tracks?.soma?.currentLevel || 1;
    const subNivel = quizProgress.tracks?.subtracao?.currentLevel || 1;
    const multNivel = quizProgress.tracks?.multiplicacao?.currentLevel || 1;
    const divNivel = quizProgress.tracks?.divisao?.currentLevel || 1;
    const sobrevRecorde = quizProgress.survival?.recordCount || 0;

    return (
      <div className="flex flex-col items-center gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none animate-in fade-in">
        {/* Title & Subtitle */}
        <div className="flex flex-col items-center text-center mt-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-widest text-amber-400 font-mono drop-shadow-[0_4px_10px_rgba(251,191,36,0.3)]">
            {t.matspeed_title}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-2">
            {t.matspeed_subtitle}
          </p>
        </div>

        {/* 1. Daily Challenge Card Prominently Embedded */}
        <div className="w-full">
          <DailyChallengeCard />
        </div>

        {/* 2. Special Game Modes Grid: Blitz & Boss Rush */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Modo Blitz Card */}
          <button
            type="button"
            onClick={() => setScreen('blitz')}
            className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 hover:from-amber-950/60 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col items-center text-center gap-2.5 group shadow-xl hover:shadow-amber-500/10 active:scale-[0.98] touch-target cursor-pointer relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-amber-500/20">
              <Zap size={26} className="fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-black text-white">Modo Blitz</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  60s
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Agilidade mental contra o relógio (+2s acerto / -3s erro)
              </p>
            </div>
            <div className="w-full flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/80 px-1 text-slate-400">
              <span className="flex items-center gap-1 text-orange-400">
                <Flame size={14} className="fill-orange-400" /> Combo até 3x XP
              </span>
              <span className="font-mono text-amber-300">
                Recorde: {blitzHighScore} pts
              </span>
            </div>
          </button>

          {/* Batalha de Chefe (Boss Rush) Card */}
          <button
            type="button"
            onClick={() => setScreen('boss_rush')}
            className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 hover:from-purple-950/60 border border-purple-500/40 hover:border-purple-400 transition-all flex flex-col items-center text-center gap-2.5 group shadow-xl hover:shadow-purple-500/10 active:scale-[0.98] touch-target cursor-pointer relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md shadow-purple-500/20">
              <Swords size={26} />
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-black text-white">Batalha de Chefe</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                  Boss Rush
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Derrote Lord Mathgoth com acertos críticos em &lt;3s
              </p>
            </div>
            <div className="w-full flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-800/80 px-1 text-slate-400">
              <span className="flex items-center gap-1 text-rose-400">
                <Crown size={14} /> 100 HP · 3 Escudos
              </span>
              <span className="font-mono text-purple-300">
                Derrotados: {bossesDefeated}
              </span>
            </div>
          </button>
        </div>

        {/* Section Divider / MatSpeed header */}
        <div className="w-full flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Trilhas de Prática
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>

        {/* Difficulty Selectors (Pills) */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setDifficultyMode('tranquilo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-target ${
              difficultyMode === 'tranquilo'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🌱</span> {t.diff_casual}
          </button>

          <button
            type="button"
            onClick={() => setDifficultyMode('velocidade')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-target ${
              difficultyMode === 'velocidade'
                ? 'bg-amber-400/10 text-amber-400 border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡</span> {t.diff_speed}
          </button>

          <button
            type="button"
            onClick={() => setDifficultyMode('brutal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 touch-target ${
              difficultyMode === 'brutal'
                ? 'bg-red-500/10 text-red-400 border border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🔥</span> {t.diff_brutal}
          </button>
        </div>

        {/* 2x2 Grid of Tracks */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Card Soma */}
          <button
            type="button"
            onClick={() => handleStartTrack('soma')}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/80 transition-all flex flex-col items-center text-center gap-2 group shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] touch-target"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-white">{t.track_addition}</h3>
            <p className="text-[11px] font-medium text-slate-400">
              {t.track_addition_sub}
            </p>
            <span className="mt-1 px-3 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono text-xs font-bold">
              {t.level_badge} {somaNivel}/100
            </span>
          </button>

          {/* Card Subtração */}
          <button
            type="button"
            onClick={() => handleStartTrack('subtracao')}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-rose-500/80 transition-all flex flex-col items-center text-center gap-2 group shadow-lg hover:shadow-rose-500/10 active:scale-[0.98] touch-target"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Minus size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-white">{t.track_subtraction}</h3>
            <p className="text-[11px] font-medium text-slate-400">
              {t.track_subtraction_sub}
            </p>
            <span className="mt-1 px-3 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-800/60 font-mono text-xs font-bold">
              {t.level_badge} {subNivel}/100
            </span>
          </button>

          {/* Card Multiplicação */}
          <button
            type="button"
            onClick={() => handleStartTrack('multiplicacao')}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/80 transition-all flex flex-col items-center text-center gap-2 group shadow-lg hover:shadow-amber-500/10 active:scale-[0.98] touch-target"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <X size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-white">{t.track_multiplication}</h3>
            <p className="text-[11px] font-medium text-slate-400">
              {t.track_multiplication_sub}
            </p>
            <span className="mt-1 px-3 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800/60 font-mono text-xs font-bold">
              {t.level_badge} {multNivel}/100
            </span>
          </button>

          {/* Card Divisão */}
          <button
            type="button"
            onClick={() => handleStartTrack('divisao')}
            className="p-5 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/80 transition-all flex flex-col items-center text-center gap-2 group shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] touch-target"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Divide size={24} className="stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-white">{t.track_division}</h3>
            <p className="text-[11px] font-medium text-slate-400">
              {t.track_division_sub}
            </p>
            <span className="mt-1 px-3 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 font-mono text-xs font-bold">
              {t.level_badge} {divNivel}/100
            </span>
          </button>
        </div>

        {/* Card Inferior: Sobrevivência (Full Width) */}
        <button
          type="button"
          onClick={() => handleStartTrack('sobrevivencia')}
          className="w-full p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 to-slate-950 border border-purple-900/60 hover:border-purple-500 transition-all flex flex-col items-center text-center gap-2 group shadow-xl hover:shadow-purple-500/20 active:scale-[0.98] touch-target"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Skull size={28} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">
            {t.track_survival}
          </h2>
          <p className="text-xs font-semibold text-slate-400 max-w-sm">
            {t.track_survival_sub}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs font-bold text-purple-300">
            <span>{t.record_prefix}: {t.account_prefix} #{sobrevRecorde}</span>
            <span>•</span>
            <span>{quizProgress.survival?.highScore || 0} {t.xp_survival}</span>
          </div>
        </button>

        {/* Extra option: Regra de Três Simples */}
        <div className="w-full flex justify-center">
          <button
            type="button"
            onClick={() => handleStartTrack('regra_simples')}
            className="text-xs font-semibold text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition-colors py-1 px-3 rounded-xl hover:bg-slate-900"
          >
            <Scale size={14} /> {t.track_rule_three}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2: GAME OVER (Modo Sobrevivência)
  // ==========================================
  if (screen === 'game_over') {
    return (
      <div className="flex flex-col items-center gap-6 max-w-xl mx-auto pb-24 md:pb-12 select-none animate-in fade-in">
        <div className="w-full p-8 rounded-3xl bg-slate-950 text-white border border-red-900/60 shadow-2xl flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800 text-red-400 flex items-center justify-center">
            <Skull size={36} />
          </div>

          <div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              {t.game_over_title}
            </h2>
            <p className="text-sm font-semibold text-slate-400 mt-1">
              {isTimedOut ? t.game_over_timeout : t.game_over_wrong}
            </p>
          </div>

          {isNewRecord && (
            <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/60 text-amber-400 font-black text-xs flex items-center gap-1.5 shadow-lg animate-pulse">
              <Trophy size={16} /> {t.new_record_badge}: {t.account_prefix} #{countNumber}!
            </div>
          )}

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-semibold">{t.account_prefix}</span>
              <span className="text-xl font-mono font-black text-white">#{countNumber}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center">
              <span className="text-xs text-slate-400 font-semibold">{t.earned_xp}</span>
              <span className="text-xl font-mono font-black text-amber-400">+{score}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center col-span-2 sm:col-span-1">
              <span className="text-xs text-slate-400 font-semibold">{t.max_combo}</span>
              <span className="text-xl font-mono font-black text-orange-400">x{maxStreakThisRun} 🔥</span>
            </div>
          </div>

          {/* Correct Answer Revelation */}
          <div className="w-full max-w-md p-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t.correct_was}
            </p>
            <p className="text-xl font-mono font-black text-white mt-1">
              {currentQuestion.displayExpression} ={' '}
              <span className="text-emerald-400 underline">
                {formatNumberSmart(
                  currentQuestion.correctAnswer,
                  settings.decimalPlaces,
                  settings.decimalSeparator
                )}
              </span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={handleRestart}
              className="flex-1 w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 touch-target"
            >
              <RotateCcw size={18} /> {t.play_again}
            </button>
            <button
              type="button"
              onClick={handleExitToLobby}
              className="flex-1 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-all border border-slate-800 touch-target"
            >
              {t.back_to_menu}
            </button>
          </div>
        </div>

        {/* Didactic Step-by-Step for what went wrong */}
        {currentQuestion.explanation.length > 0 && (
          <div className="w-full">
            <StepByStep
              title={t.explanation_title}
              steps={currentQuestion.explanation}
            />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // SCREEN 3: PLAYING (Em jogo com Teclado Direto)
  // ==========================================
  const timerPercentage =
    totalTime === Infinity ? 100 : Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  let timerColor = 'bg-emerald-500';
  if (timerPercentage < 25) {
    timerColor = 'bg-red-500 animate-pulse';
  } else if (timerPercentage < 50) {
    timerColor = 'bg-amber-500';
  }

  const totalGoal = currentQuestion.totalGoal || 200;
  const progressPercentage = Math.min(100, ((countNumber - 1) / totalGoal) * 100);

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto pb-24 md:pb-12 select-none">
      {/* Top Bar: Return to Lobby ("← sair") */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleExitToLobby}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2.5 rounded-xl hover:bg-slate-900 transition-colors"
        >
          <ChevronLeft size={16} /> {t.exit_button}
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
          {selectedTrack === 'sobrevivencia' ? `${t.track_survival} 💀` : `${t.level_badge}: ${selectedTrack}`}
        </span>
      </div>

      {/* Main Game Card */}
      <div
        className={`relative p-6 sm:p-8 rounded-3xl bg-slate-950 text-white border transition-all duration-300 shadow-2xl flex flex-col items-center gap-6 overflow-hidden ${
          flashColor === 'emerald'
            ? 'border-emerald-500 shadow-emerald-500/20'
            : flashColor === 'red'
            ? 'border-red-500 shadow-red-500/20'
            : 'border-slate-800/90 shadow-indigo-950/40'
        }`}
      >
        {/* Subtle Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Status Row */}
        <div className="w-full flex items-start justify-between gap-4 z-10">
          <div>
            <div className="flex items-center gap-1.5 text-slate-200 font-black text-sm tracking-wider uppercase">
              <Skull size={18} className="text-indigo-400 shrink-0" />
              <span>{t.account_prefix} #{countNumber}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              {t.of} {totalGoal} · {t.record_prefix} {currentRecord}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xl font-black tracking-tight text-amber-400 font-mono leading-none">
              {score.toLocaleString('pt-BR')}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              <span>{t.xp_survival}</span>
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
          {difficultyMode !== 'tranquilo' && (
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ease-linear ${timerColor}`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          )}

          <div className="w-full h-1.5 rounded-full bg-slate-800/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500/80 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Agile Feedback Badge */}
        {showAgileBadge && (
          <div className="absolute top-24 right-6 z-20 animate-bounce">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-emerald-500/30 transform rotate-3">
              <Sparkles size={14} className="fill-slate-950" />
              <span>{t.agile_badge} +{agileXpBonus} XP</span>
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

        {/* Keypad Grid (3x4) + Big GO! Button */}
        <div className="w-full max-w-xs flex flex-col gap-2.5 z-10">
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

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isAnswered}
              onClick={handleToggleNegative}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 py-0.5 px-2 rounded-md hover:bg-slate-800/60 transition-colors"
            >
              <span className="font-bold text-xs">±</span> {t.toggle_sign}
            </button>
          </div>

          <button
            type="button"
            disabled={Boolean(isAnswered && isCorrect)}
            onClick={
              isAnswered
                ? () => loadQuestion(countNumber + 1, selectedTrack)
                : handleConfirm
            }
            className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-lg sm:text-xl tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 touch-target active:scale-[0.98] ${
              isAnswered && !isCorrect
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isAnswered && !isCorrect ? (
              <>
                {t.continue_button} <ArrowRight size={20} />
              </>
            ) : (
              t.go_button
            )}
          </button>
        </div>

        {/* Feedback on Individual Tracks (if not sobrevivência) */}
        {isAnswered && !isCorrect && selectedTrack !== 'sobrevivencia' && (
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
              {t.next_question} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* StepByStep for individual tracks on error */}
      {isAnswered && !isCorrect && selectedTrack !== 'sobrevivencia' && currentQuestion.explanation.length > 0 && (
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
