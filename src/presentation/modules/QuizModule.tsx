import React, { useState } from 'react';
import { Brain, Flame, Trophy, RefreshCw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { generateQuizQuestion } from '../../core/math/quizGenerator';
import { StepByStep } from '../components/StepByStep';
import type { QuizQuestion } from '../../types';

export const QuizModule: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(generateQuizQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);

  const loadNewQuestion = () => {
    setCurrentQuestion(generateQuizQuestion());
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const handleSelectOption = (option: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedAnswer(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      setStreak((prev) => prev + 1);
      setScore((prev) => prev + 10);
    } else {
      setStreak(0);
    }
  };

  if (!currentQuestion) return null;

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-red-900/20 border border-amber-200/50 dark:border-amber-800/40 backdrop-blur-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="text-amber-500" /> Modo Prática & Desafios
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Treine resolução rápida de Bhaskara e Regra de Três com feedback didático imediato.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold text-xs">
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            <span>{streak} seguidos</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
            <Trophy size={16} className="text-indigo-500" />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {currentQuestion.type === 'bhaskara' ? 'Desafio Bhaskara' : 'Desafio Regra de Três'}
          </span>
          <button
            type="button"
            onClick={loadNewQuestion}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 touch-target"
          >
            <RefreshCw size={14} /> Pular questão
          </button>
        </div>

        {/* Question Text */}
        <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Multiple Choice Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((option, idx) => {
            let style =
              'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 hover:border-indigo-400';

            if (isAnswered) {
              if (option === currentQuestion.correctAnswer) {
                style =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20';
              } else if (option === selectedAnswer) {
                style =
                  'border-red-500 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold ring-2 ring-red-500/20';
              } else {
                style = 'opacity-40 border-slate-200 dark:border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(option)}
                className={`p-4 rounded-2xl border text-base font-mono transition-all flex items-center justify-between touch-target text-left ${style}`}
              >
                <span>{option}</span>
                {isAnswered && option === currentQuestion.correctAnswer && (
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {isAnswered && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                  <XCircle size={20} className="text-red-600 dark:text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Banner */}
        {isAnswered && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-in fade-in ${
              isCorrect
                ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200'
                : 'border-red-200 dark:border-red-800/80 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <CheckCircle2 size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle size={24} className="text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div>
                <p className="font-bold text-sm">
                  {isCorrect ? 'Correto! Parabéns!' : 'Não foi dessa vez!'}
                </p>
                <p className="text-xs opacity-80">
                  {isCorrect ? '+10 pontos adicionados.' : `A resposta certa é ${currentQuestion.correctAnswer}.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadNewQuestion}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md touch-target shrink-0"
            >
              Próxima <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Didactic Step-by-Step for the Question */}
      {isAnswered && (
        <div className="animate-in fade-in">
          <StepByStep
            title="Explicação Didática da Questão"
            steps={currentQuestion.explanation}
          />
        </div>
      )}
    </div>
  );
};
