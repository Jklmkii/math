import React from 'react';
import {
  Sigma,
  Scale,
  Brain,
  History,
  Settings,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { useAppStore, type ActiveTab } from '../../store/useAppStore';
import { useTranslation } from '../../core/i18n/translations';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  const { activeTab, setActiveTab, settings, updateSettings, history } = useAppStore();
  const t = useTranslation(settings.language || 'pt');

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'bhaskara', label: t.nav_bhaskara, icon: <Sigma size={20} /> },
    { id: 'regra_simples', label: t.nav_regra, icon: <Scale size={20} /> },
    { id: 'quiz', label: t.nav_treino, icon: <Brain size={20} /> },
    {
      id: 'history',
      label: t.nav_historico,
      icon: <History size={20} />,
      badge: history.length > 0 ? history.length : undefined,
    },
  ];

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const nextIndex = (modes.indexOf(settings.theme) + 1) % modes.length;
    updateSettings({ theme: modes[nextIndex] });
  };

  return (
    <>
      {/* Top Header Bar (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-safe">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sigma size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                MathUtils
              </h1>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {t.app_subtitle}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            {tabs.map((tab) => {
              const isActive =
                activeTab === tab.id ||
                (tab.id === 'regra_simples' && activeTab === 'regra_composta');
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all touch-target ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions (Theme & Settings) */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={cycleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
              title={`Tema: ${settings.theme} (clique para alternar)`}
              aria-label="Alternar tema visual"
            >
              {settings.theme === 'light' && <Sun size={18} />}
              {settings.theme === 'dark' && <Moon size={18} />}
              {settings.theme === 'system' && <Laptop size={18} />}
            </button>

            {/* Settings Modal Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
              title="Configurações do aplicativo"
              aria-label="Configurações"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg pb-safe">
        <nav className="flex items-center justify-around px-2 py-1">
          {tabs.map((tab) => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'regra_simples' && activeTab === 'regra_composta');
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl touch-target transition-colors relative ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 text-[9px] rounded-full bg-indigo-600 text-white font-bold leading-tight">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-1">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
