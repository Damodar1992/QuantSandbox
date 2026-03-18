export const FINAL_SCORE_FORMULA_OPTIONS = ["Base formula", "AIR punishment"];

export const METRIC_FORMULA_OPTIONS = ["Formula 1", "Formula 2"];

export const HYPEROPT_DETAILS_TOOLTIP_TEXT = `StabilityFormula = formula
StabilityWeight (weightMFE | weightMAE | weightAIR | weightHitRate | ABC) 0-100 GLOBAL >= 100%

Final score =
  weightMFE * normMFE
- weightMAE * normMAE
+ weightAIR * normAIR
+ weightHitRate * normHitRate
+ weightStability (weightMFE | weightMAE | weightAIR | weightHitRate) * normStability

------------------------------
Metrics normalization formulas:
normMFE = 1/(1+EXP(-1*(MFE - MEDIAN(MFE)) / (QUARTILE.INC(MFE,3) - QUARTILE.INC(MFE,1))))
normMAE = 1/(1+EXP(1*(MAE - MEDIAN(MAE)) / (QUARTILE.INC(MAE,3) - QUARTILE.INC(MAE,1))))
normAIR = 1/(1+EXP(-1*(AIR - MEDIAN(AIR)) / (QUARTILE.INC(AIR,3) - QUARTILE.INC(AIR,1))))
normHitRate = 1/(1+EXP(-1*(HitRate - MEDIAN(HitRate)) / (QUARTILE.INC(HitRate,3) - QUARTILE.INC(HitRate,1))))
normStability = 1/(1+EXP(-1*(Stability - MEDIAN(Stability)) / (QUARTILE.INC(Stability,3) - QUARTILE.INC(Stability,1))))`;
