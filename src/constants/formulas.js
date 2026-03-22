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

// Default formula code (legacy / intermediate)
export const DEFAULT_FORMULA_CODE =
  "1 / (1 + exp( -k * ( (medMFE - median(medMFE)) / median(|medMFE - median(medMFE)|) ) ))";

export const DEFAULT_FINAL_SCORE_FORMULA =
  "weightMFE * normMFE - weightMAE * normMAE + weightAIR * normAIR + weightHitRate * normHitRate";

export const DEFAULT_FINAL_SCORE_FORMULA_WITH_STABILITY =
  "weightMFE * normMFE - weightMAE * normMAE + weightAIR * normAIR + weightHitRate * normHitRate - weightStability * normStability";

export const DEFAULT_STABILITY_FORMULA =
  "min(max((stabilityScore - stabilityLow) / (stabilityHigh - stabilityLow), 0), 1)";

export const DEFAULT_STABILITY_BLOCK_FORMULA =
  "weightStabilityMFE * normDiffMFE + weightStabilityMAE * normDiffMAE + weightStabilityAIR * normDiffAIR + weightStabilityHitRate * normDiffHitRate + weightStabilityDiffStd * normDiffStd";

export const DEFAULT_MFE_FORMULA = "1 / (1 + EXP(-1 * Z-scoreMedMFE))";
export const DEFAULT_MAE_FORMULA = "1 / (1 + EXP(1 * Z-scoreMedMAE))";
export const DEFAULT_AIR_FORMULA = "1 / (1 + EXP(-1 * Z-scoreMedAIR))";
export const DEFAULT_HITRATE_FORMULA = "1 / (1 + EXP(-1 * Z-scoreValHitRate))";

export const DEFAULT_INT_NORM_MFE = "min(max((medMFE - medMFELow) / (medMFEHigh - medMFELow), 0), 1)";
export const DEFAULT_INT_NORM_MAE = "min(max((medMAE - medMAELow) / (medMAEHigh - medMAELow), 0), 1)";
export const DEFAULT_INT_NORM_AIR = "min(max((medAIR - medAIRLow) / (medAIRHigh - medAIRLow), 0), 1)";
export const DEFAULT_INT_NORM_HITRATE =
  "min(max((medHitRate - medHitRateLow) / (medHitRateHigh - medHitRateLow), 0), 1)";

export const STABILITY_NORM_DIFF_DEFAULTS = {
  normDiffMFE: "min(max((abs(diffMFE) - diffMFELow) / (diffMFEHigh - diffMFELow), 0), 1)",
  normDiffMAE: "min(max((abs(diffMAE) - diffMAELow) / (diffMAEHigh - diffMAELow), 0), 1)",
  normDiffAIR: "min(max((abs(diffAIR) - diffAIRLow) / (diffAIRHigh - diffAIRLow), 0), 1)",
  normDiffHitRate:
    "min(max((abs(diffHitRate) - diffHitRateLow) / (diffHitRateHigh - diffHitRateLow), 0), 1)",
  normDiffStd: "min(max((abs(diffStd) - diffStdLow) / (diffStdHigh - diffStdLow), 0), 1)",
};

export const INTERMEDIATE_SCORE_CODE_BY_TEMPLATE = {
  "Base formula":
    "weightMFE * normMFE - weightMAE * normMAE + weightAIR * normAIR + weightHitRate * normHitRate",
  "AIR punishment":
    "weightMFE * normMFE - weightMAE * normMAE + weightAIR * IF(medMFE >= medMAE ;normAIR ;-1*normAIR) + weightHitRate * normHitRate",
};

export const FINAL_SCORE_CODE_BY_TEMPLATE = {
  "Base formula":
    "weightMFE * normMFE - weightMAE * normMAE + weightAIR * normAIR + weightHitRate * normHitRate - weightStability * normStability",
  "AIR punishment":
    "weightMFE * normMFE - weightMAE * normMAE + weightAIR * IF(medMFE >= medMAE ;normAIR ;-1*normAIR) + weightHitRate * normHitRate - weightStability * normStability",
};

export const INTERMEDIATE_METRIC_FORMULA_CODE_BY_TEMPLATE = {
  normMFE: { "Formula 1": "min(max((medMFE - medMFELow) / (medMFEHigh - medMFELow), 0), 1)" },
  normMAE: { "Formula 1": "min(max((medMAE - medMAELow) / (medMAEHigh - medMAELow), 0), 1)" },
  normAIR: { "Formula 1": "min(max((medAIR - medAIRLow) / (medAIRHigh - medAIRLow), 0), 1)" },
  normHitRate: {
    "Formula 1": "min(max((medHitRate - medHitRateLow) / (medHitRateHigh - medHitRateLow), 0), 1)",
  },
};

export const STABILITY_NORM_DIFF_FORMULA_CODE_BY_TEMPLATE = {
  normDiffMFE: {
    "Formula 1": STABILITY_NORM_DIFF_DEFAULTS.normDiffMFE,
    "Formula 2": "Fake formula",
  },
  normDiffMAE: {
    "Formula 1": STABILITY_NORM_DIFF_DEFAULTS.normDiffMAE,
    "Formula 2": "Fake formula",
  },
  normDiffAIR: {
    "Formula 1": STABILITY_NORM_DIFF_DEFAULTS.normDiffAIR,
    "Formula 2": "Fake formula",
  },
  normDiffHitRate: {
    "Formula 1": STABILITY_NORM_DIFF_DEFAULTS.normDiffHitRate,
    "Formula 2": "Fake formula",
  },
  normDiffStd: {
    "Formula 1": STABILITY_NORM_DIFF_DEFAULTS.normDiffStd,
    "Formula 2": "Fake formula",
  },
};

export const METRIC_FORMULA_CODE_BY_TEMPLATE = {
  normStability: {
    "Formula 1": "min(max((stabilityScore - stabilityLow) / (stabilityHigh - stabilityLow), 0), 1)",
  },
  normMFE: { "Formula 1": "1 / (1 + EXP(-1 * Z-scoreMedMFE))" },
  normMAE: { "Formula 1": "1 / (1 + EXP(1 * Z-scoreMedMAE))" },
  normAIR: { "Formula 1": "1 / (1 + EXP(-1 * Z-scoreMedAIR))" },
  normHitRate: { "Formula 1": "1 / (1 + EXP(-1 * Z-scoreValHitRate))" },
};

export const FORMULA_VARIABLES = [
  "median",
  "medMFE",
  "medMAE",
  "medAIR",
  "medHitRate",
  "medMFELow",
  "medMFEHigh",
  "medMAELow",
  "medMAEHigh",
  "medAIRLow",
  "medAIRHigh",
  "medHitRateLow",
  "medHitRateHigh",
  "valHitRate",
  "valHitRateLow",
  "valHitRateHigh",
  "exp",
  "k",
];

export const FORMULA_EDITOR_VARIABLES = [
  "medMFE",
  "medMAE",
  "medAIR",
  "medHitRate",
  "medMFELow",
  "medMFEHigh",
  "medMAELow",
  "medMAEHigh",
  "medAIRLow",
  "medAIRHigh",
  "medHitRateLow",
  "medHitRateHigh",
  "valHitRate",
  "valHitRateLow",
  "valHitRateHigh",
  "Stability",
  "weightMFE",
  "normMFE",
  "weightMAE",
  "normMAE",
  "weightAIR",
  "normAIR",
  "weightHitRate",
  "normHitRate",
  "normDiffMFE",
  "normDiffMAE",
  "normDiffAIR",
  "normDiffHitRate",
  "normDiffStd",
  "diffMFE",
  "diffMFELow",
  "diffMFEHigh",
  "diffMAE",
  "diffMAELow",
  "diffMAEHigh",
  "diffAIR",
  "diffAIRLow",
  "diffAIRHigh",
  "diffHitRate",
  "diffHitRateLow",
  "diffHitRateHigh",
  "diffStd",
  "diffStdLow",
  "diffStdHigh",
  "Z-scoreMedMFE",
  "Z-scoreMedMAE",
  "Z-scoreMedAIR",
  "Z-scoreValHitRate",
  "stabilityScore",
  "stabilityLow",
  "stabilityHigh",
  "weightStabilityMFE",
  "weightStabilityMAE",
  "weightStabilityAIR",
  "weightStabilityHitRate",
  "weightStabilityDiffStd",
];

export const FORMULA_EDITOR_FUNCTIONS = [
  { label: "IF", template: "IF(cond; a; b)" },
  { label: "IFS", template: "IFS(c1; v1; c2; v2; default)" },
  { label: "AND", template: "AND(a; b; c)" },
  { label: "OR", template: "OR(a; b)" },
  { label: "NOT", template: "NOT(a)" },
  { label: "IFERROR", template: "IFERROR(expr; fallback)" },
  { label: "ABS", template: "ABS(x)" },
  { label: "MIN", template: "MIN(a; b; c)" },
  { label: "MAX", template: "MAX(a; b; c)" },
  { label: "ROUND", template: "ROUND(x; digits)" },
];

export const FORMULA_EDITOR_OPERATORS = ["+", "-", "*", "/", "^", "=", "<>", "<", "<=", ">", ">="];

export const FORMULA_MODAL_VARIABLES = [
  "medMFE",
  "medMAE",
  "medAIR",
  "medHitRate",
  "medMFELow",
  "medMFEHigh",
  "medMAELow",
  "medMAEHigh",
  "medAIRLow",
  "medAIRHigh",
  "medHitRateLow",
  "medHitRateHigh",
  "valHitRate",
  "valHitRateLow",
  "valHitRateHigh",
  "Stability",
  "weightMFE",
  "normMFE",
  "weightMAE",
  "normMAE",
  "weightAIR",
  "normAIR",
  "weightHitRate",
  "normHitRate",
  "midMFE",
  "midMAE",
  "midAIR",
  "midHitRate",
  "normDiffMFE",
  "normDiffMAE",
  "normDiffAIR",
  "normDiffHitRate",
  "normDiffStd",
  "diffMFE",
  "diffMFELow",
  "diffMFEHigh",
  "diffMAE",
  "diffMAELow",
  "diffMAEHigh",
  "diffAIR",
  "diffAIRLow",
  "diffAIRHigh",
  "diffHitRate",
  "diffHitRateLow",
  "diffHitRateHigh",
  "diffStd",
  "diffStdLow",
  "diffStdHigh",
  "Z-scoreMedMFE",
  "Z-scoreMedMAE",
  "Z-scoreMedAIR",
  "Z-scoreValHitRate",
  "stabilityScore",
  "stabilityLow",
  "stabilityHigh",
  "weightStabilityMFE",
  "weightStabilityMAE",
  "weightStabilityAIR",
  "weightStabilityHitRate",
  "weightStabilityDiffStd",
];

export const FORMULA_MODAL_FUNCTIONS = [
  { label: "IF", template: "IF(cond; a; b)" },
  { label: "IFS", template: "IFS(c1; v1; c2; v2; default)" },
  { label: "AND", template: "AND(a; b; c)" },
  { label: "OR", template: "OR(a; b)" },
  { label: "NOT", template: "NOT(a)" },
  { label: "IFERROR", template: "IFERROR(expr; fallback)" },
  { label: "ABS", template: "ABS(x)" },
  { label: "MIN", template: "MIN(a; b; c)" },
  { label: "MAX", template: "MAX(a; b; c)" },
  { label: "ROUND", template: "ROUND(x; digits)" },
];

export const FORMULA_MODAL_OPERATORS = ["+", "-", "*", "/", "^", "=", "<>", "<", "<=", ">", ">="];

export const FORMULA_HYPEROPT_TYPES = ["BIAS", "Brute Force"];
export const FORMULA_TYPES = ["Score", "Metric", "Stability"];
export const FORMULA_SUBTYPES = [
  "Intermediate score",
  "Final score",
  "Stability",
  "MFE",
  "MAE",
  "AIR",
  "HitRate",
];
