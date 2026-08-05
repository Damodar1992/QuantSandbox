/**
 * Mock backend for the Comparative Widget.
 *
 * Produces the response shape of
 * `GET /api/runs/{runId}/comparative-widget` so the UI can be swapped onto a
 * real endpoint without changes. Everything is deterministic for a given
 * runId + currentStage: the same run always yields the same numbers.
 */

import { mulberry32, strHash } from "./miniBacktestData";
import { COMPARATIVE_METRICS, aggregateMetricComparison } from "./comparativeWidgetStats";
import { countFilterConditions } from "./analyticsItems";

const CURRENT_EPOCH_COUNT = 100;

/**
 * Baseline metric level per stage — later stages start from a better strategy,
 * so improvements get progressively harder to reach.
 */
const STAGE_BASELINE = {
  1: { cycle_count: 420, median_mfe: 0.0037324, median_mae: -0.0142, median_air: 1.18, hit_rate: 51.2, profit_factor: 1.12, max_dd: 24.6, pnl: 18420, roi: 18.4, profit_factor_cycle_adjusted: 1.04 },
  2: { cycle_count: 465, median_mfe: 0.0041, median_mae: -0.0131, median_air: 1.27, hit_rate: 53.4, profit_factor: 1.21, max_dd: 21.8, pnl: 24310, roi: 24.3, profit_factor_cycle_adjusted: 1.11 },
  3: { cycle_count: 498, median_mfe: 0.0044, median_mae: -0.0122, median_air: 1.34, hit_rate: 55.1, profit_factor: 1.29, max_dd: 19.4, pnl: 29870, roi: 29.9, profit_factor_cycle_adjusted: 1.17 },
};

/** Selected epoch ids per baseline stage (chosen by the quant, not by rank). */
const SELECTED_EPOCH_IDS = { 1: 2, 2: 582, 3: 741 };

/** Spread of the current-stage epoch cloud around its own center, per metric. */
const METRIC_SPREAD = {
  cycle_count: 0.09,
  median_mfe: 0.06,
  median_mae: 0.08,
  median_air: 0.07,
  hit_rate: 0.04,
  profit_factor: 0.1,
  max_dd: 0.12,
  pnl: 0.22,
  roi: 0.22,
  profit_factor_cycle_adjusted: 0.11,
};

/** Center shift of the current stage relative to the Stage 1 baseline level. */
const STAGE_DRIFT = {
  2: 1.07,
  3: 1.14,
  4: 1.19,
};

function gaussian(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Raw metric values of every epoch of the current stage. The very same set is
 * reused for all comparison blocks — only the baseline changes.
 */
function buildCurrentStageEpochs({ runId, currentStage, epochCount, filterKey = "" }) {
  const rng = mulberry32(strHash(`${runId}::stage-${currentStage}::current${filterKey ? `::${filterKey}` : ""}`));
  const drift = STAGE_DRIFT[currentStage] ?? 1;
  const base = STAGE_BASELINE[1];

  /** @type {Record<string, number[]>} */
  const byMetric = {};

  COMPARATIVE_METRICS.forEach((metric) => {
    const center = base[metric.key] * drift;
    const spread = METRIC_SPREAD[metric.key] ?? 0.1;
    const values = [];

    for (let i = 0; i < epochCount; i += 1) {
      // A few heavy-tailed epochs keep outliers (and therefore the fences) meaningful.
      const tail = rng() < 0.04 ? 3.2 : 1;
      let value = center * (1 + gaussian(rng) * spread * tail);

      if (metric.key === "cycle_count") value = Math.max(1, Math.round(value));
      if (metric.key === "hit_rate") value = Math.min(99, Math.max(1, value));
      if (metric.key === "max_dd") value = Math.max(0.5, value);

      values.push(value);
    }

    byMetric[metric.key] = values;
  });

  return byMetric;
}

/** Baseline values of the quant-selected epoch of a previous stage. */
function buildBaselineValues({ runId, baselineStage }) {
  const rng = mulberry32(strHash(`${runId}::stage-${baselineStage}::baseline`));
  const level = STAGE_BASELINE[baselineStage] ?? STAGE_BASELINE[1];

  /** @type {Record<string, number>} */
  const values = {};

  COMPARATIVE_METRICS.forEach((metric) => {
    const jitter = 1 + (rng() - 0.5) * 0.04;
    let value = level[metric.key] * jitter;
    if (metric.key === "cycle_count") value = Math.round(value);
    values[metric.key] = value;
  });

  // Demo case for AC11: the Profit Factor cycle adjusted baseline of Stage 3 is
  // exactly 0, so the percentage comparison is not calculable.
  if (baselineStage === 3) {
    values.profit_factor_cycle_adjusted = 0;
  }

  return values;
}

/**
 * True when the quant never selected an epoch for that stage, so the block
 * renders the "Selected baseline is unavailable" state (AC13).
 */
function isBaselineUnavailable({ runId, baselineStage, currentStage }) {
  return currentStage === 4 && baselineStage === 2 && strHash(String(runId)) % 2 === 0;
}

/**
 * Stable key of a filters config, so a given filter set always yields the same
 * epoch cloud while different filter sets yield different ones.
 */
function buildFilterKey(filters) {
  if (!filters?.groups?.length) return "";
  const conditions = filters.groups.flatMap((group) =>
    (group.conditions || []).map(
      (c) => `${group.logic ?? "and"}:${c.field}:${c.op}:${c.value ?? ""}`,
    ),
  );
  if (!conditions.length) return "";
  return `${filters.logic ?? "and"}(${conditions.join("|")})`;
}

/**
 * @param {{
 *   runId: string,
 *   strategyName?: string,
 *   timeframe?: string,
 *   period?: string,
 *   currentStage: number,
 *   epochCount?: number,
 *   filters?: { logic: string, groups: { logic: string, conditions: object[] }[] } | null,
 * }} context
 */
export function buildComparativeWidgetResponse({
  runId,
  strategyName = "",
  timeframe = "",
  period = "",
  currentStage,
  epochCount = CURRENT_EPOCH_COUNT,
  filters = null,
}) {
  const safeRunId = String(runId ?? "run");
  const stage = Number(currentStage);
  const filterKey = buildFilterKey(filters);
  const filtersApplied = filterKey ? countFilterConditions(filters) : 0;

  if (!Number.isFinite(stage) || stage < 2) {
    return {
      runId: safeRunId,
      strategyName,
      timeframe,
      period,
      currentStage: stage,
      currentEpochCount: 0,
      filtersApplied,
      comparisons: [],
    };
  }

  // Each filter condition keeps a smaller share of the epochs, never fewer than 3.
  const filteredEpochCount = filtersApplied
    ? Math.max(3, Math.round(epochCount * 0.85 ** filtersApplied))
    : epochCount;

  const currentEpochs = buildCurrentStageEpochs({
    runId: safeRunId,
    currentStage: stage,
    epochCount: filteredEpochCount,
    filterKey,
  });

  const comparisons = [];

  for (let baselineStage = 1; baselineStage < stage; baselineStage += 1) {
    if (isBaselineUnavailable({ runId: safeRunId, baselineStage, currentStage: stage })) {
      comparisons.push({
        baselineStage,
        currentStage: stage,
        baselineEpochId: null,
        baselineStatus: "unavailable",
        metrics: [],
      });
      continue;
    }

    const baselineValues = buildBaselineValues({ runId: safeRunId, baselineStage });

    comparisons.push({
      baselineStage,
      currentStage: stage,
      baselineEpochId: SELECTED_EPOCH_IDS[baselineStage] ?? baselineStage,
      baselineStatus: "available",
      metrics: COMPARATIVE_METRICS.map((metric) =>
        aggregateMetricComparison({
          metric,
          baselineValue: baselineValues[metric.key],
          currentValues: currentEpochs[metric.key],
        }),
      ),
    });
  }

  return {
    runId: safeRunId,
    strategyName,
    timeframe,
    period,
    currentStage: stage,
    currentEpochCount: filteredEpochCount,
    filtersApplied,
    comparisons,
  };
}

/**
 * Mimics the network call: resolves with the aggregated response after a short
 * delay so the widget can show its loading state.
 *
 * @param {Parameters<typeof buildComparativeWidgetResponse>[0]} context
 * @param {{ delayMs?: number }} [options]
 */
export function fetchComparativeWidgetData(context, { delayMs = 420 } = {}) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildComparativeWidgetResponse(context)), delayMs);
  });
}
