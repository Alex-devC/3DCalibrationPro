import React, { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { FilamentProfile } from '../types/index.ts';
import { db } from '../data/storage.ts';
import { useSortableData } from '../hooks/useSortableData.ts';
import { SortableHeader } from '../components/common/SortableHeader.tsx';
import { AdBanner } from '../components/AdBanner.tsx';

interface FilamentsManagerViewProps {
  filaments: FilamentProfile[];
  activeFilament: FilamentProfile;
  onSelectFilament: (id: string) => void;
  onRefresh: () => void;
  onBackToCalibrate?: () => void;
}

export const FilamentsManagerView: React.FC<FilamentsManagerViewProps> = ({
  filaments,
  activeFilament,
  onSelectFilament,
  onRefresh,
  onBackToCalibrate,
}) => {
  const { t } = useI18n();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<FilamentProfile | null>(null);

  // Form Fields
  const [formBrand, setFormBrand] = useState('');
  const [formName, setFormName] = useState('');
  const [formMaterial, setFormMaterial] = useState('PETG');
  const [formDiameter, setFormDiameter] = useState('1.75');
  const [formColorName, setFormColorName] = useState('Signal Blue');
  const [formColorHex, setFormColorHex] = useState('#00b4d8');
  const [formNozzleTemp, setFormNozzleTemp] = useState('240');
  const [formBedTemp, setFormBedTemp] = useState('80');
  const [formNotes, setFormNotes] = useState('');

  // Validation & Feedback
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter filaments
  const filteredFilaments = useMemo(() => {
    if (!searchTerm.trim()) return filaments;
    const q = searchTerm.toLowerCase();
    return filaments.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.brand.toLowerCase().includes(q) ||
        f.material.toLowerCase().includes(q) ||
        f.colorName.toLowerCase().includes(q) ||
        (f.notes && f.notes.toLowerCase().includes(q))
    );
  }, [filaments, searchTerm]);

  // Sortable hook
  const { items: sortedFilaments, requestSort, sortState } = useSortableData<FilamentProfile>(
    filteredFilaments,
    'name',
    'asc'
  );

  // Open modal for new filament
  const handleOpenNew = () => {
    setEditingFilament(null);
    setFormBrand('');
    setFormName('');
    setFormMaterial('PETG');
    setFormDiameter('1.75');
    setFormColorName('Preto');
    setFormColorHex('#1a1a1a');
    setFormNozzleTemp('240');
    setFormBedTemp('80');
    setFormNotes('');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing filament
  const handleOpenEdit = (filament: FilamentProfile) => {
    setEditingFilament(filament);
    setFormBrand(filament.brand);
    setFormName(filament.name);
    setFormMaterial(filament.material);
    setFormDiameter(filament.diameter.toString());
    setFormColorName(filament.colorName);
    setFormColorHex(filament.colorHex);
    // Use target or average of range
    const nozzleAvg = filament.recommendedNozzleTempMin
      ? Math.round((filament.recommendedNozzleTempMin + filament.recommendedNozzleTempMax) / 2)
      : 240;
    setFormNozzleTemp(nozzleAvg.toString());
    setFormBedTemp(filament.recommendedBedTemp.toString());
    setFormNotes(filament.notes || '');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Save form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validations
    if (!formBrand.trim()) {
      setValidationError(t('filaments.validationBrand'));
      return;
    }
    if (!formName.trim()) {
      setValidationError(t('filaments.validationName'));
      return;
    }

    const diaVal = parseFloat(formDiameter);
    if (isNaN(diaVal) || diaVal <= 0) {
      setValidationError(t('filaments.validationDiameter'));
      return;
    }

    const nozzleVal = parseInt(formNozzleTemp, 10);
    const bedVal = parseInt(formBedTemp, 10);
    if (isNaN(nozzleVal) || nozzleVal <= 100 || isNaN(bedVal) || bedVal < 0) {
      setValidationError(t('filaments.validationTemp'));
      return;
    }

    const filamentData: FilamentProfile = {
      id: editingFilament ? editingFilament.id : `filament-${Date.now()}`,
      brand: formBrand.trim(),
      name: formName.trim(),
      material: formMaterial.trim(),
      subType: formMaterial.trim(),
      diameter: diaVal,
      colorName: formColorName.trim() || 'Padrão',
      colorHex: formColorHex,
      recommendedNozzleTempMin: Math.max(150, nozzleVal - 10),
      recommendedNozzleTempMax: nozzleVal + 10,
      recommendedBedTemp: bedVal,
      notes: formNotes.trim() || undefined,
      isDefault: editingFilament ? editingFilament.isDefault : false,
    };

    db.saveFilament(filamentData);

    // If new spool or currently active, select it
    if (!editingFilament) {
      db.setActiveRig(undefined, undefined, filamentData.id);
      onSelectFilament(filamentData.id);
    }

    setIsModalOpen(false);
    onRefresh();
    showToast(t('filaments.savedSuccess'));
  };

  // Handle active selection
  const handleSetActive = (filament: FilamentProfile) => {
    db.setActiveRig(undefined, undefined, filament.id);
    onSelectFilament(filament.id);
    showToast(`${filament.name}: ${t('filaments.activatedSuccess')}`);
  };

  // Handle delete
  const handleDelete = (filament: FilamentProfile) => {
    const check = db.canDeleteFilament(filament.id);
    if (!check.canDelete) {
      alert(check.reason || t('filaments.cannotDelete'));
      return;
    }

    if (window.confirm(`${t('filaments.deleteConfirm')} (${filament.name})`)) {
      db.deleteFilament(filament.id);
      onRefresh();
      showToast(t('filaments.deletedSuccess'));
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-4 space-y-5 pt-2 pb-32">
      {/* Return to Calibration Banner if user arrived from calibrate step */}
      {onBackToCalibrate && (
        <button
          type="button"
          onClick={onBackToCalibrate}
          className="self-start px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-primary font-mono text-[12px] flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>{t('filaments.backToCalibrate')}</span>
        </button>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-mono text-[11px] text-primary uppercase font-semibold tracking-wider block">
            // SPOOL METROLOGY • FILAMENTS
          </span>
          <h1 className="font-headline text-[24px] font-bold text-on-surface">
            {t('filaments.title')}
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            {t('filaments.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="h-11 px-4 rounded-xl bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{t('filaments.addFilament')}</span>
        </button>
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
            placeholder={t('filaments.searchPlaceholder')}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest font-mono text-[12px] text-on-surface placeholder-outline focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-right">
          <span className="font-mono text-[11px] text-outline bg-surface-container-high px-2.5 py-1 rounded">
            {t('filaments.totalConfigured', { count: filteredFilaments.length })}
          </span>
        </div>
      </div>

      {/* Active Spool Spotlight Banner */}
      {activeFilament && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-secondary/10 via-surface-container to-surface-container border border-secondary/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0"
              style={{
                backgroundColor: `${activeFilament.colorHex}25`,
                borderColor: `${activeFilament.colorHex}60`,
                color: activeFilament.colorHex,
              }}
            >
              <span className="material-symbols-outlined text-[26px]">grain</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-mono text-[10px] font-bold tracking-wider">
                  {t('filaments.activeSpool')}
                </span>
                <span className="font-mono text-[11px] text-on-surface-variant">
                  {activeFilament.brand}
                </span>
              </div>
              <h2 className="font-headline text-[18px] font-bold text-on-surface flex items-center gap-2">
                <span>{activeFilament.name}</span>
                <span
                  className="w-3 h-3 rounded-full inline-block border border-white/20"
                  style={{ backgroundColor: activeFilament.colorHex }}
                />
              </h2>
              <p className="font-mono text-[11px] text-on-surface-variant">
                Material: {activeFilament.material} • {activeFilament.diameter.toFixed(2)}mm • Bico: {activeFilament.recommendedNozzleTempMin}-{activeFilament.recommendedNozzleTempMax}°C • Mesa: {activeFilament.recommendedBedTemp}°C
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenEdit(activeFilament)}
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
                <SortableHeader<FilamentProfile>
                  sortKey="brand"
                  label={t('filaments.brand')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<FilamentProfile>
                  sortKey="name"
                  label={t('filaments.name')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<FilamentProfile>
                  sortKey="material"
                  label={t('filaments.material')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<FilamentProfile>
                  sortKey="diameter"
                  label={t('filaments.diameter')}
                  sortState={sortState}
                  onSort={requestSort}
                  align="right"
                />
                <th scope="col" className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline">
                  {t('filaments.color')}
                </th>
                <SortableHeader<FilamentProfile>
                  sortKey="recommendedNozzleTempMin"
                  label={t('filaments.nozzleTemp')}
                  sortState={sortState}
                  onSort={requestSort}
                  align="center"
                />
                <SortableHeader<FilamentProfile>
                  sortKey="recommendedBedTemp"
                  label={t('filaments.bedTemp')}
                  sortState={sortState}
                  onSort={requestSort}
                  align="center"
                />
                <th scope="col" className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline text-right">
                  {t('history.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {sortedFilaments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center font-mono text-[12px] text-outline">
                    {t('filaments.noFilamentsFound')}
                  </td>
                </tr>
              ) : (
                sortedFilaments.map((filament) => {
                  const isActive = activeFilament.id === filament.id;
                  const targetNozzle = Math.round(
                    (filament.recommendedNozzleTempMin + filament.recommendedNozzleTempMax) / 2
                  );

                  return (
                    <tr
                      key={filament.id}
                      className={`hover:bg-surface-container-high/40 transition-colors ${
                        isActive ? 'bg-secondary/5' : ''
                      }`}
                    >
                      {/* Brand */}
                      <td className="px-3 py-3.5 font-medium text-[13px] text-on-surface">
                        {filament.brand}
                      </td>

                      {/* Name & Active Badge */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[14px] text-on-surface">
                            {filament.name}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-mono text-[9px] font-bold">
                              ATIVO
                            </span>
                          )}
                        </div>
                        {filament.notes && (
                          <span className="text-[11px] text-outline font-mono truncate max-w-xs block">
                            {filament.notes}
                          </span>
                        )}
                      </td>

                      {/* Material */}
                      <td className="px-3 py-3.5 font-mono text-[12px] text-primary font-semibold">
                        {filament.material}
                      </td>

                      {/* Diameter */}
                      <td className="px-3 py-3.5 text-right font-mono text-[12px] text-on-surface-variant">
                        {filament.diameter.toFixed(2)} mm
                      </td>

                      {/* Color */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2 font-mono text-[12px]">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: filament.colorHex }}
                          />
                          <span className="truncate max-w-[100px]">{filament.colorName}</span>
                        </div>
                      </td>

                      {/* Nozzle Temp */}
                      <td className="px-3 py-3.5 text-center font-mono text-[12px] text-secondary font-semibold">
                        {targetNozzle}°C
                        <span className="text-[10px] text-outline block">
                          ({filament.recommendedNozzleTempMin}-{filament.recommendedNozzleTempMax})
                        </span>
                      </td>

                      {/* Bed Temp */}
                      <td className="px-3 py-3.5 text-center font-mono text-[12px] text-on-surface-variant">
                        {filament.recommendedBedTemp}°C
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActive(filament)}
                              className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-primary font-mono text-[11px] transition-all"
                              title={t('filaments.setActive')}
                            >
                              {t('filaments.setActive')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(filament)}
                            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-all"
                            title={t('common.edit')}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(filament)}
                            disabled={isActive}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isActive
                                ? 'text-outline/30 cursor-not-allowed'
                                : 'bg-surface-container-high hover:bg-red-500/20 text-red-400'
                            }`}
                            title={isActive ? 'Não pode excluir carretel ativo' : t('common.delete')}
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
          {sortedFilaments.length === 0 ? (
            <div className="p-6 text-center font-mono text-[12px] text-outline">
              {t('filaments.noFilamentsFound')}
            </div>
          ) : (
            sortedFilaments.map((filament) => {
              const isActive = activeFilament.id === filament.id;
              const targetNozzle = Math.round(
                (filament.recommendedNozzleTempMin + filament.recommendedNozzleTempMax) / 2
              );

              return (
                <div
                  key={filament.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isActive ? 'bg-secondary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: filament.colorHex }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-headline font-bold text-[16px] text-on-surface">
                            {filament.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-secondary text-on-secondary font-mono text-[9px] font-bold">
                              ATIVO
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-primary">
                          {filament.brand} • {filament.material} ({filament.colorName})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(filament)}
                        className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(filament)}
                        disabled={isActive}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 ${
                          isActive
                            ? 'text-outline/30 cursor-not-allowed'
                            : 'bg-surface-container-high text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high text-center">
                      <span className="text-outline uppercase text-[9px] block">{t('filaments.diameter')}</span>
                      <span className="font-semibold text-on-surface">{filament.diameter.toFixed(2)}mm</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high text-center">
                      <span className="text-outline uppercase text-[9px] block">BICO</span>
                      <span className="font-semibold text-secondary">{targetNozzle}°C</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high text-center">
                      <span className="text-outline uppercase text-[9px] block">MESA</span>
                      <span className="font-semibold text-on-surface">{filament.recommendedBedTemp}°C</span>
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(filament)}
                      className="w-full h-11 rounded-lg bg-surface-container-high hover:bg-secondary hover:text-on-secondary text-primary font-mono text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{t('filaments.setActive')}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Filament Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveForm}
            className="w-full max-w-lg rounded-2xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div>
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider block">
                  FILAMENT SPOOL PROFILE
                </span>
                <h3 className="font-headline text-[18px] font-bold text-on-surface">
                  {editingFilament ? t('filaments.editFilament') : t('filaments.addFilament')}
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

            {/* Marca & Nome */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.brand')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maxprint, eSun, Polymaker, Bambu Lab"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.name')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PETG, PolyLite PLA Pro, ABS+"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Material & Diâmetro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.material')} *
                </label>
                <select
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="PETG">PETG</option>
                  <option value="PLA">PLA / PLA+</option>
                  <option value="ABS">ABS / ABS+</option>
                  <option value="ASA">ASA</option>
                  <option value="TPU">TPU (Flex)</option>
                  <option value="PC">PC (Policarbonato)</option>
                  <option value="PA">PA / Nylon</option>
                  <option value="PETG-CF">PETG-CF (Fibra de Carbono)</option>
                  <option value="PLA-CF">PLA-CF (Fibra de Carbono)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.diameter')} *
                </label>
                <select
                  value={formDiameter}
                  onChange={(e) => setFormDiameter(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="1.75">1.75 mm (Padrão)</option>
                  <option value="2.85">2.85 mm</option>
                </select>
              </div>
            </div>

            {/* Cor (Nome e Seletor Hex) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.colorName')}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Preto, Azul Sinal, Translúcido..."
                  value={formColorName}
                  onChange={(e) => setFormColorName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.colorHex')}
                </label>
                <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest">
                  <input
                    type="color"
                    value={formColorHex}
                    onChange={(e) => setFormColorHex(e.target.value)}
                    className="w-9 h-8 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[12px] text-on-surface font-semibold">
                    {formColorHex.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Temperaturas Recomendadas (Bico e Mesa) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.nozzleTemp')} *
                </label>
                <input
                  type="number"
                  step="1"
                  min="160"
                  max="350"
                  required
                  value={formNozzleTemp}
                  onChange={(e) => setFormNozzleTemp(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('filaments.bedTemp')} *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="140"
                  required
                  value={formBedTemp}
                  onChange={(e) => setFormBedTemp(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary text-center"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-on-surface">
                {t('filaments.notes')}
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Seco por 6h a 65°C, lote #2026-A, ótima aderência em PEI..."
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
