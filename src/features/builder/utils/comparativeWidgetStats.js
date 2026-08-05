/**
 * Pure math for the Comparative Widget: normalized improvement, boxplot
 * statistics and outcome shares. All values stay unrounded here — rounding is
 * applied only by the formatters at the presentation layer.
 *
 * @typedef {"higher_is_better" | "lower_is_better" | "lower_magnitude_is_better"} MetricDirection
 * @typedef {"integer" | "percentage" | "decimal" | "number"} MetricUnit
 * @typedef {{ key: string, label: string, direction: MetricDirection, unit: MetricUnit }} ComparativeMetric
 * @typedef {{ median: number, q1: number, q3: number, iqr: number, lowerFence: number, upperFence: number, whiskerMin: number, whiskerMax: number }} BoxplotStats
 */

/** Fixed display order of the supported metrics. */
/** @type {ComparativeMetric[]} */
export const COMPARATIVE_METRICS = [
  { key: "cycle_count", label: "Cycle Count", direction: "higher_is_better", unit: "integer" },
  { key: "median_mfe", label: "Median MFE", direction: "higher_is_better", unit: "percentage" },
  { key: "median_mae", label: "Median MAE", direction: "lower_magnitude_is_better", unit: "percentage" },
  { key: "median_air", label: "Median AIR", direction: "higher_is_better", unit: "decimal" },
  { key: "hit_rate", label: "Hit Rate", direction: "higher_is_better", unit: "percentage" },
  { key: "profit_factor", label: "Profit Factor", direction: "higher_is_better", unit: "decimal" },
  { key: "max_dd", label: "MaxDD", direction: "lower_is_better", unit: "percentage" },
  { key: "pnl", label: "PnL", direction: "higher_is_better", unit: "number" },
  { key: "roi", label: "ROI", direction: "higher_is_better", unit: "percentage" },
  {
    key: "profit_factor_cycle_adjusted",
    label: "Profit Factor cycle adjusted",
    direction: "higher_is_better",
    unit: "decimal",
  },
];

export const METRIC_DIRECTION_LABELS = {
  higher_is_better: "Higher is better",
  lower_is_better: "Lower is better",
  lower_magnitude_is_better: "Lower magnitude is better",
};

export const ZERO_BASELINE_REASON = "zero_baseline";

/** @param {string} key */
export function getComparativeMetric(key) {
  return COMPARATIVE_METRICS.find((m) => m.key === key) ?? null;
}

function isNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Normalized improvement in percent for a single epoch/metric pair.
 * Positive means better than baseline for every direction.
 *
 * @param {MetricDirection} direction
 * @param {number} baseline
 * @param {number} current
 * @returns {number | { status: "not_calculable", reason: string }}
 */
export function computeImprovementPct(direction, baseline, current) {
  if (!isNumber(baseline) || !isNumber(current)) {
    return { status: "not_calculable", reason: "missing_value" };
  }

  if (baseline === 0) {
    if (current === 0) return 0;
    return { status: "not_calculable", reason: ZERO_BASELINE_REASON };
  }

  const denominator = Math.abs(baseline);

  if (direction === "lower_is_better") {
    return ((baseline - current) / denominator) * 100;
  }
  if (direction === "lower_magnitude_is_better") {
    return ((Math.abs(baseline) - Math.abs(current)) / denominator) * 100;
  }
  return ((current - baseline) / denominator) * 100;
}

/**
 * Continuous percentile with linear interpolation (PERCENTILE_CONT equivalent).
 * @param {number[]} values unsorted list of finite numbers
 * @param {number} p fraction in [0, 1]
 */
export function percentileCont(values, p) {
  const sorted = (Array.isArray(values) ? values : []).filter(isNumber).sort((a, b) => a - b);
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];

  const clamped = Math.min(1, Math.max(0, p));
  const rank = clamped * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  if (lowerIndex === upperIndex) return sorted[lowerIndex];

  const weight = rank - lowerIndex;
  return sorted[lowerIndex] + (sorted[upperIndex] - sorted[lowerIndex]) * weight;
}

/**
 * Boxplot statistics over improvement values. Whiskers are the extreme actual
 * values inside the 1.5 x IQR fences, so outliers never extend them.
 *
 * @param {number[]} values
 * @returns {BoxplotStats | null}
 */
export function computeBoxplotStats(values) {
  const clean = (Array.isArray(values) ? values : []).filter(isNumber);
  if (!clean.length) return null;

  const median = percentileCont(clean, 0.5);
  const q1 = percentileCont(clean, 0.25);
  const q3 = percentileCont(clean, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const inside = clean.filter((v) => v >= lowerFence && v <= upperFence);
  const bounded = inside.length ? inside : clean;

  return {
    median,
    q1,
    q3,
    iqr,
    lowerFence,
    upperFence,
    whiskerMin: Math.min(...bounded),
    whiskerMax: Math.max(...bounded),
  };
}

/**
 * Improved / worsened / unchanged counts and shares over the eligible epochs.
 * Outcome is decided on the unrounded improvement value.
 *
 * @param {number[]} values
 */
export function computeOutcomes(values) {
  const clean = (Array.isArray(values) ? values : []).filter(isNumber);
  const total = clean.length;

  let improvedCount = 0;
  let worsenedCount = 0;
  let unchangedCount = 0;

  clean.forEach((v) => {
    if (v > 0) improvedCount += 1;
    else if (v < 0) worsenedCount += 1;
    else unchangedCount += 1;
  });

  const share = (count) => (total > 0 ? (count / total) * 100 : 0);

  return {
    eligibleEpochCount: total,
    improvedCount,
    improvedShare: share(improvedCount),
    worsenedCount,
    worsenedShare: share(worsenedCount),
    unchangedCount,
    unchangedShare: share(unchangedCount),
  };
}

/**
 * Full aggregation for one metric inside one comparison block.
 *
 * @param {{ metric: ComparativeMetric, baselineValue: number, currentValues: number[] }} input
 */
export function aggregateMetricComparison({ metric, baselineValue, currentValues }) {
  const values = Array.isArray(currentValues) ? currentValues : [];

  if (isNumber(baselineValue) && baselineValue === 0 && values.some((v) => isNumber(v) && v !== 0)) {
    return {
      metric: metric.key,
      label: metric.label,
      direction: metric.direction,
      unit: metric.unit,
      status: "not_calculable",
      reason: ZERO_BASELINE_REASON,
      baselineValue,
      medianCurrentValue: percentileCont(values, 0.5),
      eligibleEpochCount: 0,
    };
  }

  const improvements = [];
  const eligibleValues = [];

  values.forEach((value) => {
    const improvement = computeImprovementPct(metric.direction, baselineValue, value);
    if (isNumber(improvement)) {
      improvements.push(improvement);
      eligibleValues.push(value);
    }
  });

  if (!improvements.length) {
    return {
      metric: metric.key,
      label: metric.label,
      direction: metric.direction,
      unit: metric.unit,
      status: "not_calculable",
      reason: isNumber(baselineValue) ? "no_eligible_epochs" : "missing_baseline_value",
      baselineValue: isNumber(baselineValue) ? baselineValue : null,
      medianCurrentValue: percentileCont(values, 0.5),
      eligibleEpochCount: 0,
    };
  }

  const box = computeBoxplotStats(improvements);
  const outcomes = computeOutcomes(improvements);

  return {
    metric: metric.key,
    label: metric.label,
    direction: metric.direction,
    unit: metric.unit,
    status: "available",
    baselineValue,
    medianCurrentValue: percentileCont(eligibleValues, 0.5),
    eligibleEpochCount: outcomes.eligibleEpochCount,
    medianImprovementPct: box.median,
    q1ImprovementPct: box.q1,
    q3ImprovementPct: box.q3,
    whiskerMinImprovementPct: box.whiskerMin,
    whiskerMaxImprovementPct: box.whiskerMax,
    improvedCount: outcomes.improvedCount,
    improvedShare: outcomes.improvedShare,
    worsenedCount: outcomes.worsenedCount,
    worsenedShare: outcomes.worsenedShare,
    unchangedCount: outcomes.unchangedCount,
    unchangedShare: outcomes.unchangedShare,
  };
}

/**
 * Shared x-domain for every metric row of one comparison block, so the 0% line
 * sits at the same position in all rows. Always includes 0.
 *
 * @param {object[]} metrics aggregated metric entries
 */
export function computeImprovementDomain(metrics) {
  let min = 0;
  let max = 0;

  (Array.isArray(metrics) ? metrics : []).forEach((m) => {
    if (m?.status !== "available") return;
    [m.whiskerMinImprovementPct, m.whiskerMaxImprovementPct].forEach((v) => {
      if (!isNumber(v)) return;
      if (v < min) min = v;
      if (v > max) max = v;
    });
  });

  const span = max - min;
  const padding = span > 0 ? span * 0.08 : 1;
  return { min: min - padding, max: max + padding };
}

/* ---------------------------------- format --------------------------------- */

/**
 * Absolute metric value formatted by its unit.
 * @param {number | null | undefined} value
 * @param {MetricUnit} unit
 */
export function formatMetricValue(value, unit) {
  if (!isNumber(value)) return "—";

  switch (unit) {
    case "integer":
      return Math.round(value).toLocaleString("en-US");
    case "percentage": {
      const abs = Math.abs(value);
      const digits = abs > 0 && abs < 1 ? 4 : 2;
      return `${value.toFixed(digits)}%`;
    }
    case "decimal":
      return value.toFixed(2);
    case "number":
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    default:
      return String(value);
  }
}

/**
 * Improvement percent with an explicit sign.
 * @param {number | null | undefined} value
 */
export function formatImprovementPct(value) {
  if (!isNumber(value)) return "—";
  const rounded = Number(value.toFixed(2));
  if (rounded === 0) return "0.00%";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded).toFixed(2)}%`;
}

/**
 * Outcome share for tooltips: "12% · 12/100".
 * @param {number} share
 * @param {number} count
 * @param {number} total
 */
export function formatOutcomeShare(share, count, total) {
  const pct = isNumber(share) ? `${Math.round(share)}%` : "—";
  return `${pct} · ${count ?? 0}/${total ?? 0}`;
}
