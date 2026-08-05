import React, { memo } from "react";
import { LineChart, GitCompare } from "lucide-react";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { HeatmapReportItemActions } from "./HeatmapReportItemActions";
import { COMPARISON_WIDGET_ITEM_TYPE, RANGE_NARROWING_ITEM_TYPE } from "../../utils/analyticsItems";

export const AnalyticsItemActions = memo(function AnalyticsItemActions({
  item,
  heatMapId,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  onShowRangeNarrowingInfo,
  onShowRangeNarrowingResults,
  onShowComparisonWidget,
  onShowComparisonWidgetInfo,
  className,
}) {
  if (item.type === RANGE_NARROWING_ITEM_TYPE) {
    return (
      <div className={`flex items-center gap-1.5 ${className || ""}`}>
        <AppButton
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onShowRangeNarrowingResults?.(item)}
          title="Range narrowing result"
          aria-label="Range narrowing result"
        >
          <LineChart className="h-3.5 w-3.5 shrink-0" />
        </AppButton>
        <HyperoptDetailsTooltip
          iconOnly
          title="Range Narrowing run settings"
          ariaLabel="Show Range Narrowing run settings"
          onShowDetails={() => onShowRangeNarrowingInfo?.(item)}
        />
      </div>
    );
  }

  if (item.type === COMPARISON_WIDGET_ITEM_TYPE) {
    return (
      <div className={`flex items-center gap-1.5 ${className || ""}`}>
        <AppButton
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onShowComparisonWidget?.(item)}
          title="Open comparison widget"
          aria-label="Open comparison widget"
        >
          <GitCompare className="h-3.5 w-3.5 shrink-0" />
        </AppButton>
        <HyperoptDetailsTooltip
          iconOnly
          title="Comparison widget filters"
          ariaLabel="Show comparison widget filters"
          onShowDetails={() => onShowComparisonWidgetInfo?.(item)}
        />
      </div>
    );
  }

  return (
    <HeatmapReportItemActions
      item={item}
      heatMapId={heatMapId}
      onShowHeatmap={onShowHeatmap}
      onDownloadReport={onDownloadReport}
      onShowItemFilters={onShowItemFilters}
      className={className}
    />
  );
});
