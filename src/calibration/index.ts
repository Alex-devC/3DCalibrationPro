export * from './mvs.ts';

// Deterministic Flow Rate (Extrusion Multiplier) module
export interface FlowRateInput {
  targetWallThickness: number; // e.g., 0.80 mm (dual perimeter with 0.4 nozzle)
  measuredWall1: number;
  measuredWall2: number;
  measuredWall3: number;
  measuredWall4: number;
  currentMultiplier?: number; // e.g. 1.00
}

export function calculateFlowRate(input: FlowRateInput) {
  const avgMeasured = (input.measuredWall1 + input.measuredWall2 + input.measuredWall3 + input.measuredWall4) / 4;
  const current = input.currentMultiplier || 1.0;
  // Formula: New EM = Current EM * (Target Wall / Measured Average Wall)
  const newMultiplier = Number((current * (input.targetWallThickness / (avgMeasured || 1))).toFixed(3));
  return {
    calculatedValue: newMultiplier,
    unit: 'ratio',
    formula: 'EM_new = EM_current × (Target_Wall / Measured_Wall_Avg)',
    formulaDerivation: `${current.toFixed(2)} × (${input.targetWallThickness.toFixed(2)} / ${avgMeasured.toFixed(2)}) = ${newMultiplier.toFixed(3)}`,
    averageMeasured: Number(avgMeasured.toFixed(3)),
  };
}
