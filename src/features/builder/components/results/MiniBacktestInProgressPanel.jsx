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

export const MiniBacktestLoader = memo(function MiniBacktestLoader({ className }) {
  return (
    <div className={cx("relative flex items-center justify-center", className)}>
      <div className="absolute h-[72px] w-[72px] rounded-full border border-violet-500/15 bg-violet-500/[0.04]" />
      <div
        className="absolute h-[72px] w-[72px] rounded-full border-2 border-transparent border-t-violet-400/90 border-r-violet-500/30 animate-spin"
        style={{ animationDuration: "1.1s" }}
      />
      <div
        className="absolute h-[48px] w-[48px] rounded-full border-2 border-transparent border-b-fuchsia-400/70 border-l-violet-300/20 animate-spin"
        style={{ animationDuration: "1.7s", animationDirection: "reverse" }}
      />
      <div className="relative h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(168,96,240,0.85)] animate-pulse" />
    </div>
  );
});

export const MiniBacktestInProgressPanel = memo(function MiniBacktestInProgressPanel({ entry }) {
  const epochNumber = resolveEpochNumber(entry);
  const stageLabel = entry?.stageId != null ? getStageLabel(entry.stageId) : entry?.stage || "—";
  const stageVersionLabel = formatMiniBacktestStageVersion(entry);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center">
      <MiniBacktestLoader className="mb-6" />
      <h2 className="text-[16px] font-semibold text-[#faf7fd]">Mini Backtest in progress</h2>
      <p className={cx("mt-2 max-w-md text-[12px] leading-relaxed", ui.textMuted)}>
        Simulating cycles with your account settings. Results will appear here when the run completes.
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
        {entry?.pairs && (
          <span className="rounded-md border border-[rgba(60,40,80,0.45)] bg-[#19102b] px-2 py-1">
            {entry.pairs}
          </span>
        )}
      </div>
    </div>
  );
});
