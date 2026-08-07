import React, { memo, useEffect, useState } from "react";
import { cx } from "@/constants/ui";
import { AppDialog } from "@/components/common/AppDialog";
import { AppButton } from "@/components/common/AppButton";
import { BT_INFO_DIALOG_CLASS } from "./btInfoDialogClass";
import { SyntheticPerformanceTab } from "./SyntheticPerformanceTab";
import { SyntheticTemporalTab } from "./SyntheticTemporalTab";
import { SyntheticFeesTab } from "./SyntheticFeesTab";

const INFO_TABS = [
  { value: "performance", label: "Performance" },
  { value: "temporal", label: "Temporal metrics" },
  { value: "fees", label: "Fees" },
];

function PillTab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-medium transition-colors",
        active
          ? "border-violet-500/40 bg-violet-500/15 text-violet-200"
          : "border-[rgba(60,40,80,0.35)] text-[#8c8c8c] hover:text-[#d9d9d9]",
      )}
    >
      {children}
    </button>
  );
}

/** Synthetic backtest info — Performance / Temporal metrics / Fees. */
export const SyntheticInfoModal = memo(function SyntheticInfoModal({
  open,
  run,
  parentRun,
  onClose,
}) {
  const [tab, setTab] = useState("performance");

  useEffect(() => {
    if (open) setTab("performance");
  }, [open]);

  return (
    <AppDialog
      open={!!open && Boolean(run)}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
      title="Synthetic backtest info"
      className={BT_INFO_DIALOG_CLASS}
    >
      <div className="mb-4 flex shrink-0 flex-wrap justify-start gap-2 border-b border-[rgba(60,40,80,0.35)] pb-3">
        {INFO_TABS.map((item) => (
          <PillTab key={item.value} active={tab === item.value} onClick={() => setTab(item.value)}>
            {item.label}
          </PillTab>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {run && tab === "performance" ? (
          <SyntheticPerformanceTab run={run} parentRun={parentRun} />
        ) : null}
        {run && tab === "temporal" ? (
          <SyntheticTemporalTab run={run} parentRun={parentRun} />
        ) : null}
        {run && tab === "fees" ? <SyntheticFeesTab run={run} parentRun={parentRun} /> : null}
      </div>

      <div className="flex shrink-0 justify-end pt-2">
        <AppButton type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </AppButton>
      </div>
    </AppDialog>
  );
});
