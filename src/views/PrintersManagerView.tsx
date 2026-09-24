import React, { useState, useMemo } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile } from '../types/index.ts';
import { db } from '../data/storage.ts';
import { useSortableData } from '../hooks/useSortableData.ts';
import { SortableHeader } from '../components/common/SortableHeader.tsx';
import { AdBanner } from '../components/AdBanner.tsx';

interface PrintersManagerViewProps {
  printers: PrinterProfile[];
  activePrinter: PrinterProfile;
  onSelectPrinter: (id: string) => void;
  onRefresh: () => void;
  onBackToCalibrate?: () => void;
}

export const PrintersManagerView: React.FC<PrintersManagerViewProps> = ({
  printers,
  activePrinter,
  onSelectPrinter,
  onRefresh,
  onBackToCalibrate,
}) => {
  const { t } = useI18n();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterProfile | null>(null);

  // Form Fields
  const [formManufacturer, setFormManufacturer] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formNozzle, setFormNozzle] = useState('0.4');
  const [formVolX, setFormVolX] = useState('220');
  const [formVolY, setFormVolY] = useState('220');
  const [formVolZ, setFormVolZ] = useState('220');
  const [formFirmware, setFormFirmware] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formKinematics, setFormKinematics] = useState('Core-XY');
  const [formMaterial, setFormMaterial] = useState('Hardened Steel');

  // Validation & Feedback
  const [validationError, setValidationError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter printers
  const filteredPrinters = useMemo(() => {
    if (!searchTerm.trim()) return printers;
    const q = searchTerm.toLowerCase();
    return printers.filter(
      (p) =>
        p.model.toLowerCase().includes(q) ||
        p.manufacturer.toLowerCase().includes(q) ||
        (p.firmware && p.firmware.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [printers, searchTerm]);

  // Sortable hook
  const { items: sortedPrinters, requestSort, sortState } = useSortableData<PrinterProfile>(
    filteredPrinters,
    'model',
    'asc'
  );

  // Open modal for new printer
  const handleOpenNew = () => {
    setEditingPrinter(null);
    setFormManufacturer('');
    setFormModel('');
    setFormNozzle('0.4');
    setFormVolX('220');
    setFormVolY('220');
    setFormVolZ('220');
    setFormFirmware('');
    setFormNotes('');
    setFormKinematics('Core-XY');
    setFormMaterial('Hardened Steel');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing printer
  const handleOpenEdit = (printer: PrinterProfile) => {
    setEditingPrinter(printer);
    setFormManufacturer(printer.manufacturer);
    setFormModel(printer.model);
    setFormNozzle(printer.nozzleDiameter.toString());
    setFormVolX(printer.buildVolumeX.toString());
    setFormVolY(printer.buildVolumeY.toString());
    setFormVolZ(printer.buildVolumeZ.toString());
    setFormFirmware(printer.firmware || '');
    setFormNotes(printer.notes || '');
    setFormKinematics(printer.kinematics || 'Core-XY');
    setFormMaterial(printer.nozzleMaterial || 'Hardened Steel');
    setValidationError(null);
    setIsModalOpen(true);
  };

  // Save form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validations
    if (!formManufacturer.trim()) {
      setValidationError(t('printers.validationManufacturer'));
      return;
    }
    if (!formModel.trim()) {
      setValidationError(t('printers.validationModel'));
      return;
    }

    const nozzleVal = parseFloat(formNozzle);
    if (isNaN(nozzleVal) || nozzleVal <= 0) {
      setValidationError(t('printers.validationNozzle'));
      return;
    }

    const volX = parseFloat(formVolX);
    const volY = parseFloat(formVolY);
    const volZ = parseFloat(formVolZ);
    if (isNaN(volX) || volX <= 0 || isNaN(volY) || volY <= 0 || isNaN(volZ) || volZ <= 0) {
      setValidationError(t('printers.validationVolume'));
      return;
    }

    const printerData: PrinterProfile = {
      id: editingPrinter ? editingPrinter.id : `printer-${Date.now()}`,
      manufacturer: formManufacturer.trim(),
      model: formModel.trim(),
      nozzleDiameter: nozzleVal,
      nozzleMaterial: formMaterial.trim() || undefined,
      kinematics: formKinematics.trim() || undefined,
      buildVolumeX: volX,
      buildVolumeY: volY,
      buildVolumeZ: volZ,
      firmware: formFirmware.trim() || undefined,
      notes: formNotes.trim() || undefined,
      isDefault: editingPrinter ? editingPrinter.isDefault : false,
    };

    db.savePrinter(printerData);

    // If it's a new printer or was already active, make sure it stays / becomes active
    if (!editingPrinter) {
      db.setActiveRig(undefined, printerData.id, undefined);
      onSelectPrinter(printerData.id);
    }

    setIsModalOpen(false);
    onRefresh();
    showToast(t('printers.savedSuccess'));
  };

  // Handle active selection
  const handleSetActive = (printer: PrinterProfile) => {
    db.setActiveRig(undefined, printer.id, undefined);
    onSelectPrinter(printer.id);
    showToast(`${printer.model}: ${t('printers.activatedSuccess')}`);
  };

  // Handle delete
  const handleDelete = (printer: PrinterProfile) => {
    const check = db.canDeletePrinter(printer.id);
    if (!check.canDelete) {
      alert(check.reason || t('printers.cannotDelete'));
      return;
    }

    if (window.confirm(`${t('printers.deleteConfirm')} (${printer.model})`)) {
      db.deletePrinter(printer.id);
      onRefresh();
      showToast(t('printers.deletedSuccess'));
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
          <span>{t('printers.backToCalibrate')}</span>
        </button>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <span className="font-mono text-[11px] text-primary uppercase font-semibold tracking-wider block">
            // HARDWARE REPOSITORY • 3D PRINTERS
          </span>
          <h1 className="font-headline text-[24px] font-bold text-on-surface">
            {t('printers.title')}
          </h1>
          <p className="text-[13px] text-on-surface-variant">
            {t('printers.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="h-11 px-4 rounded-xl bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all hover:bg-primary/90 shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{t('printers.addPrinter')}</span>
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
            placeholder={t('printers.searchPlaceholder')}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest font-mono text-[12px] text-on-surface placeholder-outline focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-right">
          <span className="font-mono text-[11px] text-outline bg-surface-container-high px-2.5 py-1 rounded">
            {t('printers.totalConfigured', { count: filteredPrinters.length })}
          </span>
        </div>
      </div>

      {/* Active Machine Spotlight Banner */}
      {activePrinter && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-surface-container to-surface-container border border-primary/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shrink-0">
              <span className="material-symbols-outlined text-[26px]">precision_manufacturing</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-[10px] font-bold tracking-wider">
                  {t('printers.activeMachine')}
                </span>
                <span className="font-mono text-[11px] text-secondary">
                  {activePrinter.manufacturer}
                </span>
              </div>
              <h2 className="font-headline text-[18px] font-bold text-on-surface">
                {activePrinter.model}
              </h2>
              <p className="font-mono text-[11px] text-on-surface-variant">
                Bico: {activePrinter.nozzleDiameter.toFixed(1)}mm • Volume: {activePrinter.buildVolumeX}×{activePrinter.buildVolumeY}×{activePrinter.buildVolumeZ}mm • {activePrinter.kinematics || 'Core-XY'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenEdit(activePrinter)}
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
                <SortableHeader<PrinterProfile>
                  sortKey="manufacturer"
                  label={t('printers.manufacturer')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<PrinterProfile>
                  sortKey="model"
                  label={t('printers.model')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <SortableHeader<PrinterProfile>
                  sortKey="nozzleDiameter"
                  label={t('printers.nozzleDiameter')}
                  sortState={sortState}
                  onSort={requestSort}
                  align="right"
                />
                <SortableHeader<PrinterProfile>
                  sortKey="buildVolumeX"
                  label={t('printers.volume')}
                  sortState={sortState}
                  onSort={requestSort}
                  align="center"
                />
                <SortableHeader<PrinterProfile>
                  sortKey="firmware"
                  label={t('printers.firmware')}
                  sortState={sortState}
                  onSort={requestSort}
                />
                <th scope="col" className="px-3 py-3 font-mono text-[11px] uppercase tracking-wider text-outline text-right">
                  {t('history.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {sortedPrinters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-mono text-[12px] text-outline">
                    {t('printers.noPrintersFound')}
                  </td>
                </tr>
              ) : (
                sortedPrinters.map((printer) => {
                  const isActive = activePrinter.id === printer.id;
                  return (
                    <tr
                      key={printer.id}
                      className={`hover:bg-surface-container-high/40 transition-colors ${
                        isActive ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Manufacturer */}
                      <td className="px-3 py-3.5 font-medium text-[13px] text-on-surface">
                        {printer.manufacturer}
                      </td>

                      {/* Model & Status */}
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[14px] text-on-surface">
                            {printer.model}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono text-[9px] font-bold">
                              ATIVA
                            </span>
                          )}
                        </div>
                        {printer.notes && (
                          <span className="text-[11px] text-outline font-mono truncate max-w-xs block">
                            {printer.notes}
                          </span>
                        )}
                      </td>

                      {/* Nozzle */}
                      <td className="px-3 py-3.5 text-right font-mono text-[13px] text-secondary font-semibold">
                        {printer.nozzleDiameter.toFixed(1)} mm
                      </td>

                      {/* Volume */}
                      <td className="px-3 py-3.5 text-center font-mono text-[12px] text-on-surface-variant">
                        {printer.buildVolumeX} × {printer.buildVolumeY} × {printer.buildVolumeZ} mm
                      </td>

                      {/* Firmware */}
                      <td className="px-3 py-3.5 font-mono text-[11px] text-outline truncate max-w-[150px]">
                        {printer.firmware || '—'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleSetActive(printer)}
                              className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-secondary font-mono text-[11px] transition-all"
                              title={t('printers.setActive')}
                            >
                              {t('printers.setActive')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(printer)}
                            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface flex items-center justify-center transition-all"
                            title={t('common.edit')}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(printer)}
                            disabled={isActive}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isActive
                                ? 'text-outline/30 cursor-not-allowed'
                                : 'bg-surface-container-high hover:bg-red-500/20 text-red-400'
                            }`}
                            title={isActive ? 'Não pode excluir máquina ativa' : t('common.delete')}
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
          {sortedPrinters.length === 0 ? (
            <div className="p-6 text-center font-mono text-[12px] text-outline">
              {t('printers.noPrintersFound')}
            </div>
          ) : (
            sortedPrinters.map((printer) => {
              const isActive = activePrinter.id === printer.id;
              return (
                <div
                  key={printer.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isActive ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-[16px] text-on-surface">
                          {printer.model}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded bg-primary text-on-primary font-mono text-[9px] font-bold">
                            ATIVA
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-secondary">
                        {printer.manufacturer}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(printer)}
                        className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(printer)}
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

                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">{t('printers.nozzleDiameter')}</span>
                      <span className="font-semibold text-secondary">{printer.nozzleDiameter.toFixed(1)} mm</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">{t('printers.volume')}</span>
                      <span className="font-semibold text-on-surface">{printer.buildVolumeX}×{printer.buildVolumeY}×{printer.buildVolumeZ}</span>
                    </div>
                  </div>

                  {printer.firmware && (
                    <div className="font-mono text-[10px] text-outline truncate">
                      Firmware: {printer.firmware}
                    </div>
                  )}

                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleSetActive(printer)}
                      className="w-full h-11 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-secondary font-mono text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>{t('printers.setActive')}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Printer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveForm}
            className="w-full max-w-lg rounded-2xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-highest">
              <div>
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider block">
                  3D PRINTER HARDWARE SPEC
                </span>
                <h3 className="font-headline text-[18px] font-bold text-on-surface">
                  {editingPrinter ? t('printers.editPrinter') : t('printers.addPrinter')}
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

            {/* Fabricante & Modelo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('printers.manufacturer')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Flashforge, Creality, Bambu Lab, Voron"
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('printers.model')} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AD5X, Ender 3 V3, X1-Carbon, 2.4r2"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Diâmetro do Bico & Cinemática */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  {t('printers.nozzleDiameter')} *
                </label>
                <select
                  value={formNozzle}
                  onChange={(e) => setFormNozzle(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="0.2">0.2 mm</option>
                  <option value="0.4">0.4 mm (Padrão)</option>
                  <option value="0.6">0.6 mm</option>
                  <option value="0.8">0.8 mm</option>
                  <option value="1.0">1.0 mm</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-semibold text-on-surface">
                  Cinemática
                </label>
                <select
                  value={formKinematics}
                  onChange={(e) => setFormKinematics(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Core-XY">Core-XY</option>
                  <option value="Bed-Slinger">Bed-Slinger (Cartesiana)</option>
                  <option value="Delta">Delta</option>
                </select>
              </div>
            </div>

            {/* Volume de Impressão X, Y, Z */}
            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-on-surface">
                {t('printers.volume')} (mm) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="font-mono text-[10px] text-outline block mb-0.5">X</span>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    required
                    value={formVolX}
                    onChange={(e) => setFormVolX(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface text-center focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-outline block mb-0.5">Y</span>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    required
                    value={formVolY}
                    onChange={(e) => setFormVolY(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface text-center focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <span className="font-mono text-[10px] text-outline block mb-0.5">Z</span>
                  <input
                    type="number"
                    step="1"
                    min="50"
                    required
                    value={formVolZ}
                    onChange={(e) => setFormVolZ(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface text-center focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Firmware (Opcional) */}
            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-on-surface">
                {t('printers.firmware')}
              </label>
              <input
                type="text"
                placeholder="Ex: Klipper v0.12, Marlin 2.1.2, RepRap, PrusaFW"
                value={formFirmware}
                onChange={(e) => setFormFirmware(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Observações (Opcional) */}
            <div className="space-y-1">
              <label className="block text-[12px] font-semibold text-on-surface">
                {t('printers.notes')}
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Mesa PEI texturizada, bico bi-metal montado, gabinete fechado..."
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
