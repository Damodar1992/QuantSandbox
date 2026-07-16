/**
 * Selection logic for the Storage feature.
 *
 * Source of truth: `selectedHyperoptIds` – a Set of leaf hyperopt ids.
 * Every checkbox state is derived from its scope set.
 */

import {
  getStrategyHyperoptIds,
  getStageHyperoptIds,
  getVersionBranchHyperoptIds,
} from "./storageTree";

// ─── Tri-state derivation ────────────────────────────────────────────────────

/**
 * Derives checkbox state from a scope id array and the current selection Set.
 * @returns {"selected"|"partial"|"none"}
 */
export function deriveRowState(scopeIds, selectedSet) {
  if (scopeIds.length === 0) return "none";
  const selected = scopeIds.filter((id) => selectedSet.has(id));
  if (selected.length === 0) return "none";
  if (selected.length === scopeIds.length) return "selected";
  return "partial";
}

// ─── Scope resolvers ─────────────────────────────────────────────────────────

export function strategyScopeIds(strategy) {
  return getStrategyHyperoptIds(strategy);
}

export function stageScopeIds(strategy, stageType) {
  return getStageHyperoptIds(strategy, stageType);
}

export function versionScopeIds(strategy, versionId) {
  return getVersionBranchHyperoptIds(strategy, versionId);
}

// ─── Toggle helper ───────────────────────────────────────────────────────────

/**
 * Returns a new Set reflecting the toggle action for a scope.
 * Rule: if all scope ids are selected → remove all; otherwise → add all.
 */
export function toggleScope(selectedSet, scopeIds) {
  const allSelected = scopeIds.every((id) => selectedSet.has(id));
  const next = new Set(selectedSet);
  if (allSelected) {
    for (const id of scopeIds) next.delete(id);
  } else {
    for (const id of scopeIds) next.add(id);
  }
  return next;
}

// ─── Eligible for deletion ───────────────────────────────────────────────────

/**
 * Filters selected hyperopt ids to those eligible for deletion
 * (excludes status "Raw data deleted" and "Running").
 */
export function eligibleForDelete(selectedSet, strategies) {
  const eligible = new Set();
  for (const s of strategies) {
    for (const sv of s.stageVersions ?? []) {
      for (const h of sv.hyperopts ?? []) {
        if (selectedSet.has(h.id) && h.status !== "Raw data deleted" && h.status !== "Running") {
          eligible.add(h.id);
        }
      }
    }
  }
  return eligible;
}

/** Total raw size of all eligible-selected hyperopts. */
export function spaceToRelease(eligibleSet, strategies) {
  let total = 0;
  for (const s of strategies) {
    for (const sv of s.stageVersions ?? []) {
      for (const h of sv.hyperopts ?? []) {
        if (eligibleSet.has(h.id)) total += h.rawSizeGb ?? 0;
      }
    }
  }
  return total;
}

/** Count of unique hyperopts in the selected set (including non-eligible). */
export function selectedCount(selectedSet) {
  return selectedSet.size;
}
