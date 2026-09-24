import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile, SlicerProfile, CalibrationItem, SlicerId } from '../types/index.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface CalibrateWorkflowViewProps {
  slicers: SlicerProfile[];
  activeSlicer: SlicerProfile;
  onSelectSlicer: (id: SlicerId) => void;
  printers: PrinterProfile[];
  activePrinter: PrinterProfile;
  onSelectPrinter: (id: string) => void;
  onAddNewPrinter: () => void;
  filaments: FilamentProfile[];
  activeFilament: FilamentProfile;
  onSelectFilament: (id: string) => void;
  onAddNewFilament: () => void;
  calibrationItems: CalibrationItem[];
  onOpenTest: (type: string) => void;
  onViewMasterProfile: () => void;
}

export const CalibrateWorkflowView: React.FC<CalibrateWorkflowViewProps> = ({
  slicers,
  activeSlicer,
  onSelectSlicer,
  activePrinter,
  onAddNewPrinter,
  activeFilament,
  onAddNewFilament,
  calibrationItems,
  onOpenTest,
  onViewMasterProfile,
}) => {
  const { t } = useI18n();
  const [assembling, setAssembling] = useState(false);

  const calibratedCount = calibrationItems.filter((i) => i.status === 'CALIBRATED').length;
  const manualCount = calibrationItems.filter((i) => i.status === 'MANUALLY_DEFINED').length;
  const readyCount = calibratedCount + manualCount;
  const totalCount = calibrationItems.length || 6;
  const readyPercent = Math.round((readyCount / totalCount) * 100);

  const handleAssembleMaster = () => {
    setAssembling(true);
    setTimeout(() => {
      setAssembling(false);
      onViewMasterProfile();
    }, 800);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      {/* Progress Stepper Header */}
      <section className="rounded-xl p-3.5 bg-surface-container-low border border-surface-container-high shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-primary font-semibold">
              {t('calibrate.workflowActive')}
            </span>
          </div>
          <span className="font-mono text-[13px] font-bold text-primary">
            {t('calibrate.stepIndicator')}
          </span>
        </div>

        {/* Stepper Interactive Indicator Bar */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => scrollToSection('step-slicer')}
            className="flex flex-col gap-1 text-left group focus:outline-none"
          >
            <div className="h-1.5 w-full rounded bg-primary"></div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="font-mono text-[10px] uppercase text-primary truncate">
                {t('calibrate.step1')}
              </span>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => scrollToSection('step-printer')}
            className="flex flex-col gap-1 text-left group focus:outline-none"
          >
            <div className="h-1.5 w-full rounded bg-primary"></div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="font-mono text-[10px] uppercase text-primary truncate">
                {t('calibrate.step2')}
              </span>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => scrollToSection('step-filament')}
            className="flex flex-col gap-1 text-left group focus:outline-none"
          >
            <div className="h-1.5 w-full rounded bg-primary"></div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
              <span className="font-mono text-[10px] uppercase text-primary truncate">
                {t('calibrate.step3')}
              </span>
            </div>
          </button>

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => scrollToSection('step-tests')}
            className="flex flex-col gap-1 text-left group focus:outline-none"
          >
            <div className="h-1.5 w-full rounded bg-primary-container shadow-[0_0_8px_rgba(0,180,216,0.5)]"></div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary animate-spin">
                tune
              </span>
              <span className="font-mono text-[10px] uppercase text-on-surface font-semibold truncate">
                {t('calibrate.step4')}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* STEP 1: Slicer Selection */}
      <section id="step-slicer" className="rounded-xl bg-surface-container border border-surface-container-high p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-primary font-semibold">// STEP 01</span>
            <span className="font-semibold text-[14px] text-on-surface">
              {t('calibrate.step01Title')}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] border border-primary/20">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
            {t('calibrate.locked')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {slicers.map((s) => {
            const isSelected = activeSlicer.id === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSlicer(s.id)}
                className={`p-2.5 rounded-lg flex items-center justify-between text-left min-w-0 transition-all border ${
                  isSelected
                    ? 'bg-surface-container-highest border-primary/50 shadow-sm relative overflow-hidden'
                    : 'bg-surface-container-low hover:bg-surface-container-high border-surface-container-high'
                }`}
              >
                {isSelected && <div className="absolute inset-x-0 top-0 h-0.5 bg-primary"></div>}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container text-outline'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-[13px] truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                      {s.name}
                    </p>
                    <p className="font-mono text-[10px] text-on-surface-variant truncate">
                      {s.version}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 2: Printer Selection */}
      <section id="step-printer" className="rounded-xl bg-surface-container border border-surface-container-high p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-primary font-semibold">// STEP 02</span>
            <span className="font-semibold text-[14px] text-on-surface">
              {t('calibrate.step02Title')}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] border border-primary/20">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              link
            </span>
            {t('calibrate.linked')}
          </span>
        </div>

        {/* Selected Printer Card */}
        <div className="p-3 rounded-lg bg-surface-container-highest border border-surface-container-high flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">precision_manufacturing</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-[15px] text-on-surface">{activePrinter.model}</h3>
                  <span className="px-1.5 py-0.2 rounded bg-surface-container text-primary font-mono text-[10px]">
                    {activePrinter.kinematics || 'CORE-XY'}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-outline">
                  {activePrinter.firmware} • {activePrinter.mcuSerial || 'MCU #729A'}
                </p>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(76,214,251,0.6)]"></span>
          </div>

          {/* Telemetry Spec Chips */}
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded bg-surface-container-high flex flex-col border border-surface-container-highest">
              <span className="text-[9px] text-outline uppercase">NOZZLE APERTURE</span>
              <span className="text-[14px] font-bold text-on-surface mt-0.5">
                {activePrinter.nozzleDiameter.toFixed(2)} <span className="text-[10px] text-secondary">mm</span>
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container-high flex flex-col border border-surface-container-highest">
              <span className="text-[9px] text-outline uppercase">BUILD VOLUME</span>
              <span className="text-[14px] font-bold text-on-surface mt-0.5">
                {activePrinter.buildVolumeX}³ <span className="text-[10px] text-secondary">mm</span>
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container-high flex flex-col border border-surface-container-highest">
              <span className="text-[9px] text-outline uppercase">FIRMWARE OS</span>
              <span className="text-[14px] font-bold text-primary mt-0.5 truncate">
                v1.2.8 <span className="text-[10px] text-secondary">KLP</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onAddNewPrinter}
              className="h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-secondary font-semibold text-[13px] flex items-center justify-center gap-1 active:scale-[0.98] transition-transform border border-outline-variant/30 flex-1"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>{t('calibrate.addNew')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* STEP 3: Filament Selection */}
      <section id="step-filament" className="rounded-xl bg-surface-container border border-surface-container-high p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-primary font-semibold">// STEP 03</span>
            <span className="font-semibold text-[14px] text-on-surface">
              {t('calibrate.step03Title')}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] border border-primary/20">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
            {t('calibrate.profileActive')}
          </span>
        </div>

        {/* Selected Filament Details */}
        <div className="p-3 rounded-lg bg-surface-container-highest border border-surface-container-high flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${activeFilament.colorHex}22`, color: activeFilament.colorHex }}
              >
                <span className="material-symbols-outlined text-[22px]">grain</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[15px] text-on-surface">{activeFilament.name}</h3>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary font-mono text-[10px]">
                    {activeFilament.subType || activeFilament.material}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-outline">
                  {activeFilament.colorName} • Batch Lot {activeFilament.batchLot || '#MP-2024'}
                </p>
              </div>
            </div>
            <div
              className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(123,208,255,0.7)]"
              style={{ backgroundColor: activeFilament.colorHex }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded bg-surface-container-high flex flex-col border border-surface-container-highest">
              <span className="text-[9px] text-outline uppercase">DIAMETER</span>
              <span className="text-[14px] font-bold text-on-surface mt-0.5">
                {activeFilament.diameter.toFixed(2)} <span className="text-[10px] text-outline">mm</span>
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container-high flex flex-col border border-surface-container-highest">
              <span className="text-[9px] text-outline uppercase">HOTEND BAND</span>
              <span className="text-[14px] font-bold text-secondary mt-0.5">
                {activeFilament.recommendedNozzleTempMin}-{activeFilament.recommendedNozzleTempMax} <span className="text-[10px] text-outline">°C</span>
              </span>
            </div>
            <div className="p-2 rounded bg-surface-container-high flex flex-col border border-surface-container-highest">
              <span className="text-[9px] text-outline uppercase">BED SURFACE</span>
              <span className="text-[14px] font-bold text-on-surface mt-0.5">
                {activeFilament.recommendedBedTemp} <span className="text-[10px] text-outline">°C</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onAddNewFilament}
              className="h-10 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container text-secondary font-semibold text-[13px] flex items-center justify-center gap-1 active:scale-[0.98] transition-transform border border-outline-variant/30 flex-1"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>{t('calibrate.registerFilament')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* STEP 4: Calibration Tests Matrix */}
      <section id="step-tests" className="rounded-xl bg-surface-container border border-surface-container-high p-4 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[11px] text-primary font-semibold block">
              // STEP 04 • ACTIVE BENCHMARK
            </span>
            <h2 className="font-headline text-[18px] font-bold text-on-surface">
              {t('calibrate.step04Title')}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-highest border border-surface-container-high font-mono text-[11px]">
            <span className="text-primary font-bold">{readyCount} / {totalCount}</span>
            <span className="text-outline uppercase">{t('calibrate.benched')}</span>
          </div>
        </div>

        {/* 6 Calibration Cards in Execution Matrix */}
        <div className="flex flex-col gap-3">
          {calibrationItems.map((test) => {
            const isCalibrated = test.status === 'CALIBRATED';
            const isManual = test.status === 'MANUALLY_DEFINED';
            const isUncalibrated = test.status === 'NOT_CALIBRATED';

            return (
              <article
                key={test.id}
                className={`p-3.5 rounded-xl bg-surface-container-highest border border-surface-container-high shadow-sm flex flex-col gap-2 relative overflow-hidden transition-all ${
                  isManual ? 'border-l-4 border-l-secondary-container' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        {test.type === 'MVS'
                          ? 'speed'
                          : test.type === 'FLOW_RATE'
                          ? 'square_foot'
                          : test.type === 'TEMP_TOWER'
                          ? 'thermostat'
                          : test.type === 'RETRACTION'
                          ? 'unfold_less'
                          : test.type === 'PRESSURE_ADVANCE'
                          ? 'linear_scale'
                          : 'mode_fan'}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-outline uppercase tracking-wider block">
                        {test.code} // {test.category}
                      </span>
                      <h4 className="font-semibold text-[14px] text-on-surface">
                        {t(test.titleKey)}
                      </h4>
                    </div>
                  </div>

                  {/* Status chip */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low font-mono text-[11px] shrink-0 border border-outline-variant/30">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCalibrated
                          ? 'bg-primary'
                          : isManual
                          ? 'bg-secondary'
                          : 'bg-outline'
                      }`}
                    />
                    <span className={isCalibrated ? 'text-primary font-bold' : isManual ? 'text-secondary font-bold' : 'text-outline'}>
                      {test.value !== null ? `${test.value} ${test.unit}` : t('calibrate.notSet')}
                    </span>
                  </span>
                </div>

                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  {t(test.descKey)}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/60">
                  <div className="flex items-center gap-1 font-mono text-[10px] uppercase">
                    {isCalibrated ? (
                      <span className="flex items-center gap-1 text-primary">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        {t('calibrate.calibratedAndValidated')}
                      </span>
                    ) : isManual ? (
                      <span className="flex items-center gap-1 text-secondary">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                        {t('calibrate.manualTuningRequired')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-outline">
                        <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>
                        {t('calibrate.uncalibrated')}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenTest(test.type)}
                    className={`h-11 min-h-[44px] px-3.5 rounded-lg font-semibold text-[13px] flex items-center gap-1.5 active:scale-95 transition-transform ${
                      isCalibrated
                        ? 'bg-surface-container hover:bg-surface-container-high text-primary border border-primary/20'
                        : isManual
                        ? 'bg-secondary text-on-secondary shadow-md'
                        : 'bg-surface-container-high hover:bg-surface-bright text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isCalibrated ? 'tune' : isManual ? 'play_arrow' : 'play_circle'}
                    </span>
                    <span>
                      {isCalibrated
                        ? t('calibrate.recalibrateEdit')
                        : isManual
                        ? t('calibrate.calibrateNow')
                        : t('calibrate.startTest')}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Sticky Bottom Call to Action Dock */}
      <div className="fixed bottom-16 left-0 right-0 z-30 p-3 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container-high shadow-2xl">
        <div className="max-w-2xl mx-auto flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface">
              <span className="material-symbols-outlined text-primary text-[16px]">verified</span>
              <span>{activePrinter.model} • {activeFilament.name}</span>
            </div>
            <span className="font-mono text-[11px] text-primary font-bold">
              {readyPercent}% READY
            </span>
          </div>

          <button
            type="button"
            onClick={handleAssembleMaster}
            disabled={assembling}
            className="w-full h-13 min-h-[52px] rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-headline font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg select-none"
          >
            {assembling ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
                <span>{t('calibrate.compilingDirectives')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">output</span>
                <span>{t('calibrate.viewAssembledMaster', { count: readyCount })}</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Ad Reserve */}
      <AdBanner variant="reserve" className="mt-4" />
    </div>
  );
};
