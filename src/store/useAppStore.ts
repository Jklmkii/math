import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, CalculationType, HistoryItem, QuizProgress, QuizTrackSelector, UserProfile } from '../types';
import { validateHistorySchema } from '../core/storage/historyValidator';
import { calculateStreakUpdate, checkNewAchievements, ACHIEVEMENTS } from '../core/gamification/leveling';

export type ActiveTab = 'bhaskara' | 'regra_simples' | 'regra_composta' | 'quiz' | 'history' | 'settings';

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Gamification & Profile
  profile: UserProfile;
  addXp: (amount: number, reason?: string) => void;
  checkAndUpdateStreak: () => void;
  unlockAchievement: (id: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // History
  history: HistoryItem[];
  addHistoryItem: (item: {
    type: CalculationType;
    title: string;
    summary: string;
    details: string;
    rawPayload?: unknown;
  }) => void;
  removeHistoryItem: (id: string) => void;
  togglePinHistoryItem: (id: string) => void;
  clearHistory: () => void;
  importHistory: (items: HistoryItem[]) => void;

  // Treino / Quiz
  quizProgress: QuizProgress;
  recordQuizAnswer: (params: {
    track: QuizTrackSelector;
    countNumber: number;
    correct: boolean;
    xpEarned: number;
    currentStreak: number;
  }) => void;
  resetQuizProgress: (track?: QuizTrackSelector) => void;

  // Onboarding
  completeOnboarding: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  totalXp: 0,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  unlockedAchievements: [],
  stats: {
    totalCalculations: 0,
    totalBhaskara: 0,
    totalRegraDeTres: 0,
    totalQuizCorrect: 0,
    bestSurvivalRecord: 0,
  },
};

const DEFAULT_QUIZ_PROGRESS: QuizProgress = {
  survival: {
    highScore: 0,
    maxStreak: 0,
    recordCount: 0,
    totalAnswered: 0,
    totalCorrect: 0,
  },
  tracks: {
    soma: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    subtracao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    multiplicacao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    divisao: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
    regra_simples: { currentLevel: 1, bestStreak: 0, recordCount: 0, totalCorrect: 0, totalAnswered: 0 },
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'pt',
  decimalPlaces: 2,
  decimalSeparator: ',',
  historyLimit: 20,
  hasCompletedOnboarding: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'bhaskara',
      setActiveTab: (tab) => set({ activeTab: tab }),

      profile: DEFAULT_PROFILE,

      addXp: (amount) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const newTotalXp = Math.max(0, (prevProf.totalXp || 0) + amount);
          const candidate: UserProfile = { ...prevProf, totalXp: newTotalXp };
          const newlyUnlocked = checkNewAchievements(candidate);
          return {
            profile: {
              ...candidate,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlocked])],
            },
          };
        });
      },

      checkAndUpdateStreak: () => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          const update = calculateStreakUpdate(prevProf.lastActiveDate, prevProf.streakDays);
          const candidate: UserProfile = {
            ...prevProf,
            streakDays: update.newStreak,
            lastActiveDate: update.newLastActiveDate,
          };
          const newlyUnlocked = checkNewAchievements(candidate);
          return {
            profile: {
              ...candidate,
              unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlocked])],
            },
          };
        });
      },

      unlockAchievement: (id) => {
        set((state) => {
          const prevProf = state.profile || DEFAULT_PROFILE;
          if (prevProf.unlockedAchievements?.includes(id)) return {};
          const def = ACHIEVEMENTS.find((a) => a.id === id);
          const bonus = def ? def.xpReward : 0;
          return {
            profile: {
              ...prevProf,
              totalXp: (prevProf.totalXp || 0) + bonus,
              unlockedAchievements: [...(prevProf.unlockedAchievements || []), id],
            },
          };
        });
      },

      quizProgress: DEFAULT_QUIZ_PROGRESS,
      recordQuizAnswer: ({ track, countNumber, correct, xpEarned, currentStreak }) => {
        set((state) => {
          const prevProgress = state.quizProgress || DEFAULT_QUIZ_PROGRESS;
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;

          const earned = correct ? Math.max(10, xpEarned || 10) : 0;
          const newTotalXp = (prevProf.totalXp || 0) + earned;
          const newStats = {
            ...prevStats,
            totalQuizCorrect: (prevStats.totalQuizCorrect || 0) + (correct ? 1 : 0),
            bestSurvivalRecord:
              track === 'sobrevivencia'
                ? Math.max(prevStats.bestSurvivalRecord || 0, countNumber)
                : prevStats.bestSurvivalRecord || 0,
          };

          const candidateProfile: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            stats: newStats,
          };
          const newlyUnlocked = checkNewAchievements(candidateProfile);
          let bonusXp = 0;
          for (const achId of newlyUnlocked) {
            const def = ACHIEVEMENTS.find((a) => a.id === achId);
            if (def) bonusXp += def.xpReward;
          }

          const finalProfile: UserProfile = {
            ...candidateProfile,
            totalXp: newTotalXp + bonusXp,
            unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlocked])],
          };

          if (track === 'sobrevivencia') {
            const prevSurv = prevProgress.survival || DEFAULT_QUIZ_PROGRESS.survival;
            return {
              profile: finalProfile,
              quizProgress: {
                ...prevProgress,
                survival: {
                  ...prevSurv,
                  totalAnswered: prevSurv.totalAnswered + 1,
                  totalCorrect: prevSurv.totalCorrect + (correct ? 1 : 0),
                  highScore: Math.max(prevSurv.highScore, xpEarned),
                  maxStreak: Math.max(prevSurv.maxStreak, currentStreak),
                  recordCount: Math.max(prevSurv.recordCount, countNumber),
                },
              },
            };
          } else {
            const prevTrack = prevProgress.tracks?.[track] || {
              currentLevel: 1,
              bestStreak: 0,
              recordCount: 0,
              totalCorrect: 0,
              totalAnswered: 0,
            };
            const newTotalAnswered = prevTrack.totalAnswered + 1;
            const newTotalCorrect = prevTrack.totalCorrect + (correct ? 1 : 0);
            const newBestStreak = Math.max(prevTrack.bestStreak, currentStreak);
            const newRecordCount = Math.max(prevTrack.recordCount, countNumber);
            const newLevel = Math.max(prevTrack.currentLevel, Math.floor(newRecordCount / 5) + 1);

            return {
              profile: finalProfile,
              quizProgress: {
                ...prevProgress,
                tracks: {
                  ...prevProgress.tracks,
                  [track]: {
                    currentLevel: newLevel,
                    bestStreak: newBestStreak,
                    recordCount: newRecordCount,
                    totalCorrect: newTotalCorrect,
                    totalAnswered: newTotalAnswered,
                  },
                },
              },
            };
          }
        });
      },
      resetQuizProgress: (targetTrack) => {
        set((state) => {
          const prev = state.quizProgress || DEFAULT_QUIZ_PROGRESS;
          if (!targetTrack || targetTrack === 'sobrevivencia') {
            return {
              quizProgress: {
                ...prev,
                survival: { ...DEFAULT_QUIZ_PROGRESS.survival },
              },
            };
          } else {
            return {
              quizProgress: {
                ...prev,
                tracks: {
                  ...prev.tracks,
                  [targetTrack]: { ...DEFAULT_QUIZ_PROGRESS.tracks[targetTrack] },
                },
              },
            };
          }
        });
      },

      settings: DEFAULT_SETTINGS,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      history: [],
      addHistoryItem: ({ type, title, summary, details, rawPayload }) => {
        const newItem: HistoryItem = {
          id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          type,
          title,
          summary,
          details,
          isPinned: false,
          rawPayload,
        };

        set((state) => {
          // Keep pinned items and respect history limit
          const currentList = [newItem, ...state.history];
          const pinned = currentList.filter((item) => item.isPinned);
          const unpinned = currentList.filter((item) => !item.isPinned);
          
          const maxUnpinned = Math.max(0, state.settings.historyLimit - pinned.length);
          const limited = [...pinned, ...unpinned.slice(0, maxUnpinned)];
          // Sort by pinned first, then by timestamp desc
          limited.sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return b.timestamp - a.timestamp;
          });

          // Gamification: grant 25 XP for performing calculations with step-by-step
          const prevProf = state.profile || DEFAULT_PROFILE;
          const prevStats = prevProf.stats || DEFAULT_PROFILE.stats;
          const newStats = {
            ...prevStats,
            totalCalculations: (prevStats.totalCalculations || 0) + 1,
            totalBhaskara: (prevStats.totalBhaskara || 0) + (type === 'bhaskara' ? 1 : 0),
            totalRegraDeTres: (prevStats.totalRegraDeTres || 0) + (type.startsWith('regra') ? 1 : 0),
          };
          const newTotalXp = (prevProf.totalXp || 0) + 25;
          const candidateProfile: UserProfile = {
            ...prevProf,
            totalXp: newTotalXp,
            stats: newStats,
          };
          const newlyUnlocked = checkNewAchievements(candidateProfile);
          let bonusXp = 0;
          for (const achId of newlyUnlocked) {
            const def = ACHIEVEMENTS.find((a) => a.id === achId);
            if (def) bonusXp += def.xpReward;
          }

          const finalProfile: UserProfile = {
            ...candidateProfile,
            totalXp: newTotalXp + bonusXp,
            unlockedAchievements: [...new Set([...(prevProf.unlockedAchievements || []), ...newlyUnlocked])],
          };

          return {
            history: limited,
            profile: finalProfile,
          };
        });
      },

      removeHistoryItem: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),

      togglePinHistoryItem: (id) =>
        set((state) => ({
          history: state.history.map((item) =>
            item.id === id ? { ...item, isPinned: !item.isPinned } : item
          ),
        })),

      clearHistory: () => set({ history: [] }),

      importHistory: (items) => {
        const validation = validateHistorySchema(items);
        if (!validation.valid || !validation.data) return;

        set((state) => {
          const merged = [...validation.data!, ...state.history];
          // deduplicate by id
          const seen = new Set<string>();
          const unique = merged.filter((item) => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
          return { history: unique.slice(0, state.settings.historyLimit) };
        });
      },

      completeOnboarding: () =>
        set((state) => ({
          settings: { ...state.settings, hasCompletedOnboarding: true },
        })),
    }),
    {
      name: 'mathutils-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
