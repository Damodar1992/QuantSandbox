import React, { memo } from "react";
import { Progress } from "@/components/ui/progress";
import { cx } from "@/constants/ui";

function clampPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatEta(value) {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const minutes = raw.match(/^(\d+(?:[.,]\d+)?)\s*m(?:in)?$/i);
  return minutes ? `${minutes[1].replace(",", ".")} m` : raw;
}

/**
 * Compact ETA label + percent progress bar for in-progress jobs.
 */
export const EtaProgress = memo(function EtaProgress({
  eta,
  progress,
  className,
}) {
  const pct = clampPct(progress);
  const etaLabel = formatEta(eta);
  if (!etaLabel && pct == null) return null;

  return (
    <span className={cx("inline-flex items-center gap-1.5 min-w-0", className)}>
      {pct != null ? (
        <>
          <Progress
            value={pct}
            aria-label={`Progress ${pct}%`}
            className={cx(
              "h-1.5 w-14 shrink-0 rounded-full bg-[#0f0f0f] border border-[rgba(60,40,80,0.35)]",
              /* crmAccent.progress → bg-violet-600 on indicator (static for Tailwind JIT) */
              "[&_[data-slot=progress-indicator]]:bg-violet-600",
              "[&_[data-slot=progress-indicator]]:transition-[transform] [&_[data-slot=progress-indicator]]:duration-300 [&_[data-slot=progress-indicator]]:ease-out",
            )}
          />
          <span className="text-[10px] text-[#8c8c8c] tabular-nums whitespace-nowrap">{pct}%</span>
        </>
      ) : null}
      {etaLabel ? (
        <span className="text-[10px] text-[#8c8c8c] tabular-nums whitespace-nowrap">(~{etaLabel})</span>
      ) : null}
    </span>
  );
});
