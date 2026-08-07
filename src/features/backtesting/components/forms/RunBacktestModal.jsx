import React, { memo } from "react";
import { AppDialog } from "@/components/common/AppDialog";
import { RunBacktestForm } from "./RunBacktestForm";

/** Thin dialog wrapper over {@link RunBacktestForm} — kept for reuse; Stage 5 primary UX is inline. */
export const RunBacktestModal = memo(function RunBacktestModal({
  open,
  epoch,
  strategyName,
  miniOptions = [],
  onClose,
  onSubmit,
}) {
  return (
    <AppDialog
      open={!!open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Run Backtest"
      description={`${strategyName || "Strategy"} · ${epoch?.label || "epoch"}`}
      className="max-w-[880px] max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <RunBacktestForm
          active={!!open}
          epoch={epoch}
          strategyName={strategyName}
          miniOptions={miniOptions}
          variant="modal"
          showCancel
          onCancel={onClose}
          onSubmit={(payload) => {
            onSubmit?.(payload);
            onClose?.();
          }}
        />
      </div>
    </AppDialog>
  );
});
