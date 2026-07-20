/**
 * Central state for the Storage RAW data management feature.
 * Owns dataset, selection, expansion, filters, delete-op lifecycle, and audit log.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  INITIAL_STORAGE_STRATEGIES,
  STORAGE_QUOTA_GB,
} from "../../../constants/storageMock";
import { EMPTY_FILTERS, filterStrategies, hasActiveFilters } from "../utils/storageFilters";
import {
  deriveRowState,
  eligibleForDelete,
  selectedCount,
  spaceToRelease,
  stageScopeIds,
  strategyScopeIds,
  toggleScope,
  versionScopeIds,
} from "../utils/storageSelection";
import { totalUsedGb } from "../utils/storageTree";
import { buildAuditEntry, simulateDelete } from "../utils/storageDelete";
import { MOCK_CURRENT_USER } from "../../../constants/tags";
import { visibleStrategies } from "../utils/storagePermissions";

// ─── Delete op state machine ─────────────────────────────────────────────────
// deleteOp: { phase: "idle"|"preparing"|"deleting"|"done", result?, processingIds Set }

const IDLE_OP = { phase: "idle", processingIds: new Set() };

export function useStorageState({ role = "Admin", userId = MOCK_CURRENT_USER.id } = {}) {
  const [strategies, setStrategies] = useState(() =>
    JSON.parse(JSON.stringify(INITIAL_STORAGE_STRATEGIES)),
  );

  const permittedStrategies = useMemo(
    () => visibleStrategies(strategies, role, userId),
    [strategies, role, userId],
  );

  const [selectedHyperoptIds, setSelectedHyperoptIds] = useState(() => new Set());
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [deleteOp, setDeleteOp] = useState(IDLE_OP);
  const [auditLog, setAuditLog] = useState([]);

  // ─── Derived totals ────────────────────────────────────────────────────────
  const usedGb = useMemo(() => totalUsedGb(strategies), [strategies]);
  const totals = useMemo(
    () => ({
      usedGb,
      quotaGb: STORAGE_QUOTA_GB,
      pct: STORAGE_QUOTA_GB > 0 ? (usedGb / STORAGE_QUOTA_GB) * 100 : 0,
    }),
    [usedGb],
  );

  const eligibleSet = useMemo(
    () => eligibleForDelete(selectedHyperoptIds, strategies),
    [selectedHyperoptIds, strategies],
  );

  const selectionSummary = useMemo(
    () => ({
      selectedCount: selectedCount(selectedHyperoptIds),
      eligibleCount: eligibleSet.size,
      spaceToRelease: spaceToRelease(eligibleSet, strategies),
    }),
    [selectedHyperoptIds, eligibleSet, strategies],
  );

  const filteredStrategies = useMemo(
    () => filterStrategies(permittedStrategies, filters),
    [permittedStrategies, filters],
  );

  // ─── Expansion ─────────────────────────────────────────────────────────────
  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const ids = new Set();
    for (const s of strategies) {
      ids.add(s.id);
      for (const sv of s.stageVersions ?? []) {
        ids.add(sv.id);
        ids.add(`stage-${s.id}-${sv.stageType}`);
      }
    }
    setExpandedIds(ids);
  }, [strategies]);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  // ─── Selection actions ─────────────────────────────────────────────────────
  const toggleStrategy = useCallback(
    (strategy) => {
      const scope = strategyScopeIds(strategy);
      setSelectedHyperoptIds((prev) => toggleScope(prev, scope));
    },
    [],
  );

  const toggleStage = useCallback(
    (strategy, stageType) => {
      const scope = stageScopeIds(strategy, stageType);
      setSelectedHyperoptIds((prev) => toggleScope(prev, scope));
    },
    [],
  );

  const toggleVersion = useCallback(
    (strategy, versionId) => {
      const scope = versionScopeIds(strategy, versionId);
      setSelectedHyperoptIds((prev) => toggleScope(prev, scope));
    },
    [],
  );

  const toggleHyperopt = useCallback((hyperoptId) => {
    setSelectedHyperoptIds((prev) => {
      const next = new Set(prev);
      next.has(hyperoptId) ? next.delete(hyperoptId) : next.add(hyperoptId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedHyperoptIds(new Set()), []);

  // ─── Derive row states ─────────────────────────────────────────────────────
  const getStrategyState = useCallback(
    (strategy) => deriveRowState(strategyScopeIds(strategy), selectedHyperoptIds),
    [selectedHyperoptIds],
  );

  const getStageState = useCallback(
    (strategy, stageType) =>
      deriveRowState(stageScopeIds(strategy, stageType), selectedHyperoptIds),
    [selectedHyperoptIds],
  );

  const getVersionState = useCallback(
    (strategy, versionId) =>
      deriveRowState(versionScopeIds(strategy, versionId), selectedHyperoptIds),
    [selectedHyperoptIds],
  );

  // ─── Filters (visibility only; selection is independent) ───────────────────
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  // ─── Delete operation ──────────────────────────────────────────────────────
  const startedAtRef = useRef(null);

  const startDelete = useCallback(() => {
    const ids = [...eligibleSet];
    if (ids.length === 0) return;

    startedAtRef.current = new Date().toISOString();
    const sizeBefore = spaceToRelease(eligibleSet, strategies);

    simulateDelete(ids, {
      onPreparing: () => {
        setDeleteOp({ phase: "preparing", processingIds: new Set() });
      },
      onDeleting: (processingIds) => {
        setDeleteOp({ phase: "deleting", processingIds });
      },
      onDone: ({ status, succeededIds, failedIds, errors }) => {
        const finishedAt = new Date().toISOString();
        const released = spaceToRelease(new Set(succeededIds), strategies);

        // Mark succeeded hyperopts as deleted in the dataset
        setStrategies((prev) =>
          prev.map((s) => ({
            ...s,
            stageVersions: (s.stageVersions ?? []).map((sv) => ({
              ...sv,
              hyperopts: (sv.hyperopts ?? []).map((h) =>
                succeededIds.includes(h.id)
                  ? { ...h, status: "Raw data deleted", rawSizeGb: 0 }
                  : h,
              ),
            })),
          })),
        );

        // Build audit entry
        const scope = strategies
          .filter((s) =>
            (s.stageVersions ?? []).some((sv) =>
              (sv.hyperopts ?? []).some((h) => ids.includes(h.id)),
            ),
          )
          .map((s) => ({ strategyId: s.id, strategyName: s.name }));

        const entry = buildAuditEntry({
          user: MOCK_CURRENT_USER.login,
          startedAt: startedAtRef.current,
          scope,
          eligibleIds: ids,
          succeededIds,
          failedIds,
          sizeBefore,
          released,
          status,
          errors,
          finishedAt,
        });

        setAuditLog((prev) => [entry, ...prev]);
        setDeleteOp((prev) => ({ ...prev, phase: "done", result: { status, succeededIds, failedIds, errors, released } }));

        // Remove succeeded from selection; failed remain selected
        setSelectedHyperoptIds((prev) => {
          const next = new Set(prev);
          for (const id of succeededIds) next.delete(id);
          return next;
        });
      },
    });
  }, [eligibleSet, strategies]);

  const dismissDeleteResult = useCallback(() => {
    setDeleteOp(IDLE_OP);
  }, []);

  return {
    // Data
    strategies: permittedStrategies,
    allStrategies: strategies,
    filteredStrategies,
    // Totals
    totals,
    // Selection
    selectedHyperoptIds,
    eligibleSet,
    selectionSummary,
    toggleStrategy,
    toggleStage,
    toggleVersion,
    toggleHyperopt,
    clearSelection,
    getStrategyState,
    getStageState,
    getVersionState,
    // Expansion
    expandedIds,
    toggleExpand,
    expandAll,
    collapseAll,
    // Filters
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(filters),
    // Delete
    deleteOp,
    startDelete,
    dismissDeleteResult,
    // Audit
    auditLog,
  };
}
