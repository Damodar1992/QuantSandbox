import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { formatHyperoptDateTime } from "../../utils/hyperoptFormatters";
import { resolveTagNames } from "../../../../features/tags/utils/tagStore";
import { PostProcessingCard } from "./PostProcessingCard";
import { RunStatusBadge } from "./RunStatusBadge";

/**
 * Inline detail drawer (right column) for a single Hyperopt run: summary header
 * plus a vertical list of Post-processing cards (each with HeatMaps & Reports
 * and Trunc details nested inside).
 */
export const HyperoptResultDrawer = memo(function HyperoptResultDrawer({
  run,
  showSource = false,
  sourceText = "—",
  sourceTitle = "—",
  showPostProcessing = false,
  onClose,
  onPostProcessing,
  onEditTags,
  onEditComment,
  onShowHyperoptDetails,
  onShowPostProcessingDetails,
  onConfigureHeatMap,
  onGenerateReport,
  onAddTruncate,
  onBestEpochs,
  onRunMiniBacktest,
  miniBacktestEnabled = false,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  tagsRegistry = [],
}) {
  if (!run) return null;
  const children = run.children || [];
  const tagNames = resolveTagNames(run.tagIds, tagsRegistry);

  return (
    <div className={cx(ui.radius, "border border-[#303030] bg-[#141414] overflow-hidden")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-[#303030] bg-[#19102b]/40 px-3 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[12px] font-semibold text-[#f5f5f5]">{formatHyperoptDateTime(run.date)}</span>
            <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">#{run.hyperoptNumber ?? "—"}</span>
            <RunStatusBadge status={run.status} />
          </div>
          <div className="mt-0.5 text-[10px] text-[#8c8c8c]">{children.length} post-processing</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <HyperoptDetailsTooltip onShowDetails={() => onShowHyperoptDetails?.()} />
          <AppButton
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onEditTags?.(run)}
            aria-label="Edit tags"
            className="h-6 rounded-full px-2 text-[10px] text-[#8c8c8c] hover:text-[#d9d9d9]"
          >
            Tags
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onEditComment?.(run)}
            aria-label="Edit comment"
            className="h-6 rounded-full px-2 text-[10px] text-[#8c8c8c] hover:text-[#d9d9d9]"
          >
            Comment
          </AppButton>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#8c8c8c] hover:bg-[#2c1b46]/60 hover:text-[#d9d9d9]"
            aria-label="Close details"
            title="Close"
          >
            <span className="text-[13px] leading-none">✕</span>
          </button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {/* Run summary */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:grid-cols-3">
            <SummaryField label="Pairs" value={run.pairs} />
            <SummaryField label="TimeFrame" value={run.timeFrame} />
            <SummaryField label="TimeRange" value={run.knowRange} />
            {showSource && <SummaryField label="Source" value={sourceText} title={sourceTitle} />}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[10px]">
            <div className="text-[#8c8c8c]">Tags</div>
            <div className="min-w-0">
              {tagNames.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tagNames.map((t) => (
                    <span
                      key={t}
                      className="rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px] text-[#a6a6a6]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#595959]">—</span>
              )}
            </div>
            <div className="text-[#8c8c8c]">Comment</div>
            <div className="text-[#a6a6a6] min-w-0" title={run.comment}>
              {run.comment?.trim() ? run.comment : <span className="text-[#595959]">—</span>}
            </div>
          </div>

          {showPostProcessing && (
            <div className="border-t border-[#303030]/50 mt-2.5 pt-2.5">
              <AppButton type="button" variant="primary" size="sm" onClick={() => onPostProcessing?.()}>
                Post-processing
              </AppButton>
            </div>
          )}
        </div>

        {/* Post-processing results */}
        <div className="text-[12px] font-semibold text-[#f5f5f5]">Post-processing result</div>

        {children.length === 0 ? (
          <div className={cx(ui.radius, ui.panelMuted, "p-3 text-[11px]", ui.textMuted)}>
            No post-processing results for this run.
          </div>
        ) : (
          <div className="relative ml-4">
            {/* Vertical connector line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-sky-500/20" />
            <div className="space-y-3 pl-4">
              {children.map((sub) => (
                <PostProcessingCard
                  key={sub.id}
                  rowId={run.id}
                  sub={sub}
                  onShowDetails={onShowPostProcessingDetails}
                  onConfigureHeatMap={onConfigureHeatMap}
                  onGenerateReport={onGenerateReport}
                  onAddTruncate={onAddTruncate}
                  onBestEpochs={onBestEpochs}
                  onRunMiniBacktest={onRunMiniBacktest}
                  miniBacktestEnabled={miniBacktestEnabled}
                  onShowHeatmap={onShowHeatmap}
                  onDownloadReport={onDownloadReport}
                  onShowItemFilters={onShowItemFilters}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

function SummaryField({ label, value, title }) {
  return (
    <div className="min-w-0">
      <div className="text-[#8c8c8c]">{label}</div>
      <div className="text-[#d9d9d9] truncate" title={title ?? value}>
        {value ?? "—"}
      </div>
    </div>
  );
}
