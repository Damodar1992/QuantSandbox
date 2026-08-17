import React, { memo } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import {
  BT_SYNTHETIC_N_DEFAULT,
  BT_SYNTHETIC_VOLATILITY_SPLIT,
} from "@/constants/backtesting";
import { fmtInt } from "../../utils/format";

/**
 * Bar = proportional share. Legend = equal columns so L3/L4 stay readable
 * (aligning long labels to 10%/5% bar slices breaks on real modal widths).
 */
function SyntheticRunsFixedPanel() {
  return (
    <div className={cx(ui.radius, "border border-[rgba(60,40,80,0.35)] bg-[#120b20] p-4")}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#d9d9d9]">
        Synthetic runs – {fmtInt(BT_SYNTHETIC_N_DEFAULT)} · Fixed
      </div>
      <p className={cx("mt-1 text-[10px] leading-relaxed", ui.textSubtle)}>
        Every synthetic run always generates {fmtInt(BT_SYNTHETIC_N_DEFAULT)} datasets, split across
        volatility levels by a fixed share
      </p>

      <div
        className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[#1a1228]"
        role="img"
        aria-label="Fixed volatility split: L0 40%, L1 25%, L2 20%, L3 10%, L4 5%"
      >
        {BT_SYNTHETIC_VOLATILITY_SPLIT.map((level) => (
          <div
            key={level.key}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${level.pct}%`, backgroundColor: level.color }}
            title={`${level.label} – ${fmtInt(level.runs)} runs · ${level.pct} %`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {BT_SYNTHETIC_VOLATILITY_SPLIT.map((level) => (
          <div
            key={level.key}
            className="min-w-0 overflow-hidden rounded-md border border-[rgba(60,40,80,0.28)] bg-[#161022]/80"
            style={{ boxShadow: `inset 0 2px 0 0 ${level.color}` }}
          >
            <div className="px-2 py-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: level.color }}
                  aria-hidden
                />
                <span className="truncate text-[10px] font-medium text-[#faf7fd]">{level.label}</span>
              </div>
              <div className="mt-1.5 font-mono text-[10px] leading-tight tabular-nums text-[#b8aecc]">
                {fmtInt(level.runs)} runs · {level.pct} %
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const RunSyntheticModal = memo(function RunSyntheticModal({
  open,
  readOnly = false,
  onClose,
  onSubmit,
}) {
  const handleSubmit = () => {
    onSubmit?.({
      source: "inherited",
      customPeriod: null,
      method: "metric_generator",
      nRuns: BT_SYNTHETIC_N_DEFAULT,
      volatilitySplit: BT_SYNTHETIC_VOLATILITY_SPLIT,
    });
    onClose?.();
  };

  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Run Synthetic backtest"
      className="max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <SyntheticRunsFixedPanel />

      <div className="flex items-center justify-end gap-2 pt-4">
        {readOnly ? (
          <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </AppButton>
        ) : (
          <>
            <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </AppButton>
            <AppButton type="button" variant="default" size="sm" onClick={handleSubmit}>
              ▶ Run Synthetic
            </AppButton>
          </>
        )}
      </div>
    </AppDialog>
  );
});
