import React, { memo, useEffect, useMemo, useState } from "react";
import { cx, ui } from "@/constants/ui";
import { AppButton } from "@/components/common/AppButton";
import { AppDialog } from "@/components/common/AppDialog";
import { AppSelect } from "@/components/common/AppSelect";
import {
  BT_SYNTHETIC_N_DEFAULT,
  BT_SYNTHETIC_N_PRESETS,
  BT_VOLATILITY_LEVELS,
} from "@/constants/backtesting";
import { BT_FORM_CONTROL } from "./formControl";

export const RunSyntheticModal = memo(function RunSyntheticModal({
  open,
  parentRun,
  snapshotRun = null,
  readOnly = false,
  onClose,
  onSubmit,
}) {
  const [volatility, setVolatility] = useState("same_as_source");
  const [nRuns, setNRuns] = useState(String(BT_SYNTHETIC_N_DEFAULT));

  const nOptions = useMemo(
    () => BT_SYNTHETIC_N_PRESETS.map((n) => ({ value: String(n), label: String(n) })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    if (readOnly && snapshotRun?.config) {
      const cfg = snapshotRun.config;
      setVolatility(cfg.volatility || "same_as_source");
      setNRuns(String(cfg.nRuns ?? BT_SYNTHETIC_N_DEFAULT));
      return;
    }
    setVolatility("same_as_source");
    setNRuns(String(BT_SYNTHETIC_N_DEFAULT));
  }, [open, parentRun, readOnly, snapshotRun]);

  const canRun = !readOnly && Number(nRuns) > 0;

  const handleSubmit = () => {
    if (!canRun) return;
    onSubmit?.({
      source: "inherited",
      customPeriod: null,
      method: "metric_generator",
      volatility,
      nRuns: Number(nRuns),
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
      className="max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid gap-3 sm:grid-cols-2">
          <AppSelect
            label="Volatility level"
            value={volatility}
            onValueChange={setVolatility}
            options={BT_VOLATILITY_LEVELS}
            disabled={readOnly}
            triggerClassName={BT_FORM_CONTROL}
          />
          <AppSelect
            label="Number of synthetic runs (N)"
            value={nRuns}
            onValueChange={setNRuns}
            options={nOptions}
            disabled={readOnly}
            triggerClassName={BT_FORM_CONTROL}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className={cx("text-[10px]", canRun || readOnly ? ui.textSubtle : "text-amber-300")}>
          {readOnly
            ? null
            : canRun
              ? `Generates ${nRuns} series and backtests each of them.`
              : "Select a positive N."}
        </div>
        <div className="flex gap-2">
          {readOnly ? (
            <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </AppButton>
          ) : (
            <>
              <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </AppButton>
              <AppButton
                type="button"
                variant="default"
                size="sm"
                disabled={!canRun}
                onClick={handleSubmit}
              >
                ▶ Run Synthetic
              </AppButton>
            </>
          )}
        </div>
      </div>
    </AppDialog>
  );
});
