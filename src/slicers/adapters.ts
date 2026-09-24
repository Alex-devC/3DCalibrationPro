import { MasterProfile } from '../types/index.ts';

export interface SlicerParameterMapping {
  parameterId: string;
  label: string;
  slicerKey: string;
  uiLocation: string; // e.g., 'Filament > Basic Parameters'
  supportedInGui: boolean;
  fallbackStrategy?: 'START_GCODE' | 'POST_PROCESSING' | 'MANUAL_NOTE';
  fallbackInstruction?: string;
  formatValue: (value: number | string, master: MasterProfile) => string;
}

export interface SlicerAdapter {
  id: string;
  name: string;
  version: string;
  badge: string;
  fileExtension: string;
  supportedParameters: string[];
  mappings: Record<string, SlicerParameterMapping>;
  generateProfileBundle: (master: MasterProfile) => {
    fileName: string;
    content: string;
    mimeType: string;
  };
  getManualInstructions: (master: MasterProfile) => Array<{
    step: number;
    title: string;
    category: string;
    path: string;
    items: Array<{ label: string; value: string; unit: string; gcodeSnippet?: string }>;
  }>;
}

export const flashStudioAdapter: SlicerAdapter = {
  id: 'flash-studio',
  name: 'Flash Studio',
  version: 'v5.8 Pro Native',
  badge: 'NATIVE G-CODE',
  fileExtension: '.fcfg',
  supportedParameters: ['temp', 'flowRate', 'mvs', 'retraction', 'cooling'],
  mappings: {
    temp: {
      parameterId: 'temp',
      label: 'Extrusion & Bed Temperature',
      slicerKey: 'filament_temperature',
      uiLocation: 'Filament > Basic Parameters > Extruder Temperature',
      supportedInGui: true,
      formatValue: (v) => `${v} °C`,
    },
    flowRate: {
      parameterId: 'flowRate',
      label: 'Extrusion Multiplier (Flow Rate)',
      slicerKey: 'extrusion_multiplier',
      uiLocation: 'Filament > Basic Parameters > Extrusion Ratio',
      supportedInGui: true,
      formatValue: (v) => `${v}`,
    },
    mvs: {
      parameterId: 'mvs',
      label: 'Max Volumetric Speed',
      slicerKey: 'max_volumetric_speed',
      uiLocation: 'Speed > Volumetric Speed Limitation > Max Volumetric Speed',
      supportedInGui: true,
      formatValue: (v) => `${v} mm³/s`,
    },
    retraction: {
      parameterId: 'retraction',
      label: 'Retraction Distance',
      slicerKey: 'retract_length',
      uiLocation: 'Extruder > Retraction > Retract Length',
      supportedInGui: true,
      formatValue: (v) => `${v} mm`,
    },
    pressureAdvance: {
      parameterId: 'pressureAdvance',
      label: 'Pressure Advance (K-Factor)',
      slicerKey: 'pressure_advance_start_gcode',
      uiLocation: 'Machine Settings > Custom G-code > Start G-code',
      supportedInGui: false,
      fallbackStrategy: 'START_GCODE',
      fallbackInstruction: 'Append M900 K{val} to Printer Start G-code',
      formatValue: (v) => `M900 K${v}`,
    },
    cooling: {
      parameterId: 'cooling',
      label: 'Fan Speed Curve',
      slicerKey: 'fan_cooling_percentage',
      uiLocation: 'Cooling > Fan Speed > Regular Fan Speed',
      supportedInGui: true,
      formatValue: (v) => `${v} %`,
    },
  },
  generateProfileBundle: (master: MasterProfile) => {
    const config = {
      generator: '3D Calibration Pro v1.0.0',
      timestamp: new Date().toISOString(),
      slicer: 'Flash Studio',
      profile_name: master.name,
      printer_id: master.printerId,
      filament_id: master.filamentId,
      settings: {
        extrusion_temperature: master.temp.nozzle ?? 245,
        bed_temperature: master.temp.bed ?? 80,
        extrusion_ratio: master.flowRate.value ?? 0.96,
        max_volumetric_speed: master.mvs.value ?? 12.5,
        retract_length: master.retraction.distance ?? 0.8,
        retract_speed: master.retraction.speed ?? 40,
        custom_start_gcode_pa: master.pressureAdvance.value ? `M900 K${master.pressureAdvance.value} ; 3DCP PA` : '',
      },
    };
    return {
      fileName: `FlashStudio_${master.name.replace(/\s+/g, '_')}.fcfg`,
      content: JSON.stringify(config, null, 2),
      mimeType: 'application/json',
    };
  },
  getManualInstructions: (master: MasterProfile) => [
    {
      step: 1,
      title: 'Filament Settings',
      category: 'Temp & Flow',
      path: 'Filament > Basic Parameters',
      items: [
        { label: 'Printing Temp', value: String(master.temp.nozzle ?? 245), unit: '°C' },
        { label: 'Bed Temp', value: String(master.temp.bed ?? 80), unit: '°C' },
        { label: 'Extrusion Multiplier', value: String(master.flowRate.value ?? 0.96), unit: 'ratio' },
      ],
    },
    {
      step: 2,
      title: 'Speed & Volumetric Limit',
      category: 'Flow Limit',
      path: 'Speed > Volumetric Speed Limitation',
      items: [
        { label: 'Max Volumetric Speed', value: String(master.mvs.value ?? 12.5), unit: 'mm³/s' },
      ],
    },
    {
      step: 3,
      title: 'Start G-code Injection',
      category: 'Pressure Advance',
      path: 'Machine Settings > Custom G-code > Start G-code',
      items: [
        {
          label: 'Custom PA Injection',
          value: `M900 K${master.pressureAdvance.value ?? 0.035}`,
          unit: 'G-code',
          gcodeSnippet: `M900 K${master.pressureAdvance.value ?? 0.035} ; Calibration Pro PA`,
        },
      ],
    },
  ],
};

export const orcaSlicerAdapter: SlicerAdapter = {
  id: 'orca-slicer',
  name: 'OrcaSlicer',
  version: 'v2.1+ Direct G-code',
  badge: 'DIRECT G-CODE',
  fileExtension: '.json',
  supportedParameters: ['temp', 'flowRate', 'mvs', 'retraction', 'pressureAdvance', 'cooling'],
  mappings: {
    temp: {
      parameterId: 'temp',
      label: 'Nozzle & Bed Temperature',
      slicerKey: 'nozzle_temperature',
      uiLocation: 'Filament Settings > Basic Information > Temperature',
      supportedInGui: true,
      formatValue: (v) => `${v} °C`,
    },
    flowRate: {
      parameterId: 'flowRate',
      label: 'Flow Ratio',
      slicerKey: 'flow_ratio',
      uiLocation: 'Filament Settings > Basic Information > Flow Ratio',
      supportedInGui: true,
      formatValue: (v) => `${v}`,
    },
    mvs: {
      parameterId: 'mvs',
      label: 'Max Volumetric Speed',
      slicerKey: 'filament_max_volumetric_speed',
      uiLocation: 'Filament Settings > Setting Overrides > Max Volumetric Speed',
      supportedInGui: true,
      formatValue: (v) => `${v} mm³/s`,
    },
    retraction: {
      parameterId: 'retraction',
      label: 'Retraction Length',
      slicerKey: 'filament_retraction_length',
      uiLocation: 'Filament Settings > Setting Overrides > Retraction Length',
      supportedInGui: true,
      formatValue: (v) => `${v} mm`,
    },
    pressureAdvance: {
      parameterId: 'pressureAdvance',
      label: 'Pressure Advance',
      slicerKey: 'pressure_advance',
      uiLocation: 'Filament Settings > Basic Information > Enable Pressure Advance',
      supportedInGui: true,
      formatValue: (v) => `${v} s`,
    },
    cooling: {
      parameterId: 'cooling',
      label: 'Cooling Fan Thresholds',
      slicerKey: 'fan_max_speed',
      uiLocation: 'Filament Settings > Cooling',
      supportedInGui: true,
      formatValue: (v) => `${v} %`,
    },
  },
  generateProfileBundle: (master: MasterProfile) => {
    const config = {
      type: 'filament',
      name: `${master.name} - Orca`,
      from: '3D Calibration Pro',
      instantiation: 'true',
      nozzle_temperature: [master.temp.nozzle ?? 245],
      nozzle_temperature_initial_layer: [master.temp.nozzle ?? 245],
      hot_plate_temp: [master.temp.bed ?? 80],
      flow_ratio: [String(master.flowRate.value ?? 0.96)],
      filament_max_volumetric_speed: [String(master.mvs.value ?? 12.5)],
      filament_retraction_length: [String(master.retraction.distance ?? 0.8)],
      enable_pressure_advance: [master.pressureAdvance.value ? '1' : '0'],
      pressure_advance: [String(master.pressureAdvance.value ?? 0.035)],
    };
    return {
      fileName: `OrcaSlicer_${master.name.replace(/\s+/g, '_')}.json`,
      content: JSON.stringify(config, null, 2),
      mimeType: 'application/json',
    };
  },
  getManualInstructions: (master: MasterProfile) => [
    {
      step: 1,
      title: 'Filament Basic Information',
      category: 'Flow & Temp',
      path: 'Filament > Basic Information',
      items: [
        { label: 'Flow Ratio', value: String(master.flowRate.value ?? 0.96), unit: 'ratio' },
        { label: 'Nozzle Temp', value: String(master.temp.nozzle ?? 245), unit: '°C' },
        { label: 'Bed Temp', value: String(master.temp.bed ?? 80), unit: '°C' },
      ],
    },
    {
      step: 2,
      title: 'Volumetric Speed & PA',
      category: 'MVS & K-Factor',
      path: 'Filament > Setting Overrides & Basic Information',
      items: [
        { label: 'Max Volumetric Speed', value: String(master.mvs.value ?? 12.5), unit: 'mm³/s' },
        { label: 'Pressure Advance (K)', value: String(master.pressureAdvance.value ?? 0.035), unit: 's' },
      ],
    },
  ],
};

export const bambuStudioAdapter: SlicerAdapter = {
  id: 'bambu-studio',
  name: 'Bambu Studio',
  version: 'v1.9+ Project Export',
  badge: 'PROJECT EXPORT',
  fileExtension: '.json',
  supportedParameters: ['temp', 'flowRate', 'mvs', 'retraction', 'pressureAdvance', 'cooling'],
  mappings: orcaSlicerAdapter.mappings,
  generateProfileBundle: (master: MasterProfile) => {
    const config = {
      type: 'filament',
      name: `${master.name} - Bambu`,
      from: '3D Calibration Pro',
      instantiation: 'true',
      default_filament_colour: ['#00b4d8'],
      filament_max_volumetric_speed: [String(master.mvs.value ?? 12.5)],
      filament_retraction_length: [String(master.retraction.distance ?? 0.8)],
      filament_flow_ratio: [String(master.flowRate.value ?? 0.96)],
      temperature: [String(master.temp.nozzle ?? 245)],
      bed_temperature: [String(master.temp.bed ?? 80)],
    };
    return {
      fileName: `BambuStudio_${master.name.replace(/\s+/g, '_')}.json`,
      content: JSON.stringify(config, null, 2),
      mimeType: 'application/json',
    };
  },
  getManualInstructions: (master: MasterProfile) => [
    {
      step: 1,
      title: 'Filament Settings',
      category: 'Extrusion Specs',
      path: 'Filament Settings > Basic Information',
      items: [
        { label: 'Flow Ratio', value: String(master.flowRate.value ?? 0.96), unit: 'ratio' },
        { label: 'Nozzle Temp', value: String(master.temp.nozzle ?? 245), unit: '°C' },
        { label: 'Max Volumetric Speed', value: String(master.mvs.value ?? 12.5), unit: 'mm³/s' },
      ],
    },
  ],
};

export const slicerAdaptersMap: Record<string, SlicerAdapter> = {
  'flash-studio': flashStudioAdapter,
  'orca-slicer': orcaSlicerAdapter,
  'bambu-studio': bambuStudioAdapter,
  'custom-post': {
    ...flashStudioAdapter,
    id: 'custom-post',
    name: 'Custom Post',
    version: 'Raw G-code',
    badge: 'RAW G-CODE',
  },
};

export function getSlicerAdapter(id: string): SlicerAdapter {
  return slicerAdaptersMap[id] || flashStudioAdapter;
}
