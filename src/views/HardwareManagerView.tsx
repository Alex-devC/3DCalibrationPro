import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext.tsx';
import { PrinterProfile, FilamentProfile } from '../types/index.ts';
import { db } from '../data/storage.ts';
import { AdBanner } from '../components/AdBanner.tsx';

interface HardwareManagerViewProps {
  initialTab?: 'printers' | 'filaments';
  printers: PrinterProfile[];
  activePrinter: PrinterProfile;
  filaments: FilamentProfile[];
  activeFilament: FilamentProfile;
  onSelectPrinter: (id: string) => void;
  onSelectFilament: (id: string) => void;
  onRefresh: () => void;
}

export const HardwareManagerView: React.FC<HardwareManagerViewProps> = ({
  initialTab = 'printers',
  printers,
  activePrinter,
  filaments,
  activeFilament,
  onSelectPrinter,
  onSelectFilament,
  onRefresh,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'printers' | 'filaments'>(initialTab);

  // Modal forms state
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);

  // New Printer State
  const [newModel, setNewModel] = useState('');
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newNozzle, setNewNozzle] = useState(0.4);
  const [newKinematics, setNewKinematics] = useState<'CORE-XY' | 'BED-SLINGER' | 'DELTA'>('CORE-XY');
  const [newBuildVolume, setNewBuildVolume] = useState(220);

  // New Filament State
  const [newFilamentName, setNewFilamentName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newMaterial, setNewMaterial] = useState<'PLA' | 'PETG' | 'ABS' | 'ASA' | 'TPU' | 'PC'>('PETG');
  const [newColorHex, setNewColorHex] = useState('#00b4d8');
  const [newColorName, setNewColorName] = useState('Signal Blue');
  const [newNozzleMin, setNewNozzleMin] = useState(240);
  const [newNozzleMax, setNewNozzleMax] = useState(255);
  const [newBedTemp, setNewBedTemp] = useState(80);

  const handleSavePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModel.trim()) return;

    const newPrinter: PrinterProfile = {
      id: `printer-${Date.now()}`,
      model: newModel.trim(),
      manufacturer: newManufacturer.trim() || 'Custom',
      nozzleDiameter: newNozzle,
      nozzleMaterial: 'Hardened Steel',
      kinematics: newKinematics,
      buildVolumeX: newBuildVolume,
      buildVolumeY: newBuildVolume,
      buildVolumeZ: newBuildVolume,
      firmware: 'Klipper Compatible',
      mcuSerial: `MCU #${Math.floor(Math.random() * 9000 + 1000)}`,
      notes: 'Custom calibrated workstation',
      isDefault: false,
    };

    db.savePrinter(newPrinter);
    db.setActiveRig(undefined, newPrinter.id, undefined);
    onSelectPrinter(newPrinter.id);
    setIsPrinterModalOpen(false);
    onRefresh();
  };

  const handleSaveFilament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilamentName.trim()) return;

    const newFil: FilamentProfile = {
      id: `filament-${Date.now()}`,
      name: newFilamentName.trim(),
      brand: newBrand.trim() || 'Generic',
      material: newMaterial,
      subType: newMaterial,
      diameter: 1.75,
      colorHex: newColorHex,
      colorName: newColorName || 'Standard',
      recommendedNozzleTempMin: newNozzleMin,
      recommendedNozzleTempMax: newNozzleMax,
      recommendedBedTemp: newBedTemp,
      notes: 'Calibrated spool',
      isDefault: false,
    };

    db.saveFilament(newFil);
    db.setActiveRig(undefined, undefined, newFil.id);
    onSelectFilament(newFil.id);
    setIsFilamentModalOpen(false);
    onRefresh();
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto px-4 space-y-4 pt-2 pb-32">
      {/* View Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="font-mono text-[11px] text-primary uppercase font-semibold block">
            // HARDWARE REPOSITORY
          </span>
          <h1 className="font-headline text-[22px] font-bold text-on-surface">
            {activeTab === 'printers' ? t('nav.printers') : t('nav.filaments')}
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-lg bg-surface-container border border-surface-container-high font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('printers')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'printers'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('nav.printers')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('filaments')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'filaments'
                ? 'bg-primary text-on-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t('nav.filaments')}
          </button>
        </div>
      </div>

      {/* PRINTERS TAB */}
      {activeTab === 'printers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider">
              {printers.length} MACHINES CONFIGURED
            </span>
            <button
              type="button"
              onClick={() => setIsPrinterModalOpen(true)}
              className="h-9 px-3 rounded-lg bg-primary-container text-on-primary-container font-semibold text-[12px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ Add Machine</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {printers.map((printer) => {
              const isActive = activePrinter.id === printer.id;
              return (
                <div
                  key={printer.id}
                  onClick={() => onSelectPrinter(printer.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive
                      ? 'bg-surface-container-high border-primary/60 shadow-md ring-1 ring-primary/40'
                      : 'bg-surface-container hover:bg-surface-container-high border-surface-container-high'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[22px]">precision_manufacturing</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[15px] text-on-surface">{printer.model}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold">
                              ACTIVE RIG
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-on-surface-variant">
                          {printer.kinematics} • {printer.firmware}
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    ) : (
                      <span className="text-[12px] text-secondary font-mono hover:underline">
                        Set Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">NOZZLE</span>
                      <span className="font-semibold text-on-surface">{printer.nozzleDiameter.toFixed(1)}mm</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">VOLUME</span>
                      <span className="font-semibold text-on-surface">{printer.buildVolumeX}³ mm</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">MATERIAL</span>
                      <span className="font-semibold text-primary truncate">{printer.nozzleMaterial || 'Steel'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILAMENTS TAB */}
      {activeTab === 'filaments' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-outline uppercase tracking-wider">
              {filaments.length} SPOOLS IN WORKBENCH
            </span>
            <button
              type="button"
              onClick={() => setIsFilamentModalOpen(true)}
              className="h-9 px-3 rounded-lg bg-primary-container text-on-primary-container font-semibold text-[12px] flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>+ Register Spool</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {filaments.map((filament) => {
              const isActive = activeFilament.id === filament.id;
              return (
                <div
                  key={filament.id}
                  onClick={() => onSelectFilament(filament.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive
                      ? 'bg-surface-container-high border-primary/60 shadow-md ring-1 ring-primary/40'
                      : 'bg-surface-container hover:bg-surface-container-high border-surface-container-high'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-[14px] shadow-sm"
                        style={{ backgroundColor: `${filament.colorHex}22`, color: filament.colorHex }}
                      >
                        <span className="material-symbols-outlined text-[22px]">grain</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[15px] text-on-surface">{filament.name}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold">
                              ACTIVE SPOOL
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: filament.colorHex }}
                          />
                          <span>{filament.colorName} • {filament.material}</span>
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    ) : (
                      <span className="text-[12px] text-secondary font-mono hover:underline">
                        Set Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">DIAMETER</span>
                      <span className="font-semibold text-on-surface">{filament.diameter.toFixed(2)}mm</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">HOTEND</span>
                      <span className="font-semibold text-secondary">{filament.recommendedNozzleTempMin}-{filament.recommendedNozzleTempMax}°C</span>
                    </div>
                    <div className="p-2 rounded bg-surface-container-low border border-surface-container-high">
                      <span className="text-outline uppercase text-[9px] block">BED</span>
                      <span className="font-semibold text-on-surface">{filament.recommendedBedTemp}°C</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADD PRINTER MODAL */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <form
            onSubmit={handleSavePrinter}
            className="w-full max-w-md rounded-xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-4 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-[17px] font-bold text-on-surface">
                {t('calibrate.addNew')}
              </h3>
              <button
                type="button"
                onClick={() => setIsPrinterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold text-on-surface">Model Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Flashforge AD5X, Bambu X1-Carbon, Ender 3"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Manufacturer</label>
                <input
                  type="text"
                  placeholder="e.g. Flashforge"
                  value={newManufacturer}
                  onChange={(e) => setNewManufacturer(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Nozzle (mm)</label>
                <select
                  value={newNozzle}
                  onChange={(e) => setNewNozzle(parseFloat(e.target.value))}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value={0.2}>0.2 mm</option>
                  <option value={0.4}>0.4 mm (Standard)</option>
                  <option value={0.6}>0.6 mm</option>
                  <option value={0.8}>0.8 mm</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Kinematics</label>
                <select
                  value={newKinematics}
                  onChange={(e) => setNewKinematics(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="CORE-XY">Core-XY</option>
                  <option value="BED-SLINGER">Bed-Slinger</option>
                  <option value="DELTA">Delta</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Build Volume (mm³)</label>
                <input
                  type="number"
                  value={newBuildVolume}
                  onChange={(e) => setNewBuildVolume(parseInt(e.target.value) || 220)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrinterModalOpen(false)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface-variant font-semibold text-[13px]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD FILAMENT MODAL */}
      {isFilamentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-container-lowest/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveFilament}
            className="w-full max-w-md rounded-xl bg-surface-container-high border border-surface-container-highest shadow-2xl p-4 space-y-3.5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-[17px] font-bold text-on-surface">
                {t('calibrate.registerFilament')}
              </h3>
              <button
                type="button"
                onClick={() => setIsFilamentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-semibold text-on-surface">Spool Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Maxprint PETG, PolyLite PLA Pro"
                value={newFilamentName}
                onChange={(e) => setNewFilamentName(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Material Type</label>
                <select
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="PETG">PETG</option>
                  <option value="PLA">PLA</option>
                  <option value="ABS">ABS</option>
                  <option value="ASA">ASA</option>
                  <option value="TPU">TPU</option>
                  <option value="PC">PC</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. Maxprint"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Color Spec Name</label>
                <input
                  type="text"
                  placeholder="e.g. Signal Blue"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-surface-container border border-surface-container-highest font-mono text-[13px] text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-on-surface">Color Palette</label>
                <div className="flex items-center gap-2 h-11">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-12 h-10 rounded border-0 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[12px] text-on-surface">{newColorHex}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div>
                <label className="block text-[11px] font-semibold text-on-surface">Nozzle Min °C</label>
                <input
                  type="number"
                  value={newNozzleMin}
                  onChange={(e) => setNewNozzleMin(parseInt(e.target.value) || 200)}
                  className="w-full h-10 px-2 rounded bg-surface-container border border-surface-container-highest text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-on-surface">Nozzle Max °C</label>
                <input
                  type="number"
                  value={newNozzleMax}
                  onChange={(e) => setNewNozzleMax(parseInt(e.target.value) || 260)}
                  className="w-full h-10 px-2 rounded bg-surface-container border border-surface-container-highest text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-on-surface">Bed °C</label>
                <input
                  type="number"
                  value={newBedTemp}
                  onChange={(e) => setNewBedTemp(parseInt(e.target.value) || 70)}
                  className="w-full h-10 px-2 rounded bg-surface-container border border-surface-container-highest text-on-surface"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFilamentModalOpen(false)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface-variant font-semibold text-[13px]"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary font-semibold text-[13px]"
              >
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Ad Reserve */}
      <AdBanner variant="reserve" className="mt-4" />
    </div>
  );
};
