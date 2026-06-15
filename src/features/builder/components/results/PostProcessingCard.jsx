import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { HeatMapIcon, DownloadIcon } from "../../../../components/shared";

function HeatMapsReportsPanel({
  items,
  heatMapId,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  className,
}) {
  return (
    <div className={cx("rounded-md border border-[#303030] bg-[#0f0f0f] overflow-hidden", className)}>
      <div className="px-2.5 py-1.5 border-b border-[#303030] bg-amber-500/10 text-amber-200 text-[10px] font-medium">
        HeatMaps &amp; Reports
      </div>
      {items.length === 0 ? (
        <div className="px-2.5 py-2 text-[10px] text-[#595959]">No items.</div>
      ) : (
        <ul className="divide-y divide-[#303030]/60">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5"
            >
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[10px] text-[#a6a6a6]">{item.date}</span>
                <span className="rounded border border-[#303030] bg-[#141414] px-1.5 py-0.5 text-[9px] text-[#d9d9d9]">
                  {item.type}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <HyperoptDetailsTooltip
                  title="Filters (read-only)"
                  ariaLabel="Show filters snapshot"
                  onShowDetails={() => onShowItemFilters?.(item)}
                />
                {item.type === "Heatmap" ? (
                  <button
                    type="button"
                    onClick={() => onShowHeatmap?.(heatMapId)}
                    className={cx(ui.btn, "h-6 w-6 p-0 inline-flex items-center justify-center")}
                    title="Show heatmap"
                    aria-label="Show heatmap"
                  >
                    <HeatMapIcon className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDownloadReport?.()}
                    className={cx(ui.btn, "h-6 w-6 p-0 inline-flex items-center justify-center")}
                    title="Download report"
                    aria-label="Download report"
                  >
                    <DownloadIcon className="h-3.5 w-3.5 shrink-0" />
                  </button>
                )}
              </div>
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
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
}) {
  const heatMapId = `hyperopt-${rowId}-${sub.id}`;
  const items = sub.heatmapsAndReports || [];
  const hasTrunc = !!sub.truncScores;

  return (
    <div
      className={cx(
        ui.radius,
        "flex flex-col gap-2.5 border border-[#303030] border-l-4 border-l-sky-500 bg-[#141414] p-3",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold text-sky-200">{sub.date}</div>
        <HyperoptDetailsTooltip
          title="Post-processing formula info"
          ariaLabel="Show post-processing formula info"
          onShowDetails={() => onShowDetails?.()}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <ScoreBadge label="Min" value={sub.minScore} />
        <ScoreBadge label="AVG" value={sub.avgScore} />
        <ScoreBadge label="Max" value={sub.maxScore} />
        {sub.foldSize != null && <ScoreBadge label="Fold" value={sub.foldSize} />}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onConfigureHeatMap?.(heatMapId)}
          className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
        >
          Configure HeatMap
        </button>
        <button
          type="button"
          onClick={() => onGenerateReport?.()}
          className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
        >
          Generate Report
        </button>
      </div>

      {/* HeatMaps & Reports */}
      <HeatMapsReportsPanel
        items={items}
        heatMapId={heatMapId}
        onShowHeatmap={onShowHeatmap}
        onDownloadReport={onDownloadReport}
        onShowItemFilters={onShowItemFilters}
      />

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAddTruncate?.(sub)}
          className={cx(ui.btn, "h-7 px-2 text-[10px] whitespace-nowrap")}
        >
          Add truncate
        </button>
      </div>

      {/* Trunc details */}
      {hasTrunc && (
        <div className="rounded-md border border-[#303030] bg-[#0f0f0f] overflow-hidden">
          <div className="px-2.5 py-1.5 border-b border-[#303030] bg-emerald-500/10 text-emerald-200 text-[10px] font-medium">
            Trunc details
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
            <ScoreBadge label="Min" value={sub.truncScores?.min} />
            <ScoreBadge label="AVG" value={sub.truncScores?.avg} />
            <ScoreBadge label="Max" value={sub.truncScores?.max} />
            {sub.foldSize != null && <ScoreBadge label="Fold" value={sub.foldSize} />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-2.5 pb-2">
            <button
              type="button"
              onClick={() => onConfigureHeatMap?.(heatMapId)}
              className={cx(ui.btn, "h-6 px-2 text-[10px] whitespace-nowrap")}
            >
              Configure HeatMap
            </button>
            <button
              type="button"
              onClick={() => onGenerateReport?.()}
              className={cx(ui.btn, "h-6 px-2 text-[10px] whitespace-nowrap")}
            >
              Generate Report
            </button>
          </div>
          <HeatMapsReportsPanel
            items={items}
            heatMapId={heatMapId}
            onShowHeatmap={onShowHeatmap}
            onDownloadReport={onDownloadReport}
            onShowItemFilters={onShowItemFilters}
            className="mx-2.5 mb-2"
          />
        </div>
      )}
    </div>
  );
});

function ScoreBadge({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-[#303030] bg-[#0f0f0f] px-1.5 py-0.5 text-[10px]">
      <span className="text-[#8c8c8c]">{label}</span>
      <span className="tabular-nums text-[#d9d9d9]">{value ?? "—"}</span>
    </span>
  );
}
