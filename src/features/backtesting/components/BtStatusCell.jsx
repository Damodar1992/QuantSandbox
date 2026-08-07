import React, { memo } from "react";
import { AppBadge } from "@/components/common/AppBadge";
import { Progress } from "@/components/ui/progress";
import { cx } from "@/constants/ui";
import { BT_RUN_STATUS, BT_STATUS_BADGE } from "@/constants/backtesting";
import { BtValueTooltip } from "./BtInfoTooltip";

const BAR =
  "h-1.5 w-16 shrink-0 rounded-full bg-[#0f0f0f] border border-[rgba(60,40,80,0.35)] " +
  "[&_[data-slot=progress-indicator]]:bg-violet-600 " +
  "[&_[data-slot=progress-indicator]]:transition-[transform] [&_[data-slot=progress-indicator]]:duration-300 " +
  "[&_[data-slot=progress-indicator]]:ease-out";

function formatErrorTooltip(error) {
  if (!error) return null;
  const detail = [error.message, error.hint ? `What to do: ${error.hint}` : null]
    .filter(Boolean)
    .join(" ");
  if (!error.code && !detail) return null;
  return { code: error.code || null, detail: detail || null };
}

/**
 * Status pill + inline progress.
 * `progressLabel` carries the type-specific counter: "Shuffling 240 / 500",
 * "Series generation 66%", "Synthetic backtests 700 / 1000".
 * Failed error details appear as a tooltip on the badge.
 */
export const BtStatusCell = memo(function BtStatusCell({ status, pct, progressLabel, error }) {
  const badge = BT_STATUS_BADGE[status] || "Warning";
  const running = status === BT_RUN_STATUS.RUNNING || status === BT_RUN_STATUS.QUEUED;
  const errorTip =
    status === BT_RUN_STATUS.FAILED ? formatErrorTooltip(error) : null;

  const badgeEl = <AppBadge status={badge} />;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="inline-flex items-center gap-1.5">
        {errorTip ? (
          <BtValueTooltip formula={errorTip.code} text={errorTip.detail}>
            <span className="cursor-help">{badgeEl}</span>
          </BtValueTooltip>
        ) : (
          badgeEl
        )}
      </span>
      {running ? (
        <span className="inline-flex items-center gap-1.5">
          <Progress value={pct ?? 0} className={cx(BAR)} />
          <span className="text-[10px] tabular-nums whitespace-nowrap text-[#8c8c8c]">
            {progressLabel || `${Math.round(pct ?? 0)}%`}
          </span>
        </span>
      ) : null}
    </div>
  );
});

/** Failure block shown inside an expanded branch. */
export const BtFailureBlock = memo(function BtFailureBlock({ error }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2.5 text-[11px] leading-snug text-red-100/90">
      <div className="font-medium text-red-300">
        ✕ Run failed · <span className="font-mono">{error.code}</span>
      </div>
      <div className="mt-1">{error.message}</div>
      {error.hint ? <div className="mt-1 text-[#d9d9d9]">What to do: {error.hint}</div> : null}
    </div>
  );
});
