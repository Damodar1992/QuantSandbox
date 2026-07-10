import React, { memo } from "react";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { AppButton } from "../../../../components/common/AppButton";
import { HeatMapIcon, DownloadIcon } from "../../../../components/shared";

export const HeatmapReportItemActions = memo(function HeatmapReportItemActions({
  item,
  heatMapId,
  onShowHeatmap,
  onDownloadReport,
  onShowItemFilters,
  className,
}) {
  const isHeatmap = item.type === "Heatmap";

  return (
    <div className={`flex items-center gap-1.5 ${className || ""}`}>
      {isHeatmap ? (
        <AppButton
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onShowHeatmap?.(heatMapId)}
          title="Show heatmap"
          aria-label="Show heatmap"
        >
          <HeatMapIcon className="h-3.5 w-3.5 shrink-0" />
        </AppButton>
      ) : (
        <AppButton
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={() => onDownloadReport?.()}
          title="Download report"
          aria-label="Download report"
        >
          <DownloadIcon className="h-3.5 w-3.5 shrink-0" />
        </AppButton>
      )}
      <HyperoptDetailsTooltip
        iconOnly
        title="Filters (read-only)"
        ariaLabel="Show filters snapshot"
        onShowDetails={() => onShowItemFilters?.(item)}
      />
    </div>
  );
});
