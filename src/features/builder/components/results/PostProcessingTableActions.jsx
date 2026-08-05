import React, { memo } from "react";
import { HyperoptDetailsTooltip } from "../../../../components/heatmap";
import { PostProcessingAnalyticsMenu } from "./PostProcessingAnalyticsMenu";
import { PostProcessingEpochMenu } from "./PostProcessingEpochMenu";

export const PostProcessingTableActions = memo(function PostProcessingTableActions({
  onShowDetails,
  onConfigureHeatMap,
  onGenerateFullReport,
  onGenerateTopKReport,
  onBestEpochs,
  onRunMiniBacktest,
  onAddTruncate,
  onRangeNarrowing,
  onComparisonWidget,
  miniBacktestEnabled = false,
  showEpochs = true,
  showAddTruncate = true,
  showRangeNarrowing = true,
  showComparisonWidget = true,
  className,
}) {
  return (
    <div className={`flex items-center justify-end gap-1.5 ${className || ""}`}>
      <HyperoptDetailsTooltip
        iconOnly
        title="Post-processing formula info"
        ariaLabel="Show post-processing formula info"
        onShowDetails={onShowDetails}
      />
      <PostProcessingEpochMenu
        iconOnly
        showEpochs={showEpochs}
        miniBacktestEnabled={miniBacktestEnabled}
        onBestEpochs={onBestEpochs}
        onRunMiniBacktest={onRunMiniBacktest}
      />
      <PostProcessingAnalyticsMenu
        showAddTruncate={showAddTruncate}
        showRangeNarrowing={showRangeNarrowing}
        showComparisonWidget={showComparisonWidget}
        onConfigureHeatMap={onConfigureHeatMap}
        onGenerateFullReport={onGenerateFullReport}
        onGenerateTopKReport={onGenerateTopKReport}
        onAddTruncate={onAddTruncate}
        onRangeNarrowing={onRangeNarrowing}
        onComparisonWidget={onComparisonWidget}
      />
    </div>
  );
});
