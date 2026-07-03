import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { getStageLabel } from "../../utils/stageSelect";
import { formatMiniBacktestStageVersion } from "../../utils/miniBacktestDisplay";

function resolveEpochNumber(entry) {
  if (entry?.epochNumber != null) return entry.epochNumber;
  const label = entry.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

export const MiniBacktestFailPanel = memo(function MiniBacktestFailPanel({ entry }) {
  const epochNumber = resolveEpochNumber(entry);
  const stageLabel = entry?.stageId != null ? getStageLabel(entry.stageId) : entry?.stage || "—";
  const stageVersionLabel = formatMiniBacktestStageVersion(entry);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-[28px] leading-none text-red-300">
        ✕
      </div>
      <h2 className="text-[16px] font-semibold text-red-200">Mini Backtest failed</h2>
      <p className={cx("mt-2 max-w-md text-[12px] leading-relaxed", ui.textMuted)}>
        {entry?.failReason || "The run could not be completed. Try again from Favorite Epochs or Hyperopt results."}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#b8aecc]">
        <span className="rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 py-1">
          {stageLabel}
          {stageVersionLabel ? ` · ${stageVersionLabel}` : ""}
        </span>
        {epochNumber != null && (
          <span className="rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 py-1">
            Epoch #{epochNumber}
          </span>
        )}
      </div>
    </div>
  );
});
