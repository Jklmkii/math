import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, CalculationType, HistoryItem } from '../types';

export type ActiveTab = 'bhaskara' | 'regra_simples' | 'regra_composta' | 'quiz' | 'history' | 'settings';

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

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

  // Onboarding
  completeOnboarding: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
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

          return { history: limited };
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
        if (!Array.isArray(items)) return;
        set((state) => {
          const merged = [...items, ...state.history];
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
