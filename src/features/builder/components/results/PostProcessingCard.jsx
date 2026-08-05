import React, { memo, useState } from "react";
import { cx, ui } from "../../../../constants/ui";
import { crmAccent, crmSurface } from "../../../../constants/crmAccent";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { HeatMapIcon, FileTextIcon } from "../../../../components/shared";
import { AnalyticsItemActions } from "./AnalyticsItemActions";
import { filterAnalyticsItemsForStage } from "../../utils/analyticsItems";
import { RunStatusBadge } from "./RunStatusBadge";
import { PostProcessingEpochMenu } from "./PostProcessingEpochMenu";

function CollapseChevron({ collapsed }) {
  return <span className="text-[10px] text-[#8c8c8c]">{collapsed ? "▶" : "▼"}</span>;
}

function AnalyticsPanel({
  items,
  heatMapId,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  onShowRangeNarrowingInfo,
  onShowRangeNarrowingResults,
  onShowComparisonWidget,
  onShowComparisonWidgetInfo,
  showRangeNarrowing = true,
  className,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cx("rounded-md border overflow-hidden", crmSurface.border, crmSurface.input, className)}>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-medium text-left hover:bg-amber-500/15 transition-colors"
        aria-expanded={!collapsed}
      >
        <span>Analytics</span>
        <CollapseChevron collapsed={collapsed} />
      </button>
      {collapsed ? null : items.length === 0 ? (
        <div className="px-2.5 py-2 text-[10px] text-[#595959]">No items.</div>
      ) : (
        <ul className="divide-y divide-[#303030]/60">
          {items.map((item) => (
            <li
              key={item.id}
              className={cx(
                "flex items-center justify-between gap-2 px-2.5 py-1.5 border-l-2",
                item.type === "Heatmap" ? "border-l-emerald-500/40" : "border-l-sky-500/40"
              )}
            >
              <div className="min-w-0 flex items-center gap-2">
                {item.type === "Heatmap" ? (
                  <HeatMapIcon className="h-3 w-3 text-emerald-400 shrink-0" />
                ) : (
                  <FileTextIcon className="h-3 w-3 text-sky-400 shrink-0" />
                )}
                <span className="text-[10px] text-[#a6a6a6]">{item.date}</span>
                <span className="rounded border border-[#303030] bg-[#141414] px-1.5 py-0.5 text-[9px] text-[#d9d9d9]">
                  {item.type}
                </span>
                <RunStatusBadge status={item.status || "Completed"} />
              </div>
              <AnalyticsItemActions
                item={item}
                heatMapId={heatMapId}
                onShowHeatmap={onShowHeatmap}
                onDownloadReport={onDownloadReport}
                onShowItemFilters={onShowItemFilters}
                onShowRangeNarrowingInfo={onShowRangeNarrowingInfo}
                onShowRangeNarrowingResults={onShowRangeNarrowingResults}
                onShowComparisonWidget={onShowComparisonWidget}
                onShowComparisonWidgetInfo={onShowComparisonWidgetInfo}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Card representation of a single Post-processing result, with compact inner
 * lists for HeatMaps & Reports and Trunc details.
 */
export const PostProcessingCard = memo(function PostProcessingCard({
  rowId,
  sub,
  onShowDetails,
  onConfigureHeatMap,
  onGenerateReport,
  onAddTruncate,
  onBestEpochs,
  onRunMiniBacktest,
  miniBacktestEnabled = false,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  onShowRangeNarrowingInfo,
  onShowRangeNarrowingResults,
  onShowComparisonWidget,
  onShowComparisonWidgetInfo,
  activeStage,
  rawDataDeleted = false,
}) {
  const heatMapId = `hyperopt-${rowId}-${sub.id}`;
  const items = filterAnalyticsItemsForStage(sub.heatmapsAndReports, activeStage);
  const hasTrunc = !!sub.truncScores;
  const showEpochs = !rawDataDeleted;
  const showAddTruncate = !rawDataDeleted;
  const showComparisonWidget = (item) => onShowComparisonWidget?.(sub, item);
  const [collapsed, setCollapsed] = useState(false);
  const [truncCollapsed, setTruncCollapsed] = useState(false);

  return (
    <div
      className={cx(
        ui.radius,
        "flex flex-col gap-2.5 border border-l-4 border-l-sky-500 p-3",
        crmSurface.border,
        "bg-[#0f0f0f]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex items-center gap-2 min-w-0 text-left"
          aria-expanded={!collapsed}
        >
          <CollapseChevron collapsed={collapsed} />
          <span className="text-[11px] font-semibold text-sky-200">{sub.date}</span>
          <span className="rounded bg-[#2a2a2a] px-1 py-0.5 text-[10px] font-medium text-[#a6a6a6]">#{sub.analyzerNumber ?? "—"}</span>
          <RunStatusBadge status={sub.status || "Finished"} eta={sub.estimationTime} progress={sub.progress} />
        </button>
        <HyperoptDetailsTooltip
          title="Post-processing formula info"
          ariaLabel="Show post-processing formula info"
          onShowDetails={() => onShowDetails?.()}
        />
      </div>

      {collapsed ? null : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <AppButton type="button" variant="outline" size="sm" onClick={() => onConfigureHeatMap?.(heatMapId)}>
              <HeatMapIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              Configure HeatMap
            </AppButton>
            <AppButton type="button" variant="outline" size="sm" onClick={() => onGenerateReport?.()}>
              <FileTextIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
              Generate Report
            </AppButton>
            <PostProcessingEpochMenu
              showEpochs={showEpochs}
              miniBacktestEnabled={miniBacktestEnabled}
              onBestEpochs={() => onBestEpochs?.(sub)}
              onRunMiniBacktest={() => onRunMiniBacktest?.(sub)}
            />
          </div>

          {/* Analytics */}
          <AnalyticsPanel
            items={items}
            heatMapId={heatMapId}
            onShowHeatmap={onShowHeatmap}
            onDownloadReport={onDownloadReport}
            onShowItemFilters={onShowItemFilters}
            onShowRangeNarrowingInfo={onShowRangeNarrowingInfo}
            onShowRangeNarrowingResults={onShowRangeNarrowingResults}
            onShowComparisonWidget={showComparisonWidget}
            onShowComparisonWidgetInfo={onShowComparisonWidgetInfo}
          />

          {showAddTruncate ? (
            <div className="flex flex-wrap items-center gap-2">
              <AppButton type="button" variant="outline" size="sm" onClick={() => onAddTruncate?.(sub)}>
                Add truncate
              </AppButton>
            </div>
          ) : null}

          {/* Trunc details */}
          {hasTrunc && (
            <div className={cx("rounded-md border overflow-hidden", crmSurface.border, crmSurface.input)}>
              <button
                type="button"
                onClick={() => setTruncCollapsed((v) => !v)}
                className={cx(
                  "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 border-b text-[10px] font-medium text-left transition-colors hover:opacity-90",
                  crmSurface.border,
                  crmAccent.bg,
                  crmAccent.textStrong,
                )}
                aria-expanded={!truncCollapsed}
              >
                <span>Trunc details</span>
                <CollapseChevron collapsed={truncCollapsed} />
              </button>
              {truncCollapsed ? null : (
                <>
                  {/* Trunc summary */}
                  <div className="flex items-center gap-4 px-2.5 pt-2 pb-1.5 text-[10px]">
                    {sub.foldSize && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8c8c8c]">Truncated cycles</span>
                        <span className="text-[#d9d9d9] font-mono">{sub.foldSize}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8c8c8c]">Status</span>
                      <RunStatusBadge status={sub.status || "Finished"} eta={sub.estimationTime} progress={sub.progress} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 px-2.5 pb-2">
                    <AppButton type="button" variant="outline" size="sm" onClick={() => onConfigureHeatMap?.(heatMapId)}>
                      <HeatMapIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      Configure HeatMap
                    </AppButton>
                    <AppButton type="button" variant="outline" size="sm" onClick={() => onGenerateReport?.()}>
                      <FileTextIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                      Generate Report
                    </AppButton>
                  </div>
                  <AnalyticsPanel
                    items={items}
                    heatMapId={heatMapId}
                    onShowHeatmap={onShowHeatmap}
                    onDownloadReport={onDownloadReport}
                    onShowItemFilters={onShowItemFilters}
                    onShowRangeNarrowingInfo={onShowRangeNarrowingInfo}
                    onShowRangeNarrowingResults={onShowRangeNarrowingResults}
                    onShowComparisonWidget={showComparisonWidget}
                    onShowComparisonWidgetInfo={onShowComparisonWidgetInfo}
                    className="mx-2.5 mb-2"
                  />
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
});

