import React, { memo } from "react";
import { cx, ui } from "../../../../constants/ui";
import { RunStatusBadge } from "./RunStatusBadge";
import { getStageLabel } from "../../utils/stageSelect";
import {
  formatMiniBacktestStageVersion,
  resolveMiniBacktestRunStatus,
} from "../../utils/miniBacktestDisplay";
import { MINI_BACKTEST_RUN_STATUSES } from "../../../../constants/miniBacktest";

function resolveEpochNumber(entry) {
  if (entry.epochNumber != null) return entry.epochNumber;
  const label = entry.epochLabel || "";
  const match = label.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

function formatShortDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export const MiniBacktestResultCard = memo(function MiniBacktestResultCard({
  entry,
  active,
  onSelect,
}) {
  const runStatus = resolveMiniBacktestRunStatus(entry);
  const isFinished = runStatus === MINI_BACKTEST_RUN_STATUSES.FINISHED;
  const s = entry.result?.summary;

  const epochNumber = resolveEpochNumber(entry);
  const stageLabel = entry.stageId != null ? getStageLabel(entry.stageId) : entry.stage || "—";
  const stageVersionLabel = formatMiniBacktestStageVersion(entry);
  const positive = isFinished && s ? s.roi >= 0 : null;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(entry.id)}
      className={cx(
        "w-full text-left rounded-md border px-3 py-2.5 transition-colors",
        active
          ? "border-violet-500/50 bg-[rgba(168,96,240,0.16)]"
          : "border-transparent hover:bg-[#1e1333] hover:border-[rgba(60,40,80,0.35)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={cx("text-[12px] font-medium truncate", active ? "text-[#faf7fd]" : "text-[#d9d9d9]")}>
            {stageLabel} · Epoch {epochNumber != null ? `#${epochNumber}` : "—"}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.hyperoptNumber != null && (
              <span className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-[9px] text-[#a6a6a6]">
                Hyperopt #{entry.hyperoptNumber}
              </span>
            )}
            {entry.analyzerNumber != null && (
              <span className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-[9px] text-[#a6a6a6]">
                Analyzer #{entry.analyzerNumber}
              </span>
            )}
            {stageVersionLabel && (
              <span className="rounded bg-violet-500/10 border border-violet-500/25 px-1.5 py-0.5 text-[9px] text-violet-200">
                {stageVersionLabel}
              </span>
            )}
          </div>
        </div>
        <RunStatusBadge status={runStatus} className="shrink-0" />
      </div>

      {isFinished && s ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className={cx(
              "text-[13px] font-mono font-semibold",
              positive ? "text-emerald-400" : "text-red-400",
            )}
          >
            {s.roi >= 0 ? "+" : ""}
            {s.roi.toFixed(2)}%
          </span>
          <span
            className={cx(
              "text-[10px] font-mono",
              positive ? "text-emerald-400/80" : "text-red-400/80",
            )}
          >
            {s.totalPnL >= 0 ? "+" : ""}
            {s.totalPnL.toFixed(2)}
          </span>
        </div>
      ) : (
        <div className={cx("mt-2 text-[10px]", ui.textMuted)}>
          {runStatus === MINI_BACKTEST_RUN_STATUSES.IN_PROGRESS
            ? "Running simulation…"
            : "Run did not complete"}
        </div>
      )}

      <div className={cx("text-[10px] mt-1", ui.textMuted)}>{formatShortDate(entry.createdAt)}</div>
    </button>
  );
});
