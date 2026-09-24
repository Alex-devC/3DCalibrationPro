import React from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { SlicerProfile, SlicerId } from '../types/index.ts';
import { slicerAdaptersMap } from '../slicers/adapters.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface SlicersManagerViewProps {
  slicers: SlicerProfile[];
  activeSlicer: SlicerProfile;
  onSelectSlicer: (id: SlicerId) => void;
}

export const SlicersManagerView: React.FC<SlicersManagerViewProps> = ({
  slicers,
  activeSlicer,
  onSelectSlicer,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      <div className="pt-1">
        <span className="font-mono text-[11px] text-primary uppercase font-semibold block">
          // SLICER TRANSLATION ENGINES
        </span>
        <h1 className="font-headline text-[22px] font-bold text-on-surface">
          {t('nav.slicers')}
        </h1>
      </div>

      <p className="text-[13px] text-on-surface-variant leading-relaxed">
        {t('slicers.architectureDesc')}
      </p>

      {/* Slicers List */}
      <div className="space-y-3">
        {slicers.map((slicer) => {
          const isSelected = activeSlicer.id === slicer.id;
          const adapter = slicerAdaptersMap[slicer.id] || slicerAdaptersMap['flash-studio'];

          return (
            <div
              key={slicer.id}
              className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                isSelected
                  ? 'bg-surface-container-high border-primary/60 shadow-md ring-1 ring-primary/40'
                  : 'bg-surface-container hover:bg-surface-container-high border-surface-container-high'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">{slicer.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[15px] text-on-surface">{slicer.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] font-bold">
                        {slicer.badge}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-on-surface-variant">
                      {slicer.version} • Extension: {slicer.fileExtension}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectSlicer(slicer.id)}
                  className={`h-9 px-3 rounded-lg font-mono text-[12px] flex items-center gap-1 active:scale-95 transition-all ${
                    isSelected
                      ? 'bg-primary text-on-primary font-bold shadow-sm'
                      : 'bg-surface-container-highest text-secondary hover:text-on-surface'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>ACTIVE</span>
                    </>
                  ) : (
                    <span>SET ACTIVE</span>
                  )}
                </button>
              </div>

              <p className="text-[12px] text-on-surface-variant">
                {slicer.notes}
              </p>

              {/* Parameter Mapping Breakdown */}
              <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high space-y-2">
                <span className="font-mono text-[10px] text-outline uppercase tracking-wider block">
                  ADAPTER MAPPING MATRIX:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  {Object.values(adapter.mappings).map((mapping) => (
                    <div
                      key={mapping.parameterId}
                      className="p-2 rounded bg-surface-container border border-surface-container-high flex flex-col gap-0.5"
                    >
                      <div className="flex items-center justify-between text-on-surface font-semibold text-[11px]">
                        <span>{mapping.label}</span>
                        {mapping.supportedInGui ? (
                          <span className="text-emerald-400 text-[9px] bg-emerald-950/40 px-1 rounded">NATIVE GUI</span>
                        ) : (
                          <span className="text-amber-400 text-[9px] bg-amber-950/40 px-1 rounded">G-CODE INJECT</span>
                        )}
                      </div>
                      <span className="text-[10px] text-outline truncate">{mapping.uiLocation}</span>
                      {mapping.fallbackInstruction && (
                        <span className="text-[10px] text-primary">{mapping.fallbackInstruction}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Ad Reserve */}
      <AdBanner variant="reserve" className="mt-4" />
    </div>
  );
};
