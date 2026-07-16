/**
 * Filtering logic for the Storage feature.
 *
 * Filters are applied to the hyperopt level; a parent row is visible if
 * at least one of its descendant hyperopts passes the filter (§7.5, §19).
 * Selection is never touched by filtering.
 */

import { STAGE_ORDER } from "../../../constants/storageMock";

export const EMPTY_FILTERS = {
  strategyName: "",
  stageType: "",       // "signal" | "entry" | "exit" | "risk" | ""
  timeframe: "",
  tagIds: [],          // array of tag id strings
  status: "",          // "Completed" | "Failed" | "Running" | "Raw data deleted" | ""
  minSizeGb: "",       // string, parsed to float
  maxSizeGb: "",       // string, parsed to float
};

function hyperoptMatchesFilter(h, filters) {
  if (filters.timeframe && h.timeframe !== filters.timeframe) return false;

  if (filters.tagIds.length > 0) {
    const hTags = new Set(h.tagIds ?? []);
    if (!filters.tagIds.some((t) => hTags.has(t))) return false;
  }

  if (filters.status && h.status !== filters.status) return false;

  const min = filters.minSizeGb !== "" ? parseFloat(filters.minSizeGb) : null;
  const max = filters.maxSizeGb !== "" ? parseFloat(filters.maxSizeGb) : null;
  if (min !== null && !isNaN(min) && h.rawSizeGb < min) return false;
  if (max !== null && !isNaN(max) && h.rawSizeGb > max) return false;

  return true;
}

function versionMatchesFilter(sv, filters) {
  return (sv.hyperopts ?? []).some((h) => hyperoptMatchesFilter(h, filters));
}

function stageMatchesFilter(versions, stageType, filters) {
  if (filters.stageType && stageType !== filters.stageType) return false;
  return versions.some((sv) => versionMatchesFilter(sv, filters));
}

function strategyMatchesFilter(strategy, filters) {
  if (filters.strategyName) {
    const q = filters.strategyName.toLowerCase();
    if (!strategy.name.toLowerCase().includes(q)) return false;
  }
  return (strategy.stageVersions ?? []).some((sv) =>
    (filters.stageType === "" || sv.stageType === filters.stageType) &&
    versionMatchesFilter(sv, filters),
  );
}

/**
 * Returns a filtered view of strategies for display.
 * Each strategy/stage/version only appears if at least one hyperopt passes.
 *
 * @param {Array} strategies
 * @param {Object} filters
 * @returns {Array} filtered strategy array (shallow copies, filtered children)
 */
export function applyFilters(strategies, filters) {
  const hasAnyFilter =
    filters.strategyName ||
    filters.stageType ||
    filters.timeframe ||
    filters.tagIds.length > 0 ||
    filters.status ||
    filters.minSizeGb !== "" ||
    filters.maxSizeGb !== "";

  if (!hasAnyFilter) return strategies;

  const result = [];
  for (const strategy of strategies) {
    if (!strategyMatchesFilter(strategy, filters)) continue;

    const filteredVersions = (strategy.stageVersions ?? []).filter((sv) => {
      if (filters.stageType && sv.stageType !== filters.stageType) return false;
      return versionMatchesFilter(sv, filters);
    }).map((sv) => ({
      ...sv,
      hyperopts: (sv.hyperopts ?? []).filter((h) => hyperoptMatchesFilter(h, filters)),
    }));

    result.push({ ...strategy, stageVersions: filteredVersions });
  }
  return result;
}

/** Collect distinct timeframe values across all strategies. */
export function collectTimeframes(strategies) {
  const set = new Set();
  for (const s of strategies) {
    for (const sv of s.stageVersions ?? []) {
      for (const h of sv.hyperopts ?? []) {
        if (h.timeframe) set.add(h.timeframe);
      }
    }
  }
  return [...set].sort();
}

/** Collect distinct status values. */
export function collectStatuses(strategies) {
  const set = new Set();
  for (const s of strategies) {
    for (const sv of s.stageVersions ?? []) {
      for (const h of sv.hyperopts ?? []) {
        if (h.status) set.add(h.status);
      }
    }
  }
  return [...set];
}

export const STAGE_TYPE_LABELS = {
  signal: "Signal",
  entry: "Entry",
  exit: "Exit",
  risk: "Risk",
};

export const STAGE_TYPE_OPTIONS = Object.entries(STAGE_ORDER).sort(
  ([, a], [, b]) => a - b,
).map(([k]) => ({ value: k, label: STAGE_TYPE_LABELS[k] ?? k }));
