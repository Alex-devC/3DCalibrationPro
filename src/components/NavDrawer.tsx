import React from 'react';
import { Logo } from './Logo.tsx';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile } from '../types/index.ts';

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
  activePrinter: PrinterProfile;
  activeFilament: FilamentProfile;
}

export const NavDrawer: React.FC<NavDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  activePrinter,
  activeFilament,
}) => {
  const { t } = useI18n();

  const handleNav = (view: string) => {
    onSelectView(view);
    onClose();
  };

  return (
    <>
      {/* Drawer Scrim Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-[#070f19]/80 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] bg-surface-container-low shadow-2xl flex flex-col border-r border-surface-container-high transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Side Navigation"
      >
        {/* Drawer Header */}
        <div className="p-4 flex items-center justify-between border-b border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <div className="flex flex-col">
              <span className="font-headline text-[16px] font-bold uppercase text-on-surface">
                {t('app.shortName')}
              </span>
              <span className="font-mono text-[10px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                {t('app.offlineReady')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation drawer"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Navigation Link Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Group 1: Navigation */}
          <div className="space-y-1">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider px-2">
              {t('nav.navigation')}
            </span>
            <button
              type="button"
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-[14px] transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-primary">grid_view</span>
              {t('nav.dashboard')}
            </button>
          </div>

          {/* Group 2: Calibrations */}
          <div className="space-y-1">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider px-2">
              {t('nav.calibrations')}
            </span>
            <button
              type="button"
              onClick={() => handleNav('calibrate')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-[14px] transition-colors ${
                currentView === 'calibrate' || currentView === 'mvs-test'
                  ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">architecture</span>
              {t('nav.calibrate')}
            </button>
            <button
              type="button"
              onClick={() => handleNav('master')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-[14px] transition-colors ${
                currentView === 'master'
                  ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">tune</span>
              {t('nav.master')}
            </button>
          </div>

          {/* Group 3: Profiles */}
          <div className="space-y-1">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider px-2">
              {t('nav.profiles')}
            </span>
            <button
              type="button"
              onClick={() => handleNav('printers')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-medium text-[14px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-outline">print</span>
                <span className="truncate max-w-[130px]">{activePrinter.model}</span>
              </span>
              <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {t('common.active')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('filaments')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left font-medium text-[14px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-outline">grain</span>
                <span className="truncate max-w-[130px]">{activeFilament.name}</span>
              </span>
              <span className="font-mono text-[10px] text-outline">
                {activePrinter.nozzleDiameter.toFixed(1)}mm
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('slicers')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-[14px] text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-outline">data_object</span>
              {t('nav.slicers')} (Flash / Orca / Bambu)
            </button>
          </div>

          {/* Group 4: Logs & Data */}
          <div className="space-y-1">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider px-2">
              {t('nav.logsAndData')}
            </span>
            <button
              type="button"
              onClick={() => handleNav('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-[14px] transition-colors ${
                currentView === 'history'
                  ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-outline">history</span>
              {t('nav.history')}
            </button>
            <button
              type="button"
              onClick={() => handleNav('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-medium text-[14px] transition-colors ${
                currentView === 'settings'
                  ? 'bg-surface-container text-primary font-semibold border-l-2 border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px] text-outline">settings</span>
              {t('nav.settings')}
            </button>
          </div>
        </div>

        {/* Drawer Footer Ad / Sponsor Reserve */}
        <div className="p-4 border-t border-surface-container-high">
          <div className="h-12 w-full rounded bg-surface-container-high px-3 flex items-center justify-between font-mono text-[11px] text-outline">
            <span>AD RESERVE • BENCHMARK</span>
            <span className="text-primary font-mono text-[11px]">SPONSORED</span>
          </div>
        </div>
      </aside>
    </>
  );
};
