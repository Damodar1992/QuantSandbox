/**
 * Confirmation modal before deleting RAW data.
 * Shows: affected hyperopt count, size to release, grouping by strategy/stage/version,
 * "entities that remain" note, and a warning.
 */

import React, { useMemo } from "react";
import { cx } from "../../constants/ui";
import { AppButton } from "../common";
import { STAGE_TYPE_LABELS } from "../../features/storage/utils/storageFilters";

function fmt(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
  return `${gb.toFixed(2)} GB`;
}

export function StorageDeleteConfirmModal({
  eligibleSet,
  strategies,
  selectionSummary,
  onConfirm,
  onCancel,
}) {
  // Build a deduped grouping: strategy → stage → version → hyperopts
  const grouped = useMemo(() => {
    const result = [];
    for (const strategy of strategies) {
      const stageMap = {};
      for (const sv of strategy.stageVersions ?? []) {
        const qualifying = (sv.hyperopts ?? []).filter((h) => eligibleSet.has(h.id));
        if (qualifying.length === 0) continue;

        const stageLabel = STAGE_TYPE_LABELS[sv.stageType] ?? sv.stageType;
        if (!stageMap[stageLabel]) stageMap[stageLabel] = [];
        stageMap[stageLabel].push({
          versionNumber: sv.versionNumber,
          versionId: sv.id,
          hyperopts: qualifying,
        });
      }
      if (Object.keys(stageMap).length === 0) continue;
      result.push({ strategy, stages: stageMap });
    }
    return result;
  }, [eligibleSet, strategies]);

  const { eligibleCount, spaceToRelease } = selectionSummary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="rounded-lg bg-[#141414] border border-[#303030] max-w-[580px] w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#303030]">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-red-400" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] font-semibold text-foreground">Delete RAW Data</span>
          </div>
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto p-4 flex-1 min-h-0 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-bold text-red-400">{eligibleCount}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                hyperopt{eligibleCount !== 1 ? "s" : ""} to delete
              </div>
            </div>
            <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/60 px-3 py-3 text-center">
              <div className="text-[22px] font-bold text-emerald-400">{fmt(spaceToRelease)}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">space to release</div>
            </div>
          </div>

          {/* Grouping */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Affected
            </div>
            {grouped.map(({ strategy, stages }) => (
              <div key={strategy.id} className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 px-3 py-2.5 space-y-1.5">
                <div className="text-[12px] font-semibold text-foreground">{strategy.name}</div>
                {Object.entries(stages).map(([stageLabel, versions]) => (
                  <div key={stageLabel} className="ml-3 space-y-1">
                    <div className="text-[11px] text-violet-300">{stageLabel}</div>
                    {versions.map((v) => (
                      <div key={v.versionId} className="ml-3 text-[10px] text-muted-foreground">
                        v{v.versionNumber} — {v.hyperopts.length} hyperopt{v.hyperopts.length !== 1 ? "s" : ""}
                        {" "}({fmt(v.hyperopts.reduce((s, h) => s + (h.rawSizeGb ?? 0), 0))})
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Entities that remain */}
          <div className="rounded-lg border border-[#303030] bg-[#0f0f0f]/40 px-3 py-2.5 space-y-1">
            <div className="text-[11px] font-medium text-foreground">Entities that remain</div>
            <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Strategy, Stage, Stage Version, Hyperopt records</li>
              <li>Analyzer runs, Epochs, Range Narrowing results</li>
              <li>Reports and Heatmaps (read-only)</li>
            </ul>
            <div className="text-[10px] text-muted-foreground/70 mt-1">
              Post-processing cannot be re-run after RAW data deletion.
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2.5">
            <svg className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L1.5 13.5h13L8 1.5zM8 6v4M8 11.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div className="text-[11px] text-red-300">
              This action is <strong>irreversible</strong>. RAW data and associated technical artifacts
              will be permanently removed from disk.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#303030] flex justify-end gap-2">
          <AppButton variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </AppButton>
          <AppButton variant="destructive" size="sm" onClick={onConfirm}>
            Delete {eligibleCount} hyperopt{eligibleCount !== 1 ? "s" : ""} RAW data
          </AppButton>
        </div>
      </div>
    </div>
  );
}
