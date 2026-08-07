// Stage 5 · Shuffler metric-validity rules (§6.2.1).
//
// Permuting the trade list cannot change a metric that does not depend on order.
// Under STATIC the stake never compounds, so PnL/ROI/PF collapse onto the
// Original and only Max Drawdown carries information. A stop-out breaks the
// invariance (the run is cut short), which re-validates the rest.

const ALWAYS_VALID = new Set(["maxdd"]);
const DYNAMIC_OR_STOPOUT = new Set(["roi", "pnl", "pf"]);
const STOPOUT_ONLY = new Set(["winrate", "trades"]);

/**
 * @param {string} metricKey one of the core metric keys
 * @param {{simulationMode?: string, hasStopOut?: boolean}} ctx
 * @returns {{valid: boolean, reason: string|null}}
 */
export function metricValidity(metricKey, ctx = {}) {
  const dynamic = ctx.simulationMode === "dynamic";
  const stopOut = Boolean(ctx.hasStopOut);

  if (ALWAYS_VALID.has(metricKey)) {
    return { valid: true, reason: null };
  }
  if (DYNAMIC_OR_STOPOUT.has(metricKey)) {
    if (dynamic || stopOut) return { valid: true, reason: null };
    return {
      valid: false,
      reason:
        "Under STATIC the stake never compounds, so this metric is a plain sum over the same trades — permutation cannot change it.",
    };
  }
  if (STOPOUT_ONLY.has(metricKey)) {
    if (stopOut) return { valid: true, reason: null };
    return {
      valid: false,
      reason:
        "Shuffling reorders the same trades; without a stop-out neither their count nor the share of winners can change.",
    };
  }
  return { valid: true, reason: null };
}

export function isMetricValid(metricKey, ctx) {
  return metricValidity(metricKey, ctx).valid;
}

/** Short tag rendered next to a metric row. */
export function validityTag(metricKey, ctx) {
  return isMetricValid(metricKey, ctx) ? "Valid" : "N/A · Shuffler";
}

/** Mode pill copy for the result header. */
export function simulationModeNote(simulationMode) {
  return simulationMode === "dynamic"
    ? "DYNAMIC (compounding) → ROI / PF are valid"
    : "STATIC → PnL invariant, only MaxDD is valid";
}
