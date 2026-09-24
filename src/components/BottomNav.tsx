import React from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';

interface BottomNavProps {
  currentView: string;
  onSelectView: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onSelectView }) => {
  const { t } = useI18n();

  const items = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: 'grid_view' },
    { id: 'calibrate', label: t('nav.calibrate'), icon: 'adjust' },
    { id: 'master', label: t('nav.master'), icon: 'layers' },
    { id: 'history', label: t('nav.history'), icon: 'checklist' },
    { id: 'settings', label: t('nav.settings'), icon: 'settings' },
  ];

  return (
    <nav
      className="fixed bottom-0 w-full z-40 bg-[#0c141f]/95 backdrop-blur-xl border-t border-surface-container-high/80 shadow-[0_-1px_12px_rgba(0,0,0,0.5)]"
      aria-label="Bottom Navigation"
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {items.map((item) => {
          const isActive =
            currentView === item.id ||
            (item.id === 'calibrate' && currentView === 'mvs-test');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center w-16 h-14 min-h-[52px] rounded-lg transition-all active:scale-95 ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-mono text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
