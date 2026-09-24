import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { Logo } from '../components/Logo.tsx';
import { db } from '../data/storage.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface SettingsViewProps {
  onRefreshAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onRefreshAll }) => {
  const { language, setLanguage, t } = useI18n();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportBackup = () => {
    const backupJson = db.exportBackupJSON();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `3DCalibrationPro_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t('settings.backupExportSuccess'));
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const ok = db.importBackupJSON(content);
          if (ok) {
            showToast(t('settings.backupImportSuccess'));
            onRefreshAll();
          } else {
            showToast('Erro ao importar backup.');
          }
        } catch (err) {
          showToast('Formato JSON inválido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm(t('settings.factoryResetConfirm'))) {
      db.resetToFactory();
      onRefreshAll();
      showToast(t('settings.factoryResetSuccess'));
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      {/* Header */}
      <div className="pt-1">
        <span className="font-mono text-[11px] text-primary uppercase font-semibold block">
          // SYSTEM PREFERENCES
        </span>
        <h1 className="font-headline text-[22px] font-bold text-on-surface">
          {t('settings.title')}
        </h1>
      </div>

      {/* Language / Idioma Section */}
      <section className="p-4 rounded-xl bg-surface-container border border-surface-container-high space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">language</span>
          <h2 className="font-semibold text-[14px] text-on-surface">
            {t('settings.language')}
          </h2>
        </div>
        <p className="text-[12px] text-on-surface-variant">
          {t('settings.languageDesc')}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[12px]">
          <button
            type="button"
            onClick={() => setLanguage('pt-BR')}
            className={`p-3 rounded-lg flex items-center justify-between border transition-all ${
              language === 'pt-BR'
                ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-highest border-surface-container-high'
            }`}
          >
            <span>Português (Brasil)</span>
            {language === 'pt-BR' && (
              <span className="material-symbols-outlined text-[18px]">check</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en-US')}
            className={`p-3 rounded-lg flex items-center justify-between border transition-all ${
              language === 'en-US'
                ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                : 'bg-surface-container-low text-on-surface hover:bg-surface-container-highest border-surface-container-high'
            }`}
          >
            <span>English (US)</span>
            {language === 'en-US' && (
              <span className="material-symbols-outlined text-[18px]">check</span>
            )}
          </button>
        </div>
      </section>

      {/* Local Storage & Backup Section */}
      <section className="p-4 rounded-xl bg-surface-container border border-surface-container-high space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">database</span>
            <h2 className="font-semibold text-[14px] text-on-surface">
              {t('settings.dataAndBackup')}
            </h2>
          </div>
          <span className="font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            OFFLINE READY
          </span>
        </div>
        <p className="text-[12px] text-on-surface-variant">
          {t('settings.dataDesc')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleExportBackup}
            className="h-11 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>{t('settings.exportBackup')}</span>
          </button>

          <label className="h-11 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary font-semibold text-[13px] flex items-center justify-center gap-1.5 border border-secondary/20 cursor-pointer active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[18px]">file_upload</span>
            <span>{t('settings.importBackup')}</span>
            <input type="file" accept=".json,.3dcp" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        <div className="pt-2 border-t border-surface-container-high/60 flex items-center justify-between">
          <span className="text-[12px] text-outline font-mono">{t('settings.dangerZone')}</span>
          <button
            type="button"
            onClick={handleFactoryReset}
            className="text-[12px] text-red-400 hover:text-red-300 font-mono underline"
          >
            {t('settings.factoryReset')}
          </button>
        </div>
      </section>

      {/* About Developer & Technical Specifications */}
      <section className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3 shadow-md">
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <h2 className="font-headline text-[16px] font-bold text-on-surface">
              3D Calibration Pro
            </h2>
            <p className="font-mono text-[11px] text-primary">
              v1.0.0 Pro • Offline Native Engine
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-[12px] text-on-surface-variant leading-relaxed">
          <p>
            Ferramenta profissional e autônoma de metrologia e calibração fina de parâmetros para impressoras 3D FDM/FFF e fatiadores (Flash Studio, OrcaSlicer, Bambu Studio).
          </p>
          <p className="font-mono text-[11px] text-secondary">
            Cálculos executados deterministicamente com fórmulas físicas (sem dependência de nuvem).
          </p>
        </div>

        <div className="p-3 rounded-lg bg-surface-container border border-surface-container-high space-y-1 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-outline uppercase">{t('settings.developer')}:</span>
            <span className="text-on-surface font-semibold">Alex Fabiano Longo</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline uppercase">{t('settings.contact')}:</span>
            <a href="mailto:alex.tecinforp@gmail.com" className="text-primary hover:underline font-semibold">
              alex.tecinforp@gmail.com
            </a>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-outline uppercase">Target Runtime:</span>
            <span className="text-secondary">PWA / Web & Android (Capacitor)</span>
          </div>
        </div>
      </section>

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
