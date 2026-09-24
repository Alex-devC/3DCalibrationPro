import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { MasterProfile, PrinterProfile, FilamentProfile, SlicerProfile } from '../types/index.ts';
import { getSlicerAdapter } from '../slicers/adapters.ts';
import { db } from '../data/storage.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface MasterProfileViewProps {
  masterProfile: MasterProfile;
  activePrinter: PrinterProfile;
  activeFilament: FilamentProfile;
  activeSlicer: SlicerProfile;
  onCalibrateParam: (paramType: string) => void;
  onRefresh: () => void;
}

export const MasterProfileView: React.FC<MasterProfileViewProps> = ({
  masterProfile,
  activePrinter,
  activeFilament,
  activeSlicer,
  onCalibrateParam,
  onRefresh,
}) => {
  const { t } = useI18n();
  const slicerAdapter = getSlicerAdapter(activeSlicer.id);

  // Modals state
  const [isExportDrawerOpen, setIsExportDrawerOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<{
    key: string;
    title: string;
    value: string | number;
    unit: string;
    meta: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export handlers
  const handleDownloadPreset = (type: 'fcfg' | 'json' | 'backup') => {
    let content = '';
    let fileName = '';
    let mimeType = 'application/json';

    if (type === 'backup') {
      content = db.exportBackupJSON();
      fileName = `3DCalibrationPro_Backup_${activePrinter.model.replace(/\s+/g, '_')}.3dcp`;
    } else {
      const bundle = slicerAdapter.generateProfileBundle(masterProfile);
      content = bundle.content;
      fileName = bundle.fileName;
      mimeType = bundle.mimeType;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExportDrawerOpen(false);
    showToast(`Arquivo gerado: ${fileName}`);
  };

  const handleDeviceShare = () => {
    const summaryText = `3D CALIBRATION PRO - MASTER PROFILE\nProfile: ${masterProfile.name}\nPrinter: ${activePrinter.model} (${activePrinter.nozzleDiameter}mm)\nFilament: ${activeFilament.name}\nSlicer: ${activeSlicer.name}\n- Extrusion Temp: ${masterProfile.temp.nozzle}°C (Bed: ${masterProfile.temp.bed}°C)\n- Flow Rate Multiplier: ${masterProfile.flowRate.value}\n- Max Volumetric Speed: ${masterProfile.mvs.value} mm³/s\n- Retraction: ${masterProfile.retraction.distance} mm\n- Pressure Advance: ${masterProfile.pressureAdvance.value}\nStart G-Code: M900 K${masterProfile.pressureAdvance.value}`;

    if (navigator.share) {
      navigator.share({
        title: `${activePrinter.model} - ${activeFilament.name} Master Profile`,
        text: summaryText,
      }).catch(() => {
        setIsExportDrawerOpen(true);
      });
    } else {
      setIsExportDrawerOpen(true);
    }
  };

  const handleCopyText = (text: string, label = 'Copiado!') => {
    navigator.clipboard?.writeText(text);
    showToast(label);
  };

  // Quick edit modal save
  const handleSaveParamValue = () => {
    if (!editingParam) return;
    const val = parseFloat(String(editingParam.value));

    if (editingParam.key === 'mvs') {
      db.updateMasterProfile({ mvs: { ...masterProfile.mvs, value: val } });
      db.updateCalibrationItem({ id: 'cal-01', value: val });
    } else if (editingParam.key === 'flow') {
      db.updateMasterProfile({ flowRate: { ...masterProfile.flowRate, value: val } });
      db.updateCalibrationItem({ id: 'cal-02', value: val });
    } else if (editingParam.key === 'temp') {
      db.updateMasterProfile({ temp: { ...masterProfile.temp, nozzle: val } });
      db.updateCalibrationItem({ id: 'cal-03', value: val });
    } else if (editingParam.key === 'retract') {
      db.updateMasterProfile({ retraction: { ...masterProfile.retraction, distance: val } });
      db.updateCalibrationItem({ id: 'cal-04', value: val });
    } else if (editingParam.key === 'pa') {
      db.updateMasterProfile({ pressureAdvance: { ...masterProfile.pressureAdvance, value: val } });
      db.updateCalibrationItem({ id: 'cal-05', value: val });
    }

    setEditingParam(null);
    onRefresh();
    showToast('Parâmetro atualizado na memória local!');
  };

  const adjustParamDelta = (delta: number) => {
    if (!editingParam) return;
    const current = parseFloat(String(editingParam.value)) || 0;
    const step = editingParam.key === 'pa' ? 0.005 : editingParam.key === 'flow' ? 0.01 : 0.5;
    const next = Number((current + delta * step).toFixed(3));
    setEditingParam({ ...editingParam, value: next });
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      {/* Master Profile Header Card */}
      <div className="rounded-xl bg-surface-container-high border border-surface-container-highest p-4 shadow-md relative overflow-hidden">
        {/* Ambient Top Tech Glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-3">
          {/* Monospace Module Flag + Badge */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {masterProfile.code}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-mono text-[10px] flex items-center gap-1 border border-primary/20">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              {t('master.prodReady')}
            </span>
          </div>

          {/* Filament Visual Thumbnail + Titles */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-14 h-14 rounded-lg bg-surface-container flex-shrink-0 relative overflow-hidden flex items-center justify-center border border-surface-container-highest shadow-inner">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7415ACYIr5qe2TNHacTH-rYPX2kWAuN0bz3h5O6kFiZJ5OIOuCfZneExFzY_NTwWXq2rekd3fYqzrPxUMlpj0unF1Tm2A4eoU0VUjg4ODiU_DfI4_4yOrppzI-DJ2mv697_tdbRFHjTgwDw83wtFpZL2_prDVGVZhGDR8fp1Fm7SYQMDSPVdPpZFbxd7fgLFdAenmD5cSAF6Td4-m8TiUpba65Wh0SoI6TZ-qG9Ezg30j44wwjW6x"
                alt="Filament spool closeup"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute bottom-0 inset-x-0 h-1.5"
                style={{ backgroundColor: activeFilament.colorHex }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-[18px] font-bold text-on-surface truncate">
                  {activeFilament.name}
                </h2>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-[0_0_6px_rgba(0,180,216,0.6)]"
                  style={{ backgroundColor: activeFilament.colorHex }}
                  title={activeFilament.colorName}
                />
              </div>
              <p className="text-[13px] text-on-surface-variant truncate">
                {activePrinter.model} • {activePrinter.nozzleDiameter.toFixed(1)} mm {activePrinter.nozzleMaterial || 'Hardened Steel'}
              </p>
            </div>
          </div>

          {/* Metadata Matrix Chips */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded bg-surface-container border border-surface-container-high flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0">terminal</span>
              <div className="truncate">
                <div className="text-[9px] text-outline uppercase">{t('master.targetSlicer')}</div>
                <div className="font-semibold text-[13px] text-on-surface truncate">{activeSlicer.name}</div>
              </div>
            </div>
            <div className="p-2 rounded bg-surface-container border border-surface-container-high flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[18px] text-tertiary flex-shrink-0">layers</span>
              <div className="truncate">
                <div className="text-[9px] text-outline uppercase">{t('master.confidenceScore')}</div>
                <div className="font-semibold text-[13px] text-primary">{masterProfile.confidenceScore}% Calibrated</div>
              </div>
            </div>
          </div>

          {/* Segmented Calibration Stage Bar */}
          <div className="pt-1 space-y-1">
            <div className="flex justify-between font-mono text-[11px] text-on-surface-variant">
              <span>{t('master.pipelineHealth')}</span>
              <span className="text-on-surface font-semibold">4 / 6 OK</span>
            </div>
            <div className="grid grid-cols-6 gap-1 h-1.5 w-full">
              <div className="bg-primary rounded-full"></div>
              <div className="bg-primary rounded-full"></div>
              <div className="bg-primary rounded-full"></div>
              <div className="bg-primary rounded-full"></div>
              <div className="bg-secondary-container rounded-full"></div>
              <div className="bg-surface-container-highest rounded-full"></div>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
              <span>4 Calibrated</span>
              <span>1 Manual</span>
              <span>1 Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slicer Compatibility Notice (Non-intrusive alert callout) */}
      <div className="rounded-lg bg-surface-container border border-secondary/20 p-3 flex items-start gap-2.5 shadow-sm">
        <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0 mt-0.5">info</span>
        <div className="flex-1 space-y-0.5">
          <div className="font-semibold text-[13px] text-secondary">
            {t('master.slicerFallbackNoticeTitle')}
          </div>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            {activeSlicer.name} não possui campo nativo na interface para <span className="font-mono text-on-surface font-bold">Pressure Advance ({masterProfile.pressureAdvance.value})</span>. Este valor é rastreado no Perfil Mestre e pode ser injetado com segurança via Start G-code (<span className="font-mono text-primary font-bold">M900 K{masterProfile.pressureAdvance.value}</span>).
          </p>
        </div>
      </div>

      {/* Interactive Parameter Matrix Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-outline font-semibold">
            {t('master.metrologyParams')}
          </span>
          <span className="font-mono text-[11px] text-secondary">
            {t('master.tapToInspect')}
          </span>
        </div>

        {/* Card 1: Temp */}
        <div className="rounded-lg bg-surface-container-high border border-surface-container-highest p-3 space-y-2 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">device_thermostat</span>
              <span className="font-mono text-[11px] text-on-surface-variant">TEMP // EXTRUSION & BED</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-[#4ade80] font-mono text-[10px] font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span>CALIBRATED
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[26px] font-bold text-on-surface">{masterProfile.temp.nozzle}</span>
              <span className="font-mono text-[12px] text-on-surface-variant ml-0.5">°C</span>
              <span className="text-[12px] text-outline ml-2 font-mono">
                Bed: <span className="text-on-surface font-semibold">{masterProfile.temp.bed} °C</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingParam({
                key: 'temp',
                title: 'Extrusion Temperature',
                value: masterProfile.temp.nozzle || 245,
                unit: '°C',
                meta: 'Verified via Temp Tower',
              })}
              className="h-9 px-3 rounded bg-surface-container text-primary font-semibold text-[13px] flex items-center gap-1 active:scale-95 transition-transform border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit</span>
            </button>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
            <span>Verified via Temp Tower</span>
            <span>Tested: {masterProfile.temp.date || 'Oct 24'}</span>
          </div>
        </div>

        {/* Card 2: Flow Rate */}
        <div className="rounded-lg bg-surface-container-high border border-surface-container-highest p-3 space-y-2 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">waves</span>
              <span className="font-mono text-[11px] text-on-surface-variant">FLOW // EXTRUSION MULTIPLIER</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-[#4ade80] font-mono text-[10px] font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span>CALIBRATED
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[26px] font-bold text-on-surface">{masterProfile.flowRate.value}</span>
              <span className="font-mono text-[11px] text-on-surface-variant ml-0.5">RATIO</span>
              <span className="text-[12px] text-outline ml-2 font-mono">
                ({((masterProfile.flowRate.value || 0.96) * 100).toFixed(1)}%)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingParam({
                key: 'flow',
                title: 'Flow Rate Multiplier',
                value: masterProfile.flowRate.value || 0.96,
                unit: 'ratio',
                meta: 'Wall Thickness: 0.80mm Target',
              })}
              className="h-9 px-3 rounded bg-surface-container text-primary font-semibold text-[13px] flex items-center gap-1 active:scale-95 transition-transform border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit</span>
            </button>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
            <span>Wall Thickness: 0.80mm Target</span>
            <span>Tested: {masterProfile.flowRate.date || 'Oct 24'}</span>
          </div>
        </div>

        {/* Card 3: MVS */}
        <div className="rounded-lg bg-surface-container-high border border-surface-container-highest p-3 space-y-2 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">speed</span>
              <span className="font-mono text-[11px] text-on-surface-variant">FLOW // MAX VOLUMETRIC</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-[#4ade80] font-mono text-[10px] font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span>CALIBRATED
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[26px] font-bold text-on-surface">{masterProfile.mvs.value}</span>
              <span className="font-mono text-[11px] text-on-surface-variant ml-0.5">mm³/s</span>
              <span className="text-[12px] text-outline ml-2 font-mono">Safe cap</span>
            </div>
            <button
              type="button"
              onClick={() => onCalibrateParam('MVS')}
              className="h-9 px-3 rounded bg-surface-container text-primary font-semibold text-[13px] flex items-center gap-1 active:scale-95 transition-transform border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>Calibrate</span>
            </button>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
            <span>Extruder Skip Boundary: 14.8 mm³/s</span>
            <span className="text-primary font-medium">Tested: {masterProfile.mvs.date || 'Hoje'}</span>
          </div>
        </div>

        {/* Card 4: Retraction */}
        <div className="rounded-lg bg-surface-container-high border border-surface-container-highest p-3 space-y-2 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">unfold_more</span>
              <span className="font-mono text-[11px] text-on-surface-variant">RETRACT // SEAM RECOVERY</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-[#4ade80] font-mono text-[10px] font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></span>CALIBRATED
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[26px] font-bold text-on-surface">{masterProfile.retraction.distance}</span>
              <span className="font-mono text-[11px] text-on-surface-variant ml-0.5">mm</span>
              <span className="text-[12px] text-outline ml-2 font-mono">
                @ {masterProfile.retraction.speed} mm/s (Z-Hop: {masterProfile.retraction.zHop}mm)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingParam({
                key: 'retract',
                title: 'Retraction Distance',
                value: masterProfile.retraction.distance || 0.8,
                unit: 'mm',
                meta: 'Direct Drive Flashforge AD5X',
              })}
              className="h-9 px-3 rounded bg-surface-container text-primary font-semibold text-[13px] flex items-center gap-1 active:scale-95 transition-transform border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit</span>
            </button>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
            <span>Direct Drive {activePrinter.model}</span>
            <span>Tested: {masterProfile.retraction.date || 'Oct 23'}</span>
          </div>
        </div>

        {/* Card 5: Pressure Advance (Amber) */}
        <div className="rounded-lg bg-surface-container-high border border-surface-container-highest p-3 space-y-2 shadow-sm hover:border-amber-400/40 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">compress</span>
              <span className="font-mono text-[11px] text-on-surface-variant">CORNER // PRESSURE ADVANCE</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container text-[#fbbf24] font-mono text-[10px] font-medium border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]"></span>MANUAL OVERRIDE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[26px] font-bold text-[#fbbf24]">{masterProfile.pressureAdvance.value}</span>
              <span className="font-mono text-[11px] text-on-surface-variant ml-0.5">s</span>
              <span className="text-[12px] text-outline ml-2 font-mono">K-factor spec</span>
            </div>
            <button
              type="button"
              onClick={() => setEditingParam({
                key: 'pa',
                title: 'Pressure Advance (K)',
                value: masterProfile.pressureAdvance.value || 0.035,
                unit: 's',
                meta: 'Injected via Start G-code',
              })}
              className="h-9 px-3 rounded bg-surface-container text-primary font-semibold text-[13px] flex items-center gap-1 active:scale-95 transition-transform border border-primary/20"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit</span>
            </button>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
            <span>User Defined via PA Tower Test</span>
            <span className="text-[#fbbf24]">Injected via Start G-code</span>
          </div>
        </div>

        {/* Card 6: Cooling (Pending) */}
        <div className="rounded-lg bg-surface-container border border-surface-container-high p-3 space-y-2 shadow-sm opacity-90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-outline">mode_fan</span>
              <span className="font-mono text-[11px] text-outline">COOLING // PART FAN CURVE</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>NOT CALIBRATED
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="font-mono text-[26px] font-bold text-outline">—</span>
              <span className="text-[12px] text-outline ml-2 font-mono">Default printer profile (35%)</span>
            </div>
            <button
              type="button"
              onClick={() => onCalibrateParam('COOLING')}
              className="h-9 px-3 rounded bg-primary text-on-primary font-semibold text-[13px] flex items-center gap-1 active:scale-95 transition-transform shadow"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>+ Calibrate</span>
            </button>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-outline pt-0.5">
            <span>Bridging & overhang threshold test</span>
            <span>Awaiting run</span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons (52px targets) */}
      <div className="pt-2 space-y-2.5">
        {/* CTA 1: Export Profile */}
        <button
          type="button"
          onClick={() => setIsExportDrawerOpen(true)}
          className="w-full h-[52px] min-h-[52px] rounded-lg bg-primary hover:bg-primary/90 text-on-primary font-headline font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-transform shadow-md uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          <span>{t('master.exportProfile')}</span>
        </button>

        {/* CTA 2: Manual Configuration Guide */}
        <button
          type="button"
          onClick={() => setIsGuideModalOpen(true)}
          className="w-full h-[52px] min-h-[52px] rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-headline font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-transform border border-primary/20 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[20px]">auto_stories</span>
          <span>{t('master.manualConfigGuide')}</span>
        </button>

        {/* CTA 3: Share via Device */}
        <button
          type="button"
          onClick={handleDeviceShare}
          className="w-full h-[52px] min-h-[52px] rounded-lg bg-surface-container hover:bg-surface-container-high text-secondary font-headline font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-transform border border-outline-variant/30 uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
          <span>{t('master.shareViaDevice')}</span>
        </button>
      </div>

      {/* Benchtop Context Image Showcase */}
      <div className="rounded-xl bg-surface-container border border-surface-container-high p-3 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-outline uppercase font-semibold">
            {t('master.activeBenchtopContext')}
          </span>
          <span className="font-mono text-[10px] text-primary">
            {t('master.calibrationRig')}
          </span>
        </div>
        <div className="w-full h-36 rounded-lg relative overflow-hidden flex items-center justify-center border border-surface-container-highest">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJwTrRyS1aKVT--NTHcwUTexl4mCSkR7g4Ak8vKYXo4_qLBuqQtFApCAP5wzI7tawGqlxCUrnbOkpWux_UBwScATkvj-AVuYScuQy39UaRhYYN3waj4lOAz6fs3PY8ZbLLUfhIqVNz-uGqbWuA-AeEqKBbI5smqX2vkFLdnssITjWUL81e57Oh2X2y7e1lNQ1fHX_1xDjErfJshDi0R3pL2j8FuAI2LUzr8atvOVRSRfz3_2K1FwwX"
            alt="Technical 3D printing workbench setup"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/30 to-transparent flex items-end p-3">
            <div className="text-on-surface">
              <div className="font-semibold text-[13px]">{activePrinter.model} Extruder Core</div>
              <div className="text-[11px] text-on-surface-variant font-mono">
                Optimal nozzle temperature range: {activeFilament.recommendedNozzleTempMin}°C - {activeFilament.recommendedNozzleTempMax}°C
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Technical Storage Metadata */}
      <div className="pt-2 space-y-1 text-center font-mono text-[11px] text-outline">
        <div className="flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-primary">database</span>
          <span>{t('master.offlineStored')}</span>
        </div>
        <div className="text-[10px] text-on-surface-variant">
          {t('master.designedBy')}
        </div>
      </div>

      {/* Bottom Ad Reserve */}
      <AdBanner variant="reserve" className="mt-4" />

      {/* EXPORT DRAWER / MODAL */}
      {isExportDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-surface-container-lowest/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-2xl bg-surface-container-high border-t border-surface-container-highest shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 rounded-full bg-surface-container-highest mx-auto" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline text-[18px] font-bold text-on-surface">
                  {t('export.title')}
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  {t('export.subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Target Formats */}
            <div className="space-y-2">
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider block">
                {t('export.targetFormat')}
              </span>

              {/* Flash Studio Preset */}
              <button
                type="button"
                onClick={() => handleDownloadPreset('fcfg')}
                className="w-full p-3 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-between active:scale-[0.99] transition-all text-left border border-surface-container-highest"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-primary-container/20 text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">build_circle</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-on-surface">
                      {t('export.flashStudioPreset')}
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      {t('export.flashStudioDesc')}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-primary">file_download</span>
              </button>

              {/* OrcaSlicer Preset */}
              <button
                type="button"
                onClick={() => handleDownloadPreset('json')}
                className="w-full p-3 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-between active:scale-[0.99] transition-all text-left border border-surface-container-highest"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-secondary-container/20 text-secondary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">data_object</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-on-surface">
                      {t('export.orcaSlicerPreset')}
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      {t('export.orcaSlicerDesc')}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-secondary">file_download</span>
              </button>

              {/* 3D Calibration Pro Backup */}
              <button
                type="button"
                onClick={() => handleDownloadPreset('backup')}
                className="w-full p-3 rounded-lg bg-surface-container hover:bg-surface-container-highest flex items-center justify-between active:scale-[0.99] transition-all text-left border border-surface-container-highest"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-tertiary-container/20 text-tertiary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] text-on-surface">
                      {t('export.backupPreset')}
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant">
                      {t('export.backupDesc')}
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[20px] text-tertiary">file_download</span>
              </button>
            </div>

            {/* Direct Share Targets */}
            <div className="space-y-2 pt-1">
              <span className="font-mono text-[11px] text-outline uppercase tracking-wider block">
                {t('export.directShareTargets')}
              </span>
              <div className="grid grid-cols-5 gap-2 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => handleDownloadPreset('fcfg')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:text-primary active:scale-95 transition-all border border-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[22px]">save</span>
                  <span className="mt-1">{t('export.save')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = `3DCP Profile: ${masterProfile.name}\nMVS: ${masterProfile.mvs.value}mm³/s, Flow: ${masterProfile.flowRate.value}, Temp: ${masterProfile.temp.nozzle}C`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:text-primary active:scale-95 transition-all border border-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[22px]">chat</span>
                  <span className="mt-1">{t('export.whatsapp')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const subject = encodeURIComponent(`3D Calibration Pro Profile: ${masterProfile.name}`);
                    const body = encodeURIComponent(`Master Profile specs:\nTemp: ${masterProfile.temp.nozzle}°C\nMVS: ${masterProfile.mvs.value} mm³/s\nFlow: ${masterProfile.flowRate.value}`);
                    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                  }}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:text-primary active:scale-95 transition-all border border-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[22px]">mail</span>
                  <span className="mt-1">{t('export.email')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeviceShare}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:text-primary active:scale-95 transition-all border border-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[22px]">rss_feed</span>
                  <span className="mt-1">QuickShare</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeviceShare}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-surface-container text-on-surface hover:text-primary active:scale-95 transition-all border border-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[22px]">bluetooth</span>
                  <span className="mt-1">Bluetooth</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CONFIGURATION GUIDE MODAL */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">auto_stories</span>
                <h3 className="font-headline text-[18px] font-bold text-on-surface">
                  {t('manualGuide.title', { slicer: activeSlicer.name })}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-[12px] text-on-surface-variant">
              {t('manualGuide.subtitle')}
            </p>

            <div className="space-y-3 text-[13px]">
              {/* Step 1: Filament Settings */}
              <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest space-y-1.5">
                <div className="flex items-center justify-between text-on-surface font-semibold">
                  <span>{t('manualGuide.step1Title')}</span>
                  <span className="font-mono text-[11px] text-primary">{t('manualGuide.step1Cat')}</span>
                </div>
                <p className="text-[12px] text-on-surface-variant font-mono">
                  {t('manualGuide.step1Nav')}
                </p>
                <ul className="space-y-1 font-mono text-[12px] text-on-surface pt-1">
                  <li className="flex items-center justify-between bg-surface-container-low p-1.5 rounded">
                    <span>{t('manualGuide.printTemp')}: <strong className="text-primary">{masterProfile.temp.nozzle} °C</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(String(masterProfile.temp.nozzle))}
                      className="text-[11px] text-secondary underline font-mono"
                    >
                      {t('manualGuide.copy')}
                    </button>
                  </li>
                  <li className="flex items-center justify-between bg-surface-container-low p-1.5 rounded">
                    <span>{t('manualGuide.bedTemp')}: <strong className="text-primary">{masterProfile.temp.bed} °C</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(String(masterProfile.temp.bed))}
                      className="text-[11px] text-secondary underline font-mono"
                    >
                      {t('manualGuide.copy')}
                    </button>
                  </li>
                  <li className="flex items-center justify-between bg-surface-container-low p-1.5 rounded">
                    <span>{t('manualGuide.flowMultiplier')}: <strong className="text-primary">{masterProfile.flowRate.value}</strong></span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(String(masterProfile.flowRate.value))}
                      className="text-[11px] text-secondary underline font-mono"
                    >
                      {t('manualGuide.copy')}
                    </button>
                  </li>
                </ul>
              </div>

              {/* Step 2: MVS */}
              <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest space-y-1.5">
                <div className="flex items-center justify-between text-on-surface font-semibold">
                  <span>{t('manualGuide.step2Title')}</span>
                  <span className="font-mono text-[11px] text-primary">{t('manualGuide.step2Cat')}</span>
                </div>
                <p className="text-[12px] text-on-surface-variant font-mono">
                  {t('manualGuide.step2Nav')}
                </p>
                <div className="flex items-center justify-between bg-surface-container-low p-2 rounded font-mono text-[12px]">
                  <span>
                    {t('manualGuide.setMvs')} <strong className="text-primary">{masterProfile.mvs.value} mm³/s</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(String(masterProfile.mvs.value))}
                    className="text-[11px] text-secondary underline font-mono"
                  >
                    {t('manualGuide.copy')}
                  </button>
                </div>
              </div>

              {/* Step 3: Start G-code Injection */}
              <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest space-y-1.5">
                <div className="flex items-center justify-between text-on-surface font-semibold">
                  <span>{t('manualGuide.step3Title')}</span>
                  <span className="font-mono text-[11px] text-[#fbbf24]">{t('manualGuide.step3Cat')}</span>
                </div>
                <p className="text-[12px] text-on-surface-variant">
                  {t('manualGuide.step3Nav')}
                </p>
                <div className="p-2.5 rounded bg-surface-container-lowest font-mono text-[12px] text-primary flex items-center justify-between border border-surface-container-highest">
                  <code>M900 K{masterProfile.pressureAdvance.value} ; 3DCP PA</code>
                  <button
                    type="button"
                    onClick={() => handleCopyText(`M900 K${masterProfile.pressureAdvance.value} ; Calibration Pro PA`)}
                    className="text-[11px] text-secondary underline font-mono ml-2 shrink-0"
                  >
                    {t('manualGuide.copy')}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="w-full h-12 rounded-lg bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center active:scale-95 transition-all uppercase tracking-wide"
            >
              {t('manualGuide.done')}
            </button>
          </div>
        </div>
      )}

      {/* QUICK PARAMETER TWEAK DIALOG */}
      {editingParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-outline uppercase">QUICK TWEAK</span>
                <h3 className="font-headline text-[17px] font-bold text-on-surface">
                  {editingParam.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingParam(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[11px] text-on-surface-variant uppercase">
                CALIBRATED VALUE
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustParamDelta(-1)}
                  className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-mono text-[22px] font-bold text-on-surface active:scale-95 transition-all border border-surface-container-highest"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  value={editingParam.value}
                  onChange={(e) => setEditingParam({ ...editingParam, value: e.target.value })}
                  className="flex-1 h-12 rounded-lg bg-surface-container-lowest px-3 text-center font-mono text-[22px] font-bold text-primary focus:outline-none border border-surface-container-high"
                />
                <button
                  type="button"
                  onClick={() => adjustParamDelta(1)}
                  className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-mono text-[22px] font-bold text-on-surface active:scale-95 transition-all border border-surface-container-highest"
                >
                  +
                </button>
              </div>
              <div className="font-mono text-[10px] text-outline text-center">
                {editingParam.meta} ({editingParam.unit})
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingParam(null)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface-variant font-semibold text-[13px]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveParamValue}
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

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
