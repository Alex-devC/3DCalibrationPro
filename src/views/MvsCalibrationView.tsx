import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile, SlicerProfile, MasterProfile } from '../types/index.ts';
import { calculateMVS, MVSOutput } from '../calibration/mvs.ts';
import { db } from '../data/storage.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface MvsCalibrationViewProps {
  activePrinter: PrinterProfile;
  activeFilament: FilamentProfile;
  activeSlicer: SlicerProfile;
  onBackToWorkflow: () => void;
  onSavedToMaster: () => void;
}

export const MvsCalibrationView: React.FC<MvsCalibrationViewProps> = ({
  activePrinter,
  activeFilament,
  activeSlicer,
  onBackToWorkflow,
  onSavedToMaster,
}) => {
  const { t } = useI18n();

  // Deterministic calculation inputs
  const [startSpeed, setStartSpeed] = useState<number>(5.0);
  const [endSpeed, setEndSpeed] = useState<number>(20.0);
  const [step, setStep] = useState<number>(0.50);
  const [measuredHeight, setMeasuredHeight] = useState<number>(15.0);
  const [notes, setNotes] = useState<string>(
    'Extruder gear clicking started right at 15.2mm. Flawless layer bonding and gloss maintained up to 14.8mm. Test run at 245°C with 0.4mm hardened steel nozzle.'
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB7lmzOVcszvhGRn0mbr6Sya1crvalFh09vKHlJLWCD2Ezi2_jzXeBZdzt6zCCj1rQNJ6zzUg7OGOdEsCpiK7XDvPNSn6cOULsXP5euwgcEa6GjD8gbF3LS9X3-9RquLCo52qk9diCP12KHAKTSvrl1ssjmQgxrkcBoy_XLeS_Op4LLouGitBRguhUMv0dHR7Zfa2nQzxF2fZ1ua0SwKAyXHfT09NdMwTFTCtoD0Iw7hLM94WrEIdi3'
  );

  // Result state
  const [result, setResult] = useState<MVSOutput>(() =>
    calculateMVS({ startSpeed: 5.0, endSpeed: 20.0, step: 0.50, measuredHeight: 15.0 })
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Recalculate whenever inputs change
  useEffect(() => {
    const res = calculateMVS({
      startSpeed,
      endSpeed,
      step,
      measuredHeight,
    });
    setResult(res);
  }, [startSpeed, endSpeed, step, measuredHeight]);

  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number,
    min: number,
    max: number,
    precision = 1
  ) => {
    setter((prev) => {
      const next = Math.max(min, Math.min(max, prev + delta));
      return Number(next.toFixed(precision));
    });
  };

  const handleReset = () => {
    setStartSpeed(5.0);
    setEndSpeed(20.0);
    setStep(0.50);
    setMeasuredHeight(15.0);
    showToast(t('tests.mvs.resetTest'));
  };

  const handleCopyResult = () => {
    const copyText = `${result.calculatedValue} mm³/s`;
    navigator.clipboard?.writeText(copyText);
    showToast(t('tests.mvs.reportCopied'));
  };

  const handleExportReport = () => {
    const report = `3D CALIBRATION PRO REPORT\nTest: Max Volumetric Speed (MVS)\nHardware: ${activePrinter.model} (${activePrinter.nozzleDiameter}mm)\nFilament: ${activeFilament.name}\nSlicer: ${activeSlicer.name}\nFormula: ${result.formula}\nCalculation: ${result.formulaDerivation}\nCalculated MVS: ${result.calculatedValue} mm³/s\nRecommended 90% Safe Production Limit: ${result.safeValue} mm³/s\nNotes: ${notes}`;
    if (navigator.share) {
      navigator.share({
        title: '3D Calibration Pro - MVS Report',
        text: report,
      }).catch(() => {
        navigator.clipboard?.writeText(report);
        showToast(t('tests.mvs.reportCopied'));
      });
    } else {
      navigator.clipboard?.writeText(report);
      showToast(t('tests.mvs.reportCopied'));
    }
  };

  const handleSaveToMaster = () => {
    // 1. Update calibration item
    db.updateCalibrationItem({
      id: 'cal-01',
      value: result.calculatedValue,
      safeValue: result.safeValue,
      status: 'CALIBRATED',
      testedAt: 'Hoje',
      notes,
      photoUrl,
    });

    // 2. Update master profile
    const master = db.getMasterProfile();
    db.updateMasterProfile({
      mvs: {
        value: result.calculatedValue,
        status: 'CALIBRATED',
        unit: 'mm³/s',
        date: 'Hoje',
      },
    });

    // 3. Add to history audit log
    db.addCalibrationResult({
      id: `mvs-${Date.now()}`,
      testType: 'MVS',
      testName: `MVS Test - ${activeFilament.name}`,
      printerId: activePrinter.id,
      printerName: activePrinter.model,
      filamentId: activeFilament.id,
      filamentName: activeFilament.name,
      slicerId: activeSlicer.id,
      slicerName: activeSlicer.name,
      calculatedValue: result.calculatedValue,
      safeValue: result.safeValue,
      unit: 'mm³/s',
      formula: result.formula,
      inputs: {
        startSpeed,
        endSpeed,
        step,
        measuredHeight,
      },
      notes,
      photoUrl,
      timestamp: 'Just now • Measured',
      status: 'CALIBRATED',
    });

    showToast(t('tests.mvs.savedSuccess', { val: result.calculatedValue }));
    setTimeout(() => {
      onSavedToMaster();
    }, 900);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          showToast('Foto atualizada!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      {/* Breadcrumb Navigation & Screen ID Badge */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBackToWorkflow}
          className="flex items-center gap-1.5 text-on-surface-variant font-mono text-[12px] hover:text-primary transition-colors"
        >
          <span className="text-outline uppercase">TESTS</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-primary font-bold tracking-wide uppercase">
            CAL-01 // MAX VOLUMETRIC SPEED
          </span>
        </button>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
          <span className="font-mono text-[10px] text-primary uppercase">ACTIVE SESSION</span>
        </div>
      </div>

      {/* Active Preset Summary Strip */}
      <div className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-3 flex flex-col gap-2 shadow-md">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
          <span className="font-mono text-[11px] text-outline uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-secondary">memory</span>
            Hardware Context
          </span>
          <span className="font-mono text-[10px] text-secondary uppercase bg-surface-container-highest px-1.5 py-0.5 rounded border border-secondary/20">
            SYNCED
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-container p-2 rounded flex flex-col border border-surface-container-high">
            <span className="font-mono text-[9px] text-outline uppercase">SLICER</span>
            <span className="font-semibold text-[13px] text-on-surface truncate">{activeSlicer.name}</span>
          </div>
          <div className="bg-surface-container p-2 rounded flex flex-col border border-surface-container-high">
            <span className="font-mono text-[9px] text-outline uppercase">PRINTER</span>
            <span className="font-semibold text-[13px] text-primary truncate">
              {activePrinter.model.replace('Flashforge ', '')} ({activePrinter.nozzleDiameter.toFixed(1)}mm)
            </span>
          </div>
          <div className="bg-surface-container p-2 rounded flex flex-col border border-surface-container-high">
            <span className="font-mono text-[9px] text-outline uppercase">FILAMENT</span>
            <span className="font-semibold text-[13px] text-secondary truncate">{activeFilament.name}</span>
          </div>
        </div>
      </div>

      {/* Physical Instructions Card */}
      <div className="w-full bg-surface-container border border-surface-container-high rounded-xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">straighten</span>
          </div>
          <h2 className="font-headline text-[16px] font-bold text-on-surface">
            {t('tests.mvs.inspectionTitle')}
          </h2>
        </div>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          {t('tests.mvs.inspectionText')}
        </p>
        <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-secondary">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>{t('tests.mvs.caliperNotice')}</span>
        </div>
      </div>

      {/* Deterministic Touch-First Input Calculator Panel */}
      <div className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-4 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-outline uppercase tracking-wider font-semibold">
            {t('tests.mvs.calcParams')}
          </span>
          <span className="font-mono text-[10px] text-primary">
            {t('tests.mvs.volumetricDetermination')}
          </span>
        </div>

        {/* Field 1: Start Volumetric Speed */}
        <div className="bg-surface-container border border-surface-container-high rounded-xl p-3 space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center">
            <label htmlFor="input-start-speed" className="font-semibold text-[13px] text-on-surface flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              {t('tests.mvs.startSpeed')}
            </label>
            <span className="font-mono text-[10px] text-outline">DEFAULT: 5.0</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease start speed"
              onClick={() => adjustValue(setStartSpeed, -0.5, 0, 100, 1)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-primary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">remove</span>
            </button>
            <div className="flex-1 relative h-12 bg-surface-container-lowest rounded-lg flex items-center px-3 border border-surface-container-high">
              <input
                id="input-start-speed"
                type="number"
                step="0.5"
                min="0"
                value={startSpeed}
                onChange={(e) => setStartSpeed(Number(e.target.value) || 0)}
                className="w-full bg-transparent font-mono text-[18px] text-primary font-bold focus:outline-none"
              />
              <span className="font-mono text-[11px] text-outline-variant select-none absolute right-3">
                mm³/s
              </span>
            </div>
            <button
              type="button"
              aria-label="Increase start speed"
              onClick={() => adjustValue(setStartSpeed, 0.5, 0, 100, 1)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-primary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </div>

        {/* Field 2: End Volumetric Speed */}
        <div className="bg-surface-container border border-surface-container-high rounded-xl p-3 space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center">
            <label htmlFor="input-end-speed" className="font-semibold text-[13px] text-on-surface flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              {t('tests.mvs.endSpeed')}
            </label>
            <span className="font-mono text-[10px] text-outline">CAP: 40.0</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease end speed"
              onClick={() => adjustValue(setEndSpeed, -1.0, 1, 100, 1)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-secondary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">remove</span>
            </button>
            <div className="flex-1 relative h-12 bg-surface-container-lowest rounded-lg flex items-center px-3 border border-surface-container-high">
              <input
                id="input-end-speed"
                type="number"
                step="1"
                min="1"
                value={endSpeed}
                onChange={(e) => setEndSpeed(Number(e.target.value) || 0)}
                className="w-full bg-transparent font-mono text-[18px] text-secondary font-bold focus:outline-none"
              />
              <span className="font-mono text-[11px] text-outline-variant select-none absolute right-3">
                mm³/s
              </span>
            </div>
            <button
              type="button"
              aria-label="Increase end speed"
              onClick={() => adjustValue(setEndSpeed, 1.0, 1, 100, 1)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-secondary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </div>

        {/* Field 3: Step Increment */}
        <div className="bg-surface-container border border-surface-container-high rounded-xl p-3 space-y-1.5 shadow-sm">
          <div className="flex justify-between items-center">
            <label htmlFor="input-step" className="font-semibold text-[13px] text-on-surface flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              {t('tests.mvs.stepIncrement')}
            </label>
            <span className="font-mono text-[10px] text-outline">RATE PER MM</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease step"
              onClick={() => adjustValue(setStep, -0.05, 0.05, 5, 2)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-tertiary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">remove</span>
            </button>
            <div className="flex-1 relative h-12 bg-surface-container-lowest rounded-lg flex items-center px-3 border border-surface-container-high">
              <input
                id="input-step"
                type="number"
                step="0.05"
                min="0.05"
                value={step}
                onChange={(e) => setStep(Number(e.target.value) || 0.05)}
                className="w-full bg-transparent font-mono text-[18px] text-tertiary font-bold focus:outline-none"
              />
              <span className="font-mono text-[11px] text-outline-variant select-none absolute right-3">
                mm³/s/mm
              </span>
            </div>
            <button
              type="button"
              aria-label="Increase step"
              onClick={() => adjustValue(setStep, 0.05, 0.05, 5, 2)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-tertiary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>
        </div>

        {/* Field 4: Measured Height (Failure / Delamination Point) */}
        <div className="bg-surface-container border border-surface-container-high rounded-xl p-3 space-y-2.5 shadow-sm">
          <div className="flex justify-between items-center">
            <label htmlFor="input-height" className="font-semibold text-[13px] text-on-surface flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              {t('tests.mvs.measuredHeight')}
            </label>
            <span className="font-mono text-[10px] text-primary font-bold">
              {t('tests.mvs.criticalValue')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease height"
              onClick={() => adjustValue(setMeasuredHeight, -0.5, 0, 150, 1)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-primary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">remove</span>
            </button>
            <div className="flex-1 relative h-12 bg-surface-container-lowest rounded-lg flex items-center px-3 border border-surface-container-high">
              <input
                id="input-height"
                type="number"
                step="0.1"
                min="0"
                max="150"
                value={measuredHeight}
                onChange={(e) => setMeasuredHeight(Number(e.target.value) || 0)}
                className="w-full bg-transparent font-mono text-[20px] text-on-surface font-bold focus:outline-none"
              />
              <span className="font-mono text-[12px] text-primary font-bold select-none absolute right-3">
                mm
              </span>
            </div>
            <button
              type="button"
              aria-label="Increase height"
              onClick={() => adjustValue(setMeasuredHeight, 0.5, 0, 150, 1)}
              className="h-12 w-14 rounded-lg bg-surface-container-highest text-primary active:scale-95 transition-all flex items-center justify-center font-mono text-[20px] font-bold border border-outline-variant/30 select-none"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
          </div>

          {/* Precision Caliper Range Slider */}
          <div className="pt-2 px-1">
            <input
              type="range"
              min="0"
              max="40"
              step="0.1"
              value={Math.min(40, measuredHeight)}
              onChange={(e) => setMeasuredHeight(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-lowest rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between font-mono text-[10px] text-outline pt-1 select-none">
              <span>0.0 mm</span>
              <span>10.0 mm</span>
              <span className="text-primary font-bold">{measuredHeight.toFixed(1)} mm</span>
              <span>30.0 mm</span>
              <span>40.0 mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent High-Contrast Calculated Result Card */}
      <div id="result-card" className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-4 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-surface-container-highest text-secondary flex items-center gap-1.5 font-mono text-[11px] font-bold border border-secondary/20">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              CALIBRATED
            </div>
            <span className="font-mono text-[11px] text-outline">// FLUID DYNAMICS</span>
          </div>
          <button
            type="button"
            aria-label="Copy result"
            onClick={handleCopyResult}
            className="text-outline hover:text-primary transition-colors flex items-center gap-1 font-mono text-[11px]"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>COPY</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center py-3 bg-surface-container rounded-xl border border-surface-container-high">
          <span className="font-mono text-[11px] text-outline uppercase tracking-wider font-semibold">
            {t('tests.mvs.maxVolumetricSpeed')}
          </span>
          <div className="flex items-baseline justify-center gap-2 my-1">
            <span className="font-mono text-[36px] text-primary font-bold tracking-tight">
              {result.calculatedValue.toFixed(2)}
            </span>
            <span className="font-mono text-[16px] text-on-surface-variant font-medium">
              mm³/s
            </span>
          </div>
          <span className="font-mono text-[11px] text-on-surface-variant">
            Hotend Flow Rate Ceiling ({activePrinter.model.replace('Flashforge ', '')} Nozzle {activePrinter.nozzleDiameter.toFixed(1)}mm)
          </span>
        </div>

        {/* Mathematical Formula Breakdown Well */}
        <div className="bg-surface-container-lowest p-3 rounded-lg space-y-1 border border-surface-container-high">
          <div className="flex justify-between items-center text-outline font-mono text-[10px]">
            <span>{t('tests.mvs.formulaDerivation')}</span>
            <span className="text-secondary">{t('tests.mvs.linearInterpolation')}</span>
          </div>
          <div className="font-mono text-[12px] text-on-surface">
            {result.formula}
          </div>
          <div className="font-mono text-[12px] text-primary">
            Calculation: {result.formulaDerivation}
          </div>
        </div>

        {/* Safe Margin Recommendation Alert Banner */}
        <div className="bg-surface-container p-3 rounded-lg flex items-start gap-2.5 border border-secondary/20">
          <span className="material-symbols-outlined text-secondary text-[20px] mt-0.5 shrink-0">
            verified_user
          </span>
          <div className="flex flex-col">
            <span className="font-semibold text-[13px] text-secondary">
              {t('tests.mvs.safeCeilingTitle')}
            </span>
            <p className="text-[12px] text-on-surface-variant mt-0.5">
              Apply a <strong className="text-on-surface font-semibold">90% safe buffer</strong> in {activeSlicer.name} or OrcaSlicer:{' '}
              <span className="font-mono text-[14px] text-secondary font-bold inline-block ml-1">
                {result.safeValue.toFixed(2)} mm³/s
              </span>{' '}
              for zero underextrusion risk during high-speed travel.
            </p>
          </div>
        </div>
      </div>

      {/* Benchtop Sample Audit with Photo and Notes */}
      <div className="w-full bg-surface-container-low border border-surface-container-high rounded-xl p-4 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">photo_camera</span>
            <h3 className="font-semibold text-[14px] text-on-surface">
              {t('tests.mvs.benchtopAuditTitle')}
            </h3>
          </div>
          <span className="font-mono text-[10px] text-outline">
            {t('tests.mvs.sessionCode')}
          </span>
        </div>

        {/* Specimen Photo Slot */}
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-surface-container-highest border border-surface-container-high shadow-inner">
          <img
            src={photoUrl}
            alt="3D printed calibration sample stepped tower with digital calipers clamped"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-transparent flex items-end p-3 justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface">
              <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
              <span>Sample AD5X-PETG-01.jpg</span>
            </div>
            <label className="cursor-pointer px-2.5 py-1 rounded bg-surface-container-high text-primary font-mono text-[10px] flex items-center gap-1 border border-primary/20 hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-[14px]">sync</span>
              <span>{t('tests.mvs.replacePhoto')}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Technician Notes Textarea */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="technician-notes" className="font-semibold text-[13px] text-on-surface">
              {t('tests.mvs.technicianNotes')}
            </label>
            <span className="font-mono text-[10px] text-outline">
              NOZZLE TEMP: {activeFilament.recommendedNozzleTempMin + 5}°C
            </span>
          </div>
          <textarea
            id="technician-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-surface-container border border-surface-container-high rounded-lg p-2.5 text-[12px] text-on-surface placeholder:text-outline focus:outline-none focus:border-primary resize-none font-mono"
            placeholder={t('tests.mvs.notesPlaceholder')}
          />
        </div>
      </div>

      {/* Non-Intrusive Sponsored Benchmark Spec Bar */}
      <div className="w-full bg-surface-container-high rounded-xl p-2.5 flex items-center justify-between border border-surface-container-highest shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-[18px]">verified</span>
          <span className="font-mono text-[10px] text-outline tracking-wider">CERTIFIED SPEED COMPATIBLE</span>
        </div>
        <span className="font-mono text-[11px] text-primary">FLASHFORGE HIGH-FLOW DOCK</span>
      </div>

      {/* Sticky Contextual Workbench Action Hub */}
      <div className="w-full pt-1 space-y-2.5">
        <button
          type="button"
          onClick={handleSaveToMaster}
          className="w-full h-14 min-h-[52px] rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-headline font-bold text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all select-none"
        >
          <span className="material-symbols-outlined text-[22px]">save</span>
          <span>{t('tests.mvs.saveToProfile')}</span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="h-12 min-h-[48px] rounded-xl bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>{t('tests.mvs.resetTest')}</span>
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="h-12 min-h-[48px] rounded-xl bg-surface-container hover:bg-surface-container-highest text-secondary font-semibold text-[13px] flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span>{t('tests.mvs.exportReport')}</span>
          </button>
        </div>
      </div>

      {/* Bottom Ad Reserve */}
      <AdBanner variant="reserve" className="mt-4" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-on-primary font-mono text-[12px] shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
