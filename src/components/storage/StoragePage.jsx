/**
 * Storage RAW Data Management page.
 */

import React, { useState } from "react";
import { StorageUsageBarFull } from "./StorageUsageBar";
import { StorageFilters } from "./StorageFilters";
import { StorageSelectionSummary } from "./StorageSelectionSummary";
import { StorageTable } from "./StorageTable";
import { StorageDeleteConfirmModal } from "./StorageDeleteConfirmModal";
import { StorageDeleteProgressModal } from "./StorageDeleteProgressModal";
import { StorageHowItWorksModal } from "./StorageHowItWorksModal";
import { AppButton } from "../common";

export function StoragePage({ storageState }) {
  const {
    strategies,
    allStrategies,
    filteredStrategies,
    totals,
    selectionSummary,
    selectedHyperoptIds,
    eligibleSet,
    toggleStrategy,
    toggleStage,
    toggleVersion,
    toggleHyperopt,
    clearSelection,
    getStrategyState,
    getStageState,
    getVersionState,
    expandedIds,
    toggleExpand,
    expandAll,
    collapseAll,
    filters,
    updateFilter,
    clearFilters,
    deleteOp,
    startDelete,
    dismissDeleteResult,
  } = storageState;

  const [showConfirm, setShowConfirm] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const handleDeleteClick = () => setShowConfirm(true);
  const handleConfirm = () => {
    setShowConfirm(false);
    startDelete();
  };
  const handleCancelConfirm = () => setShowConfirm(false);
  const handleHowItWorksOpen = () => setShowHowItWorks(true);
  const handleHowItWorksClose = () => setShowHowItWorks(false);

  const deleteInProgress =
    deleteOp.phase === "preparing" || deleteOp.phase === "deleting";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-foreground">Storage</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Manage Hyperopt RAW data across all strategies.
          </p>
        </div>

        <div className="w-72">
          <StorageUsageBarFull
            usedGb={totals.usedGb}
            quotaGb={totals.quotaGb}
            pct={totals.pct}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <StorageFilters
          filters={filters}
          updateFilter={updateFilter}
          clearFilters={clearFilters}
          strategies={allStrategies ?? strategies}
        />

        <div className="ml-auto flex items-center gap-2 text-[11px] text-[#8c8c8c]">
          <AppButton
            onClick={handleHowItWorksOpen}
            variant="outline"
            size="xs"
            className="border-violet-500/70 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20"
          >
            How it Works?
          </AppButton>
          <button
            type="button"
            onClick={expandAll}
            className="hover:text-[#d9d9d9] underline-offset-2 hover:underline"
          >
            Expand all
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={collapseAll}
            className="hover:text-[#d9d9d9] underline-offset-2 hover:underline"
          >
            Collapse all
          </button>
        </div>
      </div>

      <StorageSelectionSummary
        selectionSummary={selectionSummary}
        onClearSelection={clearSelection}
        onDeleteRAWData={handleDeleteClick}
        disabled={deleteInProgress}
      />

      <StorageTable
        strategies={filteredStrategies}
        allStrategies={allStrategies ?? strategies}
        selectedHyperoptIds={selectedHyperoptIds}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onToggleStrategy={toggleStrategy}
        onToggleStage={toggleStage}
        onToggleVersion={toggleVersion}
        onToggleHyperopt={toggleHyperopt}
        getStrategyState={getStrategyState}
        getStageState={getStageState}
        getVersionState={getVersionState}
        deleteOp={deleteOp}
      />

      {showConfirm && (
        <StorageDeleteConfirmModal
          eligibleSet={eligibleSet}
          strategies={strategies}
          selectionSummary={selectionSummary}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      {(deleteOp.phase === "preparing" ||
        deleteOp.phase === "deleting" ||
        deleteOp.phase === "done") && (
        <StorageDeleteProgressModal
          deleteOp={deleteOp}
          onDismiss={dismissDeleteResult}
        />
      )}

      {showHowItWorks && <StorageHowItWorksModal onClose={handleHowItWorksClose} />}
    </div>
  );
}
