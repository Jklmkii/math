import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Navbar } from './presentation/components/Navbar';
import { BhaskaraModule } from './presentation/modules/BhaskaraModule';
import { RegraDeTresModule } from './presentation/modules/RegraDeTresModule';
import { HistoryModule } from './presentation/modules/HistoryModule';
import { QuizModule } from './presentation/modules/QuizModule';
import { SettingsModal } from './presentation/components/SettingsModal';
import { OnboardingModal } from './presentation/components/OnboardingModal';

export function App() {
  const { activeTab, settings } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync theme with DOM root
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Navigation Bar */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-6 md:pt-8">
        {activeTab === 'bhaskara' && <BhaskaraModule />}
        {(activeTab === 'regra_simples' || activeTab === 'regra_composta') && (
          <RegraDeTresModule />
        )}
        {activeTab === 'quiz' && <QuizModule />}
        {activeTab === 'history' && <HistoryModule />}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <OnboardingModal />
    </div>
  );
}

export default App;
