/**
 * Storage usage bar.
 *
 * Modes:
 *   compact  – single-line chip for use in the header
 *   full     – wider bar with labels, used inside StoragePage
 *
 * Color thresholds: <70% → green, 70-89% → amber, ≥90% → red.
 * Over 100%: bar stays full red, label shows over-limit.
 */

import React from "react";
import { cn } from "@/lib/utils";

function usageColor(pct) {
  if (pct >= 90) return "red";
  if (pct >= 70) return "amber";
  return "green";
}

const TRACK_COLORS = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const TEXT_COLORS = {
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
};

function fmt(gb) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

// ─── Compact variant (header) ────────────────────────────────────────────────

export function StorageUsageBarCompact({ usedGb, quotaGb, pct, onClick, isActive, className }) {
  const color = usageColor(pct);
  const clampedPct = Math.min(pct, 100);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors",
        "border-border bg-background/60 hover:bg-accent/40",
        isActive && "ring-1 ring-violet-500/50",
        className,
      )}
      title={`Storage: ${fmt(usedGb)} / ${fmt(quotaGb)} (${pct.toFixed(1)}%)`}
    >
      <span className="font-medium text-foreground">Storage</span>

      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", TRACK_COLORS[color])}
          style={{ width: `${clampedPct}%` }}
        />
      </div>

      <span className={cn("font-mono tabular-nums", TEXT_COLORS[color])}>
        {pct.toFixed(0)}%
      </span>
    </button>
  );
}

// ─── Full variant (page) ─────────────────────────────────────────────────────

export function StorageUsageBarFull({ usedGb, quotaGb, pct, className }) {
  const color = usageColor(pct);
  const clampedPct = Math.min(pct, 100);
  const overLimit = pct > 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">Disk usage</span>
        <span className={cn("text-[13px] font-semibold tabular-nums", TEXT_COLORS[color])}>
          {fmt(usedGb)}{" "}
          <span className="text-[11px] font-normal text-muted-foreground">
            / {fmt(quotaGb)}
            {overLimit && (
              <span className="ml-1 text-red-400 font-semibold">OVER LIMIT</span>
            )}
          </span>
        </span>
      </div>

      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", TRACK_COLORS[color])}
          style={{ width: `${clampedPct}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span className={cn("font-semibold", TEXT_COLORS[color])}>
          {pct.toFixed(1)}% used
        </span>
        <span>Quota: {fmt(quotaGb)}</span>
      </div>
    </div>
  );
}
