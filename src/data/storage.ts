import { 
  PrinterProfile, 
  FilamentProfile, 
  SlicerProfile, 
  CalibrationItem, 
  CalibrationResult, 
  MasterProfile, 
  AppSettings,
  SlicerId
} from '../types/index.ts';
import { 
  initialPrinters, 
  initialFilaments, 
  initialSlicers, 
  initialCalibrationItems, 
  initialResultsHistory, 
  initialMasterProfile, 
  initialSettings 
} from './initialData.ts';

const KEYS = {
  PRINTERS: '3dcp_printers_v1',
  FILAMENTS: '3dcp_filaments_v1',
  SLICERS: '3dcp_slicers_v1',
  CALIBRATION_ITEMS: '3dcp_cal_items_v1',
  RESULTS_HISTORY: '3dcp_results_v1',
  MASTER_PROFILE: '3dcp_master_profile_v1',
  SETTINGS: '3dcp_settings_v1',
};

// In-memory cache
class DataRepository {
  private listeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`[3DCP DataLayer] Storage read error on ${key}:`, e);
    }
    return fallback;
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[3DCP DataLayer] Storage write error on ${key}:`, e);
    }
    this.notify();
  }

  // Slicers
  public getSlicers(): SlicerProfile[] {
    return this.getItem(KEYS.SLICERS, initialSlicers);
  }

  // Printers
  public getPrinters(): PrinterProfile[] {
    return this.getItem(KEYS.PRINTERS, initialPrinters);
  }

  public getActivePrinter(): PrinterProfile {
    const settings = this.getSettings();
    const printers = this.getPrinters();
    return printers.find((p) => p.id === settings.activePrinterId) || printers[0] || initialPrinters[0];
  }

  public savePrinter(printer: PrinterProfile): void {
    const printers = this.getPrinters();
    const index = printers.findIndex((p) => p.id === printer.id);
    if (index >= 0) {
      printers[index] = printer;
    } else {
      printers.push(printer);
    }
    this.setItem(KEYS.PRINTERS, printers);
  }

  public deletePrinter(id: string): void {
    const printers = this.getPrinters().filter((p) => p.id !== id);
    this.setItem(KEYS.PRINTERS, printers);
  }

  // Filaments
  public getFilaments(): FilamentProfile[] {
    return this.getItem(KEYS.FILAMENTS, initialFilaments);
  }

  public getActiveFilament(): FilamentProfile {
    const settings = this.getSettings();
    const filaments = this.getFilaments();
    return filaments.find((f) => f.id === settings.activeFilamentId) || filaments[0] || initialFilaments[0];
  }

  public saveFilament(filament: FilamentProfile): void {
    const filaments = this.getFilaments();
    const index = filaments.findIndex((f) => f.id === filament.id);
    if (index >= 0) {
      filaments[index] = filament;
    } else {
      filaments.push(filament);
    }
    this.setItem(KEYS.FILAMENTS, filaments);
  }

  public deleteFilament(id: string): void {
    const filaments = this.getFilaments().filter((f) => f.id !== id);
    this.setItem(KEYS.FILAMENTS, filaments);
  }

  // Calibration Items
  public getCalibrationItems(): CalibrationItem[] {
    return this.getItem(KEYS.CALIBRATION_ITEMS, initialCalibrationItems);
  }

  public updateCalibrationItem(item: Partial<CalibrationItem> & { id: string }): void {
    const items = this.getCalibrationItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
      this.setItem(KEYS.CALIBRATION_ITEMS, items);
    }
  }

  // History & Audit Log
  public getResultsHistory(): CalibrationResult[] {
    return this.getItem(KEYS.RESULTS_HISTORY, initialResultsHistory);
  }

  public addCalibrationResult(result: CalibrationResult): void {
    const history = this.getResultsHistory();
    history.unshift(result);
    this.setItem(KEYS.RESULTS_HISTORY, history);
  }

  // Master Profile
  public getMasterProfile(): MasterProfile {
    return this.getItem(KEYS.MASTER_PROFILE, initialMasterProfile);
  }

  public updateMasterProfile(profile: Partial<MasterProfile>): void {
    const current = this.getMasterProfile();
    const updated = { ...current, ...profile, updatedAt: new Date().toISOString() };
    this.setItem(KEYS.MASTER_PROFILE, updated);
  }

  // Settings
  public getSettings(): AppSettings {
    return this.getItem(KEYS.SETTINGS, initialSettings);
  }

  public updateSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    this.setItem(KEYS.SETTINGS, { ...current, ...settings });
  }

  public setActiveRig(slicerId?: SlicerId, printerId?: string, filamentId?: string): void {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...(slicerId ? { activeSlicerId: slicerId } : {}),
      ...(printerId ? { activePrinterId: printerId } : {}),
      ...(filamentId ? { activeFilamentId: filamentId } : {}),
    };
    this.setItem(KEYS.SETTINGS, updated);
  }

  // Backup & Restore
  public exportBackupJSON(): string {
    const backup = {
      app: '3D Calibration Pro',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      printers: this.getPrinters(),
      filaments: this.getFilaments(),
      slicers: this.getSlicers(),
      calibrationItems: this.getCalibrationItems(),
      resultsHistory: this.getResultsHistory(),
      masterProfile: this.getMasterProfile(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackupJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.printers) this.setItem(KEYS.PRINTERS, data.printers);
      if (data.filaments) this.setItem(KEYS.FILAMENTS, data.filaments);
      if (data.slicers) this.setItem(KEYS.SLICERS, data.slicers);
      if (data.calibrationItems) this.setItem(KEYS.CALIBRATION_ITEMS, data.calibrationItems);
      if (data.resultsHistory) this.setItem(KEYS.RESULTS_HISTORY, data.resultsHistory);
      if (data.masterProfile) this.setItem(KEYS.MASTER_PROFILE, data.masterProfile);
      if (data.settings) this.setItem(KEYS.SETTINGS, data.settings);
      return true;
    } catch (e) {
      console.error('[3DCP DataLayer] Error importing backup:', e);
      return false;
    }
  }

  public exportHistoryCSV(): string {
    const history = this.getResultsHistory();
    const headers = ['ID', 'Test', 'Printer', 'Filament', 'Slicer', 'Value', 'Unit', 'Status', 'Date', 'Notes'];
    const rows = history.map((r) => [
      `"${r.id}"`,
      `"${r.testName}"`,
      `"${r.printerName}"`,
      `"${r.filamentName}"`,
      `"${r.slicerName}"`,
      `"${r.calculatedValue}"`,
      `"${r.unit}"`,
      `"${r.status}"`,
      `"${r.timestamp}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  public resetToFactory(): void {
    localStorage.removeItem(KEYS.PRINTERS);
    localStorage.removeItem(KEYS.FILAMENTS);
    localStorage.removeItem(KEYS.SLICERS);
    localStorage.removeItem(KEYS.CALIBRATION_ITEMS);
    localStorage.removeItem(KEYS.RESULTS_HISTORY);
    localStorage.removeItem(KEYS.MASTER_PROFILE);
    localStorage.removeItem(KEYS.SETTINGS);
    this.notify();
  }
}

export const db = new DataRepository();
