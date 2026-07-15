import React, { memo } from "react";
import { LineChart } from "lucide-react";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { HeatmapReportItemActions } from "./HeatmapReportItemActions";

export const AnalyticsItemActions = memo(function AnalyticsItemActions({
  item,
  heatMapId,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  onShowRangeNarrowingInfo,
  onShowRangeNarrowingResults,
  className,
}) {
  if (item.type === "Range Narrowing") {
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
