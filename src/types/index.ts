export type SlicerId = 'flash-studio' | 'orca-slicer' | 'bambu-studio' | 'custom-post' | string;

export interface SlicerProfile {
  id: SlicerId;
  name: string;
  version?: string;
  badge?: string;
  icon?: string;
  isLocked?: boolean;
  isDefault?: boolean;
  fileExtension?: string;
  supportsNativePA?: boolean;
  notes?: string;
  adapterId?: string;
}

export interface PrinterProfile {
  id: string;
  manufacturer: string;
  model: string;
  nozzleDiameter: number; // e.g. 0.4
  nozzleMaterial?: string; // e.g. 'Hardened Steel'
  kinematics?: string; // e.g. 'Core-XY'
  buildVolumeX: number; // e.g. 220
  buildVolumeY: number; // e.g. 220
  buildVolumeZ: number; // e.g. 220
  firmware?: string;
  notes?: string;
  isDefault?: boolean;

  // Future catalog architecture fields (optional, backward compatible)
  source?: 'user' | 'catalog' | 'preset';
  sourceId?: string;
  vendorId?: string;
  modelId?: string;
  variantId?: string;
}

// Future Public / Local Catalog Data Architecture
export interface CatalogPrinterVariant {
  id: string;
  name: string; // e.g. 'Standard', 'Plus', 'Max'
  buildVolumeX: number;
  buildVolumeY: number;
  buildVolumeZ: number;
  defaultNozzleDiameter: number;
  supportedNozzles?: number[];
  kinematics?: string;
  bedType?: string;
}

export interface CatalogPrinterModel {
  id: string;
  vendorId: string;
  manufacturer: string;
  model: string;
  variants: CatalogPrinterVariant[];
}

export interface FilamentProfile {
  id: string;
  brand: string;
  name: string;
  material: string; // PETG, PLA, ABS, TPU, etc.
  subType?: string; // Copolyester, etc.
  diameter: number; // e.g. 1.75
  colorName: string; // 'Signal Blue', 'Translucent Deep Teal'
  colorHex: string; // '#00b4d8'
  batchLot?: string;
  recommendedNozzleTempMin: number;
  recommendedNozzleTempMax: number;
  recommendedBedTemp: number;
  notes?: string;
  isDefault?: boolean;
}

export type CalibrationStatus = 'CALIBRATED' | 'MANUALLY_DEFINED' | 'NOT_CALIBRATED';

export type CalibrationTestType = 
  | 'MVS' 
  | 'FLOW_RATE' 
  | 'TEMP_TOWER' 
  | 'RETRACTION' 
  | 'PRESSURE_ADVANCE' 
  | 'COOLING';

export interface CalibrationItem {
  id: string;
  code: string; // e.g. CAL-01
  category: string; // e.g. FLOW CEILING
  titleKey: string;
  descKey: string;
  type: CalibrationTestType;
  value: number | string | null;
  unit: string;
  status: CalibrationStatus;
  testedAt?: string;
  safeValue?: number | string | null;
  notes?: string;
  photoUrl?: string;
}

export interface CalibrationResult {
  id: string;
  testType: CalibrationTestType;
  testName: string;
  printerId: string;
  printerName: string;
  filamentId: string;
  filamentName: string;
  slicerId: SlicerId;
  slicerName: string;
  calculatedValue: number;
  safeValue?: number;
  unit: string;
  formula: string;
  inputs: Record<string, number | string>;
  notes?: string;
  photoUrl?: string;
  timestamp: string;
  status: CalibrationStatus;
}

export interface MasterProfile {
  id: string;
  name: string;
  code: string; // e.g. PR-MST // 0049-AD5X
  slicerId: SlicerId;
  printerId: string;
  filamentId: string;
  nozzleDiameter: number;
  confidenceScore: number; // 0-100%
  mvs: { value: number | null; status: CalibrationStatus; unit: string; date?: string };
  flowRate: { value: number | null; status: CalibrationStatus; unit: string; date?: string };
  temp: { nozzle: number | null; bed: number | null; status: CalibrationStatus; unit: string; date?: string };
  retraction: { distance: number | null; speed: number | null; zHop: number | null; status: CalibrationStatus; unit: string; date?: string };
  pressureAdvance: { value: number | null; status: CalibrationStatus; unit: string; date?: string };
  cooling: { fanPercent: number | null; status: CalibrationStatus; unit: string; date?: string };
  updatedAt: string;
}

export interface AppSettings {
  language: 'pt-BR' | 'en-US';
  unitSystem: 'metric';
  userName: string;
  activeSlicerId: SlicerId;
  activePrinterId: string;
  activeFilamentId: string;
  showAdBanner: boolean;
}
