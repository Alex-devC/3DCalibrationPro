import React from 'react';
import { Logo } from './Logo.tsx';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile } from '../types/index.ts';

interface HeaderProps {
  currentPathName: string;
  activePrinter: PrinterProfile;
  activeFilament: FilamentProfile;
  onOpenDrawer: () => void;
  onOpenRigSwitcher: () => void;
  onStartCalibration: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPathName,
  activePrinter,
  activeFilament,
  onOpenDrawer,
  onOpenRigSwitcher,
  onStartCalibration,
  onOpenSettings,
}) => {
  const { t } = useI18n();

  const printerShort = activePrinter.model.replace('Flashforge ', '').replace('Bambu Lab ', '');
  const filamentShort = activeFilament.material;
  const nozzleStr = `${activePrinter.nozzleDiameter.toFixed(1)}mm`;

  return (
    <header className="fixed top-0 w-full z-40 bg-[#0c141f]/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="h-20 px-4 flex items-center justify-between gap-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Hamburger Drawer Button */}
          <button
            aria-label="Open Navigation Menu"
            type="button"
            onClick={onOpenDrawer}
            className="w-12 h-12 rounded-lg flex items-center justify-center text-primary hover:bg-surface-container active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[26px]">menu</span>
          </button>

          {/* Logo & Identity */}
          <div className="flex items-center gap-2.5">
            <Logo size={32} />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline text-[17px] font-bold uppercase tracking-tight text-on-surface">
                  3D CALIBRATION PRO
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[10px] border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  {t('app.offlineReady')}
                </span>
              </div>

              {/* Active Rig Selector Pill & Current Section */}
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={onOpenRigSwitcher}
                  title="Switch Active Printer and Filament Rig"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high text-secondary hover:text-primary hover:bg-surface-container-highest transition-colors font-mono text-[11px] border border-outline-variant/40"
                >
                  <span className="material-symbols-outlined text-[13px]">precision_manufacturing</span>
                  <span className="truncate max-w-[170px] sm:max-w-[220px]">
                    {printerShort} • {filamentShort} ({nozzleStr})
                  </span>
                  <span className="material-symbols-outlined text-[13px]">arrow_drop_down</span>
                </button>
                <span className="font-mono text-[11px] text-outline truncate hidden xs:inline">
                  // {currentPathName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartCalibration}
            className="h-10 px-3.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-semibold text-[13px] flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,180,216,0.3)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden xs:inline">+ Calibrate</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings and Operator profile"
            className="w-10 h-10 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary flex items-center justify-center border border-outline-variant/40 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};
