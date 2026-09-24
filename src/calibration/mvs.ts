/**
 * Maximum Volumetric Speed (MVS) Calculation Module
 * Deterministic mathematical model
 * Formula: MVS = Start + (Measured Height × Step)
 */

export interface MVSInput {
  startSpeed: number; // e.g., 5.0 mm³/s
  endSpeed: number; // e.g., 20.0 mm³/s
  step: number; // e.g., 0.5 mm³/s per mm
  measuredHeight: number; // e.g., 15.0 mm
}

export interface MVSOutput {
  calculatedValue: number; // e.g. 12.50
  safeValue: number; // e.g. 11.25 (90% safe buffer)
  unit: string; // 'mm³/s'
  formula: string; // 'MVS = Start + (Measured Height × Step)'
  formulaDerivation: string; // '5.0 + (15.0 × 0.50) = 12.50 mm³/s'
  inputs: MVSInput;
  warnings?: string[];
}

export function calculateMVS(input: MVSInput): MVSOutput {
  const start = Number(input.startSpeed) || 0;
  const step = Number(input.step) || 0;
  const height = Number(input.measuredHeight) || 0;

  // Deterministic formula
  const calculated = start + (height * step);
  const rounded = Number(calculated.toFixed(2));
  const safe = Number((rounded * 0.9).toFixed(2));

  const warnings: string[] = [];
  if (input.endSpeed && rounded > input.endSpeed) {
    warnings.push(`Calculated MVS (${rounded} mm³/s) exceeds test maximum end speed (${input.endSpeed} mm³/s)`);
  }
  if (rounded <= 0) {
    warnings.push('Calculated MVS is non-positive. Please verify caliper measurement.');
  }

  return {
    calculatedValue: rounded,
    safeValue: safe,
    unit: 'mm³/s',
    formula: 'MVS = Start + (Measured Height × Step)',
    formulaDerivation: `${start.toFixed(1)} + (${height.toFixed(1)} × ${step.toFixed(2)}) = ${rounded.toFixed(2)} mm³/s`,
    inputs: {
      startSpeed: start,
      endSpeed: input.endSpeed,
      step,
      measuredHeight: height,
    },
    warnings,
  };
}
