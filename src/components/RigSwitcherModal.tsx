import React from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile, SlicerProfile, SlicerId } from '../types/index.ts';

interface RigSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  printers: PrinterProfile[];
  activePrinter: PrinterProfile;
  onSelectPrinter: (id: string) => void;
  filaments: FilamentProfile[];
  activeFilament: FilamentProfile;
  onSelectFilament: (id: string) => void;
  slicers: SlicerProfile[];
  activeSlicer: SlicerProfile;
  onSelectSlicer: (id: SlicerId) => void;
}

export const RigSwitcherModal: React.FC<RigSwitcherModalProps> = ({
  isOpen,
  onClose,
  printers,
  activePrinter,
  onSelectPrinter,
  filaments,
  activeFilament,
  onSelectFilament,
  slicers,
  activeSlicer,
  onSelectSlicer,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-4 space-y-4 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-primary">swap_horiz</span>
            <div>
              <h3 className="font-headline text-[17px] font-bold text-on-surface">
                {t('dashboard.switchRig')}
              </h3>
              <p className="font-mono text-[11px] text-outline">
                {t('dashboard.benchMatrix')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Slicer Section */}
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] text-outline uppercase tracking-wider block">
            SLICER ENGINE
          </span>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[12px]">
            {slicers.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSlicer(s.id)}
                className={`p-2 rounded-lg text-left border flex items-center justify-between ${
                  activeSlicer.id === s.id
                    ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-highest border-surface-container-highest'
                }`}
              >
                <span className="truncate">{s.name}</span>
                {activeSlicer.id === s.id && (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Machine Section */}
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] text-outline uppercase tracking-wider block">
            TARGET MACHINE
          </span>
          <div className="space-y-1.5">
            {printers.map((p) => {
              const isSelected = activePrinter.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPrinter(p.id)}
                  className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-highest border-surface-container-highest'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[13px]">{p.model}</div>
                      <div className="font-mono text-[10px] text-on-surface-variant truncate">
                        {p.nozzleDiameter.toFixed(1)}mm • {p.kinematics}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Spool Section */}
        <div className="space-y-1.5">
          <span className="font-mono text-[11px] text-outline uppercase tracking-wider block">
            LOADED SPOOL
          </span>
          <div className="space-y-1.5">
            {filaments.map((f) => {
              const isSelected = activeFilament.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFilament(f.id)}
                  className={`w-full p-2.5 rounded-lg text-left flex items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-highest border-surface-container-highest'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: f.colorHex }}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[13px]">{f.name}</div>
                      <div className="font-mono text-[10px] text-on-surface-variant truncate">
                        {f.colorName} • {f.material} (N: {f.recommendedNozzleTempMin}-{f.recommendedNozzleTempMax}°C)
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-lg bg-surface-container text-on-surface font-semibold text-[13px] flex items-center justify-center active:scale-95 transition-all"
        >
          {t('common.done')}
        </button>
      </div>
    </div>
  );
};
