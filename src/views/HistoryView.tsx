import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { CalibrationResult } from '../types/index.ts';
import { db } from '../data/storage.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface HistoryViewProps {
  history: CalibrationResult[];
  onOpenTest: (testType: string) => void;
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onOpenTest, onRefresh }) => {
  const { t } = useI18n();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<CalibrationResult | null>(null);

  const filteredHistory = filterType === 'ALL'
    ? history
    : history.filter((r) => r.testType === filterType);

  const handleExportCSV = () => {
    const csvContent = db.exportHistoryCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `3DCalibrationPro_AuditLog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="font-mono text-[11px] text-primary uppercase font-semibold block">
            // TELEMETRY LOG
          </span>
          <h1 className="font-headline text-[22px] font-bold text-on-surface">
            {t('history.title')}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary font-mono text-[11px] flex items-center gap-1.5 border border-outline-variant/30 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>{t('history.exportCsv')}</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[11px]">
        {['ALL', 'MVS', 'FLOW_RATE', 'TEMP_TOWER', 'RETRACTION', 'PRESSURE_ADVANCE'].map((ft) => (
          <button
            key={ft}
            type="button"
            onClick={() => setFilterType(ft)}
            className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
              filterType === ft
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {ft === 'ALL' ? t('history.filterAll') : ft}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-surface-container border border-surface-container-high text-outline font-mono text-[13px]">
            {t('history.noRecords')}
          </div>
        ) : (
          filteredHistory.map((item) => (
            <article
              key={item.id}
              onClick={() => setSelectedResult(item)}
              className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high hover:border-primary/40 cursor-pointer shadow-sm active:scale-[0.99] transition-all flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {item.testType === 'MVS'
                        ? 'speed'
                        : item.testType === 'FLOW_RATE'
                        ? 'square_foot'
                        : item.testType === 'TEMP_TOWER'
                        ? 'thermostat'
                        : item.testType === 'RETRACTION'
                        ? 'unfold_less'
                        : 'compress'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-[14px] text-on-surface truncate">
                      {item.testName}
                    </h3>
                    <p className="font-mono text-[11px] text-on-surface-variant truncate">
                      {item.printerName} • {item.filamentName}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-[18px] font-bold text-primary">
                    {item.calculatedValue} <span className="text-[11px] text-on-surface-variant font-normal">{item.unit}</span>
                  </div>
                  <span className="font-mono text-[10px] text-outline block">
                    {item.timestamp}
                  </span>
                </div>
              </div>

              {item.notes && (
                <p className="text-[12px] text-on-surface-variant font-mono bg-surface-container-lowest p-2 rounded border border-surface-container-high/60 line-clamp-2">
                  "{item.notes}"
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/60 font-mono text-[10px] text-outline">
                <span>{item.slicerName} Profile</span>
                <span className="text-primary flex items-center gap-1 font-semibold">
                  <span>{t('history.inspectDetails')}</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Result Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-primary uppercase font-bold">
                  {selectedResult.testType} // AUDIT SPECIMEN
                </span>
                <h3 className="font-headline text-[18px] font-bold text-on-surface">
                  {selectedResult.testName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {selectedResult.photoUrl && (
              <div className="w-full h-44 rounded-lg overflow-hidden border border-surface-container-highest">
                <img
                  src={selectedResult.photoUrl}
                  alt="Calibration specimen"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-surface-container border border-surface-container-highest">
                <span className="text-outline uppercase text-[9px] block">{t('history.hardware')}</span>
                <span className="font-semibold text-on-surface text-[12px]">{selectedResult.printerName}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container border border-surface-container-highest">
                <span className="text-outline uppercase text-[9px] block">{t('history.spool')}</span>
                <span className="font-semibold text-secondary text-[12px]">{selectedResult.filamentName}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container border border-surface-container-highest">
                <span className="text-outline uppercase text-[9px] block">{t('history.calculatedValue')}</span>
                <span className="font-bold text-primary text-[15px]">{selectedResult.calculatedValue} {selectedResult.unit}</span>
              </div>
              <div className="p-2.5 rounded bg-surface-container border border-surface-container-highest">
                <span className="text-outline uppercase text-[9px] block">{t('history.slicer')}</span>
                <span className="font-semibold text-on-surface text-[12px]">{selectedResult.slicerName}</span>
              </div>
            </div>

            {selectedResult.formula && (
              <div className="p-2.5 rounded bg-surface-container-lowest font-mono text-[11px] text-on-surface border border-surface-container-highest">
                <span className="text-outline block text-[9px] uppercase">{t('history.deterministicFormula')}</span>
                <code className="text-primary">{selectedResult.formula}</code>
              </div>
            )}

            {selectedResult.notes && (
              <div className="p-2.5 rounded bg-surface-container text-[12px] text-on-surface-variant font-mono">
                <span className="text-outline block text-[9px] uppercase mb-1">{t('history.fieldNotes')}</span>
                "{selectedResult.notes}"
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface font-semibold text-[13px]"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const type = selectedResult.testType;
                  setSelectedResult(null);
                  onOpenTest(type);
                }}
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>{t('history.retestNow')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Ad Reserve */}
      <AdBanner variant="reserve" className="mt-4" />
    </div>
  );
};
