/** @typedef {{ indicator: string, indicatorType?: string, parameter: string, importance: number, status: "active" | "fixed", fixedValue?: number }} ImportanceRow */
/** @typedef {{ indicator: string, indicatorType?: string, parameter: string, min?: number, max?: number, step?: number, count?: number, fixedValue?: number, status?: "active" | "fixed" }} ConfigRow */

const REFERENCE_IMPORTANCE = [
  { indicator: "bb", indicatorType: "BBANDS", parameter: "timeperiod", importance: 53.7, status: "active" },
  { indicator: "bb", indicatorType: "BBANDS", parameter: "nbdevup", importance: 4.1, status: "active" },
  { indicator: "bb", indicatorType: "BBANDS", parameter: "matype", importance: 1.5, status: "fixed", fixedValue: 0 },
];

const REFERENCE_CONFIG_MAIN = [
  { indicator: "bb", indicatorType: "BBANDS", parameter: "timeperiod", min: 10, max: 30, step: 5, count: 5, status: "active" },
  { indicator: "bb", indicatorType: "BBANDS", parameter: "nbdevup", min: 1.5, max: 2.5, step: 0.5, count: 3, status: "active" },
  { indicator: "bb", indicatorType: "BBANDS", parameter: "matype", fixedValue: 0, status: "fixed" },
];

const REFERENCE_CONFIG_MARGIN = [
  { indicator: "bb", indicatorType: "BBANDS", parameter: "timeperiod", min: 8, max: 34, step: 5, count: 6, status: "active" },
  { indicator: "bb", indicatorType: "BBANDS", parameter: "nbdevup", min: 1, max: 3, step: 0.5, count: 5, status: "active" },
  { indicator: "bb", indicatorType: "BBANDS", parameter: "matype", fixedValue: 0, status: "fixed" },
];

/** Product of Count for active (non-fixed) config rows. */
export function computeCombinationsFromConfigRows(configRows) {
  if (!Array.isArray(configRows) || !configRows.length) return 0;
  const factors = configRows
    .filter((row) => row.status !== "fixed" && row.fixedValue == null)
    .map((row) => row.count)
    .filter((c) => c != null && Number.isFinite(c) && c >= 1);
  if (!factors.length) return 0;
  return factors.reduce((acc, c) => acc * c, 1);
}

export function computeReductionStats(before, after) {
  const safeBefore = Number.isFinite(before) ? before : 0;
  const safeAfter = Number.isFinite(after) ? after : 0;
  return {
    absoluteReduction: safeBefore - safeAfter,
    remainingPercent: safeBefore > 0 ? (safeAfter / safeBefore) * 100 : 0,
    reductionMultiplier: safeAfter > 0 ? Math.round(safeBefore / safeAfter) : 0,
  };
}

export function buildReferenceRangeNarrowingResults(runConfig = {}, subId = "hr1-1") {
  const marginEnabled = runConfig.marginEnabled ?? true;
  const marginWiden = runConfig.marginWiden ?? 2;
  const before = runConfig.maxCombinations != null ? Math.max(runConfig.maxCombinations * 165, 20000) : 20000;
  const after = computeCombinationsFromConfigRows(REFERENCE_CONFIG_MAIN);
  const { absoluteReduction, remainingPercent, reductionMultiplier } = computeReductionStats(before, after);

  return {
    runId: `d7c5${String(subId).replace(/[^a-z0-9]/gi, "").slice(0, 4)}9463`,
    targetMetric: "final_score",
    beforeCombinations: before,
    afterCombinations: after,
    absoluteReduction,
    remainingPercent,
    reductionMultiplier,
    configs: {
      main: {
        importanceRows: REFERENCE_IMPORTANCE,
        configRows: REFERENCE_CONFIG_MAIN,
      },
      ...(marginEnabled
        ? {
            margin: {
              importanceRows: REFERENCE_IMPORTANCE.map((r) => ({ ...r, importance: r.importance * 0.95 })),
              configRows: REFERENCE_CONFIG_MARGIN,
              marginWiden,
            },
          }
        : {}),
    },
  };
}

/**
 * @param {object[]} indicators
 * @param {import("./rangeNarrowingMock").ConfigRow[]} configRows
 */
export function applyConfigRowsToIndicators(indicators, configRows) {
  if (!Array.isArray(indicators) || !Array.isArray(configRows) || !configRows.length) {
    return indicators;
  }

  return indicators.map((ind) => {
    const params = Array.isArray(ind.params) ? ind.params : [];
    const updatedParams = params.map((p) => {
      const row = configRows.find(
        (r) =>
          r.parameter === p.key &&
          (r.indicatorType === ind.type ||
            r.indicator === ind.type ||
            r.indicator === ind.displayName ||
            r.indicator === ind.name),
      );
      if (!row) return p;

      if (row.status === "fixed" || row.fixedValue != null) {
        const v = row.fixedValue ?? row.min ?? p.default ?? p.defaultValue;
        return { ...p, min: v, max: v, default: v, step: 1 };
      }

      return {
        ...p,
        min: row.min ?? p.min,
        max: row.max ?? p.max,
        step: row.step ?? p.step,
      };
    });

    return { ...ind, params: updatedParams };
  });
}

export function createRangeNarrowingAnalyticsItem({ subId, runConfig, date }) {
  const id = `${subId}-rn-${Date.now()}`;
  return {
    id,
    date: date || new Date().toISOString().slice(0, 10),
    type: "Range Narrowing",
    status: "Finished",
    runConfig,
    results: buildReferenceRangeNarrowingResults(runConfig, subId),
  };
}

const DEFAULT_RUN_CONFIG = {
  plateauWidth: 50,
  minImportance: 2,
  maxCombinations: 120,
  minEpochsPerValue: 5,
  marginEnabled: true,
  marginWiden: 2,
};

/** Default seed item for Analytics table (stages 1–3). */
export function buildDefaultRangeNarrowingSeedItem(subId, date = "2024-01-15") {
  return {
    id: `${subId}-rn1`,
    date,
    type: "Range Narrowing",
    status: "Finished",
    runConfig: { ...DEFAULT_RUN_CONFIG },
    results: buildReferenceRangeNarrowingResults(DEFAULT_RUN_CONFIG, subId),
  };
}

export function filterAnalyticsItemsForStage(items, isRiskStage) {
  const list = Array.isArray(items) ? items : [];
  if (!isRiskStage) return list;
  return list.filter((item) => item.type !== "Range Narrowing");
}
