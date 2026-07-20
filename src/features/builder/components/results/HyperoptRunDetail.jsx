import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { formatHyperoptDateTime, isHyperoptRawDataDeleted } from "../../utils/hyperoptFormatters";
import { resolveTagNames } from "../../../../features/tags/utils/tagStore";
import { PostProcessingCard } from "./PostProcessingCard";
import { RunStatusBadge } from "./RunStatusBadge";

/**
 * Master-detail screen for a single Hyperopt run: breadcrumb, run summary and
 * a grid of Post-processing cards.
 */
export const HyperoptRunDetail = memo(function HyperoptRunDetail({
  run,
  showSource = false,
  sourceText = "—",
  sourceTitle = "—",
  showPostProcessing = false,
  onBack,
  onPostProcessing,
  onEditTags,
  onEditComment,
  onShowHyperoptDetails,
  onShowPostProcessingDetails,
  onConfigureHeatMap,
  onGenerateReport,
  onAddTruncate,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  tagsRegistry = [],
}) {
  if (!run) return null;
  const children = run.children || [];
  const tagNames = resolveTagNames(run.tagIds, tagsRegistry);
  const rawDataDeleted = isHyperoptRawDataDeleted(run.status);
  const canLaunchPostProcessing = showPostProcessing && !rawDataDeleted;

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="text-[#8c8c8c] hover:text-[#d9d9d9] transition-colors"
        >
          Optimization Results
        </button>
        <span className="text-[#595959]">/</span>
        <span className="text-[#d9d9d9] truncate">
          {formatHyperoptDateTime(run.date)} · {run.pairs}
        </span>
        <AppButton type="button" variant="outline" size="xs" className="ml-auto" onClick={() => onBack?.()}>
          ← Back
        </AppButton>
      </div>

      {/* Run summary */}
      <div
        className={cx(
          ui.radius,
          "border border-[#303030] border-l-4 border-l-emerald-500 bg-[#141414] p-3 space-y-2",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="text-[12px] font-semibold text-[#f5f5f5]">{formatHyperoptDateTime(run.date)}</div>
              <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">#{run.hyperoptNumber ?? "—"}</span>
              <RunStatusBadge status={run.status} />
            </div>
            <div className="mt-0.5 text-[10px] text-[#8c8c8c]">
              {children.length} post-processing
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <HyperoptDetailsTooltip onShowDetails={() => onShowHyperoptDetails?.()} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:grid-cols-4">
          <SummaryField label="Pairs" value={run.pairs} />
          <SummaryField label="TimeFrame" value={run.timeFrame} />
          <SummaryField label="TimeRange" value={run.knowRange} />
          {showSource && <SummaryField label="Source" value={sourceText} title={sourceTitle} />}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
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
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <div className="text-[#8c8c8c]">Comment</div>
          <div className="text-[#a6a6a6] min-w-0" title={run.comment}>
            {run.comment?.trim() ? run.comment : <span className="text-[#595959]">—</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {canLaunchPostProcessing && (
            <AppButton type="button" variant="default" size="xs" onClick={() => onPostProcessing?.()}>
              Post-processing
            </AppButton>
          )}
          <AppButton type="button" variant="outline" size="xs" onClick={() => onEditTags?.(run)}>
            Tags
          </AppButton>
          <AppButton type="button" variant="outline" size="xs" onClick={() => onEditComment?.(run)}>
            Comment
          </AppButton>
        </div>
      </div>

      {/* Post-processing cards */}
      <div className="flex items-center gap-2">
        <span className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-200">
          Post-processing result
        </span>
      </div>

      {children.length === 0 ? (
        <div className={cx(ui.radius, ui.panelMuted, "p-3 text-[11px]", ui.textMuted)}>
          No post-processing results for this run.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {children.map((sub) => (
            <PostProcessingCard
              key={sub.id}
              rowId={run.id}
              sub={sub}
              rawDataDeleted={rawDataDeleted}
              onShowDetails={onShowPostProcessingDetails}
              onConfigureHeatMap={onConfigureHeatMap}
              onGenerateReport={onGenerateReport}
              onAddTruncate={onAddTruncate}
              onShowHeatmap={onShowHeatmap}
              onDownloadReport={onDownloadReport}
              onShowItemFilters={onShowItemFilters}
            />
          ))}
        </div>
      )}
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
