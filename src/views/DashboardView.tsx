import React from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile, SlicerProfile, CalibrationItem, CalibrationResult } from '../types/index.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface DashboardViewProps {
  activePrinter: PrinterProfile;
  activeFilament: FilamentProfile;
  activeSlicer: SlicerProfile;
  calibrationItems: CalibrationItem[];
  recentHistory: CalibrationResult[];
  onStartCalibration: () => void;
  onOpenTest: (testType: string) => void;
  onSwitchRig: () => void;
  onViewAllHistory: () => void;
  onViewMaster: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activePrinter,
  activeFilament,
  activeSlicer,
  calibrationItems,
  recentHistory,
  onStartCalibration,
  onOpenTest,
  onSwitchRig,
  onViewAllHistory,
  onViewMaster,
}) => {
  const { t } = useI18n();

  const calibratedCount = calibrationItems.filter((i) => i.status === 'CALIBRATED').length;
  const manualCount = calibrationItems.filter((i) => i.status === 'MANUALLY_DEFINED').length;
  const totalItems = calibrationItems.length || 6;
  const percentage = Math.round(((calibratedCount + manualCount) / totalItems) * 100);

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-3 pb-28">
      {/* Welcome & Tactical Status Header */}
      <section className="flex flex-col gap-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
              {t('dashboard.stationOnline')}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-mono text-[11px] border border-primary/20 shadow-sm">
            <span className="material-symbols-outlined text-[13px]">cloud_off</span>
            <span>{t('dashboard.stationOnline').includes('Local') ? '100% OFFLINE ACTIVE' : '100% OFFLINE ATIVO'}</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <h1 className="font-headline text-[24px] font-bold text-on-surface tracking-tight">
              {t('dashboard.welcome')}
            </h1>
            <p className="text-[13px] text-on-surface-variant">
              {t('dashboard.telemetryLoaded')}
            </p>
          </div>
          <span className="font-mono text-[11px] text-primary bg-surface-container px-2 py-1 rounded border border-primary/20">
            {t('app.synced')}
          </span>
        </div>
      </section>

      {/* High-Priority Context Card: Active Rig & Material Matrix */}
      <section className="rounded-xl bg-surface-container-low border border-surface-container-high shadow-md overflow-hidden flex flex-col">
        {/* Card Subheader */}
        <div className="bg-surface-container-high px-4 py-2.5 flex items-center justify-between border-b border-surface-container-highest">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">developer_board</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface font-semibold">
              {t('dashboard.benchMatrix')}
            </span>
          </div>
          <button
            type="button"
            aria-label="Quick Switch Rig"
            onClick={onSwitchRig}
            className="h-7 px-2.5 rounded bg-surface-container text-secondary hover:text-primary flex items-center gap-1 active:scale-95 transition-all font-mono text-[11px] border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            <span>{t('dashboard.switchRig')}</span>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3.5">
          {/* Slicer & Profile Identity */}
          <div className="flex items-center justify-between bg-surface-container px-3 py-2 rounded-lg border border-surface-container-high">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[18px]">layers</span>
              </div>
              <div className="min-w-0">
                <span className="font-mono text-[10px] text-on-surface-variant block uppercase">
                  {t('dashboard.activeSlicer')}
                </span>
                <span className="font-semibold text-[13px] text-on-surface truncate block">
                  {activeSlicer.name} {activeSlicer.version}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] uppercase border border-primary/20">
              {activeSlicer.badge}
            </span>
          </div>

          {/* Hardware & Material 2-Part Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Target Printer */}
            <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px] text-secondary">precision_manufacturing</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {t('dashboard.targetMachine')}
                </span>
              </div>
              <div className="font-semibold text-[15px] text-on-surface">
                {activePrinter.model}
              </div>
              <div className="flex flex-wrap gap-1 mt-1 font-mono text-[11px]">
                <span className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded">
                  {activePrinter.nozzleDiameter.toFixed(1)}mm {activePrinter.nozzleMaterial || 'Hardened Steel'}
                </span>
                <span className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded">
                  {activePrinter.buildVolumeX}×{activePrinter.buildVolumeY}×{activePrinter.buildVolumeZ} mm³
                </span>
              </div>
            </div>

            {/* Loaded Filament */}
            <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px] text-tertiary">spoke</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {t('dashboard.loadedFilament')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: activeFilament.colorHex }}
                />
                <span className="font-semibold text-[15px] text-on-surface truncate">
                  {activeFilament.name}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1 font-mono text-[11px]">
                <span className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded">
                  {activeFilament.diameter.toFixed(2)} mm
                </span>
                <span className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded">
                  N: {activeFilament.recommendedNozzleTempMin}-{activeFilament.recommendedNozzleTempMax}°C
                </span>
                <span className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded">
                  B: {activeFilament.recommendedBedTemp}°C
                </span>
              </div>
            </div>
          </div>

          {/* Master Profile Status & Progress Bar */}
          <div className="pt-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-on-surface truncate">
                Mestre: {activeFilament.name} ({activePrinter.nozzleDiameter.toFixed(1)}mm)
              </span>
              <button
                type="button"
                onClick={onViewMaster}
                className="text-primary font-semibold hover:underline"
              >
                {calibratedCount + manualCount} / {totalItems} ({percentage}%)
              </button>
            </div>

            {/* Segmented Calibration Bar */}
            <div className="w-full h-2.5 rounded bg-surface-container flex gap-1 p-0.5 overflow-hidden border border-surface-container-high">
              {calibrationItems.map((item) => (
                <div
                  key={item.id}
                  className={`h-full rounded-sm flex-1 transition-colors ${
                    item.status === 'CALIBRATED'
                      ? 'bg-primary'
                      : item.status === 'MANUALLY_DEFINED'
                      ? 'bg-secondary-container'
                      : 'bg-surface-container-high'
                  }`}
                  title={`${item.code}: ${item.status}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
              <span>Flow, MVS, Temp, Retract: Locked</span>
              <span className="text-secondary">PA: Tuning • Fan: Pending</span>
            </div>
          </div>
        </div>
      </section>

      {/* Big Tactical Primary CTA (52px minimum height) */}
      <div>
        <button
          type="button"
          onClick={onStartCalibration}
          className="w-full h-[52px] min-h-[52px] rounded-lg bg-primary-container hover:bg-primary text-on-primary-container font-headline font-bold text-[15px] flex items-center justify-center gap-2.5 uppercase tracking-wider transition-all duration-150 active:scale-[0.98] shadow-[0_0_16px_rgba(0,180,216,0.35)] select-none"
        >
          <span className="material-symbols-outlined text-[24px]">add_circle</span>
          <span>{t('dashboard.startNewCalibration')}</span>
        </button>
      </div>

      {/* Quick Statistics Grid (2x2) */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
            {t('dashboard.workbenchTotals')}
          </span>
          <span className="font-mono text-[10px] text-primary">
            {t('dashboard.dbCached')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Tests */}
          <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex flex-col justify-between min-h-[84px] shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase">
                {t('dashboard.totalTests')}
              </span>
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            </div>
            <div>
              <div className="font-mono text-[24px] font-bold text-on-surface leading-none">28</div>
              <div className="font-mono text-[11px] text-on-surface-variant mt-1">
                {t('dashboard.testsCompleted')}
              </div>
            </div>
          </div>

          {/* Machines */}
          <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex flex-col justify-between min-h-[84px] shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase">
                {t('dashboard.machines')}
              </span>
              <span className="material-symbols-outlined text-secondary text-[18px]">print</span>
            </div>
            <div>
              <div className="font-mono text-[24px] font-bold text-on-surface leading-none">03</div>
              <div className="font-mono text-[11px] text-on-surface-variant mt-1">
                {t('dashboard.activeUnits')}
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex flex-col justify-between min-h-[84px] shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase">
                {t('dashboard.materials')}
              </span>
              <span className="material-symbols-outlined text-tertiary text-[18px]">grain</span>
            </div>
            <div>
              <div className="font-mono text-[24px] font-bold text-on-surface leading-none">08</div>
              <div className="font-mono text-[11px] text-on-surface-variant mt-1">
                {t('dashboard.spoolProfiles')}
              </div>
            </div>
          </div>

          {/* Master Sets */}
          <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex flex-col justify-between min-h-[84px] shadow-sm">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-mono text-[10px] uppercase">
                {t('dashboard.masterSets')}
              </span>
              <span className="material-symbols-outlined text-primary text-[18px]">folder_special</span>
            </div>
            <div>
              <div className="font-mono text-[24px] font-bold text-on-surface leading-none">05</div>
              <div className="font-mono text-[11px] text-on-surface-variant mt-1">
                {t('dashboard.compiledProfiles')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calibration Quick Access & Calibration Statuses */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              {t('dashboard.testRegistryTitle')}
            </span>
          </div>
          <span className="font-mono text-[10px] text-outline">
            {t('dashboard.touchToRetest')}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {calibrationItems.map((item) => {
            const isMVS = item.type === 'MVS';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenTest(item.type)}
                className="w-full text-left p-3 min-h-[64px] rounded-lg bg-surface-container hover:bg-surface-container-high active:scale-[0.99] transition-all flex items-center justify-between gap-3 shadow-sm border border-surface-container-high"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {item.type === 'MVS'
                        ? 'speed'
                        : item.type === 'FLOW_RATE'
                        ? 'water_drop'
                        : item.type === 'TEMP_TOWER'
                        ? 'thermostat'
                        : item.type === 'RETRACTION'
                        ? 'unfold_less'
                        : item.type === 'PRESSURE_ADVANCE'
                        ? 'timeline'
                        : 'mode_fan'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold text-[13px] text-on-surface block truncate">
                      {t(item.titleKey)}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-[16px] font-bold text-primary">
                      {item.value !== null ? item.value : '--'}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {item.unit}
                    </span>
                  </div>

                  {item.status === 'CALIBRATED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 font-mono text-[10px] uppercase flex items-center gap-1 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {t('calibrate.calibrated')}
                    </span>
                  ) : item.status === 'MANUALLY_DEFINED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 font-mono text-[10px] uppercase flex items-center gap-1 border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      {t('calibrate.manualTuningRequired')}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-mono text-[10px] uppercase flex items-center gap-1 border border-outline-variant/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                      {t('calibrate.uncalibrated')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Calibrations Telemetry Feed */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">history</span>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              {t('dashboard.auditLogStream')}
            </span>
          </div>
          <button
            type="button"
            onClick={onViewAllHistory}
            className="font-mono text-[11px] text-primary hover:underline"
          >
            {t('dashboard.viewAll', { count: recentHistory.length })}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {recentHistory.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-surface-container border border-surface-container-high flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                <div className="min-w-0">
                  <span className="font-medium text-[13px] text-on-surface block truncate">
                    {item.testName}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    {item.timestamp}
                  </span>
                </div>
              </div>
              <div className="font-mono text-[14px] text-primary font-bold shrink-0 pl-2">
                {item.calculatedValue} <span className="text-[10px] text-on-surface-variant font-normal">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Workshop Snapshot Card with Image */}
      <section className="rounded-xl bg-surface-container border border-surface-container-high p-4 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[18px]">photo_camera</span>
            <span className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
              {t('dashboard.opticalBench')}
            </span>
          </div>
          <span className="font-mono text-[10px] text-outline">
            {t('dashboard.macroMetrology')}
          </span>
        </div>

        <div className="relative w-full h-36 rounded-lg overflow-hidden bg-surface-container-high border border-surface-container-highest">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFiVTwwa3CGNIQ74qqs9bJA11LMm6vSILs3T0oY8wgeCVQJP91SbAoqUguRzbz58d5hOQ5kUVnY4Nl5SXIQFp1tU3jjJxK3GSWN5GM3IXK5rF6j5WOYCcPleX9pkRiWWaLLx8bUi5T6Bc0NcXZUIC_pAL87ScaJZenViO1uOa8xVgvagg5psC_qoCYvkSfuP7GBjjSNxP9y23YRqdcgq_-61-Nan2aOotj2Ja0fhheF4x4zyljr66G"
            alt="Optical metrology inspection bench calibration specimen"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/20 to-transparent flex items-end p-3">
            <div className="flex items-center justify-between w-full">
              <span className="font-mono text-[11px] text-on-surface font-semibold">
                AD5X_PETG_FLW096_VALIDATION.RAW
              </span>
              <span className="font-mono text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded border border-primary/30 font-bold">
                0.02mm Tol
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Discreet Monitized Ad Banner (Interactive specification card) */}
      <AdBanner variant="interactive" />

      {/* Reserve ad banner slot at bottom */}
      <AdBanner variant="reserve" />
    </div>
  );
};
