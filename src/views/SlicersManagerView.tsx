import React, { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { SlicerProfile, SlicerId } from '../types/index.ts';
import { db } from '../data/storage.ts';
import { slicerAdaptersMap } from '../slicers/adapters.ts';
import { useSortableData } from '../hooks/useSortableData.ts';
import { SortableHeader } from '../components/common/SortableHeader.tsx';
import { AdBanner } from '../components/AdBanner.tsx';

interface SlicersManagerViewProps {
  slicers: SlicerProfile[];
  activeSlicer: SlicerProfile;
  onSelectSlicer: (id: SlicerId) => void;
  onRefresh?: () => void;
}

export const SlicersManagerView: React.FC<SlicersManagerViewProps> = ({
  slicers,
  activeSlicer,
  onSelectSlicer,
  onRefresh,
}) => {
  const { t } = useI18n();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlicer, setEditingSlicer] = useState<SlicerProfile | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formId, setFormId] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAdapterId, setFormAdapterId] = useState('flash-studio');

  // Validation & Feedback
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter slicers
  const filteredSlicers = useMemo(() => {
    if (!searchTerm.trim()) return slicers;
    const q = searchTerm.toLowerCase();
    return slicers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.version && s.version.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    );
  }, [slicers, searchTerm]);

  // Sortable hook
  const { items: sortedSlicers, requestSort, sortState } = useSortableData<SlicerProfile>(
    filteredSlicers,
    'name',
    'asc'
  );

  // Open modal for new custom slicer
  const handleOpenNew = () => {
    setEditingSlicer(null);
    setFormName('');
    setFormId(`slicer-${Date.now().toString(36)}`);
    setFormVersion('');
    setFormNotes('');
    setFormAdapterId('flash-studio');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing slicer
  const handleOpenEdit = (slicer: SlicerProfile) => {
    setEditingSlicer(slicer);
    setFormName(slicer.name);
    setFormId(slicer.id);
    setFormVersion(slicer.version || '');
    setFormNotes(slicer.notes || '');
    setFormAdapterId(slicer.adapterId || slicer.id);
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Save form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formName.trim()) {
      setValidationError(t('slicers.validationName'));
      return;
    }
    if (!formId.trim()) {
      setValidationError(t('slicers.validationId'));
      return;
    }

    const slicerData: SlicerProfile = {
      id: editingSlicer ? editingSlicer.id : formId.trim().toLowerCase().replace(/\s+/g, '-'),
      name: formName.trim(),
      version: formVersion.trim() || undefined,
      notes: formNotes.trim() || undefined,
      badge: editingSlicer?.badge || 'CUSTOM',
      icon: editingSlicer?.icon || 'integration_instructions',
      isLocked: editingSlicer ? editingSlicer.isLocked : false,
      isDefault: editingSlicer ? editingSlicer.isDefault : false,
      adapterId: formAdapterId,
      fileExtension: editingSlicer?.fileExtension || '.json',
      supportsNativePA: editingSlicer?.supportsNativePA || false,
    };

    db.saveSlicer(slicerData);

    if (!editingSlicer) {
      db.setActiveRig(slicerData.id, undefined, undefined);
      onSelectSlicer(slicerData.id);
    }

    setIsModalOpen(false);
    onRefresh?.();
    showToast(t('slicers.savedSuccess'));
  };

  // Handle active selection
  const handleSetActive = (slicer: SlicerProfile) => {
    db.setActiveRig(slicer.id, undefined, undefined);
    onSelectSlicer(slicer.id);
    showToast(`${slicer.name}: ${t('slicers.activatedSuccess')}`);
  };

  // Handle delete
  const handleDelete = (slicer: SlicerProfile) => {
    const check = db.canDeleteSlicer(slicer.id);
    if (!check.canDelete) {
      alert(check.reason || t('slicers.cannotDelete'));
      return;
    }

    if (window.confirm(`${t('slicers.deleteConfirm')} (${slicer.name})`)) {
      db.deleteSlicer(slicer.id);
      onRefresh?.();
      showToast(t('slicers.deletedSuccess'));
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 space-y-5 pt-2 pb-32">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-mono text-[11px] text-primary uppercase font-semibold tracking-wider block">
            // {t('slicers.title').toUpperCase()}
          </span>
          <h1 className="font-headline text-[24px] font-bold text-on-surface">
            {t('slicers.title')}
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            {t('slicers.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="h-11 px-4 rounded-xl bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{t('slicers.addSlicer')}</span>
        </button>
      </div>

      {/* Explanatory note */}
      <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high font-mono text-[11px] text-on-surface-variant leading-relaxed">
        <div className="flex items-center gap-2 text-primary font-semibold text-[12px] mb-1">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>{t('slicers.architectureTitle')}</span>
        </div>
        {t('slicers.architectureDesc')}
      </div>

      {/* Search & Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container border border-surface-container-high">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('slicers.searchPlaceholder')}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest font-mono text-[12px] text-on-surface placeholder-outline focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-right">
          <span className="font-mono text-[11px] text-outline bg-surface-container-high px-2.5 py-1 rounded">
            {t('slicers.totalConfigured', { count: filteredSlicers.length })}
          </span>
        </div>
      </div>

      {/* Active Slicer Spotlight Banner */}
      {activeSlicer && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-surface-container to-surface-container border border-primary/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
              <span className="material-symbols-outlined text-[26px]">
                {activeSlicer.icon || 'data_object'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-[10px] font-bold tracking-wider">
                  {t('slicers.activeSlicer')}
                </span>
                <span className="font-mono text-[11px] text-secondary">
                  ID: {activeSlicer.id}
                </span>
              </div>
              <h2 className="font-headline text-[18px] font-bold text-on-surface">
                {activeSlicer.name}
              </h2>
              <p className="font-mono text-[11px] text-on-surface-variant">
                {t('slicers.version')}: {activeSlicer.version || 'Universal'} • {t('slicers.adapter')}: {activeSlicer.adapterId || activeSlicer.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenEdit(activeSlicer)}
            className="h-9 px-3 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-mono text-[11px] flex items-center gap-1.5 border border-outline-variant/30 active:scale-95 transition-all self-end sm:self-center"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>{t('common.edit')}</span>
          </button>
        </div>
      )}

      {/* Responsive Table / Cards */}
      <div className="rounded-xl border border-surface-container-high bg-surface-container overflow-hidden shadow-sm">
        {/* Desktop / Tablet View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container-high bg-surface-container-low">
                <SortableHeader<SlicerProfile>
                  sortKey="name"
                  label={t('slicers.name')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<SlicerProfile>
                  sortKey="id"
                  label={t('slicers.identifier')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<SlicerProfile>
                  sortKey="version"
                  label={t('slicers.version')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <th scope="col" className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline">
                  {t('slicers.adapter')}
                </th>
                <th scope="col" className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline">
                  {t('slicers.status')}
                </th>
                <th scope="col" className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline text-right">
                  {t('history.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {sortedSlicers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-mono text-[12px] text-outline">
                    {t('slicers.noSlicersFound')}
                  </td>
                </tr>
              ) : (
                sortedSlicers.map((slicer) => {
                  const isActive = activeSlicer.id === slicer.id;
                  const adapterKey = slicer.adapterId || slicer.id;
                  const adapter = slicerAdaptersMap[adapterKey] || slicerAdaptersMap['flash-studio'];

                  return (
                    <tr
                      key={slicer.id}
                      className={`hover:bg-surface-container-high/40 transition-colors ${
                        isActive ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Name & Icon */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[20px] text-primary shrink-0">
                            {slicer.icon || 'data_object'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[14px] text-on-surface">
                                {slicer.name}
                              </span>
                              {slicer.isLocked && (
                                <span className="material-symbols-outlined text-[14px] text-outline" title={t('slicers.systemDefault')}>
                                  lock
                                </span>
                              )}
                            </div>
                            {slicer.notes && (
                              <span className="text-[11px] text-outline font-mono truncate max-w-xs block">
                                {slicer.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Identifier */}
                      <td className="px-3 py-3.5 font-mono text-[12px] text-on-surface-variant">
                        {slicer.id}
                      </td>

                      {/* Version */}
                      <td className="px-3 py-3.5 font-mono text-[12px] text-outline">
                        {slicer.version || 'v1.x+'}
                      </td>

                      {/* Adapter */}
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-[11px] text-secondary bg-surface-container-lowest px-2 py-1 rounded border border-surface-container-highest">
                          {adapter ? adapter.name : slicer.adapterId || 'Standard'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5">
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold">
                            {t('slicers.active')}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-outline">
                            {t('slicers.available')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActive(slicer)}
                              className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-secondary font-mono text-[11px] transition-all"
                              title={t('slicers.setActive')}
                            >
                              {t('slicers.setActive')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(slicer)}
                            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-all"
                            title={t('common.edit')}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(slicer)}
                            disabled={slicer.isLocked || isActive}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              slicer.isLocked || isActive
                                ? 'text-outline/30 cursor-not-allowed'
                                : 'bg-surface-container-high hover:bg-red-500/20 text-red-400'
                            }`}
                            title={
                              slicer.isLocked
                                ? t('slicers.cannotDeleteProtected')
                                : isActive
                                ? t('slicers.cannotDeleteActive')
                                : t('common.delete')
                            }
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-surface-container-high">
          {sortedSlicers.length === 0 ? (
            <div className="p-6 text-center font-mono text-[12px] text-outline">
              {t('slicers.noSlicersFound')}
            </div>
          ) : (
            sortedSlicers.map((slicer) => {
              const isActive = activeSlicer.id === slicer.id;

              return (
                <div
                  key={slicer.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isActive ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {slicer.icon || 'data_object'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-headline font-bold text-[16px] text-on-surface">
                            {slicer.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-[9px] font-bold">
                              {t('slicers.active')}
                            </span>
                          )}
                          {slicer.isLocked && (
                            <span className="material-symbols-outlined text-[14px] text-outline" title={t('slicers.systemDefault')}>
                              lock
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-outline">
                          ID: {slicer.id} • {slicer.version || 'v1.x'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(slicer)}
                        className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(slicer)}
                        disabled={slicer.isLocked || isActive}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 ${
                          slicer.isLocked || isActive
                            ? 'text-outline/30 cursor-not-allowed'
                            : 'bg-surface-container-high text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {slicer.notes && (
                    <p className="font-mono text-[11px] text-on-surface-variant bg-surface-container-lowest p-2 rounded border border-surface-container-highest">
                      {slicer.notes}
                    </p>
                  )}

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(slicer)}
                      className="w-full h-11 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-secondary font-mono text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{t('slicers.setActive')}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Slicer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveForm}
            className="w-full max-w-lg rounded-2xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div>
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider block">
                  {t('slicers.title').toUpperCase()}
                </span>
                <h3 className="font-headline text-[18px] font-bold text-on-surface">
                  {editingSlicer ? t('slicers.editSlicer') : t('slicers.addSlicer')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Validation alert */}
            {validationError && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 font-mono text-[12px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-red-400">warning</span>
                <span>{validationError}</span>
              </div>
            )}

            {/* Nome & ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('slicers.name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Flash Studio, OrcaSlicer, PrusaSlicer"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('slicers.identifier')} *
                </label>
                <input
                  type="text"
                  disabled={!!editingSlicer?.isLocked}
                  placeholder="Ex: prusa-slicer"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary disabled:opacity-50"
                />
              </div>
            </div>

            {/* Versão & Adapter Associado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('slicers.version')}
                </label>
                <input
                  type="text"
                  placeholder="Ex: v5.8.4, v2.1.0"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('slicers.adapter')}
                </label>
                <select
                  value={formAdapterId}
                  onChange={(e) => setFormAdapterId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="flash-studio">Flash Studio Adapter (G-Code Injetado)</option>
                  <option value="orca-slicer">OrcaSlicer Adapter (Compatível)</option>
                  <option value="bambu-studio">Bambu Studio Adapter (Compatível)</option>
                  <option value="custom-post">Custom Post-Processor</option>
                </select>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-on-surface">
                {t('slicers.notes')}
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Utilizar perfil de alta velocidade, Pressure Advance inserido via M900 no Start G-code..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full p-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[12px] text-on-surface focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface-variant font-semibold text-[13px] active:scale-95 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-semibold text-[13px] active:scale-95 transition-all shadow-md shadow-primary/20"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ad Reserve Banner */}
      <AdBanner variant="reserve" className="mt-4" />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-on-primary font-mono text-[12px] shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
