import { RISK_HYPEROPT_PARAM_DEFS, riskHyperoptParamGrid } from "../../../constants/risk";

/**
 * Count grid values for a single min/max/step range (inclusive).
 */
export function countRangeValues(min, max, step) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step) || step <= 0) {
    return 0;
  }
  if (min > max) return 0;
  return Math.floor((max - min) / step + 1e-9) + 1;
}

/**
 * Product of combination counts for min/max/step risk hyperopt params.
 * @param {Record<string, number>} params
 */
export function countRiskHyperoptParamCombinations(params) {
  if (!params || typeof params !== "object") return 1;
  if (!params.loss_streak_cooldown_enabled) return 1;
  let product = 1;
  for (const def of RISK_HYPEROPT_PARAM_DEFS) {
    const grid = riskHyperoptParamGrid(def, params);
    if (!grid) return 0;
    const n = countRangeValues(grid.min, grid.max, grid.step);
    if (n === 0) return 0;
    product *= n;
  }
  return product;
}

/**
 * Product of combination counts for all risk stoploss ranges.
 * @param {Record<string, { min: number, max: number, step: number }>} ranges
 */
export function countRiskCombinations(ranges) {
  if (!ranges || typeof ranges !== "object") return 0;
  let product = 1;
  let hasAny = false;
  for (const key of Object.keys(ranges)) {
    const r = ranges[key];
    if (!r) continue;
    const n = countRangeValues(r.min, r.max, r.step);
    if (n === 0) return 0;
    hasAny = true;
    product *= n;
  }
  return hasAny ? product : 0;
}
