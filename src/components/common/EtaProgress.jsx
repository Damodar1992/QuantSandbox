import React, { memo } from "react";
import { cx } from "@/constants/ui";
import { crmAccent } from "@/constants/crmAccent";

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
          <span
            className="h-1.5 w-14 shrink-0 rounded-full bg-[#0f0f0f] border border-[rgba(60,40,80,0.35)] overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress ${pct}%`}
          >
            <span
              className={cx("block h-full rounded-full transition-[width] duration-300 ease-out", crmAccent.progress)}
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="text-[10px] text-[#8c8c8c] tabular-nums whitespace-nowrap">{pct}%</span>
        </>
      ) : null}
      {etaLabel ? (
        <span className="text-[10px] text-[#8c8c8c] tabular-nums whitespace-nowrap">(~{etaLabel})</span>
      ) : null}
    </span>
  );
});
