/**
 * Size aggregation and scope-id resolution for the Storage feature.
 *
 * Data shape:
 *   strategy.stageVersions[] -> { id, stageType, versionNumber, parentVersionId, hyperopts[] }
 *   hyperopt -> { id, rawSizeGb, status, ... }
 *
 * "Raw data deleted" hyperopts have rawSizeGb === 0 and do not contribute to sizes.
 */

import { STAGE_ORDER } from "../../../constants/storageMock";

// ─── Flatten helpers ─────────────────────────────────────────────────────────

/** Returns every hyperopt object in a strategy. */
export function flattenHyperopts(strategy) {
  return (strategy.stageVersions ?? []).flatMap((sv) => sv.hyperopts ?? []);
}

/** Returns every hyperopt id in a strategy. */
export function getStrategyHyperoptIds(strategy) {
  return flattenHyperopts(strategy).map((h) => h.id);
}

/**
 * Returns all hyperopt ids for stages whose order is >= order(stageType).
 * @deprecated Prefer getStageOnlyHyperoptIds for checkbox cascade in the table tree.
 */
export function getStageHyperoptIds(strategy, stageType) {
  const minOrder = STAGE_ORDER[stageType] ?? 1;
  return (strategy.stageVersions ?? [])
    .filter((sv) => (STAGE_ORDER[sv.stageType] ?? 0) >= minOrder)
    .flatMap((sv) => sv.hyperopts ?? [])
    .map((h) => h.id);
}

/** Hyperopt ids for versions of a single stage type (direct children in the table tree). */
export function getStageOnlyHyperoptIds(strategy, stageType) {
  return (strategy.stageVersions ?? [])
    .filter((sv) => sv.stageType === stageType)
    .flatMap((sv) => sv.hyperopts ?? [])
    .map((h) => h.id);
}

/** Hyperopt ids directly under a version row (not descendant versions in other stages). */
export function getVersionDirectHyperoptIds(strategy, versionId) {
  const sv = (strategy.stageVersions ?? []).find((v) => v.id === versionId);
  return (sv?.hyperopts ?? []).map((h) => h.id);
}

/**
 * Returns all descendant version ids of a given version node (including itself),
 * traversing parentVersionId links (§8.4).
 */
export function getVersionBranchIds(stageVersions, versionId) {
  const result = new Set([versionId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const sv of stageVersions) {
      if (!result.has(sv.id) && result.has(sv.parentVersionId)) {
        result.add(sv.id);
        grew = true;
      }
    }
  }
  return result;
}

/**
 * Returns all hyperopt ids belonging to versionId + its descendants.
 * Spans multiple stages (entry, exit, risk) if lineage crosses them.
 */
export function getVersionBranchHyperoptIds(strategy, versionId) {
  const branchIds = getVersionBranchIds(strategy.stageVersions ?? [], versionId);
  return (strategy.stageVersions ?? [])
    .filter((sv) => branchIds.has(sv.id))
    .flatMap((sv) => sv.hyperopts ?? [])
    .map((h) => h.id);
}

// ─── Size aggregators (always recomputed from live state §6.5) ───────────────

export function hyperoptSize(h) {
  return typeof h.rawSizeGb === "number" ? h.rawSizeGb : 0;
}

export function versionSize(sv) {
  return (sv.hyperopts ?? []).reduce((sum, h) => sum + hyperoptSize(h), 0);
}

export function stageSize(strategy, stageType) {
  return (strategy.stageVersions ?? [])
    .filter((sv) => sv.stageType === stageType)
    .reduce((sum, sv) => sum + versionSize(sv), 0);
}

export function strategySize(strategy) {
  return (strategy.stageVersions ?? []).reduce((sum, sv) => sum + versionSize(sv), 0);
}

export function totalUsedGb(strategies) {
  return strategies.reduce((sum, s) => sum + strategySize(s), 0);
}

// ─── Stage grouping helper ───────────────────────────────────────────────────

/** Groups stageVersions of a strategy by stageType, sorted by STAGE_ORDER. */
export function groupVersionsByStage(strategy) {
  const groups = {};
  for (const sv of strategy.stageVersions ?? []) {
    if (!groups[sv.stageType]) groups[sv.stageType] = [];
    groups[sv.stageType].push(sv);
  }
  return Object.entries(groups).sort(([a], [b]) => (STAGE_ORDER[a] ?? 0) - (STAGE_ORDER[b] ?? 0));
}

/** Returns a hyperopt object by id across all strategies. */
export function findHyperopt(strategies, hyperoptId) {
  for (const s of strategies) {
    for (const sv of s.stageVersions ?? []) {
      for (const h of sv.hyperopts ?? []) {
        if (h.id === hyperoptId) return { hyperopt: h, version: sv, strategy: s };
      }
    }
  }
  return null;
}
