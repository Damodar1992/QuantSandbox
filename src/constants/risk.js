/** Stoploss hyperopt keys for Stage 4 Risk */
export const RISK_STOPLOSS_KEYS = ["stoploss", "trailing_activation", "trailing_distance"];

/** UI labels for stoploss parameters */
export const RISK_STOPLOSS_LABELS = {
  stoploss: "Stoploss",
  trailing_activation: "Trailing Activation",
  trailing_distance: "Trailing Distance",
};

/** Fixed defaults for template preview only (not editable in UI) */
export const RISK_STOPLOSS_PREVIEW_DEFAULTS = {
  stoploss: -0.03,
  trailing_activation: 0.03,
  trailing_distance: 0.015,
};

/** Initial min / max / step per parameter */
export const DEFAULT_RISK_STOPLOSS_RANGES = {
  stoploss: { min: -0.08, max: -0.01, step: 0.001 },
  trailing_activation: { min: 0.01, max: 0.08, step: 0.001 },
  trailing_distance: { min: 0.005, max: 0.04, step: 0.001 },
};

/** HeatMap axis metrics for Stage 4 Risk (mock grid ranges) */
export const RISK_HEATMAP_METRICS = [
  { key: "profit_factor", label: "Profit factor", min: 0.5, max: 3.0, step: 0.05 },
  { key: "drawdown", label: "Drawdown", min: 0.02, max: 0.4, step: 0.01 },
];

export const RISK_HEATMAP_METRIC_BY_KEY = Object.fromEntries(
  RISK_HEATMAP_METRICS.map((m) => [m.key, m]),
);

export const DEFAULT_RISK_HEATMAP_AXES = {
  x: "profit_factor",
  y: "drawdown",
};

/** Value + step hyperopt params for Stage 4 Risk (section 3) */
export const RISK_HYPEROPT_PARAM_DEFS = [
  {
    valueKey: "loss_streak_threshold",
    stepKey: "loss_streak_threshold_step",
    label: "Loss streak threshold",
    minFloor: 1,
  },
  {
    valueKey: "post_loss_cooldown_candles",
    stepKey: "post_loss_cooldown_candles_step",
    label: "Post-loss cooldown (candles)",
    minFloor: 0,
  },
];

export const DEFAULT_RISK_HYPEROPT_PARAMS = {
  loss_streak_cooldown_enabled: false,
  loss_streak_threshold: 5,
  loss_streak_threshold_step: 1,
  post_loss_cooldown_candles: 3,
  post_loss_cooldown_candles_step: 1,
};

/** Hyperopt grid min/max/step from value + step fields (min = minFloor, max = value). */
export function riskHyperoptParamGrid(def, params) {
  if (!def || !params) return null;
  const max = Number(params[def.valueKey]);
  const step = Number(params[def.stepKey]);
  const min = def.minFloor;
  if (!Number.isFinite(max) || !Number.isFinite(step) || step <= 0 || max < min) return null;
  return { min, max, step };
}

/** Midpoint of each stoploss range for fixed HeatMap slice */
export function riskStoplossMidpoints(ranges) {
  const out = {};
  for (const key of RISK_STOPLOSS_KEYS) {
    const row = ranges?.[key];
    if (!row) continue;
    out[key] = (row.min + row.max) / 2;
  }
  return out;
}
